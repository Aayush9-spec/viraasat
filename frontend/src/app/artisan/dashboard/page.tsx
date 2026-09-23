'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, TrendingUp, Sparkles, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { Product } from '@/lib/types';
import { products as staticProducts } from '@/lib/data';

export default function ArtisanDashboardPage() {
  const { user } = useUser();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('products')
      .select('*')
      .eq('artisan_id', user.id)
      .then(({ data }) => {
        if (data) setMyProducts(data.map((r) => ({ ...r, artisanId: r.artisan_id, createdAt: r.created_at, aiInsights: r.ai_insights })) as Product[]);
      });

    const channel = supabase
      .channel(`artisan-products-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `artisan_id=eq.${user.id}` }, async () => {
        const { data } = await supabase.from('products').select('*').eq('artisan_id', user.id);
        if (data) setMyProducts(data.map((r) => ({ ...r, artisanId: r.artisan_id, createdAt: r.created_at, aiInsights: r.ai_insights })) as Product[]);
      })
      .subscribe();

    // Fetch real order metrics
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    Promise.all([
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('artisan_id', user.id)
        .in('status', ['Processing', 'Pending', 'Shipped']),
      supabase
        .from('orders')
        .select('total_amount')
        .eq('artisan_id', user.id)
        .gte('created_at', firstOfMonth.toISOString()),
    ]).then(([ordersRes, revenueRes]) => {
      if (ordersRes.count !== null) setOrdersCount(ordersRes.count);
      if (revenueRes.data) {
        const total = revenueRes.data.reduce((sum: number, r: { total_amount: number }) => sum + (r.total_amount || 0), 0);
        setMonthlyRevenue(total);
      }
      setMetricsLoading(false);
    }).catch(() => setMetricsLoading(false));

    return () => { void supabase.removeChannel(channel); };
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
            <div className="text-2xl font-bold font-heading">
              {metricsLoading ? '—' : (ordersCount ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Processing / pending / shipped</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/50 dark:border-amber-900/30 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">
              {metricsLoading ? '—' : `₹${(monthlyRevenue ?? 0).toLocaleString('en-IN')}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This calendar month</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/50 dark:border-amber-900/30 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Provenances Verified</CardTitle>
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{allProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Products on blockchain</p>
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
