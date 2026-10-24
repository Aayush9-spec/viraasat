'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
  type UserCredential,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase/client';
import { STORAGE_KEYS, USER_ROLES } from '@/core/config/constants';
import type { UserRole } from '@/types/user';

export { auth, db };

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Sync user profile to Firestore document: /users/{uid}
 */
export async function syncUserProfile(
  user: FirebaseUser,
  role: UserRole = USER_ROLES.BUYER,
  additionalData?: Partial<UserProfileData>
): Promise<UserProfileData> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  let finalRole = role;
  if (snap.exists()) {
    const existingData = snap.data();
    if (existingData.role) {
      finalRole = existingData.role as UserRole;
    }
  }

  const profileData: UserProfileData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || additionalData?.displayName || (user.email ? user.email.split('@')[0] : 'User'),
    role: finalRole,
    photoURL: user.photoURL || null,
    updatedAt: serverTimestamp(),
    ...(!snap.exists() ? { createdAt: serverTimestamp() } : {}),
  };

  await setDoc(userRef, profileData, { merge: true });

  // Update localStorage session for fast access
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, finalRole);
    localStorage.setItem('viraasat_session_uid', user.uid);
    localStorage.setItem(
      'viraasat_demo_user',
      JSON.stringify({
        id: user.uid,
        name: profileData.displayName,
        email: profileData.email,
        role: finalRole,
      })
    );
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('viraasat_auth_change'));
  }

  return profileData;
}

/**
 * Sign up with Email and Password
 */
export async function registerWithEmail(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = USER_ROLES.BUYER
): Promise<{ user: FirebaseUser; profile: UserProfileData }> {
  const cred: UserCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  
  if (fullName.trim()) {
    await updateProfile(cred.user, { displayName: fullName.trim() });
  }

  const profile = await syncUserProfile(cred.user, role, { displayName: fullName.trim() });
  return { user: cred.user, profile };
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(
  email: string,
  password: string,
  fallbackRole: UserRole = USER_ROLES.BUYER
): Promise<{ user: FirebaseUser; profile: UserProfileData }> {
  const cred: UserCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const profile = await syncUserProfile(cred.user, fallbackRole);
  return { user: cred.user, profile };
}

/**
 * Sign in with Google (Popup)
 */
export async function loginWithGoogle(
  role: UserRole = USER_ROLES.BUYER
): Promise<{ user: FirebaseUser; profile: UserProfileData }> {
  const cred: UserCredential = await signInWithPopup(auth, googleProvider);
  const profile = await syncUserProfile(cred.user, role);
  return { user: cred.user, profile };
}

/**
 * Log out
 */
export async function logoutFirebase(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.SESSION_ROLE);
    localStorage.removeItem('viraasat_session_uid');
    localStorage.removeItem('viraasat_demo_user');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('viraasat_auth_change'));
  }
  await signOut(auth);
}

/**
 * Auth State Observer
 */
export function onFirebaseAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getFirebaseAuth() {
  return auth;
}
