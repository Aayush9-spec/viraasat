import { redirect } from "next/navigation";

/**
 * Clerk's catch-all sign-up route (/sign-up/...).
 * Used by Clerk's email verification and magic-link flows.
 * Forward to the branded /signup page so users get role selection.
 */
export default function SignUpCatchAll() {
  redirect("/signup");
}
