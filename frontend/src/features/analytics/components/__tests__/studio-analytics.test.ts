import { buildStudioAnalytics, ordersCsv, type StudioOrder, type StudioProduct } from '../../studio-analytics';
const now = new Date('2026-10-30T12:00:00Z');
const products: StudioProduct[] = [
  { id: 'pot', name: 'Vase', category: 'Pottery', region: 'Rajasthan', isActive: true, stock: 4 },
  { id: 'shawl', name: 'Shawl', category: 'Textiles', region: 'Kashmir', isActive: false, stock: 0 },
];
const order = (id: string, date: string, status = 'Paid', price = 1250.50): StudioOrder => ({ id, internalId: id, orderDate: date, totalAmount: price * 2, paymentStatus: status, status: 'Processing', items: [{ productId: 'pot', productName: 'Vase', unitPrice: price, quantity: 2 }] });

test('sales include only paid studio items in the selected period and fill zero-sale days', () => {
  const result = buildStudioAnalytics([
    order('paid', '2026-10-29T12:00:00Z'), order('partial', '2026-10-28T12:00:00Z', 'Partially Refunded'),
    order('unpaid', '2026-10-29T12:00:00Z', 'Pending Payment'), order('refunded', '2026-10-29T12:00:00Z', 'Refunded'),
    order('old', '2026-09-01T12:00:00Z'), order('future', '2026-11-01T12:00:00Z'), order('invalid', 'invalid'),
  ], products, '7d', now);
  expect(result.orders.map(o => o.id)).toEqual(['paid', 'partial']);
  expect(result.revenue).toBe(5002); expect(result.average).toBe(2501); expect(result.units).toBe(4);
  expect(result.buckets).toHaveLength(7); expect(result.buckets.filter(b => !b.orders)).toHaveLength(5);
  expect(result.revenueByCategory).toEqual([{ label: 'Pottery', value: 5002 }]);
});
test('date boundaries follow India time, including orders around midnight UTC', () => {
  const result = buildStudioAnalytics([order('included', '2026-10-23T18:30:00Z'), order('excluded', '2026-10-23T18:29:59Z')], products, '7d', now);
  expect(result.orders.map(o => o.id)).toEqual(['included']); expect(result.buckets[0].label).toBe('24 Oct');
});
test('current active catalog stays independent of date range and empty orders produce zero', () => {
  for (const range of ['7d', '30d', '90d', '1y', 'all'] as const) {
    const result = buildStudioAnalytics([], products, range, now);
    expect(result.liveProducts).toBe(1); expect(result.revenue).toBe(0); expect(result.average).toBe(0);
    expect(result.catalogByRegion).toEqual([{ label: 'Rajasthan', value: 1 }]);
  }
});
test('all-time includes older paid orders and missing catalog entries stay visible', () => {
  const result = buildStudioAnalytics([order('old', '2024-01-01T00:00:00Z')], [], 'all', now);
  expect(result.orders).toHaveLength(1); expect(result.buckets.length).toBeLessThanOrEqual(12);
  expect(result.revenueByCategory[0].label).toBe('Uncategorized');
});
test('CSV exports real amounts and escapes spreadsheet formulas, commas and quotes', () => {
  const csv = ordersCsv([order('=SUM(1,2)"', '2026-10-29T12:00:00Z')]);
  expect(csv).toContain('"\'=SUM(1,2)"""'); expect(csv).toContain('"2501"'); expect(csv).not.toContain('Settled via UPI');
});
