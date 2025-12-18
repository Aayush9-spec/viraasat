'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa';

export default function PWALifecycle() {
    useEffect(() => {
        // Register service worker
        registerServiceWorker();

        // Handle online/offline events
        const handleOnline = () => {
            console.log('✅ Back online');
        };

        const handleOffline = () => {
            console.log('📵 Gone offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return null;
}
