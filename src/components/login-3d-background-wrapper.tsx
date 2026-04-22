'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load the Login3DBackground component with no SSR
const Login3DBackgroundLazy = dynamic(
    () => import('@/components/login-3d-background').then(mod => ({ default: mod.Login3DBackground })),
    {
        ssr: false,
        loading: () => null, // No loading indicator for background
    }
);

export function Login3DBackgroundWrapper() {
    return (
        <Suspense fallback={null}>
            <Login3DBackgroundLazy />
        </Suspense>
    );
}
