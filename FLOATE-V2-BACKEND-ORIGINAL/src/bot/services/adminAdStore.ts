import { applicationDefault, cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "../../../firebase-applet-config.json";
import { uploadImageToCloudinary } from "./cloudinaryService.js";

type AdRecord = Record<string, unknown> & { id: string };

const legacyStorefrontAds: AdRecord[] = [
  {
    id: "ad_cv_megahub",
    merchantName: "Computer Village MegaHub",
    headline: "Direct Lagos Tech Wholesale & Fast Dispatch",
    description: "Source verified laptops, smartphones, and accessories with same-day Lagos dispatch and nationwide waybill.",
    ctaText: "Shop now",
    adType: "HERO_BANNER",
    designedBannerUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&h=200&q=80",
    targetUrl: "https://floate.xyz/search?category=Smartphones%20%26%20Gadgets",
    status: "ACTIVE",
    targetCities: ["Lagos"],
    targetCategories: ["Smartphones & Gadgets"],
    keywords: ["phones", "gadgets", "wholesale"],
    impressions: 0,
    clicks: 0,
    submittedVia: "ADMIN_MANUAL",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "ad_onitsha_direct",
    merchantName: "Onitsha Main Market Direct",
    headline: "Premium Footwear, Shoes & Native Fashion",
    description: "Browse verified footwear artisans and textile stalls with direct WhatsApp pricing.",
    ctaText: "Shop now",
    adType: "HERO_BANNER",
    designedBannerUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&h=200&q=80",
    targetUrl: "https://floate.xyz/search?category=Footwear%20%26%20Shoes",
    status: "ACTIVE",
    targetCities: ["Onitsha"],
    targetCategories: ["Footwear & Shoes"],
    keywords: ["shoes", "fashion", "footwear"],
    impressions: 0,
    clicks: 0,
    submittedVia: "ADMIN_MANUAL",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "ad_alaba_wholesale",
    merchantName: "Alaba International Wholesale",
    headline: "Home Appliances, Solar Inverters & Sound Systems",
    description: "Direct importer catalog with verified physical warranty and doorstep delivery.",
    ctaText: "Shop now",
    adType: "HERO_BANNER",
    designedBannerUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&h=200&q=80",
    targetUrl: "https://floate.xyz/search?category=Home%20Appliances%20%26%20Sound",
    status: "ACTIVE",
    targetCities: ["Lagos"],
    targetCategories: ["Home Appliances & Sound"],
    keywords: ["appliances", "solar", "sound"],
    impressions: 0,
    clicks: 0,
    submittedVia: "ADMIN_MANUAL",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
];

function getAdminApp() {
  const existingApp = getApps().find((app) => app.name === "floate-ads-admin");
  if (existingApp) return existingApp;

  const rawServiceAccount =
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_CREDENTIALS_JSON ||
    process.env.GOOGLE_CREDENTIALS;
  let credential;
  if (rawServiceAccount) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawServiceAccount) as Record<string, unknown>;
    } catch {
      throw new Error("Firebase Admin service-account JSON is invalid.");
    }

    if (typeof parsed.client_email !== "string" || typeof parsed.private_key !== "string") {
      throw new Error("Firebase Admin service-account JSON must include client_email and private_key.");
    }
    const serviceAccount: ServiceAccount = {
      projectId: typeof parsed.project_id === "string" ? parsed.project_id : firebaseConfig.projectId,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    };
    credential = cert(serviceAccount);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE || process.env.GAE_ENV) {
    credential = applicationDefault();
  } else {
    throw new Error("Firebase Admin credentials are not configured. Set FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON on the backend.");
  }

  return initializeApp(
    {
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.trim() || firebaseConfig.storageBucket,
    },
    "floate-ads-admin"
  );
}

function adsCollection() {
  return getFirestore(getAdminApp(), firebaseConfig.firestoreDatabaseId).collection("ads");
}

function boostRequestsCollection() {
  return getFirestore(getAdminApp(), firebaseConfig.firestoreDatabaseId).collection("boost_requests");
}

export async function migrateLegacyStorefrontAds(): Promise<void> {
  const db = getFirestore(getAdminApp(), firebaseConfig.firestoreDatabaseId);
  const marker = db.collection("system_migrations").doc("legacy_storefront_ads_v1");
  await db.runTransaction(async (transaction) => {
    const markerSnapshot = await transaction.get(marker);
    if (markerSnapshot.exists) return;

    const references = legacyStorefrontAds.map((ad) => adsCollection().doc(ad.id));
    const existingAds = await Promise.all(references.map((reference) => transaction.get(reference)));
    existingAds.forEach((snapshot, index) => {
      if (!snapshot.exists) transaction.create(references[index], legacyStorefrontAds[index]);
    });
    transaction.create(marker, { completedAt: new Date().toISOString() });
  });
}

export async function listAds(): Promise<AdRecord[]> {
  const snapshot = await adsCollection().get();
  return snapshot.docs
    .map((document) => ({ ...document.data(), id: document.id }) as AdRecord)
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
}

export async function getAd(id: string): Promise<AdRecord | null> {
  const snapshot = await adsCollection().doc(id).get();
  return snapshot.exists ? ({ ...snapshot.data(), id: snapshot.id } as AdRecord) : null;
}

export async function saveAd(ad: AdRecord): Promise<void> {
  await adsCollection().doc(ad.id).set(ad);
}

export async function updateAd(id: string, updates: AdRecord): Promise<void> {
  await adsCollection().doc(id).set(updates, { merge: true });
}

export async function deleteAd(id: string): Promise<void> {
  await adsCollection().doc(id).delete();
}

export async function recordAdEvent(id: string, event: "view" | "click"): Promise<boolean> {
  const ad = adsCollection().doc(id);
  return ad.firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ad);
    if (!snapshot.exists || snapshot.data()?.status !== "ACTIVE") return false;

    const data = snapshot.data() || {};
    const impressions = Number(data.impressions || 0);
    const purchasedViews = Number(data.purchasedViews || 0);
    if (event === "view" && purchasedViews > 0 && impressions >= purchasedViews) {
      transaction.update(ad, { status: "EXPIRED", updatedAt: new Date().toISOString() });
      return false;
    }

    const reachesViewLimit = event === "view" && purchasedViews > 0 && impressions + 1 >= purchasedViews;
    transaction.update(ad, {
      [event === "view" ? "impressions" : "clicks"]: FieldValue.increment(1),
      ...(reachesViewLimit ? { status: "EXPIRED", updatedAt: new Date().toISOString() } : {}),
    });
    return true;
  });
}

export async function saveBoostRequest(request: Record<string, unknown> & { txRef: string }): Promise<void> {
  await boostRequestsCollection().doc(request.txRef).set(request, { merge: true });
}

export async function getBoostRequest(txRef: string): Promise<Record<string, unknown> | null> {
  const snapshot = await boostRequestsCollection().doc(txRef).get();
  return snapshot.exists ? { ...snapshot.data(), id: snapshot.id } : null;
}

export async function listBoostRequests(): Promise<Record<string, unknown>[]> {
  const snapshot = await boostRequestsCollection().get();
  return snapshot.docs
    .map((document) => ({ ...document.data(), id: document.id }))
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
}

export async function uploadAdImage(buffer: Buffer, folder = "floate/admin-ads"): Promise<string> {
  return uploadImageToCloudinary(buffer, { folder, mimeType: "image/jpeg" });
}
