import React from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Card className="rounded-none border-amber-900/10 bg-white">
      <CardHeader className="bg-[#fbf7f0]/50 border-b border-amber-900/5 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">Order Ref</span>
            <CardTitle className="text-sm font-bold text-[#5e2c18]">{order.id.toUpperCase()}</CardTitle>
          </div>
          <Badge className="rounded-none uppercase tracking-wider text-[9px]">{order.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {order.items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span>{item.productName} (x{item.quantity})</span>
            <span className="font-semibold text-neutral-900">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</span>
          </div>
        ))}
        <Separator className="bg-amber-900/5" />
        <div className="flex justify-between text-sm font-bold">
          <span>Total Investment</span>
          <span className="text-[#5e2c18]">₹{order.totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
