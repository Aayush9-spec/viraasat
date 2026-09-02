'use client';

import { orders, products } from '@/lib/data';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { db } from '@/services/firebase/firestore';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Package, Truck, CheckCircle2, Clock, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const STATUS_ICONS = {
  'Processing': <Clock className="h-4 w-4 text-amber-500" />,
  'Shipped': <Truck className="h-4 w-4 text-blue-500" />,
  'Delivered': <CheckCircle2 className="h-4 w-4 text-green-500" />,
  'Pending': <Package className="h-4 w-4 text-gray-500" />,
};

export default function OrdersPage() {
  const { user } = useUser();
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDbOrders(fetchedOrders);
      setLoading(false);
    }, (err) => {
      console.error("Firestore orders failed:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Combine static and db orders
  const userStaticOrders = orders.filter(o => o.userId === (user?.id || 'customer-1'));
  const allOrders = [...dbOrders, ...userStaticOrders];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fbf7f0]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5e2c18]" />
      </div>
    );
  }

  return (
    <div className="bg-[#fbf7f0] min-h-screen pb-20">
      {/* Header */}
      <header className="relative py-20 overflow-hidden bg-neutral-950 text-amber-50">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4 block">Your Collection</span>
          <h1 className="text-5xl md:text-7xl font-heading font-normal text-amber-100 mb-6 italic">History of Acquisitions</h1>
          <p className="text-lg text-amber-200/50 max-w-2xl mx-auto font-light leading-relaxed">
            Track the journey of your handcrafted masterpieces.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        {allOrders.length > 0 ? (
          <div className="space-y-8">
            {allOrders.map((order) => (
              <Card key={order.id} className="rounded-none border-amber-900/10 shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-[#fbf7f0]/50 border-b border-amber-900/5 px-8 py-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-900/40">Order Reference</p>
                      <CardTitle className="text-lg font-heading text-[#5e2c18]">{order.id.toUpperCase()}</CardTitle>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-900/40 mb-1">Status</p>
                        <Badge variant="outline" className="rounded-none border-amber-900/20 text-amber-900 px-3 py-1 flex items-center gap-2 bg-white">
                          {STATUS_ICONS[order.status as keyof typeof STATUS_ICONS]}
                          <span className="text-[10px] tracking-widest uppercase font-bold">{order.status}</span>
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-900/40 mb-1">Acquired On</p>
                        <p className="text-xs font-bold text-[#5e2c18] uppercase tracking-wider">
                          {(() => {
                            const dateStr = order.orderDate;
                            if (!dateStr) return 'TBA';
                            try {
                              return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                            } catch (e) {
                              return 'Invalid Date';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 py-8">
                  <div className="space-y-6">
                    {order.items.map((item: any) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <div key={item.productId} className="flex gap-6 items-center">
                          <div className="relative h-20 w-16 overflow-hidden bg-neutral-100 border border-amber-900/5 shrink-0">
                            <Image 
                              src={item.itemImageUrl || product?.images[0] || ''} 
                              alt={item.productName || product?.name || ''} 
                              fill 
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-heading text-lg text-[#5e2c18]">{item.productName || product?.name}</h4>
                            <p className="text-[10px] text-amber-900/40 uppercase tracking-widest font-bold">Category: {product?.category || 'Heritage'}</p>
                            <p className="text-xs text-amber-900/60 mt-1">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-bold text-[#5e2c18]">₹{(item.unitPrice || 0).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-8 bg-amber-900/5" />

                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="space-y-4 max-w-sm">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-amber-900/30 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-900/40 mb-1">Delivery Destination</p>
                          <p className="text-xs text-amber-900/70 leading-relaxed">
                            {order.shippingAddress.addressLine1}, {order.shippingAddress.city},<br />
                            {order.shippingAddress.state} - {order.shippingAddress.zipCode}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#fbf7f0]/50 p-6 space-y-3 min-w-[240px]">
                      <div className="flex justify-between text-xs">
                        <span className="text-amber-900/40 uppercase tracking-widest font-bold">Subtotal</span>
                        <span className="text-amber-900/70 font-bold">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-green-600">
                        <span className="uppercase tracking-widest font-bold">Shipping</span>
                        <span className="font-bold uppercase tracking-wider">Free Heritage Delivery</span>
                      </div>
                      <div className="h-px bg-amber-900/10 my-2" />
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-amber-900/40 uppercase tracking-widest font-bold">Total Investment</span>
                        <span className="text-xl font-heading font-bold text-[#5e2c18]">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white border border-amber-900/5 shadow-xl">
             <Package className="h-16 w-16 text-amber-900/10 mx-auto mb-6" />
             <h2 className="text-2xl font-heading text-[#5e2c18] mb-4">No acquisitions yet</h2>
             <p className="text-amber-900/50 text-sm mb-10 max-w-sm mx-auto leading-relaxed">Your journey through India's cultural gallery is just beginning. Explore our collection to find your first treasure.</p>
             <Button className="rounded-none bg-[#5e2c18] hover:bg-[#4a2315] text-[#fbf7f0] px-12 h-14 uppercase tracking-[0.3em] text-xs" asChild>
               <a href="/shop">Begin Exploration</a>
             </Button>
          </div>
        )}
      </main>
    </div>
  );
}
