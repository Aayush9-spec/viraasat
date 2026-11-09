import { UniqueArtAuction, Bid } from '@/types/auction';
import { supabase } from '@/services/supabase';

// Seed auctions with verified timestamps and master artisan emails
const INITIAL_AUCTIONS: UniqueArtAuction[] = [
  {
    id: 'auction-zardozi-royal',
    title: 'Imperial 24K Gold Zardozi Wall Hanging (c. 1978 Royal Pattern)',
    artisanName: 'Ustad Abdul Qadir & Sons',
    artisanRegion: 'Varanasi, Uttar Pradesh',
    craftCategory: 'Zardozi & Gold Metallic Embroidery',
    giTagCertified: true,
    provenanceHash: '0x8f4c91a0b3e2...7b2a',
    description: 'An irreplaceable museum-grade tapestry hand-stitched over 14 months using real 24-karat gold dipped silver wires (kalabattu) over pure velvet silk. Features ancestral Mughal floral arabesques and Persian medallions.',
    imageUrl: '/images/products/zardozi-embroidery.jpg',
    minPrice: 85000,
    currentBid: 114000,
    bidCount: 16,
    minIncrement: 2500,
    startTime: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    durationHours: 120,
    status: 'active',
    sellerEmail: 'abdul.qadir@viraasat.in',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    bids: [
      { id: 'b4', auctionId: 'auction-zardozi-royal', bidderName: 'National Textile Guild Patron', bidderRole: 'collector', amount: 114000, timestamp: '2 hours ago' },
      { id: 'b3', auctionId: 'auction-zardozi-royal', bidderName: 'Vikramaditya R.', bidderRole: 'patron', amount: 105000, timestamp: '14 hours ago' },
      { id: 'b2', auctionId: 'auction-zardozi-royal', bidderName: 'Claire D., Louvre Arts Curator', bidderRole: 'collector', amount: 95000, timestamp: '1 day ago' },
      { id: 'b1', auctionId: 'auction-zardozi-royal', bidderName: 'Maharaja Heritage Trust', bidderRole: 'institution', amount: 85000, timestamp: '2 days ago' },
    ]
  },
  {
    id: 'auction-dhokra-shaman',
    title: 'Tribal Bastar Dhokra Dancing Shaman (Solid Bronze Lost-Wax Cast)',
    artisanName: 'Sukhdev Baghel Guild',
    artisanRegion: 'Bastar, Chhattisgarh',
    craftCategory: 'Dhokra Non-Ferrous Lost-Wax Metal Casting',
    giTagCertified: true,
    provenanceHash: '0x3c7e44f810aa...e911',
    description: 'Cast using an unbroken 4,000-year-old metallurgical technique traced back to Mohenjo-daro. Each beeswax mold is destroyed during casting, making this exact tribal sculpture entirely unique and unrepeatable.',
    imageUrl: '/images/products/metal-sculpting.jpg',
    minPrice: 42000,
    currentBid: 58500,
    bidCount: 11,
    minIncrement: 1500,
    startTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 32 * 3600 * 1000).toISOString(),
    durationHours: 56,
    status: 'active',
    sellerEmail: 'sukhdev.baghel@viraasat.in',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    bids: [
      { id: 'b7', auctionId: 'auction-dhokra-shaman', bidderName: 'Tribal Arts Foundation Zurich', bidderRole: 'institution', amount: 58500, timestamp: '4 hours ago' },
      { id: 'b6', auctionId: 'auction-dhokra-shaman', bidderName: 'Rohan Mehra Private Gallery', bidderRole: 'patron', amount: 50000, timestamp: '18 hours ago' },
      { id: 'b5', auctionId: 'auction-dhokra-shaman', bidderName: 'Devika Singhania Arts', bidderRole: 'collector', amount: 42000, timestamp: '1 day ago' },
    ]
  },
  {
    id: 'auction-kani-shawl',
    title: 'Hand-Spun Pashmina Kani Jamawar Heirloom Shawl (3-Year Weave)',
    artisanName: 'Ghulam Nabi Dar (Master Weaver)',
    artisanRegion: 'Srinagar, Jammu & Kashmir',
    craftCategory: 'Kashmiri Kani Handloom Pashmina',
    giTagCertified: true,
    provenanceHash: '0xda21095bf8c1...33a7',
    description: 'Woven with wooden needle-spools (kanis) incorporating over 1,200 interlocking color changes per square foot. Made from pure Changthangi mountain goat fleece with an intricate all-over floral jaal pattern.',
    imageUrl: '/images/products/clean/kashmiri-kani-pashmina-shawl.jpg',
    minPrice: 195000,
    currentBid: 245000,
    bidCount: 24,
    minIncrement: 5000,
    startTime: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 96 * 3600 * 1000).toISOString(),
    durationHours: 168,
    status: 'active',
    sellerEmail: 'ghulam.nabi@viraasat.in',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    bids: [
      { id: 'b10', auctionId: 'auction-kani-shawl', bidderName: 'Geneva Decorative Guild', bidderRole: 'collector', amount: 245000, timestamp: '1 hour ago' },
      { id: 'b9', auctionId: 'auction-kani-shawl', bidderName: 'Karanvir Oberoi Collection', bidderRole: 'collector', amount: 220000, timestamp: '1 day ago' },
      { id: 'b8', auctionId: 'auction-kani-shawl', bidderName: 'Royal Textile Antiquities', bidderRole: 'institution', amount: 195000, timestamp: '3 days ago' },
    ]
  },
  {
    id: 'auction-blue-pottery-urn',
    title: 'Masterpiece 36-Inch Turquoise Quartz Blue Pottery Palace Urn',
    artisanName: 'Gopal Saini (Shilp Guru)',
    artisanRegion: 'Jaipur, Rajasthan',
    craftCategory: 'Jaipur GI Blue Pottery',
    giTagCertified: true,
    provenanceHash: '0x992b10cae741...11fb',
    description: 'Formed completely without clay using ground Egyptian quartz stone, Fuller’s earth, and natural copper oxide pigments. Fired at low temperature to achieve its signature luminous turquoise glaze.',
    imageUrl: '/images/products/clean/jaipur-blue-pottery-urn.jpg',
    minPrice: 65000,
    currentBid: 78000,
    bidCount: 8,
    minIncrement: 2000,
    startTime: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    durationHours: 60,
    status: 'active',
    sellerEmail: 'gopal.saini@viraasat.in',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    bids: [
      { id: 'b12', auctionId: 'auction-blue-pottery-urn', bidderName: 'Aanya Kapoor Gallery', bidderRole: 'patron', amount: 78000, timestamp: '3 hours ago' },
      { id: 'b11', auctionId: 'auction-blue-pottery-urn', bidderName: 'Rajputana Heritage Trust', bidderRole: 'institution', amount: 65000, timestamp: '10 hours ago' },
    ]
  }
];

