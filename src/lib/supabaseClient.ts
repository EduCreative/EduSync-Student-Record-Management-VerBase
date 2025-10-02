import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are not set in your .env file. Please create one based on the README instructions.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      // FIX: Typed the options parameter as RequestInit to fix error on `options.signal`.
      fetch: async (url, options: RequestInit = {}) => {
        // Do not apply timeout to requests that already have a signal, e.g., from realtime.
        if (options.signal) {
          return fetch(url, options);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.warn(`Supabase request timed out: ${url}`);
            controller.abort();
        }, 15000); // 15s timeout

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          return response;
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            throw new Error('Request timed out. Please check your network and try again.');
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }
      },
    },
  });