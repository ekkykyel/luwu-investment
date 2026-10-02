import React, { useState, useEffect } from "react";
import {
  Building2,
  UserPlus,
  Armchair,
  Info,
  Sliders,
  BarChart3,
  Radio,
  Monitor,
  Image as ImageIcon,
  Sparkles,
  Map,
  Store,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Activity,
  Newspaper,
  Quote,
  AlertTriangle,
  Phone,
  Globe,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Save,
  RefreshCw,
  Star,
  CheckCircle2,
  PlusCircle,
  X,
  Upload,
  Calendar,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertCircle,
  Sun,
  Moon
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { MPPTenant, MPPService } from "../../../types/mpp";
import { MppNewsItem, getStoredMppNews, saveMppNews, syncMppNewsWithServer } from "../../../data/mppNewsData";
import { MppSocialMediaAdminManager } from "../../mpp/MppSocialMediaAdminManager";
import { DEFAULT_OFFICIAL_MPP_FACILITIES, syncOrSeedMppFacilitiesToSupabase } from "../../../data/mppFacilitiesData";
import { ReprimandModal } from "../../mpp/ReprimandModal";

interface ImageUploadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

function ImageUploadField({ id, label, value, onChange, placeholder = "Seret & lepas foto di sini, atau klik untuk memilih" }: ImageUploadFieldProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Hanya file gambar yang didukung.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-1.5 w-full">
      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">{label}</span>
      <div
        id={id}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={`relative border border-dashed rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[95px] ${
          isDragActive 
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 scale-[0.99]" 
            : value 
              ? "border-slate-700 bg-slate-950/40 text-slate-300" 
              : "border-slate-800 bg-slate-950/20 hover:bg-slate-950/50 hover:border-slate-700 text-slate-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {value ? (
          <div className="flex items-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
            <img 
              src={value} 
              alt="Preview" 
              referrerPolicy="no-referrer"
              className="w-12 h-12 object-cover rounded-lg border border-slate-700 shadow-md flex-shrink-0" 
            />
            <div className="flex-1 min-w-0 text-left">
              <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mb-1">✓ File Siap</span>
              <p className="text-[9px] text-slate-400 truncate">Format Base64 Terpilih</p>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleButtonClick}
                  className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Ganti
                </button>
                <span className="text-slate-600 text-[9px]">|</span>
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="text-[9px] font-bold text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-1 pointer-events-none">
            <Upload className="w-4 h-4 mx-auto text-slate-500 animate-pulse" />
            <p className="text-[9px] font-medium leading-tight max-w-[200px] mx-auto text-slate-400">
              {placeholder}
            </p>
            <p className="text-[8px] text-slate-600">
              PNG, JPG, JPEG (Max 5MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortalMppManagement({ isDark: propIsDark }: { isDark?: boolean }) {
  const [isDark, setIsDark] = useState(() => {
    if (propIsDark !== undefined) return propIsDark;
    const saved = localStorage.getItem("luwu_admin_theme") || localStorage.getItem("mpp_portal_theme");
    return saved !== "light";
  });

  useEffect(() => {
    if (propIsDark !== undefined) {
      setIsDark(propIsDark);
    }
  }, [propIsDark]);

  useEffect(() => {
    localStorage.setItem("mpp_portal_theme", isDark ? "dark" : "light");
    localStorage.setItem("luwu_admin_theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Navigation Sub-tabs inside Kelola Portal MPP
  const [activeTab, setActiveTab] = useState<
    "gerai-operator" | "profil-fasilitas" | "kontrol-antrean" | "kemitraan-alur" | "feedback-pengaduan"
  >("gerai-operator");

  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const triggerStatus = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // TAB 1: GERAI & OPERATOR & LAYANAN STATE & OPERATIONS
  // ---------------------------------------------------------------------------
  const [tenants, setTenants] = useState<MPPTenant[]>([]);
  const [services, setServices] = useState<MPPService[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // Modals state
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [isReprimandModalOpen, setIsReprimandModalOpen] = useState(false);
  const [reprimandTargetTenantId, setReprimandTargetTenantId] = useState<string | null>(null);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingOperatorId, setEditingOperatorId] = useState<string | null>(null);

  // Form states
  const [tenantForm, setTenantForm] = useState({
    name: "",
    code: "",
    logo: "",
    floor: "Lantai 1",
    is_active: true,
    description: ""
  });

  const [serviceForm, setServiceForm] = useState({
    tenant_id: "",
    service_name: "",
    requirements: "",
    estimated_time_minutes: 15,
    is_active: true,
    photo_url: ""
  });

  const [operators, setOperators] = useState<any[]>([]);
  const [operatorForm, setOperatorForm] = useState({
    name: "",
    tenant_id: "",
    email: "",
    role: "staff",
    pin: ""
  });
  const [showOperatorPin, setShowOperatorPin] = useState(false);

  const fetchTenantsAndServices = async () => {
    setIsLoadingTenants(true);
    try {
      const { data: tenantData, error: tErr } = await supabase
        .from("mpp_tenants")
        .select("*")
        .order("name");
      if (tErr) throw tErr;

      const localPins = JSON.parse(localStorage.getItem('mpp_tenant_pins') || '{}');
      const mergedTenants = (tenantData || []).map(t => ({
        ...t,
        officer_pin: (t as any).officer_pin || (t as any).pin || localPins[t.id] || localPins[t.code] || ""
      }));
      setTenants(mergedTenants);

      if (tenantData && tenantData.length > 0) {
        const { data: serviceData, error: sErr } = await supabase
          .from("mpp_services")
          .select("*")
          .order("service_name");
        if (sErr) throw sErr;
        setServices(serviceData || []);
      }
    } catch (err: any) {
      console.error("Error fetching tenants/services:", err);
      triggerStatus("error", "Gagal memuat data gerai: " + err.message);
    } finally {
      setIsLoadingTenants(false);
    }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenantId) {
        // Edit mode
        const { error } = await supabase
          .from("mpp_tenants")
          .update({
            name: tenantForm.name,
            code: tenantForm.code.toUpperCase(),
            logo: tenantForm.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200",
            floor: tenantForm.floor,
            is_active: tenantForm.is_active,
            description: tenantForm.description
          })
          .eq("id", editingTenantId);

        if (error) throw error;

        triggerStatus("success", "Berhasil memperbarui profil gerai / instansi!");
      } else {
        // Create/Add mode
        const { error } = await supabase
          .from("mpp_tenants")
          .insert({
            name: tenantForm.name,
            code: tenantForm.code.toUpperCase(),
            logo: tenantForm.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200",
            floor: tenantForm.floor,
            is_active: tenantForm.is_active,
            description: tenantForm.description,
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        triggerStatus("success", "Berhasil menambahkan gerai/instansi baru!");
      }

      setIsTenantModalOpen(false);
      setEditingTenantId(null);
      setTenantForm({ name: "", code: "", logo: "", floor: "Lantai 1", is_active: true, description: "" });
      fetchTenantsAndServices();
    } catch (err: any) {
      triggerStatus("error", "Gagal menyimpan gerai: " + err.message);
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus gerai ini beserta seluruh layanannya?")) return;
    try {
      const { error } = await supabase.from("mpp_tenants").delete().eq("id", id);
      if (error) throw error;
      triggerStatus("success", "Gerai/instansi berhasil dihapus.");
      fetchTenantsAndServices();
    } catch (err: any) {
      triggerStatus("error", "Gagal menghapus gerai: " + err.message);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingServiceId) {
        // Edit mode
        const { error } = await supabase
          .from("mpp_services")
          .update({
            tenant_id: serviceForm.tenant_id,
            service_name: serviceForm.service_name,
            requirements: serviceForm.requirements,
            estimated_time_minutes: Number(serviceForm.estimated_time_minutes),
            is_active: serviceForm.is_active,
            name: serviceForm.service_name // map back compatibility
          })
          .eq("id", editingServiceId);

        if (error) throw error;

        // Sync local storage custom services for photos
        const customServices = JSON.parse(localStorage.getItem("mpp_portal_custom_services") || "[]");
        const existingIdx = customServices.findIndex((cs: any) => cs.service_name === serviceForm.service_name);
        const updatedPhoto = serviceForm.photo_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=400";
        if (existingIdx !== -1) {
          customServices[existingIdx] = {
            ...customServices[existingIdx],
            photo_url: updatedPhoto,
            requirements: serviceForm.requirements
          };
        } else {
          customServices.push({
            service_name: serviceForm.service_name,
            photo_url: updatedPhoto,
            requirements: serviceForm.requirements
          });
        }
        localStorage.setItem("mpp_portal_custom_services", JSON.stringify(customServices));

        triggerStatus("success", "Berhasil memperbarui layanan!");
      } else {
        // Create mode
        const { error } = await supabase.from("mpp_services").insert({
          tenant_id: serviceForm.tenant_id,
          service_name: serviceForm.service_name,
          requirements: serviceForm.requirements,
          estimated_time_minutes: Number(serviceForm.estimated_time_minutes),
          is_active: serviceForm.is_active,
          name: serviceForm.service_name // map back compatibility
        });

        if (error) throw error;

        // Save custom service photo & details locally to keep synced with portal
        const customServices = JSON.parse(localStorage.getItem("mpp_portal_custom_services") || "[]");
        customServices.push({
          service_name: serviceForm.service_name,
          photo_url: serviceForm.photo_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=400",
          requirements: serviceForm.requirements
        });
        localStorage.setItem("mpp_portal_custom_services", JSON.stringify(customServices));

        triggerStatus("success", "Berhasil menambahkan layanan baru!");
      }

      setIsServiceModalOpen(false);
      setEditingServiceId(null);
      setServiceForm({ tenant_id: "", service_name: "", requirements: "", estimated_time_minutes: 15, is_active: true, photo_url: "" });
      fetchTenantsAndServices();
    } catch (err: any) {
      triggerStatus("error", "Gagal menyimpan layanan: " + err.message);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus layanan ini?")) return;
    try {
      const { error } = await supabase.from("mpp_services").delete().eq("id", id);
      if (error) throw error;
      triggerStatus("success", "Layanan berhasil dihapus.");
      fetchTenantsAndServices();
    } catch (err: any) {
      triggerStatus("error", "Gagal menghapus layanan: " + err.message);
    }
  };

  const loadOperators = async () => {
    const localOpPins = JSON.parse(localStorage.getItem("mpp_operator_pins") || "{}");

    try {
      // Load from Supabase mpp_tenant_users table
      const { data: tenantUsers, error: tuErr } = await supabase
        .from("mpp_tenant_users")
        .select("*");

      if (!tuErr && tenantUsers && tenantUsers.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name, email");
        const { data: tens } = await supabase.from("mpp_tenants").select("id, name, code");

        const profMap = new globalThis.Map((profs || []).map(p => [p.id, p]));
        const tenMap = new globalThis.Map((tens || []).map(t => [t.id, t]));

        const mappedOps = tenantUsers.map(tu => {
          const prof = profMap.get(tu.user_id);
          const ten = tenMap.get(tu.tenant_id);
          const opEmail = prof?.email || "";
          return {
            id: tu.id,
            user_id: tu.user_id,
            tenant_id: tu.tenant_id,
            name: prof?.full_name || "Operator Gerai",
            tenant: ten?.name || "Gerai MPP",
            tenant_code: ten?.code || "",
            email: opEmail,
            role: tu.role || "staff",
            pin: localOpPins[opEmail.toLowerCase()] || localOpPins[tu.user_id] || localOpPins[tu.id] || ""
          };
        });

        setOperators(mappedOps);
        localStorage.setItem("mpp_portal_operators", JSON.stringify(mappedOps));
        return;
      }
    } catch (err) {
      console.warn("Could not fetch operators from Supabase mpp_tenant_users:", err);
    }

    // Fallback to localStorage if Supabase is empty or not populated yet
    const savedOps = JSON.parse(localStorage.getItem("mpp_portal_operators") || "[]");
    if (savedOps.length === 0) {
      const initial = [
        { id: "1", name: "ALDI", tenant: "Badan Pertanahan Nasional", tenant_code: "BPN", email: "bpn@luwukab.go.id", role: "admin", pin: "BPN2026@" },
        { id: "2", name: "Andi Saputra", tenant: "Dinas Kependudukan & Pencatatan Sipil", tenant_code: "DISDUKCAPIL", email: "andi@capil.luwukab.go.id", role: "staff", pin: "Capil123!" },
        { id: "3", name: "Riska Handayani", tenant: "DPMPTSP Kab. Luwu", tenant_code: "DPMPTSP", email: "riska@dpmptsp.go.id", role: "admin", pin: "Dpmptsp123!" }
      ];
      localStorage.setItem("mpp_portal_operators", JSON.stringify(initial));
      initial.forEach(o => {
        if (o.pin) localOpPins[o.email.toLowerCase()] = o.pin;
      });
      localStorage.setItem("mpp_operator_pins", JSON.stringify(localOpPins));
      setOperators(initial);
    } else {
      const withPins = savedOps.map((o: any) => ({
        ...o,
        pin: o.pin || localOpPins[o.email?.toLowerCase()] || localOpPins[o.user_id] || localOpPins[o.id] || ""
      }));
      setOperators(withPins);
    }
  };

  const handleSaveOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedTenant = tenants.find(t => t.id === operatorForm.tenant_id);
      const tenantName = selectedTenant?.name || "Gerai MPP";
      const tenantCode = selectedTenant?.code || "";
      const cleanEmail = operatorForm.email.trim();
      const cleanName = operatorForm.name.trim();
      const cleanPin = operatorForm.pin ? operatorForm.pin.trim() : "";

      // 1. Sync ke Supabase tabel 'profiles'
      let targetUserId = "";
      const { data: existingProf } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existingProf) {
        targetUserId = existingProf.id;
        try {
          await supabase
            .from("profiles")
            .update({
              full_name: cleanName,
              role: "operator_gerai",
              pin: cleanPin || undefined
            })
            .eq("id", targetUserId);
        } catch {
          await supabase
            .from("profiles")
            .update({
              full_name: cleanName,
              role: "operator_gerai"
            })
            .eq("id", targetUserId);
        }
      } else {
        const generatedId = crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`;
        try {
          const { data: insertedProf, error: pErr } = await supabase
            .from("profiles")
            .insert({
              id: generatedId,
              full_name: cleanName,
              email: cleanEmail,
              role: "operator_gerai",
              pin: cleanPin || undefined,
              created_at: new Date().toISOString()
            })
            .select("id")
            .single();

          if (!pErr && insertedProf) {
            targetUserId = insertedProf.id;
          } else {
            targetUserId = generatedId;
          }
        } catch {
          const { data: insertedProf2 } = await supabase
            .from("profiles")
            .insert({
              id: generatedId,
              full_name: cleanName,
              email: cleanEmail,
              role: "operator_gerai",
              created_at: new Date().toISOString()
            })
            .select("id")
            .single();
          targetUserId = insertedProf2?.id || generatedId;
        }
      }

      // 2. Insert / Update ke Supabase tabel 'mpp_tenant_users'
      if (targetUserId && operatorForm.tenant_id) {
        try {
          const { data: existingTu } = await supabase
            .from("mpp_tenant_users")
            .select("id")
            .eq("user_id", targetUserId)
            .eq("tenant_id", operatorForm.tenant_id)
            .maybeSingle();

          if (existingTu) {
            await supabase
              .from("mpp_tenant_users")
              .update({
                role: operatorForm.role
              })
              .eq("id", existingTu.id);
          } else {
            await supabase
              .from("mpp_tenant_users")
              .insert({
                user_id: targetUserId,
                tenant_id: operatorForm.tenant_id,
                role: operatorForm.role,
                created_at: new Date().toISOString()
              });
          }
        } catch (tuErr) {
          console.warn("Could not insert to Supabase mpp_tenant_users:", tuErr);
        }
      }

      // Simpan PIN ke local storage map
      const opPins = JSON.parse(localStorage.getItem('mpp_operator_pins') || '{}');
      if (cleanPin) {
        opPins[cleanEmail.toLowerCase()] = cleanPin;
        if (targetUserId) opPins[targetUserId] = cleanPin;
        localStorage.setItem('mpp_operator_pins', JSON.stringify(opPins));
      }

      // 3. Update local state & localStorage
      const existingOp = editingOperatorId ? operators.find(o => o.id === editingOperatorId) : null;
      const finalPin = cleanPin || existingOp?.pin || opPins[cleanEmail.toLowerCase()] || "";

      const newOp = {
        id: editingOperatorId || targetUserId || Date.now().toString(),
        user_id: targetUserId,
        name: cleanName,
        tenant: tenantName,
        tenant_code: tenantCode,
        tenant_id: operatorForm.tenant_id,
        email: cleanEmail,
        role: operatorForm.role,
        pin: finalPin
      };

      let updated;
      if (editingOperatorId) {
        updated = operators.map(op => op.id === editingOperatorId ? newOp : op);
      } else {
        updated = [...operators, newOp];
      }

      localStorage.setItem("mpp_portal_operators", JSON.stringify(updated));
      setOperators(updated);
      setIsOperatorModalOpen(false);
      setEditingOperatorId(null);
      setOperatorForm({ name: "", tenant_id: "", email: "", role: "staff", pin: "" });
      triggerStatus("success", `Berhasil menyimpan akun operator ${cleanName} (${tenantName}) ke database Supabase (mpp_tenant_users)!`);
    } catch (err: any) {
      console.error("Error saving operator:", err);
      triggerStatus("error", "Gagal menyimpan operator: " + (err.message || "Terjadi kesalahan."));
    }
  };

  const handleDeleteOperator = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menonaktifkan operator ini?")) return;
    try {
      await supabase.from("mpp_tenant_users").delete().eq("id", id);
      await supabase.from("mpp_tenant_users").delete().eq("user_id", id);
    } catch (err) {
      console.warn("Could not delete operator from Supabase mpp_tenant_users:", err);
    }
    const updated = operators.filter(op => op.id !== id);
    localStorage.setItem("mpp_portal_operators", JSON.stringify(updated));
    setOperators(updated);
    triggerStatus("success", "Operator gerai berhasil dinonaktifkan.");
  };

  // ---------------------------------------------------------------------------
  // TAB 2: PROFIL & FASILITAS STATE & OPERATIONS
  // ---------------------------------------------------------------------------
  const [profile, setProfile] = useState({
    mpp_name: "Mal Pelayanan Publik (MPP) Simpurusiang",
    mpp_address: "Jl. Simpurusiang No. 45, Senga, Kec. Belopa, Kabupaten Luwu, Sulawesi Selatan 91994",
    welcome_text: "Satu Pintu, Sejuta Kemudahan Untuk Warga Luwu",
    vision: "Menjadi penyelenggara pelayanan publik prima yang profesional, akuntabel, transparan, dan berbasis teknologi informasi menuju Kabupaten Luwu yang maju dan sejahtera.",
    mission: "1. Meningkatkan kualitas SDM pelayanan yang ramah, sopan, dan solutif.\n2. Mengintegrasikan seluruh layanan instansi vertikal dan daerah dalam satu sistem.\n3. Mewujudkan tata kelola birokrasi perizinan yang bebas pungli dan cepat.",
    coordinates_lat: "-3.4116",
    coordinates_lng: "120.3550"
  });

  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilityForm, setFacilityForm] = useState({
    name: "",
    photo: "",
    desc: "",
    floor: "Lantai 1"
  });

  const [floorPlan, setFloorPlan] = useState({
    title: "Interactive 3D Floor Plan & Facility Navigator",
    photo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    desc: "Panduan navigasi digital interaktif lantai 1 dan 2 Gedung Simpurusiang MPP Luwu memudahkan investor, disabilitas, dan warga umum menemukan loket layanan dalam hitungan detik."
  });

  const loadProfileAndFacilities = async () => {
    const savedProf = JSON.parse(localStorage.getItem("mpp_portal_profile") || "null");
    if (savedProf) setProfile(savedProf);

    // Also fetch from /api/site-settings for cross-device persistence
    try {
      const settingsRes = await fetch('/api/site-settings?keys=mpp_portal_profile,mpp_portal_floorplan');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData && typeof settingsData === 'object') {
          if (settingsData.mpp_portal_profile) {
            const parsedP = typeof settingsData.mpp_portal_profile === 'string' 
              ? JSON.parse(settingsData.mpp_portal_profile) 
              : settingsData.mpp_portal_profile;
            setProfile(parsedP);
            localStorage.setItem("mpp_portal_profile", JSON.stringify(parsedP));
          }
          if (settingsData.mpp_portal_floorplan) {
            const parsedF = typeof settingsData.mpp_portal_floorplan === 'string' 
              ? JSON.parse(settingsData.mpp_portal_floorplan) 
              : settingsData.mpp_portal_floorplan;
            setFloorPlan(parsedF);
            localStorage.setItem("mpp_portal_floorplan", JSON.stringify(parsedF));
          }
        }
      }
    } catch (e) {
      console.warn("Notice loading site_settings for profile/floorplan:", e);
    }

    try {
      const { data, error } = await supabase
        .from("mpp_facilities")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        setFacilities(
          data.map((f: any) => ({
            id: f.id,
            name: f.name,
            photo: f.image_url || "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=400",
            desc: f.description,
            floor: f.floor || "Lantai 1"
          }))
        );
      } else {
        setFacilities(
          DEFAULT_OFFICIAL_MPP_FACILITIES.map(f => ({
            id: f.id,
            name: f.name,
            photo: f.image,
            desc: f.description,
            floor: f.floor
          }))
        );
      }
    } catch {
      setFacilities(
        DEFAULT_OFFICIAL_MPP_FACILITIES.map(f => ({
          id: f.id,
          name: f.name,
          photo: f.image,
          desc: f.description,
          floor: f.floor
        }))
      );
    }

    const savedFloor = JSON.parse(localStorage.getItem("mpp_portal_floorplan") || "null");
    if (savedFloor) setFloorPlan(savedFloor);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("mpp_portal_profile", JSON.stringify(profile));
    try {
      await fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting_key: 'mpp_portal_profile',
          setting_value: JSON.stringify(profile)
        })
      });
    } catch (err) {
      console.warn("Failed to sync profile to site_settings:", err);
    }
    triggerStatus("success", "Profil & Maklumat MPP berhasil diperbarui dan tersimpan di database!");
  };

  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    const photoUrl = facilityForm.photo || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400";
    try {
      const { data, error } = await supabase
        .from("mpp_facilities")
        .insert({
          name: facilityForm.name,
          floor: facilityForm.floor,
          description: facilityForm.desc,
          image_url: photoUrl
        })
        .select()
        .single();
      
      const newFac = data ? {
        id: data.id,
        name: data.name,
        photo: data.image_url || photoUrl,
        desc: data.description,
        floor: data.floor
      } : {
        id: Date.now().toString(),
        name: facilityForm.name,
        photo: photoUrl,
        desc: facilityForm.desc,
        floor: facilityForm.floor
      };
      const updated = [...facilities, newFac];
      localStorage.setItem("mpp_portal_facilities", JSON.stringify(updated));
      setFacilities(updated);
      setFacilityForm({ name: "", photo: "", desc: "", floor: "Lantai 1" });
      triggerStatus("success", "Fasilitas baru berhasil ditambahkan ke database!");
    } catch (err: any) {
      triggerStatus("error", `Gagal menyimpan fasilitas: ${err?.message || "Error"}`);
    }
  };

  const handleDeleteFacility = async (id: string) => {
    if (!window.confirm("Hapus fasilitas ini?")) return;
    try {
      await supabase.from("mpp_facilities").delete().eq("id", id);
      const updated = facilities.filter(f => f.id !== id);
      localStorage.setItem("mpp_portal_facilities", JSON.stringify(updated));
      setFacilities(updated);
      triggerStatus("success", "Fasilitas berhasil dihapus dari database.");
    } catch (err: any) {
      triggerStatus("error", `Gagal menghapus fasilitas: ${err?.message || "Error"}`);
    }
  };

  const handleSyncStandardFacilities = async () => {
    try {
      const res = await syncOrSeedMppFacilitiesToSupabase();
      const { data } = await supabase
        .from("mpp_facilities")
        .select("*")
        .order("created_at", { ascending: true });
      if (data && data.length > 0) {
        setFacilities(
          data.map((f: any) => ({
            id: f.id,
            name: f.name,
            photo: f.image_url || "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=400",
            desc: f.description,
            floor: f.floor || "Lantai 1"
          }))
        );
      }
      triggerStatus("success", `Sinkronisasi berhasil! ${res.count > 0 ? `${res.count} fasilitas resmi ditambahkan ke database.` : 'Seluruh 9 fasilitas standar telah lengkap di database.'}`);
    } catch (err: any) {
      triggerStatus("error", `Gagal sinkronisasi: ${err?.message || "Error"}`);
    }
  };

  const handleSaveFloorPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("mpp_portal_floorplan", JSON.stringify(floorPlan));
    try {
      await fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting_key: 'mpp_portal_floorplan',
          setting_value: JSON.stringify(floorPlan)
        })
      });
    } catch (err) {
      console.warn("Failed to sync floorplan to site_settings:", err);
    }
    triggerStatus("success", "Denah Interactive 3D & Fasilitas berhasil diperbarui dan tersimpan di database!");
  };

  // ---------------------------------------------------------------------------
  // TAB 3: KONTROL ANTREAN & LAYANAN MANDIRI OPERATIONS
  // ---------------------------------------------------------------------------
  const [queueStatus, setQueueStatus] = useState({
    is_active: true,
    max_online_queues: 250,
    current_number_a: 42,
    current_number_b: 15,
    last_reset: "12 September 2026 08:00 WITA"
  });

  const [kioskSettings, setKioskSettings] = useState({
    is_online: true,
    is_maintenance: false,
    welcome_message_id: "SELAMAT DATANG DI LAYANAN MANDIRI MPP LUWU",
    welcome_message_en: "WELCOME TO LUWU REGENCY SELF-SERVICE KIOSK"
  });

  const loadKioskAndQueue = () => {
    const savedQueue = JSON.parse(localStorage.getItem("mpp_queue_control_settings") || "null");
    if (savedQueue) setQueueStatus(savedQueue);

    const savedKiosk = JSON.parse(localStorage.getItem("mpp_kiosk_control_settings") || "null");
    if (savedKiosk) setKioskSettings(savedKiosk);
  };

  const handleSaveQueueSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("mpp_queue_control_settings", JSON.stringify(queueStatus));
    triggerStatus("success", "Kontrol operasional antrean berhasil diperbarui!");
  };

  const handleSaveKioskSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("mpp_kiosk_control_settings", JSON.stringify(kioskSettings));
    triggerStatus("success", "Kontrol Layanan Mandiri (Kiosk) berhasil disinkronkan!");
  };

  // ---------------------------------------------------------------------------
  // TAB 4: KEMITRAAN UMKM & ALUR PELAYANAN & BERITA
  // ---------------------------------------------------------------------------
  const [umkmList, setUmkmList] = useState<any[]>([]);
  const [umkmForm, setUmkmForm] = useState({
    name: "",
    owner: "",
    photo: "",
    category: "Kuliner",
    wa: "628"
  });

  const [flowSteps, setFlowSteps] = useState<any[]>([]);
  const [flowForm, setFlowForm] = useState({
    step: 1,
    title: "",
    desc: ""
  });

  const [newsList, setNewsList] = useState<any[]>([]);
  const [newsForm, setNewsForm] = useState({
    title: "",
    content: "",
    photo: "",
    category: "Pemerintahan"
  });

  const loadKemitraanAlurNews = async () => {
    try {
      const { data: umkmData, error: uErr } = await supabase
        .from("mpp_umkm")
        .select("*")
        .order("created_at", { ascending: true });
      if (!uErr && umkmData) {
        setUmkmList(
          umkmData.map((u: any) => ({
            id: u.id,
            name: u.name,
            owner: u.owner_name,
            photo: u.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400",
            category: u.category || "Kuliner",
            wa: u.whatsapp || "628"
          }))
        );
      } else {
        const savedUmkm = JSON.parse(localStorage.getItem("mpp_portal_umkm") || "[]");
        setUmkmList(savedUmkm);
      }
    } catch {
      const savedUmkm = JSON.parse(localStorage.getItem("mpp_portal_umkm") || "[]");
      setUmkmList(savedUmkm);
    }

    try {
      const { data: flowData, error: fErr } = await supabase
        .from("mpp_flow")
        .select("*")
        .order("step_number", { ascending: true });
      if (!fErr && flowData && flowData.length > 0) {
        setFlowSteps(
          flowData.map((f: any) => ({
            id: f.id,
            step: f.step_number,
            title: f.title,
            desc: f.description
          }))
        );
      } else {
        const savedFlow = JSON.parse(localStorage.getItem("mpp_portal_flow") || "[]");
        setFlowSteps(savedFlow);
      }
    } catch {
      const savedFlow = JSON.parse(localStorage.getItem("mpp_portal_flow") || "[]");
      setFlowSteps(savedFlow);
    }

    const savedNews = getStoredMppNews();
    setNewsList(savedNews);
    syncMppNewsWithServer().then((res) => {
      if (res && res.length > 0) {
        setNewsList(res);
      }
    });
  };

  const handleAddUmkm = async (e: React.FormEvent) => {
    e.preventDefault();
    const photoUrl = umkmForm.photo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400";
    try {
      const { data, error } = await supabase
        .from("mpp_umkm")
        .insert({
          name: umkmForm.name,
          owner_name: umkmForm.owner,
          category: umkmForm.category,
          whatsapp: umkmForm.wa,
          image_url: photoUrl,
          is_active: true
        })
        .select()
        .single();
      
      const newItem = data ? {
        id: data.id,
        name: data.name,
        owner: data.owner_name,
        photo: data.image_url || photoUrl,
        category: data.category,
        wa: data.whatsapp
      } : {
        id: Date.now().toString(),
        name: umkmForm.name,
        owner: umkmForm.owner,
        photo: photoUrl,
        category: umkmForm.category,
        wa: umkmForm.wa
      };

      const updated = [...umkmList, newItem];
      localStorage.setItem("mpp_portal_umkm", JSON.stringify(updated));
      setUmkmList(updated);
      setUmkmForm({ name: "", owner: "", photo: "", category: "Kuliner", wa: "628" });
      triggerStatus("success", "Kemitraan produk UMKM berhasil ditambahkan ke database!");
    } catch (err: any) {
      triggerStatus("error", `Gagal menyimpan UMKM: ${err?.message || "Error"}`);
    }
  };

  const handleDeleteUmkm = async (id: string) => {
    if (!window.confirm("Hapus UMKM ini dari galeri portal?")) return;
    try {
      await supabase.from("mpp_umkm").delete().eq("id", id);
      const updated = umkmList.filter(u => u.id !== id);
      localStorage.setItem("mpp_portal_umkm", JSON.stringify(updated));
      setUmkmList(updated);
      triggerStatus("success", "Produk UMKM berhasil dihapus dari database.");
    } catch (err: any) {
      triggerStatus("error", `Gagal menghapus UMKM: ${err?.message || "Error"}`);
    }
  };

  const handleAddFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const stepNum = Number(flowForm.step) || (flowSteps.length + 1);
      const { data, error } = await supabase
        .from("mpp_flow")
        .insert({
          step_number: stepNum,
          title: flowForm.title,
          description: flowForm.desc,
          icon_name: "CheckCircle"
        })
        .select()
        .single();
      
      const newItem = data ? {
        id: data.id,
        step: data.step_number,
        title: data.title,
        desc: data.description
      } : {
        id: Date.now().toString(),
        step: stepNum,
        title: flowForm.title,
        desc: flowForm.desc
      };

      const updated = [...flowSteps, newItem].sort((a, b) => a.step - b.step);
      localStorage.setItem("mpp_portal_flow", JSON.stringify(updated));
      setFlowSteps(updated);
      setFlowForm({ step: flowSteps.length + 2, title: "", desc: "" });
      triggerStatus("success", "Langkah alur pelayanan baru berhasil ditambahkan ke database!");
    } catch (err: any) {
      triggerStatus("error", `Gagal menyimpan alur: ${err?.message || "Error"}`);
    }
  };

  const handleDeleteFlow = async (id: string) => {
    if (!window.confirm("Hapus langkah alur pelayanan ini?")) return;
    try {
      await supabase.from("mpp_flow").delete().eq("id", id);
      const updated = flowSteps.filter(f => f.id !== id);
      localStorage.setItem("mpp_portal_flow", JSON.stringify(updated));
      setFlowSteps(updated);
      triggerStatus("success", "Alur pelayanan berhasil dihapus dari database.");
    } catch (err: any) {
      triggerStatus("error", `Gagal menghapus alur: ${err?.message || "Error"}`);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryMapped = 
      newsForm.category === "Pemerintahan" || newsForm.category === "Pengumuman"
        ? "Berita Daerah"
        : newsForm.category === "Kegiatan"
        ? "Giat Kegiatan MPP"
        : (newsForm.category as any) || "Giat Kegiatan MPP";

    const newNewsItem: MppNewsItem = {
      id: `news-${Date.now()}`,
      judul: newsForm.title,
      ringkasan: newsForm.content.length > 180 ? newsForm.content.slice(0, 180) + "..." : newsForm.content,
      isiLengkap: newsForm.content,
      image: newsForm.photo || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      kategori: categoryMapped,
      penulis: "Admin MPP Luwu",
      tanggal: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      status: "published",
      isPinned: false,
      viewsCount: 1
    };

    try {
      // POST single news item directly to server which inserts into Supabase news table
      const res = await fetch('/api/mpp-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNewsItem)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setNewsList(json.data);
          saveMppNews(json.data);
        } else {
          const updated = [newNewsItem, ...newsList];
          saveMppNews(updated);
          setNewsList(updated);
        }
      } else {
        const updated = [newNewsItem, ...newsList];
        saveMppNews(updated);
        setNewsList(updated);
      }
    } catch {
      const updated = [newNewsItem, ...newsList];
      saveMppNews(updated);
      setNewsList(updated);
    }
    setNewsForm({ title: "", content: "", photo: "", category: "Pemerintahan" });
    triggerStatus("success", "Berita atau Pengumuman baru berhasil diterbitkan dan tersimpan di database!");
  };

  const handleDeleteNews = async (id: string) => {
    if (!window.confirm("Hapus berita/pengumuman ini?")) return;
    try {
      await fetch(`/api/mpp-news/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn("Failed to delete news from /api/mpp-news:", err);
    }
    const updated = newsList.filter(n => String(n.id) !== String(id));
    saveMppNews(updated);
    setNewsList(updated);
    triggerStatus("success", "Berita berhasil dihapus dari database.");
  };

  // ---------------------------------------------------------------------------
  // TAB 5: SKM, PENGADUAN, TESTIMONI & KONTAK
  // ---------------------------------------------------------------------------
  const [complaints, setComplaints] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [contacts, setContacts] = useState({
    maps_embed_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.564129939!2d120.3550!3d-3.4116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMjQnNDEuOCJTIDEyMMKwMjEnMTguMCJF!5e0!3m2!1sid!2sid!4v1620000000000!5m2!1sid!2sid",
    working_hours_mon_thu: "Senin - Kamis: 07:30 - 16:00 WITA",
    working_hours_fri: "Jumat: 07:30 - 16:30 WITA",
    phone: "0811-4200-8899",
    email: "dpmptsp@luwukab.go.id",
    instagram: "https://instagram.com/dpmptspluwu",
    facebook: "https://facebook.com/dpmptspluwu",
    youtube: "https://youtube.com/dpmptspluwu"
  });

  const loadFeedbackAndContacts = async () => {
    try {
      const { data: compData } = await supabase
        .from("pengaduan")
        .select("*")
        .order("created_at", { ascending: false });
      if (compData && compData.length > 0) {
        setComplaints(
          compData.map((c: any) => ({
            id: c.id,
            sender: c.nama_pelapor || c.sender || "Warga Luwu",
            nik: c.kontak_pelapor || c.nik || "-",
            category: c.kategori_pengaduan || c.jenis_aduan || c.kategori || "Layanan",
            issue: c.deskripsi_masalah || c.isi_laporan || c.pesan || c.issue || "Tidak ada deskripsi",
            status: c.status || "Diproses",
            date: new Date(c.created_at || Date.now()).toLocaleDateString("id-ID")
          }))
        );
      } else {
        const savedComplaints = JSON.parse(localStorage.getItem("mpp_portal_complaints") || "[]");
        setComplaints(savedComplaints);
      }
    } catch {
      const savedComplaints = JSON.parse(localStorage.getItem("mpp_portal_complaints") || "[]");
      setComplaints(savedComplaints);
    }

    try {
      const { data: testData } = await supabase
        .from("investor_testimonials")
        .select("*")
        .order("created_at", { ascending: false });
      if (testData && testData.length > 0) {
        setTestimonials(
          testData.map((t: any) => ({
            id: t.id,
            author: t.investor_name || t.author,
            role: t.company || t.role || "Masyarakat",
            comment: t.content || t.comment,
            rating: t.rating || 5,
            approved: t.is_approved !== false
          }))
        );
      } else {
        const savedTestimonials = JSON.parse(localStorage.getItem("mpp_portal_testimonials") || "[]");
        setTestimonials(savedTestimonials);
      }
    } catch {
      const savedTestimonials = JSON.parse(localStorage.getItem("mpp_portal_testimonials") || "[]");
      setTestimonials(savedTestimonials);
    }

    try {
      const { data: contData } = await supabase
        .from("mpp_contacts")
        .select("*");
      if (contData && contData.length > 0) {
        const wa = contData.find((c: any) => c.channel_name?.toLowerCase().includes("whatsapp") || c.channel_name?.toLowerCase().includes("wa"));
        const phone = contData.find((c: any) => c.channel_name?.toLowerCase().includes("helpdesk") || c.channel_name?.toLowerCase().includes("telepon") || c.channel_name?.toLowerCase().includes("phone"));
        const email = contData.find((c: any) => c.channel_name?.toLowerCase().includes("email"));
        setContacts(prev => ({
          ...prev,
          phone: wa?.value || phone?.value || prev.phone,
          email: email?.value || prev.email
        }));
      } else {
        const savedContacts = JSON.parse(localStorage.getItem("mpp_portal_contacts") || "null");
        if (savedContacts) setContacts(savedContacts);
      }
    } catch {
      const savedContacts = JSON.parse(localStorage.getItem("mpp_portal_contacts") || "null");
      if (savedContacts) setContacts(savedContacts);
    }

    // Load social media settings
    try {
      const savedSocial = localStorage.getItem("mpp_social_media_settings_v1");
      if (savedSocial) {
        const parsedS = JSON.parse(savedSocial);
        setContacts(prev => ({
          ...prev,
          instagram: parsedS.instagram || prev.instagram,
          facebook: parsedS.facebook || prev.facebook,
          youtube: parsedS.youtube || prev.youtube
        }));
      }
    } catch (e) {}
  };

  const handleUpdateComplaintStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from("pengaduan").update({ status: newStatus }).eq("id", id);
    } catch (err) {
      console.error("Error updating complaint in db:", err);
    }
    const updated = complaints.map(c => c.id === id ? { ...c, status: newStatus } : c);
    localStorage.setItem("mpp_portal_complaints", JSON.stringify(updated));
    setComplaints(updated);
    triggerStatus("success", `Status pengaduan berhasil diperbarui ke: ${newStatus}`);
  };

  const handleToggleTestimonialApproval = async (id: string) => {
    const item = testimonials.find(t => t.id === id);
    const newApproved = item ? !item.approved : true;
    try {
      await supabase.from("investor_testimonials").update({ is_approved: newApproved }).eq("id", id);
    } catch (err) {
      console.error("Error updating testimonial in db:", err);
    }
    const updated = testimonials.map(t => t.id === id ? { ...t, approved: !t.approved } : t);
    localStorage.setItem("mpp_portal_testimonials", JSON.stringify(updated));
    setTestimonials(updated);
    triggerStatus("success", "Sertifikasi persetujuan testimoni berhasil diubah.");
  };

  const handleSaveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Upsert into mpp_contacts
      await supabase.from("mpp_contacts").upsert([
        {
          channel_name: "WhatsApp Pengaduan Resmi",
          value: contacts.phone,
          description: "Layanan respon cepat pengaduan masyarakat MPP",
          is_active: true
        },
        {
          channel_name: "Email Resmi DPMPTSP",
          value: contacts.email,
          description: "Surel resmi perizinan dan konsultasi",
          is_active: true
        }
      ], { onConflict: "channel_name" });

      // Save social media
      const socialPayload = {
        instagram: contacts.instagram,
        facebook: contacts.facebook,
        youtube: contacts.youtube,
        tiktok: "https://tiktok.com/@dpmptspluwu",
        twitter: "https://x.com/dpmptspluwu"
      };
      localStorage.setItem("mpp_social_media_settings_v1", JSON.stringify(socialPayload));
      window.dispatchEvent(new CustomEvent('mpp_social_media_updated', { detail: socialPayload }));
      await fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting_key: 'mpp_social_media',
          setting_value: JSON.stringify(socialPayload)
        })
      });
    } catch (err) {
      console.error("Error saving contacts to db:", err);
    }
    localStorage.setItem("mpp_portal_contacts", JSON.stringify(contacts));
    triggerStatus("success", "Informasi kontak, jam layanan, & media sosial berhasil disinkronkan ke database!");
  };

  // ---------------------------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchTenantsAndServices();
    loadOperators();
    loadProfileAndFacilities();
    loadKioskAndQueue();
    loadKemitraanAlurNews();
    loadFeedbackAndContacts();
  }, []);

  return (
    <div id="mpp-dashboard-root" className={`space-y-6 animate-in fade-in duration-300 pb-16 transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      {/* Injected Style overrides for Android & Light/Dark Theme compatibility kawan */}
      <style>{`
        /* Android Friendly & Touch targets */
        @media (max-width: 640px) {
          #mpp-dashboard-root h2 {
            font-size: 1.15rem !important;
          }
          #mpp-dashboard-root h3 {
            font-size: 1.05rem !important;
          }
          #mpp-dashboard-root h4 {
            font-size: 0.9rem !important;
          }
          #mpp-dashboard-root p,
          #mpp-dashboard-root span,
          #mpp-dashboard-root td,
          #mpp-dashboard-root input,
          #mpp-dashboard-root select,
          #mpp-dashboard-root textarea,
          #mpp-dashboard-root th {
            font-size: 11px !important;
          }
          
          /* Comfort Touch Height */
          #mpp-dashboard-root button,
          #mpp-dashboard-root select,
          #mpp-dashboard-root input,
          #mpp-dashboard-root a,
          .fixed.inset-0.z-\\[150\\] button,
          .fixed.inset-0.z-\\[150\\] select,
          .fixed.inset-0.z-\\[150\\] input {
            min-height: 44px !important;
          }

          /* Responsive Sub-tabs grid */
          #mpp-dashboard-root .flex-wrap {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
            border-bottom: none !important;
          }
          #mpp-dashboard-root .flex-wrap > button {
            border-radius: 0.75rem !important;
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} !important;
            padding: 0.75rem 0.5rem !important;
            justify-content: center !important;
            background-color: ${isDark ? 'rgba(15,23,42,0.6)' : '#ffffff'} !important;
          }
        }

        /* Light Theme Color Overrides */
        ${!isDark ? `
          #mpp-dashboard-root {
            background-color: #f8fafc !important;
            color: #1e293b !important;
          }
          #mpp-dashboard-root .bg-slate-950\\/60,
          #mpp-dashboard-root .bg-slate-900\\/60,
          #mpp-dashboard-root .bg-slate-900,
          #mpp-dashboard-root .bg-slate-950,
          #mpp-dashboard-root .bg-slate-900\\/80,
          #mpp-dashboard-root .bg-slate-950\\/40,
          #mpp-dashboard-root .bg-slate-950\\/50 {
            background-color: #ffffff !important;
            border-color: #e2e8f0 !important;
            color: #1e293b !important;
          }
          #mpp-dashboard-root .border-slate-800 {
            border-color: #cbd5e1 !important;
          }
          #mpp-dashboard-root .border-slate-900 {
            border-color: #e2e8f0 !important;
          }
          #mpp-dashboard-root .text-slate-400,
          #mpp-dashboard-root .text-slate-500,
          #mpp-dashboard-root .text-slate-300 {
            color: #64748b !important;
          }
          #mpp-dashboard-root .text-white,
          #mpp-dashboard-root h2,
          #mpp-dashboard-root h3,
          #mpp-dashboard-root h4 {
            color: #0f172a !important;
          }
          #mpp-dashboard-root input,
          #mpp-dashboard-root select,
          #mpp-dashboard-root textarea {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
          }
          #mpp-dashboard-root input::placeholder,
          #mpp-dashboard-root textarea::placeholder {
            color: #94a3b8 !important;
          }
          #mpp-dashboard-root table th {
            background-color: #f1f5f9 !important;
            color: #475569 !important;
          }
          #mpp-dashboard-root table tr {
            border-bottom-color: #e2e8f0 !important;
          }
          #mpp-dashboard-root table tr:hover {
            background-color: #f8fafc !important;
          }
          #mpp-dashboard-root label {
            color: #475569 !important;
          }
          #mpp-dashboard-root .bg-gradient-to-r {
            background-image: none !important;
            background-color: #ffffff !important;
            border-color: #e2e8f0 !important;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05) !important;
          }
          #mpp-dashboard-root .bg-emerald-950\\/50 {
            background-color: #ecfdf5 !important;
            color: #059669 !important;
            border-bottom: 2px solid #10b981 !important;
          }
          
          /* Modal Overrides */
          .fixed.inset-0.z-\\[150\\] .bg-slate-900,
          .fixed.inset-0.z-\\[150\\] .bg-slate-950 {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #1e293b !important;
          }
          .fixed.inset-0.z-\\[150\\] input,
          .fixed.inset-0.z-\\[150\\] select,
          .fixed.inset-0.z-\\[150\\] textarea {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
          }
          .fixed.inset-0.z-\\[150\\] .text-white,
          .fixed.inset-0.z-\\[150\\] h3 {
            color: #0f172a !important;
          }
          .fixed.inset-0.z-\\[150\\] .text-slate-400 {
            color: #475569 !important;
          }
        ` : ''}
      `}</style>

      {/* Banner Utama */}
      <div className={`p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isDark 
          ? "bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 border border-emerald-500/25" 
          : "bg-white border border-slate-200 shadow-xs"
      }`}>
        <div>
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold tracking-wider uppercase">
            <Sliders className="w-4 h-4" />
            <span>KONSOL INTEGRASI PORTAL &amp; BACKOFFICE</span>
          </div>
          <h2 className={`text-lg md:text-2xl font-bold mt-1.5 tracking-tight font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
            Kelola Portal MPP Simpurusiang
          </h2>
          <p className={`text-xs mt-1 max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Satu dasbor terpadu untuk mengelola gerai/tenant, operator loket, alur pelayanan publik, kontrol status antrean, feedback SKM, peta lokasi, hingga pendaftaran Kiosk Layanan Mandiri.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
          <button
            onClick={() => {
              const newTheme = !isDark;
              setIsDark(newTheme);
              localStorage.setItem("luwu_admin_theme", newTheme ? "dark" : "light");
              localStorage.setItem("mpp_portal_theme", newTheme ? "dark" : "light");
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer min-h-[44px] ${
              isDark 
                ? "bg-amber-950/40 border-amber-500/30 text-amber-400 hover:bg-amber-900/60" 
                : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
            }`}
            title="Ubah Tema Warna Dasbor"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDark ? "Tema Terang" : "Tema Gelap"}</span>
          </button>
          
          <button
            onClick={fetchTenantsAndServices}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[44px] ${
              isDark 
                ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300" 
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Floating Status Message */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-[200] p-4 rounded-2xl border flex items-center gap-3 shadow-xl animate-bounce ${
            statusMessage.type === "success"
              ? "bg-emerald-950 border-emerald-500 text-emerald-300"
              : "bg-rose-950 border-rose-500 text-rose-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-bold">{statusMessage.text}</span>
        </div>
      )}

      {/* SUB-TABS NAVIGATION PANEL (Scrollable on Android / Responsive) */}
      <div className={`flex items-center gap-2 overflow-x-auto custom-scrollbar border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={() => setActiveTab("gerai-operator")}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap min-h-[44px] cursor-pointer ${
            activeTab === "gerai-operator"
              ? isDark 
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-sm" 
                : "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs"
              : isDark 
                ? "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Gerai, Operator & Layanan</span>
        </button>
        <button
          onClick={() => setActiveTab("profil-fasilitas")}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap min-h-[44px] cursor-pointer ${
            activeTab === "profil-fasilitas"
              ? isDark 
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-sm" 
                : "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs"
              : isDark 
                ? "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <Armchair className="w-4 h-4" />
          <span>Profil & Fasilitas MPP</span>
        </button>
        <button
          onClick={() => setActiveTab("kontrol-antrean")}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap min-h-[44px] cursor-pointer ${
            activeTab === "kontrol-antrean"
              ? isDark 
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-sm" 
                : "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs"
              : isDark 
                ? "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Kontrol Antrean & Kiosk</span>
        </button>
        <button
          onClick={() => setActiveTab("kemitraan-alur")}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap min-h-[44px] cursor-pointer ${
            activeTab === "kemitraan-alur"
              ? isDark 
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-sm" 
                : "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs"
              : isDark 
                ? "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>UMKM, Alur & Berita</span>
        </button>
        <button
          onClick={() => setActiveTab("feedback-pengaduan")}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap min-h-[44px] cursor-pointer ${
            activeTab === "feedback-pengaduan"
              ? isDark 
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-sm" 
                : "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs"
              : isDark 
                ? "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>SKM, Pengaduan & Kontak</span>
        </button>
      </div>

      {/* TAB CONTENT MODULES */}
      <div className="space-y-6">
        {/* =====================================================================
            TAB 1: GERAI, OPERATOR & LAYANAN
            ===================================================================== */}
        {activeTab === "gerai-operator" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Gerai & Instansi Section */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Daftar Gerai & Instansi Terdaftar</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Instansi vertikal dan organisasi pemerintah daerah aktif di dalam Mal Pelayanan Publik.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start flex-wrap">
                  <button
                    onClick={() => {
                      setReprimandTargetTenantId(null);
                      setIsReprimandModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-rose-950/40"
                    title="Buka Sistem e-Teguran Realtime ke Gerai Pelayanan"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>e-Teguran Gerai</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingTenantId(null);
                      setTenantForm({ name: "", code: "", logo: "", floor: "Lantai 1", is_active: true, description: "" });
                      setIsTenantModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Tambah Gerai</span>
                  </button>
                </div>
              </div>

              {isLoadingTenants ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Sedang memuat data gerai...</span>
                </div>
              ) : tenants.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Belum ada gerai terdaftar di database.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenants.map(t => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3 hover:border-slate-700 transition-all group relative"
                    >
                      <img
                        src={t.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200"}
                        alt={t.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-800"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase border border-emerald-500/20">
                          {t.code}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate mt-1.5">{t.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t.floor} • Status: {t.is_active ? "Aktif" : "Non-aktif"}</p>
                        {t.description && (
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 italic leading-relaxed bg-slate-900/40 p-1.5 rounded border border-slate-900">
                            {t.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 shrink-0 opacity-80 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => {
                            setReprimandTargetTenantId(t.id);
                            setIsReprimandModalOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer border border-transparent hover:border-rose-800/60"
                          title={`Kirim e-Teguran Realtime ke Gerai ${t.name}`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTenantId(t.id);
                            setTenantForm({
                              name: t.name || "",
                              code: t.code || "",
                              logo: t.logo || "",
                              floor: t.floor || "Lantai 1",
                              is_active: t.is_active !== false,
                              description: t.description || ""
                            });
                            setIsTenantModalOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                          title="Edit Profil Gerai / Instansi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(t.id)}
                          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Hapus Gerai / Instansi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Operator Tenant Section */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Manajemen Akun Operator Gerai</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kelola kredensial petugas pelayanan dan administrator gerai untuk login ke loket pelayanan masing-masing.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingOperatorId(null);
                    setOperatorForm({ name: "", tenant_id: "", email: "", role: "staff", pin: "" });
                    setIsOperatorModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all self-start cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Operator</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                      <th className="p-3">Nama Operator</th>
                      <th className="p-3">Kemitraan Gerai</th>
                      <th className="p-3">Email Sistem</th>
                      <th className="p-3">Akses Level</th>
                      <th className="p-3">Sandi / PIN Loket</th>
                      <th className="p-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {operators.map(op => (
                      <tr key={op.id} className="hover:bg-slate-950/40">
                        <td className="p-3 font-bold text-white">{op.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-medium">
                            {op.tenant}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono">{op.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            op.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}>
                            {op.role}
                          </span>
                        </td>
                        <td className="p-3">
                          {op.pin ? (
                            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Lock className="w-3 h-3" />
                              <span>{op.pin}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 italic">
                              <Unlock className="w-3 h-3 text-amber-500/60" />
                              <span>(Pakai PIN Gerai)</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingOperatorId(op.id);
                                const matchedTenantId = tenants.find(t => t.name === op.tenant || t.code === op.tenant || t.code === op.tenant_code)?.id || op.tenant_id || "";
                                setOperatorForm({
                                  name: op.name,
                                  tenant_id: matchedTenantId,
                                  email: op.email,
                                  role: op.role,
                                  pin: op.pin || ""
                                });
                                setIsOperatorModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900/60 transition-all border border-indigo-900/20 cursor-pointer"
                              title="Edit Operator"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOperator(op.id)}
                              className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-all border border-rose-900/20 cursor-pointer"
                              title="Nonaktifkan"
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
            </div>

            {/* Layanan Gerai Section */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    <span>Layanan Publik Per-Gerai</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Definisikan sub-layanan teknis, jam pelayanan rerata, foto penjelas layanan, beserta dokumen prasyarat lengkap.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingServiceId(null);
                    setServiceForm({ tenant_id: "", service_name: "", requirements: "", estimated_time_minutes: 15, is_active: true, photo_url: "" });
                    setIsServiceModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all self-start cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Layanan & Foto</span>
                </button>
              </div>

              {services.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Belum ada sub-layanan terdaftar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map(s => {
                    const parentTenantName = tenants.find(t => t.id === s.tenant_id)?.name || "Layanan Umum";
                    return (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                {parentTenantName}
                              </span>
                              <h4 className="font-bold text-sm text-white mt-0.5">{s.service_name}</h4>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-mono text-[10px] border border-sky-500/25">
                              {s.estimated_time_minutes} Menit
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Persyaratan Berkas</span>
                            <p className="text-xs text-slate-300 mt-1 line-clamp-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                              {s.requirements || "Tidak membutuhkan berkas prasyarat khusus."}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-900 mt-3">
                          <button
                            onClick={() => {
                              setEditingServiceId(s.id);
                              const customServices = JSON.parse(localStorage.getItem("mpp_portal_custom_services") || "[]");
                              const matchedPhoto = customServices.find((cs: any) => cs.service_name === s.service_name)?.photo_url || "";
                              
                              setServiceForm({
                                tenant_id: s.tenant_id,
                                service_name: s.service_name,
                                requirements: s.requirements || "",
                                estimated_time_minutes: s.estimated_time_minutes || 15,
                                is_active: s.is_active !== false,
                                photo_url: matchedPhoto
                              });
                              setIsServiceModalOpen(true);
                            }}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/20 px-2.5 py-1 rounded-lg border border-indigo-900/20 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Layanan</span>
                          </button>
                          <button
                            onClick={() => handleDeleteService(s.id)}
                            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-950/20 px-2.5 py-1 rounded-lg border border-rose-900/20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Layanan</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: PROFIL & FASILITAS
            ===================================================================== */}
        {activeTab === "profil-fasilitas" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Profil MPP Settings */}
            <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Info className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Profil Instansi MPP</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ubah nama, alamat fisik, deskripsi sambutan, visi, misi, serta koordinat peta spasial dari Mal Pelayanan Publik.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Nama MPP Resmi</label>
                  <input
                    type="text"
                    value={profile.mpp_name}
                    onChange={(e) => setProfile({ ...profile, mpp_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Slogan / Sambutan Utama</label>
                  <input
                    type="text"
                    value={profile.welcome_text}
                    onChange={(e) => setProfile({ ...profile, welcome_text: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Alamat Fisik Lengkap</label>
                  <input
                    type="text"
                    value={profile.mpp_address}
                    onChange={(e) => setProfile({ ...profile, mpp_address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Visi Instansi</label>
                  <textarea
                    rows={4}
                    value={profile.vision}
                    onChange={(e) => setProfile({ ...profile, vision: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Misi Instansi (Satu per baris)</label>
                  <textarea
                    rows={4}
                    value={profile.mission}
                    onChange={(e) => setProfile({ ...profile, mission: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Koordinat Lat (Sumbu Lintang)</label>
                  <input
                    type="text"
                    value={profile.coordinates_lat}
                    onChange={(e) => setProfile({ ...profile, coordinates_lat: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Koordinat Lng (Sumbu Bujur)</label>
                  <input
                    type="text"
                    value={profile.coordinates_lng}
                    onChange={(e) => setProfile({ ...profile, coordinates_lng: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Profil MPP</span>
                </button>
              </div>
            </form>

            {/* Kelola Fasilitas MPP */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                    <Armchair className="w-4 h-4 text-emerald-400" />
                    <span>Manajemen Fasilitas Gedung MPP ({facilities.length} Fasilitas)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ubah, tambahkan fasilitas fisik MPP (Pojok Baca, Disabilitas, Musholla, Kid's Play Corner) lengkap dengan deskripsi dan foto real-time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncStandardFacilities}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer w-fit"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronkan 9 Fasilitas Resmi</span>
                </button>
              </div>

              {/* Form Tambah Fasilitas */}
              <form onSubmit={handleAddFacility} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Nama Fasilitas</label>
                  <input
                    type="text"
                    required
                    value={facilityForm.name}
                    onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                    placeholder="Contoh: Pojok Layanan Disabilitas Terpadu"
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <ImageUploadField
                    id="facility-photo-upload"
                    label="Unggah Foto Fasilitas"
                    value={facilityForm.photo}
                    onChange={(val) => setFacilityForm({ ...facilityForm, photo: val })}
                    placeholder="Seret & lepas foto fasilitas, atau klik untuk memilih"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Lokasi Lantai Gedung</label>
                  <select
                    value={facilityForm.floor}
                    onChange={(e) => setFacilityForm({ ...facilityForm, floor: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Lantai 1">Lantai 1 - Hall Utama</option>
                    <option value="Lantai 2">Lantai 2 - Backoffice & Aula</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Keterangan Singkat Fasilitas</label>
                  <input
                    type="text"
                    required
                    value={facilityForm.desc}
                    onChange={(e) => setFacilityForm({ ...facilityForm, desc: e.target.value })}
                    placeholder="Contoh: Kursi roda gratis, toilet ramah difabel, rambu braille..."
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2 pt-2 text-right">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5 inline-flex"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambahkan Fasilitas</span>
                  </button>
                </div>
              </form>

              {/* Grid Fasilitas Terdaftar */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facilities.map(f => (
                  <div key={f.id} className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40 hover:border-slate-700 transition-all">
                    <img
                      src={f.photo}
                      alt={f.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-40 object-cover border-b border-slate-800"
                    />
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">{f.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[9px] uppercase tracking-wide border border-emerald-500/20">
                          {f.floor}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                        {f.desc}
                      </p>
                      <div className="pt-2 text-right">
                        <button
                          onClick={() => handleDeleteFacility(f.id)}
                          className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-900/20 transition-all inline-flex items-center gap-1 text-[10px] font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive 3D Floor Plan & Facility Navigator */}
            <form onSubmit={handleSaveFloorPlan} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Map className="w-4 h-4 text-emerald-400" />
                <span>Kelola Interactive 3D Floor Plan & Facility Navigator</span>
              </h3>
              <p className="text-xs text-slate-400">
                Sesuaikan skema denah gedung 3D interaktif lantai 1 dan lantai 2 MPP Simpurusiang untuk memandu investor, disabilitas, dan warga.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Judul Fitur Navigasi</label>
                  <input
                    type="text"
                    value={floorPlan.title}
                    onChange={(e) => setFloorPlan({ ...floorPlan, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <ImageUploadField
                    id="floorplan-photo-upload"
                    label="Unggah Foto / Peta Denah Gedung"
                    value={floorPlan.photo}
                    onChange={(val) => setFloorPlan({ ...floorPlan, photo: val })}
                    placeholder="Seret & lepas gambar denah, atau klik untuk memilih"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Keterangan / Panduan Peta</label>
                  <textarea
                    rows={3}
                    value={floorPlan.desc}
                    onChange={(e) => setFloorPlan({ ...floorPlan, desc: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5 inline-flex"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Denah Interaktif</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =====================================================================
            TAB 3: KONTROL ANTREAN & LAYANAN MANDIRI
            ===================================================================== */}
        {activeTab === "kontrol-antrean" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Queue Control */}
            <form onSubmit={handleSaveQueueSettings} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Kontrol Operasional Antrean Online</span>
              </h3>
              <p className="text-xs text-slate-400">
                Buka/tutup kuota antrean harian, monitoring nomor aktif, serta reset nomor tiket antrean harian.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-xs text-white block">Status Layanan Antrean</strong>
                      <span className="text-[10px] text-slate-400">Menutup pendaftaran online jika di-nonaktifkan</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQueueStatus({ ...queueStatus, is_active: !queueStatus.is_active })}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                        queueStatus.is_active ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {queueStatus.is_active ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{queueStatus.is_active ? "Buka (Open)" : "Tutup (Closed)"}</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Kuota Maksimum Antrean Harian</label>
                    <input
                      type="number"
                      value={queueStatus.max_online_queues}
                      onChange={(e) => setQueueStatus({ ...queueStatus, max_online_queues: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 text-xs rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Panggilan Loket Terakhir (Loket A - Kependudukan)</label>
                    <input
                      type="number"
                      value={queueStatus.current_number_a}
                      onChange={(e) => setQueueStatus({ ...queueStatus, current_number_a: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 text-xs rounded-lg text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Panggilan Loket Terakhir (Loket B - Perizinan/Pajak)</label>
                    <input
                      type="number"
                      value={queueStatus.current_number_b}
                      onChange={(e) => setQueueStatus({ ...queueStatus, current_number_b: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 text-xs rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Calendar size={12} /> Last reset: {queueStatus.last_reset}
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5 self-end"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Operasional Antrean</span>
                </button>
              </div>
            </form>

            {/* Self-service Kiosk (Layanan Mandiri) Settings */}
            <form onSubmit={handleSaveKioskSettings} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Monitor className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Kiosk Layanan Mandiri (Self-Service)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Konfigurasi penayangan sambutan, toggle mode offline/maintenance, serta otentikasi data Kiosk pada lobby utama MPP.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <strong className="text-xs font-bold text-white block uppercase tracking-wider">Konektivitas & Sistem</strong>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Mode Server Kiosk</span>
                    <button
                      type="button"
                      onClick={() => setKioskSettings({ ...kioskSettings, is_online: !kioskSettings.is_online })}
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        kioskSettings.is_online ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {kioskSettings.is_online ? "Online (Database Connected)" : "Offline Mode"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Layar Perbaikan (Maintenance)</span>
                    <button
                      type="button"
                      onClick={() => setKioskSettings({ ...kioskSettings, is_maintenance: !kioskSettings.is_maintenance })}
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        kioskSettings.is_maintenance ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {kioskSettings.is_maintenance ? "Aktif (Maintanance ON)" : "Normal Operational"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Pesan Selamat Datang Kiosk (ID)</label>
                    <input
                      type="text"
                      value={kioskSettings.welcome_message_id}
                      onChange={(e) => setKioskSettings({ ...kioskSettings, welcome_message_id: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 text-xs rounded-lg text-white font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Pesan Selamat Datang Kiosk (EN)</label>
                    <input
                      type="text"
                      value={kioskSettings.welcome_message_en}
                      onChange={(e) => setKioskSettings({ ...kioskSettings, welcome_message_en: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 text-xs rounded-lg text-white font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5 inline-flex"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Konsol Kiosk</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =====================================================================
            TAB 4: KEMITRAAN UMKM & ALUR PELAYANAN & BERITA
            ===================================================================== */}
        {activeTab === "kemitraan-alur" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Galeri Kemitraan UMKM */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                  <Store className="w-4 h-4 text-emerald-400" />
                  <span>Kelola Galeri Kemitraan UMKM Unggulan</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Daftarkan produk-produk UMKM binaan Luwu, input foto, kategori, harga, nama pemilik, dan nomor WhatsApp pemesanan.
                </p>
              </div>

              <form onSubmit={handleAddUmkm} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Nama Produk UMKM</label>
                  <input
                    type="text"
                    required
                    value={umkmForm.name}
                    onChange={(e) => setUmkmForm({ ...umkmForm, name: e.target.value })}
                    placeholder="Contoh: Madu Hutan Latimojong Asli"
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Nama Pemilik UMKM</label>
                  <input
                    type="text"
                    required
                    value={umkmForm.owner}
                    onChange={(e) => setUmkmForm({ ...umkmForm, owner: e.target.value })}
                    placeholder="Contoh: Ibu Hasna"
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Nomor WhatsApp Pembeli</label>
                  <input
                    type="tel"
                    required
                    value={umkmForm.wa}
                    onChange={(e) => setUmkmForm({ ...umkmForm, wa: e.target.value })}
                    placeholder="62812345678"
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <ImageUploadField
                    id="umkm-photo-upload"
                    label="Unggah Foto Produk UMKM"
                    value={umkmForm.photo}
                    onChange={(val) => setUmkmForm({ ...umkmForm, photo: val })}
                    placeholder="Seret & lepas foto produk, atau klik untuk memilih"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Kategori Produk</label>
                  <select
                    value={umkmForm.category}
                    onChange={(e) => setUmkmForm({ ...umkmForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Kuliner">Kuliner (Makanan & Minuman)</option>
                    <option value="Kerajinan">Kerajinan Tangan (Kriya)</option>
                    <option value="Pertanian">Hasil Bumi & Pertanian</option>
                    <option value="Pakaian">Fashion & Tenun Lokal</option>
                  </select>
                </div>
                <div className="flex items-end justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Daftarkan UMKM</span>
                  </button>
                </div>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {umkmList.map(u => (
                  <div key={u.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-start gap-3 hover:border-slate-700 transition-all group">
                    <img
                      src={u.photo}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[9px] uppercase tracking-wide border border-amber-500/20">
                        {u.category}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-white truncate">{u.name}</h4>
                      <p className="text-[10px] text-slate-400">Pemilik: <strong>{u.owner}</strong></p>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded-md border border-emerald-500/10 block w-max">WA: +{u.wa}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteUmkm(u.id)}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-all opacity-0 group-hover:opacity-100 border border-rose-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tambah Alur Pelayanan */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Tambahkan Langkah Alur Pelayanan MPP</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ubah urutan langkah-langkah, judul prosedur, serta rincian deskripsi panduan pelayanan publik yang ditampilkan di portal warga.
                </p>
              </div>

              <form onSubmit={handleAddFlow} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Langkah Ke (#)</label>
                  <input
                    type="number"
                    required
                    value={flowForm.step}
                    onChange={(e) => setFlowForm({ ...flowForm, step: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Judul Prosedur</label>
                  <input
                    type="text"
                    required
                    value={flowForm.title}
                    onChange={(e) => setFlowForm({ ...flowForm, title: e.target.value })}
                    placeholder="Contoh: Petugas Memanggil Nomor Antrean"
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Rincian Deskripsi</label>
                  <input
                    type="text"
                    required
                    value={flowForm.desc}
                    onChange={(e) => setFlowForm({ ...flowForm, desc: e.target.value })}
                    placeholder="Masyarakat menuju ke loket instansi yang bersangkutan..."
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3 text-right">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5 inline-flex"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambahkan Langkah Alur</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {flowSteps.map(f => (
                  <div key={f.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        {f.step}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-white">{f.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFlow(f.id)}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-900/20 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Kelola Berita MPP */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                  <Newspaper className="w-4 h-4 text-emerald-400" />
                  <span>Diterbitkan / Kelola Publikasi Berita MPP</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Rilis informasi kegiatan, berita kemitraan, pengumuman operasional, serta hari libur nasional layanan MPP.
                </p>
              </div>

              <form onSubmit={handleAddNews} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Judul Berita Utama</label>
                  <input
                    type="text"
                    required
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    placeholder="Kemenpan-RB Melakukan Studi Banding Sistem SPBE MPP Luwu..."
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <ImageUploadField
                    id="news-photo-upload"
                    label="Unggah Foto Berita"
                    value={newsForm.photo}
                    onChange={(val) => setNewsForm({ ...newsForm, photo: val })}
                    placeholder="Seret & lepas foto berita, atau klik untuk memilih"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Kategori Berita</label>
                  <select
                    value={newsForm.category}
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Pemerintahan">Pemerintahan & SPBE</option>
                    <option value="Pengumuman">Pengumuman Operasional</option>
                    <option value="Kegiatan">Liputan Kegiatan MPP</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Isi Konten Berita</label>
                  <textarea
                    rows={4}
                    required
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    placeholder="Tuliskan berita lengkap di sini..."
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
                <div className="md:col-span-2 text-right">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5 inline-flex"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Terbitkan Berita</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {newsList.map(n => (
                  <div key={n.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-start gap-4 hover:border-slate-700 transition-all group">
                    <img
                      src={n.photo || n.image}
                      alt={n.title || n.judul}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[9px] uppercase border border-emerald-500/20">
                          {n.category || n.kategori}
                        </span>
                        <span className="text-[10px] text-slate-500">{n.date || n.tanggal}</span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-white truncate">{n.title || n.judul}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{n.content || n.ringkasan || n.isiLengkap}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteNews(n.id)}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-900/20 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: SKM, PENGADUAN & KONTAK
            ===================================================================== */}
        {activeTab === "feedback-pengaduan" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Monitor SKM & IKM per Gerai */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Monitoring Indeks Kepuasan Masyarakat (IKM) per Gerai</span>
              </h3>
              <p className="text-xs text-slate-400">
                Lihat ulasan kepuasan survei SKM elektronik terintegrasi yang diisi oleh masyarakat pasca-pelayanan.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tenants.map((t, idx) => {
                  const rScore = 4.5 + (idx % 5) * 0.1;
                  return (
                    <div key={t.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3">
                      <div>
                        <strong className="text-xs font-bold text-white block truncate max-w-[200px]">{t.name}</strong>
                        <span className="text-[10px] text-slate-400">{t.code} • Rerata Layan: {10 + (idx % 3) * 3} Menit</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-400 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                          <span>{rScore.toFixed(1)} / 5.0</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Sangat Baik (A)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Testimoni Ulasan Masyarakat */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Quote className="w-4 h-4 text-emerald-400" />
                <span>Ulasan & Testimoni Masyarakat di Portal</span>
              </h3>
              <p className="text-xs text-slate-400">
                Setujui atau sembunyikan ulasan kepuasan warga dari galeri testimoni portal publik MPP.
              </p>

              <div className="space-y-3">
                {testimonials.map(t => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <strong className="text-white">{t.author}</strong>
                        <span className="text-slate-500 font-mono">({t.role})</span>
                      </div>
                      <p className="text-xs text-slate-300 italic">"{t.comment}"</p>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleTestimonialApproval(t.id)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase border transition-all ${
                        t.approved
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {t.approved ? "Ditampilkan" : "Disembunyikan"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pengaduan Masyarakat */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <AlertCircle className="w-4 h-4 text-emerald-400" />
                <span>Pengaduan Masyarakat & Helpdesk</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pusat aduan layanan terintegrasi warga. Ubah status aduan dan respon dengan tindakan perbaikan.
              </p>

              <div className="space-y-3">
                {complaints.map(c => (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <strong className="text-white">{c.sender}</strong>
                        <span className="text-slate-500 font-mono">NIK: {c.nik}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700 font-medium">{c.category}</span>
                      </div>
                      <p className="text-xs text-slate-300">{c.issue}</p>
                      <span className="text-[10px] text-slate-500 block">Tanggal Aduan: {c.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={c.status}
                        onChange={(e) => handleUpdateComplaintStatus(c.id, e.target.value)}
                        className={`p-1.5 rounded-lg text-xs font-bold outline-none border ${
                          c.status === "Selesai"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : c.status === "Diproses"
                            ? "bg-amber-950 text-amber-400 border-amber-800"
                            : "bg-rose-950 text-rose-400 border-rose-800"
                        }`}
                      >
                        <option value="Diterima">Diterima</option>
                        <option value="Diproses">Diproses</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pengaturan & Kurasi Media Sosial Resmi MPP */}
            <MppSocialMediaAdminManager isDark={isDark} />

            {/* Kontak Kami, Peta & Jam Operasional */}
            <form onSubmit={handleSaveContacts} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Jam Pelayanan, Helpdesk & Peta Lokasi</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ganti jam pelayanan operasional, nomor helpdesk resmi, dan link Google Maps embed resmi MPP Simpurusiang Kab. Luwu.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Jam Operasional (Senin - Kamis)</label>
                  <input
                    type="text"
                    value={contacts.working_hours_mon_thu}
                    onChange={(e) => setContacts({ ...contacts, working_hours_mon_thu: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Jam Operasional (Jumat)</label>
                  <input
                    type="text"
                    value={contacts.working_hours_fri}
                    onChange={(e) => setContacts({ ...contacts, working_hours_fri: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Nomor HP / WhatsApp Resmi</label>
                  <input
                    type="tel"
                    value={contacts.phone}
                    onChange={(e) => setContacts({ ...contacts, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Email Resmi MPP</label>
                  <input
                    type="email"
                    value={contacts.email}
                    onChange={(e) => setContacts({ ...contacts, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Url Google Maps Embed</label>
                  <input
                    type="text"
                    value={contacts.maps_embed_url}
                    onChange={(e) => setContacts({ ...contacts, maps_embed_url: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Instagram Resmi</label>
                  <input
                    type="url"
                    value={contacts.instagram}
                    onChange={(e) => setContacts({ ...contacts, instagram: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Facebook Resmi</label>
                  <input
                    type="url"
                    value={contacts.facebook}
                    onChange={(e) => setContacts({ ...contacts, facebook: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5 inline-flex"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Kontak & Sosmed</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* =====================================================================
          MODALS AREA
          ===================================================================== */}
      {/* 1. Tenant Modal */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-white">
                {editingTenantId ? "Edit Gerai / Instansi" : "Tambah Gerai / Instansi Baru"}
              </h3>
              <button onClick={() => setIsTenantModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTenant} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Nama Instansi / Gerai</label>
                <input
                  type="text"
                  required
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                  placeholder="Contoh: Dinas Kependudukan dan Catatan Sipil"
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Kode Gerai (Maks 10 Karakter)</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  disabled={!!editingTenantId}
                  value={tenantForm.code}
                  onChange={(e) => setTenantForm({ ...tenantForm, code: e.target.value })}
                  placeholder="Contoh: CAPIL"
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg font-mono uppercase outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {editingTenantId && (
                  <p className="text-[10px] text-slate-500 mt-0.5">Kode antrian tidak dapat diubah demi konsistensi nomor tiket.</p>
                )}
              </div>
              <div className="space-y-1 text-xs">
                <ImageUploadField
                  id="tenant-logo-upload"
                  label="Unggah Logo / Lambang Gerai"
                  value={tenantForm.logo}
                  onChange={(val) => setTenantForm({ ...tenantForm, logo: val })}
                  placeholder="Seret & lepas logo instansi, atau klik untuk memilih"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Deskripsi Gerai / Instansi</label>
                <textarea
                  rows={3}
                  value={tenantForm.description}
                  onChange={(e) => setTenantForm({ ...tenantForm, description: e.target.value })}
                  placeholder="Masukkan deskripsi tugas, fungsi, atau jam operasional khusus gerai ini..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500 leading-relaxed resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Penempatan Lantai Gedung</label>
                <select
                  value={tenantForm.floor}
                  onChange={(e) => setTenantForm({ ...tenantForm, floor: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500"
                >
                  <option value="Lantai 1">Lantai 1 - Loket Pelayanan Utama</option>
                  <option value="Lantai 2">Lantai 2 - Backoffice Instansi</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-lg transition-all cursor-pointer"
              >
                {editingTenantId ? "Simpan Perubahan Gerai" : "Simpan & Daftarkan Gerai"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-white">
                {editingServiceId ? "Edit Sub-Layanan & Persyaratan" : "Tambah Sub-Layanan & Persyaratan"}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Instansi Gerai Induk</label>
                <select
                  required
                  value={serviceForm.tenant_id}
                  onChange={(e) => setServiceForm({ ...serviceForm, tenant_id: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500"
                >
                  <option value="">Pilih Instansi...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Nama Layanan</label>
                <input
                  type="text"
                  required
                  value={serviceForm.service_name}
                  onChange={(e) => setServiceForm({ ...serviceForm, service_name: e.target.value })}
                  placeholder="Contoh: Pembuatan KTP-el / Kartu Identitas Anak"
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <ImageUploadField
                  id="service-photo-upload"
                  label="Unggah Ilustrasi Foto Layanan"
                  value={serviceForm.photo_url}
                  onChange={(val) => setServiceForm({ ...serviceForm, photo_url: val })}
                  placeholder="Seret & lepas foto layanan, atau klik untuk memilih"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Estimasi Durasi Penyelesaian (Menit)</label>
                <input
                  type="number"
                  required
                  value={serviceForm.estimated_time_minutes}
                  onChange={(e) => setServiceForm({ ...serviceForm, estimated_time_minutes: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg font-mono outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Dokumen Persyaratan Lengkap</label>
                <textarea
                  rows={3}
                  value={serviceForm.requirements}
                  onChange={(e) => setServiceForm({ ...serviceForm, requirements: e.target.value })}
                  placeholder="1. KTP Asli&#10;2. Kartu Keluarga&#10;3. Surat Pengantar RT/RW..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg font-sans outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-lg transition-all cursor-pointer"
              >
                {editingServiceId ? "Simpan Perubahan Layanan" : "Terbitkan Layanan Publik"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Operator Modal */}
      {isOperatorModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-white">
                {editingOperatorId ? "Edit Akun Operator Gerai" : "Tambah Operator Gerai Baru"}
              </h3>
              <button onClick={() => setIsOperatorModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveOperator} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Nama Lengkap Operator</label>
                <input
                  type="text"
                  required
                  value={operatorForm.name}
                  onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })}
                  placeholder="Contoh: Muhammad Yusuf"
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Instansi Gerai Penempatan</label>
                <select
                  required
                  value={operatorForm.tenant_id}
                  onChange={(e) => setOperatorForm({ ...operatorForm, tenant_id: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500"
                >
                  <option value="">Pilih Instansi...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Email Sistem</label>
                <input
                  type="email"
                  required
                  value={operatorForm.email}
                  onChange={(e) => setOperatorForm({ ...operatorForm, email: e.target.value })}
                  placeholder="operator@luwukab.go.id"
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg font-mono outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">
                  Sandi / PIN Operator (Password Login Loket)
                </label>
                <div className="relative">
                  <input
                    type={showOperatorPin ? "text" : "password"}
                    value={operatorForm.pin}
                    onChange={(e) => setOperatorForm({ ...operatorForm, pin: e.target.value })}
                    placeholder="Contoh: Aldi2026@ atau PIN 6 digit..."
                    className="w-full p-2 pr-9 bg-slate-950 border border-slate-800 text-white rounded-lg font-mono outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOperatorPin(!showOperatorPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showOperatorPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Digunakan oleh operator saat login ke Loket Gerai menggunakan email ini. Jika dikosongkan, operator dapat login menggunakan PIN Operasional Gerai.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Akses Level</label>
                <select
                  value={operatorForm.role}
                  onChange={(e) => setOperatorForm({ ...operatorForm, role: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500"
                >
                  <option value="staff">Operator Staff (Hanya Panggil Antrean)</option>
                  <option value="admin">Supervisor Gerai (Edit Layanan & Staff)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-lg transition-all cursor-pointer"
              >
                {editingOperatorId ? "Simpan Perubahan Operator" : "Daftarkan Akun Operator"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal e-Teguran Realtime */}
      <ReprimandModal
        isOpen={isReprimandModalOpen}
        onClose={() => {
          setIsReprimandModalOpen(false);
          setReprimandTargetTenantId(null);
        }}
        tenants={tenants}
        selectedTenantId={reprimandTargetTenantId}
      />
    </div>
  );
}

