import { db } from "./client";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { User, UserRole } from "@/types/user";

export async function getUser(clerkUserId: string): Promise<User | null> {
  if (!db || !clerkUserId) return null;
  try {
    const userRef = doc(db, "users", clerkUserId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userSnap.id,
        clerkUserId: data.clerkUserId || userSnap.id,
        uid: data.uid || clerkUserId,
        name: data.name || "",
        email: data.email || "",
        imageUrl: data.imageUrl || "",
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
    const userRef = doc(db, "users", clerkUserId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    console.error(`Error checking user existence ${clerkUserId}:`, error);
    return false;
  }
}

export async function createUser(userData: {
  clerkUserId: string;
  name: string;
  email: string;
  imageUrl?: string;
  role: UserRole;
}): Promise<User> {
  if (!db) throw new Error("Firestore instance not initialized");

  const now = new Date().toISOString();
  const newUserDoc: Omit<User, "id"> = {
    clerkUserId: userData.clerkUserId,
    uid: userData.clerkUserId,
    name: userData.name,
    email: userData.email,
    imageUrl: userData.imageUrl || "",
    role: userData.role,
    createdAt: now,
    updatedAt: now,
    lastLogin: now,
  };

  const userRef = doc(db, "users", userData.clerkUserId);
  await setDoc(userRef, newUserDoc, { merge: true });

  return {
    id: userData.clerkUserId,
    ...newUserDoc,
  };
}

export async function updateUserRole(
  clerkUserId: string,
  role: UserRole
): Promise<void> {
  if (!db || !clerkUserId) return;
  const now = new Date().toISOString();
  const userRef = doc(db, "users", clerkUserId);
  await setDoc(
    userRef,
    {
      clerkUserId,
      role,
      updatedAt: now,
    },
    { merge: true }
  );
}

export async function syncUserData(
  clerkUserId: string,
  userData: {
    name: string;
    email: string;
    imageUrl?: string;
    role?: UserRole;
  }
): Promise<User | null> {
  if (!db || !clerkUserId) return null;

  const existingUser = await getUser(clerkUserId);
  const now = new Date().toISOString();

  if (existingUser) {
    // Preserve existing role, NEVER overwrite role if it exists!
    const effectiveRole = existingUser.role || userData.role;
    const updatedFields = {
      name: userData.name || existingUser.name,
      email: userData.email || existingUser.email,
      imageUrl: userData.imageUrl || existingUser.imageUrl,
      role: effectiveRole,
      updatedAt: now,
      lastLogin: now,
    };

    const userRef = doc(db, "users", clerkUserId);
    await setDoc(userRef, updatedFields, { merge: true });

    return {
      ...existingUser,
      ...updatedFields,
      role: effectiveRole,
    };
  } else {
    // New user in Firestore
    if (!userData.role) {
      // Role is not set yet
      return null;
    }

    return await createUser({
      clerkUserId,
      name: userData.name,
      email: userData.email,
      imageUrl: userData.imageUrl,
      role: userData.role,
    });
  }
}
