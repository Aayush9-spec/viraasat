'use client';

import { LoginForm } from '@/components/login-form';

export default function CustomerSignUpPage() {
    return <LoginForm userType="Customer" initialIsSignUp={true} />;
}


