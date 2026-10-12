-- ============================================================
-- Viraasat — Supabase schema patch
-- Run this in the SQL editor:
-- https://supabase.com/dashboard/project/mkeowabbnpyenqeiybzw/sql
-- ============================================================

-- ── 1. Add missing columns to `products` ────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS status      TEXT    DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS tagline     TEXT,
  ADD COLUMN IF NOT EXISTS currency    TEXT    DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS features    TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS style_tags  TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- Back-fill existing rows
UPDATE products SET status = 'Active', currency = 'INR', is_active = TRUE
WHERE status IS NULL;

-- ── 2. Add missing columns to `artisan_applications` ────────
ALTER TABLE artisan_applications
  ADD COLUMN IF NOT EXISTS region      TEXT,
  ADD COLUMN IF NOT EXISTS bio         TEXT,
  ADD COLUMN IF NOT EXISTS instagram   TEXT,
  ADD COLUMN IF NOT EXISTS facebook    TEXT,
  ADD COLUMN IF NOT EXISTS youtube     TEXT,
  ADD COLUMN IF NOT EXISTS website     TEXT,
  ADD COLUMN IF NOT EXISTS notes       TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- ── 3. Create `artisan_profiles` table ──────────────────────
CREATE TABLE IF NOT EXISTS artisan_profiles (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name             TEXT,
  shop_name             TEXT,
  bio                   TEXT,
  craft                 TEXT,
  experience            INTEGER DEFAULT 1,
  instagram             TEXT,
  facebook              TEXT,
  youtube               TEXT,
  website               TEXT,
  profile_picture_url   TEXT,
  verification_status   TEXT DEFAULT 'unverified',
  artisan_id            TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE artisan_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artisan_own_read"  ON artisan_profiles;
DROP POLICY IF EXISTS "artisan_own_write" ON artisan_profiles;

CREATE POLICY "artisan_own_read"
  ON artisan_profiles FOR SELECT USING (true);

CREATE POLICY "artisan_own_write"
  ON artisan_profiles FOR ALL
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- ── 4. Create `buyer_profiles` table ────────────────────────
CREATE TABLE IF NOT EXISTS buyer_profiles (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name  TEXT,
  phone         TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city          TEXT,
  state         TEXT,
  zip_code      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buyer_own_read"  ON buyer_profiles;
DROP POLICY IF EXISTS "buyer_own_write" ON buyer_profiles;

CREATE POLICY "buyer_own_read"
  ON buyer_profiles FOR SELECT USING (true);

CREATE POLICY "buyer_own_write"
  ON buyer_profiles FOR ALL
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- ── 5. Storage bucket for avatars (run once) ─────────────────
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT DO NOTHING;
