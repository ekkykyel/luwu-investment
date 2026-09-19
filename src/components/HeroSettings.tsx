import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import imageCompression from "browser-image-compression";
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

export default function HeroSettings() {
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCurrentHeroes();
  }, []);

  const fetchCurrentHeroes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/site-settings?keys=hero_slider_images,hero_image_url", { credentials: "same-origin" });
      const data = res.ok ? await res.json() : [];
      const sliderItem = data.find((d: any) => d.setting_key === "hero_slider_images");
      const singleItem = data.find((d: any) => d.setting_key === "hero_image_url");

      if (sliderItem && sliderItem.setting_value) {
         try {
           const parsed = JSON.parse(sliderItem.setting_value);
           if (Array.isArray(parsed) && parsed.length > 0) {
             setHeroImages(parsed);
             return;
           }
         } catch (e) {
           console.error("Error parsing hero images JSON", e);
         }
      }
      if (singleItem && singleItem.setting_value) {
        setHeroImages([singleItem.setting_value]);
      }
    } catch (error) {
      console.error("Gagal menarik data hero setting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToDb = async (urls: string[]) => {
    try {
      const { error: dbError } = await supabase
        .from("site_settings")
        .upsert({ 
          setting_key: "hero_slider_images", 
          setting_value: JSON.stringify(urls),
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
      if (dbError) throw dbError;
    } catch (err) {
      console.error("Gagal update database:", err);
      throw err;
    }
  };

  const handleDelete = async (indexToDelete: number) => {
    try {
      const result = await Swal.fire({
        background: "#0f172a",
        color: "#f8fafc",
        title: "Hapus Foto?",
        text: "Foto akan dihapus dari slider Hero",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#334155",
        confirmButtonText: "Ya, Hapus!"
      });

      if (result.isConfirmed) {
        setIsLoading(true);
        const newImages = heroImages.filter((_, idx) => idx !== indexToDelete);
        await saveToDb(newImages);
        setHeroImages(newImages);
        Swal.fire({
          background: "#0f172a",
          color: "#f8fafc",
          icon: "success",
          title: "Terhapus",
          text: "Foto berhasil dihapus.",
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (e: any) {
      Swal.fire({
        background: "#0f172a",
        color: "#f8fafc",
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan saat menghapus data."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (heroImages.length >= 5) {
      Swal.fire({
        background: "#0f172a",
        color: "#f8fafc",
        icon: "warning",
        title: "Batas Maksimum",
        text: "Maksimal 5 foto untuk slider.",
      });
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        background: "#0f172a",
        color: "#f8fafc",
        icon: "error",
        title: "File Terlalu Besar",
        text: "Maksimal ukuran file adalah 5MB.",
      });
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        background: "#0f172a",
        color: "#f8fafc",
        icon: "error",
        title: "Format Tidak Didukung",
        text: "Gunakan format JPG, PNG, atau WebP.",
      });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (heroImages.length >= 5) {
      Swal.fire({
        background: "#0f172a",
        color: "#f8fafc",
        icon: "warning",
        title: "Batas Maksimum",
        text: "Maksimal 5 foto untuk slider.",
      });
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        background: "#0f172a",
        color: "#f8fafc",
        icon: "error",
        title: "File Terlalu Besar",
        text: "Maksimal ukuran file adalah 5MB.",
      });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (heroImages.length >= 5) return;

    setIsUploading(true);
    try {
      // Compress Image to WebP
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp",
      };
      const compressedFile = await imageCompression(selectedFile, options);

      // Generate Unique Filename
      const fileExt = "webp";
      const fileName = `hero_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const sessionData = await supabase.auth.getSession();
      undefined;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("hero-assets")
        .upload(fileName, compressedFile, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: urlData } = supabase.storage
        .from("hero-assets")
        .getPublicUrl(fileName);
        
      const publicUrl = urlData.publicUrl;

      const newImages = [...heroImages, publicUrl];
      
      // Update Database setup table site_settings
      await saveToDb(newImages);

      setHeroImages(newImages);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      Swal.fire({
        background: "#0f172a",
        color: "#f8fafc",
        iconColor: "#10b981",
        icon: "success",
        title: "Upload Berhasil",
        text: "Background Hero selesai diunggah.",
        timer: 3000,
        showConfirmButton: false
      });

    } catch (error: any) {
      console.error("Gagal upload hero image:", error);
      Swal.fire({
        background: "#0f172a",
        color: "#f8fafc",
        icon: "error",
        title: "Upload Gagal",
        text: error.message || "Terjadi kesalahan saat mengunggah.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 bg-[#020617] min-h-screen text-slate-50 font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Upload Photo Slider</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Kelola slider visual utama landing page (Maksimal 5 photo).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gallery Card */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <ImageIcon size={16} /> Slider Hero Images ({heroImages.length}/5)
              </h2>
           </div>
          
           {isLoading && heroImages.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
           ) : heroImages.length === 0 ? (
              <div className="h-40 border border-slate-800 rounded bg-slate-900 border-dashed flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs p-4 text-center">
                Belum ada photo slider. Silakan unggah.
              </div>
           ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {heroImages.map((url, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700 aspect-video bg-slate-900">
                      <img src={url} alt={`Hero ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => handleDelete(idx)}
                          className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/60 p-2 text-xs font-mono text-slate-300 truncate">
                        Slide {idx + 1}
                      </div>
                    </div>
                 ))}
              </div>
           )}
        </div>

        {/* Upload Zone */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Upload size={16} /> Upload New Photo
          </h2>

          <div 
            className={`relative w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-colors ${heroImages.length >= 5 ? 'border-amber-900/50 bg-amber-900/10 cursor-not-allowed' : previewUrl ? "border-emerald-500/50 bg-emerald-500/5 cursor-pointer" : "border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50 bg-slate-900 cursor-pointer"}`}
            onClick={() => heroImages.length < 5 && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              disabled={heroImages.length >= 5}
            />

            {heroImages.length >= 5 ? (
              <div className="text-amber-500/80 text-sm">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                Anda sudah mencapai batas maksimum (5 foto).<br/>Hapus salah satu untuk mengunggah yang baru.
              </div>
            ) : previewUrl ? (
              <div className="absolute inset-0 z-10 p-2">
                 <div className="w-full h-full relative rounded overflow-hidden">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-semibold px-3 py-1 bg-slate-900/80 rounded-full">Ganti File</span>
                    </div>
                 </div>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-600 dark:text-slate-400 mb-3" />
                <span className="text-sm font-medium text-slate-300">Unggah Gambar Hero Baru</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 mt-1">.webp, .jpg, .png (Max 5MB)</span>
                <span className="text-[10px] text-slate-600 mt-2">Atau seret dan lepas file di sini</span>
              </>
            )}
           </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || heroImages.length >= 5}
            className={`mt-auto w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              !selectedFile || isUploading || heroImages.length >= 5
                ? "bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sedang Memproses...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Upload ke Slider
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
