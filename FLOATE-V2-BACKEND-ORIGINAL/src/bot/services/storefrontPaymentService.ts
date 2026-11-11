import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc,
  type DocumentReference
} from "firebase/firestore";
import { db } from "./firestoreService.js";
import { normalizeWhatsAppNumber } from "../../utils/whatsapp.js";
import { flutterwaveService } from "./flutterwaveService.js";

const PRODUCT_SLOT_PRICE_NGN = 1000;
const PRODUCT_SLOT_COUNT = 5;
const PRODUCT_BOOST_PRICE_PER_DAY_NGN = 500;
const VERIFIED_BADGE_PRICE_NGN = 7000;
const BUSINESS_AD_PRICE_PER_THOUSAND_VIEWS_NGN = 600;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DATE_MS = 8_640_000_000_000_000;
const PAYMENT_COLLECTION = "storefront_payments";
const WEBHOOK_EVENT_COLLECTION = "bachs_webhook_events";
const FLUTTERWAVE_EVENT_COLLECTION = "flutterwave_storefront_events";

type StorefrontPurchaseType = "PRODUCT_SLOTS" | "PRODUCT_BOOST" | "VERIFIED_BADGE" | "BUSINESS_AD";

interface BusinessAdDetails {
  merchantName: string;
  headline: string;
  description: string;
  ctaText: string;
  targetUrl: string;
  bannerUrl: string;
  productTitle?: string;
  productId?: string;
  targetCities: string[];
  targetCategories: string[];
}

