import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_KEY;

// Export a supabase client if env vars are present; otherwise null to avoid crashes locally.
export const supabase = url && key ? createClient(url, key) : null;

// Expose for debugging in the browser console (e.g., window.supabase.auth.getSession()).
if (typeof window !== 'undefined' && supabase) {
  window.supabase = supabase;
}
