'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Heart, Package, User, ArrowRight, Sparkles } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function BuyerDashboardPage() {
  const { user } = useUser();

  return (
    <ProtectedRoute allowedRoles={['buyer']}>
      <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6">
        {/* Welcome Header */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 sm:p-8 text-white shadow-xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Buyer Account
            </div>
            <h1 className="text-2xl sm:text-4xl font-heading font-bold">
              Welcome back, {user?.firstName || user?.fullName || 'Art Connoisseur'}! ✨
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base max-w-xl">
              Explore authentic handcrafted heritage items directly empowering verified Indian master artisans.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="default" className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold shadow-md">
              <Link href="/shop">
                <ShoppingBag className="mr-2 h-4 w-4" /> Browse Shop
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="border-white/30 text-white hover:bg-white/10">
              <Link href="/orders">
                <Package className="mr-2 h-4 w-4" /> View My Orders
              </Link>
            </Button>
          </div>
        </div>

        {/* Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">My Orders</CardTitle>
              <Package className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Track shipments and order history for your purchases.</p>
              <Button asChild variant="ghost" className="p-0 text-emerald-600 hover:text-emerald-700 font-semibold text-sm">
                <Link href="/orders" className="flex items-center gap-1">
                  View Orders <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Wishlist</CardTitle>
              <Heart className="h-5 w-5 text-rose-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Saved heritage creations and favorite artisan items.</p>
              <Button asChild variant="ghost" className="p-0 text-emerald-600 hover:text-emerald-700 font-semibold text-sm">
                <Link href="/wishlist" className="flex items-center gap-1">
                  View Saved Items <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Account Profile</CardTitle>
              <User className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Manage personal details, shipping addresses, and preferences.</p>
              <Button asChild variant="ghost" className="p-0 text-emerald-600 hover:text-emerald-700 font-semibold text-sm">
                <Link href="/dashboard/profile" className="flex items-center gap-1">
                  Edit Profile <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Featured Recommendation Banner */}
        <Card className="border-emerald-200/60 dark:border-emerald-900/40 bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-heading">Empowerment Impact</CardTitle>
            <CardDescription>
              Your purchases directly support rural artisan households across Rajasthan, Kashmir, Bihar, and Gujarat.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-400">100% Direct Fair-Trade</div>
              <p className="text-xs text-muted-foreground">No middlemen markup. Transparent provenance certificates provided with every creation.</p>
            </div>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
              <Link href="/shop">Explore Collections</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
