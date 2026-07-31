import React, { useRef, useState } from 'react';
import { FileText, Upload, X, CheckCircle, Loader2 } from 'lucide-react';

interface PDFUploaderProps {
  onUploadSuccess?: (docId: string, filename: string) => void;
  token?: string;
}

export function PDFKajianUploader({ 
  onUploadSuccess, 
  token 
}: PDFUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<{id: string; filename: string; size: number}[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    for (const file of Array.from(files) as File[]) {
      if (file.type !== 'application/pdf') {
        setError('Hanya file PDF yang diizinkan.');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Ukuran PDF maksimal 10MB.');
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/rag/upload', {
          method: 'POST',
          headers: token 
            ? { 'Authorization': `Bearer ${token}` } 
            : {},
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Upload gagal: ${response.status}`);
        }

        const result = await response.json();
        
        const newDoc = {
          id: result.docId,
          filename: file.name,
          size: file.size
        };
        
        setUploadedDocs(prev => [...prev, newDoc]);
        onUploadSuccess?.(result.docId, file.name);
        
      } catch (err: any) {
        setError(err.message || 'Gagal mengupload PDF.');
        console.error('PDF upload error:', err);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDoc = async (docId: string) => {
    try {
      await fetch(`/api/rag/${docId}`, {
        method: 'DELETE',
        headers: token 
          ? { 'Authorization': `Bearer ${token}` } 
          : {}
      });
      setUploadedDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error('Delete doc error:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">
        📄 Upload Kajian Teknis / Kajian Akademis (PDF)
      </label>
      
      <p className="text-xs text-gray-400">
        Dokumen kajian akan digunakan sebagai referensi konteks AI untuk analisis potensi investasi ini.
        Format: PDF • Maks: 10MB per file
      </p>

      {uploadedDocs.length > 0 && (
        <div className="space-y-2">
          {uploadedDocs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(doc.size)} • Terupload ✅
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeDoc(doc.id)}
                className="text-red-400 hover:text-red-600 transition-colors ml-2"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:bg-purple-50 hover:border-purple-400 transition-all text-sm font-medium disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Mengupload & Memproses PDF...</span>
          </>
        ) : (
          <>
            <FileText size={18} />
            <span>Pilih File PDF Kajian</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
          ❌ {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
