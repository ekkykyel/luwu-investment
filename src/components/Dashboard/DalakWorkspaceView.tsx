import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Users,
  CheckCircle2,
  Plus,
  Printer,
  Download,
  Loader2,
  Building2,
  RefreshCw,
  Send,
  Scale,
  Activity,
  ArrowRight,
  X,
  FileCheck2,
  Workflow,
  LayoutDashboard,
  MessageSquare,
} from 'lucide-react';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';
import DalakMap from './DalakMap';
import { supabase } from '../../lib/supabaseClient';
import { Investment } from '../../types';
import { LUWU_LOGO_BASE64 } from '../../lib/logoBase64';
import { safeHtml2Canvas, pdfRenderQueue, waitForDomAndIdle } from '../../lib/html2canvasShim';
import { exportInvestmentProfileFromRecord, generateExecutivePortfolioPdf } from '../../services/PdfExportService';

export interface DalakWorkspaceViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  investments: Investment[];
  districts?: any[];
  onSelectInvestment?: (id: string) => void;
}

export interface MonitoredCompany {
  id: string;
  nama: string;
  nib: string;
  sektor: string;
  kecamatan: string;
  statusLkpm: 'Sudah Lapor Q2 2026' | 'Terlambat 14 Hari' | 'Tidak Lapor (2 Semester)' | 'Sudah Lapor Q1 2026' | 'Belum Terjadwal';
  tingkatKepatuhan: 'Aman' | 'Warning' | 'Sanksi';
  terakhirDiperiksa: string;
  realisasiModalTetap: number; // in Millions IDR
  realisasiModalKerja: number; // in Millions IDR
  serapanTkl: number; // jiwa
  serapanTka: number; // jiwa
  catatanInspeksi?: string;
  kontakPenanggungJawab?: string;
}

export interface MediationCase {
  id: string;
  tiketId: string;
  judul: string;
  pemohon: string;
  perusahaanTerkait: string;
  kategori: 'Sengketa Lahan' | 'Akses & Fasilitas' | 'Pencemaran Lingkungan' | 'Tenaga Kerja Lokal' | 'Perizinan / Regulasi';
  lokasi: string;
  status: 'Menunggu Jadwal' | 'Mediasi Terjadwal' | 'Proses Musyawarah' | 'Selesai Damai';
  tanggalDaftar: string;
  jadwalSidang?: string;
  tempatSidang?: string;
  kesepakatanDamai?: string;
  mediator?: string;
}

const parseMillionIdr = (rawVal: any): number => {
  if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
    return rawVal > 1_000_000 ? Math.round(rawVal / 1_000_000) : rawVal;
  }
  if (typeof rawVal === 'string') {
    const cleaned = rawVal.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (Number.isFinite(num)) {
      return num > 1_000_000 ? Math.round(num / 1_000_000) : Math.round(num);
    }
  }
  return 0;
};

