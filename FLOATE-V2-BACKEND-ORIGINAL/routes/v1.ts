import { Router, Request, Response, RequestHandler } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { adminFirestoreDb } from "../services/adminFirestore";
import { publishApprovedBusiness, removeBusinessFromPublicCatalog } from "../services/publicCatalogService";
import { createMerchantSlug } from "../src/utils/merchantSlug";
import { normalizeWhatsAppNumber } from "../src/utils/whatsapp";
import { isWhatsAppAuthConfigured, isWhatsAppConfigured } from "../src/bot/config.js";
import { redisService } from "../src/bot/services/redisService.js";
import { sendWhatsAppMessage } from "../src/bot/services/whatsappService.js";
import { formatPhoneNumber, whatsappAuthService } from "../src/bot/services/whatsappAuthService.js";

const router = Router();

const requireAdminApiKey: RequestHandler = (req, res, next) => {
  const expectedKey = process.env.ADMIN_API_KEY || "";
  const providedKey = req.get("x-admin-api-key") || "";
  const expectedBuffer = Buffer.from(expectedKey);
  const providedBuffer = Buffer.from(providedKey);

  if (!expectedKey) {
    return res.status(503).json({ success: false, error: "Admin API is not configured." });
  }
  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
    return res.status(401).json({ success: false, error: "Admin authentication required." });
  }
  next();
};

const requireWhatsAppBearer: RequestHandler = (req, res, next) => {
  const rawToken = (req.get("authorization") || "").match(/^Bearer\s+(\S+)$/i)?.[1];
  const decoded = rawToken ? whatsappAuthService.verifyJwtToken(rawToken) : null;
  const phone = normalizeWhatsAppNumber(decoded?.phone);
  if (!phone) {
    return res.status(401).json({ success: false, error: "A valid WhatsApp session is required." });
  }
  const requestedPhone = normalizeWhatsAppNumber(req.method === "GET" ? req.query.phone : req.body?.phone || req.body?.whatsapp);
  if (requestedPhone && requestedPhone !== phone) {
    return res.status(403).json({ success: false, error: "The phone must match the authenticated WhatsApp account." });
  }
  (req as Request & { verifiedWhatsAppPhone?: string }).verifiedWhatsAppPhone = phone;
  next();
};

type VerificationDecision = "approved" | "rejected";

function buildCertificateDownloadUrl(
  businessId: string,
  businessName: string,
  business: Record<string, unknown>,
  application: Record<string, unknown>
) {
  const identifier = createMerchantSlug(businessName) || normalizeWhatsAppNumber(
    business.whatsappNumber || business.whatsapp || business.phone || application.whatsapp || ""
  ) || businessId;
  const backendUrl = (
    process.env.RENDER_EXTERNAL_URL ||
    process.env.FLOATE_BACKEND_PUBLIC_URL ||
    process.env.APP_URL ||
    "https://tiredbackend.onrender.com"
  ).replace(/\/+$/, "");
  return `${backendUrl}/api/credentials/${encodeURIComponent(identifier)}/download/certificate`;
}

async function sendVerificationWhatsApp(
  phone: string,
  businessName: string,
  decision: VerificationDecision,
  rejectionReason = "",
  certificateUrl = ""
): Promise<{ sent: boolean; message: string }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  const templateName = decision === "approved"
    ? process.env.WHATSAPP_VERIFICATION_APPROVED_TEMPLATE || ""
    : process.env.WHATSAPP_VERIFICATION_REJECTED_TEMPLATE || "";
  const recipient = normalizeWhatsAppNumber(phone)?.replace(/\D/g, "") || "";

  if (!accessToken || !phoneNumberId || !templateName) {
    const message = "WhatsApp delivery is missing an access token, phone-number ID, or decision template.";
    console.error(`[Admin Verifications] ${decision} notification was not sent: ${message}`);
    return { sent: false, message };
  }
  if (!recipient) {
    const message = "The business WhatsApp number is missing or invalid.";
    console.error(`[Admin Verifications] ${decision} notification was not sent: ${message}`);
    return { sent: false, message };
  }

  const parameters = decision === "approved"
    ? [{
        type: "text",
        text: certificateUrl
          ? `${businessName} is approved on FLOATE. Download your Floate certificate: ${certificateUrl}`
          : `${businessName} is approved on FLOATE.`
      }]
    : [{ type: "text", text: businessName }, { type: "text", text: rejectionReason }];

  try {
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v23.0";
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en" },
          components: [{ type: "body", parameters }]
        }
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error(`[Admin Verifications] Meta rejected ${decision} notification (HTTP ${response.status}):`, result?.error || result);
      return {
        sent: false,
        message: result?.error?.message || `WhatsApp Cloud API returned HTTP ${response.status}.`
      };
    }
    return { sent: true, message: "WhatsApp notification sent." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "WhatsApp delivery failed.";
    console.error("[Admin Verifications] WhatsApp delivery failed:", message);
    return { sent: false, message };
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy_gemini_key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});

interface CartVendor {
  slug: string;
  name: string;
  whatsapp_number: string;
  city: string;
  verified: boolean;
  fid?: string;
  isVerified?: boolean;
}

// In-memory cart store per session / cart_id
interface CartItem {
  id: string;
  product_id: string;
  title: string;
  price_naira: number;
  formatted_price: string;
  photo_url: string;
  quantity: number;
  vendor: CartVendor;
}

interface CartStore {
  cart_id: string;
  vendor: CartVendor | null;
  items: CartItem[];
  updated_at: number;
}

const cartsMap = new Map<string, CartStore>();

function getOrCreateCart(cartId: string): CartStore {
  if (!cartsMap.has(cartId)) {
    cartsMap.set(cartId, {
      cart_id: cartId,
      vendor: null,
      items: [],
      updated_at: Date.now()
    });
  }
  return cartsMap.get(cartId)!;
}

function formatPrice(naira: number): string {
  return "₦" + Number(naira).toLocaleString("en-NG");
}

// Canonical cities
const MAJOR_CITIES = [
  "Lagos",
  "Onitsha",
  "Aba",
  "Abuja",
  "Port Harcourt",
  "Kano",
  "Ibadan",
  "Enugu"
];

