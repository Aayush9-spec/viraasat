import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 sm:p-6 bg-background gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary">
          Welcome to Viraasat
        </h1>
        <p className="text-base text-muted-foreground font-medium">
          Preserving Heritage. Empowering Artisans.
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
            card: 'border-2 shadow-lg rounded-2xl',
          },
        }}
        routing="hash"
        fallbackRedirectUrl="/select-role"
      />
    </div>
  );
}
