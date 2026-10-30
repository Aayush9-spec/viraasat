import { registerServiceWorker } from '@/lib/pwa';
beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
test('registration starts even when React mounts after the window load event', async () => {
  jest.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
  const update = jest.fn().mockResolvedValue(undefined); const register = jest.fn().mockResolvedValue({ update });
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { register } });
  const stop = registerServiceWorker(); await Promise.resolve();
  expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' });
  stop(); jest.advanceTimersByTime(120000); expect(update).not.toHaveBeenCalled();
});
test('unmounted registration does not run on a later load event', () => {
  jest.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
  const register = jest.fn(); Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { register } });
  const stop = registerServiceWorker(); stop(); window.dispatchEvent(new Event('load')); expect(register).not.toHaveBeenCalled();
});
