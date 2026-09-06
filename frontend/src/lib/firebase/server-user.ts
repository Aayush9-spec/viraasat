import 'server-only';
import { adminDb } from './admin';
import type { User } from '@/types/user';

/**
 * Read a user document with privileged (Firebase Admin) access.
 * Uses the Clerk user id as the Firestore document id. Returns null when the
 * bridge is not configured or the document does not exist.
 */
export async function getServerUser(clerkUserId: string): Promise<User | null> {
  if (!adminDb || !clerkUserId) return null;
  try {
    const snapshot = await adminDb.collection('users').doc(clerkUserId).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data() ?? {};
    const now = new Date().toISOString();
    return {
      id: snapshot.id,
      clerkUserId: data.clerkUserId || snapshot.id,
      uid: data.uid || clerkUserId,
      name: data.name || '',
      email: data.email || '',
      imageUrl: data.imageUrl || '',
      role: data.role,
      cart: data.cart || [],
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      lastLogin: data.lastLogin || data.updatedAt || now,
    };
  } catch (error) {
    console.error(`Error reading user ${clerkUserId} with Admin SDK:`, error);
    return null;
  }
}