-- Apply in Supabase before enabling checkout. Server-only access uses the service role.
BEGIN;
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS moderation text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS original_language text,
  ADD COLUMN IF NOT EXISTS english_description text,
  ADD COLUMN IF NOT EXISTS descriptions jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text, ADD COLUMN IF NOT EXISTS avatar_url text, ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clerk_user_id text UNIQUE;
-- Existing users require verified Clerk-ID backfill before enabling profile writes.
CREATE TABLE IF NOT EXISTS public.commerce_orders (
  id uuid PRIMARY KEY,
  buyer_id text NOT NULL,
  idempotency_key uuid NOT NULL,
  request_hash text NOT NULL,
  razorpay_order_id text UNIQUE,
  payment_id text UNIQUE,
  confirmation_sent_at timestamptz,
  amount bigint NOT NULL CHECK (amount >= 100),
  payment_status text NOT NULL DEFAULT 'Pending Payment' CHECK (payment_status IN ('Pending Payment', 'Paid', 'Refunded')),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, idempotency_key)
);
ALTER TABLE public.commerce_orders ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz;
ALTER TABLE public.commerce_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.commerce_orders FROM anon, authenticated;
GRANT ALL ON public.commerce_orders TO service_role;
-- All profile and product mutations now go through authenticated server APIs.
REVOKE INSERT, UPDATE, DELETE ON public.users, public.products FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.artisan_applications FROM anon, authenticated;
REVOKE SELECT ON public.artisan_applications FROM anon, authenticated;
REVOKE SELECT ON public.users FROM anon, authenticated;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('product-images', 'product-images', true, 10485760, ARRAY['image/png','image/jpeg','image/webp']) ON CONFLICT (id) DO NOTHING;
COMMIT;
