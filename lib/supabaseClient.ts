import { createClient } from '@supabase/supabase-js';

// The hosting environment will supply these variables.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are not set as environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
