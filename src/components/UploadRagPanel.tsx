import React, { useState, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  BookOpen, 
  Building2, 
  Calendar, 
  Sparkles, 
  Info,
  RefreshCw,
  Eye,
  Trash2,
  AlertTriangle,
  Search,
  Check,
  X,
  Layers,
  Activity,
  Cpu,
  Sliders,
  Send,
  ExternalLink,
  ChevronRight,
  Database,
  ShieldCheck,
  HelpCircle,
  FileCode,
  Tag
} from "lucide-react";
import { 
  DocumentCategory, 
  KnowledgeDocument, 
  DocumentStatus,
  RagStats,
  GroundingChunkMatch,
  GroundingTestResult
} from "../types/knowledgeBase";

interface UploadRagPanelProps {
  isDarkMode: boolean;
}

interface ChunkPreview {
  id: string;
  document_id: string;
  index: number;
  content: string;
  charLength: number;
  tokenEstimate: number;
  page_number: number;
  hasEmbedding: boolean;
  embeddingDim: number;
  created_at: string;
}

export default function UploadRagPanel({ isDarkMode }: UploadRagPanelProps) {
  // Navigation Tabs: 'index' | 'documents' | 'testbench' | 'stats'
  const [activeTab, setActiveTab] = useState<"index" | "documents" | "testbench" | "stats">("index");
  
  // Documents List State
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // RAG Stats State
  const [stats, setStats] = useState<RagStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // File Upload Form State
  const [uploadMode, setUploadMode] = useState<"file" | "direct_text">("file");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("regulasi");
  const [sourceAgency, setSourceAgency] = useState("");
  const [publicationYear, setPublicationYear] = useState(new Date().getFullYear());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [directContent, setDirectContent] = useState("");
  
  // PDF Preview State
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Status & Logs
  const [uploadStatus, setUploadStatus] = useState<DocumentStatus | "IDLE" | "UPLOADING">("IDLE");
  const [statusMessage, setStatusMessage] = useState("Menunggu input dokumen pemerintah.");
  const [logs, setLogs] = useState<{ timestamp: string; status: string; message: string }[]>([]);

  // Chunk Inspector Drawer/Modal
  const [inspectingDoc, setInspectingDoc] = useState<KnowledgeDocument | null>(null);
  const [chunksList, setChunksList] = useState<ChunkPreview[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  // Grounding Test Bench State
  const [testQuery, setTestQuery] = useState("");
  const [isTestingGrounding, setIsTestingGrounding] = useState(false);
  const [groundingResult, setGroundingResult] = useState<GroundingTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Re-indexing state
  const [isReindexingAll, setIsReindexingAll] = useState(false);
  const [reindexingDocId, setReindexingDocId] = useState<string | null>(null);

  // Sample prompt queries for quick test bench evaluation
  const SAMPLE_QUERIES = [
    "Bagaimana ketentuan zonasi Kawasan Industri Bua untuk hilirisasi mineral & agroindustri?",
    "Apa saja fasilitas insentif penanaman modal dan pengurangan PBG di Kabupaten Luwu?",
    "Bagaimana alokasi komoditas perkebunan kakao dan kopi specialty menurut RTRW Luwu?",
    "Jelaskan rincian proyek hilirisasi pengolahan rumput laut terpadu IPRO di Larompong Selatan.",
    "Berapa batas sempadan sungai yang dilindungi dalam RTRW dan Perbup No. 53/2011?"
  ];

  const addLog = (status: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    setLogs(prev => [{ timestamp, status, message }, ...prev.slice(0, 20)]);
  };

  // Fetch Documents
  const fetchDocuments = async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await fetch("/api/rag");
      if (!res.ok) throw new Error(`HTTP ${res.status}: Gagal memuat daftar dokumen`);
      const data = await res.json();
      setDocs(data || []);
    } catch (err: any) {
      setListError(err.message || "Gagal terhubung ke database pengetahuan");
    } finally {
      setIsLoadingList(false);
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/rag/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn("Failed to fetch RAG stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert("Ukuran file maksimal 50MB.");
      return;
    }

    setSelectedFile(file);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);

    if (file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    } else {
      setPdfUrl(null);
    }

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(cleanName);
    }

    setUploadStatus("IDLE");
    setStatusMessage(`File "${file.name}" siap diindeks.`);
    setLogs([]);
    addLog("READY", `Berkas "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB) dimuat ke buffer.`);
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!title.trim() || !sourceAgency.trim() || !publicationYear) {
      alert("Mohon lengkapi judul, instansi penerbit, dan tahun dokumen.");
      return;
    }

    setUploadStatus("UPLOADING");
    setStatusMessage("Mengunggah dan mengindeks dokumen ke basis data vektor...");
    addLog("EXTRACT", `Mengekstrak teks & menganalisis konten: "${title}"...`);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("source_agency", sourceAgency.trim());
    formData.append("publication_year", String(publicationYear));

    try {
      const response = await fetch("/api/rag/upload", {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal mengunggah dan mengindeks berkas.");
      }

      setUploadStatus("completed");
      setStatusMessage(`Berhasil! Dokumen dipecah menjadi ${result.chunksCount} segmen vektor.`);
      addLog("SUCCESS", `Indexing selesai. Dihasilkan ${result.chunksCount} chunk vektor terindeks.`);
      
      // Reset form
      setSelectedFile(null);
      setTitle("");
      setSourceAgency("");
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }

      await fetchDocuments();
      await fetchStats();
    } catch (err: any) {
      setUploadStatus("failed");
      setStatusMessage(`Gagal: ${err.message}`);
      addLog("ERROR", err.message || "Proses indexing terhenti.");
    }
  };

  const handleIndexDirectText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !directContent.trim() || directContent.trim().length < 20) {
      alert("Judul dan isi teks kebijakan minimal 20 karakter.");
      return;
    }

    setUploadStatus("UPLOADING");
    setStatusMessage("Memproses teks kebijakan dan menghasilkan embedding vektor...");
    addLog("PROCESSING", `Memulai chunking semantik untuk: "${title}"...`);

    try {
      const response = await fetch("/api/rag/index-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          sourceAgency: sourceAgency.trim() || "Pemkab Luwu",
          publicationYear: Number(publicationYear) || new Date().getFullYear(),
          content: directContent.trim(),
          isActive: true
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal mengindeks teks kebijakan.");
      }

      setUploadStatus("completed");
      setStatusMessage(`Sukses! ${result.chunksCount} segmen kebijakan berhasil diindeks.`);
      addLog("SUCCESS", `Teks terindeks dalam ${result.chunksCount} chunk berdimensi 1536.`);

      // Reset
      setTitle("");
      setDirectContent("");
      setSourceAgency("");

      await fetchDocuments();
      await fetchStats();
    } catch (err: any) {
      setUploadStatus("failed");
      setStatusMessage(`Gagal: ${err.message}`);
      addLog("ERROR", err.message);
    }
  };

  const handleToggleActive = async (doc: KnowledgeDocument) => {
    const nextState = !doc.is_active;
    try {
      const res = await fetch(`/api/rag/toggle-active/${doc.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextState })
      });
      if (res.ok) {
        setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, is_active: nextState } : d));
        fetchStats();
      }
    } catch (err) {
      console.error("Toggle active failed:", err);
    }
  };

  const handleReindexDoc = async (docId: string) => {
    setReindexingDocId(docId);
    try {
      const res = await fetch(`/api/rag/reindex/${docId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reindex gagal");
      alert(`Dokumen berhasil di-reindex (${data.reindexedCount} chunks).`);
      await fetchDocuments();
      await fetchStats();
    } catch (err: any) {
      alert(`Gagal reindex: ${err.message}`);
    } finally {
      setReindexingDocId(null);
    }
  };

  const handleReindexAll = async () => {
    if (!confirm("Sinkronkan dan re-index semua dokumen kebijakan resmi Kabupaten Luwu (RTRW, Perbup, RPJMD, LPPD, IPRO)?")) return;

    setIsReindexingAll(true);
    addLog("SYNC", "Memulai sinkronisasi dan re-indexing masal seluruh kebijakan resmi...");

    try {
      const res = await fetch("/api/rag/reindex-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sinkronisasi gagal");
      
      addLog("SUCCESS", `Sinkronisasi selesai! ${data.policiesCount} dokumen regulasi (${data.totalChunksIndexed} chunks) telah diindeks.`);
      await fetchDocuments();
      await fetchStats();
      alert(data.message || "Seluruh kebijakan resmi berhasil diindeks!");
    } catch (err: any) {
      addLog("ERROR", `Sinkronisasi gagal: ${err.message}`);
      alert(`Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsReindexingAll(false);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Hapus dokumen "${title}" beserta seluruh vektor embeddingnya?`)) return;

    try {
      const res = await fetch(`/api/rag/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== docId));
        if (inspectingDoc?.id === docId) setInspectingDoc(null);
        await fetchStats();
      } else {
        alert("Gagal menghapus dokumen dari server.");
      }
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleInspectChunks = async (doc: KnowledgeDocument) => {
    setInspectingDoc(doc);
    setIsLoadingChunks(true);
    try {
      const res = await fetch(`/api/rag/chunks/${doc.id}`);
      const data = await res.json();
      if (res.ok) {
        setChunksList(data.chunks || []);
      } else {
        setChunksList([]);
      }
    } catch (err) {
      setChunksList([]);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  const handleRunGroundingTest = async (queryToRun?: string) => {
    const q = (queryToRun || testQuery).trim();
    if (!q) {
      alert("Masukkan pertanyaan untuk menguji RAG grounding.");
      return;
    }

    if (queryToRun) setTestQuery(queryToRun);
    setIsTestingGrounding(true);
    setTestError(null);
    setGroundingResult(null);

    try {
      const res = await fetch("/api/rag/test-grounding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Grounding test gagal");
      setGroundingResult(data);
    } catch (err: any) {
      setTestError(err.message || "Gagal menjalankan pengujian grounding");
    } finally {
      setIsTestingGrounding(false);
    }
  };

  const filteredDocs = docs.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.source_agency || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || d.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className={`shrink-0 border flex flex-col gap-4 p-5 rounded-2xl relative transition-all duration-300 ${
      isDarkMode 
        ? "bg-slate-900/90 border-slate-700/60 shadow-2xl text-slate-100" 
        : "bg-white border-slate-200/80 shadow-xl text-slate-800"
    }`} id="upload-rag-container">
      
      {/* Top Header & Architecture Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">RAG Knowledge Base & Vector Indexing Engine</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                1536-Dim Vector Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pengindeksan kebijakan resmi, RTRW, dan regulasi penanaman modal Pemkab Luwu untuk pembumian akurat rekomendasi AI.
            </p>
          </div>
        </div>

        {/* Global Quick Action */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleReindexAll}
            disabled={isReindexingAll}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            title="Sinkronkan seluruh basis kebijakan resmi Luwu"
          >
            {isReindexingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sinkronisasi...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sinkronkan Semua Kebijakan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("index")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "index"
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Indeks Dokumen & Berkas</span>
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "documents"
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Basis Dokumen ({docs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("testbench")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "testbench"
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>RAG Grounding Test Bench</span>
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "stats"
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Statistik Vektor</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INDEKS DOKUMEN & BERKAS */}
      {/* ========================================================================= */}
      {activeTab === "index" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Toggle Input Mode */}
            <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  uploadMode === "file"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Upload File (PDF / TXT)
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("direct_text")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  uploadMode === "direct_text"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Input Teks / Regulasi Langsung
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => {
                  setTitle("Perda Kab. Luwu No. 6/2011 tentang RTRW Kabupaten Luwu 2011-2031");
                  setCategory("tata_ruang");
                  setPublicationYear(2011);
                  setSourceAgency("Bappeda & Dinas PUPR Luwu");
                  if (uploadMode === "direct_text") {
                    setDirectContent(`Peraturan Daerah Kabupaten Luwu Nomor 6 Tahun 2011 tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu 2011-2031 menetapkan Kawasan Industri Bua di Kecamatan Bua seluas 1.000 Hektar untuk industri pengolahan nikel dan agroindustri. Kawasan pertanian pangan dilindungi di Lamasi dan Walenrang.`);
                  }
                }}
                className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer transition"
              >
                Perda RTRW No. 6/2011
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle("Perbup Luwu No. 53/2011 tentang Tata Cara Pelaksanaan RTRW & KKPR");
                  setCategory("regulasi");
                  setPublicationYear(2011);
                  setSourceAgency("Dinas PUPR & DPMPTSP Luwu");
                  if (uploadMode === "direct_text") {
                    setDirectContent(`Peraturan Bupati Luwu No. 53/2011 mengatur tata cara persetujuan KKPR melalui OSS DPMPTSP serta ketentuan sempadan sungai 50-100 meter pada Sungai Suso, Sungai Lamasi, dan Sungai Suli yang dilarang didirikan bangunan permanen.`);
                  }
                }}
                className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 cursor-pointer transition"
              >
                Perbup No. 53/2011
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle("RPJMD & Roadmap Hilirisasi Sektor Strategis Kabupaten Luwu");
                  setCategory("ekonomi");
                  setPublicationYear(2021);
                  setSourceAgency("Bappelitbangda Kabupaten Luwu");
                  if (uploadMode === "direct_text") {
                    setDirectContent(`Roadmap Hilirisasi Kabupaten Luwu menetapkan pengembangan pabrik pengolahan rumput laut terpadu di Larompong Selatan dan hilirisasi kakao fermentasi grade-A di koridor Belopa-Bajo.`);
                  }
                }}
                className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer transition"
              >
                RPJMD Hilirisasi
              </button>
            </div>

            {uploadMode === "file" ? (
              <form onSubmit={handleUploadFile} className="flex flex-col gap-3">
                <label className={`w-full py-6 px-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                  selectedFile
                    ? "bg-emerald-500/5 border-emerald-500/50"
                    : (isDarkMode ? "bg-slate-950/40 hover:bg-slate-800/80 border-slate-700" : "bg-slate-50 hover:bg-slate-100 border-slate-300")
                }`}>
                  <Upload className="w-6 h-6 text-emerald-500" />
                  <div className="text-center">
                    <span className="text-xs font-semibold block truncate max-w-xs">
                      {selectedFile ? selectedFile.name : "Pilih Dokumen Regulasi / RTRW (.pdf)"}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "Maksimal 50MB (PDF atau teks)"}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf,text/plain,.txt,.md"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploadStatus === "UPLOADING"}
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Judul Dokumen Resmi</label>
                    <input
                      type="text"
                      placeholder="Contoh: Peraturan Bupati tentang Insentif Investasi 2025"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      disabled={uploadStatus === "UPLOADING"}
                      className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent ${
                        isDarkMode ? "border-slate-700 text-white" : "border-slate-300 text-slate-900"
                      }`}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Kategori Dokumen</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as DocumentCategory)}
                      disabled={uploadStatus === "UPLOADING"}
                      className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                      }`}
                    >
                      <option value="regulasi">Regulasi & Perbup</option>
                      <option value="tata_ruang">Tata Ruang & RTRW</option>
                      <option value="ekonomi">Ekonomi & IPRO</option>
                      <option value="lingkungan">Lingkungan & Sempadan</option>
                      <option value="demografi">Demografi & BPS</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Tahun Penerbitan</label>
                    <input
                      type="number"
                      value={publicationYear}
                      onChange={e => setPublicationYear(Number(e.target.value))}
                      disabled={uploadStatus === "UPLOADING"}
                      className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent ${
                        isDarkMode ? "border-slate-700 text-white" : "border-slate-300 text-slate-900"
                      }`}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Instansi Penerbit / Sumber</label>
                    <input
                      type="text"
                      placeholder="Contoh: DPMPTSP Kabupaten Luwu / Bappelitbangda"
                      value={sourceAgency}
                      onChange={e => setSourceAgency(e.target.value)}
                      disabled={uploadStatus === "UPLOADING"}
                      className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent ${
                        isDarkMode ? "border-slate-700 text-white" : "border-slate-300 text-slate-900"
                      }`}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || uploadStatus === "UPLOADING"}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                    !selectedFile || uploadStatus === "UPLOADING"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-98"
                  }`}
                >
                  {uploadStatus === "UPLOADING" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Mengindeks Vektor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Indeks Berkas ke Basis Pengetahuan</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleIndexDirectText} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Judul Klausul / Peraturan</label>
                    <input
                      type="text"
                      placeholder="Judul regulasi atau pasal kebijakan..."
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      disabled={uploadStatus === "UPLOADING"}
                      className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent ${
                        isDarkMode ? "border-slate-700 text-white" : "border-slate-300 text-slate-900"
                      }`}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Kategori</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as DocumentCategory)}
                      disabled={uploadStatus === "UPLOADING"}
                      className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                      }`}
                    >
                      <option value="regulasi">Regulasi</option>
                      <option value="tata_ruang">Tata Ruang</option>
                      <option value="ekonomi">Ekonomi</option>
                      <option value="lingkungan">Lingkungan</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Tahun</label>
                    <input
                      type="number"
                      value={publicationYear}
                      onChange={e => setPublicationYear(Number(e.target.value))}
                      disabled={uploadStatus === "UPLOADING"}
                      className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent ${
                        isDarkMode ? "border-slate-700 text-white" : "border-slate-300 text-slate-900"
                      }`}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Instansi Penerbit</label>
                    <input
                      type="text"
                      placeholder="Dinas Penanaman Modal & PTSP Kabupaten Luwu"
                      value={sourceAgency}
                      onChange={e => setSourceAgency(e.target.value)}
                      disabled={uploadStatus === "UPLOADING"}
                      className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent ${
                        isDarkMode ? "border-slate-700 text-white" : "border-slate-300 text-slate-900"
                      }`}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Isi Teks / Klausul Kebijakan</label>
                    <textarea
                      rows={5}
                      placeholder="Ketik atau tempel teks pasal, zonasi ruang, insentif daerah, atau ketentuan izin di sini..."
                      value={directContent}
                      onChange={e => setDirectContent(e.target.value)}
                      disabled={uploadStatus === "UPLOADING"}
                      className={`px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent font-sans leading-relaxed ${
                        isDarkMode ? "border-slate-700 text-white" : "border-slate-300 text-slate-900"
                      }`}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!directContent.trim() || uploadStatus === "UPLOADING"}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                    !directContent.trim() || uploadStatus === "UPLOADING"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-98"
                  }`}
                >
                  {uploadStatus === "UPLOADING" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Mengindeks Teks...</span>
                    </>
                  ) : (
                    <>
                      <FileCode className="w-4 h-4" />
                      <span>Indeks Teks Kebijakan</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Area: Preview & Live Activity Logs (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Live Logs */}
            <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
              isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  Live Activity & Status
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                  uploadStatus === "completed"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : uploadStatus === "failed"
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}>
                  {uploadStatus}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">{statusMessage}</p>

              {/* Glowing Shimmer Progress Bar for Regulatory Document Indexing */}
              {uploadStatus === "UPLOADING" && (
                <div className="w-full space-y-1.5 my-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>MENGEKSTRAKSI & MEMBENTUK VEKTOR REGULASI...</span>
                    <span className="animate-pulse">1536-DIM</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative border border-emerald-500/30">
                    <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 w-full rounded-full shimmer-bar-glow" />
                  </div>
                </div>
              )}

              {logs.length > 0 && (
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-[10px] font-mono leading-tight">
                      <span className="text-slate-400 shrink-0">{log.timestamp}</span>
                      <span className="text-emerald-500 font-bold shrink-0">[{log.status}]</span>
                      <span className="text-slate-600 dark:text-slate-300 break-words">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PDF Preview If Available */}
            {pdfUrl ? (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex flex-col h-64">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-200/60 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    Pratinjau Berkas PDF
                  </span>
                  <button 
                    onClick={() => setPdfUrl(null)}
                    className="text-slate-400 hover:text-rose-500 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="flex-1"
                >
                  <div className="p-4 text-center text-xs text-slate-500">
                    Pratinjau PDF tidak didukung peramban. <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-emerald-500 underline">Buka Tab Baru</a>
                  </div>
                </object>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-2 text-slate-400 min-h-[160px]">
                <ShieldCheck className="w-7 h-7 text-emerald-500/60" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Pembumian Data Terverifikasi</span>
                <span className="text-[11px] max-w-xs text-slate-500">
                  Setiap dokumen yang diunggah akan otomatis di-chunking dan dipetakan ke vektor 1536-dimensi untuk rujukan AI.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BASIS DOKUMEN & CHUNKS */}
      {/* ========================================================================= */}
      {activeTab === "documents" && (
        <div className="flex flex-col gap-3">
          {/* Controls: Search & Category Filter */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari judul dokumen atau instansi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent ${
                  isDarkMode ? "border-slate-700 text-white" : "border-slate-300 text-slate-900"
                }`}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                }`}
              >
                <option value="all">Semua Kategori ({docs.length})</option>
                <option value="regulasi">Regulasi</option>
                <option value="tata_ruang">Tata Ruang</option>
                <option value="ekonomi">Ekonomi</option>
                <option value="lingkungan">Lingkungan</option>
                <option value="demografi">Demografi</option>
              </select>

              <button
                onClick={fetchDocuments}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Documents Table */}
          {isLoadingList ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-xs">Memuat daftar dokumen pengetahuan...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
              Tidak ada dokumen yang sesuai dengan filter.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${isDarkMode ? "bg-slate-950/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <th className="p-3 font-semibold">Judul Dokumen</th>
                    <th className="p-3 font-semibold">Kategori</th>
                    <th className="p-3 font-semibold">Instansi / Tahun</th>
                    <th className="p-3 font-semibold text-center">Chunks</th>
                    <th className="p-3 font-semibold text-center">Status RAG</th>
                    <th className="p-3 font-semibold text-center">Aktif</th>
                    <th className="p-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredDocs.map(doc => (
                    <tr key={doc.id} className={`hover:bg-slate-500/5 transition ${!doc.is_active ? "opacity-60" : ""}`}>
                      <td className="p-3 max-w-xs">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block line-clamp-2" title={doc.title}>
                              {doc.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {doc.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                          {doc.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px]">{doc.source_agency || "Pemkab Luwu"}</span>
                          <span className="text-[10px] text-slate-400">{doc.publication_year || "-"}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {doc.chunk_count || 0} chunks
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          doc.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : doc.status === "failed"
                              ? "bg-rose-500/10 text-rose-500"
                              : "bg-amber-500/10 text-amber-500 animate-pulse"
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleActive(doc)}
                          className={`w-8 h-4.5 rounded-full transition p-0.5 inline-flex items-center cursor-pointer ${
                            doc.is_active ? "bg-emerald-500 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                          }`}
                          title={doc.is_active ? "Nonaktifkan rujukan ini" : "Aktifkan rujukan ini"}
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm"></span>
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleInspectChunks(doc)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                            title="Lihat teks segmen (chunks) & embedding"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReindexDoc(doc.id)}
                            disabled={reindexingDocId === doc.id}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-cyan-500 transition cursor-pointer disabled:opacity-40"
                            title="Re-index vektor dokumen ini"
                          >
                            {reindexingDocId === doc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, doc.title)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-600 dark:text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="Hapus dokumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Chunk Inspector Modal / Drawer */}
          {inspectingDoc && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
                isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <div>
                      <h4 className="text-xs font-bold">Inspeksi Segmen Vektor (Chunks)</h4>
                      <p className="text-[10px] text-slate-500 truncate max-w-md">{inspectingDoc.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setInspectingDoc(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Chunks List */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {isLoadingChunks ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                      <span className="text-xs">Memuat segmen vektor...</span>
                    </div>
                  ) : chunksList.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      Belum ada chunk vektor yang dihasilkan untuk dokumen ini.
                    </div>
                  ) : (
                    chunksList.map(chunk => (
                      <div key={chunk.id} className={`p-3 rounded-xl border flex flex-col gap-2 ${
                        isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                          <span className="font-bold text-emerald-500">Chunk #{chunk.index}</span>
                          <div className="flex items-center gap-3">
                            <span>Halaman: {chunk.page_number}</span>
                            <span>Karakter: {chunk.charLength}</span>
                            <span>Estimasi Token: ~{chunk.tokenEstimate}</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                              {chunk.embeddingDim || 1536}-dim
                            </span>
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-sans">
                          {chunk.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total: {chunksList.length} chunks terindeks</span>
                  <button
                    onClick={() => setInspectingDoc(null)}
                    className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-medium"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RAG GROUNDING TEST BENCH */}
      {/* ========================================================================= */}
      {activeTab === "testbench" && (
        <div className="flex flex-col gap-4">
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            isDarkMode ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}>
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold block">Uji Materi Grounding Spasial & Kebijakan:</span>
              Panel ini mensimulasikan pencarian vektor semantik (k-NN similarity) dan membuktikan bahwa AI menjawab <strong>STRICTLY</strong> berlandaskan dokumen kebijakan Luwu yang terindeks, lengkap dengan kutipan pasal/regulasi resmi.
            </div>
          </div>

          {/* Search Query Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik pertanyaan terkait zonasi, RTRW, insentif, atau hilirisasi Luwu..."
                  value={testQuery}
                  onChange={e => setTestQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleRunGroundingTest(); }}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-transparent ${
                    isDarkMode ? "border-slate-700 text-white" : "border-slate-300 text-slate-900"
                  }`}
                />
              </div>
              <button
                onClick={() => handleRunGroundingTest()}
                disabled={isTestingGrounding || !testQuery.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isTestingGrounding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Uji Grounding</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Queries */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-semibold text-slate-400">Pertanyaan Sampel:</span>
              {SAMPLE_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunGroundingTest(q)}
                  className="px-2 py-1 rounded text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 hover:text-emerald-500 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition text-left cursor-pointer"
                >
                  {q.length > 45 ? q.substring(0, 45) + "..." : q}
                </button>
              ))}
            </div>
          </div>

          {/* Test Results Output */}
          {testError && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{testError}</span>
            </div>
          )}

          {groundingResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
              {/* Left Column: AI Grounded Synthesized Response (7 cols) */}
              <div className={`lg:col-span-7 p-4 rounded-xl border flex flex-col gap-3 ${
                isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
              }`}>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    Hasil Sintesis Jawaban Terbumi (Grounded AI)
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>Vektor: {groundingResult.searchDurationMs}ms</span>
                    <span>Total: {groundingResult.totalDurationMs}ms</span>
                  </div>
                </div>

                <div className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-sans">
                  {groundingResult.answer}
                </div>

                {/* Sources Citation Pills */}
                {groundingResult.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Sumber Dokumen Rujukan Resmi:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {groundingResult.sources.map((src, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Matched Chunks & Similarity Scores (5 cols) */}
              <div className={`lg:col-span-5 p-4 rounded-xl border flex flex-col gap-3 ${
                isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-500" />
                    Segmen Vektor Terpilih ({groundingResult.matchedChunks.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1536-dim k-NN</span>
                </div>

                <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {groundingResult.matchedChunks.map((chunk, idx) => (
                    <div key={idx} className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1.5 ${
                      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[180px]">
                          {chunk.documentTitle}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono font-bold">
                          Skor: {(chunk.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal line-clamp-4 font-sans">
                        "{chunk.content}"
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                        <span>Kategori: {chunk.category}</span>
                        <span>Hal: {chunk.pageNumber || 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STATISTIK & STATUS SISTEM */}
      {/* ========================================================================= */}
      {activeTab === "stats" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Dokumen</span>
              <span className="text-2xl font-bold text-emerald-500 font-mono">{stats?.totalDocuments || docs.length}</span>
              <span className="text-[10px] text-slate-400">Tersimpan di Supabase Knowledge</span>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Dokumen Aktif RAG</span>
              <span className="text-2xl font-bold text-cyan-500 font-mono">{stats?.activeDocuments || docs.filter(d => d.is_active).length}</span>
              <span className="text-[10px] text-slate-400">Dirujuk langsung dalam prompt AI</span>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Chunks Terindeks</span>
              <span className="text-2xl font-bold text-amber-500 font-mono">{stats?.totalChunks || 0}</span>
              <span className="text-[10px] text-slate-400">Segmen teks terpecah</span>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Arsitektur Vektor</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">1536-D</span>
              <span className="text-[10px] text-slate-400">pgvector cosine metric</span>
            </div>
          </div>

          {/* Category Distribution */}
          <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
            isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Distribusi Dokumen Kebijakan per Kategori
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Regulasi</span>
                <span className="text-base font-bold text-emerald-500 font-mono">{stats?.categoriesCount?.regulasi || 0}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tata Ruang</span>
                <span className="text-base font-bold text-cyan-500 font-mono">{stats?.categoriesCount?.tata_ruang || 0}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Ekonomi & IPRO</span>
                <span className="text-base font-bold text-amber-500 font-mono">{stats?.categoriesCount?.ekonomi || 0}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Lingkungan</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{stats?.categoriesCount?.lingkungan || 0}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Demografi BPS</span>
                <span className="text-base font-bold text-purple-400 font-mono">{stats?.categoriesCount?.demografi || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
