/**
 * Master Image Fallback, Storage Upload & Resolver Utility
 * Fully synchronized with Supabase Storage Buckets ('mpp-images', fallback 'public-assets')
 * and Database Schema Whitelists.
 * 
 * Rules:
 * 1. Storage Buckets: 'mpp-images' (primary), 'public-assets' (fallback).
 * 2. Public URLs only. STRICTLY NO Base64 strings in database.
 * 3. Table Column Mappings:
 *    - mpp_tenants: logo
 *    - mpp_facilities: image_url
 *    - mpp_umkm: image_url
 *    - news & mpp_articles: image_url
 *    - media_assets: photos (JSONB array)
 */

import React from 'react';
import { supabase } from '../lib/supabaseClient';

export const PRIMARY_STORAGE_BUCKET = 'mpp-images';
export const FALLBACK_STORAGE_BUCKET = 'public-assets';
export const SUPABASE_PROJECT_URL = (() => {
  const envUrl = typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_URL || process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL);
  if (!envUrl || envUrl.includes("svxugvxchjsjuyfeddor") || envUrl.includes("placeholder")) {
    return 'https://yeezhpdgafbefwipmldl.supabase.co';
  }
  return envUrl;
})();

// Crisp, local SVG fallbacks (Zero Network Latency, Anti-CORS)
export const FALLBACK_AGENCY_IMAGE = "/assets/images/default-agency.svg";
export const FALLBACK_FACILITY_IMAGE = "/assets/images/default-facility.svg";
export const FALLBACK_UMKM_IMAGE = "/assets/images/default-product.svg";
export const FALLBACK_NEWS_IMAGE = "/assets/images/default-news.svg";
export const FALLBACK_HERO_IMAGE = "/assets/images/default-hero.svg";
export const FALLBACK_GENERIC_IMAGE = "/assets/images/default-facility.svg";

export type ImageFallbackType = 'tenant' | 'agency' | 'facility' | 'umkm' | 'news' | 'hero' | 'general' | (string & {});

/**
 * Optical sizing & scaling helper for agency logos.
 * Ensures wide horizontal logos (e.g. Bank Sulselbar, PDAM, PT Nevis, Taspen, KPP Pratama, BPJS)
 * fit completely inside the wider logo pedestal without clipping side text, while balancing crest emblems.
 */
export function getAgencyLogoScaleClass(agencyName?: string | null): string {
  if (!agencyName) return 'scale-100';
  const name = agencyName.toLowerCase();
  
  // Wide horizontal logos: keep at scale-100 (or subtle scale) so horizontal text is never clipped
  if (
    name.includes('sulselbar') ||
    name.includes('nevis') ||
    name.includes('nervis') ||
    name.includes('pdam') ||
    name.includes('taspen') ||
    name.includes('kpp') ||
    name.includes('pajak') ||
    name.includes('pratama') ||
    name.includes('ketenagakerjaan') ||
    name.includes('kesehatan') ||
    name.includes('has')
  ) {
    return 'scale-100';
  }

  // Round/crest emblem with large built-in transparent canvas padding
  if (name.includes('kejaksaan') || name.includes('kejari')) {
    return 'scale-[1.18]';
  }
  
  // Standard square / crest emblems (Luwu, ATR/BPN, DPMPTSP, Imigrasi, Samsat, etc.) fit naturally at 100%
  return 'scale-100';
}

export function getFallbackForType(type: ImageFallbackType = 'general'): string {
  if (typeof type === 'string' && (type.startsWith('/') || type.startsWith('http') || type.startsWith('data:'))) {
    return type;
  }
  switch (type) {
    case 'tenant':
    case 'agency':
      return FALLBACK_AGENCY_IMAGE;
    case 'facility':
      return FALLBACK_FACILITY_IMAGE;
    case 'umkm':
      return FALLBACK_UMKM_IMAGE;
    case 'news':
      return FALLBACK_NEWS_IMAGE;
    case 'hero':
      return FALLBACK_HERO_IMAGE;
    case 'general':
    default:
      return FALLBACK_GENERIC_IMAGE;
  }
}

/**
 * Standardized Image URL Resolver for Frontend UI
 * Resolves remote URLs, local paths, and storage object paths into valid, renderable image URLs.
 * Eliminates Unsplash references and returns appropriate local SVG fallbacks on missing/invalid input.
 */
