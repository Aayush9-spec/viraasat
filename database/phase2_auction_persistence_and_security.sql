-- ==============================================================================
-- Viraasat 2.0 — Phase 2: Live Auction Persistence & Security Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mkeowabbnpyenqeiybzw/sql
-- ==============================================================================

-- ── 1. Live Auctions Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auctions (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  artisan_name       TEXT NOT NULL,
  artisan_region     TEXT,
  craft_category     TEXT,
  gi_tag_certified   BOOLEAN DEFAULT TRUE,
  provenance_hash    TEXT,
  description        TEXT,
  image_url          TEXT,
  min_price          NUMERIC(12, 2) NOT NULL,
  current_bid        NUMERIC(12, 2) NOT NULL,
  bid_count          INTEGER NOT NULL DEFAULT 0,
  min_increment      NUMERIC(12, 2) NOT NULL DEFAULT 1000,
  start_time         TIMESTAMPTZ NOT NULL,
  end_time           TIMESTAMPTZ NOT NULL,
  duration_hours     INTEGER NOT NULL DEFAULT 24,
  status             TEXT NOT NULL DEFAULT 'active',
  seller_email       TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Live Auction Bids Table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_bids (
  id           TEXT PRIMARY KEY,
  auction_id   TEXT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id    TEXT,
  bidder_email TEXT,
  bidder_name  TEXT NOT NULL,
  bidder_role  TEXT NOT NULL DEFAULT 'collector',
  amount       NUMERIC(12, 2) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_created_at ON auction_bids(created_at DESC);

-- ── 3. Row Level Security & Access Grants ──────────────────────────────────────
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auctions_public_read" ON auctions;
DROP POLICY IF EXISTS "auctions_public_write" ON auctions;
DROP POLICY IF EXISTS "auction_bids_public_read" ON auction_bids;
DROP POLICY IF EXISTS "auction_bids_public_write" ON auction_bids;

CREATE POLICY "auctions_public_read" ON auctions FOR SELECT USING (true);
CREATE POLICY "auctions_public_write" ON auctions FOR ALL USING (true);
CREATE POLICY "auction_bids_public_read" ON auction_bids FOR SELECT USING (true);
CREATE POLICY "auction_bids_public_write" ON auction_bids FOR ALL USING (true);

GRANT ALL ON auctions TO anon, authenticated, service_role;
GRANT ALL ON auction_bids TO anon, authenticated, service_role;

-- ── 4. Seed Verified Initial Auctions ─────────────────────────────────────────
INSERT INTO auctions (
  id, title, artisan_name, artisan_region, craft_category, gi_tag_certified,
  provenance_hash, description, image_url, min_price, current_bid, bid_count,
  min_increment, start_time, end_time, duration_hours, status, seller_email
) VALUES
(
  'auction-zardozi-royal',
  'Imperial 24K Gold Zardozi Wall Hanging (c. 1978 Royal Pattern)',
  'Ustad Abdul Qadir & Sons',
  'Varanasi, Uttar Pradesh',
  'Zardozi & Gold Metallic Embroidery',
  true,
  '0x8f4c91a0b3e2...7b2a',
  'An irreplaceable museum-grade tapestry hand-stitched over 14 months using real 24-karat gold dipped silver wires (kalabattu) over pure velvet silk. Features ancestral Mughal floral arabesques and Persian medallions.',
  '/images/products/zardozi-embroidery.jpg',
  85000, 114000, 16, 2500,
  NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', 120, 'active', 'abdul.qadir@viraasat.in'
),
(
  'auction-dhokra-shaman',
  'Tribal Bastar Dhokra Dancing Shaman (Solid Bronze Lost-Wax Cast)',
  'Sukhdev Baghel Guild',
  'Bastar, Chhattisgarh',
  'Dhokra Non-Ferrous Lost-Wax Metal Casting',
  true,
  '0x3c7e44f810aa...e911',
  'Cast using an unbroken 4,000-year-old metallurgical technique traced back to Mohenjo-daro. Each beeswax mold is destroyed during casting, making this exact tribal sculpture entirely unique and unrepeatable.',
  '/images/products/metal-sculpting.jpg',
  42000, 58500, 11, 1500,
  NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day 8 hours', 56, 'active', 'sukhdev.baghel@viraasat.in'
),
(
  'auction-kani-shawl',
  'Hand-Spun Pashmina Kani Jamawar Heirloom Shawl (3-Year Weave)',
  'Ghulam Nabi Dar (Master Weaver)',
  'Srinagar, Jammu & Kashmir',
  'Kashmiri Kani Handloom Pashmina',
  true,
  '0xda21095bf8c1...33a7',
  'Woven with wooden needle-spools (kanis) incorporating over 1,200 interlocking color changes per square foot. Made from pure Changthangi mountain goat fleece with an intricate all-over floral jaal pattern.',
  '/images/products/clean/kashmiri-kani-pashmina-shawl.jpg',
  195000, 245000, 24, 5000,
  NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', 168, 'active', 'ghulam.nabi@viraasat.in'
),
(
  'auction-blue-pottery-urn',
  'Masterpiece 36-Inch Turquoise Quartz Blue Pottery Palace Urn',
  'Gopal Saini (Shilp Guru)',
  'Jaipur, Rajasthan',
  'Jaipur GI Blue Pottery',
  true,
  '0x992b10cae741...11fb',
  'Formed completely without clay using ground Egyptian quartz stone, Fuller’s earth, and natural copper oxide pigments. Fired at low temperature to achieve its signature luminous turquoise glaze.',
  '/images/products/clean/jaipur-blue-pottery-urn.jpg',
  65000, 78000, 8, 2000,
  NOW() - INTERVAL '12 hours', NOW() + INTERVAL '2 days', 60, 'active', 'gopal.saini@viraasat.in'
)
ON CONFLICT (id) DO NOTHING;

