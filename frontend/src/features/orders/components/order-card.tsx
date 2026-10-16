import React from "react";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="bg-secondary/40 border-b border-border/40 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">Order Ref</span>
            <CardTitle className="text-sm font-bold text-primary">{order.id.toUpperCase()}</CardTitle>
          </div>
          <Badge className="rounded-md uppercase tracking-wider text-[9px] bg-primary/10 text-primary border border-primary/20">{order.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {order.items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span>{item.productName} (x{item.quantity})</span>
            <span className="font-semibold text-foreground">₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}</span>
          </div>
        ))}
        <Separator className="bg-border/60" />
        <div className="flex justify-between text-sm font-bold">
          <span>Total Investment</span>
          <span className="text-primary font-bold">₹{order.totalAmount.toLocaleString("en-IN")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