export function getImageUrl(
  pathOrUrl?: string | null,
  fallbackType: ImageFallbackType = 'general'
): string {
  const fallback = getFallbackForType(fallbackType);
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return fallback;

  const trimmed = pathOrUrl.trim();
  if (!trimmed) return fallback;

  // Filter out any unsplash links or dummy links per Zero Dummy Policy
  if (
    trimmed.includes('unsplash.com') ||
    trimmed.includes('via.placeholder') ||
    trimmed.includes('picsum.photos') ||
    trimmed.includes('placeholder.com')
  ) {
    return fallback;
  }

  // Absolute HTTP/HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Relative root assets (e.g. '/assets/...', '/logos/...', '/transparant.png')
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Data URIs (inline SVGs / icons)
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Supabase Storage Object Path (e.g. 'tenants/logo.png', 'facilities/photo.jpg', 'photos/123.jpg')
  const cleanPath = trimmed.replace(/^(mpp-images|public-assets)\//, '');
  const { data } = supabase.storage.from(PRIMARY_STORAGE_BUCKET).getPublicUrl(cleanPath);
  return data?.publicUrl || `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${PRIMARY_STORAGE_BUCKET}/${cleanPath}`;
}

/**
 * Backward compatibility alias for getSafeImageUrl
 */
export function getSafeImageUrl(
  url?: string | null,
  fallback: string = FALLBACK_GENERIC_IMAGE
): string {
  return getImageUrl(url, 'general') || fallback;
}

/**
 * Safe image onError handler to replace broken remote images with local SVG fallbacks.
 * Prevents infinite loop by unsetting target.onerror.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackTypeOrUrl: ImageFallbackType | string = 'general'
) {
  const target = e.currentTarget;
  if (!target) return;
  target.onerror = null;
  const fallback = typeof fallbackTypeOrUrl === 'string' && (fallbackTypeOrUrl.startsWith('/') || fallbackTypeOrUrl.startsWith('http') || fallbackTypeOrUrl.startsWith('data:'))
    ? fallbackTypeOrUrl
    : getFallbackForType(fallbackTypeOrUrl as ImageFallbackType);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}

/**
 * Centralized Photo Upload to Supabase Storage (Single Source of Truth)
 * 1. Tries Same-Origin Server Proxy (/api/upload-photo) for high speed in iframe.
 * 2. Tries Direct Supabase Storage 'mpp-images'.
 * 3. Tries Fallback Supabase Storage 'public-assets'.
 * 4. STRICTLY returns Public URL. Throws error on complete failure (DILARANG simpan Base64 ke DB).
 */
export async function uploadImageToSupabase(
  file: File | Blob,
  pathFolder: string = 'photos'
): Promise<string> {
  const fileExt = (file as File).name?.split('.').pop()?.toLowerCase() || 'webp';
  const cleanFolder = pathFolder.replace(/^\/+|\/+$/g, '') || 'photos';
  const uniqueFileName = `${cleanFolder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const contentType = file.type || 'image/jpeg';

  let uploadedPublicUrl: string | null = null;
  let lastError: Error | null = null;

  // Tier 1: Same-origin Server Proxy (Fastest, zero CORS in iframe)
  try {
    const fd = new FormData();
    fd.append("photo", file, (file as File).name || uniqueFileName);
    fd.append("folder", cleanFolder);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const proxyRes = await fetch("/api/upload-photo", {
      method: "POST",
      body: fd,
      signal: controller.signal
    });
    clearTimeout(timer);
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (proxyData.success && proxyData.url) {
        uploadedPublicUrl = proxyData.url;
      }
    }
  } catch (err: any) {
    lastError = err;
    console.warn("[uploadImageToSupabase Tier 1 Proxy Notice]:", err?.message || err);
  }

  // Tier 2: Direct Supabase Client to 'mpp-images'
  if (!uploadedPublicUrl) {
    try {
      const { data: upData, error: upErr } = await supabase.storage
        .from(PRIMARY_STORAGE_BUCKET)
        .upload(uniqueFileName, file, {
          contentType,
          upsert: true,
          cacheControl: '3600'
        });

      if (upData && !upErr) {
        const { data: urlData } = supabase.storage
          .from(PRIMARY_STORAGE_BUCKET)
          .getPublicUrl(uniqueFileName);
        if (urlData?.publicUrl) {
          uploadedPublicUrl = urlData.publicUrl;
        }
      } else if (upErr) {
        lastError = upErr;
        console.warn(`[uploadImageToSupabase Tier 2 Notice - ${PRIMARY_STORAGE_BUCKET}]:`, upErr.message);
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[uploadImageToSupabase Tier 2 Catch - ${PRIMARY_STORAGE_BUCKET}]:`, err?.message || err);
    }
  }

  // Tier 3: Direct Supabase Client to 'public-assets'
  if (!uploadedPublicUrl) {
    try {
      const { data: fbData, error: fbErr } = await supabase.storage
        .from(FALLBACK_STORAGE_BUCKET)
        .upload(uniqueFileName, file, {
          contentType,
          upsert: true,
          cacheControl: '3600'
        });

      if (fbData && !fbErr) {
        const { data: urlData } = supabase.storage
          .from(FALLBACK_STORAGE_BUCKET)
          .getPublicUrl(uniqueFileName);
        if (urlData?.publicUrl) {
          uploadedPublicUrl = urlData.publicUrl;
        }
      } else if (fbErr) {
        lastError = fbErr;
        console.warn(`[uploadImageToSupabase Tier 3 Notice - ${FALLBACK_STORAGE_BUCKET}]:`, fbErr.message);
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[uploadImageToSupabase Tier 3 Catch - ${FALLBACK_STORAGE_BUCKET}]:`, err?.message || err);
    }
  }

  if (uploadedPublicUrl) {
    return uploadedPublicUrl;
  }

  throw new Error(
    lastError?.message ||
    "Gagal mengunggah gambar ke Supabase Storage ('mpp-images' / 'public-assets'). Pastikan koneksi stabil."
  );
}
