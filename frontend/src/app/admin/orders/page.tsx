'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
export default function OrderOperations() {
  const [orders,setOrders]=useState<any[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  useEffect(()=>{fetch('/api/orders?scope=admin',{cache:'no-store'}).then(async r=>{if(!r.ok)throw new Error();setOrders(await r.json());}).catch(()=>setError('Order operations are unavailable. Please retry.')).finally(()=>setLoading(false));},[]);
  return <main className="p-6 max-w-5xl mx-auto space-y-6"><Link href="/admin">← Admin console</Link><h1 className="text-3xl font-serif">Order operations</h1>
    <p>Review refund requests here. Issue approved refunds in Razorpay using the payment reference. Verified webhooks update the order automatically. Do not retry an uncertain payment as a new order.</p>
    {loading?<p role="status">Loading…</p>:error?<p role="alert">{error}</p>:orders.length===0?<p>No orders.</p>:orders.map(o=><article key={o.id} className="p-4 border rounded-xl space-y-2">
      <h2 className="font-mono break-all">{o.id}</h2><p>{o.buyerEmail} · {o.paymentStatus} · ₹{o.totalAmount}</p>
      <p>Payment: {o.paymentId || 'Not confirmed'} · Refund recorded: ₹{o.refundedAmount || 0}</p>
      {o.refundRequest && <p>Refund requested: {o.refundRequest.reason}</p>}
      {!o.razorpayOrderId && <p role="status">Pending provider reconciliation. Receipt: {o.internalId}</p>}
    </article>)}
  </main>;
}
