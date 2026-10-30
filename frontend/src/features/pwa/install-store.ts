'use client';

import { useSyncExternalStore } from 'react';

type InstallOutcome = 'accepted' | 'dismissed';
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome }>;
}
export type InstallState = 'unavailable' | 'available' | 'prompting' | 'accepted' | 'installed' | 'error';
let state: InstallState = 'unavailable';
let deferredPrompt: InstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
let stopCapture: (() => void) | undefined;
let consumers = 0;
const subscribe = (callback: () => void) => { subscribers.add(callback); return () => { subscribers.delete(callback); }; };
const notify = (next: InstallState) => { state = next; subscribers.forEach(callback => callback()); };
export const getInstallState = () => state;

export function captureInstallEvents() {
  if (typeof window === 'undefined') return () => {};
  consumers += 1;
  if (!stopCapture) {
    const media = window.matchMedia('(display-mode: standalone)');
    const isStandalone = () => media.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const syncDisplayMode = () => { if (isStandalone()) { deferredPrompt = null; notify('installed'); } };
    const beforeInstall = (event: Event) => {
      if (isStandalone()) return;
      event.preventDefault(); deferredPrompt = event as InstallPromptEvent; notify('available');
    };
    const installed = () => { deferredPrompt = null; notify('installed'); };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', installed);
    media.addEventListener('change', syncDisplayMode);
    syncDisplayMode();
    stopCapture = () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', installed);
      media.removeEventListener('change', syncDisplayMode);
      deferredPrompt = null; state = 'unavailable'; stopCapture = undefined;
    };
  }
  return () => { consumers -= 1; if (!consumers) stopCapture?.(); };
}

export async function requestAppInstall(): Promise<InstallOutcome | 'unavailable' | 'error'> {
  const prompt = deferredPrompt;
  if (!prompt || state !== 'available') return 'unavailable';
  deferredPrompt = null; notify('prompting');
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (getInstallState() !== 'installed') notify(choice.outcome === 'accepted' ? 'accepted' : 'unavailable');
    return choice.outcome;
  } catch {
    if (getInstallState() !== 'installed') notify('error');
    return 'error';
  }
}
export function useAppInstall() {
  const status = useSyncExternalStore(subscribe, getInstallState, () => 'unavailable' as const);
  return { status, install: requestAppInstall };
}