// In-memory atomic store for auctions (seeded with verified heirlooms)
const auctionsStore = new Map<string, UniqueArtAuction>(
  INITIAL_AUCTIONS.map((a) => [a.id, { ...a }])
);

// Mutex lock map to handle concurrent bids atomically
const locks = new Map<string, Promise<void>>();

let lastDbSyncTime = 0;
const DB_SYNC_INTERVAL_MS = 60_000; // 1 minute cache TTL for database sync

export class ServerAuctionService {
  /**
   * Synchronous retrieval of all auctions from in-memory cache.
   */
  static getAllAuctions(): UniqueArtAuction[] {
    return Array.from(auctionsStore.values());
  }

  /**
   * Asynchronous retrieval with optional database hydration.
   */
  static async getAllAuctionsAsync(): Promise<UniqueArtAuction[]> {
    await this.syncWithDatabase();
    return this.getAllAuctions();
  }

  static getAuctionById(id: string): UniqueArtAuction | undefined {
    return auctionsStore.get(id);
  }

  /**
   * Hydrates memory store from Supabase PostgreSQL if table exists.
   */
  static async syncWithDatabase(): Promise<void> {
    const now = Date.now();
    if (now - lastDbSyncTime < DB_SYNC_INTERVAL_MS) {
      return;
    }

    try {
      const { data: dbAuctions, error } = await supabase
        .from('auctions')
        .select('*');

      if (!error && dbAuctions && dbAuctions.length > 0) {
        for (const row of dbAuctions) {
          const existing = auctionsStore.get(row.id);
          if (existing) {
            existing.currentBid = Number(row.current_bid) || existing.currentBid;
            existing.bidCount = Number(row.bid_count) || existing.bidCount;
            existing.status = row.status || existing.status;
          }
        }
        lastDbSyncTime = now;
      }
    } catch {}
  }

