'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Package,
  CheckCircle2,
  Archive,
  ExternalLink,
  Users,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import type { Product } from '@/lib/types';
import { useUserRole } from '@/hooks/use-user-role';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ModerationVerdict = 'pending' | 'approved' | 'flagged';

const verdictStyles: Record<ModerationVerdict, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  flagged: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

interface DbProduct extends Product {
  moderation?: ModerationVerdict;
}

interface ArtisanApplication {
  id: string;
  applicant_id: string;
  full_name: string;
  workshop_name: string;
  email: string;
  phone: string;
  pincode: string;
  state: string;
  craft: string;
  portfolio_images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AdminDashboardPage() {
  const { user } = useUser();
  const { role, loading } = useUserRole();
  const { toast } = useToast();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [applications, setApplications] = useState<ArtisanApplication[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch Products
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setProducts(data.map((r) => ({ ...r, artisanId: r.artisan_id, createdAt: r.created_at, aiInsights: r.ai_insights })) as DbProduct[]);
      });

    // Fetch Artisan Applications
    supabase
      .from('artisan_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (data) setApplications(data as ArtisanApplication[]);
        if (error) console.warn('[Admin] Applications load warning:', error.message);
      });

    const channelProducts = supabase
      .channel('admin-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) setProducts(data.map((r) => ({ ...r, artisanId: r.artisan_id, createdAt: r.created_at, aiInsights: r.ai_insights })) as DbProduct[]);
      })
      .subscribe();

    const channelApps = supabase
      .channel('admin-applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artisan_applications' }, async () => {
        const { data } = await supabase.from('artisan_applications').select('*').order('created_at', { ascending: false });
        if (data) setApplications(data as ArtisanApplication[]);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channelProducts);
      void supabase.removeChannel(channelApps);
    };
  }, [user]);

  if (loading || (user && role === null)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Verifying access…
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h1 className="font-heading text-2xl text-[#5e2c18]">Access Restricted</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This dashboard is reserved for Viraasat administrators. If you believe this is an error,
          contact an administrator to review your role.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/">← Back to the marketplace</Link>
        </Button>
      </div>
    );
  }

  const productStats = {
    total: products.length,
    active: products.filter((p) => p.status === 'active').length,
    archived: products.filter((p) => p.status === 'archived' || p.moderation === 'flagged').length,
    pending: products.filter((p) => (p.moderation ?? 'pending') === 'pending').length,
  };

  const appStats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const moderateProduct = async (product: DbProduct, verdict: 'approved' | 'flagged') => {
    if (!user) return;
    setBusy(product.id);
    try {
      await supabase.from('products').update({
        moderation: verdict,
        status: verdict === 'approved' ? 'active' : 'archived',
      }).eq('id', product.id);
      toast({
        title: verdict === 'approved' ? 'Listing approved' : 'Listing flagged',
        description: verdict === 'approved'
          ? `${product.name} is now live on the marketplace.`
          : `${product.name} was archived and hidden from shoppers.`,
      });
    } catch (error) {
      console.error('Moderation update failed:', error);
      toast({
        title: 'Update failed',
        description: 'Could not update this listing. Check your permissions and try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const reviewApplication = async (app: ArtisanApplication, status: 'approved' | 'rejected') => {
    setBusy(app.id);
    try {
      // 1. Update application status in DB
      await supabase
        .from('artisan_applications')
        .update({ status })
        .eq('id', app.id);

      // 2. If approved, assign artisan role in users table
      if (status === 'approved' && app.applicant_id) {
        await supabase.from('users').upsert({
          id: app.applicant_id,
          email: app.email,
          display_name: app.full_name,
          role: 'artisan',
        });
      }

      setApplications((prev) =>
        prev.map((item) => (item.id === app.id ? { ...item, status } : item))
      );

      toast({
        title: status === 'approved' ? 'Application Approved!' : 'Application Rejected',
        description: status === 'approved'
          ? `${app.full_name} (${app.workshop_name}) is now an approved Viraasat Artisan.`
          : `Application for ${app.full_name} was marked as rejected.`,
      });
    } catch (error) {
      console.error('Failed to review application:', error);
      toast({
        title: 'Review failed',
        description: 'Could not update application status.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b border-primary/10 bg-[#fbf7f0] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-primary font-bold mb-2">
            <Shield className="h-4 w-4" />
            Admin Console
          </div>
          <h1 className="text-3xl md:text-4xl font-heading text-[#5e2c18]">Admin Portal & Review</h1>
          <p className="mt-2 text-sm text-foreground/60 max-w-2xl">
            Review artisan onboarding applications and moderate product listings submitted across the platform.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Artisan Applications
              {appStats.pending > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                  {appStats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Moderation
              {productStats.pending > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {productStats.pending}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ARTISAN APPLICATIONS */}
          <TabsContent value="applications" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="flex items-center gap-3 py-5">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{appStats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Applications</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 py-5">
                  <Clock className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold">{appStats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending Review</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 py-5">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold">{appStats.approved}</p>
                    <p className="text-xs text-muted-foreground">Approved Artisans</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 py-5">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{appStats.rejected}</p>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-heading">Artisan Onboarding Submissions</CardTitle>
                <CardDescription>
                  Review submitted applications from prospective artisans. Approving grants artisan status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No artisan applications submitted yet. Submissions from /apply will appear here.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Workshop & Craft</TableHead>
                        <TableHead className="hidden md:table-cell">Contact & Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <p className="font-semibold">{app.full_name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" /> {app.email}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{app.workshop_name}</p>
                            <Badge variant="outline" className="mt-1">{app.craft}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {app.phone}</p>
                            <p className="flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {app.state} ({app.pincode})</p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                app.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : app.status === 'rejected'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }
                            >
                              {app.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                                disabled={busy === app.id || app.status === 'approved'}
                                onClick={() => reviewApplication(app, 'approved')}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/40 text-red-600 dark:text-red-400"
                                disabled={busy === app.id || app.status === 'rejected'}
                                onClick={() => reviewApplication(app, 'rejected')}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: PRODUCT MODERATION */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="flex items-center gap-3 py-5">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{productStats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Listings</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 py-5">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold">{productStats.active}</p>
                    <p className="text-xs text-muted-foreground">Live</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 py-5">
                  <ShieldAlert className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold">{productStats.pending}</p>
                    <p className="text-xs text-muted-foreground">Awaiting Review</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 py-5">
                  <Archive className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{productStats.archived}</p>
                    <p className="text-xs text-muted-foreground">Flagged / Archived</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-amber-200/50 dark:border-amber-900/30">
              <CardHeader>
                <CardTitle className="text-xl font-heading">Moderation Queue</CardTitle>
                <CardDescription>
                  Live view of every listing across the marketplace. Changes apply instantly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No listings found in Firestore yet. Listings appear here as artisans publish them.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden w-[72px] sm:table-cell">Image</TableHead>
                        <TableHead>Listing</TableHead>
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead>Moderation</TableHead>
                        <TableHead className="hidden md:table-cell">Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
                        const verdict: ModerationVerdict = product.moderation ?? 'pending';
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="hidden sm:table-cell">
                              <Link href={`/product/${product.id}`} className="relative block h-11 w-11 overflow-hidden rounded-md border">
                                <Image
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  src={product.images?.[0] ?? '/placeholder.svg'}
                                />
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Link href={`/product/${product.id}`} className="font-semibold hover:text-primary flex items-center gap-1">
                                {product.name}
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </Link>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {product.artisanName || (user?.id === product.artisanId ? 'You' : 'Artisan listed')}
                                {' · '}{product.region}
                              </p>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline">{product.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={verdictStyles[verdict]}>
                                {verdict.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell font-medium">
                              {product.currency ?? '₹'}{Number(product.price || 0).toFixed(0)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                                  disabled={busy === product.id || verdict === 'approved'}
                                  onClick={() => moderateProduct(product, 'approved')}
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/40 text-red-600 dark:text-red-400"
                                  disabled={busy === product.id || verdict === 'flagged'}
                                  onClick={() => moderateProduct(product, 'flagged')}
                                >
                                  <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                                  Flag
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}