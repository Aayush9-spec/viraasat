import 'server-only';
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    // docs/secrets.md stores this base64-encoded. Fall back to raw JSON
    // parsing in case the env is set as plain JSON (e.g. local dev).
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      return JSON.parse(decoded) as ServiceAccount;
    } catch {
      return JSON.parse(raw) as ServiceAccount;
    }
  } catch (error) {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT_JSON is invalid; Firebase Admin functions are disabled.',
      error,
    );
    return null;
  }
}

const serviceAccount = loadServiceAccount();

let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

if (serviceAccount) {
  try {
    const app =
      getApps().length > 0 ? getApp() : initializeApp({ credential: cert(serviceAccount) });
    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
  } catch (error) {
    console.warn('Failed to initialize Firebase Admin; Firebase Admin functions are disabled.', error);
  }
} else {
  console.warn(
    'FIREBASE_SERVICE_ACCOUNT_JSON is not set; server-side writes (orders, webhooks, auth bridge) are disabled.',
  );
}

export { adminDb, adminAuth };

export function isAdminConfigured(): boolean {
  return adminDb !== null && adminAuth !== null;
}