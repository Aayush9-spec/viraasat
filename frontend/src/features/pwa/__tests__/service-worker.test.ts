/** @jest-environment node */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
let listeners: Record<string, (event: any) => void>;
let network: jest.Mock;
let storage: { match: jest.Mock; open: jest.Mock; keys: jest.Mock; delete: jest.Mock };
let addAll: jest.Mock;
let self: any;
beforeEach(() => {
  listeners = {}; network = jest.fn(); addAll = jest.fn().mockResolvedValue(undefined);
  storage = { match: jest.fn().mockResolvedValue(new Response('Offline help')), open: jest.fn().mockResolvedValue({ addAll }), keys: jest.fn().mockResolvedValue(['viraasat-legacy', 'undefined', 'another-app']), delete: jest.fn().mockResolvedValue(true) };
  self = { location: { origin: 'https://virrasat.in' }, addEventListener: (name: string, handler: (e: any) => void) => { listeners[name] = handler; }, skipWaiting: jest.fn(), clients: { claim: jest.fn() } };
  vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8'), { self, caches: storage, fetch: network, URL, Response });
});
function request(pathname: string, mode = 'cors', method = 'GET') {
  const respondWith = jest.fn(); listeners.fetch({ request: { url: `https://virrasat.in${pathname}`, method, mode }, respondWith }); return respondWith;
}
test('private navigations are never stored and offline failures show connection help', async () => {
  network.mockResolvedValueOnce(new Response('private order history'));
  const online = request('/orders', 'navigate'); expect(await (await online.mock.calls[0][0]).text()).toBe('private order history');
  expect(storage.open).not.toHaveBeenCalled();
  network.mockRejectedValueOnce(new Error('Offline'));
  const offline = request('/orders', 'navigate'); expect(await (await offline.mock.calls[0][0]).text()).toBe('Offline help');
  expect(storage.match).toHaveBeenCalledWith('/offline.html');
});
test.each(['/api/orders', '/_next/static/app.js', '/shop?_rsc=private', '/login', '/product/private-image'])('never caches dynamic data: %s', pathname => {
  expect(request(pathname)).not.toHaveBeenCalled(); expect(storage.open).not.toHaveBeenCalled();
});
test('does not intercept checkout mutations', () => { expect(request('/api/orders', 'cors', 'POST')).not.toHaveBeenCalled(); });
test('precache contains only the offline screen and its dependencies', async () => {
  const waitUntil = jest.fn(); listeners.install({ waitUntil }); await waitUntil.mock.calls[0][0];
  expect(addAll).toHaveBeenCalledWith(['/offline.html', '/offline-retry.js', '/icons/viraasat-192.png']); expect(self.skipWaiting).toHaveBeenCalled();
});
test('activation removes legacy private-page caches without touching other apps', async () => {
  const waitUntil = jest.fn(); listeners.activate({ waitUntil }); await waitUntil.mock.calls[0][0];
  expect(storage.delete.mock.calls).toEqual([['viraasat-legacy'], ['undefined']]);
});
