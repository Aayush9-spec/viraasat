import { SignIn } from "@clerk/nextjs";

export default function ArtisanLoginPage() {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-background gap-6">
            <div className="text-center">
                <h1 className="text-3xl font-heading text-primary mb-2">Artisan Portal</h1>
                <p className="text-muted-foreground">Sign in to manage your workshop and orders</p>
            </div>
            <SignIn 
                appearance={{
                    elements: {
                        formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                        card: 'border-2 shadow-lg rounded-2xl',
                    }
                }}
                routing="hash"
                forceRedirectUrl="/dashboard"
                signUpUrl="/signup/artisan"
            />
        </div>
    );
}
