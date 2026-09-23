import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Viraasat] Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). ' +
      'Live product, order, and review data will not load.',
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://mkeowabbnpyenqeiybzw.supabase.co',
  supabaseAnonKey ?? '',
);
