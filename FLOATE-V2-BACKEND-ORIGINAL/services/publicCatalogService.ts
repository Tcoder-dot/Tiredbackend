import { createHash } from "node:crypto";
import type { WriteBatch } from "firebase-admin/firestore";
import { adminFirestoreDb } from "./adminFirestore.js";

const PUBLIC_CATALOG = "public_catalog";

type CatalogRecord = Record<string, unknown> & {
  id: string;
  businessId: string;
  isPublished: true;
  isVerified: true;
  verificationStatus: "APPROVED";
};

function isApproved(source: Record<string, any>): boolean {
  const status = String(
    source.verificationStatus || source.verification_status || source.verifiedStatus || ""
  ).toUpperCase();
  if (status) return status === "APPROVED" || status === "VERIFIED" || status === "YES";
  return source.isVerified === true || source.verified === true;
}

function cloudinaryUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com" ? url.toString() : "";
  } catch {
    return "";
  }
}

function safeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 900);
}

function publicRecord(
  businessId: string,
  business: Record<string, any>,
  product: Record<string, any> | null,
  id: string
): CatalogRecord {
  const businessName = String(business.businessName || business.name || product?.businessName || "");
  const profileImageUrl = cloudinaryUrl(
    business.profileImageUrl || business.profilePhotoUrl || business.avatarUrl || business.avatar_url
  );
  const imageUrl = cloudinaryUrl(
    product?.photo_url || product?.photoUrl || product?.imageUrl || product?.image ||
    (Array.isArray(product?.productImages) ? product.productImages[0] : "")
  );
  const rawNumericPrice = product?.numericPrice || product?.price_naira || product?.price || business.price || 0;
  const numericPrice = Number(String(rawNumericPrice).replace(/[^0-9.]/g, ""));
  const price = String(
    product?.formatted_price || product?.price || business.price || "Contact for price"
  );
  const city = String(product?.city || business.city || "");
  const state = String(product?.state || business.state || "");

  return {
    id,
    businessId,
    productId: product ? String(product.id || id) : "",
    businessName,
    name: businessName,
    slug: String(business.slug || business.merchantSlug || businessId),
    category: String(product?.category || business.category || business.primaryCategory || "General"),
    product: String(product?.product || product?.title || product?.name || business.product || ""),
    price,
    numericPrice: Number.isFinite(numericPrice) ? numericPrice : 0,
    description: String(product?.description || business.description || business.bio || ""),
    city,
    state,
    location: String(business.marketLocation || business.marketHub || [city, state].filter(Boolean).join(", ")),
    marketLocation: String(business.marketLocation || business.marketHub || [city, state].filter(Boolean).join(", ")),
    whatsapp: String(product?.whatsapp || product?.vendorPhone || business.whatsapp || business.whatsappNumber || business.phone || ""),
    whatsappNumber: String(product?.whatsappNumber || product?.vendorPhone || business.whatsappNumber || business.whatsapp || business.phone || ""),
    profileImageUrl,
    imageUrl,
    productImages: imageUrl ? [imageUrl] : [],
    isPublished: true,
    isVerified: true,
    verified: true,
    verificationStatus: "APPROVED",
    inStock: product?.in_stock !== false,
    createdAt: String(product?.createdAt || business.createdAt || ""),
    updatedAt: new Date().toISOString()
  };
}

async function commitInBatches(
  operations: Array<(batch: WriteBatch) => void>
): Promise<void> {
  for (let offset = 0; offset < operations.length; offset += 400) {
    const batch = adminFirestoreDb.batch();
    operations.slice(offset, offset + 400).forEach((operation) => operation(batch));
    await batch.commit();
  }
}

export async function removeBusinessFromPublicCatalog(businessId: string): Promise<void> {
  const snapshot = await adminFirestoreDb.collection(PUBLIC_CATALOG)
    .where("businessId", "==", businessId)
    .get();
  if (snapshot.empty) return;
  await commitInBatches(snapshot.docs.map((document) => (batch) => batch.delete(document.ref)));
}

export async function publishApprovedBusiness(businessId: string): Promise<void> {
  const businessSnapshot = await adminFirestoreDb.collection("businesses").doc(businessId).get();
  if (!businessSnapshot.exists) {
    await removeBusinessFromPublicCatalog(businessId);
    return;
  }

  const business = businessSnapshot.data() || {};
  if (!isApproved(business)) {
    await removeBusinessFromPublicCatalog(businessId);
    return;
  }

  const productsSnapshot = await adminFirestoreDb.collection("products")
    .where("vendorId", "==", businessId)
    .get();
  const products = productsSnapshot.docs.map((document) => ({
    id: document.id,
    ...document.data()
  }));
  const productEntries = products.length > 0
    ? products
    : business.initialProduct
      ? [{
          id: `initial_${businessId}`,
          product: business.initialProduct.name,
          price: business.initialProduct.price,
          description: business.initialProduct.description,
          imageUrl: business.initialProduct.image,
          city: business.city,
          state: business.state,
          whatsapp: business.whatsapp || business.whatsappNumber
        }]
      : [null];

  const records = productEntries.map((product) => {
    const productId = product ? String(product.id || product.productId || product.name || "product") : "business";
    const catalogId = `web_${safeId(businessId)}_${safeId(productId)}`;
    return { catalogId, record: publicRecord(businessId, business, product, catalogId) };
  });
  const existing = await adminFirestoreDb.collection(PUBLIC_CATALOG)
    .where("businessId", "==", businessId)
    .get();
  const desiredIds = new Set(records.map(({ catalogId }) => catalogId));
  const operations: Array<(batch: WriteBatch) => void> = [];

  for (const document of existing.docs) {
    if (!desiredIds.has(document.id)) operations.push((batch) => batch.delete(document.ref));
  }
  for (const { catalogId, record } of records) {
    const ref = adminFirestoreDb.collection(PUBLIC_CATALOG).doc(catalogId);
    operations.push((batch) => batch.set(ref, record, { merge: true }));
  }
  await commitInBatches(operations);
}

export async function publishWhatsAppListing(listing: Record<string, any>): Promise<void> {
  const phone = String(listing.whatsapp || "").replace(/\D/g, "");
  const identifier = phone || String(listing.userId || "").trim();
  if (!identifier) throw new Error("Cannot publish a WhatsApp listing without a stable business identifier.");
  const businessId = `whatsapp_${identifier}`;
  if (!isApproved(listing)) {
    await removeBusinessFromPublicCatalog(businessId);
    return;
  }
  const stableKey = `${businessId}|${listing.id || ""}|${listing.product || listing.businessName || ""}`;
  const id = `whatsapp_${createHash("sha256").update(stableKey).digest("hex").slice(0, 40)}`;
  const record = publicRecord(businessId, listing, listing, id);
  await adminFirestoreDb.collection(PUBLIC_CATALOG).doc(id).set(record, { merge: true });
}
