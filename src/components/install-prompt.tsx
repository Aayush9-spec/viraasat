'use client';

import { useEffect, useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        const installed = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
        setIsInstalled(installed);

        if (installed) return;

        // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) return; // Don't show again for 7 days
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after 30 seconds
            setTimeout(() => setShowPrompt(true), 30000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        setShowPrompt(false);
    };

    if (!showPrompt || isInstalled) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom duration-500">
            <div className="relative bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" />

                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-10"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4 text-white" />
                </button>

                <div className="relative p-6 space-y-4">
                    {/* Icon */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white">
                                Install Viraasat App
                            </h3>
                            <p className="text-sm text-gray-300">
                                Get the full app experience
                            </p>
                        </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                            Works offline with cached content
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-pink-400 rounded-full" />
                            Faster loading and performance
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                            Install on your home screen
                        </li>
                    </ul>

                    {/* Install button */}
                    <button
                        onClick={handleInstall}
                        className="w-full group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/50"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <Download className="w-5 h-5" />
                            Install Now
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>

                    <button
                        onClick={handleDismiss}
                        className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}
