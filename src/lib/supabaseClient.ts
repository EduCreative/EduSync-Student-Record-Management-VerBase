import { createClient } from '@supabase/supabase-js';

// FIX: The error "Property 'env' does not exist on type 'ImportMeta'" is caused by missing Vite client types.
// Casting `import.meta.env` to `any` bypasses this TypeScript error without needing to modify tsconfig.json.
const supabaseUrl = (import.meta.env as any).VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are not set. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);