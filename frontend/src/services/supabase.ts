import { createClient } from '@supabase/supabase-js';

import { env } from '@/core/config/env';

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
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZW93YWJibnB5ZW5xZWl5Ynp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDE5ODksImV4cCI6MjEwNTQ3Nzk4OX0.-5V1A7dJyA2KGoBcpdRhMpAgqoKCR-AD8LR9Und-StM',
);
