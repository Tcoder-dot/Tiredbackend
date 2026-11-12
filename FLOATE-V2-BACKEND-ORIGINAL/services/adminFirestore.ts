import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import firebaseConfig from "../firebase-applet-config.json";

dotenv.config();

const serviceAccountJson =
  process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON ||
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const adminAppName = "floate-private-verification";
const existingApp = getApps().find((app) => app.name === adminAppName);
const serviceAccount = serviceAccountJson
  ? JSON.parse(serviceAccountJson) as {
      project_id?: string;
      client_email: string;
      private_key: string;
    }
  : null;

if (serviceAccount && (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key)) {
  throw new Error("Firebase Admin service-account JSON must include project_id, client_email, and private_key.");
}

const adminApp = existingApp || initializeApp({
  credential: serviceAccount
    ? cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, "\n")
      })
    : applicationDefault(),
  projectId: serviceAccount?.project_id || firebaseConfig.projectId
}, adminAppName);

export const adminFirestoreDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
