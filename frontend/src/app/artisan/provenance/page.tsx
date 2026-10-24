'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/core/hooks/use-toast';
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  QrCode,
  FileText,
  Zap,
  Link2,
  Clock,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  Printer,
  Sparkles,
  Lock,
} from 'lucide-react';
import { BACKEND_URL } from '@/services/backend/client';
import { categories, regions, getLocalProducts, products as fallbackProducts } from '@/lib/data';
import { useProducts } from '@/features/marketplace/hooks/use-products';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LedgerBlock {
  index: number;
  timestamp: string;
  action: string;
  actor: string;
  hash: string;
  prev_hash: string;
  nonce: number;
}

interface ProvenanceRecord {
  product_id: string;
  productName: string;
  category: string;
  region: string;
  ledger_chain: LedgerBlock[];
  authenticity_score: number;
  provenance_status: string;
  minted_locally?: boolean;
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  region: string;
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function fetchChainFromBackend(productId: string) {
  const res = await fetch(`${BACKEND_URL}/api/blockchain/provenance/${productId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  return res.json() as Promise<{
    product_id: string;
    ledger_chain: LedgerBlock[];
    authenticity_score: number;
    provenance_status: string;
    blockchain_network?: string;
  }>;
}

async function generateChainFromBackend(productId: string) {
  const res = await fetch(`${BACKEND_URL}/api/blockchain/generate/${productId}`, {
    method: 'POST',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  return res.json() as Promise<{
    product_id: string;
    ledger_chain: LedgerBlock[];
    authenticity_score: number;
    provenance_status: string;
    already_existed: boolean;
  }>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArtisanProvenancePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { products: liveProducts, loading: productsLoading } = useProducts();

  const [records, setRecords] = useState<ProvenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const [selectedItem, setSelectedItem] = useState<ProvenanceRecord | null>(null);
  const [qrItem, setQrItem] = useState<ProvenanceRecord | null>(null);

  // Derive real artisan catalog from live database + local studio products
  const allArtisanProducts = useMemo<ProductItem[]>(() => {
    const list: ProductItem[] = [];
    const seen = new Set<string>();

    // 1. Live Firestore / state products
    if (liveProducts && liveProducts.length > 0) {
      liveProducts.forEach((p) => {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          list.push({
            id: p.id,
            name: p.name,
            category: p.category || 'Home Decor',
            region: p.region || 'Rajasthan',
          });
        }
      });
    }

    // 2. Newly added artisan studio products (including Diya)
    const local = getLocalProducts();
    if (local && local.length > 0) {
      local.forEach((p) => {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          list.push({
            id: p.id,
            name: p.name,
            category: p.category || 'Home Decor',
            region: p.region || 'Rajasthan',
          });
        }
      });
    }

    // 3. Fallback catalogue
    if (list.length === 0) {
      fallbackProducts.slice(0, 12).forEach((p) => {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          list.push({
            id: p.id,
            name: p.name,
            category: p.category,
            region: p.region || 'Rajasthan',
          });
        }
      });
    }

    return list;
  }, [liveProducts]);

  // ── Load live blockchain provenance records ──────────────────────────────────
  const loadChains = useCallback(async () => {
    setLoading(true);

    let online = false;
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { cache: 'no-store' });
      online = res.ok;
      setBackendOnline(online);
    } catch {
      setBackendOnline(false);
    }

    const fetched: ProvenanceRecord[] = [];

    // Query backend blockchain for all products in catalog
    if (online) {
      for (const p of allArtisanProducts) {
        try {
          const data = await fetchChainFromBackend(p.id);
          if (data && data.ledger_chain && data.ledger_chain.length > 0) {
            fetched.push({
              product_id: p.id,
              productName: p.name,
              category: p.category,
              region: p.region,
              ledger_chain: data.ledger_chain,
              authenticity_score: data.authenticity_score,
              provenance_status: data.provenance_status,
              minted_locally: false,
            });
          }
        } catch {
          // ignore individual item lookup misses
        }
      }
    }

    setRecords(fetched);
    setLoading(false);
  }, [allArtisanProducts]);

  useEffect(() => {
    loadChains();
  }, [loadChains]);

  // ── Mint a new on-chain passport with Proof of Work ──────────────────────────
  const handleGenerate = useCallback(
    async (productId: string, productName: string) => {
      setMinting(productId);
      try {
        const data = await generateChainFromBackend(productId);
        const prod = allArtisanProducts.find((p) => p.id === productId);
        const newRecord: ProvenanceRecord = {
          product_id: productId,
          productName,
          category: prod?.category ?? 'Home Decor',
          region: prod?.region ?? 'India',
          ledger_chain: data.ledger_chain,
          authenticity_score: data.authenticity_score,
          provenance_status: data.provenance_status,
          minted_locally: false,
        };

        setRecords((prev) => {
          const exists = prev.find((r) => r.product_id === productId);
          if (exists) return prev.map((r) => (r.product_id === productId ? newRecord : r));
          return [newRecord, ...prev];
        });

        toast({
          title: data.already_existed ? '📜 Passport Already Exists' : '⛏️ On-Chain Passport Minted!',
          description: data.already_existed
            ? `${productName}'s blockchain passport was retrieved from the ledger.`
            : `${productName}'s SHA-256 Proof-of-Work chain mined (${data.ledger_chain.length} blocks).`,
        });
      } catch (e) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: 'Mining Failed',
          description: 'Could not mine block on blockchain node. Please verify backend connection.',
        });
      } finally {
        setMinting(null);
      }
    },
    [allArtisanProducts, toast],
  );

  // ── Computed stats ───────────────────────────────────────────────────────────
  const avgScore = records.length
    ? Math.round(records.reduce((s, r) => s + r.authenticity_score, 0) / records.length)
    : 95;
  const totalBlocks = records.reduce((s, r) => s + r.ledger_chain.length, 0);

  // Products not yet passported
  const unpassportedProducts = allArtisanProducts.filter(
    (p) => !records.some((r) => r.product_id === p.id),
  );

  return (
    <div className="space-y-6 text-left selection:bg-amber-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#5e2c18]">
            GI Provenance & Trust Layer
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Geographical Indication (GI) authenticity certificates, SHA-256 blockchain verification, and craft lineage tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {backendOnline === false && (
            <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50 gap-1 text-[11px] font-medium">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Blockchain Node Reconnecting
            </Badge>
          )}
          {backendOnline === true && (
            <Badge variant="outline" className="text-emerald-800 border-emerald-300 bg-emerald-50 gap-1 text-[11px] font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Mainnet Node Connected (PoW Active)
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadChains}
            disabled={loading}
            className="border-amber-900/20 text-[#5e2c18] hover:bg-amber-100/50 rounded-none text-xs gap-1.5 font-bold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* Royal Heritage Coordinated Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Authenticity Index */}
        <Card className="rounded-none border-amber-900/15 bg-[#fbf7f0] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#5e2c18] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#c59b4b]" />
              Authenticity Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-[#5e2c18]">
              {loading ? <Skeleton className="h-8 w-24" /> : `${avgScore}% Score`}
            </div>
            <div className="w-full bg-[#e8dccb] h-1.5 mt-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#5e2c18] via-[#8c2b2b] to-[#c59b4b] h-full transition-all duration-500"
                style={{ width: `${avgScore}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Average GI & craft provenance score across your catalog
            </p>
          </CardContent>
        </Card>

        {/* Verified Products */}
        <Card className="rounded-none border-amber-900/15 bg-[#fbf7f0] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#5e2c18] flex items-center gap-2">
              <Award className="h-4 w-4 text-[#c59b4b]" />
              Verified Heirloom Passports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-[#5e2c18]">
              {loading ? <Skeleton className="h-8 w-16" /> : records.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Cryptographically sealed on-chain records
            </p>
          </CardContent>
        </Card>

        {/* Total Blocks Mined */}
        <Card className="rounded-none border-amber-900/15 bg-[#fbf7f0] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#5e2c18] flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#c59b4b]" />
              Total Proof-of-Work Blocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-[#5e2c18]">
              {loading ? <Skeleton className="h-8 w-16" /> : totalBlocks}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Mined with difficulty-target zero padding across ledger
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Provenance Passports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-[#5e2c18]">
            Active Provenance Passports
          </h2>
          <span className="text-xs text-muted-foreground">
            {records.length} Certified Artifact{records.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-none border-amber-900/15 bg-[#fbf7f0]/50 p-6 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))
        ) : records.length === 0 ? (
          <Card className="rounded-none border-dashed border-amber-900/20 bg-[#fbf7f0]/40">
            <CardContent className="py-12 text-center space-y-3">
              <div className="flex justify-center">
                <ShieldCheck className="h-10 w-10 text-amber-800/30" />
              </div>
              <p className="text-sm font-semibold text-[#5e2c18]">
                No on-chain passports mined yet
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Select your created creations below (e.g. Diya or Pottery) and click &ldquo;Mint Blockchain Passport&rdquo; to seal their origin cryptographically on the ledger.
              </p>
            </CardContent>
          </Card>
        ) : (
          records.map((item) => {
            const lastBlock = item.ledger_chain[item.ledger_chain.length - 1];
            const shortHash = lastBlock
              ? `${lastBlock.hash.slice(0, 10)}…${lastBlock.hash.slice(-8)}`
              : '—';

            return (
              <Card
                key={item.product_id}
                className="rounded-none border-amber-900/15 bg-[#fbf7f0] shadow-sm hover:border-amber-900/30 transition-all duration-200"
              >
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2">
                  <div>
                    <CardTitle className="text-base font-heading text-[#5e2c18] flex items-center gap-2 flex-wrap">
                      <span>{item.productName}</span>
                      <Badge className="bg-[#5e2c18] text-amber-200 text-[10px] rounded-none border-none">
                        {item.category}
                      </Badge>
                      <Badge variant="outline" className="border-amber-900/20 text-[#5e2c18] bg-amber-50 text-[10px] rounded-none">
                        On-Chain SHA-256
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      {item.region} · {item.ledger_chain.length} Cryptographic Blocks in Chain
                    </CardDescription>
                  </div>
                  <Badge className="bg-emerald-800 text-white rounded-none text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                    Verified On-Chain
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-4 pt-1">
                  {/* Authenticity Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-[#5e2c18]">GI Lineage Confidence</span>
                      <span className="font-mono font-bold text-emerald-800">{item.authenticity_score}%</span>
                    </div>
                    <div className="w-full bg-[#e8dccb] h-2 rounded-none overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#5e2c18] via-[#8c2b2b] to-[#c59b4b] h-full"
                        style={{ width: `${item.authenticity_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Blockchain Block Node Timeline */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
                    {item.ledger_chain.map((block, idx) => (
                      <div key={block.index} className="flex items-center gap-2 shrink-0">
                        <div className="text-center group cursor-pointer" title={`Hash: ${block.hash}`}>
                          <div className="w-8 h-8 rounded-none bg-[#5e2c18] text-amber-200 border border-amber-900/30 flex items-center justify-center font-mono font-bold text-[10px] shadow-sm">
                            #{block.index}
                          </div>
                          <div className="text-[9px] font-medium text-[#5e2c18] mt-1 w-20 truncate text-center">
                            {block.action.split(' ').slice(0, 2).join(' ')}
                          </div>
                        </div>
                        {idx < item.ledger_chain.length - 1 && (
                          <ArrowRight className="h-3.5 w-3.5 text-[#c59b4b] shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Hash & Action Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-amber-900/10 pt-3">
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#5e2c18]">Mined Block Hash:</span>
                      <code className="bg-amber-100/60 text-[#5e2c18] px-2 py-0.5 rounded-none font-mono text-[10px] border border-amber-900/15">
                        {shortHash}
                      </code>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQrItem(item)}
                        className="border-amber-900/20 text-[#5e2c18] hover:bg-amber-100/50 rounded-none text-xs font-bold gap-1.5"
                      >
                        <QrCode className="h-3.5 w-3.5 text-amber-700" />
                        Customer QR
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                        className="bg-[#5e2c18] hover:bg-[#4a2315] text-white rounded-none text-xs font-bold uppercase tracking-wider gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5 text-amber-300" />
                        View Certificate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Mint Passports Section for Real Uncertified Creations */}
      {!loading && unpassportedProducts.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-amber-900/10">
          <div>
            <h2 className="text-xl font-heading font-semibold text-[#5e2c18]">
              Mint Blockchain Passports
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Mine permanent Proof-of-Work authenticity certificates for your remaining studio creations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unpassportedProducts.slice(0, 8).map((p) => (
              <Card
                key={p.id}
                className="rounded-none border border-amber-900/15 bg-[#fbf7f0]/60 hover:bg-[#fbf7f0] transition-colors"
              >
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#5e2c18] truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category} · {p.region}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleGenerate(p.id, p.name)}
                    disabled={minting === p.id}
                    className="bg-[#5e2c18] hover:bg-[#4a2315] text-white rounded-none text-xs font-bold uppercase tracking-wider gap-1.5 shrink-0"
                  >
                    {minting === p.id ? (
                      <>
                        <Clock className="h-3 w-3 animate-spin text-amber-300" />
                        Mining PoW...
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3 text-amber-300" />
                        Mint Passport
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Royal GI Provenance Certificate Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-none border border-amber-900/30 bg-[#fbf7f0] p-6 text-left">
          <DialogHeader className="border-b border-amber-900/20 pb-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-[#c59b4b] border-[#c59b4b]/40 mb-1">
                  National Handloom & GI Registry
                </Badge>
                <DialogTitle className="text-2xl font-heading font-bold text-[#5e2c18]">
                  Certificate of Authentic Indian Heritage
                </DialogTitle>
                <DialogDescription className="text-xs text-[#8c2b2b] font-serif italic mt-0.5">
                  Issued under the Viraasat Cryptographic Provenance Standard
                </DialogDescription>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-[#c59b4b] bg-amber-100 flex items-center justify-center shrink-0 shadow-sm">
                <Award className="h-6 w-6 text-[#5e2c18]" />
              </div>
            </div>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-5 pt-2">
              {/* Product & Certification Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-amber-100/40 border border-amber-900/10 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Artifact Name</span>
                  <p className="font-bold text-[#5e2c18] mt-0.5 truncate">{selectedItem.productName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">GI Craft Region</span>
                  <p className="font-bold text-[#5e2c18] mt-0.5">{selectedItem.region}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Craft Category</span>
                  <p className="font-bold text-[#5e2c18] mt-0.5">{selectedItem.category}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Trust Score</span>
                  <p className="font-bold text-emerald-800 mt-0.5">{selectedItem.authenticity_score}% Verified</p>
                </div>
              </div>

              {/* Cryptographic Ledger Blocks */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5e2c18] mb-2 flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-[#c59b4b]" />
                  Cryptographic Block Tree (Proof-of-Work)
                </h4>
                <div className="space-y-2.5">
                  {selectedItem.ledger_chain.map((block) => (
                    <div
                      key={block.index}
                      className="border border-amber-900/15 bg-white/70 p-3.5 rounded-none space-y-1.5 text-xs shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#5e2c18] flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-[#5e2c18] text-amber-200 text-[10px] flex items-center justify-center font-mono font-bold">
                            #{block.index}
                          </span>
                          {block.action}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3 text-amber-600" />
                          {block.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Certified Actor: <strong className="text-[#5e2c18]">{block.actor}</strong>
                      </p>
                      <div className="space-y-1 pt-1 font-mono text-[10px]">
                        <div className="p-1.5 bg-[#fbf7f0] border border-amber-900/10 text-muted-foreground break-all">
                          <strong className="text-[#5e2c18]">Hash:</strong> {block.hash}
                        </div>
                        {block.prev_hash !== '0000000000000000' && (
                          <div className="p-1 bg-[#fbf7f0]/60 text-muted-foreground/80 break-all text-[9px]">
                            <strong>Prev:</strong> {block.prev_hash}
                          </div>
                        )}
                        <span className="text-[9px] text-muted-foreground block">Nonce: {block.nonce}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2 border-t border-amber-900/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="border-amber-900/20 text-[#5e2c18] hover:bg-amber-100/50 rounded-none text-xs gap-1.5 font-bold"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Official Certificate
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                  className="bg-[#5e2c18] hover:bg-[#4a2315] text-white rounded-none text-xs font-bold uppercase tracking-wider"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer QR Dialog */}
      <Dialog open={!!qrItem} onOpenChange={() => setQrItem(null)}>
        <DialogContent className="max-w-sm text-center rounded-none border border-amber-900/30 bg-[#fbf7f0] p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#5e2c18] text-lg font-bold">
              Provenance QR Passport
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Embed onto product tags for buyer authenticity verification
            </DialogDescription>
          </DialogHeader>

          {qrItem && (
            <div className="flex flex-col items-center gap-4 pt-2">
              <div className="p-4 bg-white border border-amber-900/20 shadow-md">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                    `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002'}/product/${qrItem.product_id}?provenance=verified`,
                  )}&size=200x200&margin=8`}
                  alt="Provenance QR Code"
                  width={180}
                  height={180}
                  unoptimized
                />
              </div>

              <div className="space-y-1 text-center">
                <h4 className="font-heading font-bold text-[#5e2c18] text-sm">{qrItem.productName}</h4>
                <p className="text-xs text-muted-foreground">
                  {qrItem.ledger_chain.length} Cryptographic Blocks Verified
                </p>
                <Badge className="bg-emerald-800 text-white rounded-none text-[10px] mt-1">
                  SHA-256 On-Chain
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full border-amber-900/20 text-[#5e2c18] hover:bg-amber-100/50 rounded-none text-xs font-bold gap-1.5"
                onClick={() => {
                  const url = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002'}/product/${qrItem.product_id}?provenance=verified`;
                  navigator.clipboard.writeText(url);
                  toast({
                    title: 'Verification Link Copied',
                    description: 'Ready to share with buyers or print on artisan tags.',
                  });
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Verification URL
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
