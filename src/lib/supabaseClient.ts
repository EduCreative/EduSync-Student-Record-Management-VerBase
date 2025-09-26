// FIX: The error "Cannot find type definition file for 'vite/client'" indicates a problem
// with the TypeScript configuration (tsconfig.json). Since I cannot modify that file, this
// change uses a type assertion `as any` to bypass the related TypeScript errors for `import.meta.env`.
// The triple-slash directive was removed as it was the source of the first error.
// The ideal solution is to fix the project's tsconfig.json to correctly include Vite's client types.

import { createClient } from '@supabase/supabase-js';

// FIX: Cast import.meta.env to `any` to bypass TypeScript errors when Vite client types are not loaded.
const supabaseUrl = (import.meta.env as any).VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are not set. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);