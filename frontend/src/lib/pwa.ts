// Service workers are enabled only in production. The browser's update check
// compares the script bytes; no timestamp or cache-busting fetch is necessary.
export function registerServiceWorker(): () => void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return () => {};
  let disposed = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  async function register() {
    try {
      if (process.env.NODE_ENV === 'development') return;
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      if (disposed) return;
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') void registration.update().catch(() => {});
      }, 60_000);
    } catch { console.warn('Home-screen offline support could not be registered.'); }
  }
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', register, { once: true });
  return () => { disposed = true; window.removeEventListener('load', register); if (interval) clearInterval(interval); };
}

export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  await registration?.unregister();
}
export function isAppInstalled() {
  return typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
}
