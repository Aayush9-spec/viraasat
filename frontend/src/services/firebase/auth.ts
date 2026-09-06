import { getAuth, type Auth } from "firebase/auth";
import { app } from "./config";

let _auth: Auth | null = null;

/**
 * Lazily initialised Firebase Auth instance.
 * Returns null (with a one-time warning) when the client config is absent so
 * that modules importing this file never throw at import / build time.
 */
export function getFirebaseAuth(): Auth | null {
  if (_auth) return _auth;
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return null;
  }
  try {
    _auth = getAuth(app);
    return _auth;
  } catch (error) {
    console.warn("Failed to initialise Firebase Auth:", error);
    return null;
  }
}

// Backward-compatible re-export: `auth` is null when the key is missing.
export const auth: Auth | null = getFirebaseAuth();
