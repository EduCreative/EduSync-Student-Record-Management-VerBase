// --- Environment Configuration ---
// This project runs in a browser environment without a build step.
// This file acts as the central place for your API keys.
//
// PLEASE REPLACE THE PLACEHOLDER VALUES BELOW with your actual Supabase credentials.
export const process = {
  env: {
    VITE_SUPABASE_URL: 'https://mcanacitwcmipwwbcayg.supabase.co', // Found in your Supabase project settings under API > Project URL
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_LZYDfhdDHXra0hD9X3aeNQ_7byh9kLZ', // Found in your Supabase project settings under API > Project API Keys > anon (public)
  }
};
