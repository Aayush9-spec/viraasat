import type { Metadata } from 'next';
import { UniqueArtAuctionSection } from '@/features/auctions/components/unique-art-auction-section';

export const metadata: Metadata = {
  title: 'Unique Art & Royal Heirloom Auctions — Viraasat',
  description:
    'Direct-from-master live auctions of rare Indian Geographical Indication (GI) certified artworks and museum-grade handicrafts. Set reserve prices and auction periods with tamper-proof blockchain provenance.',
};

export default function AuctionsPage() {
  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <UniqueArtAuctionSection id="auctions-main" />
    </div>
  );
}