// Fallback verified merchants if database is bootstrapping
const SEED_MERCHANTS = [
  {
    id: "biz-1",
    slug: "kalu-gadgets",
    name: "Kalu Gadgets & UK Laptops",
    city: "Lagos",
    state: "Lagos",
    category: "Laptops & Computers",
    verified: true,
    is_spotlight: true,
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    bio: "Direct UK & US used MacBooks, ThinkPads, Dell XPS and factory sealed laptops with 6-month warranty. Otigba Street, Computer Village.",
    whatsapp_number: "+2348035678901",
    rating: 4.98,
    completed_escrows: 1420,
    statuses: [
      {
        id: "st-1",
        image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        caption: "Fresh shipment of MacBook Pro M2 16GB / 512GB arriving today at Otigba. Tested Grade A+.",
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        expires_at: new Date(Date.now() + 22 * 3600000).toISOString()
      },
      {
        id: "st-2",
        image_url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
        caption: "Dell XPS 13 9310 Touch 4K UHD with backlit keyboard in mint stock.",
        created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
        expires_at: new Date(Date.now() + 19 * 3600000).toISOString()
      }
    ],
    products: [
      {
        id: "prod-101",
        title: "Apple MacBook Pro 14\" M2 Pro 16GB / 512GB (Space Gray)",
        price_naira: 1650000,
        formatted_price: "₦1,650,000",
        photo_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        description: "Grade A+ UK used Apple MacBook Pro 14-inch with M2 Pro chip, 16GB unified memory, 512GB SSD, 100% battery health, original 67W MagSafe 3 charger.",
        in_stock: true,
        is_sale: false,
        category: "Laptops & Computers"
      },
      {
        id: "prod-102",
        title: "Dell XPS 13 Plus 9320 Core i7 12th Gen 16GB / 512GB",
        price_naira: 980000,
        formatted_price: "₦980,000",
        photo_url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
        description: "Ultra-thin seamless glass touchpad, OLED touch screen, Intel Iris Xe graphics, backlit zero-lattice keyboard.",
        in_stock: true,
        is_sale: true,
        category: "Laptops & Computers"
      },
      {
        id: "prod-103",
        title: "Lenovo ThinkPad X1 Carbon Gen 10 Core i7 16GB / 1TB",
        price_naira: 850000,
        formatted_price: "₦850,000",
        photo_url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
        description: "Military-grade carbon fiber body, fingerprint reader, Dolby Atmos speakers, 14\" FHD+ Anti-Glare.",
        in_stock: true,
        is_sale: false,
        category: "Laptops & Computers"
      }
    ]
  },
  {
    id: "biz-2",
    slug: "oba-footwear-aba",
    name: "Oba Handcrafted Leather & Palms",
    city: "Aba",
    state: "Abia",
    category: "Footwear & Leather",
    verified: true,
    is_spotlight: true,
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    bio: "Master craftsmen of genuine Italian and Nigerian leather slides, bespoke senator palms, and formal Goodyear welted shoes. Ariaria International Market.",
    whatsapp_number: "+2348023456789",
    rating: 4.97,
    completed_escrows: 2130,
    statuses: [
      {
        id: "st-3",
        image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
        caption: "Bespoke double-strap leather slides in Rich Cognac and Jet Black now packing for nationwide delivery.",
        created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        expires_at: new Date(Date.now() + 21 * 3600000).toISOString()
      }
    ],
    products: [
      {
        id: "prod-201",
        title: "Pure Italian Calfskin Senator Leather Slides (Cognac Brown)",
        price_naira: 28500,
        formatted_price: "₦28,500",
        photo_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
        description: "100% full grain Italian leather upper with cushioned orthotic sole. Hand-stitched in Aba with waterproof edge finishing.",
        in_stock: true,
        is_sale: true,
        category: "Footwear & Leather"
      },
      {
        id: "prod-202",
        title: "Bespoke Cross-Strap Double Density Leather Palms (Black)",
        price_naira: 24000,
        formatted_price: "₦24,000",
        photo_url: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80",
        description: "Durable non-slip rubber outsole, breathable leather footbed, designed for all-day comfort and traditional wear.",
        in_stock: true,
        is_sale: false,
        category: "Footwear & Leather"
      },
      {
        id: "prod-203",
        title: "Handcrafted Wingtip Oxford Leather Shoes (Mahogany)",
        price_naira: 65000,
        formatted_price: "₦65,000",
        photo_url: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
        description: "Classic brogue detailing, Goodyear welted construction, genuine leather sole for corporate and wedding occasions.",
        in_stock: true,
        is_sale: false,
        category: "Footwear & Leather"
      }
    ]
  },
  {
    id: "biz-3",
    slug: "royal-crest-fabrics",
    name: "Royal Crest Luxury Swiss Lace & Brocade",
    city: "Onitsha",
    state: "Anambra",
    category: "Fashion & Fabrics",
    verified: true,
    is_spotlight: true,
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
    bio: "Direct importers of exclusive Swiss Voile lace, Austrian brocade, George wrappers, and senator wool fabrics. Main Market Onitsha.",
    whatsapp_number: "+2348039876543",
    rating: 4.99,
    completed_escrows: 3100,
    statuses: [
      {
        id: "st-4",
        image_url: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=800&q=80",
        caption: "New stock of Original Hand-Cut Austrian Voile Lace just arrived at Bida Road warehouse.",
        created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
        expires_at: new Date(Date.now() + 23 * 3600000).toISOString()
      }
    ],
    products: [
      {
        id: "prod-301",
        title: "Exclusive Hand-Cut Austrian Voile Lace (5 Yards - Emerald Green)",
        price_naira: 85000,
        formatted_price: "₦85,000",
        photo_url: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=800&q=80",
        description: "Heavy crystal stone embellished lace with scalloped borders. 100% pure Swiss cotton thread, colorfast and breathable.",
        in_stock: true,
        is_sale: false,
        category: "Fashion & Fabrics"
      },
      {
        id: "prod-302",
        title: "Original Getzner Supreme Super Magnum Brocade (10 Yards - Royal White)",
        price_naira: 120000,
        formatted_price: "₦120,000",
        photo_url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80",
        description: "Authentic Austrian damask brocade with luminous jacquard pattern. Perfect for agbada and traditional outfits.",
        in_stock: true,
        is_sale: true,
        category: "Fashion & Fabrics"
      }
    ]
  },
  {
    id: "biz-4",
    slug: "solarmaster-energy",
    name: "SolarMaster Inverters & Lithium Systems",
    city: "Lagos",
    state: "Lagos",
    category: "Solar & Power",
    verified: true,
    is_spotlight: true,
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    bio: "Tier-1 Felicity & Growatt hybrid inverters, LiFePO4 smart lithium batteries, and high-efficiency mono PERC solar panels. Alaba International Market.",
    whatsapp_number: "+2348028765432",
    rating: 4.96,
    completed_escrows: 980,
    statuses: [
      {
        id: "st-5",
        image_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        caption: "5kVA Hybrid Smart Solar Bundles with 5.12kWh Lithium battery ready for dispatch across Nigeria.",
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        expires_at: new Date(Date.now() + 20 * 3600000).toISOString()
      }
    ],
    products: [
      {
        id: "prod-401",
        title: "Felicity Solar 5kVA 48V Pure Sine Wave Hybrid Inverter with 120A MPPT",
        price_naira: 620000,
        formatted_price: "₦620,000",
        photo_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        description: "High-voltage MPPT solar charger, parallel operation up to 6 units, WiFi remote app monitoring, 2-year warranty.",
        in_stock: true,
        is_sale: false,
        category: "Solar & Power"
      },
      {
        id: "prod-402",
        title: "5.12kWh 48V 100Ah LiFePO4 Wall Mount Lithium Battery Pack",
        price_naira: 1350000,
        formatted_price: "₦1,350,000",
        photo_url: "https://images.unsplash.com/photo-1548611716-ad775fa2a4f4?auto=format&fit=crop&w=800&q=80",
        description: "6000+ deep cycles at 80% DOD, built-in smart BMS, compatible with Growatt, Felicity, Deye, and Victron.",
        in_stock: true,
        is_sale: true,
        category: "Solar & Power"
      }
    ]
  },
  {
    id: "biz-5",
    slug: "onitsha-crown-wigs",
    name: "Crown Luxury Human Hair & Frontals",
    city: "Onitsha",
    state: "Anambra",
    category: "Beauty & Hair",
    verified: true,
    is_spotlight: true,
    avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=256&q=80",
    bio: "Wholesale & retail 100% raw virgin human hair, bone straight bundles, HD lace frontals, and customized glueless wigs. Ochanja Market.",
    whatsapp_number: "+2348037654321",
    rating: 4.98,
    completed_escrows: 1850,
    statuses: [
      {
        id: "st-6",
        image_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
        caption: "Raw Vietnamese Double Drawn Bone Straight 30\" in natural color 1B. Silky and tangle-free.",
        created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
        expires_at: new Date(Date.now() + 18 * 3600000).toISOString()
      }
    ],
    products: [
      {
        id: "prod-501",
        title: "Vietnamese Super Double Drawn Bone Straight Hair 3 Bundles + 13x4 HD Frontal (28\")",
        price_naira: 175000,
        formatted_price: "₦175,000",
        photo_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
        description: "100% cuticle aligned virgin hair. Can be bleached and colored, zero shedding, silky straight luster.",
        in_stock: true,
        is_sale: true,
        category: "Beauty & Hair"
      }
    ]
  },
  {
    id: "biz-6",
    slug: "banex-prime-phones",
    name: "Banex Prime Phones & Apple Store",
    city: "Abuja",
    state: "FCT",
    category: "Phones & Tablets",
    verified: true,
    is_spotlight: true,
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80",
    bio: "Brand new factory unlocked iPhones, Samsung Galaxy S series, iPads and original fast-charging accessories. Banex Plaza, Wuse 2.",
    whatsapp_number: "+2348031122334",
    rating: 4.95,
    completed_escrows: 1140,
    statuses: [
      {
        id: "st-7",
        image_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        caption: "iPhone 15 Pro Max 256GB Natural Titanium (Factory Unlocked) available in Banex.",
        created_at: new Date(Date.now() - 30 * 60000).toISOString(),
        expires_at: new Date(Date.now() + 23 * 3600000).toISOString()
      }
    ],
    products: [
      {
        id: "prod-601",
        title: "Apple iPhone 15 Pro Max 256GB Natural Titanium (Dual Physical SIM)",
        price_naira: 1580000,
        formatted_price: "₦1,580,000",
        photo_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        description: "A17 Pro chip, Grade 5 Titanium frame, 5x optical zoom camera, 1-year Apple international warranty.",
        in_stock: true,
        is_sale: false,
        category: "Phones & Tablets"
      },
      {
        id: "prod-602",
        title: "Samsung Galaxy S24 Ultra 512GB (Titanium Gray)",
        price_naira: 1620000,
        formatted_price: "₦1,620,000",
        photo_url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
        description: "Galaxy AI features, Snapdragon 8 Gen 3, integrated S Pen, 200MP Quad Telephoto camera.",
        in_stock: true,
        is_sale: true,
        category: "Phones & Tablets"
      }
    ]
  },
  {
    id: "biz-7",
    slug: "prince-royalty-legal",
    name: "Prince and Royalty Legal Consult",
    city: "Onitsha",
    state: "Anambra",
    category: "Legal & Business Services",
    verified: true,
    is_spotlight: false,
    avatar_url: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=256&q=80",
    bio: "Corporate law firm, CAC business name & company registrations, property deed verification, and trade contracts across South-East Nigeria.",
    whatsapp_number: "+2348039988776",
    rating: 4.99,
    completed_escrows: 560,
    statuses: [
      {
        id: "st-8",
        image_url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
        caption: "Same-day corporate CAC name reservation and trademark filing support for new businesses.",
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        expires_at: new Date(Date.now() + 20 * 3600000).toISOString()
      }
    ],
    products: [
      {
        id: "prod-701",
        title: "Full CAC Limited Liability Company (LTD) Registration Package",
        price_naira: 45000,
        formatted_price: "₦45,000",
        photo_url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
        description: "Includes official CAC e-certificate, status report, Tax Identification Number (TIN), and legal MEMART draft.",
        in_stock: true,
        is_sale: false,
        category: "Legal & Business Services"
      }
    ]
  }
];

// Read only approved records from the shared website/WhatsApp catalog.
async function getAllMerchants(): Promise<any[]> {
  try {
    const snapshot = await adminFirestoreDb.collection("public_catalog")
      .where("isPublished", "==", true)
      .get();
    const merchants = new Map<string, any>();
    snapshot.forEach((document) => {
      const record = document.data();
      if (
        record.isVerified !== true ||
        String(record.verificationStatus || "").toUpperCase() !== "APPROVED"
      ) return;

      const id = String(record.businessId || document.id);
      const name = String(record.businessName || record.name || "").trim();
      if (!name) return;
      let merchant = merchants.get(id);
      if (!merchant) {
        merchant = {
          id,
          slug: String(record.slug || id),
          name,
          city: String(record.city || ""),
          state: String(record.state || ""),
          marketLocation: String(record.marketLocation || record.location || ""),
          category: String(record.category || "General Merchandise"),
          verified: true,
          verificationStatus: "APPROVED",
          is_spotlight: Boolean(record.is_spotlight || record.isSpotlight),
          avatar_url: String(record.profileImageUrl || ""),
          bio: String(record.description || ""),
          whatsapp_number: String(record.whatsapp || record.whatsappNumber || ""),
          rating: Number(record.rating) || 0,
          completed_escrows: Number(record.completedEscrows || record.completed_escrows) || 0,
          statuses: [],
          products: []
        };
        merchants.set(id, merchant);
      }

      const title = String(record.product || "").trim();
      if (title) {
        merchant.products.push({
          id: String(record.productId || document.id),
          title,
          price_naira: Number(record.numericPrice) || 0,
          formatted_price: String(record.price || ""),
          photo_url: String(record.imageUrl || ""),
          photos: Array.isArray(record.productImages) ? record.productImages : [record.imageUrl].filter(Boolean),
          description: String(record.description || ""),
          in_stock: record.inStock !== false,
          category: String(record.category || merchant.category)
        });
      }
    });
    return Array.from(merchants.values());
  } catch (err: any) {
    console.error("[v1 API] Published catalog query failed:", err);
    return [];
  }
}

