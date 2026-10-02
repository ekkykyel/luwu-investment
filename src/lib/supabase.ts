import { supabase } from './supabaseClient';

const supabaseUrl = 
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  "https://svxugvxchjsjuyfeddor.supabase.co";

const urlStr = (supabaseUrl || "").trim();
if (!urlStr || (!urlStr.startsWith("http://") && !urlStr.startsWith("https://"))) {
  throw new Error("Invalid or missing VITE_SUPABASE_URL");
}

export * from './supabaseClient';
export { supabase as default };
