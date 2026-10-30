'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { IndianRupee, Package, Layers, TrendingUp, Download, RotateCcw, Leaf, Heart, Users, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBackend } from '@/hooks/use-backend';
import type { MarketTrendsResult, TopProjectedProduct } from '../market-service';
import { buildStudioAnalytics, ordersCsv, type ChartPoint, type StudioOrder, type StudioProduct, type TimeRange } from '../studio-analytics';
import { StudioChart, formatINR, formatNumber } from './studio-chart';

const RED = 'var(--chart-revenue)';
const GOLD = 'var(--chart-catalog)';
const GREEN = 'var(--chart-orders)';
const BROWN = 'var(--chart-average)';
const categories = ['Home Decor', 'Pottery & Clay', 'Textiles', 'Kitchenware', 'Accessories'];
const regions = ['Rajasthan', 'Kashmir', 'Gujarat', 'Uttar Pradesh', 'Chhattisgarh', 'Bihar', 'Kutch'];
const timeRanges: { value: TimeRange; label: string }[] = [{ value: '7d', label: '7D' }, { value: '30d', label: '30D' }, { value: '90d', label: '90D' }, { value: '1y', label: '1Y' }, { value: 'all', label: 'All' }];
interface Forecast {
  time_series: { month: string; demand_index: number; tourist_inflow_k: number }[];
  warnings?: string[]; is_simulated?: boolean;
}
interface StudioData { orders: StudioOrder[]; products: StudioProduct[]; updated: Date }

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Could not load your studio data. Please try again.');
  return response.json();
}
async function loadStudio(): Promise<StudioData> {
  const [orders, catalog] = await Promise.all([
    fetchJson<StudioOrder[]>('/api/orders?scope=artisan'),
    fetchJson<{ data: { products: StudioProduct[] } }>('/api/products?scope=artisan'),
  ]);
  if (!Array.isArray(orders) || !Array.isArray(catalog.data?.products)) throw new Error('The studio returned incomplete data. Please refresh.');
  return { orders, products: catalog.data.products, updated: new Date() };
}
function useResource<T>(load: () => Promise<T>, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true); setError(''); setData(null);
    void load().then(value => { if (active) setData(value); }).catch(error => {
      if (active) setError(error instanceof Error ? error.message : 'Data is unavailable. Please retry.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, enabled, revision]);
  return { data, loading, error, refresh: () => setRevision(value => value + 1) };
}
function Panel({ title, description, children, className = '' }: { title: string; description: string; children: ReactNode; className?: string }) {
  return <Card className={`min-w-0 rounded-2xl border-border/80 shadow-sm ${className}`}><CardHeader className="pb-4"><CardTitle className="font-serif text-xl">{title}</CardTitle><CardDescription className="leading-relaxed">{description}</CardDescription></CardHeader><CardContent>{children}</CardContent></Card>;
}
function Metric({ title, value, note, icon: Icon, data, color, money, kind = 'area', empty }: {
  title: string; value: string; note: string; icon: LucideIcon; data: ChartPoint[]; color: string;
  money?: boolean; kind?: 'area' | 'bar'; empty: string;
}) {
  return <Card className="min-w-0 rounded-2xl border-border/80 shadow-sm"><CardContent className="p-5">
    <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60"><Icon className="h-4 w-4" style={{ color }} aria-hidden="true" /></span></div>
    <p className="mb-2 break-words font-mono text-3xl font-semibold tracking-tight text-foreground">{value}</p>
    <StudioChart data={data} label={title} caption={note} color={color} money={money} kind={kind} compact empty={empty} />
  </CardContent></Card>;
}
function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium text-muted-foreground">{label}<select value={value} onChange={event => onChange(event.target.value)} className="min-h-11 rounded-lg border bg-card px-3 text-sm text-foreground">{options.map(option => <option key={option} value={option}>{option === 'all' ? `All ${label === 'Category' ? 'categories' : 'regions'}` : option}</option>)}</select></label>;
}
function ErrorMessage({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><p>{message}</p><Button size="sm" variant="outline" onClick={retry}>Try again</Button></div>;
}

export function ArtisanAnalyticsDashboard() {
  const backend = useBackend();
  const [range, setRange] = useState<TimeRange>('30d');
  const [tab, setTab] = useState('sales');
  const studio = useResource(loadStudio);
  const [forecastRegion, setForecastRegion] = useState('Rajasthan');
  const [forecastCategory, setForecastCategory] = useState('Home Decor');
  const [marketCategory, setMarketCategory] = useState('all');
  const [marketRegion, setMarketRegion] = useState('all');
  const forecastLoader = useCallback(async () => {
    const value = await backend.get<Forecast>(`/api/forecast-demand?${new URLSearchParams({ region: forecastRegion, category: forecastCategory })}`);
    if (!Array.isArray(value.time_series)) throw new Error('Demand forecast is unavailable. Please retry.');
    return value;
  }, [backend, forecastRegion, forecastCategory]);
  const forecast = useResource(forecastLoader, tab === 'forecasting');
  const marketLoader = useCallback(async () => {
    const params = new URLSearchParams({ limit: '8' });
    if (marketCategory !== 'all') params.set('category', marketCategory);
    if (marketRegion !== 'all') params.set('region', marketRegion);
    const [trends, top] = await Promise.all([
      backend.get<MarketTrendsResult>('/api/market/trends'),
      backend.get<{ products: TopProjectedProduct[]; is_simulated?: boolean }>(`/api/market/top-products?${params}`),
    ]);
    if (!Array.isArray(trends.monthly_trend) || !Array.isArray(trends.category_perf) || !Array.isArray(top.products)) throw new Error('Market data is unavailable. Please retry.');
    return { trends, top };
  }, [backend, marketCategory, marketRegion]);
  const market = useResource(marketLoader, tab === 'market');
  const analytics = useMemo(() => buildStudioAnalytics(studio.data?.orders || [], studio.data?.products || [], range, studio.data?.updated), [studio.data, range]);
  const studioEmpty = studio.loading ? 'Loading your studio data…' : studio.error ? 'Data unavailable — try again' : 'No saved data yet';
  const points = (key: 'revenue' | 'orders' | 'average'): ChartPoint[] => studio.data ? analytics.buckets.map(bucket => ({ label: bucket.label, value: bucket[key] })) : [];
  const showValue = (value: string) => studio.data ? value : '—';
  const forecastEmpty = forecast.loading ? 'Loading forecast…' : 'Forecast unavailable';
  const marketEmpty = market.loading ? 'Loading market data…' : 'No model data available';
  const refreshing = studio.loading || (tab === 'market' && market.loading) || (tab === 'forecasting' && forecast.loading);
  function refresh() { studio.refresh(); if (tab === 'forecasting') forecast.refresh(); if (tab === 'market') market.refresh(); }
  function exportOrders() {
    const url = URL.createObjectURL(new Blob(['\uFEFF', ordersCsv(analytics.orders)], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `viraasat-studio-${range}.csv`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-5 border-b pb-5">
      <div className="max-w-2xl"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your studio, in perspective</p><h1 className="font-serif text-3xl font-semibold tracking-tight lg:text-4xl">Artisan Analytics & Studio Intelligence</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Understand your sales, explore seasonal demand, and keep track of your catalog.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Sales date range" className="flex rounded-xl border bg-muted/40 p-1">{timeRanges.map(item => <Button key={item.value} size="sm" variant={range === item.value ? 'default' : 'ghost'} aria-pressed={range === item.value} onClick={() => setRange(item.value)} className="min-w-11 px-3">{item.label}</Button>)}</div>
        <Button variant="outline" onClick={refresh} disabled={refreshing} className="gap-2"><RotateCcw className={`h-4 w-4 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} />Refresh</Button>
        <Button onClick={exportOrders} disabled={!studio.data || !analytics.orders.length} className="gap-2"><Download className="h-4 w-4" />Export orders</Button>
      </div>
    </div>
    {studio.error && <ErrorMessage message={studio.error} retry={studio.refresh} />}
    <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><p>Sales period: {range === 'all' ? 'All time' : range === '1y' ? 'Last 365 days' : `Last ${range.slice(0, -1)} days`} · India Standard Time</p><p role="status">{studio.data ? `Updated ${studio.data.updated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} IST` : studio.loading ? 'Loading studio…' : 'Unable to load studio'}</p></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Gross product sales" value={showValue(formatINR(analytics.revenue))} note="Paid product sales over the selected period" icon={IndianRupee} data={points('revenue')} color={RED} money empty={studioEmpty} />
      <Metric title="Paid orders" value={showValue(formatNumber(analytics.orders.length))} note={`${formatNumber(analytics.units)} craft units · orders by date`} icon={Package} data={points('orders')} color={GREEN} kind="bar" empty={studioEmpty} />
      <Metric title="Active catalog" value={showValue(formatNumber(analytics.liveProducts))} note="Current listings by category · independent of date range" icon={Layers} data={studio.data ? analytics.catalogByCategory : []} color={GOLD} kind="bar" empty={studioEmpty} />
      <Metric title="Average order value" value={showValue(formatINR(analytics.average))} note="Average product sales per paid order, by date" icon={TrendingUp} data={points('average')} color={BROWN} money empty={studioEmpty} />
    </div>
    <Tabs value={tab} onValueChange={setTab} className="space-y-6">
      <div className="overflow-x-auto pb-1"><TabsList aria-label="Analytics sections" className="h-auto w-max gap-1 rounded-xl border bg-card p-1">
        <TabsTrigger className="min-h-11 px-4" value="sales">Sales & revenue</TabsTrigger><TabsTrigger className="min-h-11 px-4" value="forecasting">Seasonal demand</TabsTrigger><TabsTrigger className="min-h-11 px-4" value="market">Market trends</TabsTrigger><TabsTrigger className="min-h-11 px-4" value="impact">Community impact</TabsTrigger>
      </TabsList></div>
      <TabsContent value="sales" className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <Panel title="Your sales over time" description="Each point shows product sales for that interval. Hover or view the data for exact amounts."><StudioChart data={points('revenue')} label="Product sales (INR)" caption="Gross sales before partial refunds, fees, tax and shipping. Fully refunded orders are excluded. This is not a payout statement." money empty={studioEmpty} /></Panel>
          <Panel title="Craft category performance" description="See which craft categories contribute to your sales."><StudioChart data={studio.data ? analytics.revenueByCategory : []} label="Sales by category (INR)" caption="Categories use your current catalog; deleted products appear as Uncategorized." kind="horizontal" color={GOLD} money empty={studioEmpty} /></Panel>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <Panel title="Recent paid orders" description="Your ten most recent paid orders within the selected period.">
            <StudioChart data={analytics.orders.slice(0, 10).reverse().map(order => ({ label: order.id, value: order.totalAmount }))} label="Order value (INR)" caption="Only items belonging to your studio are included." kind="bar" money compact empty={studioEmpty} />
            {analytics.orders.length > 0 && <div tabIndex={0} role="region" aria-label="Recent paid orders table" className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th scope="col" className="py-3 pr-4">Order</th><th scope="col" className="py-3 pr-4">Date</th><th scope="col" className="py-3 pr-4">Status</th><th scope="col" className="py-3 text-right">Value</th></tr></thead><tbody>{analytics.orders.slice(0, 10).map(order => <tr key={order.internalId} className="border-t"><th scope="row" className="max-w-44 truncate py-3 pr-4 font-mono text-xs font-normal" title={order.id}>{order.id}</th><td className="whitespace-nowrap py-3 pr-4 text-xs">{new Date(order.orderDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td><td className="py-3 pr-4 text-xs">{order.status}</td><td className="whitespace-nowrap py-3 text-right font-mono">{formatINR(order.totalAmount)}</td></tr>)}</tbody></table></div>}
          </Panel>
          <Panel title="Catalog availability" description="A snapshot of stock across your active listings."><StudioChart data={studio.data ? analytics.stock : []} label="Active listings" caption="Stock is current and does not change with the sales date range." kind="bar" color={GREEN} empty={studioEmpty} /></Panel>
        </div>
      </TabsContent>
      <TabsContent value="forecasting" className="space-y-6">
        <div className="flex max-w-xl flex-wrap gap-3"><Filter label="Region" value={forecastRegion} options={regions} onChange={setForecastRegion} /><Filter label="Category" value={forecastCategory} options={categories} onChange={setForecastCategory} /></div>
        {forecast.error && <ErrorMessage message="Seasonal predictions could not be loaded. Please retry." retry={forecast.refresh} />}
        <p className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">{forecast.data?.is_simulated ? 'Illustrative seasonal estimates — the trained model is unavailable.' : 'Model estimates describe seasonal patterns, not confirmed orders. Validation on your studio’s real sales is still needed.'}</p>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Seasonal demand outlook" description={`${forecastCategory} · ${forecastRegion}`}><StudioChart data={forecast.data?.time_series.map(point => ({ label: point.month, value: point.demand_index })) || []} label="Demand index" caption="Higher values indicate stronger estimated seasonal demand. This index is not a unit-sales forecast." empty={forecastEmpty} /></Panel>
          <Panel title="Tourism & seasonal opportunity" description="Estimated tourist inflow across the same seasonal cycle."><StudioChart data={forecast.data?.time_series.map(point => ({ label: point.month, value: point.tourist_inflow_k })) || []} label="Estimated visitors (thousands)" caption="Model estimates, not measured local footfall." kind="bar" color={GOLD} empty={forecastEmpty} /></Panel>
        </div>
        {Boolean(forecast.data?.warnings?.length) && <aside className="rounded-xl border-l-4 border-l-primary bg-card p-5"><h2 className="mb-2 font-serif text-lg font-semibold">Seasonal planning notes</h2><ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">{forecast.data?.warnings?.map(warning => <li key={warning}>{warning}</li>)}</ul></aside>}
      </TabsContent>
      <TabsContent value="market" className="space-y-6">
        {market.error && <ErrorMessage message="Market trends could not be loaded. Please retry." retry={market.refresh} />}
        <p className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">These charts summarize the model’s training data and seasonal projections. They are not live marketplace transactions or guaranteed sales.</p>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Market sales pattern" description="Monthly revenue totals from the model dataset."><StudioChart data={market.data?.trends.monthly_trend.map(point => ({ label: point.month, value: point.total_revenue })) || []} label="Dataset revenue (INR)" caption="Dataset totals; independent of your studio date range." money empty={marketEmpty} /></Panel>
          <Panel title="Market volume pattern" description="Compare unit volume through the seasonal cycle."><StudioChart data={market.data?.trends.monthly_trend.map(point => ({ label: point.month, value: point.total_units })) || []} label="Dataset units" caption="Dataset volume; not current marketplace orders." kind="bar" color={GREEN} empty={marketEmpty} /></Panel>
          <Panel title="Categories in the market dataset" description="Compare revenue across the categories represented in the model."><StudioChart data={market.data?.trends.category_perf.map(point => ({ label: point.category, value: point.total_revenue })) || []} label="Category revenue (INR)" caption="Coverage depends on the model dataset." kind="horizontal" color={GOLD} money empty={marketEmpty} /></Panel>
          <Panel title="Three-month product outlook" description="Seasonal estimates help compare products; they are not sales commitments.">
            <div className="mb-4 flex flex-wrap gap-3"><Filter label="Category" value={marketCategory} options={['all', ...categories]} onChange={setMarketCategory} /><Filter label="Region" value={marketRegion} options={['all', ...regions]} onChange={setMarketRegion} /></div>
            <StudioChart data={market.data?.top.products.map(point => ({ label: point.product, value: point.projected_units_3m })) || []} label="Projected units" caption="Rule-based seasonal projections over the next three months." kind="horizontal" color={BROWN} empty={marketEmpty} />
          </Panel>
        </div>
      </TabsContent>
      <TabsContent value="impact" className="space-y-6">
        <p className="text-sm leading-relaxed text-muted-foreground">Impact reporting needs recorded evidence. Unmeasured indicators stay empty until verified data is available.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Carbon avoided" value="Not measured" note="Requires a documented footprint baseline and shipment measurements." icon={Leaf} data={[]} color={GREEN} empty="No verified carbon measurements" />
          <Metric title="Community contributions" value="Not measured" note="Requires recorded and verified community fund transfers." icon={Heart} data={[]} color={RED} empty="No contribution records" />
          <Metric title="Women-led participation" value="Not measured" note="Requires consented participation and ownership records." icon={Users} data={[]} color={GOLD} empty="No verified participation data" />
          <Metric title="GI certifications" value="Not measured" note="Requires verified GI certificates linked to your products." icon={ShieldCheck} data={[]} color={BROWN} empty="No verified certification records" />
        </div>
        <Panel title="Your catalog’s regional footprint" description="Active listings grouped by the region recorded on each product."><StudioChart data={studio.data ? analytics.catalogByRegion : []} label="Listings by region" caption="Listing counts show catalog coverage, not artisan population or verified cultural impact." kind="horizontal" color={GOLD} empty={studioEmpty} /></Panel>
      </TabsContent>
    </Tabs>
  </div>;
}
