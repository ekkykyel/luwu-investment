import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://svxugvxchjsjuyfeddor.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_SyZQ0YW4CWEVfMjBS9NtZQ_T0tB4zJj";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export async function requireAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Check for token in Cookie or Authorization header
    let token = '';
    
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Check Cookie if not in header
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    const isApiRoute = req.path.startsWith('/api/');
    const isDashboard = req.path.startsWith('/dashboard');
    const isAdmin = req.path.startsWith('/admin');

    console.log(`[Middleware] Path: ${req.path} | Token found: ${!!token}`);

    if (!token) {
      console.log(`[Middleware] No token found. Redirecting to login.`);
      if (isApiRoute) {
        return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
      } else {
        return res.redirect(302, '/login');
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } } // Pass token for RLS
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 2. Verify token via Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.warn("[Middleware] token validation failed:", error?.message);
      if (isApiRoute) {
        return res.status(401).json({ success: false, message: 'Unauthorized - Invalid or expired token' });
      } else {
        return res.redirect(302, '/login');
      }
    }

    // 3. Strict Role Validation from profiles table using admin privilege to bypass RLS issues
    let { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    
    // Auto-create profile if missing!
    if (!profile) {
      console.log(`[Middleware] Profile missing for user ${user.id} (${user.email}). Auto-creating profile...`);
      const rawRole = user.user_metadata?.role;
      let assignedRole = 'investor';
      if (rawRole === 'SUPER_ADMIN' || rawRole === 'superadmin') {
        assignedRole = 'superadmin';
      } else if (rawRole === 'admin_promosi') {
        assignedRole = 'admin_promosi';
      } else if (rawRole === 'admin_oss') {
        assignedRole = 'admin_oss';
      } else if (rawRole === 'admin_dalak') {
        assignedRole = 'admin_dalak';
      } else if (rawRole === 'Jabatan Pelaksana' || rawRole === 'operator') {
        assignedRole = 'operator';
      } else if (rawRole === 'masyarakat') {
        assignedRole = 'masyarakat';
      } else if (rawRole) {
        assignedRole = rawRole;
      }
      
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      const nik = user.user_metadata?.nik || null;
      const no_whatsapp = user.user_metadata?.no_whatsapp || null;
      
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          role: assignedRole,
          nik: nik,
          no_whatsapp: no_whatsapp
        })
        .select('role')
        .single();
        
      if (insertError) {
        console.error("[Middleware] Failed to auto-create missing profile:", insertError.message);
      } else if (newProfile) {
        console.log(`[Middleware] Successfully auto-created profile with role: ${assignedRole}`);
        profile = newProfile;
        profileError = null;
      }
    }

    console.log(`[Middleware] User: ${user.id} | Profile Role: ${profile?.role} | profileError: ${profileError?.message}`);

    if (profileError || !profile) {
      console.warn("[Middleware] profile validation failed:", profileError?.message);
      if (isApiRoute) {
        return res.status(403).json({ success: false, message: 'Forbidden - User profile not found or role missing' });
      } else {
        return res.redirect(302, '/login');
      }
    }

    const userRole = profile.role;

    // Authorize based on role
    const adminRoles = ['superadmin', 'admin_dalak', 'admin_oss', 'admin_promosi', 'operator'];
    if (isDashboard && userRole === 'investor') {
      // Allow access to dashboard for investors
      console.log(`[Middleware] Allowing investor access to dashboard`);
    } else if (isAdmin && !adminRoles.includes(userRole)) {
      console.log(`[Middleware] Forbidden - non-admin (${userRole}) trying to access admin`);
      return res.redirect(302, '/');
    }

    const validRoles = ['superadmin', 'admin_dalak', 'admin_oss', 'admin_promosi', 'operator', 'investor', 'masyarakat'];
    if (isApiRoute && req.method !== 'GET') {
      if (!validRoles.includes(userRole)) {
         return res.status(403).json({ success: false, message: 'Forbidden - Akses ditolak. Autentikasi Admin/User wajib.' });
      }
    }

    (req as any).user = user;
    (req as any).userRole = userRole;
    
    next();
  } catch (err) {
    console.error("Middleware Auth Error:", err);
    const isApiRoute = req.path.startsWith('/api/');
    if (isApiRoute) {
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    } else {
      return res.redirect(302, '/login');
    }
  }
}
