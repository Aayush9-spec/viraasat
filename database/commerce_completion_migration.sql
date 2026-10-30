-- Run AFTER commerce_security_migration.sql. Test in staging and back up first.
BEGIN;
ALTER TABLE public.commerce_orders
  ADD COLUMN IF NOT EXISTS inventory_reserved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inventory_released boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS refunded_amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fulfillment jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS refund_request jsonb;
ALTER TABLE public.commerce_orders DROP CONSTRAINT IF EXISTS commerce_orders_payment_status_check;
ALTER TABLE public.commerce_orders ADD CONSTRAINT commerce_orders_payment_status_check
  CHECK(payment_status IN ('Pending Payment','Paid','Partially Refunded','Refunded'));
CREATE INDEX IF NOT EXISTS commerce_orders_buyer_created_idx ON public.commerce_orders(buyer_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS commerce_orders_payload_idx ON public.commerce_orders USING gin(payload jsonb_path_ops);

-- Reserve available stock atomically with order creation. Deterministic lock ordering
-- prevents deadlocks for multi-item carts. Any failure rolls back the entire cart.
CREATE OR REPLACE FUNCTION public.reserve_commerce_inventory() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE item jsonb; quantity integer; unit_price numeric; available integer; active boolean; seller uuid;
BEGIN
  IF jsonb_typeof(NEW.payload->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.payload->'items') = 0 THEN
    RAISE EXCEPTION 'Empty cart' USING ERRCODE='23514';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(NEW.payload->'items') ORDER BY value->>'productId' LOOP
    quantity := (item->>'quantity')::integer;
    IF quantity < 1 OR quantity > 99 THEN RAISE EXCEPTION 'Invalid quantity' USING ERRCODE='23514'; END IF;
    SELECT stock, price, is_active, artisan_id INTO available, unit_price, active, seller
      FROM public.products WHERE id=(item->>'productId')::uuid FOR UPDATE;
    IF NOT FOUND OR active IS NOT TRUE OR available < quantity OR available IS NULL
       OR unit_price <> (item->>'unitPrice')::numeric OR seller::text IS DISTINCT FROM item->>'artisanId' THEN
      RAISE EXCEPTION 'Product availability or price changed' USING ERRCODE='23514';
    END IF;
    UPDATE public.products SET stock=stock-quantity WHERE id=(item->>'productId')::uuid;
  END LOOP;
  NEW.inventory_reserved := true;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS reserve_commerce_inventory ON public.commerce_orders;
CREATE TRIGGER reserve_commerce_inventory BEFORE INSERT ON public.commerce_orders
  FOR EACH ROW EXECUTE FUNCTION public.reserve_commerce_inventory();

-- Monotonic payment/refund state even when capture and refund callbacks race.
-- Restock a full refund only if no parcel has shipped. Returned goods must be
-- inspected before manual restocking. Pending provider orders NEVER auto-expire:
-- they may remain payable at Razorpay and cannot safely release inventory by age.
CREATE OR REPLACE FUNCTION public.settle_commerce_inventory() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE item jsonb;
BEGIN
  IF OLD.payment_id IS NOT NULL AND NEW.payment_id IS DISTINCT FROM OLD.payment_id THEN
    RAISE EXCEPTION 'Payment conflict' USING ERRCODE='23514';
  END IF;
  NEW.refunded_amount := greatest(OLD.refunded_amount, NEW.refunded_amount);
  IF NEW.refunded_amount < 0 OR NEW.refunded_amount > NEW.amount THEN
    RAISE EXCEPTION 'Invalid refund amount' USING ERRCODE='23514';
  END IF;
  IF OLD.payment_status='Refunded' OR NEW.refunded_amount=NEW.amount THEN NEW.payment_status:='Refunded';
  ELSIF NEW.refunded_amount>0 THEN NEW.payment_status:='Partially Refunded';
  ELSIF OLD.payment_status='Paid' THEN NEW.payment_status:='Paid'; END IF;
  IF NEW.payment_status='Refunded' AND OLD.inventory_reserved AND NOT OLD.inventory_released
      AND NOT EXISTS(SELECT 1 FROM jsonb_each(OLD.fulfillment) f WHERE f.value->>'status' IN ('Shipped','Delivered')) THEN
    FOR item IN SELECT value FROM jsonb_array_elements(OLD.payload->'items') ORDER BY value->>'productId' LOOP
      UPDATE public.products SET stock=stock+(item->>'quantity')::integer WHERE id=(item->>'productId')::uuid;
    END LOOP;
    NEW.inventory_released:=true;
  END IF;
  NEW.updated_at:=clock_timestamp();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS settle_commerce_inventory ON public.commerce_orders;
CREATE TRIGGER settle_commerce_inventory BEFORE UPDATE ON public.commerce_orders
  FOR EACH ROW EXECUTE FUNCTION public.settle_commerce_inventory();
REVOKE ALL ON FUNCTION public.reserve_commerce_inventory(), public.settle_commerce_inventory() FROM PUBLIC;

-- All identity-bound writes go through authenticated server handlers.
REVOKE INSERT, UPDATE, DELETE ON public.reviews FROM anon, authenticated;
REVOKE ALL ON public.wishlists FROM anon, authenticated;
REVOKE INSERT ON public.artisan_applications FROM anon, authenticated;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified_purchase boolean NOT NULL DEFAULT false;
ALTER TABLE public.artisan_applications ADD COLUMN IF NOT EXISTS portfolio_images jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  email text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL, name text NOT NULL,
  email text NOT NULL, topic text NOT NULL, message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.newsletter_subscribers, public.contact_messages FROM anon, authenticated;
GRANT ALL ON public.newsletter_subscribers, public.contact_messages TO service_role;
COMMIT;
