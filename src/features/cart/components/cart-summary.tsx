import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CartSummaryProps {
  subtotal: number;
  shipping?: number;
}

export function CartSummary({ subtotal, shipping = 0 }: CartSummaryProps) {
  const total = subtotal + shipping;

  return (
    <Card className="rounded-none border-amber-900/10 bg-white p-6 space-y-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold text-neutral-900">₹{subtotal.toLocaleString('en-IN')}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Shipping</span>
        <span className="font-semibold text-green-600 uppercase text-xs tracking-wider">Free</span>
      </div>
      <Separator className="bg-amber-900/5" />
      <div className="flex justify-between items-baseline pt-2">
        <span className="text-base font-semibold">Total</span>
        <span className="text-2xl font-bold font-heading text-[#5e2c18]">₹{total.toLocaleString('en-IN')}</span>
      </div>
    </Card>
  );
}
