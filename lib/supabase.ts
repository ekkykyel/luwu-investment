import { supabase } from '../src/lib/supabaseClient';

const rawUrl = 
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_URL || process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  (typeof import.meta !== 'undefined' && ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL)) ||
  "https://yeezhpdgafbefwipmldl.supabase.co";

const supabaseUrl = (!rawUrl || rawUrl.includes("svxugvxchjsjuyfeddor") || rawUrl.includes("placeholder"))
  ? "https://yeezhpdgafbefwipmldl.supabase.co"
  : rawUrl;

const urlStr = (supabaseUrl || "").trim();
if (!urlStr || (!urlStr.startsWith("http://") && !urlStr.startsWith("https://"))) {
  throw new Error("Invalid or missing NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL");
}

export * from '../src/lib/supabaseClient';
export { supabase as default, supabase };
