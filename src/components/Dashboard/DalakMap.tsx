import React, { useEffect, useRef, useCallback, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AlertTriangle, X, MapPin, Clock, User, Tag, Hash } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Complaint {
  id: string;
  tiket_id?: string;
  nama_pelapor?: string;
  kontak_pelapor?: string;
  kategori_pengaduan?: string;
  lokasi_kejadian?: string;
  desa?: string;
  perusahaan_terkait?: string;
  deskripsi_masalah?: string;
  status?: string;
  tipe_pelapor?: string;
  created_at?: string;
  latitude?: number | null;
  longitude?: number | null;
  bukti_foto_url?: string;
  is_anonim?: boolean;
}

interface DalakMapProps {
  isDarkMode?: boolean;
  complaints?: Complaint[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LUWU_CENTER = { longitude: 120.19, latitude: -2.57, zoom: 9 };

// Google Maps Street basemap — matches project-wide standard
const GOOGLE_STREET_STYLE: any = {
  version: 8,
  sources: {
    "google-street": {
      type: "raster",
      tiles: [
        "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      ],
      tileSize: 256,
      attribution: "© Google Maps",
      maxzoom: 22,
    },
  },
  layers: [
    {
      id: "google-street-layer",
      type: "raster",
      source: "google-street",
    },
  ],
};

// ─── Colour helpers ───────────────────────────────────────────────────────────
function getCategoryColor(kategori?: string) {
  switch (kategori) {
    case "Pencemaran Lingkungan":
      return { ring: "#ef4444", bg: "#ef444422", text: "#f87171" };
    case "Sengketa Lahan / Tata Ruang":
      return { ring: "#f59e0b", bg: "#f59e0b22", text: "#fbbf24" };
    case "Pelanggaran Izin Usaha":
      return { ring: "#3b82f6", bg: "#3b82f622", text: "#60a5fa" };
    case "Infrastruktur / Fasilitas Umum":
      return { ring: "#8b5cf6", bg: "#8b5cf622", text: "#a78bfa" };
    case "Konflik Sosial / Tenaga Kerja":
      return { ring: "#f43f5e", bg: "#f43f5e22", text: "#fb7185" };
    default:
      return { ring: "#64748b", bg: "#64748b22", text: "#94a3b8" };
  }
}

function getMarkerColor(status?: string) {
  if (!status || status === "Menunggu Verifikasi" || status === "Kritis") {
    return "#ef4444"; // Red
  }
  if (status === "Selesai" || status === "Selesai / Aman") {
    return "#10b981"; // Green
  }
  return "#f59e0b"; // Yellow (Proses, Warning, dsb)
}

function getStatusBadge(status?: string) {
  if (!status || status === "Menunggu Verifikasi") {
    return { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.45)", color: "#fbbf24", label: status || "Menunggu Verifikasi" };
  }
  if (status === "Selesai") {
    return { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.45)", color: "#34d399", label: status };
  }
  if (status === "Sedang Ditinjau Dalak" || status === "Verifikasi Dalak Berjalan") {
    return { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.45)", color: "#60a5fa", label: status };
  }
  return { bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.45)", color: "#94a3b8", label: status };
}

// ─── Custom SVG pin marker ────────────────────────────────────────────────────
function ComplaintPin({ color, pulse }: { color: string; pulse: boolean }) {
  return (
    <div style={{ position: "relative", width: 28, height: 36, cursor: "pointer" }}>
      {pulse && (
        <span
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            animation: "dalak-ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
            opacity: 0.55,
            pointerEvents: "none",
          }}
        />
      )}
      <svg
        viewBox="0 0 28 36"
        width={28}
        height={36}
        style={{ filter: `drop-shadow(0 3px 8px ${color}99)`, display: "block" }}
      >
        <path
          d="M14 0C6.268 0 0 6.268 0 14c0 9.334 14 22 14 22S28 23.334 28 14C28 6.268 21.732 0 14 0z"
          fill={color}
        />
        <circle cx="14" cy="14" r="6" fill="white" opacity={0.92} />
      </svg>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DalakMap({ isDarkMode = true, complaints = [] }: DalakMapProps) {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const mapRef = useRef<any>(null);

  // Only render pins that have valid GPS coordinates
  const mappableComplaints = complaints.filter(
    (c) =>
      c.latitude != null &&
      c.longitude != null &&
      !isNaN(Number(c.latitude)) &&
      !isNaN(Number(c.longitude))
  );

  // Auto-fit map bounds to all complaint markers when data loads
  useEffect(() => {
    if (!mapRef.current || mappableComplaints.length === 0) return;
    const map = (mapRef.current as any).getMap?.() ?? mapRef.current;
    if (!map) return;

    if (mappableComplaints.length === 1) {
      const c = mappableComplaints[0];
      map.flyTo({
        center: [Number(c.longitude), Number(c.latitude)],
        zoom: 12,
        duration: 1400,
        essential: true,
      });
      return;
    }

    const lngs = mappableComplaints.map((c) => Number(c.longitude));
    const lats = mappableComplaints.map((c) => Number(c.latitude));
    try {
      map.fitBounds(
        [
          [Math.min(...lngs) - 0.05, Math.min(...lats) - 0.05],
          [Math.max(...lngs) + 0.05, Math.max(...lats) + 0.05],
        ],
        { padding: 60, duration: 1400, maxZoom: 13 }
      );
    } catch {
      // map may not be ready yet — ignore
    }
  }, [mappableComplaints.length]);

  const handleMarkerClick = useCallback((c: Complaint) => {
    setSelectedComplaint(c);
  }, []);

  const handlePopupClose = useCallback(() => {
    setSelectedComplaint(null);
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="relative w-full h-full">
      {/* Keyframe for pulse ring animation */}
      <style>{`
        @keyframes dalak-ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .maplibregl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 16px !important;
          box-shadow: none !important;
        }
        .maplibregl-popup-tip { display: none !important; }
        .maplibregl-ctrl-group {
          background: rgba(15,23,42,0.92) !important;
          border: 1px solid rgba(100,116,139,0.3) !important;
          border-radius: 10px !important;
          overflow: hidden;
        }
        .maplibregl-ctrl-group button { color: #e2e8f0 !important; }
        .maplibregl-ctrl-group button:hover { background: rgba(255,255,255,0.1) !important; }
        .maplibregl-ctrl-group .maplibregl-ctrl-icon { filter: invert(1) brightness(0.85); }
      `}</style>

      <Map
        ref={mapRef}
        initialViewState={LUWU_CENTER}
        mapStyle={GOOGLE_STREET_STYLE}
        mapLib={maplibregl as any}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {/* 3D Navigation Control — preserved per DPMPTSP Luwu system policy */}
        <NavigationControl position="top-right" visualizePitch />

        {/* Dynamic complaint markers */}
        {mappableComplaints.map((c) => {
          const markerColor = getMarkerColor(c.status);
          const isActive = !["Selesai", "Ditolak / Batal"].includes(c.status || "");
          return (
            <Marker
              key={c.id}
              longitude={Number(c.longitude)}
              latitude={Number(c.latitude)}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(c);
              }}
            >
              <ComplaintPin color={markerColor} pulse={isActive} />
            </Marker>
          );
        })}

        {/* Interactive popup on marker click */}
        {selectedComplaint && (
          <Popup
            longitude={Number(selectedComplaint.longitude)}
            latitude={Number(selectedComplaint.latitude)}
            anchor="bottom"
            offset={[0, -40] as any}
            onClose={handlePopupClose}
            closeButton={false}
            closeOnClick={false}
            maxWidth="320px"
          >
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                border: "1px solid rgba(100,116,139,0.35)",
                borderRadius: 16,
                padding: "14px 16px",
                minWidth: 276,
                maxWidth: 316,
                boxShadow: "0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)",
                fontFamily: "inherit",
              }}
            >
              {/* ── Header: Ticket ID + close button ── */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                    <Hash size={11} color="#94a3b8" />
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: "#ef4444", fontWeight: 700, letterSpacing: "0.06em" }}>
                      {selectedComplaint.tiket_id || `LAPOR-${selectedComplaint.id.substring(0, 8).toUpperCase()}`}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Clock size={10} color="#64748b" />
                    <span style={{ fontSize: 9, color: "#64748b" }}>{formatDate(selectedComplaint.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={handlePopupClose}
                  style={{
                    background: "rgba(100,116,139,0.2)",
                    border: "none",
                    borderRadius: 6,
                    padding: "3px 6px",
                    cursor: "pointer",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <X size={12} />
                </button>
              </div>

              <div style={{ height: 1, background: "rgba(100,116,139,0.18)", marginBottom: 10 }} />

              {/* ── Pelapor ── */}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <User size={13} color="#94a3b8" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 1 }}>Pelapor</div>
                  <div style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 600 }}>
                    {selectedComplaint.is_anonim ? "Anonim (Dirahasiakan)" : (selectedComplaint.nama_pelapor || "-")}
                  </div>
                </div>
              </div>

              {/* ── Kategori ── */}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <Tag size={13} color="#94a3b8" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Kategori Pengaduan</div>
                  {(() => {
                    const col = getCategoryColor(selectedComplaint.kategori_pengaduan);
                    return (
                      <span style={{ display: "inline-flex", padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: col.bg, color: col.text, border: `1px solid ${col.ring}55` }}>
                        {selectedComplaint.kategori_pengaduan || "Lainnya"}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* ── Lokasi ── */}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <MapPin size={13} color="#94a3b8" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 1 }}>Lokasi Kejadian</div>
                  <div style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 500 }}>
                    Kec. {selectedComplaint.lokasi_kejadian || "-"}
                    {selectedComplaint.desa ? `, Desa ${selectedComplaint.desa}` : ""}
                  </div>
                </div>
              </div>

              {/* ── Status badge ── */}
              <div style={{ marginBottom: 10 }}>
                {(() => {
                  const s = getStatusBadge(selectedComplaint.status);
                  return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                      {s.label}
                    </span>
                  );
                })()}
              </div>

