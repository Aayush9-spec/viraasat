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
} from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { useUserRole } from '@/hooks/use-user-role';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type ModerationVerdict = 'pending' | 'approved' | 'flagged';

const verdictStyles: Record<ModerationVerdict, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  flagged: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

interface DbProduct extends Product {
  moderation?: ModerationVerdict;
}

export default function AdminDashboardPage() {
  const { user } = useUser();
  const { role, loading } = useUserRole();
  const { toast } = useToast();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as DbProduct));
    });
    return () => unsubscribe();
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

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === 'active').length,
    archived: products.filter((p) => p.status === 'archived' || p.moderation === 'flagged').length,
    pending: products.filter((p) => (p.moderation ?? 'pending') === 'pending').length,
  };

  const moderate = async (product: DbProduct, verdict: 'approved' | 'flagged') => {
    if (!db || !user) return;
    setBusy(product.id);
    try {
      await updateDoc(doc(db, 'products', product.id), {
        moderation: verdict,
        status: verdict === 'approved' ? 'active' : 'archived',
        updatedAt: new Date().toISOString(),
        ...(verdict === 'approved' ? {} : { moderationNote: 'Flagged by content moderation review' }),
      });
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

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b border-primary/10 bg-[#fbf7f0] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-primary font-bold mb-2">
            <Shield className="h-4 w-4" />
            Admin Console
          </div>
          <h1 className="text-3xl md:text-4xl font-heading text-[#5e2c18]">Marketplace Moderation</h1>
          <p className="mt-2 text-sm text-foreground/60 max-w-2xl">
            Review artisan listings, surface flagged content, and keep the marketplace authentic.
            Approvals make listings live; flags archive them instantly.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-3 py-5">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Listings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-5">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Live</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-5">
              <ShieldAlert className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Awaiting Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-5">
              <Archive className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.archived}</p>
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
                              onClick={() => moderate(product, 'approved')}
                            >
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/40 text-red-600 dark:text-red-400"
                              disabled={busy === product.id || verdict === 'flagged'}
                              onClick={() => moderate(product, 'flagged')}
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
      </main>
    </div>
  );
}