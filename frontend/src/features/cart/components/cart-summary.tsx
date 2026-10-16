import React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CartSummaryProps {
  subtotal: number;
  shipping?: number;
}

export function CartSummary({ subtotal, shipping = 0 }: CartSummaryProps) {
  const total = subtotal + shipping;

  return (
    <Card className="rounded-xl border border-border bg-card text-card-foreground p-6 space-y-4 shadow-sm">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Shipping</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase text-xs tracking-wider">Free</span>
      </div>
      <Separator className="bg-border/60" />
      <div className="flex justify-between items-baseline pt-2">
        <span className="text-base font-semibold">Total</span>
        <span className="text-2xl font-bold font-heading text-primary">₹{total.toLocaleString("en-IN")}</span>
      </div>
    </Card>
  );
}
