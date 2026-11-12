import { Request, Response } from "express";
import { meiliClient, MERCHANTS_INDEX } from "../config/meilisearch";
import { extractCategoryIntent, FloateCategory } from "../services/intentExtractor";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export interface MerchantHit {
  id: string;
  name: string;
  businessName?: string;
  slug?: string;
  category: string;
  primaryCategory?: string;
  city: string;
  state: string;
  marketLocation?: string;
  whatsappNumber?: string;
  whatsapp?: string;
  isVerified?: boolean;
  verified?: boolean;
  rating?: number;
  completedEscrows?: number;
  bio?: string;
  avatarUrl?: string;
  product?: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  distanceText?: string;
  [key: string]: any;
}

function formatWhatsAppDirectLink(phone: string, businessName: string): string {
  const digits = (phone || "").replace(/[^0-9]/g, "");
  const intlPhone = digits.startsWith("0")
    ? "234" + digits.slice(1)
    : digits.startsWith("234")
    ? digits
    : digits
    ? "234" + digits
    : "";
  return intlPhone ? `https://wa.me/${intlPhone}?text=Hello%20${encodeURIComponent(businessName)},%20I%20saw%20your%20store%20on%20Floate` : "";
}

function getTwoLetterMonogram(name: string): string {
  if (!name) return "FL";
  const norm = name.trim().toUpperCase();
  const words = norm.replace(/[^A-Z0-9\s]/g, "").split(/\s+/).filter(w => !["THE", "AND", "&", "OF", "CO", "LTD", "NIGERIA"].includes(w));
  if (words.length >= 2) return words[0][0] + words[1][0];
  if (words.length === 1 && words[0].length >= 2) return words[0].slice(0, 2);
  return norm.slice(0, 2) || "FL";
}

// In-memory short cache for direct Firestore results to optimize latency
let firestoreMerchantsCache: MerchantHit[] = [];
let firestoreMerchantsCacheTime = 0;

