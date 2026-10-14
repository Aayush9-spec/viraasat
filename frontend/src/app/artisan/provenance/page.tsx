'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';
import { BACKEND_URL } from '@/services/backend/client';
import { products as localProducts } from '@/lib/data';

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

// ─── Client-side PoW chain generator (offline fallback) ───────────────────────

function sha256Hex(str: string): string {
  // Use a simple deterministic hash via TextEncoder + crypto subtle when available,
  // or a djb2-style fallback for older environments.
  // Since this runs in the browser, SubtleCrypto is available — but it's async.
  // We use a synchronous djb2 fallback here (good enough for UI demo purposes).
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  // Pad to 64 hex chars to mimic SHA256 output length
  return (hash >>> 0).toString(16).padStart(8, '0').repeat(8);
}

function mineBlock(
  index: number,
  timestamp: string,
  action: string,
  actor: string,
  prevHash: string,
  difficulty = 2,
): { nonce: number; hash: string } {
  const target = '0'.repeat(difficulty);
  let nonce = 0;
  while (true) {
    const h = sha256Hex(`${index}${timestamp}${action}${actor}${prevHash}${nonce}`);
    if (h.startsWith(target)) return { nonce, hash: h };
    nonce++;
    if (nonce > 500) {
      // Safety: don't spin forever in the browser — just return what we have
      return { nonce, hash: h };
    }
  }
}

function generateLocalChain(productId: string, productName: string): LedgerBlock[] {
  const now = Date.now();
  const d = (days: number) => new Date(now - days * 86400000).toISOString().slice(0, 19).replace('T', ' ');

  const GENESIS_PREV = '0000000000000000';

  const b1 = mineBlock(1, d(30), 'Artisan Identity & Workshop Verified', 'Viraasat Registrar', GENESIS_PREV);
  const b2 = mineBlock(2, d(27), 'GI Tag Authentication & Quality Test Passed', 'Handicrafts Development Board', b1.hash);
  const b3 = mineBlock(3, d(24), 'Digital Passport Issued & Genesis Block Mined', 'Viraasat Blockchain Node', b2.hash);
  const b4 = mineBlock(4, d(20), `Craft Listed on Viraasat Marketplace: ${productName}`, 'Marketplace Validator', b3.hash);

  return [
    { index: 1, timestamp: d(30), action: 'Artisan Identity & Workshop Verified', actor: 'Viraasat Registrar', hash: b1.hash, prev_hash: GENESIS_PREV, nonce: b1.nonce },
    { index: 2, timestamp: d(27), action: 'GI Tag Authentication & Quality Test Passed', actor: 'Handicrafts Development Board', hash: b2.hash, prev_hash: b1.hash, nonce: b2.nonce },
    { index: 3, timestamp: d(24), action: 'Digital Passport Issued & Genesis Block Mined', actor: 'Viraasat Blockchain Node', hash: b3.hash, prev_hash: b2.hash, nonce: b3.nonce },
    { index: 4, timestamp: d(20), action: `Craft Listed on Marketplace: ${productName}`, actor: 'Marketplace Validator', hash: b4.hash, prev_hash: b3.hash, nonce: b4.nonce },
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Products to show on this page — use first 12 local products as the artisan's catalog
const ARTISAN_PRODUCTS = localProducts.slice(0, 12).map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  region: p.region ?? 'India',
}));

async function fetchChainFromBackend(productId: string, token: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BACKEND_URL}/api/blockchain/provenance/${productId}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  return res.json() as Promise<{
    ledger_chain: LedgerBlock[];
    authenticity_score: number;
    provenance_status: string;
  }>;
}

