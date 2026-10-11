-- Viraasat: Artisan & Buyer profile tables
-- Run this in the Supabase SQL editor → https://supabase.com/dashboard/project/mkeowabbnpyenqeiybzw/sql

-- ─── Artisan Profiles ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artisan_profiles (
  user_id               TEXT PRIMARY KEY,   -- Clerk user ID
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
  verification_status   TEXT DEFAULT 'unverified',  -- 'unverified' | 'pending' | 'verified'
  artisan_id            TEXT,               -- e.g. ART-2024-0042
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE artisan_profiles ENABLE ROW LEVEL SECURITY;

-- Each artisan can read and write only their own row
CREATE POLICY "artisan_own_read"
  ON artisan_profiles FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "artisan_own_write"
  ON artisan_profiles FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);


-- ─── Buyer Profiles ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS buyer_profiles (
  user_id       TEXT PRIMARY KEY,   -- Clerk user ID
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

CREATE POLICY "buyer_own_read"
  ON buyer_profiles FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "buyer_own_write"
  ON buyer_profiles FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);


-- ─── Storage bucket for avatars ──────────────────────────────────────────────
-- Run separately in Storage → New bucket, or via the API:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT DO NOTHING;
--
-- CREATE POLICY "avatars_public_read"
--   ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
--
-- CREATE POLICY "avatars_owner_upload"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
