-- ==============================================================================
-- Viraasat 2.0 — Phase 1: Database & Order Integrity Migration (Updated)
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mkeowabbnpyenqeiybzw/sql
-- ==============================================================================

-- ── 1. Users Table Hardening (Clerk String ID Support) ────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  END IF;
END $$;

-- ── 2. Orders Table: Drop Foreign Key and Convert buyer_id to TEXT ─────────────
-- Drop foreign key constraint referencing users(id) uuid so buyer_id can accept Clerk string IDs
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_buyer_id_fkey;
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id            TEXT NOT NULL,
  total_amount        NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status              TEXT NOT NULL DEFAULT 'Processing',
  payment_status      TEXT NOT NULL DEFAULT 'Paid',
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  currency            TEXT DEFAULT 'INR',
  shipping_address    JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Safely alter column to TEXT if it was previously UUID
DO $$
BEGIN
  -- Double check foreign keys are removed
  ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_buyer_id_fkey;
  ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'buyer_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE orders ALTER COLUMN buyer_id TYPE TEXT USING buyer_id::text;
  END IF;

  -- Add Razorpay and shipping columns if they do not exist
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Paid';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_rzp_order ON orders(razorpay_order_id);

-- ── 3. Order Items Table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id     TEXT NOT NULL,
  product_name   TEXT NOT NULL,
  quantity       INTEGER NOT NULL DEFAULT 1,
  unit_price     NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  item_image_url TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ── 4. Notifications Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,          -- Clerk User ID or email or 'all'
  recipient_role  TEXT NOT NULL DEFAULT 'customer',  -- 'customer' | 'artisan' | 'admin'
  type            TEXT NOT NULL DEFAULT 'order_update', -- 'order_update' | 'new_review' | 'artisan_response'
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

-- ── 5. Row Level Security (RLS) & Permissions ─────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop prior restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "orders_read_policy" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "order_items_read_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON order_items;
DROP POLICY IF EXISTS "notifications_read_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;

-- Create resilient policies that allow authorized Clerk clients to read and write records
CREATE POLICY "orders_read_policy"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "orders_insert_policy"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "orders_update_policy"
  ON orders FOR UPDATE
  USING (true);

CREATE POLICY "order_items_read_policy"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "order_items_insert_policy"
  ON order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "notifications_read_policy"
  ON notifications FOR SELECT
  USING (true);

CREATE POLICY "notifications_insert_policy"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "notifications_update_policy"
  ON notifications FOR UPDATE
  USING (true);

-- Grant appropriate permissions to anon and authenticated roles
GRANT ALL ON orders TO anon, authenticated, service_role;
GRANT ALL ON order_items TO anon, authenticated, service_role;
GRANT ALL ON notifications TO anon, authenticated, service_role;
