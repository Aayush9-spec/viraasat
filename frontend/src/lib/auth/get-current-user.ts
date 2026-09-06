import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { getUser } from "@/lib/firebase/users";
import { getServerUser } from "@/lib/firebase/server-user";
import { User } from "@/types/user";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    // Privileged read via Firebase Admin (works server-side regardless of auth state).
    const serverUser = await getServerUser(userId);
    if (serverUser) return serverUser;

    const userDoc = await getUser(userId);
    if (userDoc) return userDoc;

    const clerkUser = await clerkCurrentUser();
    if (!clerkUser) return null;

    return {
      id: userId,
      clerkUserId: userId,
      uid: userId,
      name:
        clerkUser.fullName ||
        clerkUser.username ||
        clerkUser.primaryEmailAddress?.emailAddress ||
        "User",
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      imageUrl: clerkUser.imageUrl || "",
      role: (clerkUser.unsafeMetadata?.role as any) || undefined,
      createdAt: new Date(clerkUser.createdAt).toISOString(),
    } as any;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}