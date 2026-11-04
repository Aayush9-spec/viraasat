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

        const handleUpdateAvailable = () => {
            console.log('📦 [Viraasat PWA] A new version is available in the background');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('viraasat_sw_update_available', handleUpdateAvailable);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('viraasat_sw_update_available', handleUpdateAvailable);
        };
    }, []);

    return null;
}