interface StorefrontPaymentRecord {
  reference: string;
  merchantPhone: string;
  merchantDocId: string;
  merchantCollection: string;
  merchantSlug: string;
  type: StorefrontPurchaseType;
  productId?: string;
  durationDays?: number;
  impressionThousands?: number;
  adDetails?: BusinessAdDetails;
  amountNaira: number;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REVIEW";
  checkoutId?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

function getBachsConfig() {
  const apiKey = process.env.BACHS_API_KEY || "";
  const baseUrl = (process.env.BACHS_BASE_URL ||
    (apiKey.startsWith("sk_live_")
      ? "https://api.bachs.io"
      : "https://sandbox-api.bachs.io")).replace(/\/+$/, "");
  const webhookSecret = process.env.BACHS_WEBHOOK_SECRET || "";
  return { apiKey, baseUrl, webhookSecret };
}

function normalizePhone(value: unknown): string {
  return normalizeWhatsAppNumber(value) || "";
}

async function findMerchant(phone: string) {
  for (const collectionName of ["businesses", "merchants"]) {
    const snapshot = await getDocs(collection(db, collectionName));
    const match = snapshot.docs.find((merchantDoc) => {
      const merchant = merchantDoc.data();
      return normalizePhone(
        merchant.whatsappNumber || merchant.whatsapp || merchant.phone || merchant.whatsapp_number
      ) === phone;
    });
    if (match) {
      const data = match.data();
      const name = String(data.businessName || data.name || "Floate Merchant");
      const slug = String(data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
      return { ref: match.ref, id: match.id, collectionName, data, name, slug };
    }
  }
  return null;
}

function buildReturnUrl(siteUrl: string, slug: string, reference: string, paymentStatus: "success" | "cancelled") {
  const url = new URL("/merchant/dashboard", siteUrl);
  url.searchParams.set("slug", slug);
  url.searchParams.set("payment", paymentStatus);
  url.searchParams.set("ref", reference);
  return url.toString();
}

async function bachsRequest(path: string, init: RequestInit) {
  const { apiKey, baseUrl } = getBachsConfig();
  if (!apiKey) {
    throw new Error("Bachs checkout is not configured. Add BACHS_API_KEY to the backend environment.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`[Bachs] API request failed (${response.status}):`, data?.error || data?.message || "Unknown error");
    throw new Error("Bachs could not start this checkout. Please try again.");
  }
  return data;
}

export async function createStorefrontCheckout(input: {
  merchantPhone: unknown;
  type: unknown;
  productId?: unknown;
  durationDays?: unknown;
  impressionThousands?: unknown;
  adDetails?: unknown;
}) {
  const merchantPhone = normalizePhone(input.merchantPhone);
  const purchaseTypes: StorefrontPurchaseType[] = ["PRODUCT_SLOTS", "PRODUCT_BOOST", "VERIFIED_BADGE", "BUSINESS_AD"];
  const type = purchaseTypes.find((purchaseType) => purchaseType === input.type) || null;
  if (!merchantPhone || !type) {
    throw new Error("A registered merchant and valid purchase type are required.");
  }

  const merchant = await findMerchant(merchantPhone);
  if (!merchant) {
    throw new Error("No registered merchant matches this WhatsApp number.");
  }

  let productId: string | undefined;
  let durationDays: number | undefined;
  let impressionThousands: number | undefined;
  let adDetails: BusinessAdDetails | undefined;
  let amountNaira: number;

  if (type === "PRODUCT_SLOTS") {
    amountNaira = PRODUCT_SLOT_PRICE_NGN;
  } else if (type === "PRODUCT_BOOST") {
    productId = String(input.productId || "").trim();
    durationDays = Number(input.durationDays);
    if (!productId || !Number.isSafeInteger(durationDays) || durationDays < 1 ||
        !Number.isSafeInteger(PRODUCT_BOOST_PRICE_PER_DAY_NGN * durationDays)) {
      throw new Error("Choose a product and a valid positive whole number of boost days.");
    }

    const productSnapshot = await getDoc(doc(db, "products", productId));
    if (!productSnapshot.exists()) {
      throw new Error("The selected product could not be found.");
    }
    const product = productSnapshot.data();
    const productPhone = normalizePhone(
      product.vendorPhone || product.whatsapp || product.whatsappNumber || product.phone
    );
    if (productPhone !== merchantPhone) {
      throw new Error("You can only boost a product belonging to your own business.");
    }
    const activeBoostExpiry = Date.parse(String(product.boostedUntil || ""));
    const boostStartsAt = Number.isFinite(activeBoostExpiry) && activeBoostExpiry > Date.now()
      ? activeBoostExpiry
      : Date.now();
    if (boostStartsAt + durationDays * DAY_MS > MAX_DATE_MS) {
      throw new Error("The selected boost duration is outside the supported date range.");
    }
    amountNaira = PRODUCT_BOOST_PRICE_PER_DAY_NGN * durationDays;
  } else if (type === "VERIFIED_BADGE") {
    amountNaira = VERIFIED_BADGE_PRICE_NGN;
  } else {
    const raw = input.adDetails && typeof input.adDetails === "object"
      ? input.adDetails as Record<string, unknown>
      : {};
    const headline = String(raw.headline || "").trim().slice(0, 180);
    const description = String(raw.description || "").trim().slice(0, 600);
    const ctaText = String(raw.ctaText || "Shop now").trim().slice(0, 60);
    const targetUrl = String(raw.targetUrl || "").trim().slice(0, 2048);
    const bannerUrl = String(raw.bannerUrl || "").trim().slice(0, 2048);
    const targetCities = Array.isArray(raw.targetCities)
      ? raw.targetCities.map((item) => String(item).trim()).filter(Boolean).slice(0, 50)
      : [];
    const targetCategories = Array.isArray(raw.targetCategories)
      ? raw.targetCategories.map((item) => String(item).trim()).filter(Boolean).slice(0, 50)
      : [];
    impressionThousands = Number(input.impressionThousands);
    if (!headline || !targetUrl || !bannerUrl) {
      throw new Error("Provide an ad headline, destination link, and banner image.");
    }
    if (!Number.isSafeInteger(impressionThousands) || impressionThousands < 1 ||
        !Number.isSafeInteger(impressionThousands * 1000) ||
        !Number.isSafeInteger(impressionThousands * BUSINESS_AD_PRICE_PER_THOUSAND_VIEWS_NGN)) {
      throw new Error("Choose a valid positive whole number of 1,000-view blocks.");
    }
    let parsedTarget: URL;
    let parsedBanner: URL;
    try {
      parsedTarget = new URL(targetUrl);
      parsedBanner = new URL(bannerUrl);
    } catch {
      throw new Error("The ad destination and banner must be valid URLs.");
    }
    if (!["http:", "https:"].includes(parsedTarget.protocol) ||
        parsedBanner.protocol !== "https:" ||
        parsedBanner.hostname !== "res.cloudinary.com") {
      throw new Error("Use an HTTP(S) destination and an uploaded Floate banner image.");
    }

    productId = String(raw.productId || "").trim() || undefined;
    let productTitle: string | undefined;
    if (productId) {
      const productSnapshot = await getDoc(doc(db, "products", productId));
      if (!productSnapshot.exists()) throw new Error("The selected ad product could not be found.");
      const product = productSnapshot.data();
      const productPhone = normalizePhone(
        product.vendorPhone || product.whatsapp || product.whatsappNumber || product.phone
      );
      if (productPhone !== merchantPhone) {
        throw new Error("You can only advertise a product belonging to your own business.");
      }
      productTitle = String(product.title || product.name || "").trim();
    }

    adDetails = {
      merchantName: merchant.name,
      headline,
      description,
      ctaText: ctaText || "Shop now",
      targetUrl,
      bannerUrl,
      ...(productId ? { productId, productTitle } : {}),
      targetCities,
      targetCategories,
    };
    amountNaira = impressionThousands * BUSINESS_AD_PRICE_PER_THOUSAND_VIEWS_NGN;
  }

  const reference = `FLT-${randomUUID().replace(/-/g, "").toUpperCase()}`;
  const now = new Date().toISOString();
  const payment: StorefrontPaymentRecord = {
    reference,
    merchantPhone,
    merchantDocId: merchant.id,
    merchantCollection: merchant.collectionName,
    merchantSlug: merchant.slug,
    type,
    ...(productId ? { productId } : {}),
    ...(durationDays ? { durationDays } : {}),
    ...(impressionThousands ? { impressionThousands } : {}),
    ...(adDetails ? { adDetails } : {}),
    amountNaira,
    status: "PENDING",
    createdAt: now,
    updatedAt: now
  };
  const paymentRef = doc(db, PAYMENT_COLLECTION, reference);
  await setDoc(paymentRef, payment);

  const siteUrl = (process.env.PUBLIC_SITE_URL || "https://www.floate.xyz").replace(/\/+$/, "");
  try {
    if (!process.env.FLW_SECRET_KEY) {
      throw new Error("Flutterwave checkout is not configured. Add FLW_SECRET_KEY to the backend environment.");
    }
    const checkout = await flutterwaveService.createPaymentLink({
      txRef: reference,
      amount: amountNaira,
      customerPhone: merchantPhone,
      customerName: merchant.name,
      customerEmail: String(merchant.data.email || merchant.data.emailAddress || `merchant_${merchantPhone}@floate.xyz`),
      title: `Floate • ${type === "PRODUCT_SLOTS" ? "5 product slots" :
        type === "PRODUCT_BOOST" ? `${durationDays} day product boost` :
        type === "VERIFIED_BADGE" ? "3-month verified badge" : "merchant ad campaign"}`,
      description: type === "BUSINESS_AD"
        ? `${impressionThousands} x 1,000 ad views for ${merchant.name}`
        : `Floate merchant purchase for ${merchant.name}`,
      redirectUrl: buildReturnUrl(siteUrl, merchant.slug, reference, "success"),
      meta: {
        floate_payment_reference: reference,
        purchase_type: type,
        merchant_phone: merchantPhone,
        ...(productId ? { product_id: productId } : {}),
        ...(durationDays ? { duration_days: String(durationDays) } : {}),
        ...(impressionThousands ? { impression_thousands: String(impressionThousands) } : {})
      }
    });
    let checkoutUrl: URL;
    try {
      checkoutUrl = new URL(checkout.paymentLink);
    } catch {
      throw new Error("Flutterwave did not return a usable checkout session.");
    }
    if (checkoutUrl.protocol !== "https:" ||
        (checkoutUrl.hostname !== "flutterwave.com" && !checkoutUrl.hostname.endsWith(".flutterwave.com"))) {
      throw new Error("Flutterwave did not return a valid hosted checkout link.");
    }

    await updateDoc(paymentRef, { updatedAt: new Date().toISOString() });
    return { success: true, reference, checkoutUrl: checkoutUrl.toString(), amountNaira, type };
  } catch (error) {
    await updateDoc(paymentRef, { status: "FAILED", updatedAt: new Date().toISOString() });
    throw error;
  }
}

function verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>) {
  const { webhookSecret } = getBachsConfig();
  if (!webhookSecret) {
    throw new Error("Bachs webhook is not configured.");
  }

  const signatureV2 = String(headers["x-bachs-signature-v2"] || "");
  const legacySignature = String(headers["x-bachs-signature"] || "");
  const standaloneTimestamp = String(headers["x-bachs-timestamp"] || "");
  const parts = signatureV2.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2) || standaloneTimestamp;
  const signatures = [
    ...parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3)),
    ...(legacySignature ? [legacySignature] : [])
  ];

  if (!timestamp || !/^\d+$/.test(timestamp) || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = createHmac("sha256", webhookSecret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest();
  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const provided = Buffer.from(signature, "hex");
    return provided.length === expected.length && timingSafeEqual(expected, provided);
  });
}

