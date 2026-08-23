import { SignUp } from "@clerk/nextjs";

export default function CustomerSignUpPage() {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-background gap-6">
            <div className="text-center">
                <h1 className="text-3xl font-heading text-primary mb-2">Create your Account</h1>
                <p className="text-muted-foreground">Start your journey into authentic heritage and crafts</p>
            </div>
            <SignUp 
                appearance={{
                    elements: {
                        formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                        card: 'border-2 shadow-lg rounded-2xl',
                    }
                }}
                routing="hash"
                forceRedirectUrl="/shop"
                unsafeMetadata={{ role: 'customer' }}
                signInUrl="/login/customer"
            />
        </div>
    );
}