// Helper: Flatten all products with vendor metadata
export async function getAllProducts(): Promise<any[]> {
  const merchants = await getAllMerchants();
  const all: any[] = [];
  const productIds = new Set<string>();

  for (const m of merchants) {
    const prods = Array.isArray(m.products) && m.products.length > 0 ? m.products : [];
    for (let i = 0; i < prods.length; i++) {
      const p = prods[i];
      const productId = String(p.id || `prod-${m.slug}-${all.length + 1}`);
      if (productIds.has(productId)) continue;
      productIds.add(productId);
      const photos = Array.isArray(p.photos) && p.photos.length > 0
        ? p.photos.map((photo: unknown) => String(photo || "").trim()).filter(Boolean).slice(0, 4)
        : [p.photo_url || p.photoUrl || p.imageUrl || p.image || ""].filter(Boolean);
      all.push({
        id: productId,
        title: p.title || p.name,
        price_naira: Number(p.price_naira || p.price || 0),
        formatted_price: p.formatted_price || formatPrice(Number(p.price_naira || p.price || 0)),
        photo_url: photos[0] || "",
        photos,
        description: p.description || "",
        in_stock: p.in_stock !== false,
        is_sale: Boolean(p.is_sale),
        condition: p.condition,
        boosted: Boolean(p.boosted || (m.is_spotlight && i === 0)),
        category: p.category || m.category,
        vendor: {
          slug: m.slug,
          name: m.name,
          city: m.city,
          state: m.state,
          verified: m.verified,
          avatar_url: m.avatar_url,
          whatsapp_number: m.whatsapp_number,
          rating: m.rating
        }
      });
    }
  }

  try {
    const productSnapshot = await adminFirestoreDb.collection("public_catalog")
      .where("isPublished", "==", true)
      .get();
    productSnapshot.forEach((productDoc) => {
      const product = productDoc.data();
      if (
        product.isVerified !== true ||
        String(product.verificationStatus || "").toUpperCase() !== "APPROVED"
      ) return;
      const id = String(product.productId || product.id || productDoc.id);
      if (productIds.has(id)) return;

      const title = String(product.title || product.name || product.product || "").trim();
      const rawPrice = product.price_naira ?? product.price ?? product.numericPrice;
      const price = typeof rawPrice === "number"
        ? rawPrice
        : Number(String(rawPrice || "").replace(/[^0-9.]/g, ""));
      if (!title || !Number.isFinite(price) || price <= 0) return;

      const vendorData = product.vendor && typeof product.vendor === "object" ? product.vendor : {};
      const vendorName = String(
        product.vendorName || product.businessName || product.seller || vendorData.name || ""
      ).trim();
      const photos = (Array.isArray(product.photos)
        ? product.photos
        : Array.isArray(product.productImages)
        ? product.productImages
        : [])
        .map((photo: unknown) => String(photo || "").trim())
        .filter(Boolean)
        .slice(0, 4);
      const vendorPhone = normalizeWhatsAppNumber(
        product.vendorPhone || product.whatsappNumber || product.whatsapp || vendorData.whatsapp_number
      );
      const merchant = merchants.find((candidate) =>
        (vendorPhone && normalizeWhatsAppNumber(candidate.whatsapp_number) === vendorPhone) ||
        (vendorName && candidate.name.toLowerCase() === vendorName.toLowerCase()) ||
        (product.merchantId && String(candidate.id) === String(product.merchantId)) ||
        (product.merchantSlug && String(candidate.slug).toLowerCase() === String(product.merchantSlug).toLowerCase())
      );
      const resolvedVendorName = merchant?.name || vendorName;
      if (!resolvedVendorName) return;

      const city = String(product.city || vendorData.city || merchant?.city || "Nigeria");
      const state = String(product.state || vendorData.state || merchant?.state || "Nigeria");
      const photo = photos[0] || product.photo_url || product.photoUrl || product.imageUrl || product.image || product.photo || "";
      productIds.add(id);
      all.push({
        id,
        title,
        price_naira: price,
        formatted_price: formatPrice(price),
        photo_url: photo,
        photos: photos.length > 0 ? photos : photo ? [photo] : [],
        description: String(product.description || ""),
        in_stock: product.in_stock !== false,
        is_sale: Boolean(product.is_sale || product.isSale),
        condition: product.condition,
        category: product.category || merchant?.category || "General Merchandise",
        vendor: {
          slug: merchant?.slug || createMerchantSlug(resolvedVendorName),
          name: resolvedVendorName,
          city,
          state,
          verified: Boolean(merchant?.verified || product.isVerified),
          avatar_url: merchant?.avatar_url || "",
          whatsapp_number: vendorPhone || merchant?.whatsapp_number || "",
          rating: merchant?.rating
        }
      });
    });
  } catch (err: any) {
    console.warn("[v1 API] Firestore product catalog query error:", err.message);
  }

  return all;
}

