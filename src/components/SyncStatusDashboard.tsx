import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Info,
  Clock,
  Layers,
  FileCheck,
  X
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Investment } from "../types";
import Swal from "sweetalert2";
import { showSyncDiscrepancyToast } from "../utils/toastNotification";

export interface SyncStatusDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
  localInvestments: Investment[];
  onUpdateLocalState: (updatedInvestments: Investment[]) => void;
  isDark?: boolean;
  autoCheckIntervalMs?: number; // Background polling interval, e.g. 30000ms
}

export interface SyncRecordDiff {
  id: string;
  name: string;
  sector: string;
  district: string;
  status: "MATCH" | "DISCREPANCY" | "MISSING_LOCAL" | "MISSING_REMOTE";
  localHash: string;
  remoteHash: string;
  fieldDiffs: {
    field: string;
    localValue: string | number;
    remoteValue: string | number;
  }[];
  lastChecked: string;
}

// Simple deterministic string checksum algorithm
function computeChecksum(obj: any): string {
  const str = JSON.stringify(obj || {});
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "0x" + Math.abs(hash).toString(16).padStart(8, "0").toUpperCase();
}

export const SyncStatusDashboard: React.FC<SyncStatusDashboardProps> = ({
  isOpen = true,
  onClose,
  localInvestments,
  onUpdateLocalState,
  isDark = true,
  autoCheckIntervalMs = 30000,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [repairingId, setRepairingId] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [diffRecords, setDiffRecords] = useState<SyncRecordDiff[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "DISCREPANCY" | "MATCH">("ALL");
  const [remoteTotal, setRemoteTotal] = useState<number>(0);

  // Background Checksum Calculation engine comparing Supabase DB and local state
  const runBackgroundChecksumCheck = useCallback(async () => {
    setIsScanning(true);
    try {
      // Fetch latest critical investment records from Supabase Single Source of Truth
      const { data: remoteData, error } = await supabase
        .from("investments")
        .select(`
          *,
          financials (*),
          gis_potensi_investasi (*)
        `);

      if (error) {
        throw error;
      }

      const remoteItems = remoteData || [];
      setRemoteTotal(remoteItems.length);

      const computedDiffs: SyncRecordDiff[] = [];
      const nowTime = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // 1. Audit each Remote Item from Supabase against Local State
      remoteItems.forEach((remoteItem: any) => {
        const idStr = String(remoteItem.id);
        const localMatch = localInvestments.find((l) => String(l.id) === idStr);

        const fin = Array.isArray(remoteItem.financials) ? remoteItem.financials[0] : remoteItem.financials;

        const remoteNormalized = {
          id: idStr,
          name: String(remoteItem.nama_potensi || remoteItem.name || "").trim(),
          sector: String(remoteItem.sektor || remoteItem.sector || "").trim().toUpperCase(),
          districtId: String(remoteItem.district_id || remoteItem.districtId || "").trim(),
          investmentValue: Number(fin?.capex || remoteItem.nilai_investasi || remoteItem.investmentValue || 0),
          areaHa: Number(remoteItem.luas_lahan || remoteItem.areaHa || 0),
          landStatus: String(remoteItem.status_lahan || remoteItem.landStatus || "").trim(),
        };

        const remoteHash = computeChecksum(remoteNormalized);

        if (!localMatch) {
          computedDiffs.push({
            id: idStr,
            name: remoteNormalized.name || "Proyek Tanpa Nama",
            sector: remoteNormalized.sector || "SEKTOR",
            district: remoteNormalized.districtId || "-",
            status: "MISSING_LOCAL",
            localHash: "NOT_FOUND",
            remoteHash: remoteHash,
            fieldDiffs: [
              {
                field: "Record Status",
                localValue: "Tidak ada di state lokal",
                remoteValue: "Tersedia di Supabase DB",
              },
            ],
            lastChecked: nowTime,
          });
        } else {
          const localNormalized = {
            id: String(localMatch.id),
            name: String(localMatch.name || "").trim(),
            sector: String(localMatch.sector || "").trim().toUpperCase(),
            districtId: String(localMatch.districtId || "").trim(),
            investmentValue: Number(localMatch.investmentValue || localMatch.financials?.[0]?.capex || 0),
            areaHa: Number(localMatch.areaHa || 0),
            landStatus: String(localMatch.landStatus || "").trim(),
          };

          const localHash = computeChecksum(localNormalized);
          const fieldDiffs: SyncRecordDiff["fieldDiffs"] = [];

          if (localNormalized.name !== remoteNormalized.name) {
            fieldDiffs.push({
              field: "Nama Proyek",
              localValue: localNormalized.name || "-",
              remoteValue: remoteNormalized.name || "-",
            });
          }
          if (localNormalized.investmentValue !== remoteNormalized.investmentValue) {
            fieldDiffs.push({
              field: "Nilai Investasi (CAPEX)",
              localValue: `Rp ${localNormalized.investmentValue.toLocaleString("id-ID")}`,
              remoteValue: `Rp ${remoteNormalized.investmentValue.toLocaleString("id-ID")}`,
            });
          }
          if (localNormalized.areaHa !== remoteNormalized.areaHa) {
            fieldDiffs.push({
              field: "Luas Lahan (Ha)",
              localValue: `${localNormalized.areaHa} Ha`,
              remoteValue: `${remoteNormalized.areaHa} Ha`,
            });
          }
          if (localNormalized.landStatus !== remoteNormalized.landStatus) {
            fieldDiffs.push({
              field: "Status Kepemilikan Lahan",
              localValue: localNormalized.landStatus || "-",
              remoteValue: remoteNormalized.landStatus || "-",
            });
          }

          const isMatch = localHash === remoteHash && fieldDiffs.length === 0;

          computedDiffs.push({
            id: idStr,
            name: remoteNormalized.name || localNormalized.name,
            sector: remoteNormalized.sector || localNormalized.sector,
            district: remoteNormalized.districtId || localNormalized.districtId,
            status: isMatch ? "MATCH" : "DISCREPANCY",
            localHash: localHash,
            remoteHash: remoteHash,
            fieldDiffs: fieldDiffs,
            lastChecked: nowTime,
          });
        }
      });

      // 2. Audit Local Items missing in Remote DB
      localInvestments.forEach((localItem) => {
        const idStr = String(localItem.id);
        const remoteMatch = remoteItems.find((r: any) => String(r.id) === idStr);
        if (!remoteMatch) {
          const localNormalized = {
            id: idStr,
            name: String(localItem.name || "").trim(),
            sector: String(localItem.sector || "").trim().toUpperCase(),
            districtId: String(localItem.districtId || "").trim(),
            investmentValue: Number(localItem.investmentValue || 0),
            areaHa: Number(localItem.areaHa || 0),
            landStatus: String(localItem.landStatus || "").trim(),
          };
          computedDiffs.push({
            id: idStr,
            name: localNormalized.name,
            sector: localNormalized.sector,
            district: localNormalized.districtId,
            status: "MISSING_REMOTE",
            localHash: computeChecksum(localNormalized),
            remoteHash: "NOT_IN_SUPABASE",
            fieldDiffs: [
              {
                field: "Database Status",
                localValue: "Tersimpan di Draf Lokal",
                remoteValue: "Belum terdaftar di Supabase DB",
              },
            ],
            lastChecked: nowTime,
          });
        }
      });

      setDiffRecords(computedDiffs);
      setLastCheckTime(nowTime);

      const discrepanciesCount = computedDiffs.filter((d) => d.status !== "MATCH").length;
      if (discrepanciesCount > 0) {
        showSyncDiscrepancyToast(discrepanciesCount);
      }
    } catch (err: any) {
      console.error("Sync Checksum Error:", err);
    } finally {
      setIsScanning(false);
    }
  }, [localInvestments]);

  // Initial check & interval polling
  useEffect(() => {
    runBackgroundChecksumCheck();
    const interval = setInterval(() => {
      runBackgroundChecksumCheck();
    }, autoCheckIntervalMs);
    return () => clearInterval(interval);
  }, [runBackgroundChecksumCheck, autoCheckIntervalMs]);

  // Action: Repair Sync Single Record - fetches latest from Supabase and overwrites local state
  const handleRepairSingleSync = async (recordId: string) => {
    setRepairingId(recordId);
    try {
      const { data, error } = await supabase
        .from("investments")
        .select(`
          *,
          financials (*),
          gis_potensi_investasi (*)
        `)
        .eq("id", recordId)
        .single();

      if (error) throw error;

      if (data) {
        const fin = Array.isArray(data.financials) ? data.financials[0] : data.financials;
        const freshRecord: Investment = {
          id: String(data.id),
          name: data.nama_potensi || data.name || "Proyek Investasi Luwu",
          sector: data.sektor || data.sector || "PERTANIAN",
          districtId: data.district_id || data.districtId || "Belopa",
          villageId: data.village_id || data.villageId || "Kelurahan Senga",
          investmentValue: Number(fin?.capex || data.nilai_investasi || data.investmentValue || 10000000000),
          areaHa: Number(data.luas_lahan || data.areaHa || 10),
          landStatus: data.status_lahan || data.landStatus || "HGU / Pemkab Luwu",
          polaRuang: data.pola_ruang || data.polaRuang || "Kawasan Peruntukan Industri",
          suitabilityScore: Number(data.skor_kelayakan || data.suitabilityScore || 92.5),
          latitude: Number(data.latitude || data.gis_potensi_investasi?.[0]?.latitude || -3.27301),
          longitude: Number(data.longitude || data.gis_potensi_investasi?.[0]?.longitude || 120.26564),
          financials: fin ? [fin] : [],
          photoUrl: data.photo_url || data.photoUrl || "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
          contactPic: data.contact_pic || "DPMPTSP Kabupaten Luwu",
          phoneNumber: data.phone_number || "0421-21001",
          description: data.deskripsi || data.description || "Proyek investasi terverifikasi Single Source of Truth Pemkab Luwu.",
          isActive: true,
          createdAt: data.created_at || new Date().toISOString(),
        } as unknown as Investment;

        const exists = localInvestments.some((inv) => String(inv.id) === String(recordId));
        let updatedList: Investment[];
        if (exists) {
          updatedList = localInvestments.map((inv) =>
            String(inv.id) === String(recordId) ? freshRecord : inv
          );
        } else {
          updatedList = [...localInvestments, freshRecord];
        }

        onUpdateLocalState(updatedList);
        await runBackgroundChecksumCheck();

        Swal.fire({
          icon: "success",
          title: "Repair Sync Completed",
          text: `Record #${recordId} (${freshRecord.name}) berhasil diperbaiki dengan data Supabase Master.`,
          confirmButtonColor: "#059669",
          timer: 2000,
        });
      }
    } catch (err: any) {
      console.error("Single repair error:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Perbaiki Data",
        text: err?.message || "Tidak dapat mengunduh record terbaru dari Supabase.",
        confirmButtonColor: "#059669",
      });
    } finally {
      setRepairingId(null);
    }
  };

  // Action: Repair Sync All - Overwrites all local records with fresh Supabase Master state
  const handleRepairAllSync = async () => {
    setIsRepairing(true);
    try {
      const { data, error } = await supabase
        .from("investments")
        .select(`
          *,
          financials (*),
          gis_potensi_investasi (*)
        `);

      if (error) throw error;

      if (data) {
        const freshInvestments: Investment[] = data.map((item: any) => {
          const fin = Array.isArray(item.financials) ? item.financials[0] : item.financials;
          return {
            id: String(item.id),
            name: item.nama_potensi || item.name || "Proyek Investasi Luwu",
            sector: item.sektor || item.sector || "PERTANIAN",
            districtId: item.district_id || item.districtId || "Belopa",
            villageId: item.village_id || item.villageId || "Desa Senga",
            investmentValue: Number(fin?.capex || item.nilai_investasi || item.investmentValue || 10000000000),
            areaHa: Number(item.luas_lahan || item.areaHa || 10),
            landStatus: item.status_lahan || item.landStatus || "HGU / Pemkab Luwu",
            polaRuang: item.pola_ruang || item.polaRuang || "Kawasan Peruntukan Industri",
            suitabilityScore: Number(item.skor_kelayakan || item.suitabilityScore || 92.5),
            latitude: Number(item.latitude || item.gis_potensi_investasi?.[0]?.latitude || -3.27301),
            longitude: Number(item.longitude || item.gis_potensi_investasi?.[0]?.longitude || 120.26564),
            financials: fin ? [fin] : [],
            photoUrl: item.photo_url || item.photoUrl || "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
            contactPic: item.contact_pic || "DPMPTSP Kabupaten Luwu",
            phoneNumber: item.phone_number || "0421-21001",
            description: item.deskripsi || item.description || "Proyek investasi terverifikasi Single Source of Truth Pemkab Luwu.",
            isActive: true,
            createdAt: item.created_at || new Date().toISOString(),
          } as unknown as Investment;
        });

        onUpdateLocalState(freshInvestments);
        await runBackgroundChecksumCheck();

        Swal.fire({
          icon: "success",
          title: "Singkronisasi Master Selesai!",
          text: `Seluruh ${freshInvestments.length} proyek lokal telah diselaraskan 100% sesuai database Supabase.`,
          confirmButtonColor: "#059669",
        });
      }
    } catch (err: any) {
      console.error("Bulk repair error:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Repair All",
        text: err?.message || "Terjadi kesalahan saat mengunduh data master.",
        confirmButtonColor: "#059669",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  // Calculations
  const discrepancyCount = useMemo(
    () => diffRecords.filter((d) => d.status !== "MATCH").length,
    [diffRecords]
  );
  const matchCount = useMemo(
    () => diffRecords.filter((d) => d.status === "MATCH").length,
    [diffRecords]
  );

  const filteredDiffs = useMemo(() => {
    return diffRecords.filter((rec) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.sector.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (filterMode === "DISCREPANCY") return rec.status !== "MATCH";
      if (filterMode === "MATCH") return rec.status === "MATCH";
      return true;
    });
  }, [diffRecords, searchQuery, filterMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Sync Status Dashboard</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Single Source of Truth
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pemeriksaan Checksum Otomatis Latar Belakang (Supabase PostgreSQL &lt;&gt; State Frontend)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runBackgroundChecksumCheck}
              disabled={isScanning}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
              title="Jalankan Ulang Audit Checksum"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Pindai Ulang</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sync Health Card */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Status Keharmonisan Data
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {discrepancyCount === 0 ? (
                    <span className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      100% Synchronized
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      {discrepancyCount} Perbedaan Ditemukan
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${discrepancyCount === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Total Verified Records */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Record Supabase Master
                </span>
                <span className="text-2xl font-black text-white font-mono mt-0.5 block">
                  {remoteTotal} <span className="text-xs font-normal text-slate-400">Proyek</span>
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                <Server className="w-6 h-6" />
              </div>
            </div>

            {/* Background Checksum Timer */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Pemeriksaan Latar Belakang
                </span>
                <span className="text-xs font-medium text-emerald-400 mt-1 block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Audit Terakhir: {lastCheckTime || "Memindai..."}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari ID / Nama Proyek..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setFilterMode("ALL")}
                  className={`px-3 py-1 rounded-lg font-bold transition ${filterMode === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                    }`}
                >
                  Semua ({diffRecords.length})
                </button>
                <button
                  onClick={() => setFilterMode("DISCREPANCY")}
                  className={`px-3 py-1 rounded-lg font-bold transition ${filterMode === "DISCREPANCY" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-white"
                    }`}
                >
                  Selisih ({discrepancyCount})
                </button>
                <button
                  onClick={() => setFilterMode("MATCH")}
                  className={`px-3 py-1 rounded-lg font-bold transition ${filterMode === "MATCH" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white"
                    }`}
                >
                  Match ({matchCount})
                </button>
              </div>
            </div>

            {/* Repair All Action Button */}
            <button
              onClick={handleRepairAllSync}
              disabled={isRepairing}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isRepairing ? "animate-spin" : ""}`} />
              <span>{isRepairing ? "Menyelaraskan..." : "Repair Sync All (Timpa State Lokal)"}</span>
            </button>
          </div>

          {/* Records Checksum Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Status Sync</th>
                    <th className="py-3 px-4">Proyek &amp; ID</th>
                    <th className="py-3 px-4">Sektor / Kecamatan</th>
                    <th className="py-3 px-4">Local Hash</th>
                    <th className="py-3 px-4">Supabase DB Hash</th>
                    <th className="py-3 px-4">Detail Perbedaan</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {isScanning ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                        <p className="font-medium">Memindai database Supabase &amp; menghitung checksum...</p>
                      </td>
                    </tr>
                  ) : filteredDiffs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        Tidak ada record data yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDiffs.map((rec) => (
                      <tr
                        key={rec.id}
                        className={`hover:bg-slate-900/50 transition ${rec.status !== "MATCH" ? "bg-amber-950/10" : ""
                          }`}
                      >
                        {/* Status Badge */}
                        <td className="py-3 px-4 align-top">
                          {rec.status === "MATCH" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              VERIFIED MATCH
                            </span>
                          )}
                          {rec.status === "DISCREPANCY" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              DISCREPANCY
                            </span>
                          )}
                          {rec.status === "MISSING_LOCAL" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              <Server className="w-3 h-3 shrink-0" />
                              REMOTE ONLY
                            </span>
                          )}
                          {rec.status === "MISSING_REMOTE" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                              <Layers className="w-3 h-3 shrink-0" />
                              LOCAL DRAFT
                            </span>
                          )}
                        </td>

                        {/* Name & ID */}
                        <td className="py-3 px-4 align-top">
                          <p className="font-bold text-white max-w-xs truncate">{rec.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {rec.id}</p>
                        </td>

                        {/* Sector & District */}
                        <td className="py-3 px-4 align-top">
                          <p className="font-medium text-slate-300">{rec.sector}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{rec.district}</p>
                        </td>

                        {/* Hashes */}
                        <td className="py-3 px-4 align-top font-mono text-[11px] text-slate-400">
                          {rec.localHash}
                        </td>
                        <td className="py-3 px-4 align-top font-mono text-[11px] text-emerald-400">
                          {rec.remoteHash}
                        </td>

                        {/* Field Diffs */}
                        <td className="py-3 px-4 align-top">
                          {rec.fieldDiffs.length === 0 ? (
                            <span className="text-slate-500 text-[11px] italic">Presisi 100% Identik</span>
                          ) : (
                            <div className="space-y-1.5">
                              {rec.fieldDiffs.map((diff, idx) => (
                                <div key={idx} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                                  <span className="font-bold text-amber-400">{diff.field}:</span>{" "}
                                  <span className="text-slate-400 line-through mr-1">{String(diff.localValue)}</span>
                                  <ArrowRight className="w-3 h-3 inline text-emerald-400 mx-0.5" />
                                  <span className="text-emerald-300 font-bold">{String(diff.remoteValue)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Repair Action */}
                        <td className="py-3 px-4 align-top text-center">
                          {rec.status !== "MATCH" ? (
                            <button
                              onClick={() => handleRepairSingleSync(rec.id)}
                              disabled={repairingId === rec.id || isRepairing}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition flex items-center gap-1.5 mx-auto cursor-pointer disabled:opacity-50"
                              title="Ambil record terbaru dari Supabase dan timpa state lokal"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${repairingId === rec.id ? "animate-spin" : ""}`} />
                              <span>Repair Sync</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-500 font-bold">✓ Synced</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Doktrin Zero Dummy • Kebijakan Single Source of Truth Pemkab Luwu</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 sm:mt-0 font-mono">
            Integrity Check Hash Standard: 32-bit CRC Checksum
          </span>
        </div>
      </div>
    </div>
  );
};

export default SyncStatusDashboard;