async function fulfillStorefrontPayment(
  paymentRef: DocumentReference,
  payment: StorefrontPaymentRecord,
  eventCollection: string,
  eventId: string,
  providerDetails: { checkoutId?: string; transactionId?: string } = {}
) {
  const eventRef = doc(db, eventCollection, eventId);
  const merchantRef = doc(db, payment.merchantCollection, payment.merchantDocId);
  const productRef = payment.productId ? doc(db, "products", payment.productId) : null;
  const campaignRef = payment.type === "BUSINESS_AD"
    ? doc(db, "ads", `ad_${payment.reference.toLowerCase()}`)
    : null;
  const now = new Date();
  const nowIso = now.toISOString();

  await runTransaction(db, async (transaction) => {
    const [existingEvent, currentPayment, merchantSnapshot, productSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(paymentRef),
      transaction.get(merchantRef),
      productRef ? transaction.get(productRef) : Promise.resolve(null)
    ]);

    if (existingEvent.exists() || !currentPayment.exists()) return;
    const currentData = currentPayment.data() as StorefrontPaymentRecord;
    if (currentData.status === "SUCCEEDED") {
      transaction.set(eventRef, { id: eventId, reference: payment.reference, processedAt: nowIso });
      return;
    }
    if (currentData.status !== "PENDING" || !merchantSnapshot.exists()) {
      throw new Error("Floate purchase is not eligible for fulfillment.");
    }

    if (currentData.type === "PRODUCT_SLOTS") {
      transaction.update(merchantRef, {
        paidProductSlots: Number(merchantSnapshot.data().paidProductSlots || 0) + PRODUCT_SLOT_COUNT,
        updatedAt: nowIso
      });
    } else if (currentData.type === "PRODUCT_BOOST") {
      if (!productRef || !productSnapshot?.exists()) {
        throw new Error("The product paid for by this boost could not be found.");
      }
      const product = productSnapshot.data();
      if (normalizePhone(product.vendorPhone || product.whatsapp || product.whatsappNumber || product.phone) !== currentData.merchantPhone) {
        throw new Error("The product owner does not match the merchant who paid.");
      }
      const existingExpiry = Date.parse(String(product.boostedUntil || ""));
      const boostStartsAt = Number.isFinite(existingExpiry) && existingExpiry > now.getTime()
        ? existingExpiry
        : now.getTime();
      const boostExpiry = boostStartsAt + Number(currentData.durationDays) * DAY_MS;
      if (boostExpiry > MAX_DATE_MS) {
        throw new Error("The product boost duration exceeds the supported date range.");
      }
      const boostedUntil = new Date(boostExpiry).toISOString();
      transaction.update(productRef, {
        isBoosted: true,
        boostedUntil,
        boostPaymentReference: currentData.reference,
        updatedAt: nowIso
      });

      const embeddedProducts = Array.isArray(merchantSnapshot.data().products)
        ? merchantSnapshot.data().products
        : [];
      const updatedProducts = embeddedProducts.map((item: any) =>
        String(item.id || "") === currentData.productId
          ? { ...item, isBoosted: true, boostedUntil, boostPaymentReference: currentData.reference }
          : item
      );
      if (embeddedProducts.some((item: any) => String(item.id || "") === currentData.productId)) {
        transaction.update(merchantRef, { products: updatedProducts, updatedAt: nowIso });
      }
    } else if (currentData.type === "VERIFIED_BADGE") {
      const merchantData = merchantSnapshot.data();
      const existingExpiry = Date.parse(String(merchantData.paidVerificationBadgeExpiresAt || ""));
      const expiryBase = Number.isFinite(existingExpiry) && existingExpiry > now.getTime()
        ? new Date(existingExpiry)
        : now;
      expiryBase.setMonth(expiryBase.getMonth() + 3);
      transaction.update(merchantRef, {
        paidVerificationBadgeExpiresAt: expiryBase.toISOString(),
        updatedAt: nowIso
      });
    } else if (currentData.type === "BUSINESS_AD") {
      if (!campaignRef || !currentData.adDetails || !currentData.impressionThousands) {
        throw new Error("The paid ad campaign details are incomplete.");
      }
      const views = currentData.impressionThousands * 1000;
      transaction.set(campaignRef, {
        id: campaignRef.id,
        ...currentData.adDetails,
        designedBannerUrl: currentData.adDetails.bannerUrl,
        rawImageUrl: currentData.adDetails.bannerUrl,
        adType: "HERO_BANNER",
        displayMode: "MARQUEE",
        displayIntervalSeconds: 60,
        displayDurationSeconds: 8,
        scrollDurationSeconds: 28,
        status: "PENDING_REVIEW",
        impressions: 0,
        clicks: 0,
        purchasedViews: views,
        budget: currentData.amountNaira,
        amountPaid: currentData.amountNaira,
        paymentReference: currentData.reference,
        merchantPhone: currentData.merchantPhone,
        submittedVia: "MERCHANT_PAID",
        createdAt: nowIso,
        updatedAt: nowIso
      });
    }

    transaction.update(paymentRef, {
      status: "SUCCEEDED",
      paidAt: nowIso,
      ...(providerDetails.checkoutId ? { checkoutId: providerDetails.checkoutId } : {}),
      ...(providerDetails.transactionId ? { transactionId: providerDetails.transactionId } : {}),
      updatedAt: nowIso
    });
    transaction.set(eventRef, { id: eventId, reference: currentData.reference, processedAt: nowIso });
  });
}

