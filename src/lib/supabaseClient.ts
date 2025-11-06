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
        // FIX: Bypass the aggressive 15s timeout for storage uploads, as they can be long-running.
        // The storage client has its own internal timeout handling for uploads.
        if (typeof url === 'string' && url.includes('/storage/v1/object/')) {
            return fetch(url, options);
        }

        // Do not apply timeout to requests that already have a signal, e.g., from realtime.
        if (options.signal) {
          return fetch(url, options);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.warn(`Supabase request timed out: ${url}`);
            controller.abort();
        }, 20000); // 20s timeout

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          return response;
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            throw new Error('Request timed out. Please check your network connection. A firewall might be blocking access to the server.');
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }
      },
    },
  });