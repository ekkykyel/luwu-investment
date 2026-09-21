import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import imageCompression from "browser-image-compression";
import { Upload, Image as ImageIcon, CheckCircle, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { motion } from "motion/react";

export default function StaffImageSettings() {
  const [leftImage, setLeftImage] = useState<string | null>(null);
  const [rightImage, setRightImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLeft, setIsUploadingLeft] = useState(false);
  const [isUploadingRight, setIsUploadingRight] = useState(false);
  
  const [selectedFileLeft, setSelectedFileLeft] = useState<File | null>(null);
  const [previewUrlLeft, setPreviewUrlLeft] = useState<string | null>(null);
  const fileInputRefLeft = useRef<HTMLInputElement>(null);

  const [selectedFileRight, setSelectedFileRight] = useState<File | null>(null);
  const [previewUrlRight, setPreviewUrlRight] = useState<string | null>(null);
  const fileInputRefRight = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCurrentStaffImages();
  }, []);

  const fetchCurrentStaffImages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/site-settings?keys=staff_image_left,staff_image_right", { credentials: "same-origin" });
      const data = res.ok ? await res.json() : [];
      
      if (Array.isArray(data)) {
        const leftData = data.find((d: any) => d.setting_key === "staff_image_left");
        const rightData = data.find((d: any) => d.setting_key === "staff_image_right");
        
        if (leftData && leftData.setting_value) setLeftImage(leftData.setting_value);
        if (rightData && rightData.setting_value) setRightImage(rightData.setting_value);
      }
    } catch (error) {
      console.error("Gagal menarik data staff setting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToDb = async (key: string, url: string) => {
    try {
      const { error: dbError } = await supabase
        .from("site_settings")
        .upsert({ 
          setting_key: key, 
          setting_value: url,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
      if (dbError) throw dbError;
    } catch (err) {
      console.error("Gagal update database:", err);
      throw err;
    }
  };

  const processFileSelect = (file: File | undefined, side: 'left' | 'right') => {
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

    const objectUrl = URL.createObjectURL(file);
    if (side === 'left') {
      setSelectedFileLeft(file);
      setPreviewUrlLeft(objectUrl);
    } else {
      setSelectedFileRight(file);
      setPreviewUrlRight(objectUrl);
    }
  };

  const handleFileSelectLeft = (e: React.ChangeEvent<HTMLInputElement>) => processFileSelect(e.target.files?.[0], 'left');
  const handleFileSelectRight = (e: React.ChangeEvent<HTMLInputElement>) => processFileSelect(e.target.files?.[0], 'right');

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDropLeft = (e: React.DragEvent) => { e.preventDefault(); processFileSelect(e.dataTransfer.files?.[0], 'left'); };
  const handleDropRight = (e: React.DragEvent) => { e.preventDefault(); processFileSelect(e.dataTransfer.files?.[0], 'right'); };

  const handleUpload = async (side: 'left' | 'right') => {
    const selectedFile = side === 'left' ? selectedFileLeft : selectedFileRight;
    if (!selectedFile) return;

    side === 'left' ? setIsUploadingLeft(true) : setIsUploadingRight(true);
    
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp",
      };
      const compressedFile = await imageCompression(selectedFile, options);

      const fileExt = "webp";
      const fileName = `staff_${side}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("hero-assets")
        .upload(fileName, compressedFile, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("hero-assets")
        .getPublicUrl(fileName);
        
      const publicUrl = urlData.publicUrl;

      const key = side === 'left' ? 'staff_image_left' : 'staff_image_right';
      await saveToDb(key, publicUrl);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('staff_settings_updated'));
      }

      if (side === 'left') {
        setLeftImage(publicUrl);
        setSelectedFileLeft(null);
        setPreviewUrlLeft(null);
        if (fileInputRefLeft.current) fileInputRefLeft.current.value = "";
      } else {
        setRightImage(publicUrl);
        setSelectedFileRight(null);
        setPreviewUrlRight(null);
        if (fileInputRefRight.current) fileInputRefRight.current.value = "";
      }

      Swal.fire({
        background: "#0f172a",
        color: "#f8fafc",
        iconColor: "#10b981",
        icon: "success",
        title: "Upload Berhasil",
        text: `Gambar Staff ${side === 'left' ? 'Kiri' : 'Kanan'} berhasil diperbarui.`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error: any) {
      console.error(`Gagal upload staff image ${side}:`, error);
      Swal.fire({
        background: "#0f172a",
        color: "#f8fafc",
        icon: "error",
        title: "Upload Gagal",
        text: error.message || "Terjadi kesalahan saat mengunggah.",
      });
    } finally {
      side === 'left' ? setIsUploadingLeft(false) : setIsUploadingRight(false);
    }
  };

  const renderUploadBox = (side: 'left' | 'right', index: number) => {
    const title = side === 'left' ? "Foto Staff Kiri" : "Foto Staff Kanan";
    const currentImage = side === 'left' ? leftImage : rightImage;
    const previewUrl = side === 'left' ? previewUrlLeft : previewUrlRight;
    const isUploading = side === 'left' ? isUploadingLeft : isUploadingRight;
    const fileInputRef = side === 'left' ? fileInputRefLeft : fileInputRefRight;
    const handleFileSelect = side === 'left' ? handleFileSelectLeft : handleFileSelectRight;
    const handleDrop = side === 'left' ? handleDropLeft : handleDropRight;
    const selectedFile = side === 'left' ? selectedFileLeft : selectedFileRight;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: index * 0.15, 
          ease: [0.34, 1.56, 0.64, 1] 
        }}
        className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4"
      >
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <ImageIcon size={16} /> {title}
        </h2>
        
        {currentImage && !previewUrl ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: index * 0.15 + 0.15, ease: "easeOut" }}
            className="relative rounded-lg overflow-hidden border border-slate-700 aspect-video bg-transparent group transition-all duration-300 hover:scale-[1.03] active:scale-[0.99] hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.18)]"
          >
            <img src={currentImage} alt={title} className="w-full h-full object-cover bg-transparent transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold px-3 py-1 bg-slate-900/80 rounded-full">Gambar Saat Ini</span>
            </div>
          </motion.div>
        ) : null}

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.15 + 0.25, ease: "easeOut" }}
          className={`relative w-full ${!currentImage || previewUrl ? 'aspect-video' : 'h-32'} mt-2 rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] ${previewUrl ? "border-emerald-500/50 bg-emerald-500/5 cursor-pointer" : "border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50 bg-transparent cursor-pointer"}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
          />

          {previewUrl ? (
            <div className="absolute inset-0 z-10 p-2">
               <div className="w-full h-full relative rounded overflow-hidden bg-transparent group">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover bg-transparent opacity-80 transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-semibold px-3 py-1 bg-slate-900/80 rounded-full">Ganti File</span>
                  </div>
               </div>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 text-slate-600 dark:text-slate-400 mb-2" />
              <span className="text-xs font-medium text-slate-300">Unggah Gambar Baru</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">.webp, .jpg, .png (Max 5MB)</span>
            </>
          )}
        </motion.div>

        <button
          onClick={() => handleUpload(side)}
          disabled={!selectedFile || isUploading}
          className={`mt-auto w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            !selectedFile || isUploading
              ? "bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" /> Upload {side === 'left' ? 'Kiri' : 'Kanan'}
            </>
          )}
        </button>
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 bg-[#020617] min-h-screen text-slate-50 font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Upload Photo Staff</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Kelola gambar profil staff (kiri dan kanan) yang melayang di beranda.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderUploadBox('left', 0)}
          {renderUploadBox('right', 1)}
        </div>
      )}
    </div>
  );
}
