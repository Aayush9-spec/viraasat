import { captureInstallEvents, getInstallState, requestAppInstall } from '../install-store';
let cleanup: () => void;
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: jest.fn(() => ({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() })) });
  cleanup = captureInstallEvents();
});
afterEach(() => cleanup());
function offer(outcome: 'accepted' | 'dismissed', fail = false) {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  const prompt = fail ? jest.fn().mockRejectedValue(new Error('Blocked')) : jest.fn().mockResolvedValue(undefined);
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
  window.dispatchEvent(event); return { event, prompt };
}
test('an early install offer is retained and only consumed once', async () => {
  const { event, prompt } = offer('accepted');
  expect(event.defaultPrevented).toBe(true); expect(getInstallState()).toBe('available');
  expect(await requestAppInstall()).toBe('accepted'); expect(prompt).toHaveBeenCalledTimes(1);
  expect(getInstallState()).toBe('accepted');
  expect(await requestAppInstall()).toBe('unavailable'); expect(prompt).toHaveBeenCalledTimes(1);
  window.dispatchEvent(new Event('appinstalled')); expect(getInstallState()).toBe('installed');
});
test('dismissed and failed installs never announce an installed app', async () => {
  offer('dismissed'); expect(await requestAppInstall()).toBe('dismissed'); expect(getInstallState()).toBe('unavailable');
  offer('accepted', true); expect(await requestAppInstall()).toBe('error'); expect(getInstallState()).toBe('error');
});
test('installing elsewhere clears a captured prompt and cleanup removes listeners', async () => {
  offer('accepted'); window.dispatchEvent(new Event('appinstalled'));
  expect(await requestAppInstall()).toBe('unavailable');
  cleanup(); cleanup = () => {};
  offer('accepted'); expect(getInstallState()).toBe('unavailable');
});