              {/* ── GPS coords ── */}
              <div style={{ paddingTop: 8, borderTop: "1px solid rgba(100,116,139,0.15)", display: "flex", gap: 14 }}>
                <span style={{ fontSize: 9, fontFamily: "monospace", color: "#22d3ee" }}>
                  Lat: {Number(selectedComplaint.latitude).toFixed(5)}
                </span>
                <span style={{ fontSize: 9, fontFamily: "monospace", color: "#22d3ee" }}>
                  Lng: {Number(selectedComplaint.longitude).toFixed(5)}
                </span>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Honest fallback: complaints exist but none have GPS coords */}
      {mappableComplaints.length === 0 && complaints.length > 0 && (
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(15,23,42,0.78)", backdropFilter: "blur(5px)",
            borderRadius: "inherit", gap: 10, pointerEvents: "none",
          }}
        >
          <AlertTriangle size={32} color="#f59e0b" />
          <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Data GPS Tidak Tersedia</p>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, textAlign: "center", maxWidth: 260 }}>
            {complaints.length} aduan ditemukan, namun belum ada koordinat GPS valid untuk ditampilkan di peta.
          </p>
        </div>
      )}

      {/* Honest fallback: no complaints at all */}
      {complaints.length === 0 && (
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
            borderRadius: "inherit", gap: 10, pointerEvents: "none",
          }}
        >
          <MapPin size={32} color="#64748b" />
          <p style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", margin: 0 }}>Belum Ada Data Aduan</p>
          <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
            Peta akan menampilkan pin otomatis saat aduan masuk dari Supabase.
          </p>
        </div>
      )}

      {/* Attribution */}
      <div
        style={{
          position: "absolute", bottom: 6, left: 8,
          fontSize: 9, color: "#475569", pointerEvents: "none", fontFamily: "monospace",
        }}
      >
        © Google Maps · DPMPTSP Luwu Spatial Intelligence v2
      </div>
    </div>
  );
}