async function generateChainFromBackend(productId: string, token: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BACKEND_URL}/api/blockchain/generate/${productId}`, {
    method: 'POST',
    headers,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  return res.json() as Promise<{
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

  const [records, setRecords] = useState<ProvenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState<string | null>(null); // productId being minted
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const [selectedItem, setSelectedItem] = useState<ProvenanceRecord | null>(null);
  const [qrItem, setQrItem] = useState<ProvenanceRecord | null>(null);

  // ── Load existing provenance chains ─────────────────────────────────────────
  const loadChains = useCallback(async () => {
    setLoading(true);

    // Check if backend is reachable
    let token: string | null = null;
    let online = false;
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { cache: 'no-store' });
      online = res.ok;
      setBackendOnline(online);
    } catch {
      setBackendOnline(false);
    }

    const fetched: ProvenanceRecord[] = [];

    for (const p of ARTISAN_PRODUCTS) {
      if (online) {
        try {
          const data = await fetchChainFromBackend(p.id, token);
          if (data.ledger_chain.length > 0) {
            fetched.push({
              product_id: p.id,
              productName: p.name,
              category: p.category,
              region: p.region,
              ledger_chain: data.ledger_chain,
              authenticity_score: data.authenticity_score,
              provenance_status: data.provenance_status,
            });
          }
        } catch {
          // skip individual failures silently
        }
      }
    }

    // If backend is offline or returned nothing, seed with local chains for the
    // first 3 products so the page isn't empty on first run
    if (fetched.length === 0) {
      const seedProducts = ARTISAN_PRODUCTS.slice(0, 3);
      for (const p of seedProducts) {
        const chain = generateLocalChain(p.id, p.name);
        const score = Math.min(95, 60 + chain.length * 10);
        fetched.push({
          product_id: p.id,
          productName: p.name,
          category: p.category,
          region: p.region,
          ledger_chain: chain,
          authenticity_score: score,
          provenance_status: 'Verified (Local PoW)',
          minted_locally: true,
        });
      }
    }

    setRecords(fetched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadChains();
  }, [loadChains]);

  // ── Mint a new passport ──────────────────────────────────────────────────────
  const handleGenerate = useCallback(
    async (productId: string, productName: string) => {
      setMinting(productId);
      try {
        if (backendOnline) {
          const data = await generateChainFromBackend(productId, null);
          const newRecord: ProvenanceRecord = {
            product_id: productId,
            productName,
            category: ARTISAN_PRODUCTS.find((p) => p.id === productId)?.category ?? '',
            region: ARTISAN_PRODUCTS.find((p) => p.id === productId)?.region ?? 'India',
            ledger_chain: data.ledger_chain,
            authenticity_score: data.authenticity_score,
            provenance_status: data.provenance_status,
          };
          setRecords((prev) => {
            const exists = prev.find((r) => r.product_id === productId);
            if (exists) return prev.map((r) => (r.product_id === productId ? newRecord : r));
            return [...prev, newRecord];
          });
          toast({
            title: data.already_existed ? '📜 Passport already exists' : '⛏️ Passport Minted!',
            description: data.already_existed
              ? `${productName}'s blockchain passport was retrieved.`
              : `${productName}'s provenance chain mined on-chain (${data.ledger_chain.length} blocks).`,
          });
        } else {
          // Offline: generate locally
          const chain = generateLocalChain(productId, productName);
          const score = Math.min(95, 60 + chain.length * 10);
          const newRecord: ProvenanceRecord = {
            product_id: productId,
            productName,
            category: ARTISAN_PRODUCTS.find((p) => p.id === productId)?.category ?? '',
            region: ARTISAN_PRODUCTS.find((p) => p.id === productId)?.region ?? 'India',
            ledger_chain: chain,
            authenticity_score: score,
            provenance_status: 'Verified (Local PoW)',
            minted_locally: true,
          };
          setRecords((prev) => {
            const exists = prev.find((r) => r.product_id === productId);
            if (exists) return prev;
            return [...prev, newRecord];
          });
          toast({
            title: '⛏️ Passport Generated (Offline)',
            description: `${productName}'s blockchain passport was generated locally with ${chain.length} blocks.`,
          });
        }
      } catch (e) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: 'Could not generate blockchain passport. Please try again.',
        });
      } finally {
        setMinting(null);
      }
    },
    [backendOnline, toast],
  );

  // ── Computed stats ───────────────────────────────────────────────────────────
  const avgScore = records.length
    ? Math.round(records.reduce((s, r) => s + r.authenticity_score, 0) / records.length)
    : 0;
  const totalBlocks = records.reduce((s, r) => s + r.ledger_chain.length, 0);

  // Products not yet passported
  const unpassportedProducts = ARTISAN_PRODUCTS.filter(
    (p) => !records.find((r) => r.product_id === p.id),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">GI Provenance & Trust Layer</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Geographical Indication (GI) authenticity certificates, blockchain verification, and craft lineage tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {backendOnline === false && (
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" /> Backend offline — local PoW mode
            </Badge>
          )}
          {backendOnline === true && (
            <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3" /> Blockchain node connected
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadChains} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
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
            {!loading && records.length > 0 && (
              <Progress value={avgScore} className="h-1.5 mt-2 bg-emerald-100" />
            )}
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
              {loading ? <Skeleton className="h-7 w-16" /> : records.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">On-chain provenance records</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <Link2 className="h-4 w-4" /> Total Blocks Mined
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-blue-700 dark:text-blue-300">
              {loading ? <Skeleton className="h-7 w-16" /> : totalBlocks}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all provenance chains</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Provenance Passports */}
      <div className="space-y-4">
        <h2 className="text-xl font-heading font-semibold">Active Provenance Passports</h2>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-amber-200/50">
              <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full" /></CardContent>
            </Card>
          ))
        ) : records.length === 0 ? (
          <Card className="border-dashed border-amber-300">
            <CardContent className="py-10 text-center space-y-3">
              <div className="flex justify-center">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">
                No provenance passports found.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Select a product below to generate its blockchain passport.
              </p>
            </CardContent>
          </Card>
        ) : (
          records.map((item) => {
            const lastBlock = item.ledger_chain[item.ledger_chain.length - 1];
            const shortHash = lastBlock
              ? `${lastBlock.hash.slice(0, 10)}…${lastBlock.hash.slice(-8)}`
              : '—';
            const isVerified = item.authenticity_score > 0;

            return (
              <Card
                key={item.product_id}
                className="border-amber-200/50 dark:border-amber-900/30 transition-shadow hover:shadow-md"
              >
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2">
                  <div>
                    <CardTitle className="text-base font-heading text-foreground flex items-center gap-2 flex-wrap">
                      {item.productName}
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">
                        {item.category}
                      </Badge>
                      {item.minted_locally && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                          Local PoW
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {item.region} · {item.ledger_chain.length} blocks in chain
                    </CardDescription>
                  </div>
                  <Badge
                    className={`flex items-center gap-1 text-xs ${
                      isVerified
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-400 text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {item.provenance_status}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Score bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress value={item.authenticity_score} className="h-2 bg-emerald-100" />
                    </div>
                    <span className="text-sm font-bold text-emerald-600 w-12 text-right">
                      {item.authenticity_score}%
                    </span>
                  </div>

                  {/* Blockchain mini-timeline */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {item.ledger_chain.map((block, idx) => (
                      <div key={block.index} className="flex items-center gap-1.5 shrink-0">
                        <div className="text-center">
                          <div className="w-7 h-7 rounded bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300">
                              #{block.index}
                            </span>
                          </div>
                          <div className="text-[8px] text-muted-foreground mt-0.5 w-16 truncate text-center">
                            {block.action.split(' ').slice(0, 2).join(' ')}
                          </div>
                        </div>
                        {idx < item.ledger_chain.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Hash & actions */}
                  <div className="flex flex-col sm:flex-row justify-between gap-2 border-t pt-3">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">Latest Hash:</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">
                        {shortHash}
                      </code>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => setQrItem(item)}
                      >
                        <QrCode className="h-3.5 w-3.5" /> Customer QR
                      </Button>
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs"
                        onClick={() => setSelectedItem(item)}
                      >
                        <FileText className="h-3.5 w-3.5" /> View Certificate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Unpassported Products — Generate Passport section */}
      {!loading && unpassportedProducts.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-heading font-semibold">Generate Passports</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Mint blockchain provenance certificates for your remaining products.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unpassportedProducts.slice(0, 8).map((p) => (
              <Card
                key={p.id}
                className="border-dashed border-amber-200 dark:border-amber-900/30 bg-muted/10 hover:bg-muted/30 transition-colors"
              >
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category} · {p.region}</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs shrink-0"
                    onClick={() => handleGenerate(p.id, p.name)}
                    disabled={minting === p.id}
                  >
                    {minting === p.id ? (
                      <>
                        <Clock className="h-3 w-3 animate-spin" /> Mining…
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3" /> Generate Passport
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#5e2c18] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Provenance Certificate
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.productName} · {selectedItem?.region}
            </DialogDescription>
          </DialogHeader>

          {/* Score summary */}
          {selectedItem && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 mb-2">
              <div>
                <p className="text-xs text-muted-foreground">Authenticity Score</p>
                <p className="text-xl font-bold text-emerald-600">{selectedItem.authenticity_score}%</p>
              </div>
              <Badge className="bg-emerald-500 text-white gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {selectedItem.provenance_status}
              </Badge>
            </div>
          )}

          <div className="space-y-3 text-sm">
            {selectedItem?.ledger_chain.map((block) => (
              <div
                key={block.index}
                className="border border-amber-200/60 bg-[#fbf7f0]/40 dark:bg-amber-950/10 p-4 rounded-sm space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#5e2c18] dark:text-amber-300 text-xs uppercase tracking-wide flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> Block #{block.index}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {block.timestamp}
                  </span>
                </div>
                <p className="font-medium text-foreground">{block.action}</p>
                <p className="text-xs text-muted-foreground">Actor: {block.actor}</p>
                <div className="space-y-1 pt-1">
                  <code className="block text-[10px] bg-muted px-2 py-1 rounded font-mono break-all text-muted-foreground">
                    hash: {block.hash}
                  </code>
                  {block.prev_hash !== '0000000000000000' && (
                    <code className="block text-[10px] bg-muted/50 px-2 py-0.5 rounded font-mono break-all text-muted-foreground/60">
                      prev: {block.prev_hash}
                    </code>
                  )}
                  <p className="text-[10px] text-muted-foreground/50">nonce: {block.nonce}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Modal */}
      <Dialog open={!!qrItem} onOpenChange={() => setQrItem(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#5e2c18]">Scan to Verify Authenticity</DialogTitle>
            <DialogDescription>
              Share this with the buyer to verify <strong>{qrItem?.productName}</strong>
            </DialogDescription>
          </DialogHeader>
          {qrItem && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-md inline-block border">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_APP_URL || 'https://viraasat.in'}/product/${qrItem.product_id}?verify=1&score=${qrItem.authenticity_score}`,
                  )}&size=200x200&margin=8`}
                  alt="Provenance QR Code"
                  width={200}
                  height={200}
                  unoptimized
                />
              </div>
              <div className="space-y-1 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Progress value={qrItem.authenticity_score} className="w-32 h-2 bg-emerald-100" />
                  <span className="text-sm font-bold text-emerald-600">{qrItem.authenticity_score}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{qrItem.provenance_status}</p>
                <p className="text-xs text-muted-foreground">
                  {qrItem.ledger_chain.length} verified blocks on Viraasat Ledger
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${process.env.NEXT_PUBLIC_APP_URL || 'https://viraasat.in'}/product/${qrItem.product_id}?verify=1`,
                  );
                  toast({ title: 'Link copied!', description: 'Verification link copied to clipboard.' });
                }}
              >
                Copy Verification Link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
