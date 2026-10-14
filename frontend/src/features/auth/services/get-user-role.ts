import { auth } from "@clerk/nextjs/server";
import { getUser } from "@/lib/firebase/users";
import { getServerUser } from "@/lib/firebase/server-user";
import { UserRole } from "@/types/user";

export async function getUserRole(targetUserId?: string): Promise<UserRole | null> {
  try {
    let userId = targetUserId;
    if (!userId) {
      const authObj = await auth();
      userId = authObj.userId || undefined;
    }

    if (!userId) return null;

    // Privileged read first (works server-side regardless of client auth state).
    const serverUser = await getServerUser(userId);
    if (serverUser?.role) return serverUser.role;

    const userDoc = await getUser(userId);
    return userDoc?.role || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}