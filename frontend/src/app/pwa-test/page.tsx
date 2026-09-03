'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PWAStatus {
    serviceWorker: 'checking' | 'registered' | 'failed';
    manifest: 'checking' | 'loaded' | 'failed';
    offline: 'checking' | 'supported' | 'not-supported';
    installable: 'checking' | 'yes' | 'no' | 'already-installed';
}

export default function PWATestPage() {
    const [status, setStatus] = useState<PWAStatus>({
        serviceWorker: 'checking',
        manifest: 'checking',
        offline: 'checking',
        installable: 'checking',
    });

    useEffect(() => {
        // Check Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                setStatus((prev) => ({
                    ...prev,
                    serviceWorker: registration ? 'registered' : 'failed',
                }));
            });
        } else {
            setStatus((prev) => ({ ...prev, serviceWorker: 'failed' }));
        }

        // Check Manifest
        fetch('/manifest.json')
            .then((res) => {
                setStatus((prev) => ({
                    ...prev,
                    manifest: res.ok ? 'loaded' : 'failed',
                }));
            })
            .catch(() => {
                setStatus((prev) => ({ ...prev, manifest: 'failed' }));
            });

        // Check Offline Support
        setStatus((prev) => ({
            ...prev,
            offline: 'onLine' in navigator ? 'supported' : 'not-supported',
        }));

        // Check Installability
        const isInstalled =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isInstalled) {
            setStatus((prev) => ({ ...prev, installable: 'already-installed' }));
        } else {
            const handler = (e: Event) => {
                setStatus((prev) => ({ ...prev, installable: 'yes' }));
            };
            window.addEventListener('beforeinstallprompt', handler);

            setTimeout(() => {
                setStatus((prev) => ({
                    ...prev,
                    installable: prev.installable === 'checking' ? 'no' : prev.installable,
                }));
            }, 2000);

            return () => window.removeEventListener('beforeinstallprompt', handler);
        }
    }, []);

    const StatusIcon = ({ state }: { state: string }) => {
        if (state === 'checking') return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
        if (state === 'registered' || state === 'loaded' || state === 'supported' || state === 'yes' || state === 'already-installed')
            return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        if (state === 'no' || state === 'not-supported')
            return <AlertCircle className="w-5 h-5 text-yellow-500" />;
        return <XCircle className="w-5 h-5 text-red-500" />;
    };

    const getStatusText = (key: keyof PWAStatus) => {
        const state = status[key];
        if (state === 'checking') return 'Checking...';
        if (state === 'registered') return 'Service Worker Registered ✓';
        if (state === 'loaded') return 'Manifest Loaded ✓';
        if (state === 'supported') return 'Offline Support Available ✓';
        if (state === 'yes') return 'App is Installable ✓';
        if (state === 'already-installed') return 'Already Installed ✓';
        if (state === 'no') return 'Not Installable (criteria not met)';
        if (state === 'not-supported') return 'Not Supported';
        return 'Failed ✗';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4">
                        PWA Status Check
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Testing Progressive Web App functionality
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* Service Worker */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <StatusIcon state={status.serviceWorker} />
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-1">
                                    Service Worker
                                </h3>
                                <p className="text-gray-300">
                                    {getStatusText('serviceWorker')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Manifest */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <StatusIcon state={status.manifest} />
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-1">
                                    Web App Manifest
                                </h3>
                                <p className="text-gray-300">
                                    {getStatusText('manifest')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Offline Support */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <StatusIcon state={status.offline} />
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-1">
                                    Offline Support
                                </h3>
                                <p className="text-gray-300">
                                    {getStatusText('offline')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Installability */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <StatusIcon state={status.installable} />
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-1">
                                    Installability
                                </h3>
                                <p className="text-gray-300">
                                    {getStatusText('installable')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">
                        How to Test PWA Features
                    </h3>
                    <ul className="space-y-3 text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>
                                <strong>Install:</strong> Look for the install button in your browser&apos;s address bar or wait for the install prompt
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>
                                <strong>Offline:</strong> Open DevTools → Application → Service Workers → Check &ldquo;Offline&rdquo; to test offline mode
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>
                                <strong>Cache:</strong> Check DevTools → Application → Cache Storage to see cached assets
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>
                                <strong>Lighthouse:</strong> Run a Lighthouse audit (DevTools → Lighthouse) to check PWA score
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="inline-block px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
