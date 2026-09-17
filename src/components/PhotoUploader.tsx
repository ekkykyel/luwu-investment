import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabaseClient.js';

interface PhotoUploaderProps {
  photos: string[];           // array URL foto yang sudah ada
  onChange: (photos: string[]) => void;  // callback update
  maxPhotos?: number;         // maksimal foto (default: 5)
  disabled?: boolean;
}

export default function PhotoUploader({
  photos = [],
  onChange,
  maxPhotos = 5,
  disabled = false
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Ref untuk input file (galeri)
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ref untuk input kamera
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fungsi konversi file ke base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Fungsi kompres gambar sebelum upload
  const compressImage = (
    base64: string, 
    maxWidthPx: number = 1280,
    quality: number = 0.82
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Scale down jika terlalu besar
        if (width > maxWidthPx) {
          height = Math.round((height * maxWidthPx) / width);
          width = maxWidthPx;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = base64;
    });
  };

  const dataURLtoBlob = (dataurl: string) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg',
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  };

  const safePhotos = photos || [];

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const remaining = maxPhotos - safePhotos.length;
    if (remaining <= 0) {
      setError(`Maksimal ${maxPhotos} foto.`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const newPhotos: string[] = [];
      const filesToProcess = Array.from(files).slice(0, remaining);

      for (const file of filesToProcess) {
        // Validasi tipe file
        if (!file.type.startsWith('image/')) {
          setError('Hanya file gambar yang diizinkan.');
          continue;
        }

        const base64 = await fileToBase64(file);
        const compressed = await compressImage(base64, 1200, 0.8); // Compress to 1200px, 80% quality
        
        const blob = dataURLtoBlob(compressed);
        const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;

        undefined;
        
        const { error } = await supabase.storage
          .from('investments')
          .upload(filename, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw new Error(`Gagal mengunggah ke Supabase: ${error.message}`);
        }

        const { data: urlData } = supabase.storage.from('investments').getPublicUrl(filename);
        newPhotos.push(urlData.publicUrl);
      }

      if (newPhotos.length > 0) {
        onChange([...safePhotos, ...newPhotos]);
      }
    } catch (err: any) {
      setError(`Gagal memproses foto. Detail: ${err?.message || err}`);
      console.error('Photo processing error (Original Error):', err);
    } finally {
      setUploading(false);
      // Reset input agar bisa pilih file yang sama lagi
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // Hapus foto
  const removePhoto = (index: number) => {
    const updated = safePhotos.filter((_, i) => i !== index);
    onChange(updated);
  };

  const canAddMore = safePhotos.length < maxPhotos && !disabled;

  return (
    <div className="space-y-3">
      
      {/* Label & Counter */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          📸 Foto Dokumentasi
        </label>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {safePhotos.length}/{maxPhotos} foto
        </span>
      </div>

      {/* Grid Preview Foto */}
      {safePhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {safePhotos.map((src, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={src}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border 
                           border-gray-200 shadow-sm"
              />
              {/* Tombol hapus */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 
                             text-white rounded-full p-0.5 opacity-0 
                             group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <X size={12} />
                </button>
              )}
              {/* Badge nomor */}
              <span className="absolute bottom-1 left-1 bg-black/50 
                               text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tombol Aksi Upload & Kamera */}
      {canAddMore && (
        <div className="grid grid-cols-2 gap-2">
          
          {/* Tombol Upload dari Galeri */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 px-4 py-3 
                       border-2 border-dashed border-blue-300 rounded-xl
                       text-blue-600 hover:bg-blue-50 hover:border-blue-400
                       transition-all text-sm font-medium disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            <span>Unggah Foto</span>
          </button>

          {/* Tombol Kamera Langsung */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 px-4 py-3
                       border-2 border-dashed border-green-300 rounded-xl
                       text-green-600 hover:bg-green-50 hover:border-green-400
                       transition-all text-sm font-medium disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Camera size={18} />
            )}
            <span>Buka Kamera</span>
          </button>
        </div>
      )}

      {/* Info saat foto sudah penuh */}
      {safePhotos.length >= maxPhotos && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          ⚠️ Batas maksimal {maxPhotos} foto tercapai. 
          Hapus foto lama untuk menambah yang baru.
        </p>
      )}

      {/* Pesan Error */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
          ❌ {error}
        </p>
      )}

      {/* Loading indicator */}
      {uploading && (
        <p className="text-xs text-blue-500 text-center animate-pulse">
          ⏳ Memproses & mengompres foto...
        </p>
      )}

      {/* INPUT TERSEMBUNYI - Upload dari Galeri */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => processFiles(e.target.files)}
      />

      {/* INPUT TERSEMBUNYI - Kamera Langsung */}
      {/* capture="environment" = kamera belakang (landscape/foto alam) */}
      {/* capture="user" = kamera depan (selfie) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => processFiles(e.target.files)}
      />

    </div>
  );
}