  /**
   * Atomically places a verified bid on an active auction.
   * Performs validation against self-bidding, expiration, and bid increments,
   * then updates memory store and persists to Supabase PostgreSQL.
   */
  static async placeBid(
    auctionId: string,
    amount: number,
    bidder: { userId: string; email?: string; name: string; role?: string }
  ): Promise<{ success: boolean; error?: string; auction?: UniqueArtAuction; bid?: Bid }> {
    // Acquire mutex for this auction to prevent concurrent race conditions
    while (locks.has(auctionId)) {
      await locks.get(auctionId);
    }

    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    locks.set(auctionId, lockPromise);

    try {
      const auction = auctionsStore.get(auctionId);
      if (!auction) {
        return { success: false, error: 'Auction item not found' };
      }

      // Check auction status
      if (auction.status !== 'active') {
        return { success: false, error: 'This auction is no longer active' };
      }

      // Check expiration
      const now = Date.now();
      const endTime = new Date(auction.endTime).getTime();
      if (now >= endTime) {
        auction.status = 'ended';
        return { success: false, error: 'This auction has concluded. Bidding is closed.' };
      }

      // Prevent artisan / seller self-bidding
      if (
        (bidder.email && auction.sellerEmail && bidder.email.toLowerCase() === auction.sellerEmail.toLowerCase()) ||
        bidder.userId === auction.artisanName
      ) {
        return { success: false, error: 'Artisans cannot bid on their own handcrafted auction listings.' };
      }

      // Validate minimum bid increment
      const minRequired = auction.currentBid + auction.minIncrement;
      if (amount < minRequired) {
        return {
          success: false,
          error: `Minimum valid bid is ₹${minRequired.toLocaleString('en-IN')}`,
        };
      }

      // Create new bid record
      const bidId = `bid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newBid: Bid = {
        id: bidId,
        auctionId,
        bidderName: bidder.name,
        bidderRole: (bidder.role as any) || 'collector',
        amount,
        timestamp: 'Just now',
      };

      // Update memory store atomically
      auction.currentBid = amount;
      auction.bidCount += 1;
      auction.bids = [newBid, ...auction.bids];

      // Asynchronously persist to Supabase PostgreSQL non-fatally
      try {
        await Promise.allSettled([
          supabase.from('auction_bids').insert({
            id: bidId,
            auction_id: auctionId,
            bidder_id: bidder.userId,
            bidder_email: bidder.email || null,
            bidder_name: bidder.name,
            bidder_role: (bidder.role as any) || 'collector',
            amount,
            created_at: new Date().toISOString(),
          }),
          supabase
            .from('auctions')
            .update({
              current_bid: amount,
              bid_count: auction.bidCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', auctionId),
        ]);
      } catch (persistErr) {
        console.warn('[ServerAuctionService] Notice: Supabase auction sync fallback:', persistErr);
      }

      return {
        success: true,
        auction: { ...auction },
        bid: newBid,
      };
    } finally {
      locks.delete(auctionId);
      releaseLock();
    }
  }
}