export async function processBachsWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>) {
  if (!verifyWebhookSignature(rawBody, headers)) {
    throw new Error("Invalid Bachs webhook signature.");
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  const eventType = String(event.type || "").toLowerCase();
  if (!["checkout.completed", "collection.succeeded"].includes(eventType)) {
    return { received: true, processed: false };
  }

  const eventId = String(event.id || "");
  const data = event.data || {};
  const reference = String(
    data.reference || data.metadata?.floate_payment_reference || event.reference || ""
  ).trim();
  const checkoutId = String(data.checkout_id || "").trim();
  if (!eventId || !reference || !checkoutId) {
    throw new Error("Bachs payment event is missing its event ID, reference, or checkout ID.");
  }

  const paymentRef = doc(db, PAYMENT_COLLECTION, reference);
  const paymentSnapshot = await getDoc(paymentRef);
  if (!paymentSnapshot.exists()) {
    return { received: true, processed: false };
  }
  const payment = paymentSnapshot.data() as StorefrontPaymentRecord;
  if (payment.checkoutId && payment.checkoutId !== checkoutId) {
    throw new Error("Bachs checkout does not match the stored payment.");
  }

  const checkout = await bachsRequest(`/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`, {
    method: "GET"
  });
  const checkoutData = checkout.data || checkout;
  const checkoutStatus = String(checkoutData.status || "").toLowerCase();
  const checkoutAmount = Number(checkoutData.amount || checkoutData.pricing?.amount);
  const checkoutCurrency = String(checkoutData.currency || checkoutData.pricing?.currency || "").toUpperCase();
  if (checkoutStatus !== "completed") {
    throw new Error("Bachs has not confirmed that this checkout is complete.");
  }
  if (checkoutCurrency !== "NGN" || !Number.isFinite(checkoutAmount) || checkoutAmount !== payment.amountNaira) {
    await updateDoc(paymentRef, { status: "REVIEW", updatedAt: new Date().toISOString() });
    throw new Error("Bachs checkout amount or currency does not match the pending Floate purchase.");
  }

  await fulfillStorefrontPayment(paymentRef, payment, WEBHOOK_EVENT_COLLECTION, eventId, { checkoutId });

  return { received: true, processed: true };
}

export async function processFlutterwaveStorefrontPayment(input: {
  reference: string;
  transactionId?: string;
}) {
  const reference = input.reference.trim();
  if (!reference) throw new Error("Flutterwave payment reference is required.");
  const paymentRef = doc(db, PAYMENT_COLLECTION, reference);
  const snapshot = await getDoc(paymentRef);
  if (!snapshot.exists()) return { received: true, processed: false };
  const payment = snapshot.data() as StorefrontPaymentRecord;
  if (payment.status === "SUCCEEDED") return { received: true, processed: true };
  if (payment.status !== "PENDING") return { received: true, processed: false };

  const verification = input.transactionId
    ? await flutterwaveService.verifyTransaction(input.transactionId)
    : await flutterwaveService.verifyTransactionByRef(reference);
  const data = verification.data;
  if (data && String(data.tx_ref || "") === reference &&
      ["failed", "cancelled", "canceled"].includes(String(data.status || "").toLowerCase())) {
    await updateDoc(paymentRef, { status: "FAILED", updatedAt: new Date().toISOString() });
    return { received: true, processed: false };
  }
  if (!verification.success || !data) {
    if (input.transactionId) {
      throw new Error(verification.error || "Flutterwave has not confirmed this payment.");
    }
    console.info(`[Flutterwave] Payment ${reference} is not confirmed yet: ${verification.error || "pending"}`);
    return { received: true, processed: false };
  }
  if (String(data.tx_ref || "") !== reference ||
      String(data.currency || "").toUpperCase() !== "NGN" ||
      Number(data.amount) !== payment.amountNaira) {
    await updateDoc(paymentRef, { status: "REVIEW", updatedAt: new Date().toISOString() });
    throw new Error("Flutterwave payment details do not match the pending Floate purchase.");
  }
  const transactionId = String(data.id || input.transactionId || "");
  const eventId = transactionId || reference;
  await fulfillStorefrontPayment(
    paymentRef,
    payment,
    FLUTTERWAVE_EVENT_COLLECTION,
    eventId,
    { transactionId }
  );
  return { received: true, processed: true };
}

export async function getStorefrontPaymentStatus(reference: string, authenticatedPhones: string[]) {
  const snapshot = await getDoc(doc(db, PAYMENT_COLLECTION, reference));
  if (!snapshot.exists()) return null;
  let payment = snapshot.data() as StorefrontPaymentRecord;
  if (!authenticatedPhones.includes(payment.merchantPhone)) return null;
  if (payment.status === "PENDING") {
    await processFlutterwaveStorefrontPayment({ reference });
    const refreshed = await getDoc(doc(db, PAYMENT_COLLECTION, reference));
    if (refreshed.exists()) payment = refreshed.data() as StorefrontPaymentRecord;
  }
  return {
    reference: payment.reference,
    status: payment.status,
    type: payment.type,
    amountNaira: payment.amountNaira,
    durationDays: payment.durationDays,
    impressionThousands: payment.impressionThousands
  };
}
