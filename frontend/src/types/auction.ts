export interface Bid {
  id: string;
  auctionId: string;
  bidderName: string;
  bidderRole?: 'patron' | 'collector' | 'institution';
  amount: number;
  timestamp: string;
}

export interface UniqueArtAuction {
  id: string;
  title: string;
  artisanName: string;
  artisanRegion: string;
  craftCategory: string;
  giTagCertified: boolean;
  provenanceHash: string;
  description: string;
  imageUrl: string;
  minPrice: number;            // Reserve minimum starting price in INR
  currentBid: number;          // Current highest bid in INR
  bidCount: number;
  minIncrement: number;        // Minimum step up (e.g., 500, 1000, 2500)
  startTime: string;           // ISO timestamp
  endTime: string;             // ISO timestamp
  durationHours: number;       // Auction period in hours (e.g. 24, 72, 168)
  status: 'active' | 'ended' | 'upcoming';
  bids: Bid[];
  sellerEmail?: string;
  createdAt: string;
}
