// PWA registration helpers.

const SW_PATH = '/sw.js';

// Cached at module load so we don't hit the network just to compute the URL.
// `build-sw.js` writes this file at every build; in dev it falls back to a
// timestamp so we still get a fresh SW on every reload.
declare global {
  interface Window {
    __SW_BUILD_ID__?: string;
  }
}

function getBuildId(): string {
  if (typeof window !== 'undefined' && window.__SW_BUILD_ID__) {
    return window.__SW_BUILD_ID__;
  }
  return String(Date.now());
}

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const url = `${SW_PATH}?v=${getBuildId()}`;
    navigator.serviceWorker
      .register(url)
      .then((registration) => {
        // Periodically check for an updated SW (every 60s).
        setInterval(() => registration.update(), 60_000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // A new build is waiting. The new SW will call skipWaiting()
              // on its own; we just tell the user.
              if (confirm('A new version of Viraasat is available. Reload now?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    // When the new SW takes over, reload so the page picks up new bundles.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}

export function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => reg.unregister())
    .catch((err) => console.error(err));
}

export function isAppInstalled() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Inline install prompt helpers (unchanged).
let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function promptInstall() {
  if (typeof window === 'undefined') return null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
  return {
    show: async () => {
      if (!deferredPrompt) return { outcome: 'dismissed' as const, platform: '' };
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      return { outcome, platform: '' };
    },
    isAvailable: () => deferredPrompt !== null,
  };
}
