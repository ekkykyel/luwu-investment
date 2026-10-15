import React, { useState } from 'react';
import { RefreshCw, AlertCircle, Upload } from 'lucide-react';
import { uploadImageToSupabase, getImageUrl, handleImageError } from '../../utils/imageFallbacks';

export interface ImageUploadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
}

export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  placeholder = "Seret & lepas foto di sini, atau klik untuk memilih",
  folder = "photos",
  maxSizeMB = 2,
}: ImageUploadFieldProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const uploadFileToStorage = async (file: File) => {
    if (!file) return;
    setUploadError(null);

    // 1. Validasi format file
    if (!file.type.startsWith("image/") && !file.name.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
      setUploadError("Hanya file gambar (PNG, JPG, WEBP, SVG) yang didukung.");
      return;
    }

    // 2. Validasi batas ukuran file (Maks 10MB, auto kompresi cerdas di background)
    const effectiveMaxMB = Math.max(maxSizeMB, 10);
    const maxSizeBytes = effectiveMaxMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError(`Ukuran file melebihi batas ${effectiveMaxMB}MB (${(file.size / (1024 * 1024)).toFixed(2)}MB). Mohon pilih file yang lebih kecil.`);
      return;
    }

    setIsUploading(true);

    try {
      const publicUrl = await uploadImageToSupabase(file, folder);
      onChange(publicUrl);
    } catch (err: any) {
      console.error("[Storage Upload Error]:", err);
      const friendly = err?.message && !err.message.includes("Failed to fetch")
        ? err.message
        : "Gagal mengunggah file foto ke Supabase Storage. Pastikan jaringan internet stabil.";
      setUploadError(friendly);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFileToStorage(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFileToStorage(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Deteksi apakah value adalah base64 lama
  const isBase64 = value?.startsWith("data:image");

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 block">{label}</span>
        <span className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">Maks. {maxSizeMB}MB</span>
      </div>

      <div
        id={id}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={`relative border border-dashed rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[95px] ${
          isDragActive
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 scale-[0.99]"
            : value
              ? "border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 text-gray-800 dark:text-slate-300"
              : "border-gray-300 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40 hover:bg-gray-100/60 dark:hover:bg-slate-800/60 hover:border-gray-400 dark:hover:border-slate-700 text-gray-600 dark:text-slate-400"
        } ${isUploading ? "opacity-75 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          onChange={handleChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="text-center space-y-1.5 py-2">
            <RefreshCw className="w-5 h-5 mx-auto text-emerald-500 animate-spin" />
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Mengunggah ke Supabase Storage...</p>
            <p className="text-[8px] text-gray-500 dark:text-slate-400">Menyimpan Public URL murni (Anti-Base64)</p>
          </div>
        ) : value ? (
          <div className="flex items-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(value, folder === "logos" ? "agency" : folder === "facilities" ? "facility" : folder === "umkm" ? "umkm" : "general")}
              alt="Preview"
              referrerPolicy="no-referrer"
              onError={(e) => handleImageError(e, folder === "logos" ? "agency" : folder === "facilities" ? "facility" : folder === "umkm" ? "umkm" : "general")}
              className="w-12 h-12 object-contain bg-gray-100 dark:bg-slate-900/80 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm flex-shrink-0 p-1"
            />
            <div className="flex-1 min-w-0 text-left">
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mb-1 ${
                isBase64 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              }`}>
                {isBase64 ? "⚠ Base64 (Klik Ganti untuk Simpan ke Storage)" : "✓ Storage Public URL"}
              </span>
              <p className="text-[9px] text-gray-500 dark:text-slate-400 truncate font-mono">
                {value.length > 50 ? value.substring(0, 48) + "..." : value}
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleButtonClick}
                  className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors cursor-pointer"
                >
                  Ganti Foto
                </button>
                <span className="text-gray-300 dark:text-slate-600 text-[9px]">|</span>
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:underline transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-1 pointer-events-none">
            <Upload className="w-4 h-4 mx-auto text-gray-400 dark:text-slate-500" />
            <p className="text-[9px] font-medium leading-tight max-w-[200px] mx-auto text-gray-600 dark:text-slate-400">
              {placeholder}
            </p>
            <p className="text-[8px] text-gray-400 dark:text-slate-500">
              PNG, JPG, WEBP, SVG (Maks. {maxSizeMB}MB)
            </p>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[10px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}

export default ImageUploadField;
