'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, CheckCircle2, Award, QrCode, FileText, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { useBackend } from '@/hooks/use-backend';

interface LedgerBlock {
  index: number;
  timestamp: string;
  action: string;
  actor: string;
  hash: string;
  prev_hash: string;
  nonce: number;
}

interface ProvenanceResult {
  product_id: string;
  productName: string;
  category: string;
  region: string;
  ledger_chain: LedgerBlock[];
  authenticity_score: number;
  provenance_status: string;
}

export default function ArtisanProvenancePage() {
  const { user } = useUser();
  const { get } = useBackend();
  const [items, setItems] = useState<ProvenanceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ProvenanceResult | null>(null);
  const [qrItem, setQrItem] = useState<ProvenanceResult | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchProvenance() {
      setLoading(true);
      try {
        // Get this artisan's products from Supabase
        const { data: products } = await supabase
          .from('products')
          .select('id, name, category, region')
          .eq('artisan_id', user!.id)
          .limit(20);

        if (!products || products.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch provenance chain for each product from backend
        const results = await Promise.allSettled(
          products.map(async (p) => {
            const data = await get<{
              ledger_chain: LedgerBlock[];
              authenticity_score: number;
              provenance_status: string;
            }>(`/api/blockchain/provenance/${p.id}`);
            return {
              product_id: p.id,
              productName: p.name,
              category: p.category,
              region: p.region,
              ledger_chain: data.ledger_chain ?? [],
              authenticity_score: data.authenticity_score ?? 0,
              provenance_status: data.provenance_status ?? 'Unverified',
            } as ProvenanceResult;
          }),
        );

        const fulfilled = results
          .filter((r): r is PromiseFulfilledResult<ProvenanceResult> => r.status === 'fulfilled')
          .map((r) => r.value)
          .filter((r) => r.ledger_chain.length > 0);

        setItems(fulfilled);
      } catch (e) {
        console.error('Failed to load provenance data:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchProvenance();
  }, [user, get]);

  const totalScans = items.reduce((s, i) => s + i.ledger_chain.length, 0);
  const avgScore = items.length
    ? Math.round(items.reduce((s, i) => s + i.authenticity_score, 0) / items.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">GI Provenance & Trust Layer</h1>
        <p className="text-muted-foreground text-sm">
          Geographical Indication (GI) authenticity certificates, blockchain verification, and craft lineage tracking.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Authenticity Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-300">
              {loading ? <Skeleton className="h-7 w-20" /> : `${avgScore}% Score`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg across your products</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 dark:bg-amber-950/40 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Award className="h-4 w-4" /> Verified Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-amber-700 dark:text-amber-300">
              {loading ? <Skeleton className="h-7 w-16" /> : items.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">On-chain provenance records</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <QrCode className="h-4 w-4" /> Total Blocks Mined
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-blue-700 dark:text-blue-300">
              {loading ? <Skeleton className="h-7 w-16" /> : totalScans}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all provenance chains</p>
          </CardContent>
        </Card>
      </div>

      {/* Provenance list */}
      <div className="space-y-4">
        <h2 className="text-xl font-heading font-semibold">Active Provenance Passports</h2>

        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-amber-200/50">
              <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full" /></CardContent>
            </Card>
          ))
        ) : items.length === 0 ? (
          <Card className="border-dashed border-amber-200/50">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No provenance records found. List a product to auto-generate its blockchain passport.
            </CardContent>
          </Card>
        ) : (
          items.map((item) => {
            const lastBlock = item.ledger_chain[item.ledger_chain.length - 1];
            const shortHash = lastBlock
              ? `${lastBlock.hash.slice(0, 10)}...${lastBlock.hash.slice(-8)}`
              : '—';

            return (
              <Card key={item.product_id} className="border-amber-200/50 dark:border-amber-900/30">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <CardTitle className="text-lg font-heading text-foreground flex items-center gap-2">
                      {item.productName}
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        {item.category}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{item.region} · {item.ledger_chain.length} blocks</CardDescription>
                  </div>
                  <Badge className={`flex items-center gap-1 ${item.authenticity_score > 0 ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> {item.provenance_status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap justify-between text-xs text-muted-foreground border-t pt-3 gap-2">
                    <div>
                      <span className="font-semibold text-foreground">Latest Block Hash:</span>{' '}
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{shortHash}</code>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Authenticity Score:</span>{' '}
                      <span className="text-emerald-600 font-bold">{item.authenticity_score}%</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => setQrItem(item)}
                    >
                      <QrCode className="h-3.5 w-3.5" /> Generate Customer QR
                    </Button>
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs"
                      onClick={() => setSelectedItem(item)}
                    >
                      <FileText className="h-3.5 w-3.5" /> View Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Certificate modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#5e2c18]">
              Provenance Certificate — {selectedItem?.productName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {selectedItem?.ledger_chain.map((block) => (
              <div key={block.index} className="border border-amber-200/60 bg-[#fbf7f0]/40 p-4 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#5e2c18] text-xs uppercase tracking-wide">Block #{block.index}</span>
                  <span className="text-xs text-muted-foreground">{block.timestamp}</span>
                </div>
                <p className="font-medium text-foreground">{block.action}</p>
                <p className="text-xs text-muted-foreground mt-1">Actor: {block.actor}</p>
                <code className="block mt-2 text-[10px] bg-muted px-2 py-1 rounded font-mono break-all text-muted-foreground">
                  {block.hash}
                </code>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR modal */}
      <Dialog open={!!qrItem} onOpenChange={() => setQrItem(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#5e2c18]">Scan to Verify</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Share this QR with the buyer to verify authenticity of <strong>{qrItem?.productName}</strong>.
          </p>
          {qrItem && (
            <div className="flex justify-center">
              <div className="p-2 bg-white rounded-lg shadow-md inline-block">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_APP_URL || 'https://viraasat-eta.vercel.app'}/product/${qrItem.product_id}?verify=1`
                  )}&size=200x200`}
                  alt="Provenance QR Code"
                  width={200}
                  height={200}
                  unoptimized
                />
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Score: <strong className="text-emerald-600">{qrItem?.authenticity_score}%</strong> · {qrItem?.provenance_status}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
