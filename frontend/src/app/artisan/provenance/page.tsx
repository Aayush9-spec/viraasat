'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle2, Award, QrCode, FileText } from 'lucide-react';

const provenanceItems = [
  {
    id: 'GI-RJ-2024-001',
    craftName: 'Blue Pottery of Jaipur',
    giTag: 'GI Registry #178',
    artisanName: 'Shri Ramswaroop Kripal',
    region: 'Jaipur, Rajasthan',
    certificationStatus: 'Verified & Immutable',
    blockHash: '0x8f72a91b...4c3d2e1a',
    timestamp: '2026-08-15',
  },
  {
    id: 'GI-KSH-2024-042',
    craftName: 'Pashmina Craftsmanship',
    giTag: 'GI Registry #46',
    artisanName: 'Ghulam Rasool',
    region: 'Srinagar, Jammu & Kashmir',
    certificationStatus: 'Verified & Immutable',
    blockHash: '0x3a4b5c6d...9e8f7a6b',
    timestamp: '2026-08-10',
  },
];

export default function ArtisanProvenancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">GI Provenance & Trust Layer</h1>
        <p className="text-muted-foreground text-sm">
          Geographical Indication (GI) authenticity certificates, blockchain verification, and craft lineage tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Authenticity Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-300">100% Guaranteed</div>
            <p className="text-xs text-muted-foreground mt-1">Verified against GI Knowledge Graph</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 dark:bg-amber-950/40 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Award className="h-4 w-4" /> Registered Craft Guilds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-amber-700 dark:text-amber-300">Jaipur Guild #12</div>
            <p className="text-xs text-muted-foreground mt-1">Certified Master Artisan</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <QrCode className="h-4 w-4" /> Digital Passport Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-blue-700 dark:text-blue-300">1,420 Scans</div>
            <p className="text-xs text-muted-foreground mt-1">Customer authenticity queries</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-heading font-semibold">Active Provenance Passports</h2>
        {provenanceItems.map((item) => (
          <Card key={item.id} className="border-amber-200/50 dark:border-amber-900/30">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-lg font-heading text-foreground flex items-center gap-2">
                  {item.craftName}
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {item.giTag}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Artisan: {item.artisanName} • {item.region}
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500 text-white flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {item.certificationStatus}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap justify-between text-xs text-muted-foreground border-t pt-3 gap-2">
                <div>
                  <span className="font-semibold text-foreground">Block Hash:</span>{' '}
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{item.blockHash}</code>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Date Registered:</span> {item.timestamp}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <QrCode className="h-3.5 w-3.5" /> Generate Customer QR
                </Button>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" /> View Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
