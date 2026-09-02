'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, TrendingUp, Sparkles, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Product } from '@/lib/types';
import { products as staticProducts } from '@/lib/data';

export default function ArtisanDashboardPage() {
  const { user } = useUser();
  const [myProducts, setMyProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, 'products'), where('artisanId', '==', user.id));
    const unsub = onSnapshot(q, (snap) => {
      const prods = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
      setMyProducts(prods);
    });
    return () => unsub();
  }, [user]);

  const allProducts = [...myProducts, ...staticProducts.filter((p) => p.artisanId === (user?.id || 'artisan-1'))];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">
              Namaste, {user?.fullName || user?.firstName || 'Master Artisan'}! 🙏
            </h1>
            <p className="text-amber-100 text-sm sm:text-base max-w-xl">
              Welcome to your Viraasat Artisan Hub. Manage your authentic creations, leverage AI pricing algorithms, and track your global impact.
            </p>
          </div>
          <Button asChild size="lg" className="bg-white text-amber-900 hover:bg-amber-50 shadow-md font-semibold shrink-0">
            <Link href="/artisan/products/new">
              <Plus className="mr-2 h-5 w-5" /> Add New Creation
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-amber-200/50 dark:border-amber-900/30 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Creations</CardTitle>
            <Package className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{allProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Crafted heritage products</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/50 dark:border-amber-900/30 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">12</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">↑ 4 ready to dispatch</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/50 dark:border-amber-900/30 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">₹48,500</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">↑ 18% vs last month</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/50 dark:border-amber-900/30 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Provenances Verified</CardTitle>
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">100%</div>
            <p className="text-xs text-muted-foreground mt-1">GI Registry Authenticated</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group hover:border-amber-500/50 transition-all cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-amber-600" />
              AI Business Advisor
            </CardTitle>
            <CardDescription>
              Get intelligent pricing recommendations, market trends, and storytelling tips.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="p-0 text-amber-600 group-hover:translate-x-1 transition-transform">
              <Link href="/artisan/business-advisor" className="flex items-center gap-1 font-semibold">
                Launch Advisor <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:border-amber-500/50 transition-all cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-amber-600" />
              Product Catalog
            </CardTitle>
            <CardDescription>
              View, edit, and update stock inventory for all your listed products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="p-0 text-amber-600 group-hover:translate-x-1 transition-transform">
              <Link href="/artisan/products" className="flex items-center gap-1 font-semibold">
                Manage Products <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:border-amber-500/50 transition-all cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              Provenance & GI Graph
            </CardTitle>
            <CardDescription>
              Generate digital certificates of authenticity and craft lineage for customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="p-0 text-amber-600 group-hover:translate-x-1 transition-transform">
              <Link href="/artisan/provenance" className="flex items-center gap-1 font-semibold">
                View Provenance <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
