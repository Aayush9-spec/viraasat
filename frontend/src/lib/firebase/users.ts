import { db } from './client';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { User, UserRole } from '@/types/user';

export async function getUser(clerkUserId: string): Promise<User | null> {
  if (!db || !clerkUserId) return null;
  try {
    const userRef = doc(db, 'users', clerkUserId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userSnap.id,
        clerkUserId: data.clerkUserId || userSnap.id,
        uid: data.uid || clerkUserId,
        name: data.name || '',
        email: data.email || '',
        imageUrl: data.imageUrl || '',
        role: data.role as UserRole,
        cart: data.cart || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        lastLogin: data.lastLogin || data.updatedAt,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user ${clerkUserId} from Firestore:`, error);
    return null;
  }
}

export async function userExists(clerkUserId: string): Promise<boolean> {
  if (!db || !clerkUserId) return false;
  try {
    const userRef = doc(db, 'users', clerkUserId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    console.error(`Error checking user existence ${clerkUserId} from Firestore:`, error);
    return false;
  }
}

/**
 * Subscribe to a user's Firestore document. Used by the role-selection flow
 * to wait for the backend Clerk → Firestore webhook to materialize the
 * freshly-picked role before redirecting.
 */
export function watchUser(
  clerkUserId: string,
  onChange: (user: User | null) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!db || !clerkUserId) return () => {};
  const userRef = doc(db, 'users', clerkUserId);
  return onSnapshot(
    userRef,
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const data = snap.data();
      onChange({
        id: snap.id,
        clerkUserId: data.clerkUserId || snap.id,
        uid: data.uid || clerkUserId,
        name: data.name || '',
        email: data.email || '',
        imageUrl: data.imageUrl || '',
        role: data.role as UserRole,
        cart: data.cart || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        lastLogin: data.lastLogin || data.updatedAt,
      });
    },
    (err) => onError?.(err),
  );
}
