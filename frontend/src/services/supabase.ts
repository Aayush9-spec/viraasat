import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';

const supabaseUrl = env.supabase.url;
const supabaseAnonKey = env.supabase.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Viraasat] Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). ' +
      'Live product, order, and review data will not load.',
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://mkeowabbnpyenqeiybzw.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
);
