// FIX: Removed vite client type reference to prevent resolution errors in this environment.
// The manual type declarations for import.meta.env are sufficient.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
