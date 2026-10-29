import React from 'react';
import { OFFICIAL_LUWU_LOGO_URL } from '../../LuwuLogo';

export interface BapHeaderProps {
  departmentName: string;
  subDivisionName?: string;
  address?: string;
  contactInfo?: string;
  logoUrl?: string;
  documentTitle?: string;
  documentNumber?: string;
  documentSubject?: string;
  titleColor?: string;
  variant?: 'modal' | 'a4-document';
}

export const BapHeader: React.FC<BapHeaderProps> = ({
  departmentName,
  subDivisionName,
  address = 'Kompleks Perkantoran Pemerintah Kabupaten Luwu, Jl. Jenderal Sudirman No. 1, Belopa Kode Pos : 91994',
  contactInfo,
  logoUrl = OFFICIAL_LUWU_LOGO_URL,
  documentTitle,
  documentNumber,
  documentSubject,
  titleColor = '#000000',
  variant = 'modal'
}) => {
  if (variant === 'a4-document') {
    return (
      <div className="w-full">
        {/* Kop Surat Resmi */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "3px", width: "100%" }}>
          <div style={{ width: "22mm", flexShrink: 0, textAlign: "left", marginRight: "10px" }}>
            <img 
              src={logoUrl} 
              alt="Logo Kabupaten Luwu" 
              style={{ width: "17mm", height: "21mm", maxHeight: "68px", objectFit: "contain", display: "inline-block" }}
              onError={(e) => {
                // Fallback to high-res wikimedia URL if base64 fails
                (e.currentTarget as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/2/29/Lambang_Kabupaten_Luwu.png";
              }}
            />
          </div>

          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "13.5pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000", lineHeight: 1.12 }}>
              PEMERINTAH KABUPATEN LUWU
            </div>
            <div style={{ fontSize: "14.5pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000", marginTop: "1px", lineHeight: 1.12 }}>
              {departmentName}
            </div>
            {subDivisionName && (
              <div style={{ fontSize: "11.5pt", fontWeight: "bold", textTransform: "uppercase", color: "#000000", marginTop: "1px", lineHeight: 1.12 }}>
                {subDivisionName}
              </div>
            )}
            <div style={{ fontSize: "9pt", color: "#000000", marginTop: "2px", lineHeight: 1.2 }}>
              {address}
            </div>
            {contactInfo && (
              <div style={{ fontSize: "8pt", color: "#000000", marginTop: "1px" }}>
                {contactInfo}
              </div>
            )}
          </div>

          <div style={{ width: "22mm", flexShrink: 0, marginLeft: "10px" }} />
        </div>

        {/* Double Border Line Accent */}
        <div style={{ borderBottom: "3px double #000000", marginBottom: "10px" }} />

        {/* Judul Dokumen & Nomor */}
        {documentTitle && (
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <div style={{ fontSize: "12.5pt", fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.2, color: titleColor }}>
              {documentTitle}
            </div>
            {documentNumber && (
              <div style={{ fontSize: "10.5pt", fontWeight: "bold", marginTop: "3px" }}>
                Nomor: {documentNumber}
              </div>
            )}
            {documentSubject && (
              <div style={{ fontSize: "10pt", fontWeight: "bold", textTransform: "uppercase", marginTop: "2px", lineHeight: 1.25 }}>
                Tentang: {documentSubject}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Variant 'modal' (Tailwind standard)
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-center gap-4 border-b-4 border-double border-slate-900 pb-4 text-center">
        <div className="w-16 h-20 flex items-center justify-center flex-shrink-0">
          <img
            src={logoUrl}
            alt="Logo Luwu"
            className="w-16 h-auto object-contain max-h-[72px]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/2/29/Lambang_Kabupaten_Luwu.png";
            }}
          />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-900">
            Pemerintah Kabupaten Luwu
          </h3>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-900">
            {departmentName}
          </h2>
          {subDivisionName && (
            <h4 className="text-xs sm:text-sm font-bold uppercase text-slate-800">
              {subDivisionName}
            </h4>
          )}
          <p className="text-[10px] sm:text-xs font-sans text-slate-600">
            {address}
          </p>
        </div>
      </div>

      {documentTitle && (
        <div className="text-center space-y-1">
          <h4 className="text-xs sm:text-sm font-bold tracking-widest uppercase underline text-slate-900">
            {documentTitle}
          </h4>
          {documentNumber && (
            <p className="text-[11px] font-mono font-bold text-slate-800">
              NOMOR: {documentNumber}
            </p>
          )}
          {documentSubject && (
            <p className="text-xs font-sans italic text-slate-600 pt-0.5">
              TENTANG: {documentSubject}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BapHeader;
