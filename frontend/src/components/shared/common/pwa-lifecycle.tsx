'use client';
import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa';
import { captureInstallEvents } from '@/features/pwa/install-store';
export default function PWALifecycle() {
  useEffect(() => {
    const stopInstall = captureInstallEvents();
    const stopWorker = registerServiceWorker();
    return () => { stopInstall(); stopWorker(); };
  }, []);
  return null;
}
