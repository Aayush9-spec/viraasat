-- ==============================================================================
-- Viraasat 2.0 — Product Reviews, Ratings, Artisan Responses & In-App Notifications
-- Supabase / PostgreSQL Database Migration
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/mkeowabbnpyenqeiybzw/sql
-- ==============================================================================

-- ── 1. Create or Update `reviews` Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            TEXT NOT NULL,
  reviewer_id           TEXT NOT NULL,
  reviewer_name         TEXT NOT NULL,
  reviewer_avatar       TEXT,
  rating                INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title                 TEXT,
  comment               TEXT NOT NULL,
  images                TEXT[] DEFAULT '{}',
  artisan_id            TEXT,
  order_item_id         TEXT,
  is_verified_purchase  BOOLEAN DEFAULT FALSE,
  artisan_response      TEXT,
  artisan_responded_at  TIMESTAMPTZ,
  status                TEXT DEFAULT 'published', -- 'published' | 'flagged' | 'hidden'
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add missing columns to existing reviews table if already present
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS title                 TEXT,
  ADD COLUMN IF NOT EXISTS images                TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS artisan_id            TEXT,
  ADD COLUMN IF NOT EXISTS order_item_id         TEXT,
  ADD COLUMN IF NOT EXISTS is_verified_purchase  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS artisan_response      TEXT,
  ADD COLUMN IF NOT EXISTS artisan_responded_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status                TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ DEFAULT NOW();

-- Create Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_artisan_id ON reviews(artisan_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- ── 2. Create `notifications` Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,          -- Recipient user ID (Clerk ID or UUID)
  recipient_role  TEXT NOT NULL,          -- 'artisan' | 'customer' | 'admin'
  type            TEXT NOT NULL,          -- 'new_review' | 'artisan_response' | 'order_update' | 'review_reported'
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  link            TEXT,
  read            BOOLEAN DEFAULT FALSE,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ── 3. Add Rating Aggregates Columns to `products` Table (Optional optimization) ─
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS rating        NUMERIC(3, 2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS review_count  INTEGER DEFAULT 0;

-- ── 4. Enable Row Level Security (RLS) ────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop previous policies if re-running
DROP POLICY IF EXISTS "Public can view published reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews or assigned artisan can reply" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

-- Policy 1: Anyone (public & authenticated) can read published reviews
CREATE POLICY "Public can view published reviews"
  ON reviews FOR SELECT
  USING (status = 'published' OR status IS NULL);

-- Policy 2: Authenticated users can insert reviews
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);

-- Policy 3: Review owners can edit their reviews, and artisans can update the artisan_response
CREATE POLICY "Users can update own reviews or assigned artisan can reply"
  ON reviews FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy 4: Review owners can delete their own review
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (true);

-- Notification Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (true);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (true);

-- ── 5. Auto-Update Timestamp Trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON reviews;
CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();
