'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load the Carousel3D component with no SSR
const Carousel3DLazy = dynamic(
    () => import('@/components/carousel-3d').then(mod => ({ default: mod.Carousel3D })),
    {
        ssr: false,
        loading: () => (
            <div className="h-[500px] w-full flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                    <p className="mt-4 text-amber-200/60 font-serif tracking-widest text-sm">LOADING GALLERY...</p>
                </div>
            </div>
        ),
    }
);

export function Carousel3DWrapper() {
    return (
        <Suspense fallback={
            <div className="h-[500px] w-full flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                    <p className="mt-4 text-amber-200/60 font-serif tracking-widest text-sm">LOADING GALLERY...</p>
                </div>
            </div>
        }>
            <Carousel3DLazy />
        </Suspense>
    );
}
