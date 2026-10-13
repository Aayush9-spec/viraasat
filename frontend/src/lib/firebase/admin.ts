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

import fs from 'node:fs';
import path from 'node:path';

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();

  if (raw) {
    // 1. Try direct JSON parse if it looks like JSON
    if (raw.startsWith('{')) {
      try {
        return JSON.parse(raw) as ServiceAccount;
      } catch {
        // Continue to other formats
      }
    }

    // 2. Try base64 decoding
    try {
      const sanitized = raw.replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '');
      const decoded = Buffer.from(sanitized, 'base64').toString('utf8');
      if (decoded.trim().startsWith('{')) {
        return JSON.parse(decoded) as ServiceAccount;
      }
    } catch {
      // Continue to fallback
    }
  }

  // 3. Fallback to local service-account.json if present
  const candidatePaths = [
    path.resolve(process.cwd(), 'service-account.json'),
    path.resolve(process.cwd(), '../service-account.json'),
  ];

  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
        const fileContent = fs.readFileSync(/*turbopackIgnore: true*/ filePath, 'utf8');
        return JSON.parse(fileContent) as ServiceAccount;
      }
    } catch {
      // Continue checking
    }
  }

  return null;
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