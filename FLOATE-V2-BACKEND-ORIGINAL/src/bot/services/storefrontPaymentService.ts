import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "./firestoreService.js";
import { normalizeWhatsAppNumber } from "../../utils/whatsapp.js";

const PRODUCT_SLOT_PRICE_NGN = 1000;
const PRODUCT_SLOT_COUNT = 5;
const PRODUCT_BOOST_PRICE_PER_DAY_NGN = 500;
const MAX_PRODUCT_BOOST_DAYS = 365;
const PAYMENT_COLLECTION = "storefront_payments";
const WEBHOOK_EVENT_COLLECTION = "bachs_webhook_events";

type StorefrontPurchaseType = "PRODUCT_SLOTS" | "PRODUCT_BOOST";

interface StorefrontPaymentRecord {
  reference: string;
  merchantPhone: string;
  merchantDocId: string;
  merchantCollection: string;
  merchantSlug: string;
  type: StorefrontPurchaseType;
  productId?: string;
  durationDays?: number;
  amountNaira: number;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REVIEW";
  checkoutId?: string;
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
}) {
  const merchantPhone = normalizePhone(input.merchantPhone);
  const type = input.type === "PRODUCT_SLOTS" || input.type === "PRODUCT_BOOST"
    ? input.type
    : null;
  if (!merchantPhone || !type) {
    throw new Error("A registered merchant and valid purchase type are required.");
  }

  const merchant = await findMerchant(merchantPhone);
  if (!merchant) {
    throw new Error("No registered merchant matches this WhatsApp number.");
  }

  let productId: string | undefined;
  let durationDays: number | undefined;
  let amountNaira: number;

  if (type === "PRODUCT_SLOTS") {
    amountNaira = PRODUCT_SLOT_PRICE_NGN;
  } else {
    productId = String(input.productId || "").trim();
    durationDays = Number(input.durationDays);
    if (!productId || !Number.isInteger(durationDays) || durationDays < 1 || durationDays > MAX_PRODUCT_BOOST_DAYS) {
      throw new Error(`Choose a product and a boost duration between 1 and ${MAX_PRODUCT_BOOST_DAYS} days.`);
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
    amountNaira = PRODUCT_BOOST_PRICE_PER_DAY_NGN * durationDays;
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
    amountNaira,
    status: "PENDING",
    createdAt: now,
    updatedAt: now
  };
  const paymentRef = doc(db, PAYMENT_COLLECTION, reference);
  await setDoc(paymentRef, payment);

  const siteUrl = (process.env.PUBLIC_SITE_URL || "https://www.floate.xyz").replace(/\/+$/, "");
  try {
    const checkout = await bachsRequest("/v1/checkout-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": reference
      },
      body: JSON.stringify({
        pricing: { currency: "NGN", amount: amountNaira.toFixed(2) },
        reference,
        metadata: {
          floate_payment_reference: reference,
          purchase_type: type,
          merchant_phone: merchantPhone,
          ...(productId ? { product_id: productId } : {}),
          ...(durationDays ? { duration_days: String(durationDays) } : {})
        },
        success_url: buildReturnUrl(siteUrl, merchant.slug, reference, "success"),
        cancel_url: buildReturnUrl(siteUrl, merchant.slug, reference, "cancelled")
      })
    });
    const checkoutId = String(checkout.checkout_id || checkout.data?.checkout_id || "");
    const checkoutUrl = String(checkout.checkout_url || checkout.data?.checkout_url || "");
    if (!checkoutId || !checkoutUrl) {
      throw new Error("Bachs did not return a usable checkout session.");
    }

    await updateDoc(paymentRef, { checkoutId, updatedAt: new Date().toISOString() });
    return { success: true, reference, checkoutId, checkoutUrl, amountNaira, type };
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

  const eventRef = doc(db, WEBHOOK_EVENT_COLLECTION, eventId);
  const merchantRef = doc(db, payment.merchantCollection, payment.merchantDocId);
  const productRef = payment.productId ? doc(db, "products", payment.productId) : null;
  const now = new Date();

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
      transaction.set(eventRef, { id: eventId, reference, processedAt: now.toISOString() });
      return;
    }
    if (currentData.status !== "PENDING" || !merchantSnapshot.exists()) {
      throw new Error("Floate purchase is not eligible for fulfillment.");
    }

    if (currentData.type === "PRODUCT_SLOTS") {
      const merchantData = merchantSnapshot.data();
      const purchasedSlots = Number(merchantData.paidProductSlots || 0);
      transaction.update(merchantRef, {
        paidProductSlots: purchasedSlots + PRODUCT_SLOT_COUNT,
        updatedAt: now.toISOString()
      });
    } else {
      if (!productRef || !productSnapshot?.exists()) {
        throw new Error("The product paid for by this boost could not be found.");
      }
      const product = productSnapshot.data();
      if (normalizePhone(product.vendorPhone || product.whatsapp || product.whatsappNumber || product.phone) !== payment.merchantPhone) {
        throw new Error("The product owner does not match the merchant who paid.");
      }
      const existingExpiry = Date.parse(String(product.boostedUntil || ""));
      const boostStartsAt = Number.isFinite(existingExpiry) && existingExpiry > now.getTime()
        ? existingExpiry
        : now.getTime();
      const boostedUntil = new Date(boostStartsAt + Number(payment.durationDays) * 24 * 60 * 60 * 1000).toISOString();
      transaction.update(productRef, {
        isBoosted: true,
        boostedUntil,
        boostPaymentReference: reference,
        updatedAt: now.toISOString()
      });

      const embeddedProducts = Array.isArray(merchantSnapshot.data().products)
        ? merchantSnapshot.data().products
        : [];
      const updatedProducts = embeddedProducts.map((item: any) =>
        String(item.id || "") === payment.productId
          ? { ...item, isBoosted: true, boostedUntil, boostPaymentReference: reference }
          : item
      );
      if (embeddedProducts.some((item: any) => String(item.id || "") === payment.productId)) {
        transaction.update(merchantRef, { products: updatedProducts, updatedAt: now.toISOString() });
      }
    }

    transaction.update(paymentRef, {
      status: "SUCCEEDED",
      paidAt: now.toISOString(),
      checkoutId,
      updatedAt: now.toISOString()
    });
    transaction.set(eventRef, { id: eventId, reference, processedAt: now.toISOString() });
  });

  return { received: true, processed: true };
}

export async function getStorefrontPaymentStatus(reference: string, authenticatedPhones: string[]) {
  const snapshot = await getDoc(doc(db, PAYMENT_COLLECTION, reference));
  if (!snapshot.exists()) return null;
  const payment = snapshot.data() as StorefrontPaymentRecord;
  if (!authenticatedPhones.includes(payment.merchantPhone)) return null;
  return {
    reference: payment.reference,
    status: payment.status,
    type: payment.type,
    amountNaira: payment.amountNaira,
    durationDays: payment.durationDays
  };
}
