'use client';

import { useState, useEffect } from 'react';
import { SignIn } from "@clerk/nextjs";
import { LoginForm } from '@/components/login-form';

export default function CustomerLoginPage() {
    const [useFallback, setUseFallback] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            const clerkCard = document.querySelector('.cl-card, .cl-root, .cl-component');
            if (!clerkCard) {
                setUseFallback(true);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    if (useFallback) {
        return <LoginForm userType="Customer" />;
    }

    return (
        <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-background gap-6">
            <div className="text-center">
                <h1 className="text-3xl font-heading text-primary mb-2">Welcome Back</h1>
                <p className="text-muted-foreground">Sign in to explore authentic heritage crafts</p>
            </div>
            <SignIn
                appearance={{
                    elements: {
                        formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                        card: 'border-2 shadow-lg rounded-2xl',
                    },
                }}
                forceRedirectUrl="/shop"
                signUpUrl="/signup/customer"
            />
        </div>
    );
}

