import { createClient } from '@supabase/supabase-js';
import { process } from './config';

// Correctly access the imported 'process' object from config.ts
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Check if the credentials are still placeholders
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    throw new Error("Supabase URL and Anon Key are not set. Please update them in lib/config.ts.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);