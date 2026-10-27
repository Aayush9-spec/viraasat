import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
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
    if (userDoc?.role) return userDoc.role;

    // Fall back to Clerk current user metadata (e.g. if user role was set in Clerk or Firestore is offline)
    const clerkUser = await clerkCurrentUser();
    if (clerkUser) {
      const metaRole = (clerkUser.publicMetadata?.role || clerkUser.unsafeMetadata?.role) as UserRole | undefined;
      if (metaRole) return metaRole;
    }

    return null;
  } catch (error) {
    if ((error as any)?.digest === "DYNAMIC_SERVER_USAGE" || (error as any)?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error fetching user role:", error);
    return null;
  }
}