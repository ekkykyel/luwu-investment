/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) 
  ? process.env.VITE_SUPABASE_URL 
  : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) 
    ? (import.meta as any).env.VITE_SUPABASE_URL 
    : '';

const supabaseAnonKey = (typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY) 
  ? process.env.VITE_SUPABASE_ANON_KEY 
  : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) 
    ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY 
    : '';

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