export async function getLiveFirestoreMerchants(): Promise<MerchantHit[]> {
  const now = Date.now();
  if (now - firestoreMerchantsCacheTime < 5000) {
    return firestoreMerchantsCache;
  }
  try {
    const snapshot = await getDocs(collection(db, "public_catalog"));
    const list = snapshot.docs
      .map((document) => {
        const data = document.data();
        if (
          data.isPublished !== true ||
          data.isVerified !== true ||
          String(data.verificationStatus || "").toUpperCase() !== "APPROVED"
        ) return null;

        const name = String(data.businessName || data.name || "").trim();
        if (!name) return null;
        const phone = String(data.whatsapp || data.whatsappNumber || "");
        const location = String(data.marketLocation || data.location || [data.city, data.state].filter(Boolean).join(", "));
        return {
          id: String(data.id || document.id),
          name,
          businessName: name,
          slug: String(data.slug || data.businessId || document.id),
          category: String(data.category || "General"),
          primaryCategory: String(data.category || "General"),
          city: String(data.city || ""),
          state: String(data.state || ""),
          location,
          marketLocation: location,
          whatsappNumber: phone,
          whatsapp: phone,
          whatsappDeepLink: formatWhatsAppDirectLink(phone, name),
          initials: getTwoLetterMonogram(name),
          isVerified: true,
          verified: true,
          bio: String(data.description || ""),
          avatarUrl: String(data.profileImageUrl || ""),
          product: String(data.product || ""),
          price: String(data.price || "Contact for price"),
        } satisfies MerchantHit;
      })
      .filter((merchant) => merchant !== null);
    firestoreMerchantsCache = list;
    firestoreMerchantsCacheTime = now;
    return firestoreMerchantsCache;
  } catch (err: any) {
    console.error("Direct Firestore merchants query failed:", err.message);
    firestoreMerchantsCache = [];
    firestoreMerchantsCacheTime = 0;
    return [];
  }
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Multi-Tiered Search Controller connected directly to Firestore Database
 * Zero mock data, verbatim locations, no fabricated statistics
 */
export async function searchVendorsController(req: Request, res: Response) {
  try {
    const rawQuery = (
      typeof req.query.q === "string" ? req.query.q :
      typeof req.query.query === "string" ? req.query.query :
      typeof req.body?.query === "string" ? req.body.query :
      typeof req.body?.q === "string" ? req.body.q :
      ""
    ).trim();

    const userCity = typeof req.query.userCity === "string" ? req.query.userCity.trim() : (typeof req.body?.location === "string" ? req.body.location.trim() : "");
    const userLat = req.query.userLat ? parseFloat(String(req.query.userLat)) : undefined;
    const userLng = req.query.userLng ? parseFloat(String(req.query.userLng)) : undefined;
    const limit = parseInt((req.query.limit || req.body?.limit) as string, 10) || 50;

    // Load authentic merchants from live database
    const directMerchants = await getLiveFirestoreMerchants();

    // If query is empty, "all", or "market", return all registered businesses
    if (!rawQuery || rawQuery.toLowerCase() === "all" || rawQuery.toLowerCase() === "market") {
      const spotlights = directMerchants.slice(0, 6);
      const regulars = directMerchants.slice(6);
      return res.json({
        success: true,
        query: rawQuery,
        engine: "direct_firestore",
        totalMatches: directMerchants.length,
        results: directMerchants.slice(0, limit),
        spotlightMatches: spotlights,
        regularMatches: regulars,
        data: {
          totalMatches: directMerchants.length,
          results: directMerchants.slice(0, limit),
          spotlightMatches: spotlights,
          regularMatches: regulars
        }
      });
    }

    // 1. Extract category intent with semantic synonym resolution in <1ms
    const intent = extractCategoryIntent(rawQuery);
    
    const STOP_WORDS = new Set([
      "i", "a", "an", "the", "and", "or", "to", "in", "for", "of", "with", "at", "by", "from",
      "want", "need", "buy", "get", "looking", "look", "find", "where", "can", "how", "much",
      "is", "are", "me", "my", "you", "your", "please", "some", "any", "that", "this", "these",
      "those", "naira", "ngn", "kobo", "k", "thousand", "hundred", "budget", "price", "under", "below"
    ]);

    const qTokens = rawQuery
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 1 && !STOP_WORDS.has(t) && !/^\d+k?$/.test(t));

    // Semantic synonyms for high precision
    const synonymMap: Record<string, string[]> = {
      footwear: ["footwear", "shoe", "shoes", "sneaker", "sneakers", "slippers", "slides", "sandals", "palms", "leather"],
      shoes: ["shoe", "shoes", "sneaker", "sneakers", "footwear", "slippers", "slides", "sandals", "palms", "leather"],
      shoe: ["shoe", "shoes", "sneaker", "sneakers", "footwear", "slippers", "slides", "sandals", "palms", "leather"],
      slides: ["slides", "slippers", "sandals", "palms", "footwear", "shoes", "leather"],
      slippers: ["slides", "slippers", "sandals", "palms", "footwear", "shoes", "leather"],
      perfume: ["perfume", "perfumes", "scents", "fragrance", "cologne", "jewelries", "luxe", "gift"],
      perfumes: ["perfume", "perfumes", "scents", "fragrance", "cologne", "jewelries"],
      iphone: ["iphone", "iphones", "apple", "smartphones", "phones", "gadgets", "devices", "accessories"],
      smartphones: ["smartphone", "smartphones", "phones", "iphone", "samsung", "gadgets"],
      phones: ["phones", "phone", "smartphones", "iphone", "gadgets", "devices"],
      website: ["website", "software", "development", "web", "tech", "coding", "developer"],
      software: ["software", "website", "tech", "development", "developer", "solutions"],
      bags: ["bag", "bags", "handbag", "handbags", "tote", "dresses", "outfits", "boutique", "fashion"],
      bag: ["bag", "bags", "handbag", "handbags", "dresses", "boutique", "fashion"],
      fashion: ["fashion", "apparel", "dresses", "outfits", "clothes", "boutique", "gowns", "fabrics"],
      jewelries: ["jewelry", "jewelries", "perfumes", "decorations", "luxe", "scents"]
    };

    const expandedTokens = new Set<string>(qTokens);
    qTokens.forEach(t => {
      if (synonymMap[t]) {
        synonymMap[t].forEach(syn => expandedTokens.add(syn));
      }
    });
    const queryTokens = Array.from(expandedTokens);

    let candidates = directMerchants.filter(merchant => {
      const mCat = (merchant.primaryCategory || merchant.category || "").toLowerCase();
      const mName = (merchant.name || merchant.businessName || "").toLowerCase();
      const mBio = (merchant.bio || "").toLowerCase();
      const mProd = (merchant.product || "").toLowerCase();
      const mLoc = (merchant.location || merchant.marketLocation || "").toLowerCase();
      const mCats = Array.isArray(merchant.categories) ? merchant.categories.map((c: any) => String(c).toLowerCase()) : [];

      // Direct keyword matches across product, name, categories, bio, location
      const hasDirectKeywordMatch = queryTokens.length > 0 && queryTokens.some(token => 
        mName.includes(token) || 
        mProd.includes(token) || 
        mCat.includes(token) || 
        mBio.includes(token) || 
        mLoc.includes(token) ||
        mCats.some((c: string) => c.includes(token))
      );

      // If category intent was detected, strict category or product match
      if (intent.category) {
        const targetCat = intent.category.toLowerCase();
        const categoryMatches = 
          mCat.includes(targetCat) || 
          targetCat.includes(mCat) || 
          mCats.some((c: string) => c.includes(targetCat) || targetCat.includes(c));
        
        const productMatches = queryTokens.some(token => mProd.includes(token) || mName.includes(token));

        if (!categoryMatches && !productMatches) {
          return false;
        }
      }

      if (queryTokens.length > 0) {
        return (
          mName.includes(queryTokens[0]) ||
          mProd.includes(queryTokens[0]) ||
          mCat.includes(queryTokens[0]) ||
          queryTokens.some(token => mName.includes(token) || mProd.includes(token) || mCat.includes(token))
        );
      }

      return true;
    });

    // If direct candidate filtering yielded 0, search broadly across name, product, and location
    if (candidates.length === 0) {
      candidates = directMerchants.filter(merchant => {
        const combined = `${merchant.name} ${merchant.businessName} ${merchant.product} ${merchant.category} ${merchant.location}`.toLowerCase();
        return queryTokens.some(t => combined.includes(t));
      });
    }

    // Deduplicate
    const seenIds = new Set<string>();
    const deduplicated: typeof candidates = [];
    for (const item of candidates) {
      const id = String(item.id || item.slug || item.name).toLowerCase();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        deduplicated.push(item);
      }
    }

    const spotlights = deduplicated.slice(0, 3);
    const regulars = deduplicated.slice(3);

    const payload = {
      success: true,
      query: rawQuery,
      engine: "direct_firestore",
      userLocation: {
        city: userCity || null,
        lat: userLat || null,
        lng: userLng || null
      },
      detectedIntent: {
        category: intent.category,
        confidence: intent.confidence,
        matchedTokens: intent.matchedTokens
      },
      totalMatches: deduplicated.length,
      results: deduplicated.slice(0, limit),
      spotlightMatches: spotlights,
      regularMatches: regulars,
      exactMatches: spotlights,
      categoryMatches: regulars
    };

    return res.json({
      ...payload,
      data: payload
    });
  } catch (error: any) {
    console.error("Search Controller Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to execute vendor search",
      details: error.message
    });
  }
}

