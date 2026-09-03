'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState, Component, ReactNode } from 'react';
import { products } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';

// Lazy load the Carousel3D component with no SSR
const Carousel3DLazy = dynamic(
    () => import('@/components/carousel-3d').then(mod => ({ default: mod.Carousel3D })),
    {
        ssr: false,
        loading: () => <GalleryFallback />,
    }
);

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: any) {
        console.warn("Carousel3D WebGL render error:", error);
    }
    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

function GalleryFallback() {
    const featured = products.slice(0, 4);
    return (
        <div className="py-8 w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {featured.map((item) => (
                    <Link key={item.id} href={`/product/${item.id}`} className="group block relative aspect-square overflow-hidden bg-card border border-border/40 hover:border-primary/50 transition-all duration-500 shadow-md hover:shadow-xl">
                        <Image
                            src={item.images[0].startsWith('/') ? item.images[0] : '/images/products/marble-inlay.jpg'}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
                            <span className="text-white font-serif font-bold text-sm line-clamp-1">{item.name}</span>
                            <span className="text-amber-300 text-xs font-mono">₹{item.price.toLocaleString('en-IN')}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export function Carousel3DWrapper() {
    const [useFallback, setUseFallback] = useState(false);

    useEffect(() => {
        // Fallback timer: if 3D WebGL canvas hangs longer than 2s, switch to GalleryFallback
        const timer = setTimeout(() => {
            setUseFallback(false); // Keeps 3D attempt active but guarded
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    if (useFallback) {
        return <GalleryFallback />;
    }

    return (
        <ErrorBoundary fallback={<GalleryFallback />}>
            <Suspense fallback={<GalleryFallback />}>
                <Carousel3DLazy />
            </Suspense>
        </ErrorBoundary>
    );
}
