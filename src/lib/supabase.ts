import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Null when the app runs without a backend (local development, tests): it then works offline only. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
