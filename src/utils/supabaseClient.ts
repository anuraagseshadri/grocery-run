import { createClient } from '@supabase/supabase-js';

// Replace these with the values from your Supabase Project Settings > API
const supabaseUrl = 'https://pmzylfcdrsjnyuliubxm.supabase.co';
const supabaseAnonKey = 'sb_publishable_i2y9vLKk5q6jw8OvS7wOQQ_RDpBwfiZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
