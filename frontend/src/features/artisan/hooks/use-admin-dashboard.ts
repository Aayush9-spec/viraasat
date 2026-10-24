'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/services/supabase';
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

    // Fetch Products
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setProducts(
            data.map((r) => ({
              ...r,
              artisanId: r.artisan_id,
              createdAt: r.created_at,
              aiInsights: r.ai_insights,
            })) as DbProduct[]
          );
        }
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
      .channel(`admin-products-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) {
          setProducts(
            data.map((r) => ({
              ...r,
              artisanId: r.artisan_id,
              createdAt: r.created_at,
              aiInsights: r.ai_insights,
            })) as DbProduct[]
          );
        }
      })
      .subscribe();

    const channelApps = supabase
      .channel(`admin-applications-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artisan_applications' }, async () => {
        const { data } = await supabase
          .from('artisan_applications')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setApplications(data as ArtisanApplication[]);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channelProducts);
      void supabase.removeChannel(channelApps);
    };
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
      await supabase
        .from('products')
        .update({
          moderation: verdict,
          status: verdict === 'approved' ? 'active' : 'archived',
        })
        .eq('id', product.id);

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
      await supabase
        .from('artisan_applications')
        .update({ status })
        .eq('id', app.id);

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
