-- ============================================================
-- Viraasat 2.0 — Multilingual Product Descriptions Migration
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/mkeowabbnpyenqeiybzw/sql
-- ============================================================

-- Add multilingual support columns to `products` table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS original_language    TEXT DEFAULT 'Hindi',
  ADD COLUMN IF NOT EXISTS english_description  TEXT,
  ADD COLUMN IF NOT EXISTS descriptions         JSONB DEFAULT '{}'::jsonb;

-- Comment on columns for documentation
COMMENT ON COLUMN products.original_language IS 'The primary language in which the artisan authored the product name and description (e.g. Hindi, Tamil, Bengali).';
COMMENT ON COLUMN products.english_description IS 'The corresponding English product description for global marketplace listings.';
COMMENT ON COLUMN products.descriptions IS 'JSON map of language codes (hi, en, ta, bn, etc.) to full product descriptions.';

-- Back-fill existing rows so default English/Hindi descriptions map seamlessly into JSONB
UPDATE products
SET
  original_language = COALESCE(original_language, 'Hindi'),
  descriptions = CASE
    WHEN descriptions IS NULL OR descriptions = '{}'::jsonb THEN
      jsonb_build_object('hi', COALESCE(description, ''))
    ELSE descriptions
  END
WHERE descriptions IS NULL OR descriptions = '{}'::jsonb;
