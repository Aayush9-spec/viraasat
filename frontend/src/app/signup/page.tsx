import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <SignUp 
                appearance={{
                    elements: {
                        formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                        card: 'border-2 shadow-lg rounded-2xl',
                    }
                }}
                routing="hash"
            />
        </div>
    );
}
