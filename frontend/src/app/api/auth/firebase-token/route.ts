import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { UserRole } from '@/types/user';

export const runtime = 'nodejs';

const VALID_ROLES: UserRole[] = ['buyer', 'artisan', 'admin'];

async function resolveRole(userId: string): Promise<UserRole> {
  if (!adminDb) return 'buyer';
  try {
    const snapshot = await adminDb.collection('users').doc(userId).get();
    const role = snapshot.data()?.role;
    if (typeof role === 'string' && (VALID_ROLES as string[]).includes(role)) {
      return role as UserRole;
    }
  } catch (error) {
    console.error('Error resolving role from Firestore:', error);
  }
  return 'buyer';
}

/**
 * Exchange a verified Clerk session for a Firebase custom token.
 *
 * The token's UID is the Clerk user id, so every document the client writes
 * against `request.auth.uid` uses the same identifier. The user's role is read
 * from Firestore (single source of truth) and minted as a custom claim, which
 * powers `request.auth.token.role` in the security rules.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth) {
      console.warn(
        'firebase-token: FIREBASE_SERVICE_ACCOUNT_JSON is not configured; identity bridge is disabled.',
      );
      return NextResponse.json(
        { error: 'Identity bridge is not configured' },
        { status: 503 },
      );
    }

    const role = await resolveRole(userId);
    const token = await adminAuth.createCustomToken(userId, { role });

    return NextResponse.json({ token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error minting Firebase custom token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange identity', details: message },
      { status: 500 },
    );
  }
}