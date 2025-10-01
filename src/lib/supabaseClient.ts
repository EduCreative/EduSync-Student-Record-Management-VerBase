// FIX: The /// <reference types="vite/client" /> was not being resolved.
// Manually defining the types for import.meta.env to fix TypeScript errors.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are not set in your .env file. Please create one based on the README instructions.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);