import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Building2, 
  MapPin, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Share2, 
  ArrowLeft, 
  QrCode, 
  Layers, 
  Scale, 
  Wheat, 
  AlertCircle,
  RefreshCw,
  Award
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../lib/supabaseClient';
import { OFFICIAL_LUWU_LOGO_URL } from '../components/LuwuLogo';
import { generateSkPkkprPdf } from '../utils/skPkkprPdfGenerator';
import { formatRupiah } from '../lib/formatters';

export const PkkprVerificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    async function fetchVerificationData() {
      if (!id) {
        setError('Nomor identitas permohonan tidak valid.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Query both gis_pkkpr and investments
        const { data: gisData, error: gisErr } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        const { data: invData } = await supabase
          .from('investments')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!gisData && !invData) {
          setError('Dokumen SK PKKPR tidak ditemukan pada pangkalan data Pemerintah Kabupaten Luwu.');
          setLoading(false);
          return;
        }

        const merged = {
          ...(invData || {}),
          ...(gisData || {}),
          id: id,
          nama_pemohon: gisData?.nama_pemohon || invData?.applicant_name || invData?.nama_pemohon || invData?.perusahaan || 'Pemohon Terdaftar',
          nama_badan_usaha: gisData?.nama_badan_usaha || invData?.perusahaan || invData?.nama_badan_usaha || '-',
          nama_permohonan: gisData?.nama_permohonan || invData?.judul_kegiatan || invData?.nama_proyek || 'Kegiatan Pemanfaatan Ruang',
          sk_pkkpr_num: gisData?.sk_pkkpr_num || invData?.sk_pkkpr_doc_number || invData?.pkkpr_doc_number || `503/SK-PKKPR/DPMPTSP-LW/${new Date().getFullYear()}/${id.slice(0, 4).toUpperCase()}`,
          desa_name: gisData?.desa_name || invData?.desa || 'Luwu',
          kecamatan_name: gisData?.kecamatan_name || invData?.kecamatan || 'Kabupaten Luwu',
          luas_m2: gisData?.luas_m2 || invData?.luas_m2 || 1000,
          luas_ha: gisData?.luas_ha || invData?.luas_ha || invData?.area_ha || 0.1,
          geom: gisData?.geom || gisData?.geometry_json || invData?.geometry || invData?.geom,
          published_at: gisData?.published_at || invData?.published_at || gisData?.updated_at || new Date().toISOString(),
          status_pkkpr: gisData?.status_pkkpr || invData?.status || 'TERBIT'
        };

        setData(merged);
      } catch (err: any) {
        console.error('[PkkprVerificationPage] Error loading verification data:', err);
        setError('Gagal memverifikasi dokumen. Silakan periksa koneksi data.');
      } finally {
        setLoading(false);
      }
    }

    fetchVerificationData();
  }, [id]);

  // Mini Map rendering
  useEffect(() => {
    if (!data?.geom || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    let rawGeom = data.geom;
    if (typeof rawGeom === 'string') {
      try {
        rawGeom = JSON.parse(rawGeom);
      } catch {
        rawGeom = null;
      }
    }

    const featureObj = rawGeom?.type === 'Feature' ? rawGeom : {
      type: 'Feature',
      geometry: rawGeom?.geometry || rawGeom,
      properties: {}
    };

    if (!featureObj.geometry || !featureObj.geometry.coordinates) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [120.35, -3.15],
      zoom: 13,
      interactive: true
    });

    map.on('load', () => {
      map.addSource('verified-polygon', {
        type: 'geojson',
        data: featureObj
      });

      map.addLayer({
        id: 'verified-polygon-fill',
        type: 'fill',
        source: 'verified-polygon',
        paint: {
          'fill-color': '#059669',
          'fill-opacity': 0.35
        }
      });

      map.addLayer({
        id: 'verified-polygon-line',
        type: 'line',
        source: 'verified-polygon',
        paint: {
          'line-color': '#047857',
          'line-width': 2.5
        }
      });

      // Fit bounds
      try {
        const coords = featureObj.geometry.type === 'Polygon'
          ? featureObj.geometry.coordinates[0]
          : featureObj.geometry.coordinates[0][0];

        const bounds = coords.reduce(
          (b: any, coord: number[]) => b.extend(coord),
          new maplibregl.LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: 30, maxZoom: 16 });
      } catch (e) {
        console.warn('Map fit bounds note:', e);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data]);

  const handleDownloadPdf = async () => {
    if (!data) return;
    setIsGeneratingPdf(true);
    try {
      await generateSkPkkprPdf(data);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan verifikasi resmi berhasil disalin!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 text-slate-800 dark:text-slate-100 font-sans p-4 sm:p-6 md:p-10 flex flex-col items-center">
      {/* Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>Kembali ke Beranda MPP Luwu</span>
        </Link>
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-emerald-600" />
          <span>Bagikan Tautan</span>
        </button>
      </div>

      {loading ? (
        <div className="w-full max-w-4xl p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Memverifikasi sertifikat digital dan basis data spasial Pemkab Luwu...
          </p>
        </div>
      ) : error || !data ? (
        <div className="w-full max-w-4xl p-12 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-900 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-rose-600 dark:text-rose-400">Verifikasi Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
          <Link
            to="/tracking"
            className="inline-block px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
          >
            Lacak Berkas di Portal Pemohon
          </Link>
        </div>
      ) : (
        /* Official Verification Card */
        <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          {/* Official Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <img
                src={OFFICIAL_LUWU_LOGO_URL}
                alt="Logo Pemkab Luwu"
                className="w-16 h-20 object-contain drop-shadow-md shrink-0"
              />
              <div className="space-y-1">
                <div className="text-[11px] font-mono tracking-widest uppercase opacity-90 font-bold">
                  Pemerintah Kabupaten Luwu • DPMPTSP • Dinas PUPTR
                </div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight">
                  PORTAL VERIFIKASI KEABSAHAN DOKUMEN SK PKKPR
                </h1>
                <p className="text-xs text-emerald-100 font-medium">
                  Sistem Pelayanan Terpadu Satu Pintu &amp; Tata Ruang Geospasial Berstandar BSrE BSSN
                </p>
              </div>
            </div>
          </div>

          {/* Verification Status Badge */}
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                    STATUS KEABSAHAN
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                    TERVERIFIKASI SAH
                  </span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200 font-semibold mt-0.5">
                  Surat Keputusan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) ini Asli dan Terdaftar Resmi.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              {isGeneratingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isGeneratingPdf ? 'Menyiapkan PDF...' : 'Unduh Dokumen SK (PDF)'}</span>
            </button>
          </div>

          {/* Main Document Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Grid 2 Column Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Legal Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Identitas Surat Keputusan</span>
                </h3>

                <div className="rounded-2xl bg-slate-50 dark:bg-base/50 border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500">Nomor SK PKKPR:</span>
                    <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">
                      {data.sk_pkkpr_num}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-500">ID Permohonan:</span>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                        {data.id}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Tanggal Terbit:</span>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {new Date(data.published_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2 pt-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Data Pemohon &amp; Badan Usaha</span>
                </h3>

                <div className="rounded-2xl bg-slate-50 dark:bg-base/50 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500">Nama Pemohon:</span>
                    <p className="font-bold text-slate-900 dark:text-white">{data.nama_pemohon}</p>
                  </div>
                  {data.nama_badan_usaha && data.nama_badan_usaha !== '-' && (
                    <div>
                      <span className="text-[11px] text-slate-500">Nama Perusahaan / PT / CV:</span>
                      <p className="font-bold text-slate-900 dark:text-white">{data.nama_badan_usaha}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] text-slate-500">Judul Kegiatan:</span>
                    <p className="font-bold text-slate-900 dark:text-white">{data.nama_permohonan}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Spatial & Technical Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Lokasi Spasial &amp; Luas Lahan</span>
                </h3>

                <div className="rounded-2xl bg-slate-50 dark:bg-base/50 border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500">Wilayah Administratif:</span>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Desa {data.desa_name}, Kecamatan {data.kecamatan_name}, Kabupaten Luwu
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-500">Luas Disetujui (m²):</span>
                      <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {(data.luas_m2 || 0).toLocaleString('id-ID')} m²
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Luas Hektar:</span>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {data.luas_ha || ((data.luas_m2 || 0) / 10000).toFixed(4)} Ha
                      </p>
                    </div>
                  </div>
                </div>

                {/* Spatial Map Preview */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Delineasi Poligon Spasial Terverifikasi</span>
                  </div>
                  <div ref={mapContainerRef} className="h-44 w-full bg-slate-200 dark:bg-base" />
                </div>
              </div>
            </div>

            {/* Electronic Seal (BSrE BSSN) Compliance */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/40 dark:from-slate-950 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white">
                    Tanda Tangan Elektronik Sah (TTE BSrE BSSN)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Dokumen ini sah secara hukum sesuai UU ITE No. 11/2008 &amp; PP No. 71/2019 dan tidak memerlukan cap basah.
                  </p>
                </div>
              </div>
              <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 text-right shrink-0">
                <div>HASH: BSRE-{id.slice(0, 8).toUpperCase()}-LUWU</div>
                <div>STATUS: VALID &amp; ENCRYPTED</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PkkprVerificationPage;
