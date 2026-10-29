'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserRole } from '@/features/auth/hooks/use-user-role';
import { useToast } from '@/core/hooks/use-toast';
import type { Product } from '@/lib/types';

export type ModerationVerdict = 'pending' | 'approved' | 'flagged';

export interface DbProduct extends Product {
  moderation?: ModerationVerdict;
}

export interface ArtisanApplication {
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

export function useAdminDashboard() {
  const { user } = useUser();
  const { role, loading } = useUserRole();
  const { toast } = useToast();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [applications, setApplications] = useState<ArtisanApplication[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch('/api/admin', { cache: 'no-store' });
        if (!response.ok) throw new Error('Admin data unavailable');
        const data = await response.json();
        if (cancelled) return;
        setProducts(data.products.map((r: any) => ({ ...r, artisanId: r.artisan_id, createdAt: r.created_at, aiInsights: r.ai_insights })));
        setApplications(data.applications);
      } catch (error) { console.warn('Admin data unavailable', error); }
    };
    void refresh();
    window.addEventListener('focus', refresh);
    return () => { cancelled = true; window.removeEventListener('focus', refresh); };

  }, [user]);

  const productStats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.status === 'active').length,
      archived: products.filter((p) => p.status === 'archived' || p.moderation === 'flagged').length,
      pending: products.filter((p) => (p.moderation ?? 'pending') === 'pending').length,
    }),
    [products]
  );

  const appStats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      approved: applications.filter((a) => a.status === 'approved').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    }),
    [applications]
  );

  const moderateProduct = async (product: DbProduct, verdict: 'approved' | 'flagged') => {
    if (!user) return;
    setBusy(product.id);
    try {
      const response = await fetch('/api/admin', {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'product',id:product.id,verdict})});
      if (!response.ok) throw new Error('Moderation failed');
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, moderation: verdict, status: verdict === 'approved' ? 'active' : 'archived' } : p));

      toast({
        title: verdict === 'approved' ? 'Listing approved' : 'Listing flagged',
        description:
          verdict === 'approved'
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
      const response = await fetch('/api/admin', {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'application',id:app.id,verdict:status})});
      if (!response.ok) throw new Error('Application review failed');

      setApplications((prev) =>
        prev.map((item) => (item.id === app.id ? { ...item, status } : item))
      );

      toast({
        title: status === 'approved' ? 'Application Approved!' : 'Application Rejected',
        description:
          status === 'approved'
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

  return {
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
  };
}
