import React from "react";
import { X, FileCheck2, Printer, Download, Eye, ExternalLink } from "lucide-react";
import { SkPkkprDpmptspDocument, SkPkkprDpmptspData } from "./SkPkkprDpmptspDocument";

export interface SkPkkprDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SkPkkprDpmptspData | null;
  onEditRequested?: () => void;
}

export const SkPkkprDocumentModal: React.FC<SkPkkprDocumentModalProps> = ({
  isOpen,
  onClose,
  data,
  onEditRequested
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md overflow-y-auto flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:bg-white print:static print:z-auto animate-in fade-in duration-200">
      {/* Top Modal Header Control Bar (Screen only) */}
      <div className="w-full max-w-5xl mb-3 flex items-center justify-between bg-slate-900/90 text-white p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-2xl print:hidden sticky top-2 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
              <span>Pratinjau Resmi SK PKKPR DPMPTSP Kab. Luwu</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30 font-bold uppercase">
                {data.jenisPermohonan || 'Berusaha'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              SK No: {data.nomorSkPkkpr} • {data.namaPerusahaan}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Document Render */}
      <div className="w-full max-w-5xl pb-12 print:p-0 print:m-0 print:max-w-none">
        <SkPkkprDpmptspDocument
          data={data}
          onEditRequested={onEditRequested}
          showControlBar={true}
        />
      </div>
    </div>
  );
};

export default SkPkkprDocumentModal;
