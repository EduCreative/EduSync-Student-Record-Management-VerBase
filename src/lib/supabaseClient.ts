import { createClient } from '@supabase/supabase-js';

// The Supabase credentials are now hardcoded to ensure the client initializes correctly.
const supabaseUrl = 'https://mcanacitwcmipwwbcayg.supabase.co';
const supabaseAnonKey = 'sb_publishable_LZYDfhdDHXra0hD9X3aeNQ_7byh9kLZ'

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are not set. Please update them in src/lib/supabaseClient.ts.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
