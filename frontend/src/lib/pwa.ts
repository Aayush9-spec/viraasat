import { env } from '@/core/config/env';

// PWA registration helpers.
const SW_PATH = '/sw.js';

declare global {
  interface Window {
    __SW_BUILD_ID__?: string;
  }
}

function getBuildId(): string {
  if (typeof window !== 'undefined' && window.__SW_BUILD_ID__) {
    return window.__SW_BUILD_ID__;
  }
  return env.app.commitSha || 'dev';
}

// Controller change & refresh guards to prevent infinite reload loops and startup crashes
let refreshing = false;
let hadController = typeof navigator !== 'undefined' && 'serviceWorker' in navigator
  ? Boolean(navigator.serviceWorker.controller)
  : false;
let waitingWorker: ServiceWorker | null = null;

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // In development mode, unregister existing service workers to prevent Turbopack chunk conflicts.
  if (process.env.NODE_ENV === 'development') {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
    return;
  }

  // Update hadController state on startup
  hadController = Boolean(navigator.serviceWorker.controller);

  // Prevent multiple controllerchange listeners
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // If there was no controller when the page initially loaded, this is just
    // the first activation claiming the client. DO NOT reload the page!
    if (!hadController) {
      hadController = true;
      return;
    }
    // Prevent infinite reload loops
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    const url = `${SW_PATH}?v=${encodeURIComponent(getBuildId())}`;

    navigator.serviceWorker
      .register(url, { scope: '/' })
      .then((registration) => {
        // Periodically check for an updated SW (every 5 minutes, jitter-safe)
        setInterval(() => {
          registration.update().catch(() => {});
        }, 5 * 60_000);

        // Check if there is already a waiting worker on boot
        if (registration.waiting && navigator.serviceWorker.controller) {
          waitingWorker = registration.waiting;
          window.dispatchEvent(
            new CustomEvent('viraasat_sw_update_available', {
              detail: { registration, worker: waitingWorker },
            }),
          );
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              waitingWorker = newWorker;
              // Dispatch non-blocking event so UI can show a friendly update banner
              window.dispatchEvent(
                new CustomEvent('viraasat_sw_update_available', {
                  detail: { registration, worker: newWorker },
                }),
              );
            }
          });
        });
      })
      .catch((error) => {
        console.warn('[Viraasat PWA] Service Worker registration failed:', error);
      });
  });
}

/**
 * Manually trigger the waiting service worker to take over and update
 */
export function applyServiceWorkerUpdate() {
  if (waitingWorker) {
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }
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

// Inline install prompt helpers
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
