import { supabase } from "../lib/supabaseClient";

export interface MppSocialMediaSettings {
  instagram: {
    isActive: boolean;
    handle: string;
    profileUrl: string;
    postImage: string;
    caption: string;
    tag: string;
    stats: string;
  };
  youtube: {
    isActive: boolean;
    channelName: string;
    channelUrl: string;
    videoTitle: string;
    videoUrl: string;
    videoThumbnail: string;
    duration: string;
    stats: string;
  };
  facebook: {
    isActive: boolean;
    pageName: string;
    pageUrl: string;
    postImage: string;
    caption: string;
    tag: string;
    stats: string;
  };
  tiktok: {
    isActive: boolean;
    handle: string;
    profileUrl: string;
    videoThumbnail: string;
    caption: string;
    tag: string;
    stats: string;
  };
  twitter?: string;
  whatsappChannel?: string;
}

export const DEFAULT_MPP_SOCIAL_MEDIA: MppSocialMediaSettings = {
  instagram: {
    isActive: true,
    handle: "dpmptspkabluwu",
    profileUrl: "https://instagram.com/dpmptspluwu",
    postImage: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=800",
    caption: "Layanan perizinan dan konsultasi investasi kini lebih cepat dan transparan di MPP Simpurusiang Kab. Luwu.",
    tag: "Pelayanan Prima",
    stats: "1.2K Likes • 84 Komentar"
  },
  youtube: {
    isActive: true,
    channelName: "MPP Simpurusiang Official",
    channelUrl: "https://youtube.com",
    videoTitle: "Video Profil & Alur Pelayanan Terpadu Satu Pintu MPP Simpurusiang",
    videoUrl: "https://youtube.com",
    videoThumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    duration: "04:15",
    stats: "12.5K Ditonton • Profil Resmi"
  },
  facebook: {
    isActive: true,
    pageName: "DPMPTSP & MPP Kabupaten Luwu",
    pageUrl: "https://facebook.com/dpmptspluwu",
    postImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800",
    caption: "Sosialisasi Perizinan Berusaha Berbasis Risiko (OSS RBA) dan Layanan KTP Digital untuk Masyarakat Luwu.",
    tag: "Sosialisasi & Edukasi",
    stats: "2.4K Suka • 156 Dibagikan"
  },
  tiktok: {
    isActive: true,
    handle: "@mpp.luwu",
    profileUrl: "https://tiktok.com",
    videoThumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
    caption: "Tutorial Buat NIB OSS Cuma 10 Menit di Loket MPP Simpurusiang! 🚀",
    tag: "Edukasi Kilat",
    stats: "45.2K Views • 3.8K Likes • 240 Shares"
  },
  twitter: "https://twitter.com/dpmptspluwu",
  whatsappChannel: "https://whatsapp.com/channel/luwuinvestment"
};

export const SOCIAL_MEDIA_STORAGE_KEY = "mpp_portal_social_media";
export const SOCIAL_MEDIA_UPDATE_EVENT = "mpp_social_media_updated";

export function getStoredMppSocialMedia(): MppSocialMediaSettings {
  try {
    const raw = localStorage.getItem(SOCIAL_MEDIA_STORAGE_KEY);
    if (!raw) return DEFAULT_MPP_SOCIAL_MEDIA;
    const parsed = JSON.parse(raw);
    return {
      instagram: { 
        ...DEFAULT_MPP_SOCIAL_MEDIA.instagram, 
        ...(parsed.instagram || {}),
        isActive: parsed.instagram?.isActive !== false
      },
      youtube: { 
        ...DEFAULT_MPP_SOCIAL_MEDIA.youtube, 
        ...(parsed.youtube || {}),
        isActive: parsed.youtube?.isActive !== false
      },
      facebook: { 
        ...DEFAULT_MPP_SOCIAL_MEDIA.facebook, 
        ...(parsed.facebook || {}),
        isActive: parsed.facebook?.isActive !== false
      },
      tiktok: { 
        ...DEFAULT_MPP_SOCIAL_MEDIA.tiktok, 
        ...(parsed.tiktok || {}),
        isActive: parsed.tiktok?.isActive !== false
      },
      twitter: parsed.twitter || DEFAULT_MPP_SOCIAL_MEDIA.twitter,
      whatsappChannel: parsed.whatsappChannel || DEFAULT_MPP_SOCIAL_MEDIA.whatsappChannel
    };
  } catch (err) {
    console.error("Error reading stored MPP social media:", err);
    return DEFAULT_MPP_SOCIAL_MEDIA;
  }
}

export function saveMppSocialMedia(settings: MppSocialMediaSettings): void {
  try {
    localStorage.setItem(SOCIAL_MEDIA_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(SOCIAL_MEDIA_UPDATE_EVENT, { detail: settings }));
  } catch (err) {
    console.error("Error saving MPP social media:", err);
  }
}

export async function syncMppSocialMediaWithServer(settings: MppSocialMediaSettings): Promise<void> {
  saveMppSocialMedia(settings);
  try {
    // Sync with mpp_contacts if table exists in Supabase
    await supabase.from("mpp_contacts").upsert([
      {
        channel_name: "Instagram Resmi MPP",
        value: settings.instagram.profileUrl,
        description: `@${settings.instagram.handle} - ${settings.instagram.caption}`,
        is_active: settings.instagram.isActive !== false
      },
      {
        channel_name: "YouTube Resmi MPP",
        value: settings.youtube.channelUrl,
        description: `${settings.youtube.channelName} - ${settings.youtube.videoTitle}`,
        is_active: settings.youtube.isActive !== false
      },
      {
        channel_name: "Facebook Resmi MPP",
        value: settings.facebook.pageUrl,
        description: `${settings.facebook.pageName} - ${settings.facebook.caption}`,
        is_active: settings.facebook.isActive !== false
      },
      {
        channel_name: "TikTok Resmi MPP",
        value: settings.tiktok.profileUrl,
        description: `${settings.tiktok.handle} - ${settings.tiktok.caption}`,
        is_active: settings.tiktok.isActive !== false
      }
    ], { onConflict: "channel_name" });
  } catch (err) {
    console.warn("Supabase mpp_contacts sync skipped or table absent:", err);
  }
}
