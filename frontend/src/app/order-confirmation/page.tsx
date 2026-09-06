'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Package } from 'lucide-react';

interface LastOrder {
  orderId?: string;
  paymentId?: string;
  items?: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>;
  subtotal?: number;
  shippingFee?: number;
  tax?: number;
  total?: number;
  customerName?: string;
}

function OrderConfirmationContent() {
  const params = useSearchParams();
  const orderId = params.get('order_id');
  const paymentId = params.get('payment_id');
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('viraasat-last-order');
      if (raw) setOrder(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to read last order summary', e);
    }
  }, []);

  const items = order?.items ?? [];
  const subtotal = order?.subtotal ?? 0;
  const shippingFee = order?.shippingFee ?? 0;
  const tax = order?.tax ?? 0;
  const total = order?.total ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="h-4" />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <div className="text-center mb-10">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-heading text-foreground">Order Confirmed</h1>
          <p className="text-muted-foreground mt-2">
            {order?.customerName ? `${order.customerName}, thank you for supporting a Viraasat artisan. Your order has been placed.` : 'Thank you for your purchase.'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            {orderId && (
              <Badge variant="secondary" className="font-mono">Order {orderId}</Badge>
            )}
            {paymentId && (
              <Badge variant="outline" className="font-mono">Payment {paymentId}</Badge>
            )}
          </div>
        </div>

        {items.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">₹{(item.unitPrice * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shippingFee === 0 ? 'Free' : `₹${shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center py-10">
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">We could not load your order summary.</p>
              <p className="text-xs text-muted-foreground">
                Your payment is confirmed — items will be shipped to the address provided at checkout.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-4 mt-8 flex-wrap">
          <Button asChild className="bg-primary">
            <Link href="/orders">View My Orders</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}