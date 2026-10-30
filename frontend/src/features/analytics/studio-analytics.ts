export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';
export type ChartPoint = { label: string; value: number };
export type StudioProduct = { id: string; name: string; category: string; region: string; isActive: boolean; stock: number };
export type StudioOrder = {
  id: string; internalId: string; orderDate: string; totalAmount: number;
  paymentStatus: string; status: string;
  items: { productId: string; productName: string; unitPrice: number; quantity: number }[];
};

const DAY = 86_400_000;
const IST_OFFSET = 330 * 60_000;
const dayInIndia = (date: number) => Math.floor((date + IST_OFFSET) / DAY);
const dateLabel = (day: number) => new Date(day * DAY).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const groupCounts = (values: string[]): ChartPoint[] => {
  const counts = new Map<string, number>();
  values.forEach(value => counts.set(value || 'Uncategorized', (counts.get(value || 'Uncategorized') || 0) + 1));
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

export function buildStudioAnalytics(orders: StudioOrder[], products: StudioProduct[], range: TimeRange, now = new Date()) {
  const today = dayInIndia(now.getTime());
  const eligible = orders.filter(o => ['Paid', 'Partially Refunded'].includes(o.paymentStatus) && Number.isFinite(Date.parse(o.orderDate)) && Date.parse(o.orderDate) <= now.getTime());
  const days = range === 'all' ? Math.max(1, today - eligible.reduce((min, o) => Math.min(min, dayInIndia(Date.parse(o.orderDate))), today) + 1) : ({ '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[range]);
  const start = today - days + 1;
  const bucketSize = Math.max(1, Math.ceil(days / (range === '7d' ? 7 : 12)));
  const buckets = Array.from({ length: Math.ceil(days / bucketSize) }, (_, i) => ({
    label: dateLabel(start + i * bucketSize), revenue: 0, orders: 0, average: 0,
  }));
  const selected = eligible.filter(o => dayInIndia(Date.parse(o.orderDate)) >= start).sort((a, b) => Date.parse(b.orderDate) - Date.parse(a.orderDate));
  const categories = new Map<string, number>();
  const productById = new Map(products.map(p => [p.id, p]));
  let units = 0;
  for (const order of selected) {
    const bucket = buckets[Math.floor((dayInIndia(Date.parse(order.orderDate)) - start) / bucketSize)];
    const amount = order.items.reduce((sum, item) => {
      const sale = Math.round(item.unitPrice * 100) * item.quantity / 100;
      const category = productById.get(item.productId)?.category || 'Uncategorized';
      categories.set(category, (categories.get(category) || 0) + sale);
      units += item.quantity;
      return sum + sale;
    }, 0);
    bucket.revenue += amount;
    bucket.orders += 1;
    bucket.average = bucket.revenue / bucket.orders;
  }
  const revenue = buckets.reduce((sum, b) => sum + b.revenue, 0);
  const liveProducts = products.filter(p => p.isActive);
  return {
    orders: selected, buckets, revenue, units, average: selected.length ? revenue / selected.length : 0,
    liveProducts: liveProducts.length,
    revenueByCategory: [...categories].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    catalogByCategory: groupCounts(liveProducts.map(p => p.category)),
    catalogByRegion: groupCounts(liveProducts.map(p => p.region || 'Unspecified')),
    stock: [
      { label: 'In stock', value: liveProducts.filter(p => p.stock > 0).length },
      { label: 'Out of stock', value: liveProducts.filter(p => p.stock <= 0).length },
    ],
  };
}

export function ordersCsv(orders: StudioOrder[]) {
  const cell = (value: string | number) => {
    const text = String(value);
    return `"${(/^[=+@\-\t\r\n]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`;
  };
  return [['Order', 'Date', 'Gross product sales (INR)', 'Payment status', 'Fulfillment status'],
    ...orders.map(o => [o.id, o.orderDate, o.items.reduce((sum, i) => sum + Math.round(i.unitPrice * 100) * i.quantity / 100, 0), o.paymentStatus, o.status])]
    .map(row => row.map(cell).join(',')).join('\r\n');
}
