import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {/*
       * Generic sign-in — used by Clerk's email-verification links and
       * password-reset flows.  Role-specific login pages live at:
       *   /login/customer  (buyers)
       *   /login/artisan   (artisans)
       * After sign-in, redirect to /select-role so a role can be picked
       * if none is stored in unsafeMetadata yet.
       */}
      <SignIn
        fallbackRedirectUrl="/select-role"
        signUpUrl="/signup"
      />
    </div>
  );
}
