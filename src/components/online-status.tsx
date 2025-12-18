'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function OnlineStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showStatus, setShowStatus] = useState(false);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setShowStatus(true);
            setTimeout(() => setShowStatus(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowStatus(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showStatus) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
            <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg backdrop-blur-xl border ${isOnline
                        ? 'bg-green-500/90 border-green-400/20 text-white'
                        : 'bg-red-500/90 border-red-400/20 text-white'
                    }`}
            >
                {isOnline ? (
                    <>
                        <Wifi className="w-4 h-4" />
                        <span className="text-sm font-medium">Back Online</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-4 h-4" />
                        <span className="text-sm font-medium">You&apos;re Offline</span>
                    </>
                )}
            </div>
        </div>
    );
}