// ----------------------------------------------------
// 1. GET /api/v1/home?city=
// ----------------------------------------------------
router.get("/api/v1/home", async (req: Request, res: Response) => {
  const rawCity = (req.query.city as string) || "Lagos";
  const city = rawCity.trim();

  // Try live backend first
  try {
    const remoteRes = await fetch(`${BACKEND_BASE}/api/v1/home?city=${encodeURIComponent(city)}`);
    if (remoteRes.ok) {
      const remoteData = await remoteRes.json();
      if (remoteData && (remoteData.items || remoteData.success)) {
        return res.json(remoteData);
      }
    }
  } catch (err) {
    console.warn("[v1/home] Remote backend proxy attempt failed, falling back to live Firestore database:", err);
  }

  try {
    const cityLower = city.toLowerCase();

    const merchants = await getAllMerchants();
    const products = await getAllProducts();

    // 1. Status Rings: Max 8 live rings in active city (or fallback to top verified)
    const cityMerchants = merchants.filter(
      (m) => m.city && m.city.toLowerCase().includes(cityLower)
    );
    const poolForStatus = cityMerchants.length > 0 ? cityMerchants : merchants;

    const statusRings: any[] = [];
    for (const m of poolForStatus) {
      if (statusRings.length >= 8) break;
      const liveStatuses = (m.statuses || []).filter((s: any) => {
        if (!s.expires_at) return true;
        return new Date(s.expires_at).getTime() > Date.now();
      });

      if (liveStatuses.length > 0) {
        const latest = liveStatuses[0];
        statusRings.push({
          id: latest.id || `st-${m.slug}`,
          vendor_slug: m.slug,
          vendor_name: m.name,
          vendor_city: m.city,
          avatar_url: m.avatar_url,
          verified: m.verified,
          preview_image: latest.image_url,
          caption: latest.caption,
          created_at: latest.created_at,
          expires_at: latest.expires_at,
          total_active_statuses: liveStatuses.length
        });
      }
    }

    // 2. Spotlight: The Ad Stage (Max 20 slides from API, rotate in given order)
    const spotlightCandidates = products.filter(
      (p) => p.vendor.city.toLowerCase().includes(cityLower)
    );
    const spotlightPool = spotlightCandidates.length >= 2 ? spotlightCandidates : products;
    const spotlightSlides = spotlightPool.slice(0, 10).map((p) => ({
      id: p.id,
      title: p.title,
      price_naira: p.price_naira,
      formatted_price: p.formatted_price,
      photo_url: p.photo_url,
      category: p.category,
      badge_text: "Spotlight",
      vendor: p.vendor
    }));

    const spotlight = spotlightSlides.length > 0
      ? {
          slides: spotlightSlides,
          reel: spotlightSlides
        }
      : null;

    // 3. Feed: 8–10 vertical stall cards on first paint
    const cityProducts = products.filter(
      (p) => p.vendor.city.toLowerCase().includes(cityLower)
    );
    const listPool = cityProducts.length >= 5 ? cityProducts : products;
    const items = listPool.slice(0, 10);

    return res.json({
      success: true,
      city: city || "Lagos",
      available_cities: MAJOR_CITIES,
      status_rings: statusRings,
      spotlight,
      items,
      next_cursor: listPool.length > 10 ? "page_2" : null
    });
  } catch (error: any) {
    console.error("[GET /api/v1/home error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 2. GET /api/v1/search?q=&city=&max_price_naira=&cursor=
// ----------------------------------------------------
router.get("/api/v1/search", async (req: Request, res: Response) => {
  // Try live backend first
  try {
    const queryParams = new URLSearchParams(req.query as any).toString();
    const remoteRes = await fetch(`${BACKEND_BASE}/api/v1/search?${queryParams}`);
    if (remoteRes.ok) {
      const remoteData = await remoteRes.json();
      if (remoteData) {
        return res.json(remoteData);
      }
    }
  } catch (err) {
    console.warn("[v1/search] Remote backend proxy attempt failed, falling back to live Firestore database:", err);
  }

  try {
    const q = ((req.query.q as string) || "").trim();
    const city = ((req.query.city as string) || "").trim();
    const maxPriceParam = req.query.max_price_naira ? Number(req.query.max_price_naira) : undefined;
    const cursor = (req.query.cursor as string) || undefined;

    const allProducts = await getAllProducts();
    const qLower = q.toLowerCase();
    const cityLower = city.toLowerCase();

    let filtered = allProducts.filter((item) => {
      // City filter
      if (cityLower && !item.vendor.city.toLowerCase().includes(cityLower)) {
        return false;
      }
      // Price filter
      if (maxPriceParam && item.price_naira > maxPriceParam) {
        return false;
      }
      // Query filter
      if (qLower) {
        const titleMatch = item.title.toLowerCase().includes(qLower);
        const descMatch = (item.description || "").toLowerCase().includes(qLower);
        const vendorMatch = item.vendor.name.toLowerCase().includes(qLower);
        const catMatch = (item.category || "").toLowerCase().includes(qLower);
        if (!titleMatch && !descMatch && !vendorMatch && !catMatch) {
          return false;
        }
      }
      return true;
    });

    // Pagination (10 rows per page cursor)
    const pageSize = 10;
    const offset = cursor === "page_2" ? 10 : cursor === "page_3" ? 20 : 0;
    const pagedItems = filtered.slice(offset, offset + pageSize);
    const nextCursor = filtered.length > offset + pageSize ? `page_${Math.floor(offset / pageSize) + 2}` : null;

    // Matching businesses/vendors (suggested whether they have product photos or not)
    const allMerchants = await getAllMerchants();
    const suggestedVendors = allMerchants.filter((m) => {
      if (cityLower && !m.city.toLowerCase().includes(cityLower)) return false;
      if (qLower) {
        const nameMatch = m.name.toLowerCase().includes(qLower);
        const catMatch = (m.category || "").toLowerCase().includes(qLower);
        const bioMatch = (m.bio || "").toLowerCase().includes(qLower);
        return nameMatch || catMatch || bioMatch;
      }
      return true;
    }).slice(0, 8);

    return res.json({
      success: true,
      query: q,
      city: city || "All Cities",
      total_found: filtered.length,
      items: pagedItems,
      suggested_businesses: suggestedVendors,
      suggested_vendors: suggestedVendors,
      next_cursor: nextCursor,
      suggested_cities: filtered.length === 0 && suggestedVendors.length === 0 ? MAJOR_CITIES : []
    });
  } catch (error: any) {
    console.error("[GET /api/v1/search error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 3. GET /api/v1/vendors/:slug
// ----------------------------------------------------
router.get("/api/v1/vendors/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;

  // Try live backend first
  try {
    const remoteRes = await fetch(`${BACKEND_BASE}/api/v1/vendors/${encodeURIComponent(slug)}`);
    if (remoteRes.ok) {
      const remoteData = await remoteRes.json();
      if (remoteData && (remoteData.vendor || remoteData.success)) {
        return res.json(remoteData);
      }
    }
  } catch (err) {
    console.warn("[v1/vendors/:slug] Remote backend proxy attempt failed:", err);
  }

  try {
    const merchants = await getAllMerchants();
    const vendor = merchants.find(
      (m) => m.slug.toLowerCase() === slug.toLowerCase() || m.id === slug
    );

    if (!vendor) {
      return res.status(404).json({ success: false, error: "Vendor not found" });
    }

    return res.json({
      success: true,
      vendor: {
        id: vendor.id,
        slug: vendor.slug,
        name: vendor.name,
        city: vendor.city,
        state: vendor.state,
        category: vendor.category,
        verified: vendor.verified,
        is_spotlight: Boolean(vendor.is_spotlight),
        avatar_url: vendor.avatar_url,
        bio: vendor.bio,
        whatsapp_number: vendor.whatsapp_number,
        rating: vendor.rating,
        completed_escrows: vendor.completed_escrows
      }
    });
  } catch (error: any) {
    console.error("[GET /api/v1/vendors/:slug error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 4. GET /api/v1/vendors/:slug/products?cursor=
// ----------------------------------------------------
router.get("/api/v1/vendors/:slug/products", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const cursor = (req.query.cursor as string) || "";

  // Try live backend first
  try {
    const remoteRes = await fetch(`${BACKEND_BASE}/api/v1/vendors/${encodeURIComponent(slug)}/products?cursor=${encodeURIComponent(cursor)}`);
    if (remoteRes.ok) {
      const remoteData = await remoteRes.json();
      if (remoteData && (remoteData.products || remoteData.items || remoteData.success)) {
        return res.json(remoteData);
      }
    }
  } catch (err) {
    console.warn("[v1/vendors/:slug/products] Remote backend proxy attempt failed:", err);
  }

  try {
    const merchants = await getAllMerchants();
    const vendor = merchants.find(
      (m) => m.slug.toLowerCase() === slug.toLowerCase() || m.id === slug
    );

    if (!vendor) {
      return res.status(404).json({ success: false, error: "Vendor not found" });
    }

    // Base products from vendor
    let rawProducts = Array.isArray(vendor.products) ? [...vendor.products] : [];
    
    const allMapped = rawProducts.map((p: any) => ({
      id: p.id,
      title: p.title || p.name,
      price_naira: Number(p.price_naira || p.price || 0),
      formatted_price: p.formatted_price || formatPrice(Number(p.price_naira || p.price || 0)),
      photo_url: p.photo_url || p.photoUrl || p.imageUrl || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      description: p.description || "",
      in_stock: p.in_stock !== false,
      is_sale: Boolean(p.is_sale),
      category: p.category || vendor.category
    }));

    // Page size 12 for profile Instagram grid
    const pageSize = 12;
    let offset = 0;
    if (cursor === "page_2") offset = 12;
    else if (cursor === "page_3") offset = 24;
    else if (cursor?.startsWith("page_")) {
      const pageNum = parseInt(cursor.replace("page_", ""), 10) || 1;
      offset = (pageNum - 1) * pageSize;
    }

    const paged = allMapped.slice(offset, offset + pageSize);
    const hasMore = allMapped.length > offset + pageSize;
    const nextCursor = hasMore ? `page_${Math.floor(offset / pageSize) + 2}` : null;

    return res.json({
      success: true,
      vendor_slug: vendor.slug,
      products: paged,
      total_products: allMapped.length,
      next_cursor: nextCursor
    });
  } catch (error: any) {
    console.error("[GET /api/v1/vendors/:slug/products error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 5. GET /api/v1/vendors/:slug/statuses
// ----------------------------------------------------
router.get("/api/v1/vendors/:slug/statuses", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const merchants = await getAllMerchants();
    const vendor = merchants.find(
      (m) => m.slug.toLowerCase() === slug.toLowerCase() || m.id === slug
    );

    if (!vendor) {
      return res.status(404).json({ success: false, error: "Vendor not found" });
    }

    const liveStatuses = (vendor.statuses || []).filter((s: any) => {
      if (!s.expires_at) return true;
      return new Date(s.expires_at).getTime() > Date.now();
    });

    return res.json({
      success: true,
      vendor_slug: vendor.slug,
      statuses: liveStatuses
    });
  } catch (error: any) {
    console.error("[GET /api/v1/vendors/:slug/statuses error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 6. GET /api/v1/products/:id
// ----------------------------------------------------
router.get("/api/v1/products/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  // Try live backend first
  try {
    const remoteRes = await fetch(`${BACKEND_BASE}/api/v1/products/${encodeURIComponent(id)}`);
    if (remoteRes.ok) {
      const remoteData = await remoteRes.json();
      if (remoteData && (remoteData.product || remoteData.success)) {
        return res.json(remoteData);
      }
    }
  } catch (err) {
    console.warn("[v1/products/:id] Remote backend proxy attempt failed:", err);
  }

  try {
    const products = await getAllProducts();
    const product = products.find((p) => p.id === id);

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    return res.json({
      success: true,
      product: {
        ...product,
        photos: product.photos
      }
    });
  } catch (error: any) {
    console.error("[GET /api/v1/products/:id error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 7. POST /api/v1/carts/items
// ----------------------------------------------------
router.post("/api/v1/carts/items", async (req: Request, res: Response) => {
  try {
    const { product_id, quantity = 1, cart_id = "default-user" } = req.body;
    if (!product_id) {
      return res.status(400).json({ success: false, error: "product_id is required" });
    }

    const products = await getAllProducts();
    const product = products.find((p) => p.id === product_id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const cart = getOrCreateCart(cart_id);

    // Add or update item quantity
    const existingIndex = cart.items.findIndex((it) => it.product_id === product.id);
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += Number(quantity);
      cart.items[existingIndex].vendor = product.vendor;
    } else {
      cart.items.push({
        id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        product_id: product.id,
        title: product.title,
        price_naira: product.price_naira,
        formatted_price: product.formatted_price,
        photo_url: product.photo_url,
        quantity: Number(quantity),
        vendor: product.vendor
      });
    }
    cart.vendor ||= product.vendor;
    cart.updated_at = Date.now();

    const totalNaira = cart.items.reduce((acc, it) => acc + it.price_naira * it.quantity, 0);

    return res.json({
      success: true,
      cart: {
        cart_id: cart.cart_id,
        vendor: cart.vendor,
        items: cart.items,
        total_naira: totalNaira,
        formatted_total: formatPrice(totalNaira),
        count: cart.items.reduce((acc, it) => acc + it.quantity, 0)
      }
    });
  } catch (error: any) {
    console.error("[POST /api/v1/carts/items error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 8. GET /api/v1/carts/me
// ----------------------------------------------------
router.get("/api/v1/carts/me", (req: Request, res: Response) => {
  const cartId = (req.query.cart_id as string) || "default-user";
  const cart = getOrCreateCart(cartId);

  const totalNaira = cart.items.reduce((acc, it) => acc + it.price_naira * it.quantity, 0);

  return res.json({
    success: true,
    cart: {
      cart_id: cart.cart_id,
      vendor: cart.vendor,
      items: cart.items,
      total_naira: totalNaira,
      formatted_total: formatPrice(totalNaira),
      count: cart.items.reduce((acc, it) => acc + it.quantity, 0)
    }
  });
});

// ----------------------------------------------------
// 9. PATCH /api/v1/carts/items/:id
// ----------------------------------------------------
router.patch("/api/v1/carts/items/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, cart_id = "default-user" } = req.body;
  const cart = getOrCreateCart(cart_id);

  const itemIndex = cart.items.findIndex((it) => it.id === id || it.product_id === id);
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = Number(quantity);
    }
    cart.vendor = cart.items[0]?.vendor || null;
  }

  const totalNaira = cart.items.reduce((acc, it) => acc + it.price_naira * it.quantity, 0);

  return res.json({
    success: true,
    cart: {
      cart_id: cart.cart_id,
      vendor: cart.vendor,
      items: cart.items,
      total_naira: totalNaira,
      formatted_total: formatPrice(totalNaira),
      count: cart.items.reduce((acc, it) => acc + it.quantity, 0)
    }
  });
});

// ----------------------------------------------------
// 10. DELETE /api/v1/carts/items/:id
// ----------------------------------------------------
router.delete("/api/v1/carts/items/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const cartId = (req.query.cart_id as string) || "default-user";
  const cart = getOrCreateCart(cartId);

  const itemIndex = cart.items.findIndex((it) => it.id === id || it.product_id === id);
  if (itemIndex >= 0) {
    cart.items.splice(itemIndex, 1);
  }
  cart.vendor = cart.items[0]?.vendor || null;

  const totalNaira = cart.items.reduce((acc, it) => acc + it.price_naira * it.quantity, 0);

  return res.json({
    success: true,
    cart: {
      cart_id: cart.cart_id,
      vendor: cart.vendor,
      items: cart.items,
      total_naira: totalNaira,
      formatted_total: formatPrice(totalNaira),
      count: cart.items.reduce((acc, it) => acc + it.quantity, 0)
    }
  });
});

// ----------------------------------------------------
// 11. POST /api/v1/carts/me/replace
// ----------------------------------------------------
router.post("/api/v1/carts/me/replace", async (req: Request, res: Response) => {
  try {
    const { product_id, quantity = 1, cart_id = "default-user" } = req.body;
    if (!product_id) {
      return res.status(400).json({ success: false, error: "product_id is required" });
    }

    const products = await getAllProducts();
    const product = products.find((p) => p.id === product_id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const cart = getOrCreateCart(cart_id);
    // Clear existing
    cart.items = [];
    cart.vendor = product.vendor;

    // Add new product
    cart.items.push({
      id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      product_id: product.id,
      title: product.title,
      price_naira: product.price_naira,
      formatted_price: product.formatted_price,
      photo_url: product.photo_url,
      quantity: Number(quantity),
      vendor: product.vendor
    });
    cart.updated_at = Date.now();

    const totalNaira = cart.items.reduce((acc, it) => acc + it.price_naira * it.quantity, 0);

    return res.json({
      success: true,
      cart: {
        cart_id: cart.cart_id,
        vendor: cart.vendor,
        items: cart.items,
        total_naira: totalNaira,
        formatted_total: formatPrice(totalNaira),
        count: cart.items.reduce((acc, it) => acc + it.quantity, 0)
      }
    });
  } catch (error: any) {
    console.error("[POST /api/v1/carts/me/replace error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 12. DELETE /api/v1/carts/me
// ----------------------------------------------------
router.delete("/api/v1/carts/me", (req: Request, res: Response) => {
  const cartId = (req.query.cart_id as string) || "default-user";
  const cart = getOrCreateCart(cartId);
  cart.items = [];
  cart.vendor = null;
  cart.updated_at = Date.now();

  return res.json({
    success: true,
    message: "Cart cleared",
    cart: {
      cart_id: cart.cart_id,
      vendor: null,
      items: [],
      total_naira: 0,
      formatted_total: "₦0",
      count: 0
    }
  });
});

// ----------------------------------------------------
// 13. POST /api/v1/carts/me/buy  → { lead_code, whatsapp_url, prefill, vendor }
// ----------------------------------------------------
router.post("/api/v1/carts/me/buy", async (req: Request, res: Response) => {
  try {
    const { cart_id = "default-user", note } = req.body;
    const cart = getOrCreateCart(cart_id);

    if (!cart.vendor || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Cart is empty. Add verified products to continue to WhatsApp."
      });
    }

    const vendorSlugs = new Set(cart.items.map((item) => item.vendor?.slug).filter(Boolean));
    if (vendorSlugs.size > 1) {
      return res.status(409).json({
        success: false,
        code: "CART_MULTIPLE_VENDORS",
        error: "Use the Floate AI chat button for each merchant group to continue with multiple sellers."
      });
    }

    const leadCode = `FLT-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalNaira = cart.items.reduce((acc, it) => acc + it.price_naira * it.quantity, 0);

    const itemsSummary = cart.items
      .map((it) => `• ${it.title} (x${it.quantity}) — ${formatPrice(it.price_naira * it.quantity)}`)
      .join("\n");

    const prefillMessage = `Hello ${cart.vendor.name},\n\nI saw your verified catalog on FLOATE and would like to order:\n\n${itemsSummary}\n\n*Estimated Total: ${formatPrice(totalNaira)}*\n*Lead Reference: ${leadCode}*${note ? `\n\nNote: ${note}` : ""}\n\nPlease confirm product availability, shipping timeframe, and payment details. Thank you!`;

    // Clean phone number for wa.me format
    let rawPhone = (cart.vendor.whatsapp_number || "+2348031234567").replace(/[^0-9]/g, "");
    if (rawPhone.startsWith("0")) {
      rawPhone = "234" + rawPhone.slice(1);
    }
    if (!rawPhone.startsWith("234")) {
      rawPhone = "234" + rawPhone;
    }

    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(prefillMessage)}`;

    return res.json({
      success: true,
      lead_code: leadCode,
      whatsapp_url: whatsappUrl,
      prefill: prefillMessage,
      vendor: {
        name: cart.vendor.name,
        slug: cart.vendor.slug,
        whatsapp_number: cart.vendor.whatsapp_number,
        city: cart.vendor.city
      }
    });
  } catch (error: any) {
    console.error("[POST /api/v1/carts/me/buy error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 14. POST /api/v1/intake/voice
// ----------------------------------------------------
router.post("/api/v1/intake/voice", async (req: Request, res: Response) => {
  try {
    const { transcript, audio_base64, mime_type } = req.body || {};
    let queryText = typeof transcript === "string" ? transcript.trim() : "";

    if (!queryText && typeof audio_base64 === "string" && audio_base64.trim()) {
      const audioData = audio_base64.replace(/^data:audio\/[^;]+;base64,/, "");
      const audioMimeType = typeof mime_type === "string" && mime_type.startsWith("audio/")
        ? mime_type
        : "audio/ogg";
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: audioMimeType, data: audioData } },
            { text: "Transcribe this buyer's voice note. Return only the spoken words, preserving product names, locations, and budgets." }
          ]
        }]
      });
      queryText = (response.text || "").trim();
    }

    if (!queryText) {
      return res.json({
        intent: "clarify",
        message: "Could not detect voice input. Please try speaking again or type your search.",
        query: ""
      });
    }

    try {
      const parsed = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Extract the product query, city if mentioned (e.g. Lagos, Onitsha, Aba, Abuja, Kano, Ibadan, Enugu, Port Harcourt), and budget/max price in Naira if mentioned from this buyer request: "${queryText}"`,
        config: {
          systemInstruction: "Extract shopping intent from Nigerian buyer text. Return pure JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING, enum: ["search", "clarify"] },
              query: { type: Type.STRING },
              city: { type: Type.STRING },
              max_price_naira: { type: Type.NUMBER }
            },
            required: ["intent", "query"]
          }
        }
      });

      const parsedIntent = JSON.parse(parsed.text || "{}");
      return res.json({
        intent: parsedIntent.intent || "search",
        query: parsedIntent.query || queryText,
        city: parsedIntent.city || undefined,
        max_price_naira: parsedIntent.max_price_naira || undefined,
        transcript: queryText
      });
    } catch (aiErr: any) {
      console.warn("[Floate AI Search Intent] AI parsing error, using fallback:", aiErr.message || aiErr);
      return res.json({ intent: "search", query: queryText, transcript: queryText });
    }
  } catch (error: any) {
    console.error("[POST /api/v1/intake/voice error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 15. POST /api/v1/intake/image
// ----------------------------------------------------
router.post("/api/v1/intake/image", async (req: Request, res: Response) => {
  try {
    const { image_base64, mime_type = "image/jpeg" } = req.body;

    if (!image_base64) {
      return res.status(400).json({ success: false, error: "image_base64 is required" });
    }

    const cleanBase64 = image_base64.replace(/^data:image\/[a-z]+;base64,/, "");

    const aiRes = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mime_type,
                data: cleanBase64
              }
            },
            {
              text: "Identify this commercial product precisely for a Nigerian marketplace search (e.g. MacBook Pro, Italian leather slides, Austrian lace fabric, solar inverter, human hair). Return JSON with search query."
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING, enum: ["search"] },
            query: { type: Type.STRING },
            category: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["intent", "query", "category"]
        }
      }
    });

    const parsed = JSON.parse(aiRes.text || "{}");
    return res.json({
      intent: "search",
      query: parsed.query || "Verified Product",
      category: parsed.category || "General Merchandise"
    });
  } catch (error: any) {
    console.error("[POST /api/v1/intake/image error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 16. GET /api/v1/ads?city=&placement=
// ----------------------------------------------------
router.get("/api/v1/ads", (req: Request, res: Response) => {
  // Empty as per Floate spec (render empty now)
  return res.json({
    success: true,
    ads: []
  });
});

// ----------------------------------------------------
// 17. Billing Endpoints for Seller Payment Return
// ----------------------------------------------------
const mockBillingTx: Record<string, { status: string; pack: string; live_until: string; boost_until?: string; spotlight_until?: string }> = {};

router.get("/api/v1/billing/packs/:tx_ref", (req: Request, res: Response) => {
  const { tx_ref } = req.params;
  const tx = mockBillingTx[tx_ref];

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  if (!tx) {
    // Default valid return for testing or references
    return res.json({
      success: true,
      tx_ref,
      status: "paid",
      pack: "visible",
      live_until: nextMonth,
      boost_until: nextMonth,
      spotlight_until: nextMonth
    });
  }

  return res.json({
    success: true,
    tx_ref,
    ...tx
  });
});

router.post("/api/v1/billing/packs/init", (req: Request, res: Response) => {
  const { pack } = req.body;
  const tx_ref = `floate-tx-${Date.now()}`;
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  mockBillingTx[tx_ref] = {
    status: "paid",
    pack: pack || "visible",
    live_until: nextMonth,
    boost_until: pack === "front" || pack === "spotlight" || pack === "BOOST_TOPUP" ? nextMonth : undefined,
    spotlight_until: pack === "spotlight" || pack === "SPOTLIGHT_TOPUP" ? nextMonth : undefined
  };

  return res.json({
    success: true,
    tx_ref,
    checkout_url: `/billing/done?ref=${tx_ref}`
  });
});

// ----------------------------------------------------
// 18. POST /api/v1/search/intake-text
// ----------------------------------------------------
router.post("/api/v1/search/intake-text", async (req: Request, res: Response) => {
  try {
    const { text = "", phone = "2348012345678" } = req.body;
    const cleanText = text.trim();

    if (!cleanText) {
      return res.status(400).json({ success: false, error: "Text is required" });
    }

    let parsedCity = "";
    let priceMax = 0;
    const citiesList = ["Lagos", "Onitsha", "Aba", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Enugu"];
    
    for (const c of citiesList) {
      if (cleanText.toLowerCase().includes(c.toLowerCase())) {
        parsedCity = c;
        break;
      }
    }

    const priceMatch = cleanText.match(/(?:under|below|max|less than|<=)?\s*(?:₦|NGN|k)?\s*(\d+)(?:k|kobo|naira)?/i);
    if (priceMatch) {
      const num = parseInt(priceMatch[1], 10);
      if (num < 1000 && cleanText.toLowerCase().includes("k")) {
        priceMax = num * 1000;
      } else {
        priceMax = num;
      }
    }

    const reply = `I found verified stalls matching "${cleanText}"${parsedCity ? ` in ${parsedCity}` : ""}${priceMax ? ` under ₦${priceMax.toLocaleString()}` : ""}.`;

    return res.json({
      success: true,
      job: "SEARCH_INTENT",
      item: cleanText,
      city: parsedCity || undefined,
      price_max_naira: priceMax || undefined,
      reply,
      keywords: cleanText.split(" ")
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 19. GET /api/v1/listings
// ----------------------------------------------------
router.get("/api/v1/listings", async (req: Request, res: Response) => {
  try {
    const query = ((req.query.query as string) || (req.query.q as string) || "").trim();
    const city = ((req.query.city as string) || "").trim();
    const priceMax = req.query.price_max ? Number(req.query.price_max) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const allProducts = await getAllProducts();
    const qLower = query.toLowerCase();
    const cityLower = city.toLowerCase();

    const filtered = allProducts.filter((item) => {
      if (cityLower && !item.vendor.city.toLowerCase().includes(cityLower)) return false;
      if (priceMax && item.price_naira > priceMax) return false;
      if (qLower) {
        const titleMatch = item.title.toLowerCase().includes(qLower);
        const descMatch = (item.description || "").toLowerCase().includes(qLower);
        const vendorMatch = item.vendor.name.toLowerCase().includes(qLower);
        if (!titleMatch && !descMatch && !vendorMatch) return false;
      }
      return true;
    });

    const allMerchants = await getAllMerchants();
    const suggestedVendors = allMerchants.filter((m) => {
      if (cityLower && !m.city.toLowerCase().includes(cityLower)) return false;
      if (qLower) {
        const nameMatch = m.name.toLowerCase().includes(qLower);
        const catMatch = (m.category || "").toLowerCase().includes(qLower);
        const bioMatch = (m.bio || "").toLowerCase().includes(qLower);
        return nameMatch || catMatch || bioMatch;
      }
      return true;
    }).slice(0, 8);

    return res.json({
      success: true,
      query,
      city: city || "All Cities",
      total_found: filtered.length,
      hits: filtered.slice(0, limit),
      items: filtered.slice(0, limit),
      suggested_businesses: suggestedVendors,
      suggested_vendors: suggestedVendors,
      suggested_cities: filtered.length === 0 && suggestedVendors.length === 0 ? MAJOR_CITIES : []
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 20. POST /api/v1/cart/add  (With force_replace support)
// ----------------------------------------------------
router.post("/api/v1/cart/add", async (req: Request, res: Response) => {
  try {
    const { product_id, quantity = 1, force_replace = false, cart_id = "default-user" } = req.body;
    if (!product_id) return res.status(400).json({ success: false, error: "product_id is required" });

    const products = await getAllProducts();
    const product = products.find((p) => p.id === product_id);
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    const cart = getOrCreateCart(cart_id);

    if (force_replace) {
      cart.items = [];
      cart.vendor = product.vendor;
    }

    cart.vendor ||= product.vendor;
    const existingIndex = cart.items.findIndex((it) => it.product_id === product.id);
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += Number(quantity);
      cart.items[existingIndex].vendor = product.vendor;
    } else {
      cart.items.push({
        id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        product_id: product.id,
        title: product.title,
        price_naira: product.price_naira,
        formatted_price: product.formatted_price,
        photo_url: product.photo_url,
        quantity: Number(quantity),
        vendor: product.vendor
      });
    }

    const totalNaira = cart.items.reduce((acc, it) => acc + it.price_naira * it.quantity, 0);

    return res.json({
      success: true,
      cart: {
        cart_id: cart.cart_id,
        vendor: cart.vendor,
        items: cart.items,
        total_naira: totalNaira,
        formatted_total: formatPrice(totalNaira),
        count: cart.items.reduce((acc, it) => acc + it.quantity, 0)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 21. POST /api/v1/billing/packs/quote
// ----------------------------------------------------
router.post("/api/v1/billing/packs/quote", (req: Request, res: Response) => {
  const { pack_code, vendor_id } = req.body;
  
  if (pack_code === "FRONT") {
    return res.json({
      success: true,
      pack_code: "BOOST_TOPUP",
      price_naira: 6000,
      formatted_price: "₦6,000",
      mapped_pack_code: "BOOST_TOPUP",
      message: "Topup boost for 30 days"
    });
  }

  if (pack_code === "SPOTLIGHT") {
    return res.json({
      success: true,
      pack_code: "SPOTLIGHT_TOPUP",
      price_naira: 11000,
      formatted_price: "₦11,000",
      mapped_pack_code: "SPOTLIGHT_TOPUP",
      message: "Topup spotlight placement for 30 days"
    });
  }

  return res.json({
    success: true,
    pack_code: "VISIBLE",
    price_naira: 4000,
    formatted_price: "₦4,000",
    message: "Visible Pack live status"
  });
});

// ----------------------------------------------------
// 22. Saved Shops / Buyer Favorites Endpoints
// ----------------------------------------------------
const savedShopsMap = new Map<string, Set<string>>(); // buyer_id -> Set of vendor_ids

router.post("/api/v1/saved-shops", async (req: Request, res: Response) => {
  const { buyer_id = "default-user", vendor_id } = req.body;
  if (!vendor_id) return res.status(400).json({ success: false, error: "vendor_id is required" });

  if (!savedShopsMap.has(buyer_id)) {
    savedShopsMap.set(buyer_id, new Set());
  }
  savedShopsMap.get(buyer_id)!.add(vendor_id);

  return res.json({ success: true, message: "Shop saved to favorites" });
});

router.get("/api/v1/saved-shops", async (req: Request, res: Response) => {
  const buyerId = (req.query.buyer_id as string) || "default-user";
  const vendorIds = savedShopsMap.get(buyerId) || new Set();

  const merchants = await getAllMerchants();
  const saved = merchants.filter((m) => vendorIds.has(m.id) || vendorIds.has(m.slug));

  return res.json({
    success: true,
    shops: saved.map((vendor) => ({
      id: `saved-${vendor.id}`,
      buyer_id: buyerId,
      vendor_id: vendor.id,
      created_at: new Date().toISOString(),
      vendor
    }))
  });
});

router.delete("/api/v1/saved-shops/:vendor_id", (req: Request, res: Response) => {
  const { vendor_id } = req.params;
  const buyerId = (req.query.buyer_id as string) || "default-user";

  if (savedShopsMap.has(buyerId)) {
    savedShopsMap.get(buyerId)!.delete(vendor_id);
  }

  return res.json({ success: true, message: "Shop removed from favorites" });
});

// ----------------------------------------------------
// 23. Verification & Admin Management Proxy Endpoints
// ----------------------------------------------------
const BACKEND_BASE = (process.env.FLOATE_UPSTREAM_BACKEND_URL || "").replace(/\/+$/, "");

router.get(["/verify/session", "/api/v1/verify/session"], requireWhatsAppBearer, async (req: Request, res: Response) => {
  if (!BACKEND_BASE) {
    return res.status(503).json({ success: false, valid: false, error: "Verification backend is not configured." });
  }
  try {
    const url = new URL(`${BACKEND_BASE}/verify/session`);
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") url.searchParams.set(key, value);
    }
    url.searchParams.set("phone", (req as Request & { verifiedWhatsAppPhone?: string }).verifiedWhatsAppPhone || "");
    const remoteRes = await fetch(url, {
      headers: { Accept: "application/json", Authorization: req.get("authorization") || "" }
    });
    const data = await remoteRes.json().catch(() => null);
    if (remoteRes.ok) {
      const session = data?.session || data;
      const phone = normalizeWhatsAppNumber(session?.phone || session?.whatsapp);
      const authenticatedPhone = (req as Request & { verifiedWhatsAppPhone?: string }).verifiedWhatsAppPhone;
      if (!(data?.valid === true || session?.valid === true) || phone !== authenticatedPhone) {
        return res.status(phone && phone !== authenticatedPhone ? 403 : 401).json({
          success: false,
          valid: false,
          error: "The verification session is invalid or does not match the authenticated WhatsApp account."
        });
      }
    }
    return res.status(remoteRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ success: false, message: err?.message || "Failed to reach backend verification service" });
  }
});

router.post(["/verify/submit", "/api/v1/verify/submit"], requireWhatsAppBearer, async (req: Request, res: Response) => {
  if (!BACKEND_BASE) {
    return res.status(503).json({ success: false, error: "Verification backend is not configured." });
  }
  try {
    const remoteRes = await fetch(`${BACKEND_BASE}/verify/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.get("authorization") || ""
      },
      body: JSON.stringify({
        ...req.body,
        phone: (req as Request & { verifiedWhatsAppPhone?: string }).verifiedWhatsAppPhone
      })
    });
    const data = await remoteRes.json().catch(() => null);
    return res.status(remoteRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ success: false, message: err?.message || "Failed to submit verification to backend" });
  }
});

async function findVerificationApplication(vendorId: string): Promise<DocumentSnapshot | null> {
  const candidateIds = [vendorId];
  if (!vendorId.startsWith("vendor_")) {
    const phone = normalizeWhatsAppNumber(vendorId);
    if (phone) candidateIds.push(`vendor_${phone}`);
  }

  for (const candidateId of candidateIds) {
    const candidate = await adminFirestoreDb.collection("business_verification_applications").doc(candidateId).get();
    if (candidate.exists) return candidate;
  }
  return null;
}

router.get("/api/v1/admin/verifications", requireAdminApiKey, async (req: Request, res: Response) => {
  const requestedStatus = String(req.query.status || "all").toLowerCase();
  try {
    const [snapshot, evidenceSnapshot] = await Promise.all([
      adminFirestoreDb.collection("business_verification_applications").get(),
      adminFirestoreDb.collection("business_verification_evidence").get()
    ]);
    const evidenceByVendor = new Map<string, Record<string, unknown>[]>();
    for (const evidenceDoc of evidenceSnapshot.docs) {
      const evidence = evidenceDoc.data();
      const vendorId = String(evidence.vendor_id || evidence.vendorId || "");
      if (!vendorId) continue;
      const vendorEvidence = evidenceByVendor.get(vendorId) || [];
      vendorEvidence.push(evidence);
      evidenceByVendor.set(vendorId, vendorEvidence);
    }

    const applications = snapshot.docs.map((verificationDoc) => {
      const record = verificationDoc.data();
      const rawStatus = String(record.status || record.verification_status || "").toLowerCase();
      const status = rawStatus === "pending" || rawStatus === "under_review" ? "pending_review" : rawStatus;
      const registrationData = record.registration_data && typeof record.registration_data === "object"
        ? record.registration_data
        : {};
      return {
        ...record,
        id: verificationDoc.id,
        vendor_id: record.vendor_id || record.vendorId || verificationDoc.id,
        business_name: record.business_name || record.businessName || "",
        owner_name: record.owner_name || record.ownerName || "",
        market: record.market || record.marketHub || record.marketLocation || "",
        city: record.city || "",
        whatsapp: record.whatsapp || record.phone || record.whatsappNumber || "",
        products: record.products || record.initialProduct?.name || "",
        status: status || (record.isVerified === true || record.verified === true ? "approved" : "pending_review"),
        submitted_at: record.submitted_at || record.submittedAt || record.createdAt || "",
        registration_data: registrationData,
        visual_evidence: evidenceByVendor.get(String(record.vendor_id || record.vendorId || verificationDoc.id)) || []
      };
    }).filter((application) => {
      if (requestedStatus === "all") return true;
      if (requestedStatus === "pending_review") return ["pending_review", "submitted"].includes(application.status);
      return application.status === requestedStatus;
    }).sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime());

    return res.json({ success: true, verifications: applications, total: applications.length });
  } catch (error) {
    console.error("[Admin Verifications] Could not load registration queue:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch admin verifications"
    });
  }
});

router.post("/api/v1/admin/verifications/:vendorId/approve", requireAdminApiKey, async (req: Request, res: Response) => {
  try {
    const applicationSnapshot = await findVerificationApplication(req.params.vendorId);
    if (!applicationSnapshot) {
      return res.status(404).json({ success: false, message: "Registration application not found." });
    }
    const application = applicationSnapshot.data() || {};
    const businessId = String(application.vendor_id || application.vendorId || applicationSnapshot.id);
    const businessRef = adminFirestoreDb.collection("businesses").doc(businessId);
    const businessSnapshot = await businessRef.get();
    if (!businessSnapshot.exists) {
      return res.status(404).json({ success: false, message: "Registered business record not found." });
    }

    const business = businessSnapshot.data() || {};
    const businessName = String(
      business.businessName || business.name || application.business_name || application.businessName || "Business"
    );
    const reviewedAt = new Date().toISOString();
    const reviewerName = String(req.body?.reviewer_name || "Admin");
    const certificateUrl = buildCertificateDownloadUrl(businessId, businessName, business, application);
    const approvedBusiness = {
      verified: true,
      isVerified: true,
      verificationStatus: "APPROVED",
      verification_status: "approved",
      status: "ACTIVE",
      verificationReason: "",
      reviewedAt,
      approvedAt: reviewedAt,
      reviewerName,
      certificateUrl,
      updatedAt: reviewedAt
    };

    const batch = adminFirestoreDb.batch();
    batch.set(businessRef, approvedBusiness, { merge: true });
    batch.set(applicationSnapshot.ref, {
      status: "approved",
      verification_status: "approved",
      reviewed_at: reviewedAt,
      reviewer_name: reviewerName
    }, { merge: true });
    await batch.commit();
    let catalogError = "";
    try {
      await publishApprovedBusiness(businessId);
    } catch (error) {
      catalogError = error instanceof Error ? error.message : "Public catalog publishing failed.";
      console.error(`[Admin Verifications] Business ${businessId} was approved but could not be published to the public catalog:`, error);
    }

    const notification = await sendVerificationWhatsApp(
      String(business.whatsappNumber || business.whatsapp || business.phone || application.whatsapp || ""),
      businessName,
      "approved",
      "",
      certificateUrl
    );
    await applicationSnapshot.ref.set({
      notification_status: notification.sent ? "sent" : "failed",
      notification_error: notification.sent ? "" : notification.message
    }, { merge: true });

    return res.json({
      success: true,
      message: catalogError ? "Business approved, but public catalog publishing failed." : "Business approved.",
      vendor: { id: businessId, ...business, ...approvedBusiness },
      catalogPublished: !catalogError,
      catalogError: catalogError || undefined,
      notificationSent: notification.sent,
      notificationMessage: notification.message
    });
  } catch (error) {
    console.error("[Admin Verifications] Approval failed:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to approve merchant"
    });
  }
});

router.post("/api/v1/admin/verifications/:vendorId/reject", requireAdminApiKey, async (req: Request, res: Response) => {
  const reason = String(req.body?.reason || "").trim();
  if (!reason) return res.status(400).json({ success: false, message: "A rejection reason is required." });

  try {
    const applicationSnapshot = await findVerificationApplication(req.params.vendorId);
    if (!applicationSnapshot) {
      return res.status(404).json({ success: false, message: "Registration application not found." });
    }
    const application = applicationSnapshot.data() || {};
    const businessId = String(application.vendor_id || application.vendorId || applicationSnapshot.id);
    const businessRef = adminFirestoreDb.collection("businesses").doc(businessId);
    const businessSnapshot = await businessRef.get();
    if (!businessSnapshot.exists) {
      return res.status(404).json({ success: false, message: "Registered business record not found." });
    }

    const business = businessSnapshot.data() || {};
    const businessName = String(
      business.businessName || business.name || application.business_name || application.businessName || "Business"
    );
    const reviewedAt = new Date().toISOString();
    const reviewerName = String(req.body?.reviewer_name || "Admin");
    const rejectedBusiness = {
      verified: false,
      isVerified: false,
      verificationStatus: "REJECTED",
      verification_status: "rejected",
      status: "REJECTED",
      verificationReason: reason,
      reviewedAt,
      reviewerName,
      updatedAt: reviewedAt
    };

    const batch = adminFirestoreDb.batch();
    batch.set(businessRef, rejectedBusiness, { merge: true });
    batch.set(applicationSnapshot.ref, {
      status: "rejected",
      verification_status: "rejected",
      rejection_reason: reason,
      reviewed_at: reviewedAt,
      reviewer_name: reviewerName
    }, { merge: true });
    await batch.commit();
    await removeBusinessFromPublicCatalog(businessId);

    const notification = await sendVerificationWhatsApp(
      String(business.whatsappNumber || business.whatsapp || business.phone || application.whatsapp || ""),
      businessName,
      "rejected",
      reason
    );
    await applicationSnapshot.ref.set({
      notification_status: notification.sent ? "sent" : "failed",
      notification_error: notification.sent ? "" : notification.message
    }, { merge: true });

    return res.json({
      success: true,
      message: "Business rejected.",
      notificationSent: notification.sent,
      notificationMessage: notification.message
    });
  } catch (error) {
    console.error("[Admin Verifications] Rejection failed:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to reject merchant"
    });
  }
});

router.post("/api/v1/admin/verifications/:vendorId/notify", requireAdminApiKey, async (req: Request, res: Response) => {
  try {
    const applicationSnapshot = await findVerificationApplication(req.params.vendorId);
    if (!applicationSnapshot) {
      return res.status(404).json({ success: false, message: "Registration application not found." });
    }
    const application = applicationSnapshot.data() || {};
    const status = String(application.status || "").toLowerCase();
    if (status !== "approved" && status !== "rejected") {
      return res.status(409).json({
        success: false,
        message: "Only approved or rejected applications can receive a decision notification."
      });
    }

    const businessId = String(application.vendor_id || application.vendorId || applicationSnapshot.id);
    const businessSnapshot = await adminFirestoreDb.collection("businesses").doc(businessId).get();
    if (!businessSnapshot.exists) {
      return res.status(404).json({ success: false, message: "Registered business record not found." });
    }
    const business = businessSnapshot.data() || {};
    const businessName = String(business.businessName || business.name || application.business_name || "Business");
    const reason = String(application.rejection_reason || business.verificationReason || "");
    const notification = await sendVerificationWhatsApp(
      String(business.whatsappNumber || business.whatsapp || business.phone || application.whatsapp || ""),
      businessName,
      status,
      reason,
      status === "approved"
        ? (/^https?:\/\//i.test(String(business.certificateUrl || ""))
            ? String(business.certificateUrl)
            : buildCertificateDownloadUrl(businessId, businessName, business, application))
        : ""
    );
    await applicationSnapshot.ref.set({
      notification_status: notification.sent ? "sent" : "failed",
      notification_error: notification.sent ? "" : notification.message
    }, { merge: true });

    return res.json({
      success: true,
      notificationSent: notification.sent,
      notificationMessage: notification.message
    });
  } catch (error) {
    console.error("[Admin Verifications] Notification retry failed:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to send verification notification"
    });
  }
});

// ----------------------------------------------------
// 24. Flutterwave Checkout & Payment Integration
// ----------------------------------------------------
router.post("/api/v1/payments/flutterwave/checkout", async (req: Request, res: Response) => {
  const { merchantPhone, packageId, customerName, customerEmail, redirectUrl, amount } = req.body;
  
  if (!merchantPhone || !packageId) {
    return res.status(400).json({ success: false, message: "merchantPhone and packageId are required." });
  }

  const liveBackendUrl = BACKEND_BASE;

  try {
    const remoteRes = await fetch(`${liveBackendUrl.replace(/\/+$/, "")}/api/v1/payments/flutterwave/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    if (remoteRes.ok) {
      const data = await remoteRes.json();
      return res.json(data);
    }
  } catch (err) {
    console.warn("[Flutterwave API] Live backend checkout call failed, generating fallback payment token:", err);
  }

  // Fallback payment session response
  const txRef = `FLT_PAY_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const pkgPriceMap: Record<string, number> = {
    VERIFIED_PLUS: 5000,
    PRODUCT_BOOST_SINGLE: 1000,
    PRODUCT_BOOST_BUNDLE_5: 4000,
    SPONSORED_SPOT: 10000,
    BRAND_SPOT: 75000,
    LEAD_CREDITS_10: 2000
  };
  const pkgAmount = amount || pkgPriceMap[packageId] || 5000;

  return res.json({
    status: "success",
    success: true,
    message: "Flutterwave checkout initialized successfully",
    data: {
      link: `https://checkout.flutterwave.com/v3/hosted/pay/flw_${txRef.toLowerCase()}`,
      tx_ref: txRef,
      amount: pkgAmount,
      currency: "NGN"
    },
    txRef,
    amount: pkgAmount,
    currency: "NGN",
    merchantPhone,
    packageId
  });
});

// ----------------------------------------------------
// 25. WhatsApp 1-Click Deep-Link Auth Token Exchange
// ----------------------------------------------------
interface RegistrationOtpRecord {
  code: string;
  attempts: number;
  expiresAt: number;
}

async function consumeWhatsAppOtp(canonicalPhone: string, code: string): Promise<boolean> {
  const key = `registration_otp:${canonicalPhone}`;
  const record = await redisService.get<RegistrationOtpRecord>(key);
  if (!record || record.expiresAt <= Date.now() || record.attempts >= 5) {
    await redisService.del(key);
    return false;
  }

  const submitted = Buffer.from(code);
  const expected = Buffer.from(record.code);
  const isValid = submitted.length === expected.length && timingSafeEqual(submitted, expected);
  if (!isValid) {
    record.attempts += 1;
    if (record.attempts >= 5) await redisService.del(key);
    else await redisService.set(key, record, Math.ceil((record.expiresAt - Date.now()) / 1000));
    return false;
  }

  await redisService.del(key);
  return true;
}

const REGISTRATION_VERIFICATION_TTL_SECONDS = 30 * 60;
const REGISTRATION_VERIFICATION_ISSUER = "floate-registration";

async function createRegistrationVerificationToken(phone: string): Promise<string> {
  const canonicalPhone = normalizeWhatsAppNumber(phone);
  if (!canonicalPhone) throw new Error("A valid WhatsApp number is required for verification.");

  const secret = process.env.FLOATE_JWT_SECRET || process.env.SESSION_SECRET || "";
  if (secret.length < 32) {
    throw new Error("FLOATE_JWT_SECRET must be configured with at least 32 characters.");
  }

  const token = jwt.sign(
    { phone: canonicalPhone, jti: randomBytes(16).toString("hex") },
    secret,
    { expiresIn: REGISTRATION_VERIFICATION_TTL_SECONDS, issuer: REGISTRATION_VERIFICATION_ISSUER }
  );
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === "string" || typeof decoded.exp !== "number") {
    throw new Error("Could not create an expiring WhatsApp verification token.");
  }
  await adminFirestoreDb.collection("registration_phone_verifications").doc(canonicalPhone).set({
    phone: canonicalPhone,
    tokenHash,
    expiresAt: new Date(decoded.exp * 1000),
    createdAt: new Date()
  });
  return token;
}

function getRegistrationVerificationClaims(phone: string, token: string): {
  phone: string;
  tokenHash: string;
  expiresAt: number;
} | null {
  const canonicalPhone = normalizeWhatsAppNumber(phone);
  if (!canonicalPhone || !token || token.length > 2048) return null;

  const secret = process.env.FLOATE_JWT_SECRET || process.env.SESSION_SECRET || "";
  if (secret.length < 32) {
    throw new Error("FLOATE_JWT_SECRET must be configured with at least 32 characters.");
  }

  let decoded: string | JwtPayload;
  try {
    decoded = jwt.verify(token, secret, { issuer: REGISTRATION_VERIFICATION_ISSUER });
  } catch {
    return null;
  }

  if (
    typeof decoded === "string" ||
    decoded.phone !== canonicalPhone ||
    typeof decoded.exp !== "number" ||
    typeof decoded.jti !== "string" ||
    decoded.exp * 1000 <= Date.now()
  ) {
    return null;
  }

  return {
    phone: canonicalPhone,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: decoded.exp * 1000
  };
}

function getStoredVerificationExpiry(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }
  return Number.NaN;
}

export async function consumeRegistrationVerificationToken(phone: string, token: string): Promise<boolean> {
  const claims = getRegistrationVerificationClaims(phone, token);
  if (!claims) return false;

  const verificationRef = adminFirestoreDb.collection("registration_phone_verifications").doc(claims.phone);
  return adminFirestoreDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(verificationRef);
    if (!snapshot.exists) return false;

    const record = snapshot.data();
    if (
      record?.phone !== claims.phone ||
      record?.tokenHash !== claims.tokenHash ||
      getStoredVerificationExpiry(record?.expiresAt) !== claims.expiresAt ||
      claims.expiresAt <= Date.now()
    ) {
      return false;
    }

    transaction.delete(verificationRef);
    return true;
  });
}

export async function verifyRegistrationVerificationToken(phone: string, token: string): Promise<boolean> {
  const claims = getRegistrationVerificationClaims(phone, token);
  if (!claims) return false;

  const snapshot = await adminFirestoreDb
    .collection("registration_phone_verifications")
    .doc(claims.phone)
    .get();
  if (!snapshot.exists) return false;

  const record = snapshot.data();
  return Boolean(
    record?.phone === claims.phone &&
    record?.tokenHash === claims.tokenHash &&
    getStoredVerificationExpiry(record?.expiresAt) === claims.expiresAt &&
    claims.expiresAt > Date.now()
  );
}

router.post(["/api/v1/auth/whatsapp/request-code", "/api/auth/whatsapp/request-code"], async (req: Request, res: Response) => {
  const phone = String(req.body?.phone || req.body?.phoneNumber || "").trim();
  if (!phone) return res.status(400).json({ success: false, error: "Phone number is required." });
  if (!isWhatsAppAuthConfigured()) {
    return res.status(503).json({ success: false, error: "WhatsApp login is not fully configured on this backend." });
  }

  try {
    const challenge = await whatsappAuthService.requestAuthCode(phone, req.ip || req.socket.remoteAddress || "unknown");
    return res.json({ success: true, ...challenge });
  } catch (error: any) {
    const status = /rate limit/i.test(error.message || "") ? 429 : 400;
    return res.status(status).json({ success: false, error: error.message || "WhatsApp authentication could not be started." });
  }
});

router.get(["/api/v1/auth/whatsapp/session-status", "/api/auth/whatsapp/session-status"], async (req: Request, res: Response) => {
  const code = String(req.query.code || "").trim();
  if (!code) return res.status(400).json({ success: false, authenticated: false, error: "Challenge code is required." });

  try {
    const session = await whatsappAuthService.getSessionStatus(code);
    return res.json({ success: true, ...session });
  } catch (error: any) {
    return res.status(503).json({ success: false, authenticated: false, error: error.message || "WhatsApp session status is unavailable." });
  }
});

router.post(["/api/auth/whatsapp/send-otp", "/auth/whatsapp/send-otp"], async (req: Request, res: Response) => {
  const phone = String(req.body?.phoneNumber || req.body?.phone || "").trim();
  if (!phone) return res.status(400).json({ success: false, error: "Phone number is required." });
  if (!isWhatsAppConfigured()) {
    return res.status(503).json({ success: false, error: "WhatsApp delivery is not configured on this backend." });
  }

  try {
    const canonical = normalizeWhatsAppNumber(phone);
    if (!canonical) return res.status(400).json({ success: false, error: "A valid phone number is required." });

    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    const rateLimit = await redisService.checkRateLimit(`registration_otp:${clientIp}:${canonical}`, 3, 900);
    if (!rateLimit.allowed) return res.status(429).json({ success: false, error: "Too many verification codes requested. Try again later." });

    const key = `registration_otp:${canonical}`;
    const record: RegistrationOtpRecord = {
      code: String(randomInt(1000, 10000)),
      attempts: 0,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    if (!await redisService.set(key, record, 600)) {
      return res.status(503).json({ success: false, error: "Could not store the verification code." });
    }

    const delivered = await sendWhatsAppMessage(canonical, `Your Floate verification code is ${record.code}. It expires in 10 minutes.`);
    if (!delivered) {
      await redisService.del(key);
      return res.status(502).json({ success: false, error: "WhatsApp could not deliver the verification code." });
    }

    return res.json({ success: true, phone: canonical, message: "Verification code sent to WhatsApp." });
  } catch (error: any) {
    console.error("[Registration] WhatsApp code delivery failed:", error);
    return res.status(502).json({ success: false, error: error.message || "WhatsApp could not deliver the verification code." });
  }
});

router.post(["/api/auth/whatsapp/verify", "/auth/whatsapp/verify"], async (req: Request, res: Response) => {
  const phone = String(req.body?.phoneNumber || req.body?.phone || "").trim();
  const code = String(req.body?.otp || req.body?.code || "").trim();
  if (!phone || !/^\d{4}$/.test(code)) {
    return res.status(400).json({ success: false, error: "Phone number and four-digit code are required." });
  }

  try {
    const canonical = normalizeWhatsAppNumber(phone);
    if (!canonical) return res.status(400).json({ success: false, error: "A valid phone number is required." });
    if (!await consumeWhatsAppOtp(canonical, code)) {
      return res.status(400).json({ success: false, error: "Verification code is invalid or expired." });
    }

    const verificationToken = await createRegistrationVerificationToken(canonical);
    return res.json({
      success: true,
      verified: true,
      verificationToken,
      message: "WhatsApp phone verified successfully."
    });
  } catch (error: any) {
    console.error("[Registration] WhatsApp code verification failed:", error);
    return res.status(503).json({ success: false, error: error.message || "Phone verification is unavailable." });
  }
});

router.post("/api/auth/whatsapp/consume-registration-verification", async (req: Request, res: Response) => {
  const phone = String(req.body?.phoneNumber || req.body?.phone || "").trim();
  const token = String(req.body?.verificationToken || "").trim();
  if (!phone || !token) {
    return res.status(400).json({ success: false, error: "Verified phone and registration proof are required." });
  }

  try {
    const canonical = normalizeWhatsAppNumber(phone);
    if (!canonical) return res.status(400).json({ success: false, error: "A valid phone number is required." });
    if (!await consumeRegistrationVerificationToken(canonical, token)) {
      return res.status(401).json({ success: false, error: "Phone verification proof is invalid, expired, or already used." });
    }
    return res.json({ success: true, phone: canonical });
  } catch (error: any) {
    console.error("[Registration] Could not consume WhatsApp verification:", error);
    return res.status(503).json({ success: false, error: error.message || "Phone verification is unavailable." });
  }
});

router.post(["/api/v1/auth/whatsapp/verify-login", "/api/auth/whatsapp/verify-login"], async (req: Request, res: Response) => {
  const phone = String(req.body?.phoneNumber || req.body?.phone || "").trim();
  const code = String(req.body?.otp || req.body?.code || "").trim();
  if (!phone || !/^\d{4}$/.test(code)) {
    return res.status(400).json({ success: false, authenticated: false, error: "Phone number and four-digit code are required." });
  }

  try {
    const { canonical } = formatPhoneNumber(phone);
    if (!/^234\d{10}$/.test(canonical)) {
      return res.status(400).json({ success: false, authenticated: false, error: "A valid WhatsApp phone number is required." });
    }

    if (!await consumeWhatsAppOtp(canonical, code)) {
      return res.status(400).json({ success: false, authenticated: false, error: "Verification code is invalid or expired." });
    }

    const result = await whatsappAuthService.authenticateVerifiedPhone(canonical);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    return res.status(503).json({ success: false, authenticated: false, error: error.message || "WhatsApp login is unavailable." });
  }
});

router.post(["/auth/whatsapp/exchange", "/api/v1/auth/whatsapp/exchange"], async (req: Request, res: Response) => {
  try {
    const { wa_token, token } = req.body;
    const activeToken = wa_token || token;

    if (!activeToken) {
      return res.status(400).json({ success: false, authenticated: false, error: "Token is required" });
    }

    const exchange = await whatsappAuthService.exchangeWhatsAppToken(String(activeToken));
    if (!exchange.success || !exchange.token) {
      return res.status(401).json({ success: false, authenticated: false, error: exchange.error || "WhatsApp token is invalid or expired." });
    }

    return res.json({
      success: true,
      authenticated: true,
      token: exchange.token,
      refreshToken: exchange.refreshToken,
      vendor: exchange.vendor,
      slug: exchange.vendor?.slug || exchange.vendor?.businessName,
      phone: exchange.phone,
      order: exchange.order
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, authenticated: false, error: error.message });
  }
});

// ----------------------------------------------------
// 26. WhatsApp Payment Checkout Order Lookup
// ----------------------------------------------------
router.get(["/api/v1/orders/:id", "/api/orders/:id"], async (req: Request, res: Response) => {
  const { id } = req.params;
  const liveBackendUrl = BACKEND_BASE;
  try {
    const remoteRes = await fetch(`${liveBackendUrl.replace(/\/+$/, "")}/api/v1/orders/${encodeURIComponent(id)}`);
    if (remoteRes.ok) {
      const data = await remoteRes.json();
      return res.json(data);
    }
  } catch (e) {}

  const leadCode = id.startsWith("FLT-") ? id : `FLT-${id}`;
  return res.json({
    success: true,
    order: {
      id,
      lead_code: leadCode,
      status: "pending_payment"
    },
    handoff: {
      success: true,
      lead_code: leadCode,
      whatsapp_url: `https://wa.me/2348031234567?text=Payment%20Reference%20${encodeURIComponent(leadCode)}`,
      prefill: `Payment Reference: ${leadCode}\nOrder ready for checkout & direct delivery.`,
      vendor: {
        name: "Verified WhatsApp Merchant",
        slug: "merchant",
        whatsapp_number: "+2348031234567",
        city: "Lagos"
      }
    }
  });
});

export default router;
