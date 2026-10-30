'use client';

import { useCallback, useEffect, useState } from 'react';
import { Package, CheckCircle2, IndianRupee, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/core/hooks/use-toast';

interface WorkshopOrder {
  id: string; internalId: string; status: string; paymentStatus: string; orderDate: string; totalAmount: number;
  shippingAddress: { fullName: string; addressLine1: string; addressLine2?: string; city: string; state: string; zipCode: string; phoneNumber?: string };
  items: { productName: string; quantity: number }[];
  fulfillment: { status: string; trackingId?: string; notes?: string };
}
const steps = ['Processing', 'Ready to Ship', 'Shipped', 'Delivered'];
const currency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
function Status({ order }: { order: WorkshopOrder }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${order.status === 'Delivered' ? 'border-emerald-700/20 bg-emerald-700/10 text-emerald-800 dark:text-emerald-200' : order.paymentStatus === 'Refunded' ? 'border-red-700/20 bg-red-700/10 text-red-800 dark:text-red-200' : 'border-primary/20 bg-primary/5 text-primary'}`}>{order.status}</span>;
}
function OrderDetails({ order, onSaved }: { order: WorkshopOrder; onSaved: () => Promise<void> }) {
  const [tracking, setTracking] = useState(order.fulfillment.trackingId || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const next = steps[steps.indexOf(order.status) + 1];
  async function save() {
    setSaving(true);
    try {
      const response = await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ action: 'fulfill', id: order.internalId, status: next, trackingId: tracking }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Update failed');
      await onSaved(); toast({ title: 'Order updated' });
    } catch (error) { toast({ title: 'Update failed', description: error instanceof Error ? error.message : 'Please retry', variant: 'destructive' }); }
    finally { setSaving(false); }
  }
  return <div className="space-y-5 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><Status order={order} /><p className="font-mono font-semibold">{currency(order.totalAmount)}</p></div>
    <p className="text-muted-foreground">Payment: {order.paymentStatus}</p>
    <ul className="space-y-2 rounded-lg bg-muted/30 p-4">{order.items.map((item, index) => <li key={index}>{item.productName} × {item.quantity}</li>)}</ul>
    <div className="space-y-1"><h3 className="font-semibold">Delivery address</h3><p>{order.shippingAddress.fullName}</p><p>{[order.shippingAddress.addressLine1, order.shippingAddress.addressLine2, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zipCode].filter(Boolean).join(', ')}</p><p>{order.shippingAddress.phoneNumber}</p></div>
    {order.fulfillment.trackingId && <p className="break-all">Tracking: <span className="font-mono">{order.fulfillment.trackingId}</span></p>}
    {next && order.paymentStatus !== 'Refunded' && <div className="space-y-3 border-t pt-4">
      <Label htmlFor={`tracking-${order.internalId}`}>Tracking ID (required before shipping)</Label>
      <Input id={`tracking-${order.internalId}`} value={tracking} onChange={event => setTracking(event.target.value)} />
      <Button disabled={saving || (['Shipped', 'Delivered'].includes(next) && !tracking.trim())} onClick={save}>{saving ? 'Saving…' : `Mark ${next}`}</Button>
    </div>}
  </div>;
}
export default function ArtisanOrdersPage() {
  const [orders, setOrders] = useState<WorkshopOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/orders?scope=artisan', { cache: 'no-store', signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error();
      const data = await response.json(); if (!Array.isArray(data)) throw new Error(); setOrders(data);
    } catch { setError('Orders could not be loaded. Please retry.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const selected = orders.find(order => order.internalId === selectedId);
  const paidOrders = orders.filter(order => ['Paid', 'Partially Refunded'].includes(order.paymentStatus));
  const metrics = [
    { title: 'Pending dispatch', value: paidOrders.filter(order => ['Processing', 'Ready to Ship'].includes(order.status)).length.toLocaleString('en-IN'), icon: Package },
    { title: 'Delivered orders', value: paidOrders.filter(order => order.status === 'Delivered').length.toLocaleString('en-IN'), icon: CheckCircle2 },
    { title: 'Gross product sales', value: currency(paidOrders.reduce((sum, order) => sum + order.totalAmount, 0)), icon: IndianRupee },
  ];
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-serif text-3xl font-semibold lg:text-4xl">Artisan Orders & Fulfillment</h1><p className="mt-2 text-sm text-muted-foreground">Track paid orders, update production status, and record shipment tracking.</p></div><Button variant="outline" onClick={load} disabled={loading} className="gap-2"><RotateCcw className="h-4 w-4" />Refresh orders</Button></div>
    <div className="grid gap-4 md:grid-cols-3">{metrics.map(({ title, value, icon: Icon }) => <section key={title} className="rounded-xl border bg-card p-5 shadow-sm"><div className="flex items-center justify-between gap-2"><h2 className="text-sm font-medium text-muted-foreground">{title}</h2><Icon aria-hidden="true" className="h-4 w-4 text-primary" /></div><p className="mt-3 break-words font-mono text-2xl font-semibold">{loading || error ? '—' : value}</p></section>)}</div>
    <section className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <h2 className="font-serif text-2xl font-semibold">Customer orders</h2><p className="mb-5 mt-1 text-sm text-muted-foreground">All saved studio orders. Sales totals exclude fully refunded orders and precede partial refunds, tax, fees and shipping.</p>
      {loading ? <p role="status" className="py-8">Loading orders…</p> : error ? <div role="alert">{error} <Button variant="outline" onClick={load}>Retry</Button></div> : orders.length === 0 ? <p className="py-8 text-muted-foreground">No paid orders yet. New paid orders will appear here.</p> : <>
        <div className="hidden overflow-x-auto md:block" tabIndex={0} role="region" aria-label="Studio orders table"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{['Order', 'Customer', 'Craft items', 'Amount', 'Status', 'Date', 'Action'].map(title => <th key={title} scope="col" className="px-3 py-4 font-medium">{title}</th>)}</tr></thead><tbody>{orders.map(order => <tr key={order.internalId} className="border-t"><th scope="row" className="max-w-44 truncate px-3 py-4 font-mono text-xs font-normal" title={order.id}>{order.id}</th><td className="px-3 py-4">{order.shippingAddress.fullName}</td><td className="min-w-40 px-3 py-4">{order.items.map(item => `${item.productName} × ${item.quantity}`).join(', ')}</td><td className="whitespace-nowrap px-3 py-4 font-mono font-semibold">{currency(order.totalAmount)}</td><td className="px-3 py-4"><Status order={order} /></td><td className="whitespace-nowrap px-3 py-4 text-xs text-muted-foreground">{new Date(order.orderDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td><td className="px-3 py-4"><Button variant="outline" size="sm" onClick={() => setSelectedId(order.internalId)} aria-label={`Manage order ${order.id}`}>Manage order</Button></td></tr>)}</tbody></table></div>
        <div className="space-y-4 md:hidden">{orders.map(order => <article key={order.internalId} className="space-y-3 rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="break-all font-mono text-xs">{order.id}</h3><Status order={order} /></div><p className="text-sm">{order.shippingAddress.fullName}</p><p className="text-sm text-muted-foreground">{order.items.map(item => `${item.productName} × ${item.quantity}`).join(', ')}</p><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono font-semibold">{currency(order.totalAmount)}</p><Button variant="outline" size="sm" onClick={() => setSelectedId(order.internalId)} aria-label={`Manage order ${order.id}`}>Manage order</Button></div></article>)}</div>
      </>}
    </section>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelectedId(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Manage order</DialogTitle><DialogDescription className="break-all">{selected?.id}</DialogDescription></DialogHeader>{selected && <OrderDetails key={`${selected.id}-${selected.status}`} order={selected} onSaved={load} />}</DialogContent></Dialog>
  </div>;
}
