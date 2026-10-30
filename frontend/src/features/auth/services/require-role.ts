import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "./get-user-role";
import { getCurrentUser } from "./get-current-user";
import { UserRole } from "@/types/user";

export async function requireRole(allowedRoles: UserRole | UserRole[]) {
  let userId: string | null = null;
  try {
    const authObj = await auth();
    userId = authObj?.userId || null;
  } catch (err) {
    if ((err as any)?.digest === 'DYNAMIC_SERVER_USAGE' || (err as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    console.warn('[requireRole] auth() call failed, redirecting to login:', err);
    redirect("/login");
  }

  if (!userId) {
    redirect("/login");
  }

  const role = await getUserRole();

  if (!role) {
    redirect("/select-role");
  }

  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!rolesArray.includes(role)) {
    // Unauthorized access attempt: redirect user to their own dashboard
    if (role === "artisan") {
      redirect("/artisan/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  const user = await getCurrentUser();
  return { userId, role, user };
}
