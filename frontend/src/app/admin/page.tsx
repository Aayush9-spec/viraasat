'use client';

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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAdminDashboard,
  type DbProduct,
  type ArtisanApplication,
  type ModerationVerdict,
} from '@/features/artisan/hooks/use-admin-dashboard';

const verdictStyles: Record<ModerationVerdict, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  flagged: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

export default function AdminDashboardPage() {
  const {
    user,
    role,
    loading,
    products,
    applications,
    busy,
    productStats,
    appStats,
    moderateProduct,
    reviewApplication,
  } = useAdminDashboard();

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

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b border-primary/10 bg-[#fbf7f0] py-10">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
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

      <main className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-10">
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