export const DalakWorkspaceView: React.FC<DalakWorkspaceViewProps> = ({
  activeTab,
  setActiveTab,
  investments,
}) => {
  // ─── STATE MANAGEMENT (ZERO DUMMY & HONEST FALLBACK) ─────────────────────────
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState<boolean>(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  // Overrides stored per company ID from field inspections (persisted to Supabase site_settings)
  const [companyOverrides, setCompanyOverrides] = useState<Record<string, Partial<MonitoredCompany>>>({});
  const [mediations, setMediations] = useState<MediationCase[]>([]);

  // Derive monitored companies strictly from live Supabase `investments` prop + saved inspection overrides
  const companies = useMemo<MonitoredCompany[]>(() => {
    if (!Array.isArray(investments) || investments.length === 0) return [];
    return investments.map((inv: any, idx: number) => {
      const id = String(inv.id || `inv-${idx}`);
      const override = companyOverrides[id] || {};
      const rawModal = parseMillionIdr(inv.nilai_investasi ?? inv.investmentValue ?? inv.capex ?? 0);
      const rawWorkers = Number(inv.tenaga_kerja ?? inv.serapan_tenaga_kerja ?? inv.laborCount ?? 0) || 0;

      return {
        id,
        nama: inv.title || inv.nama_proyek || inv.company_name || 'Pelaku Usaha Terdaftar',
        nib: inv.nib || inv.kode_proyek || `REG-${id.slice(0, 8).toUpperCase()}`,
        sektor: inv.category || inv.sektor || 'Penanaman Modal Daerah',
        kecamatan: inv.kecamatan || inv.location?.split(',')[0] || 'Kabupaten Luwu',
        statusLkpm: override.statusLkpm || 'Belum Terjadwal',
        tingkatKepatuhan: override.tingkatKepatuhan || 'Aman',
        terakhirDiperiksa:
          override.terakhirDiperiksa ||
          (inv.updated_at
            ? new Date(inv.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Belum Diperiksa'),
        realisasiModalTetap: override.realisasiModalTetap ?? rawModal,
        realisasiModalKerja: override.realisasiModalKerja ?? 0,
        serapanTkl: override.serapanTkl ?? rawWorkers,
        serapanTka: override.serapanTka ?? 0,
        catatanInspeksi: override.catatanInspeksi || inv.description || '',
        kontakPenanggungJawab: override.kontakPenanggungJawab || inv.pengelola || inv.contact_person || 'Penanggung Jawab Usaha',
      };
    });
  }, [investments, companyOverrides]);

  // Modal States
  const [selectedCompany, setSelectedCompany] = useState<MonitoredCompany | null>(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState<boolean>(false);
  const [isReprimandModalOpen, setIsReprimandModalOpen] = useState<boolean>(false);
  const [isBapGeneratorOpen, setIsBapGeneratorOpen] = useState<boolean>(false);
  const [isNewMediationModalOpen, setIsNewMediationModalOpen] = useState<boolean>(false);
  const [isNewComplaintModalOpen, setIsNewComplaintModalOpen] = useState<boolean>(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState<boolean>(false);

  // PDF Export States (Android-First Direct A4 Download)
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null);
  const [isExportingPortfolioPdf, setIsExportingPortfolioPdf] = useState<boolean>(false);
  const [isExportingBapPdf, setIsExportingBapPdf] = useState<boolean>(false);
  const bapSheetRef = useRef<HTMLDivElement>(null);

  const handleExportCompanyProfilePdf = async (company: MonitoredCompany) => {
    if (exportingPdfId) return;
    setExportingPdfId(company.id);
    try {
      const matchedInv = (investments || []).find((inv: any) => String(inv.id) === String(company.id));
      const mergedRecord = matchedInv
        ? {
            ...matchedInv,
            name: matchedInv.name || company.nama,
            sector: matchedInv.sector || company.sektor,
            kecamatan: (matchedInv as any).kecamatan || company.kecamatan,
            komitmenTenagaLokal: company.serapanTkl || matchedInv.komitmenTenagaLokal,
            komitmenTenagaAsing: company.serapanTka || matchedInv.komitmenTenagaAsing,
            investmentValue:
              matchedInv.investmentValue ||
              (company.realisasiModalTetap > 0 ? company.realisasiModalTetap * 1_000_000 : 0),
          }
        : {
            id: company.id,
            name: company.nama,
            sector: company.sektor,
            kecamatan: company.kecamatan,
            investmentValue: company.realisasiModalTetap > 0 ? company.realisasiModalTetap * 1_000_000 : 0,
            komitmenTenagaLokal: company.serapanTkl,
            komitmenTenagaAsing: company.serapanTka,
            status: `Kepatuhan LKPM: ${company.tingkatKepatuhan} (${company.statusLkpm})`,
            description: company.catatanInspeksi || undefined,
          };

      await exportInvestmentProfileFromRecord(mergedRecord, {
        issuerBidang: 'Bidang Pengendalian Pelaksanaan & Pengawasan (DALAK)',
      });
    } catch (err) {
      console.error('[DalakWorkspaceView] Gagal ekspor PDF profil:', err);
      Swal.fire({
        title: 'Gagal Mengekspor PDF',
        text: 'Terjadi kendala saat menyusun laporan PDF profil proyek.',
        icon: 'error',
        confirmButtonColor: '#10b981',
      });
    } finally {
      setExportingPdfId(null);
    }
  };

  const handleExportDalakPortfolioPdf = async () => {
    if (isExportingPortfolioPdf) return;
    setIsExportingPortfolioPdf(true);
    try {
      await generateExecutivePortfolioPdf(investments || [], {
        issuerBidang: 'Bidang Pengendalian Pelaksanaan & Pengawasan (DALAK)',
        reportTitle: 'LAPORAN EKSEKUTIF PENGAWASAN & REALISASI PENANAMAN MODAL DAERAH',
      });
    } catch (err) {
      console.error('[DalakWorkspaceView] Gagal ekspor PDF portofolio Dalak:', err);
      Swal.fire({
        title: 'Gagal Mengekspor Laporan PDF',
        text: 'Terjadi kendala saat menyusun laporan eksekutif PDF.',
        icon: 'error',
        confirmButtonColor: '#10b981',
      });
    } finally {
      setIsExportingPortfolioPdf(false);
    }
  };

  const handleDownloadBapPdf = async () => {
    if (!bapSheetRef.current || !selectedCompany || isExportingBapPdf) return;
    setIsExportingBapPdf(true);

    const offscreenHost = document.createElement('div');
    offscreenHost.style.position = 'fixed';
    offscreenHost.style.top = '-9999px';
    offscreenHost.style.left = '-9999px';
    offscreenHost.style.width = '794px';
    offscreenHost.style.backgroundColor = '#ffffff';
    offscreenHost.style.color = '#0f172a';
    offscreenHost.style.padding = '36px 42px';
    offscreenHost.style.boxSizing = 'border-box';
    offscreenHost.style.zIndex = '-1000';
    offscreenHost.style.pointerEvents = 'none';

    try {
      const cloned = bapSheetRef.current.cloneNode(true) as HTMLElement;
      cloned.style.maxHeight = 'none';
      cloned.style.overflow = 'visible';
      cloned.style.padding = '0';
      cloned.style.width = '100%';
      offscreenHost.appendChild(cloned);
      document.body.appendChild(offscreenHost);

      await waitForDomAndIdle(offscreenHost, 3000);
      if ((document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }

      const canvas = await pdfRenderQueue.enqueue(() =>
        safeHtml2Canvas(offscreenHost, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1024,
        })
      );

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = 210;
      const pdfH = 297;
      const renderedH = (canvas.height * pdfW) / canvas.width;

      if (renderedH <= pdfH) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, renderedH, undefined, 'FAST');
      } else {
        let heightLeft = renderedH;
        let position = 0;
        pdf.addImage(imgData, 'JPEG', 0, position, pdfW, renderedH, undefined, 'FAST');
        heightLeft -= pdfH;
        while (heightLeft > 4) {
          position = heightLeft - renderedH;
          pdf.addPage('a4', 'portrait');
          pdf.addImage(imgData, 'JPEG', 0, position, pdfW, renderedH, undefined, 'FAST');
          heightLeft -= pdfH;
        }
      }

      const safeCompany = (selectedCompany.nama || 'Pelaku_Usaha').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      pdf.save(`BAP_Pengawasan_Dalak_${safeCompany}_Kab_Luwu.pdf`);
    } catch (err) {
      console.error('[DalakWorkspaceView] Gagal mengunduh BAP PDF:', err);
      Swal.fire({
        title: 'Gagal Mengunduh BAP PDF',
        text: 'Terjadi kendala saat membuat dokumen PDF Berita Acara Pemeriksaan.',
        icon: 'error',
        confirmButtonColor: '#10b981',
      });
    } finally {
      if (document.body.contains(offscreenHost)) {
        document.body.removeChild(offscreenHost);
      }
      setIsExportingBapPdf(false);
    }
  };

  // Form Fields for Inspection
  const [inspectionData, setInspectionData] = useState({
    statusLkpm: 'Sudah Lapor Q2 2026',
    tingkatKepatuhan: 'Aman' as 'Aman' | 'Warning' | 'Sanksi',
    realisasiModalTetap: 0,
    realisasiModalKerja: 0,
    serapanTkl: 0,
    serapanTka: 0,
    catatanInspeksi: '',
    tanggalPemeriksaan: new Date().toISOString().split('T')[0],
  });

  // Form Fields for New Mediation
  const [newMediation, setNewMediation] = useState({
    judul: '',
    pemohon: '',
    perusahaanTerkait: '',
    kategori: 'Sengketa Lahan' as MediationCase['kategori'],
    lokasi: '',
    tempatSidang: 'Ruang Mediasi DPMPTSP Kab. Luwu',
    jadwalSidang: '',
    mediator: 'Kabid Pengendalian Pelaksanaan & Pengawasan',
  });

  // Form Fields for New Complaint
  const [newComplaint, setNewComplaint] = useState({
    nama_pelapor: '',
    kontak_pelapor: '',
    kategori_pengaduan: 'Pencemaran Lingkungan',
    lokasi_kejadian: '',
    perusahaan_terkait: '',
    deskripsi_masalah: '',
    latitude: -3.05,
    longitude: 120.25,
  });

  // Form Fields for Follow Up
  const [followUpStatus, setFollowUpStatus] = useState('Sedang Ditinjau Dalak');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // ─── FETCH LIVE DATA FROM SUPABASE ───────────────────────────────────────────
  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const [{ data, error }, { data: followupRow }] = await Promise.all([
        supabase
          .from('pengaduan')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'dalak_complaint_followups')
          .maybeSingle(),
      ]);

      let followupMap: Record<string, any> = {};
      if (followupRow?.setting_value) {
        let parsed = followupRow.setting_value;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch {}
        }
        if (parsed && typeof parsed === 'object') {
          followupMap = parsed;
        }
      }

      if (!error && Array.isArray(data)) {
        const merged = data.map((row: any) => {
          const fb = followupMap[String(row.id)];
          if (!fb) return row;
          return {
            ...row,
            jadwal_site_visit: row.jadwal_site_visit ?? fb.jadwal_site_visit ?? null,
            laporan_dalak: row.laporan_dalak ?? fb.laporan_dalak ?? null,
          };
        });
        setComplaints(merged);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setComplaints([]);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const fetchDalakSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['dalak_company_inspections', 'dalak_mediation_cases']);

      if (Array.isArray(data)) {
        for (const row of data) {
          let val = row.setting_value;
          if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch {}
          }
          if (row.setting_key === 'dalak_company_inspections' && val && typeof val === 'object') {
            setCompanyOverrides(val);
          }
          if (row.setting_key === 'dalak_mediation_cases' && Array.isArray(val)) {
            setMediations(val);
          }
        }
      }
    } catch (err) {
      console.warn('Info: dalak settings empty or unavailable', err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchDalakSettings();
  }, []);

  // ─── AGGREGATE CALCULATIONS ──────────────────────────────────────────────────
  const laborStats = useMemo(() => {
    const totalTkl = companies.reduce((acc, c) => acc + (c.serapanTkl || 0), 0);
    const totalTka = companies.reduce((acc, c) => acc + (c.serapanTka || 0), 0);
    const totalWorker = totalTkl + totalTka;
    const tklPercent = totalWorker > 0 ? ((totalTkl / totalWorker) * 100).toFixed(1) : '0';
    const tkaPercent = totalWorker > 0 ? ((totalTka / totalWorker) * 100).toFixed(1) : '0';
    return { totalTkl, totalTka, totalWorker, tklPercent, tkaPercent };
  }, [companies]);

  const kpiStats = useMemo(() => {
    const pendingComplaints = complaints.filter(
      (c) => !c.status || c.status === 'Menunggu Verifikasi' || c.status === 'Belum Ditindaklanjuti'
    ).length;
    const scheduledInspections =
      complaints.filter((c) => Boolean(c.jadwal_site_visit)).length +
      companies.filter((c) => c.terakhirDiperiksa !== 'Belum Diperiksa').length;
    const solvedMediations = mediations.filter((m) => m.status === 'Selesai Damai').length;
    const nonCompliantCompanies = companies.filter(
      (c) => c.tingkatKepatuhan === 'Warning' || c.tingkatKepatuhan === 'Sanksi'
    ).length;
    return { pendingComplaints, scheduledInspections, solvedMediations, nonCompliantCompanies };
  }, [complaints, mediations, companies]);

  // ─── ACTION HANDLERS ────────────────────────────────────────────────────────
  const handleOpenBapModal = (company?: MonitoredCompany) => {
    const target = company || companies[0] || null;
    if (!target) {
      Swal.fire({
        icon: 'info',
        title: 'Belum Ada Pelaku Usaha',
        text: 'Belum ada data proyek atau pelaku usaha aktif di database untuk dicetak Berita Acara Pemeriksaan (BAP).',
        confirmButtonColor: '#059669',
      });
      return;
    }
    setSelectedCompany(target);
    setIsBapGeneratorOpen(true);
  };

  const handleOpenInspection = (company: MonitoredCompany) => {
    setSelectedCompany(company);
    setInspectionData({
      statusLkpm: company.statusLkpm === 'Belum Terjadwal' ? 'Sudah Lapor Q2 2026' : company.statusLkpm,
      tingkatKepatuhan: company.tingkatKepatuhan,
      realisasiModalTetap: company.realisasiModalTetap,
      realisasiModalKerja: company.realisasiModalKerja,
      serapanTkl: company.serapanTkl,
      serapanTka: company.serapanTka,
      catatanInspeksi: company.catatanInspeksi || '',
      tanggalPemeriksaan: new Date().toISOString().split('T')[0],
    });
    setIsInspectionModalOpen(true);
  };

  const handleSaveInspection = async () => {
    if (!selectedCompany) return;
    const formattedDate = new Date(inspectionData.tanggalPemeriksaan).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const nextOverrides: Record<string, Partial<MonitoredCompany>> = {
      ...companyOverrides,
      [selectedCompany.id]: {
        statusLkpm: inspectionData.statusLkpm as MonitoredCompany['statusLkpm'],
        tingkatKepatuhan: inspectionData.tingkatKepatuhan,
        realisasiModalTetap: Number(inspectionData.realisasiModalTetap) || 0,
        realisasiModalKerja: Number(inspectionData.realisasiModalKerja) || 0,
        serapanTkl: Number(inspectionData.serapanTkl) || 0,
        serapanTka: Number(inspectionData.serapanTka) || 0,
        catatanInspeksi: inspectionData.catatanInspeksi,
        terakhirDiperiksa: formattedDate,
      },
    };

    setCompanyOverrides(nextOverrides);
    setIsInspectionModalOpen(false);

    try {
      await supabase.from('site_settings').upsert(
        {
          setting_key: 'dalak_company_inspections',
          setting_value: nextOverrides,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'setting_key' }
      );
    } catch (e) {
      console.warn('Could not persist inspection override:', e);
    }

    Swal.fire({
      title: 'Hasil Pengawasan Disimpan',
      text: `Verifikasi faktual lapangan untuk ${selectedCompany.nama} berhasil diperbarui ke sistem kepatuhan.`,
      icon: 'success',
      confirmButtonColor: '#059669',
    });
  };

  const handleSendReprimand = (company: MonitoredCompany) => {
    setSelectedCompany(company);
    setIsReprimandModalOpen(true);
  };

  const handleConfirmSendReprimand = () => {
    if (!selectedCompany) return;
    setIsReprimandModalOpen(false);
    Swal.fire({
      title: 'Surat Teguran Resmi Terkirim',
      html: `Surat Peringatan Administratif resmi telah diterbitkan untuk <b>${selectedCompany.nama}</b>.<br><small class="text-slate-500">Nomor Registrasi: SP-DALAK/DPMPTSP-LW/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}</small>`,
      icon: 'success',
      confirmButtonColor: '#059669',
    });
  };

  const handleCreateMediation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediation.judul || !newMediation.pemohon || !newMediation.perusahaanTerkait) {
      Swal.fire('Form Belum Lengkap', 'Mohon isi seluruh data pokok permohonan mediasi.', 'warning');
      return;
    }

    const newCase: MediationCase = {
      id: `med-${Date.now()}`,
      tiketId: `MED-${new Date().getFullYear()}-${String(mediations.length + 1).padStart(3, '0')}`,
      judul: newMediation.judul,
      pemohon: newMediation.pemohon,
      perusahaanTerkait: newMediation.perusahaanTerkait,
      kategori: newMediation.kategori,
      lokasi: newMediation.lokasi || 'Kabupaten Luwu',
      status: newMediation.jadwalSidang ? 'Mediasi Terjadwal' : 'Menunggu Jadwal',
      tanggalDaftar: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      jadwalSidang: newMediation.jadwalSidang,
      tempatSidang: newMediation.tempatSidang,
      mediator: newMediation.mediator,
    };

    const nextList = [newCase, ...mediations];
    setMediations(nextList);
    setIsNewMediationModalOpen(false);
    setNewMediation({
      judul: '',
      pemohon: '',
      perusahaanTerkait: '',
      kategori: 'Sengketa Lahan',
      lokasi: '',
      tempatSidang: 'Ruang Mediasi DPMPTSP Kab. Luwu',
      jadwalSidang: '',
      mediator: 'Kabid Pengendalian Pelaksanaan & Pengawasan',
    });

    try {
      await supabase.from('site_settings').upsert(
        {
          setting_key: 'dalak_mediation_cases',
          setting_value: nextList,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'setting_key' }
      );
    } catch (err) {
      console.warn('Could not persist mediation list:', err);
    }

    Swal.fire({
      title: 'Kasus Mediasi Didaftarkan',
      text: 'Kasus sengketa investasi berhasil diagendakan dalam sistem fasilitasi dan debottlenecking.',
      icon: 'success',
      confirmButtonColor: '#059669',
    });
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.nama_pelapor || !newComplaint.deskripsi_masalah) {
      Swal.fire('Data Belum Lengkap', 'Nama pelapor dan deskripsi masalah wajib diisi.', 'warning');
      return;
    }

    try {
      const tiketId = `ADU-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase
        .from('pengaduan')
        .insert([
          {
            tiket_id: tiketId,
            nama_pelapor: newComplaint.nama_pelapor,
            kontak_pelapor: newComplaint.kontak_pelapor,
            kategori_pengaduan: newComplaint.kategori_pengaduan,
            lokasi_kejadian: newComplaint.lokasi_kejadian,
            perusahaan_terkait: newComplaint.perusahaan_terkait,
            deskripsi_masalah: newComplaint.deskripsi_masalah,
            status: 'Menunggu Verifikasi',
            latitude: newComplaint.latitude,
            longitude: newComplaint.longitude,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      Swal.fire({
        title: 'Pengaduan Dicatat',
        text: `Tiket aduan berhasil diterbitkan dengan nomor: ${tiketId}`,
        icon: 'success',
        confirmButtonColor: '#059669',
      });

      setIsNewComplaintModalOpen(false);
      setNewComplaint({
        nama_pelapor: '',
        kontak_pelapor: '',
        kategori_pengaduan: 'Pencemaran Lingkungan',
        lokasi_kejadian: '',
        perusahaan_terkait: '',
        deskripsi_masalah: '',
        latitude: -3.05,
        longitude: 120.25,
      });
      fetchComplaints();
    } catch (err: any) {
      console.error(err);
      Swal.fire('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.', 'error');
    }
  };

  const handleOpenFollowUp = (complaint: any) => {
    setSelectedComplaint(complaint);
    setFollowUpStatus(complaint.status || 'Sedang Ditinjau Dalak');
    setFollowUpDate(complaint.jadwal_site_visit || '');
    setFollowUpNotes(complaint.laporan_dalak || '');
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = async () => {
    if (!selectedComplaint) return;
    try {
      const { error } = await supabase
        .from('pengaduan')
        .update({
          status: followUpStatus,
          jadwal_site_visit: followUpDate || null,
          laporan_dalak: followUpNotes || null,
        })
        .eq('id', selectedComplaint.id);

      if (error) {
        const errMsg = String(error.message || '').toLowerCase();
        const isSchemaMissingCol =
          error.code === 'PGRST204' ||
          errMsg.includes('schema cache') ||
          errMsg.includes('jadwal_site_visit') ||
          errMsg.includes('laporan_dalak');

        if (!isSchemaMissingCol) throw error;

        // Schema-safe fallback: update status on pengaduan & persist follow-up fields in site_settings
        const { error: statusOnlyErr } = await supabase
          .from('pengaduan')
          .update({ status: followUpStatus })
          .eq('id', selectedComplaint.id);

        if (statusOnlyErr) throw statusOnlyErr;

        const { data: existingSetting } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'dalak_complaint_followups')
          .maybeSingle();

        let existingMap: Record<string, any> = {};
        if (existingSetting?.setting_value) {
          let parsed = existingSetting.setting_value;
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch {}
          }
          if (parsed && typeof parsed === 'object') {
            existingMap = parsed;
          }
        }

        existingMap[String(selectedComplaint.id)] = {
          jadwal_site_visit: followUpDate || null,
          laporan_dalak: followUpNotes || null,
          updated_at: new Date().toISOString(),
        };

        await supabase.from('site_settings').upsert(
          {
            setting_key: 'dalak_complaint_followups',
            setting_value: existingMap,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        );
      }

      Swal.fire({
        title: 'Status Diperbarui',
        text: 'Tindak lanjut lapangan pengaduan berhasil disimpan ke database.',
        icon: 'success',
        confirmButtonColor: '#059669',
      });
      setIsFollowUpModalOpen(false);
      fetchComplaints();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Gagal menyimpan status.', 'error');
    }
  };

  const handleDownloadExcelRekap = () => {
    if (companies.length === 0) {
      Swal.fire('Belum Ada Data', 'Belum ada data pelaku usaha di database untuk diekspor.', 'info');
      return;
    }
    const headers =
      'ID,Nama Perusahaan,NIB,Sektor,Kecamatan,Status LKPM,Tingkat Kepatuhan,Terakhir Diperiksa,Realisasi Modal Tetap (Juta Rp),Realisasi Modal Kerja (Juta Rp),Tenaga Kerja Lokal (Jiwa),Tenaga Kerja Asing (Jiwa)\n';
    const rows = companies
      .map(
        (c) =>
          `"${c.id}","${c.nama}","${c.nib}","${c.sektor}","${c.kecamatan}","${c.statusLkpm}","${c.tingkatKepatuhan}","${c.terakhirDiperiksa}",${c.realisasiModalTetap},${c.realisasiModalKerja},${c.serapanTkl},${c.serapanTka}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Kepatuhan_Pengawasan_Dalak_Luwu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      title: 'File Berhasil Diunduh',
      text: 'Rekapitulasi kepatuhan LKPM & realisasi modal telah diunduh dalam format CSV.',
      icon: 'success',
      confirmButtonColor: '#059669',
    });
  };

  const handleExportMediationReport = () => {
    if (mediations.length === 0) {
      Swal.fire('Belum Ada Data Mediasi', 'Belum ada kasus mediasi terdaftar untuk diekspor.', 'info');
      return;
    }
    const headers =
      'ID Tiket,Judul Kasus Sengketa,Pihak Pemohon,Perusahaan Terkait,Kategori Kendala,Lokasi,Status Mediasi,Tanggal Masuk,Jadwal Sidang,Tempat Sidang,Hasil Kesepakatan Damai\n';
    const rows = mediations
      .map(
        (m) =>
          `"${m.tiketId}","${m.judul}","${m.pemohon}","${m.perusahaanTerkait}","${m.kategori}","${m.lokasi}","${m.status}","${m.tanggalDaftar}","${m.jadwalSidang || '-'}","${m.tempatSidang || '-'}","${m.kesepakatanDamai || '-'}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Evaluasi_Mediasi_Dalak_Luwu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      title: 'Laporan Mediasi Diunduh',
      text: 'Laporan penanganan sengketa & debottlenecking investasi berhasil diekspor.',
      icon: 'success',
      confirmButtonColor: '#059669',
    });
  };

  const handleShowMediationDetail = (m: MediationCase) => {
    Swal.fire({
      title: m.judul,
      html: `
        <div class="text-left text-xs space-y-2 text-slate-700">
          <p><b>Tiket:</b> ${m.tiketId}</p>
          <p><b>Pemohon:</b> ${m.pemohon}</p>
          <p><b>Perusahaan:</b> ${m.perusahaanTerkait}</p>
          <p><b>Tempat Sidang:</b> ${m.tempatSidang || 'Kantor DPMPTSP Luwu'}</p>
          <p><b>Jadwal Sidang:</b> ${m.jadwalSidang || 'Menunggu penetapan'}</p>
          <p><b>Mediator:</b> ${m.mediator || 'Kabid Dalak'}</p>
          ${m.kesepakatanDamai ? `<div class="p-2.5 bg-emerald-50 rounded border border-emerald-200 mt-2"><b>Kesepakatan Damai:</b><br>${m.kesepakatanDamai}</div>` : ''}
        </div>
      `,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#059669',
    });
  };

  // ─── COMPACT SUB-WORKSPACE NAVIGATION BAR (ANDROID SNAP-SCROLL + DESKTOP) ───
  const subNavItems = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'pengaduan', label: `Pengaduan (${complaints.length})`, icon: MessageSquare },
    { id: 'pengawasan', label: `Pengawasan (${companies.length})`, icon: ShieldCheck },
    { id: 'fasilitasi', label: `Fasilitasi (${mediations.length})`, icon: Scale },
    { id: 'laporan', label: 'Laporan & BAP', icon: FileText },
    { id: 'investor_pipeline', label: 'Alur 4 Bidang', icon: Workflow },
  ];

  const renderDalakSubNav = () => (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      {subNavItems.map((item) => {
        const Icon = item.icon;
        const isCurrent =
          activeTab === item.id || (item.id === 'pengaduan' && activeTab === 'field_inspection');
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              isCurrent
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon size={15} className="shrink-0" />
            <span className="tabular-nums">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  // ─── TAB 1: OVERVIEW ────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {renderDalakSubNav()}

      {/* Main Title Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
            Bidang Dalak · Pengendalian Pelaksanaan &amp; Pengawasan
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 [text-wrap:balance]">
            Meja Kerja Pengendalian &amp; Pengawasan Investasi
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Pusat komando tindak lanjut pengaduan masyarakat, mediasi sengketa, dan verifikasi kepatuhan LKPM lapangan.
          </p>
        </div>
      </div>

      {/* KPI 4 Cards (2x2 on Android, 4-col on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('pengaduan')}
          className="text-left p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-500/40 transition cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2 gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Aduan Proses</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            {kpiStats.pendingComplaints}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            Aduan publik menunggu verifikasi lapangan.
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pengawasan')}
          className="text-left p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/40 transition cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2 gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Inspeksi &amp; Site Visit</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <MapPin size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            {kpiStats.scheduledInspections}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            Kunjungan lapangan &amp; verifikasi tercatat.
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fasilitasi')}
          className="text-left p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2 gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Mediasi Selesai</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            {kpiStats.solvedMediations}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            Kasus fasilitasi &amp; sengketa selesai damai.
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pengawasan')}
          className="text-left p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/40 transition cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2 gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Perlu Pembinaan</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <ShieldCheck size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            {kpiStats.nonCompliantCompanies}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            Pelaku usaha berstatus peringatan / sanksi.
          </div>
        </button>
      </div>

      {/* Two Column Grid: Antrean Pengaduan & Radar Kepatuhan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Left: Antrean Pengaduan */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="text-rose-500 shrink-0" size={18} />
                <span>Antrean Pengaduan Warga</span>
              </h2>
              <button
                onClick={fetchComplaints}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Muat Ulang Pengaduan"
              >
                <RefreshCw size={15} className={loadingComplaints ? 'animate-spin' : ''} />
              </button>
            </div>

            {complaints.length === 0 ? (
              <div className="py-10 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <FileText size={28} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Antrean Pengaduan</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Data pengaduan warga dari Supabase masih kosong.</p>
              </div>
            ) : (
              <>
                {/* Android Tap Cards (md:hidden) */}
                <div className="md:hidden space-y-2.5">
                  {complaints.slice(0, 4).map((c, i) => (
                    <div
                      key={c.id || i}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {c.tiket_id || `ADU-${c.id?.slice(0, 5)}`}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {c.kategori_pengaduan || 'Umum'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {c.nama_pelapor || 'Warga Kabupaten Luwu'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenFollowUp(c)}
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Proses Tindak Lanjut
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop Table (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                        <th className="py-2.5 px-3">ID Tiket</th>
                        <th className="py-2.5 px-3">Pelapor</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {complaints.slice(0, 4).map((c, i) => (
                        <tr key={c.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                            {c.tiket_id || `ADU-${c.id?.slice(0, 5)}`}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                            {c.nama_pelapor || 'Warga Luwu'}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            {c.kategori_pengaduan || 'Umum'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleOpenFollowUp(c)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
                            >
                              Proses
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex justify-between items-center gap-2">
            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
              Total {complaints.length} aduan terdata
            </span>
            <button
              onClick={() => setActiveTab('pengaduan')}
              className="min-h-[40px] px-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Seluruh Aduan &amp; Peta</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Right: Radar Kepatuhan Pelaku Usaha */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="text-amber-500 shrink-0" size={18} />
                <span>Radar Kepatuhan Pelaku Usaha</span>
              </h2>
              <button
                onClick={() => setActiveTab('pengawasan')}
                className="min-h-[40px] px-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Detail</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {companies.length === 0 ? (
              <div className="py-10 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Building2 size={28} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Pelaku Usaha Terdata</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Daftar pengawasan otomatis bersumber dari proyek investasi aktif di Supabase.</p>
              </div>
            ) : (
              <>
                {/* Android Tap Cards (md:hidden) */}
                <div className="md:hidden space-y-2.5">
                  {companies.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.nama}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            NIB: {c.nib} · {c.kecamatan}
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-extrabold shrink-0 ${
                            c.tingkatKepatuhan === 'Aman'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : c.tingkatKepatuhan === 'Warning'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {c.tingkatKepatuhan}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">LKPM: {c.statusLkpm}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenInspection(c)}
                          className="min-h-[42px] px-3 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Input Hasil
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportCompanyProfilePdf(c)}
                          disabled={exportingPdfId === c.id}
                          className="min-h-[42px] px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {exportingPdfId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          <span>PDF Profil</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                        <th className="py-2.5 px-3">Nama Perusahaan</th>
                        <th className="py-2.5 px-3">Status LKPM</th>
                        <th className="py-2.5 px-3">Kepatuhan</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {companies.slice(0, 4).map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">{c.nama}</div>
                            <div className="text-[10px] text-slate-400 font-mono">NIB: {c.nib}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-[11px]">{c.statusLkpm}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[11px] font-extrabold ${
                                c.tingkatKepatuhan === 'Aman'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : c.tingkatKepatuhan === 'Warning'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {c.tingkatKepatuhan}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenInspection(c)}
                                className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                              >
                                Input Hasil
                              </button>
                              <button
                                onClick={() => handleExportCompanyProfilePdf(c)}
                                disabled={exportingPdfId === c.id}
                                title="Unduh Laporan PDF Profil Investasi (Kop Pemkab Luwu)"
                                className="px-2.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                              >
                                {exportingPdfId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                <span>PDF</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Sinkron langsung dari proyek investasi Supabase &amp; BAP lapangan.</span>
          </div>
        </div>
      </div>

      {/* Sistem Pelaporan Terpadu (Cetak BAP & Rekap) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="text-emerald-600 dark:text-emerald-400 shrink-0" size={20} />
              <span>Sistem Pelaporan &amp; Berita Acara Pemeriksaan (BAP)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Unduh PDF BAP resmi berlogo Pemkab Luwu, laporan portofolio pengawasan PDF, atau rekapitulasi CSV.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:flex gap-2.5 w-full md:w-auto">
            <button
              onClick={() => handleOpenBapModal()}
              className="min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer size={15} />
              <span>BAP Resmi (PDF)</span>
            </button>

            <button
              onClick={handleExportDalakPortfolioPdf}
              disabled={isExportingPortfolioPdf}
              className="min-h-[44px] py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isExportingPortfolioPdf ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              <span>{isExportingPortfolioPdf ? 'Menyusun PDF...' : 'Laporan PDF Dalak'}</span>
            </button>

            <button
              onClick={handleDownloadExcelRekap}
              className="min-h-[44px] py-2.5 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-800 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Download size={15} />
              <span>Unduh Rekap (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan Komitmen Tenaga Kerja (TKL vs TKA) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-emerald-600 dark:text-emerald-400 shrink-0" size={18} />
            <span>Ringkasan Realisasi Tenaga Kerja Investasi</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kepatuhan serapan Tenaga Kerja Lokal (TKL) terhadap Tenaga Kerja Asing (TKA) sesuai ketentuan daerah (minimal 70% TKL).
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Tenaga Kerja</span>
            <div className="text-xl sm:text-2xl font-black tabular-nums text-slate-900 dark:text-white mt-1">
              {laborStats.totalWorker.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-normal text-slate-500">Jiwa</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Akumulasi proyek terdata</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Tenaga Kerja Lokal</span>
            <div className="text-xl sm:text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
              {laborStats.totalTkl.toLocaleString('id-ID')} <span className="text-xs font-normal">Jiwa</span>
            </div>
            <div className="text-[11px] font-bold tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
              Porsi: {laborStats.tklPercent}%
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Tenaga Asing (TKA)</span>
            <div className="text-xl sm:text-2xl font-black tabular-nums text-amber-600 dark:text-amber-400 mt-1">
              {laborStats.totalTka.toLocaleString('id-ID')} <span className="text-xs font-normal">Jiwa</span>
            </div>
            <div className="text-[11px] font-bold tabular-nums text-amber-700 dark:text-amber-400 mt-1">
              Porsi: {laborStats.tkaPercent}%
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">Target Perda Luwu</span>
            <div className="text-xl sm:text-2xl font-black tabular-nums text-purple-600 dark:text-purple-400 mt-1">
              ≥ 70% <span className="text-xs font-normal">TKL</span>
            </div>
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1">
              {laborStats.totalWorker === 0
                ? 'Menunggu data serapan'
                : Number(laborStats.tklPercent) >= 70
                  ? 'Memenuhi ambang batas'
                  : 'Perlu pembinaan serapan'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── TAB 2: ALUR & TIMELINE 4 BIDANG ─────────────────────────────────────────
  const renderInvestorPipeline = () => (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {renderDalakSubNav()}

      <div className="rounded-2xl sm:rounded-3xl bg-slate-900 text-white p-5 sm:p-8 border border-slate-800 shadow-sm">
        <div className="space-y-2">
          <div className="text-xs font-bold text-emerald-400">SOP Integrasi 4 Bidang DPMPTSP Kabupaten Luwu</div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight [text-wrap:balance]">
            Sinkronisasi Proses Bisnis &amp; Timeline Pendampingan Investor
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
            Menghubungkan 4 Bidang DPMPTSP dalam satu rantai pelayanan terpadu dari inisiasi minat, kajian spasial, penerbitan izin OSS-RBA, hingga pengawasan realisasi lapangan.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-slate-400">Target SLA Terpadu</div>
            <div className="text-base sm:text-lg font-black tabular-nums text-emerald-400">7–10 Hari Kerja</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-slate-400">Integrasi Lintas OPD</div>
            <div className="text-base sm:text-lg font-black text-blue-400">PUPTR &amp; Pertanian</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-slate-400">Basis Validasi</div>
            <div className="text-base sm:text-lg font-black text-purple-400">PostGIS RTRW</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-slate-400">Tahap Aktif Anda</div>
            <div className="text-base sm:text-lg font-black text-amber-400">Tahap 4 · Dalak</div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
          Tahapan Tanggung Jawab &amp; Aksi Operasional 4 Bidang
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">Tahap 1 · 25%</div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1">Bidang Promosi &amp; Penanaman Modal</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Fasilitasi minat awal, penerbitan dossier investor, verifikasi profil perusahaan, dan penjadwalan konsultasi lokasi.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div className="text-xs font-bold tabular-nums text-blue-600 dark:text-blue-400">Tahap 2 · 50%</div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1">Bidang Perencanaan, Iklim &amp; Data</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Kajian rantai pasok komoditas, analisis spasial, serta sinkronisasi rekomendasi LP2B &amp; pola ruang RTRW bersama OPD teknis.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div className="text-xs font-bold tabular-nums text-indigo-600 dark:text-indigo-400">Tahap 3 · 75%</div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1">Bidang Pelayanan Perizinan (OSS)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Pemrosesan NIB OSS-RBA, penerbitan SK PKKPR Final bertanda tangan elektronik, dan pemenuhan sertifikat standar.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/20">
            <div className="text-xs font-extrabold tabular-nums text-amber-700 dark:text-amber-400">Tahap 4 · 100% · Bidang Anda</div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1">Bidang Pengendalian &amp; Pengawasan</h3>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-2 leading-relaxed">
              Inspeksi fisik lapangan, verifikasi kepatuhan LKPM triwulanan, mediasi kendala masyarakat, dan penerbitan BAP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── TAB 3: PENGADUAN MASYARAKAT ───────────────────────────────────────────
  const renderPengaduan = () => (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {renderDalakSubNav()}

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Loket Pengaduan Masyarakat &amp; Tindak Lanjut Spasial
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 [text-wrap:balance]">
              Inspeksi &amp; Pengaduan Lapangan Masyarakat
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-3xl mt-1">
              Pantau seluruh aduan masyarakat Kabupaten Luwu secara spasial, jadwalkan peninjauan lokasi, dan terbitkan rekomendasi tindak lanjut.
            </p>
          </div>

          <button
            onClick={() => setIsNewComplaintModalOpen(true)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            <Plus size={16} />
            <span>Catat Aduan Warga Baru</span>
          </button>
        </div>
      </div>

      {/* Spasial Map Section */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin size={18} className="text-rose-500 shrink-0" />
            <span>Sebaran Spasial Lokasi Aduan</span>
          </h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
            <span>Total: <strong>{complaints.length}</strong></span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-600 dark:text-amber-400">
              Menunggu: <strong>{complaints.filter((c) => !c.status || c.status === 'Menunggu Verifikasi').length}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-blue-600 dark:text-blue-400">
              Diproses: <strong>{complaints.filter((c) => c.status?.includes('Ditinjau') || c.status?.includes('Proses') || c.status?.includes('Jadwal')).length}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Selesai: <strong>{complaints.filter((c) => c.status === 'Selesai').length}</strong>
            </span>
          </div>
        </div>

        {/* DalakMap (Responsive Android-First Height) */}
        <div className="w-full h-[280px] sm:h-[380px] md:h-[480px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <DalakMap
            isDarkMode={typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true}
            complaints={complaints}
          />
        </div>
      </div>

      {/* Complaints List / Table */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">Daftar Aduan Masyarakat Masuk</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Seluruh aduan aktif masyarakat dari loket pengaduan DPMPTSP Luwu.
            </p>
          </div>
          <button
            onClick={fetchComplaints}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
          >
            <RefreshCw size={14} className={loadingComplaints ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Muat Ulang</span>
          </button>
        </div>

        {complaints.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Aduan Terdaftar</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Sistem belum menerima aduan masyarakat di database.</p>
          </div>
        ) : (
          <>
            {/* Android Tap Cards (md:hidden) */}
            <div className="md:hidden space-y-3">
              {complaints.map((c, i) => (
                <div
                  key={c.id || i}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {c.tiket_id || `ADU-${c.id?.slice(0, 6)}`}
                    </span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {c.status || 'Menunggu Verifikasi'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {c.nama_pelapor || 'Warga Luwu'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {c.kategori_pengaduan || 'Umum'} · {c.lokasi_kejadian || 'Kab. Luwu'}
                    </div>
                  </div>
                  {c.perusahaan_terkait && (
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500">Terlapor:</span> <strong>{c.perusahaan_terkait}</strong>
                    </div>
                  )}
                  {c.deskripsi_masalah && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{c.deskripsi_masalah}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenFollowUp(c)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Tindak Lanjut &amp; Jadwal Site Visit
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold bg-slate-50 dark:bg-slate-800/40">
                    <th className="py-3 px-3">ID Tiket</th>
                    <th className="py-3 px-3">Pelapor &amp; Kontak</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Lokasi Kejadian</th>
                    <th className="py-3 px-3">Perusahaan Terkait</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {complaints.map((c, i) => (
                    <tr key={c.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {c.tiket_id || `ADU-${c.id?.slice(0, 6)}`}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{c.nama_pelapor || 'Warga Luwu'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.kontak_pelapor || '-'}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-rose-600 dark:text-rose-400">
                        {c.kategori_pengaduan || 'Umum'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{c.lokasi_kejadian || '-'}</td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{c.perusahaan_terkait || '-'}</td>
                      <td className="py-3 px-3 font-semibold text-amber-600 dark:text-amber-400">
                        {c.status || 'Menunggu Verifikasi'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenFollowUp(c)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition shadow-sm cursor-pointer"
                        >
                          Tindak Lanjut
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ─── TAB 4: PENGAWASAN & KEPATUHAN ──────────────────────────────────────────
  const renderPengawasan = () => (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {renderDalakSubNav()}

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800">
        <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
          Bidang Dalak · Pengawasan Kepatuhan LKPM &amp; Realisasi
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 [text-wrap:balance]">
          Pengawasan Kepatuhan &amp; LKPM Pelaku Usaha
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-3xl mt-1">
          Monitoring realisasi investasi, kepatuhan laporan LKPM berkala, dan verifikasi faktual lapangan untuk seluruh proyek investasi terdaftar di Kabupaten Luwu.
        </p>
      </div>

      {/* Radar List / Table */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-amber-500 shrink-0" size={20} />
              <span>Radar Kepatuhan Pelaku Usaha</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar proyek/pelaku usaha aktif di database Supabase beserta status pelaporan LKPM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400">
              Patuh: {companies.filter((c) => c.tingkatKepatuhan === 'Aman').length}
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="text-amber-600 dark:text-amber-400">
              Peringatan: {companies.filter((c) => c.tingkatKepatuhan === 'Warning').length}
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="text-rose-600 dark:text-rose-400">
              Sanksi: {companies.filter((c) => c.tingkatKepatuhan === 'Sanksi').length}
            </span>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Building2 size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Data Pelaku Usaha</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Data pengawasan ditarik otomatis dari proyek investasi di database Supabase.
            </p>
          </div>
        ) : (
          <>
            {/* Android Tap Cards (md:hidden) */}
            <div className="md:hidden space-y-3">
              {companies.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.nama}</h3>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        NIB: {c.nib}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-extrabold shrink-0 ${
                        c.tingkatKepatuhan === 'Aman'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : c.tingkatKepatuhan === 'Warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {c.tingkatKepatuhan}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                    <div>
                      <span className="block text-[10px] text-slate-400">Sektor &amp; Lokasi</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{c.sektor}</span>
                      <span className="block text-[11px] text-slate-500">{c.kecamatan}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Status LKPM</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.statusLkpm}</span>
                      <span className="block text-[11px] font-mono text-slate-500">{c.terakhirDiperiksa}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenInspection(c)}
                      className="flex-1 min-h-[44px] px-3 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Input Hasil
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportCompanyProfilePdf(c)}
                      disabled={exportingPdfId === c.id}
                      className="flex-1 min-h-[44px] px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {exportingPdfId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      <span>PDF Profil</span>
                    </button>
                    {c.tingkatKepatuhan === 'Warning' && (
                      <button
                        type="button"
                        onClick={() => handleSendReprimand(c)}
                        className="flex-1 min-h-[44px] px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Kirim Teguran
                      </button>
                    )}
                    {c.tingkatKepatuhan === 'Sanksi' && (
                      <button
                        type="button"
                        onClick={() => handleOpenBapModal(c)}
                        className="flex-1 min-h-[44px] px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        BAP Sanksi
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                    <th className="py-3 px-4">Nama Perusahaan</th>
                    <th className="py-3 px-4">Sektor &amp; Lokasi</th>
                    <th className="py-3 px-4">Status Lapor LKPM</th>
                    <th className="py-3 px-4">Tingkat Kepatuhan</th>
                    <th className="py-3 px-4">Terakhir Diperiksa</th>
                    <th className="py-3 px-4 text-center">Aksi / Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {companies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{c.nama}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIB: {c.nib}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{c.sektor}</div>
                        <div className="text-[10px] text-slate-400">{c.kecamatan}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{c.statusLkpm}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-extrabold ${
                            c.tingkatKepatuhan === 'Aman'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : c.tingkatKepatuhan === 'Warning'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {c.tingkatKepatuhan === 'Aman'
                            ? 'Aman (Patuh)'
                            : c.tingkatKepatuhan === 'Warning'
                              ? 'Warning (Terlambat)'
                              : 'Sanksi Peringatan'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                        {c.terakhirDiperiksa}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenInspection(c)}
                            className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            Input Hasil
                          </button>

                          <button
                            onClick={() => handleExportCompanyProfilePdf(c)}
                            disabled={exportingPdfId === c.id}
                            title="Unduh Laporan PDF Profil Investasi (Kop Pemkab Luwu)"
                            className="px-2.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                          >
                            {exportingPdfId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            <span>PDF Profil</span>
                          </button>

                          {c.tingkatKepatuhan === 'Warning' && (
                            <button
                              onClick={() => handleSendReprimand(c)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              Kirim Teguran
                            </button>
                          )}

                          {c.tingkatKepatuhan === 'Sanksi' && (
                            <button
                              onClick={() => handleOpenBapModal(c)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              BAP Sanksi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ─── TAB 5: FASILITASI & MEDIASI ───────────────────────────────────────────
  const renderFasilitasi = () => (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {renderDalakSubNav()}

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Bidang Dalak · Fasilitasi &amp; Debottlenecking
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 [text-wrap:balance]">
              Fasilitasi &amp; Mediasi Sengketa Investasi
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-3xl mt-1">
              Fasilitasi penyelesaian hambatan investasi, mediasi sengketa bersama masyarakat, dan pendampingan realisasi di lapangan.
            </p>
          </div>

          <button
            onClick={() => setIsNewMediationModalOpen(true)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            <Plus size={16} />
            <span>Daftarkan Kasus Mediasi</span>
          </button>
        </div>
      </div>

      {/* Mediation List / Table */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="text-emerald-600 dark:text-emerald-400 shrink-0" size={18} />
              <span>Daftar Kasus Mediasi &amp; Debottlenecking</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Permohonan fasilitasi penyelesaian kendala lahan, izin lingkungan, dan hubungan masyarakat.
            </p>
          </div>

          <span className="text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
            {mediations.length} Kasus
          </span>
        </div>

        {mediations.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <Scale size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Kasus Mediasi Terdaftar</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Belum terdapat permohonan mediasi sengketa investasi di database.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewMediationModalOpen(true)}
              className="min-h-[42px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>Daftarkan Kasus Pertama</span>
            </button>
          </div>
        ) : (
          <>
            {/* Android Tap Cards (md:hidden) */}
            <div className="md:hidden space-y-3">
              {mediations.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{m.tiketId}</span>
                    <span
                      className={`font-bold ${
                        m.status === 'Selesai Damai'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{m.judul}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                    <div>Pemohon: <strong>{m.pemohon}</strong></div>
                    <div>Perusahaan: <strong>{m.perusahaanTerkait}</strong></div>
                    <div className="text-[11px] text-slate-500">{m.kategori} · {m.lokasi}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleShowMediationDetail(m)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Lihat Detail Sidang
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold bg-slate-50 dark:bg-slate-800/40">
                    <th className="py-3 px-3">ID Tiket / Judul Kasus</th>
                    <th className="py-3 px-3">Pemohon &amp; Pihak Terlibat</th>
                    <th className="py-3 px-3">Kategori Kendala</th>
                    <th className="py-3 px-3">Lokasi</th>
                    <th className="py-3 px-3">Status Mediasi</th>
                    <th className="py-3 px-3 text-center">Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {mediations.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block">{m.tiketId}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{m.judul}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{m.pemohon}</div>
                        <div className="text-[10px] text-slate-400">Terkait: {m.perusahaanTerkait}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-blue-600 dark:text-blue-400">{m.kategori}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{m.lokasi}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-extrabold ${
                            m.status === 'Selesai Damai'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleShowMediationDetail(m)}
                          className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Detail Sidang
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ─── TAB 6: EVALUASI & LAPORAN DALAK ────────────────────────────────────────
  const renderLaporan = () => (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {renderDalakSubNav()}

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800">
        <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
          Bidang Dalak · Evaluasi &amp; Pelaporan Pimpinan
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 [text-wrap:balance]">
          Evaluasi &amp; Rekapitulasi Laporan Pengawasan Dalak
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-3xl mt-1">
          Evaluasi kinerja realisasi investasi daerah, rekapitulasi penegakan kepatuhan LKPM, serta pencetakan Berita Acara Pemeriksaan (BAP) Satgas.
        </p>
      </div>

      {/* 3 Action Cards */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-emerald-600 dark:text-emerald-400 shrink-0" size={20} />
            <span>Sistem Pelaporan &amp; Cetak BAP Terpadu</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cetak Berita Acara Pemeriksaan (BAP) resmi dan unduh rekapitulasi pengawasan untuk laporan berkala Kepala Dinas &amp; Bupati Luwu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Berita Acara Pemeriksaan (BAP)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Buat dokumen PDF BAP resmi peninjauan lapangan dan evaluasi kepatuhan pelaku usaha dengan Kop Pemkab Luwu.
              </p>
            </div>
            <button
              onClick={() => handleOpenBapModal()}
              className="mt-4 w-full min-h-[44px] py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Download size={15} />
              <span>Buka &amp; Unduh BAP PDF</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 w-fit">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Laporan Portofolio PDF (A4)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ekspor laporan eksekutif pengawasan penanaman modal daerah format PDF A4 berlogo resmi Pemkab Luwu.
              </p>
            </div>
            <button
              onClick={handleExportDalakPortfolioPdf}
              disabled={isExportingPortfolioPdf}
              className="mt-4 w-full min-h-[44px] py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isExportingPortfolioPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{isExportingPortfolioPdf ? 'Menyusun PDF...' : 'Unduh Laporan PDF'}</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Rekapitulasi Kepatuhan LKPM</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Unduh rekapitulasi status kepatuhan LKPM seluruh proyek investasi di Kabupaten Luwu beserta realisasi modal &amp; tenaga kerja.
              </p>
            </div>
            <button
              onClick={handleDownloadExcelRekap}
              className="mt-4 w-full min-h-[44px] py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Download size={15} />
              <span>Unduh CSV Rekap</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit">
                <Scale size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Laporan Evaluasi Mediasi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ringkasan penyelesaian kasus mediasi dan fasilitasi hambatan investasi daerah dalam format tabel CSV siap olah.
              </p>
            </div>
            <button
              onClick={handleExportMediationReport}
              className="mt-4 w-full min-h-[44px] py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <FileCheck2 size={15} />
              <span>Ekspor Laporan Mediasi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── MODAL 1: INPUT HASIL INSPEKSI LAPANGAN (ANDROID BOTTOM SHEET) ──────────
  const renderInspectionModal = () => {
    if (!isInspectionModalOpen || !selectedCompany) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92dvh] flex flex-col border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />
          <div className="flex justify-between items-start gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                Verifikasi Faktual Lapangan
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {selectedCompany.nama}
              </h2>
            </div>
            <button
              onClick={() => setIsInspectionModalOpen(false)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Status LKPM</label>
                <select
                  value={inspectionData.statusLkpm}
                  onChange={(e) => setInspectionData({ ...inspectionData, statusLkpm: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Sudah Lapor Q2 2026">Sudah Lapor Q2 2026</option>
                  <option value="Sudah Lapor Q1 2026">Sudah Lapor Q1 2026</option>
                  <option value="Terlambat 14 Hari">Terlambat 14 Hari</option>
                  <option value="Tidak Lapor (2 Semester)">Tidak Lapor (2 Semester)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tingkat Kepatuhan</label>
                <select
                  value={inspectionData.tingkatKepatuhan}
                  onChange={(e) => setInspectionData({ ...inspectionData, tingkatKepatuhan: e.target.value as any })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Aman">Aman (Patuh)</option>
                  <option value="Warning">Warning (Peringatan)</option>
                  <option value="Sanksi">Sanksi (Surat Teguran / Pembekuan)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Realisasi Modal Tetap (Juta Rp)</label>
                <input
                  type="number"
                  value={inspectionData.realisasiModalTetap}
                  onChange={(e) => setInspectionData({ ...inspectionData, realisasiModalTetap: Number(e.target.value) })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs tabular-nums text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Realisasi Modal Kerja (Juta Rp)</label>
                <input
                  type="number"
                  value={inspectionData.realisasiModalKerja}
                  onChange={(e) => setInspectionData({ ...inspectionData, realisasiModalKerja: Number(e.target.value) })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs tabular-nums text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tenaga Lokal (TKL)</label>
                <input
                  type="number"
                  value={inspectionData.serapanTkl}
                  onChange={(e) => setInspectionData({ ...inspectionData, serapanTkl: Number(e.target.value) })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs tabular-nums text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tenaga Asing (TKA)</label>
                <input
                  type="number"
                  value={inspectionData.serapanTka}
                  onChange={(e) => setInspectionData({ ...inspectionData, serapanTka: Number(e.target.value) })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs tabular-nums text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Catatan Temuan Lapangan &amp; Rekomendasi Satgas</label>
              <textarea
                rows={3}
                value={inspectionData.catatanInspeksi}
                onChange={(e) => setInspectionData({ ...inspectionData, catatanInspeksi: e.target.value })}
                placeholder="Tuliskan temuan fisik, kepatuhan AMDAL, serapan naker, atau arahan perbaikan..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="flex gap-2.5 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] sm:pb-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              onClick={() => setIsInspectionModalOpen(false)}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSaveInspection}
              className="flex-1 sm:ml-auto sm:flex-none min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              Simpan Hasil Pengawasan
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── MODAL 2: DIRECT A4 PDF BAP GENERATOR (ANDROID BOTTOM SHEET + KOP PEMKAB LUWU) ──
  const renderBapGeneratorModal = () => {
    if (!isBapGeneratorOpen || !selectedCompany) return null;
    const nomorBap = `503/BAP-DALAK/DPMPTSP-LW/${new Date().getFullYear()}/${String(selectedCompany.id || '101')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase()}`;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
        <div className="bg-white text-slate-900 rounded-t-3xl sm:rounded-2xl max-w-3xl w-full max-h-[92dvh] flex flex-col shadow-2xl border-t sm:border border-slate-300 overflow-hidden">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto mt-2.5 mb-1 sm:hidden print:hidden shrink-0" />
          <div className="flex flex-wrap justify-between items-center gap-2 px-4 sm:px-6 py-3 border-b border-slate-200 print:hidden shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-extrabold text-emerald-700">Dokumen Resmi BAP</span>
              {companies.length > 1 && (
                <select
                  value={selectedCompany.id}
                  onChange={(e) => {
                    const found = companies.find((c) => c.id === e.target.value);
                    if (found) setSelectedCompany(found);
                  }}
                  className="min-h-[40px] max-w-[170px] sm:max-w-[240px] px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 text-base sm:text-xs font-semibold text-slate-900"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleDownloadBapPdf}
                disabled={isExportingBapPdf}
                className="min-h-[42px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isExportingBapPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>{isExportingBapPdf ? 'Menyusun PDF...' : 'Unduh PDF BAP'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                title="Cetak via Printer Desktop"
                className="hidden sm:flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <Printer size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsBapGeneratorOpen(false)}
                className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div ref={bapSheetRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-5 bg-white text-slate-900">
            <div className="border-b-[3px] border-double border-slate-900 pb-4 flex items-center gap-3.5">
              <img
                src={LUWU_LOGO_BASE64}
                alt="Logo Pemerintah Kabupaten Luwu"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
              />
              <div className="flex-1 text-center space-y-0.5">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-900">
                  Pemerintah Kabupaten Luwu
                </h3>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                  Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu
                </h2>
                <p className="text-[11px] font-semibold text-slate-700">
                  Bidang Pengendalian Pelaksanaan Penanaman Modal &amp; Pengawasan (DALAK)
                </p>
                <p className="text-[10px] text-slate-500">
                  Kompleks Perkantoran Pemkab Luwu, Jl. Jenderal Sudirman No. 1, Belopa, Kab. Luwu (91994) · dpmptsp@luwukab.go.id
                </p>
              </div>
            </div>

            <div className="text-center space-y-0.5">
              <h4 className="font-extrabold text-xs sm:text-sm underline uppercase tracking-wider">
                Berita Acara Pemeriksaan Lapangan (BAP)
              </h4>
              <div className="text-xs font-mono font-medium text-slate-600">Nomor: {nomorBap}</div>
            </div>

            <div className="text-xs space-y-3 leading-relaxed text-slate-800">
              <p>
                Pada hari ini, tanggal{' '}
                <b>
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </b>
                , Tim Satgas Pengawasan Bidang Pengendalian Pelaksanaan &amp; Pengawasan (DALAK) DPMPTSP Kabupaten Luwu telah melaksanakan pemeriksaan fisik dan verifikasi faktual lapangan terhadap pelaku usaha:
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div><b>Nama Perusahaan:</b> {selectedCompany.nama}</div>
                <div><b>Nomor Induk Berusaha (NIB):</b> {selectedCompany.nib}</div>
                <div><b>Sektor Usaha:</b> {selectedCompany.sektor}</div>
                <div><b>Lokasi Kegiatan:</b> {selectedCompany.kecamatan}, Kab. Luwu</div>
                <div><b>Realisasi Modal Tetap:</b> Rp {selectedCompany.realisasiModalTetap.toLocaleString('id-ID')} Juta</div>
                <div><b>Realisasi Modal Kerja:</b> Rp {selectedCompany.realisasiModalKerja.toLocaleString('id-ID')} Juta</div>
                <div><b>Serapan Tenaga Kerja:</b> {selectedCompany.serapanTkl} TKL / {selectedCompany.serapanTka} TKA</div>
                <div><b>Status Kepatuhan:</b> <span className="font-bold uppercase">{selectedCompany.tingkatKepatuhan}</span></div>
              </div>

              <div>
                <b>Hasil Pemeriksaan &amp; Temuan Lapangan:</b>
                <p className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 italic">
                  &ldquo;{selectedCompany.catatanInspeksi || 'Belum ada catatan temuan khusus yang diinput pada sesi pemeriksaan ini.'}&rdquo;
                </p>
              </div>

              <div>
                <b>Rekomendasi Satgas Dalak DPMPTSP:</b>
                <ol className="list-decimal pl-5 mt-1 space-y-1">
                  <li>Pelaku usaha diwajibkan mempertahankan kepatuhan pelaporan berkala LKPM melalui sistem OSS-RBA.</li>
                  <li>Menjaga pemenuhan komitmen serapan tenaga kerja lokal minimal 70% sesuai Perda Kabupaten Luwu.</li>
                  <li>Melakukan koordinasi berkala dengan Tim Mediasi dan Pengawasan apabila terdapat kendala di lapangan.</li>
                </ol>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-center text-xs">
              <div>
                <p className="text-slate-600">Perwakilan Pelaku Usaha,</p>
                <div className="h-14 flex items-center justify-center font-serif text-slate-400 italic">
                  (Tanda Tangan &amp; Stempel)
                </div>
                <p className="font-bold uppercase text-slate-900">{selectedCompany.kontakPenanggungJawab || selectedCompany.nama}</p>
                <p className="text-[10px] text-slate-500">Penanggung Jawab Usaha</p>
              </div>

              <div>
                <p className="text-slate-600">
                  Belopa, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-slate-600 font-medium">Ketua Tim Pengawas Lapangan,</p>
                <div className="h-14 flex items-center justify-center font-serif text-slate-400 italic">
                  (Tanda Tangan &amp; Cap Dinas)
                </div>
                <p className="font-bold uppercase text-slate-900">Bidang Dalak &amp; Pengawasan</p>
                <p className="text-[10px] text-slate-500">DPMPTSP Kabupaten Luwu</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── MODAL 3: SURAT TEGURAN RESMI (ANDROID BOTTOM SHEET) ────────────────────
  const renderReprimandModal = () => {
    if (!isReprimandModalOpen || !selectedCompany) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />
          <div className="flex justify-between items-start gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">
                Surat Peringatan Administratif
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                Teguran LKPM: {selectedCompany.nama}
              </h2>
            </div>
            <button
              onClick={() => setIsReprimandModalOpen(false)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              Pelaku usaha <b>{selectedCompany.nama}</b> tercatat dalam status <b>{selectedCompany.statusLkpm}</b> dan belum memenuhi kewajiban pelaporan tepat waktu di subsistem OSS.
            </p>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
              <div className="font-bold text-amber-800 dark:text-amber-300">Format Dokumen Surat:</div>
              <div><b>Nomor:</b> 503/SP-I/DPMPTSP-LW/{new Date().getFullYear()}/042</div>
              <div><b>Perihal:</b> Surat Peringatan Pertama (SP-I) Kewajiban Laporan LKPM</div>
              <div><b>Tujuan:</b> Penanggung Jawab {selectedCompany.nama}</div>
              <div><b>Batas Waktu Perbaikan:</b> 14 (Empat Belas) Hari Kerja</div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Surat peringatan dicatat dalam arsip resmi pengawasan Bidang Dalak DPMPTSP Kabupaten Luwu.
            </p>
          </div>

          <div className="flex gap-2.5 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] sm:pb-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              onClick={() => setIsReprimandModalOpen(false)}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmSendReprimand}
              className="flex-1 sm:ml-auto sm:flex-none min-h-[44px] px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send size={14} />
              <span>Terbitkan &amp; Kirim</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── MODAL 4: DAFTARKAN KASUS MEDIASI (ANDROID BOTTOM SHEET) ────────────────
  const renderNewMediationModal = () => {
    if (!isNewMediationModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <form
          onSubmit={handleCreateMediation}
          className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />
          <div className="flex justify-between items-start gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                Fasilitasi &amp; Debottlenecking
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Daftarkan Kasus Mediasi Baru
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsNewMediationModalOpen(false)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Judul Permohonan / Pokok Sengketa</label>
              <input
                type="text"
                required
                value={newMediation.judul}
                onChange={(e) => setNewMediation({ ...newMediation, judul: e.target.value })}
                placeholder="Contoh: Mediasi Akses Jalan & Kompensasi Lahan"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pihak Pemohon / Warga</label>
                <input
                  type="text"
                  required
                  value={newMediation.pemohon}
                  onChange={(e) => setNewMediation({ ...newMediation, pemohon: e.target.value })}
                  placeholder="Nama warga / perwakilan kelompok"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Perusahaan Terkait</label>
                <input
                  type="text"
                  required
                  value={newMediation.perusahaanTerkait}
                  onChange={(e) => setNewMediation({ ...newMediation, perusahaanTerkait: e.target.value })}
                  placeholder="Nama badan usaha terkait"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kategori Kendala</label>
                <select
                  value={newMediation.kategori}
                  onChange={(e) => setNewMediation({ ...newMediation, kategori: e.target.value as any })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Sengketa Lahan">Sengketa Lahan</option>
                  <option value="Akses & Fasilitas">Akses &amp; Fasilitas</option>
                  <option value="Pencemaran Lingkungan">Pencemaran Lingkungan</option>
                  <option value="Tenaga Kerja Lokal">Tenaga Kerja Lokal</option>
                  <option value="Perizinan / Regulasi">Perizinan / Regulasi</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Lokasi Kejadian</label>
                <input
                  type="text"
                  value={newMediation.lokasi}
                  onChange={(e) => setNewMediation({ ...newMediation, lokasi: e.target.value })}
                  placeholder="Kecamatan / Desa di Kab. Luwu"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Jadwal Sidang (Opsional)</label>
                <input
                  type="date"
                  value={newMediation.jadwalSidang}
                  onChange={(e) => setNewMediation({ ...newMediation, jadwalSidang: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tempat Sidang</label>
                <input
                  type="text"
                  value={newMediation.tempatSidang}
                  onChange={(e) => setNewMediation({ ...newMediation, tempatSidang: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] sm:pb-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              type="button"
              onClick={() => setIsNewMediationModalOpen(false)}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 sm:ml-auto sm:flex-none min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              Simpan &amp; Daftarkan
            </button>
          </div>
        </form>
      </div>
    );
  };

  // ─── MODAL 5: CATAT ADUAN WARGA BARU (ANDROID BOTTOM SHEET) ─────────────────
  const renderNewComplaintModal = () => {
    if (!isNewComplaintModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <form
          onSubmit={handleCreateComplaint}
          className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />
          <div className="flex justify-between items-start gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block">
                Loket Pengaduan Masyarakat
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Catat Aduan Warga Baru
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsNewComplaintModalOpen(false)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nama Pelapor / Warga</label>
                <input
                  type="text"
                  required
                  value={newComplaint.nama_pelapor}
                  onChange={(e) => setNewComplaint({ ...newComplaint, nama_pelapor: e.target.value })}
                  placeholder="Nama lengkap"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nomor Kontak / WhatsApp</label>
                <input
                  type="tel"
                  value={newComplaint.kontak_pelapor}
                  onChange={(e) => setNewComplaint({ ...newComplaint, kontak_pelapor: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kategori Pengaduan</label>
                <select
                  value={newComplaint.kategori_pengaduan}
                  onChange={(e) => setNewComplaint({ ...newComplaint, kategori_pengaduan: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Pencemaran Lingkungan">Pencemaran Lingkungan</option>
                  <option value="Sengketa Lahan / Tata Ruang">Sengketa Lahan / Tata Ruang</option>
                  <option value="Pelanggaran Izin Usaha">Pelanggaran Izin Usaha</option>
                  <option value="Infrastruktur / Fasilitas Umum">Infrastruktur / Fasilitas Umum</option>
                  <option value="Konflik Sosial / Tenaga Kerja">Konflik Sosial / Tenaga Kerja</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Perusahaan Terlapor</label>
                <input
                  type="text"
                  value={newComplaint.perusahaan_terkait}
                  onChange={(e) => setNewComplaint({ ...newComplaint, perusahaan_terkait: e.target.value })}
                  placeholder="Nama perusahaan (jika ada)"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Lokasi Kejadian (Kecamatan / Desa)</label>
              <input
                type="text"
                value={newComplaint.lokasi_kejadian}
                onChange={(e) => setNewComplaint({ ...newComplaint, lokasi_kejadian: e.target.value })}
                placeholder="Desa / Kecamatan di Kabupaten Luwu"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Deskripsi Masalah / Kronologi</label>
              <textarea
                rows={3}
                required
                value={newComplaint.deskripsi_masalah}
                onChange={(e) => setNewComplaint({ ...newComplaint, deskripsi_masalah: e.target.value })}
                placeholder="Jelaskan detail pengaduan masyarakat..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="flex gap-2.5 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] sm:pb-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              type="button"
              onClick={() => setIsNewComplaintModalOpen(false)}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 sm:ml-auto sm:flex-none min-h-[44px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              Simpan &amp; Terbitkan Tiket
            </button>
          </div>
        </form>
      </div>
    );
  };

  // ─── MODAL 6: TINDAK LANJUT PENGADUAN / SITE VISIT (ANDROID BOTTOM SHEET) ───
  const renderFollowUpModal = () => {
    if (!isFollowUpModalOpen || !selectedComplaint) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />
          <div className="flex justify-between items-start gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                Tindak Lanjut Bidang Dalak
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                Tiket {selectedComplaint.tiket_id || selectedComplaint.id?.slice(0, 8)}
              </h2>
            </div>
            <button
              onClick={() => setIsFollowUpModalOpen(false)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white">{selectedComplaint.nama_pelapor}</div>
              <div className="text-slate-600 dark:text-slate-300 text-xs mt-1">{selectedComplaint.deskripsi_masalah}</div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Status Progres</label>
              <select
                value={followUpStatus}
                onChange={(e) => setFollowUpStatus(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
              >
                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                <option value="Sedang Ditinjau Dalak">Sedang Ditinjau Dalak</option>
                <option value="Jadwal Site Visit Ditentukan">Jadwal Site Visit Ditentukan</option>
                <option value="Proses Mediasi Lapangan">Proses Mediasi Lapangan</option>
                <option value="Selesai">Selesai (Rekomendasi Diterbitkan)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Jadwal Site Visit (Jika Diperlukan)</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Catatan Hasil Tindak Lanjut / Rekomendasi</label>
              <textarea
                rows={3}
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="Catatan peninjauan lapangan atau kesepakatan..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="flex gap-2.5 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] sm:pb-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              onClick={() => setIsFollowUpModalOpen(false)}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSaveFollowUp}
              className="flex-1 sm:ml-auto sm:flex-none min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              Simpan Tindak Lanjut
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── ROUTE INNER TABS ───────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'investor_pipeline' && renderInvestorPipeline()}
      {(activeTab === 'pengaduan' || activeTab === 'field_inspection') && renderPengaduan()}
      {activeTab === 'pengawasan' && renderPengawasan()}
      {activeTab === 'fasilitasi' && renderFasilitasi()}
      {activeTab === 'laporan' && renderLaporan()}

      {/* Render all functional modals */}
      {renderInspectionModal()}
      {renderBapGeneratorModal()}
      {renderReprimandModal()}
      {renderNewMediationModal()}
      {renderNewComplaintModal()}
      {renderFollowUpModal()}
    </div>
  );
};

export default DalakWorkspaceView;
