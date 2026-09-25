'use client';

import { LoginForm } from '@/components/login-form';

export default function ArtisanSignUpPage() {
    return <LoginForm userType="Artisan" initialIsSignUp={true} />;
}


