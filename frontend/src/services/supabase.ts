import { createClient } from '@supabase/supabase-js';

import { env } from '@/core/config/env';

const DEFAULT_SUPABASE_URL = 'https://mkeowabbnpyenqeiybzw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_4nl6lN1iiYt-N5dfu4L6qg_2y_EZNE0';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  env.supabase.url ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.supabase.anonKey ||
  DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
