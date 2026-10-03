import React from 'react';

export interface BapCoordinatePoint {
  id: string | number;
  pointName: string;
  latitudeDms?: string;
  latitudeDd: number;
  longitudeDms?: string;
  longitudeDd: number;
  description?: string;
}

export interface BapCoordinateTableProps {
  coordinates: BapCoordinatePoint[];
  title?: string;
  documentNumber?: string;
  preambleText?: string;
  showLegalNotes?: boolean;
  variant?: 'modal' | 'a4-document';
}

export const BapCoordinateTable: React.FC<BapCoordinateTableProps> = ({
  coordinates,
  title = 'TABEL KOORDINAT GEOGRAFIS TITIK POLIGON LAHAN',
  documentNumber,
  preambleText = 'Daftar titik koordinat poligon batas bidang tanah yang dimohonkan dan telah diverifikasi memenuhi kesesuaian ruang sesuai format Standar Sistem Informasi Geografis WGS 1984:',
  showLegalNotes = true,
  variant = 'modal'
}) => {
  if (coordinates.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-300 rounded-xl">
        Belum ada titik koordinat poligon yang terdefinisi.
      </div>
    );
  }

  if (variant === 'a4-document') {
    return (
      <div style={{ width: "100%", boxSizing: "border-box" }}>
        {title && (
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <div style={{ fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", textDecoration: "underline" }}>
              {title}
            </div>
            {documentNumber && (
              <div style={{ fontSize: "9pt", marginTop: "2px" }}>
                Nomor Dokumen: <b>{documentNumber}</b>
              </div>
            )}
          </div>
        )}

        {preambleText && (
          <div style={{ fontSize: "10pt", textAlign: "justify", marginBottom: "8px", lineHeight: 1.4 }}>
            {preambleText}
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt", border: "1px solid #000000", marginBottom: "12px", boxSizing: "border-box" }}>
          <thead>
            <tr style={{ backgroundColor: "#e2e8f0", textAlign: "center" }}>
              <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "35px" }}>NO.</th>
              <th style={{ border: "1px solid #000000", padding: "5px 6px", width: "60px" }}>TITIK</th>
              <th style={{ border: "1px solid #000000", padding: "5px 8px" }}>GARIS LINTANG (LATITUDE)</th>
              <th style={{ border: "1px solid #000000", padding: "5px 8px" }}>GARIS BUJUR (LONGITUDE)</th>
              <th style={{ border: "1px solid #000000", padding: "5px 8px" }}>KETERANGAN / POSISI PATOK</th>
            </tr>
          </thead>
          <tbody>
            {coordinates.map((pt, idx) => (
              <tr key={pt.id || idx} style={{ backgroundColor: idx % 2 === 1 ? "#f8fafc" : "#ffffff" }}>
                <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "center", fontWeight: "bold" }}>
                  {idx + 1}
                </td>
                <td style={{ border: "1px solid #000000", padding: "4px 6px", textAlign: "center", fontWeight: "bold", fontFamily: "monospace" }}>
                  {pt.pointName}
                </td>
                <td style={{ border: "1px solid #000000", padding: "4px 8px", fontFamily: "monospace", textAlign: "center" }}>
                  {pt.latitudeDms ? pt.latitudeDms : `${pt.latitudeDd.toFixed(6)}°`}
                  <br />
                  <span style={{ fontSize: "7.5pt", color: "#64748b" }}>({pt.latitudeDd.toFixed(6)})</span>
                </td>
                <td style={{ border: "1px solid #000000", padding: "4px 8px", fontFamily: "monospace", textAlign: "center" }}>
                  {pt.longitudeDms ? pt.longitudeDms : `${pt.longitudeDd.toFixed(6)}°`}
                  <br />
                  <span style={{ fontSize: "7.5pt", color: "#64748b" }}>({pt.longitudeDd.toFixed(6)})</span>
                </td>
                <td style={{ border: "1px solid #000000", padding: "4px 8px", fontSize: "8.5pt" }}>
                  {pt.description || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showLegalNotes && (
          <div style={{ border: "1px solid #000000", padding: "6px 10px", fontSize: "8.5pt", backgroundColor: "#f8fafc", marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
            <b>Ketentuan Teknis Geospasial:</b>
            <ul style={{ margin: "2px 0 0 0", paddingLeft: "16px", lineHeight: 1.35 }}>
              <li>Koordinat titik batas di atas mengikat secara hukum dalam penerbitan PKKPR dan perizinan turunan.</li>
              <li>Seluruh patok fisik di lapangan wajib dipasang permanen oleh pemohon sesuai koordinat tertera.</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Variant 'modal' (Tailwind standard)
  return (
    <div className="w-full space-y-3">
      {title && (
        <div className="text-center space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {title}
          </h4>
          {documentNumber && (
            <p className="text-[11px] font-mono text-slate-500">
              Nomor: {documentNumber}
            </p>
          )}
        </div>
      )}

      {preambleText && (
        <p className="text-xs text-slate-600 dark:text-slate-400 text-justify leading-relaxed">
          {preambleText}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-center">
              <th className="border border-slate-300 dark:border-slate-700 p-2 w-10">No</th>
              <th className="border border-slate-300 dark:border-slate-700 p-2 w-16">Titik</th>
              <th className="border border-slate-300 dark:border-slate-700 p-2">Latitude (Lintang)</th>
              <th className="border border-slate-300 dark:border-slate-700 p-2">Longitude (Bujur)</th>
              <th className="border border-slate-300 dark:border-slate-700 p-2">Keterangan / Patok</th>
            </tr>
          </thead>
          <tbody>
            {coordinates.map((pt, idx) => (
              <tr key={pt.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-900/30' : 'bg-white dark:bg-slate-900'}>
                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold">{idx + 1}</td>
                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">{pt.pointName}</td>
                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono">
                  {pt.latitudeDms || `${pt.latitudeDd.toFixed(6)}°`}
                </td>
                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono">
                  {pt.longitudeDms || `${pt.longitudeDd.toFixed(6)}°`}
                </td>
                <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400">
                  {pt.description || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showLegalNotes && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-300">Ketentuan Teknis Geospasial:</span>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            <li>Koordinat titik batas di atas mengikat secara hukum dalam penerbitan dokumen resmi PKKPR.</li>
            <li>Seluruh patok fisik di lapangan wajib dipasang permanen oleh pemohon sesuai koordinat tertera.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BapCoordinateTable;
