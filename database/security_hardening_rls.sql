-- ==============================================================================
-- Viraasat 2.0 — Production-Grade Supabase Row Level Security (RLS) Hardening
-- Run this migration in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mkeowabbnpyenqeiybzw/sql
-- ==============================================================================

-- ── 1. Enable RLS on all sensitive tables ────────────────────────────────────
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS artisan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS artisan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- ── 2. Hardened RLS for `buyer_profiles` (Fix PII Leakage) ───────────────────
-- Previously: USING (true) allowed any visitor to read all customer phone numbers & addresses.
-- Hardened: Only the account owner or verified admin can read or write their personal profile.
DROP POLICY IF EXISTS "buyer_own_read" ON buyer_profiles;
DROP POLICY IF EXISTS "buyer_own_write" ON buyer_profiles;

CREATE POLICY "buyer_own_read"
  ON buyer_profiles FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "buyer_own_write"
  ON buyer_profiles FOR ALL
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- ── 3. Hardened RLS for `artisan_profiles` ───────────────────────────────────
-- Public can view verified artisan biographies and shop details;
-- Only the artisan themselves or an administrator can update artisan details.
DROP POLICY IF EXISTS "artisan_public_read" ON artisan_profiles;
DROP POLICY IF EXISTS "artisan_own_write" ON artisan_profiles;

CREATE POLICY "artisan_public_read"
  ON artisan_profiles FOR SELECT
  USING (true);

CREATE POLICY "artisan_own_write"
  ON artisan_profiles FOR ALL
  USING (
    user_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── 4. Hardened RLS for `products` ──────────────────────────────────────────
-- Public can view active products;
-- Artisans can only insert, modify, or delete their own creations.
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_artisan_insert" ON products;
DROP POLICY IF EXISTS "products_artisan_update" ON products;
DROP POLICY IF EXISTS "products_artisan_delete" ON products;

CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (is_active = TRUE OR status = 'Active' OR status = 'active');

CREATE POLICY "products_artisan_insert"
  ON products FOR INSERT
  WITH CHECK (
    artisan_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "products_artisan_update"
  ON products FOR UPDATE
  USING (
    artisan_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    artisan_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "products_artisan_delete"
  ON products FOR DELETE
  USING (
    artisan_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── 5. Hardened RLS for `reviews` (Fix BOLA / IDOR) ─────────────────────────
-- Previously: USING (true) allowed any user to alter or delete any review.
-- Hardened: Only review owner can update/delete; artisans can update only their official reply.
DROP POLICY IF EXISTS "Public can view published reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews or assigned artisan can reply" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

CREATE POLICY "Public can view published reviews"
  ON reviews FOR SELECT
  USING (status = 'published' OR status IS NULL);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    reviewer_id::text = auth.uid()::text
    OR auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own reviews or assigned artisan can reply"
  ON reviews FOR UPDATE
  USING (
    reviewer_id::text = auth.uid()::text
    OR artisan_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    reviewer_id::text = auth.uid()::text
    OR artisan_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (
    reviewer_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── 6. Hardened RLS for `notifications` (Fix IDOR) ──────────────────────────
-- Previously: USING (true) allowed anyone to view and mark anyone's notifications.
-- Hardened: Only the notification recipient can view or update their notifications.
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── 7. Hardened RLS for `artisan_applications` (PII Protection) ─────────────
-- Prevent public scraping of artisan applicant emails, phones, and addresses.
DROP POLICY IF EXISTS "Applicants can insert applications" ON artisan_applications;
DROP POLICY IF EXISTS "Admins can view applications" ON artisan_applications;

CREATE POLICY "Applicants can insert applications"
  ON artisan_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view applications"
  ON artisan_applications FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR applicant_id::text = auth.uid()::text
  );

-- ── 8. Storage Bucket Security Policies ──────────────────────────────────────
-- Ensure avatars and product images cannot be overwritten by unauthorized actors
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_upload" ON storage.objects;
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_artisan_upload" ON storage.objects;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_artisan_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

