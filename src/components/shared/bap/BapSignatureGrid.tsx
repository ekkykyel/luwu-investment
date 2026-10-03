import React from 'react';
import { QrCode } from 'lucide-react';

export interface BapSigner {
  roleTitle: string;
  name: string;
  nip?: string;
  actionHeader?: string;
  isTteSigned?: boolean;
}

export interface BapSignatureGridProps {
  dateCity?: string;
  dateString?: string;
  mode?: 'single-kadis' | 'dual';
  signerLeft?: BapSigner;
  signerRight?: BapSigner;
  showQrTte?: boolean;
  qrSubtitle?: string;
  variant?: 'modal' | 'a4-document';
}

export const BapSignatureGrid: React.FC<BapSignatureGridProps> = ({
  dateCity = 'Belopa',
  dateString,
  mode = 'single-kadis',
  signerLeft,
  signerRight,
  showQrTte = true,
  qrSubtitle = 'TTE Tersertifikasi BSrE BSSN RI',
  variant = 'modal'
}) => {
  const formattedDate = dateString || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  if (variant === 'a4-document') {
    if (mode === 'dual' && signerLeft && signerRight) {
      return (
        <div style={{ width: "100%", marginTop: "6px", boxSizing: "border-box" }}>
          {/* Tanggal Dokumen */}
          <div style={{ textAlign: "right", fontSize: "10pt", marginBottom: "6px", paddingRight: "10px" }}>
            {dateCity}, {formattedDate}
          </div>

          {/* Grid 2 Kolom Pejabat Penandatangan */}
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "9.5pt", textAlign: "center" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", verticalAlign: "bottom", padding: "0 10px", fontWeight: "bold" }}>
                  {signerLeft.actionHeader || 'Mengetahui / Menyetujui,'}
                </td>
                <td style={{ width: "50%", verticalAlign: "bottom", padding: "0 10px", fontWeight: "bold" }}>
                  {signerRight.actionHeader || 'Mengesahkan,'}
                </td>
              </tr>

              <tr>
                <td style={{ width: "50%", verticalAlign: "top", padding: "2px 10px 0 10px", height: "36px" }}>
                  <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "9pt", lineHeight: 1.2 }}>
                    {signerLeft.roleTitle}
                  </div>
                </td>
                <td style={{ width: "50%", verticalAlign: "top", padding: "2px 10px 0 10px", height: "36px" }}>
                  <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "9pt", lineHeight: 1.2 }}>
                    {signerRight.roleTitle}
                  </div>
                </td>
              </tr>

              <tr>
                <td style={{ width: "50%", height: "55px", verticalAlign: "middle" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "8.5pt", color: "#2563eb", fontWeight: "bold", backgroundColor: "#eff6ff", padding: "3px 8px", borderRadius: "4px", border: "1px solid #bfdbfe" }}>
                    [ Ditandatangani Secara Elektronik ]
                  </span>
                </td>
                <td style={{ width: "50%", height: "55px", verticalAlign: "middle" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "8.5pt", color: "#2563eb", fontWeight: "bold", backgroundColor: "#eff6ff", padding: "3px 8px", borderRadius: "4px", border: "1px solid #bfdbfe" }}>
                    [ Ditandatangani Secara Elektronik ]
                  </span>
                </td>
              </tr>

              <tr>
                <td style={{ width: "50%", verticalAlign: "top", padding: "0 10px" }}>
                  <div style={{ fontSize: "10pt", fontWeight: "bold", textDecoration: "underline" }}>{signerLeft.name}</div>
                  {signerLeft.nip && (
                    <div style={{ fontSize: "9pt", color: "#000000", marginTop: "1px" }}>NIP. {signerLeft.nip}</div>
                  )}
                </td>
                <td style={{ width: "50%", verticalAlign: "top", padding: "0 10px" }}>
                  <div style={{ fontSize: "10pt", fontWeight: "bold", textDecoration: "underline" }}>{signerRight.name}</div>
                  {signerRight.nip && (
                    <div style={{ fontSize: "9pt", color: "#000000", marginTop: "1px" }}>NIP. {signerRight.nip}</div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // Single Kadis with QR
    const activeSigner = signerRight || signerLeft || {
      roleTitle: 'KEPALA DINAS',
      name: 'Pejabat Berwenang',
      nip: '-'
    };

    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "12px", borderTop: "1px solid #cbd5e1", paddingTop: "12px" }}>
        {showQrTte && (
          <div style={{ textAlign: "center" }}>
            <div style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc", display: "inline-block" }}>
              <QrCode size={56} style={{ color: "#1e293b" }} />
            </div>
            <div style={{ fontSize: "8pt", fontFamily: "monospace", color: "#64748b", marginTop: "4px" }}>
              {qrSubtitle}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", minWidth: "220px" }}>
          <div style={{ fontSize: "9pt" }}>{dateCity}, {formattedDate}</div>
          <div style={{ fontSize: "9.5pt", fontWeight: "bold", marginTop: "2px", textTransform: "uppercase" }}>
            {activeSigner.roleTitle}
          </div>
          <div style={{ height: "45px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: "8.5pt", color: "#2563eb", fontWeight: "bold", backgroundColor: "#eff6ff", padding: "2px 6px", borderRadius: "4px", border: "1px solid #bfdbfe" }}>
              [ Ditandatangani Secara Elektronik ]
            </span>
          </div>
          <div style={{ fontSize: "9.5pt", fontWeight: "bold", textDecoration: "underline" }}>
            {activeSigner.name}
          </div>
          {activeSigner.nip && (
            <div style={{ fontSize: "8.5pt", fontFamily: "monospace", color: "#475569" }}>
              NIP. {activeSigner.nip}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Variant 'modal' (Tailwind standard)
  const activeSigner = signerRight || signerLeft || {
    roleTitle: 'Kepala Dinas',
    name: 'Pejabat Berwenang',
    nip: '-'
  };

  return (
    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between font-sans">
      {showQrTte && (
        <div className="text-center space-y-1">
          <div className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 inline-block shadow-sm">
            <QrCode size={64} className="text-slate-800 dark:text-slate-200" />
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            {qrSubtitle}
          </div>
        </div>
      )}

      <div className="text-center space-y-1">
        <p className="text-xs text-slate-600 dark:text-slate-400">Ditetapkan di {dateCity}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">Pada tanggal: {formattedDate}</p>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 pt-1">{activeSigner.roleTitle}</p>
        <div className="h-12 flex items-center justify-center">
          <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 shadow-xs">
            [ Ditandatangani Secara Elektronik ]
          </span>
        </div>
        <p className="text-xs font-bold underline text-slate-900 dark:text-white">{activeSigner.name}</p>
        {activeSigner.nip && (
          <p className="text-[10px] font-mono text-slate-500">NIP. {activeSigner.nip}</p>
        )}
      </div>
    </div>
  );
};

export default BapSignatureGrid;
