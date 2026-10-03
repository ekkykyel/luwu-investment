export type CrossOpdRole = 'PEMOHON' | 'ADMIN_PUPTR' | 'ADMIN_PERTANIAN' | 'ADMIN_DPMPTSP';

export type CrossOpdNotificationType = 
  | 'NEW_SUBMISSION'        // Pemohon -> PUPTR
  | 'FORWARD_PERTANIAN'     // PUPTR -> Pertanian (Minta Rekomendasi LP2B)
  | 'REJECTED_PERTANIAN'    // Pertanian -> PUPTR (Tolak LP2B + Catatan)
  | 'REJECTED_FINAL'        // PUPTR -> Pemohon (Tolak PKKPR karena LP2B)
  | 'APPROVED_PERTANIAN'    // Pertanian -> PUPTR (Setujui + Terbit BAP Pertanian)
  | 'APPROVED_PUPTR'        // PUPTR -> DPMPTSP (Setujui + Terbit Pertek PUPTR)
  | 'FEEDBACK_REQUIRED'     // PUPTR -> Pemohon (Kembalikan berkas / butuh revisi)
  | 'ISSUED_DPMPTSP';       // DPMPTSP -> Pemohon (Terbitkan SK Izin PKKPR Final)

export interface CrossOpdNotification {
  id: string;
  applicationId: string;
  applicantName: string;
  companyName: string;
  sector: string;
  districtName: string;
  villageName: string;
  targetRole: CrossOpdRole;
  fromRole: CrossOpdRole;
  type: CrossOpdNotificationType;
  title: string;
  message: string;
  notes?: string;
  timestamp: string;
  read: boolean;
  bapPertanianDocNumber?: string;
  bapPuptrDocNumber?: string;
  skPkkprDocNumber?: string;
}

const STORAGE_KEY = 'luwu_cross_opd_notifications_v1';
const EVENT_NAME = 'luwu_cross_opd_notifications_updated';

// Default initial notifications for initial state
const INITIAL_NOTIFICATIONS: CrossOpdNotification[] = [
  {
    id: 'notif-init-1',
    applicationId: 'PKKPR-2026-004',
    applicantName: 'Drs. H. Syamsul Bahri',
    companyName: 'PT Luwu Sinergi Properti',
    sector: 'Perindustrian',
    districtName: 'Bua',
    villageName: 'Barowa',
    targetRole: 'ADMIN_PUPTR',
    fromRole: 'PEMOHON',
    type: 'NEW_SUBMISSION',
    title: 'Permohonan PKKPR Baru #PKKPR-2026-004',
    message: 'Permohonan PKKPR Baru dari Drs. H. Syamsul Bahri (PT Luwu Sinergi Properti) di Desa Barowa, Kec. Bua membutuhkan verifikasi spasial RTRW & LP2B.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false
  },
  {
    id: 'notif-init-2',
    applicationId: 'PKKPR-2026-002',
    applicantName: 'Ir. Andi Tenri Kitta',
    companyName: 'PT Belopa Agro Industri',
    sector: 'Pertanian & Perkebunan',
    districtName: 'Belopa',
    villageName: 'Senga',
    targetRole: 'ADMIN_PERTANIAN',
    fromRole: 'ADMIN_PUPTR',
    type: 'FORWARD_PERTANIAN',
    title: 'Minta Rekomendasi Teknis LP2B #PKKPR-2026-002',
    message: 'Dinas PUPTR meneruskan permohonan PT Belopa Agro Industri yang terdeteksi berada di Zona LP2B untuk evaluasi pertimbangan teknis lahan pertanian.',
    notes: 'Mohon tinjauan kesesuaian dengan jaringan irigasi teknis dan cetak sawah Kabupaten Luwu.',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    read: false
  },
  {
    id: 'notif-init-3',
    applicationId: 'PKKPR-2026-001',
    applicantName: 'H. Muhammad Aris',
    companyName: 'CV Luwu Logistics Hub',
    sector: 'Perdagangan & Jasa',
    districtName: 'Bua',
    villageName: 'Tanarigella',
    targetRole: 'ADMIN_DPMPTSP',
    fromRole: 'ADMIN_PUPTR',
    type: 'APPROVED_PUPTR',
    title: 'Pertek & BAP PUPTR Terbit #PKKPR-2026-001',
    message: 'Dinas PUPTR telah memfinalisasi Pertek No. PERTEK.PKKPR/PUPTR-LUWU/2026/001 (Melampirkan BAP Pertanian No. BAP-PERTANIAN/LUWU/2026/001). Mohon terbitkan SK Izin PKKPR Final.',
    bapPertanianDocNumber: 'BAP-PERTANIAN/LUWU/2026/001',
    bapPuptrDocNumber: 'PERTEK.PKKPR/PUPTR-LUWU/2026/001',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    read: false
  }
];

export function getStoredNotifications(): CrossOpdNotification[] {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveNotifications(notifications: CrossOpdNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: notifications }));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
}

export function addCrossOpdNotification(
  notifData: Omit<CrossOpdNotification, 'id' | 'timestamp' | 'read'>
): CrossOpdNotification {
  const current = getStoredNotifications();
  const newNotif: CrossOpdNotification = {
    ...notifData,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    read: false
  };

  const updated = [newNotif, ...current];
  saveNotifications(updated);
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const current = getStoredNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(updated);
}

export function markAllNotificationsAsRead(targetRole?: CrossOpdRole): void {
  const current = getStoredNotifications();
  const updated = current.map(n => {
    if (!targetRole || n.targetRole === targetRole) {
      return { ...n, read: true };
    }
    return n;
  });
  saveNotifications(updated);
}

export function subscribeCrossOpdNotifications(
  callback: (notifications: CrossOpdNotification[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<CrossOpdNotification[]>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      callback(getStoredNotifications());
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  // Initial call
  callback(getStoredNotifications());

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}
