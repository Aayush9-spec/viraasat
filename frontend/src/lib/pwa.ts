export function registerServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('✅ Service Worker registered:', registration.scope);

                    // Check for updates periodically
                    setInterval(() => {
                        registration.update();
                    }, 60000); // Check every minute

                    // Handle updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New service worker available
                                    if (confirm('New version available! Reload to update?')) {
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                        window.location.reload();
                                    }
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error('❌ Service Worker registration failed:', error);
                });

            // Handle controller change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        });
    }
}

export function unregisterServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => {
                registration.unregister();
            })
            .catch((error) => {
                console.error(error.message);
            });
    }
}

// Check if app is installed
export function isAppInstalled() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
}

// Prompt user to install PWA
export function promptInstall() {
    if (typeof window === 'undefined') return null;

    let deferredPrompt: any = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    return {
        show: async () => {
            if (!deferredPrompt) {
                return { outcome: 'dismissed', platform: '' };
            }

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;

            return { outcome };
        },
        isAvailable: () => deferredPrompt !== null,
    };
}
