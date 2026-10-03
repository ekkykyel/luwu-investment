/**
 * SISTEM PERIZINAN SPASIAL TERPADU KABUPATEN LUWU (InvestLuwuHub)
 * Hierarchical Business Process Workflow State Machine & RBAC Definitions
 * 
 * Alur Status Permohonan:
 * PUPTR (REVIEW_PUPTR) 
 *   --> [Jika Irisan Spasial Bersyarat] --> ESCALATED_PERTANIAN (Hilang dari PUPTR, masuk Pertanian)
 *   --> [Jika Ditolak Pertanian]       --> REJECTED_PERTANIAN (Hilang dari Pertanian, kembali ke PUPTR)
 *                                           --> [PUPTR Kembalikan] --> REJECTED_FINAL (Ke Dashboard Pemohon)
 *   --> [Jika Disetujui Pertanian]     --> PERTEK_PERTANIAN (Hasil Spatial Difference, kembali ke PUPTR)
 *                                           --> [PUPTR Persetujuan Akhir] --> PROSES_OSS (Masuk DPMPTSP/OSS)
 *   --> [DPMPTSP TTE & Terbitkan]      --> IZIN_TERBIT (Selesai, terkirim ke Pemohon)
 */

export type PKKPRStatus = 
  | 'SUBMITTED' 
  | 'VERIFIKASI_PERTANIAN' 
  | 'APPROVED_PERTANIAN' 
  | 'BYPASS_PERTANIAN' 
  | 'VERIFIKASI_PUPTR' 
  | 'APPROVED_PUPTR' 
  | 'REVISI_PEMOHON' 
  | 'DITOLAK' 
  | 'TERBIT';

export function normalizePKKPRStatus(rawStatus?: string | null): PKKPRStatus {
  const s = String(rawStatus || '').toUpperCase().trim();
  if (s === 'SUBMITTED' || s === 'PENDING SPATIAL CHECK' || s === 'PENDING') return 'SUBMITTED';
  if (s === 'VERIFIKASI_PERTANIAN' || s === 'FORWARDED_TO_PERTANIAN' || s === 'PENDING PERTEK PERTANIAN' || s === 'ESCALATED_PERTANIAN') return 'VERIFIKASI_PERTANIAN';
  if (s === 'APPROVED_PERTANIAN' || s === 'PERTEK_PERTANIAN') return 'APPROVED_PERTANIAN';
  if (s === 'BYPASS_PERTANIAN' || s === 'NON_LP2B') return 'BYPASS_PERTANIAN';
  if (s === 'VERIFIKASI_PUPTR' || s === 'REVIEW_PUPTR' || s === 'ESCALATED_PUPTR') return 'VERIFIKASI_PUPTR';
  if (s === 'APPROVED_PUPTR' || s === 'PROSES_OSS' || s === 'APPROVED') return 'APPROVED_PUPTR';
  if (s === 'REVISI_PEMOHON' || s === 'REQUIRES REVISION' || s === 'REVISION' || s === 'REVISI_PUPTR') return 'REVISI_PEMOHON';
  if (s === 'DITOLAK' || s === 'REJECTED' || s === 'REJECTED_FINAL' || s === 'REJECTED_PERTANIAN' || s === 'DITOLAK_PERTANIAN') return 'DITOLAK';
  if (s === 'TERBIT' || s === 'PUBLISHED' || s === 'IZIN_TERBIT' || s === 'ISSUED' || s === 'SELESAI') return 'TERBIT';
  return 'SUBMITTED';
}

export type PkkprStatusPermohonan =
  | 'REVIEW_PUPTR'
  | 'ESCALATED_PERTANIAN'
  | 'REJECTED_PERTANIAN'
  | 'PERTEK_PERTANIAN'
  | 'REJECTED_FINAL'
  | 'PROSES_OSS'
  | 'IZIN_TERBIT';

export type UserRoleOpd = 
  | 'ADMIN_PUPTR' 
  | 'ADMIN_PERTANIAN' 
  | 'ADMIN_DPMPTSP' 
  | 'ADMIN_OSS' 
  | 'PEMOHON' 
  | 'SUPERADMIN';

export interface WorkflowTransitionPayload {
  permohonanId: string;
  fromStatus: PkkprStatusPermohonan;
  toStatus: PkkprStatusPermohonan;
  performedByRole: UserRoleOpd;
  actorName: string;
  notes?: string;
  documentNumber?: string;
  documentType?: 'BAP_PUPTR' | 'BAP_PERTANIAN' | 'BAP_TOLAK_PERTANIAN' | 'SK_PKKPR_DRAFT' | 'SK_PKKPR_FINAL';
  documentUrl?: string;
  updatedGeometry?: any;
  cutAreaM2?: number;
  remainingAreaM2?: number;
}

export interface WorkflowStatusMetadata {
  status: PkkprStatusPermohonan;
  label: string;
  badgeColor: string;
  description: string;
  responsibleRole: UserRoleOpd;
  allowedRolesToView: UserRoleOpd[];
  isTerminalState: boolean;
}

export const WORKFLOW_STATUS_CONFIG: Record<PkkprStatusPermohonan, WorkflowStatusMetadata> = {
  REVIEW_PUPTR: {
    status: 'REVIEW_PUPTR',
    label: 'Analisis Spasial PUPTR',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
    description: 'Permohonan sedang dalam penelaahan zonasi RTRW & overlay layer sensitif oleh Dinas PUPTR.',
    responsibleRole: 'ADMIN_PUPTR',
    allowedRolesToView: ['ADMIN_PUPTR', 'PEMOHON', 'SUPERADMIN'],
    isTerminalState: false
  },
  ESCALATED_PERTANIAN: {
    status: 'ESCALATED_PERTANIAN',
    label: 'Diteruskan ke Dinas Pertanian',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800',
    description: 'Poligon terindikasi menyinggung LP2B/Sawah. Menunggu analisis teknis & rekomendasi Dinas Pertanian.',
    responsibleRole: 'ADMIN_PERTANIAN',
    allowedRolesToView: ['ADMIN_PERTANIAN', 'PEMOHON', 'SUPERADMIN'],
    isTerminalState: false
  },
  REJECTED_PERTANIAN: {
    status: 'REJECTED_PERTANIAN',
    label: 'Ditolak Dinas Pertanian (BAP Penolakan)',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800',
    description: 'Dinas Pertanian menolak alih fungsi lahan LP2B. Berkas dikembalikan ke PUPTR untuk tindak lanjut.',
    responsibleRole: 'ADMIN_PUPTR',
    allowedRolesToView: ['ADMIN_PUPTR', 'ADMIN_PERTANIAN', 'PEMOHON', 'SUPERADMIN'],
    isTerminalState: false
  },
  PERTEK_PERTANIAN: {
    status: 'PERTEK_PERTANIAN',
    label: 'Rekomendasi Pertanian Terbit (Geometri Terpotong)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800',
    description: 'Pertanian menyetujui alih fungsi dengan spatial difference. Kembali ke PUPTR untuk Pertek final.',
    responsibleRole: 'ADMIN_PUPTR',
    allowedRolesToView: ['ADMIN_PUPTR', 'ADMIN_PERTANIAN', 'PEMOHON', 'SUPERADMIN'],
    isTerminalState: false
  },
  REJECTED_FINAL: {
    status: 'REJECTED_FINAL',
    label: 'Permohonan Ditolak Final',
    badgeColor: 'bg-red-100 text-red-900 border-red-400 dark:bg-red-950/70 dark:text-red-200 dark:border-red-800',
    description: 'PUPTR telah mengembalikan permohonan ke pemohon karena tidak memenuhi syarat tata ruang/pertanian.',
    responsibleRole: 'PEMOHON',
    allowedRolesToView: ['ADMIN_PUPTR', 'PEMOHON', 'SUPERADMIN'],
    isTerminalState: true
  },
  PROSES_OSS: {
    status: 'PROSES_OSS',
    label: 'Antrean Penerbitan SK DPMPTSP / OSS',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-800',
    description: 'Pertek PUPTR terbit. Berkas masuk ke antrean Dinas Penanaman Modal & PTSP untuk penyematan TTE digital.',
    responsibleRole: 'ADMIN_DPMPTSP',
    allowedRolesToView: ['ADMIN_DPMPTSP', 'ADMIN_OSS', 'PEMOHON', 'SUPERADMIN'],
    isTerminalState: false
  },
  IZIN_TERBIT: {
    status: 'IZIN_TERBIT',
    label: 'SK PKKPR Terbit (TTE Sah)',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-800',
    description: 'SK Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) resmi terbit dan aktif.',
    responsibleRole: 'PEMOHON',
    allowedRolesToView: ['ADMIN_PUPTR', 'ADMIN_PERTANIAN', 'ADMIN_DPMPTSP', 'ADMIN_OSS', 'PEMOHON', 'SUPERADMIN'],
    isTerminalState: true
  }
};

/**
 * Normalizes any legacy database status string to canonical PkkprStatusPermohonan
 */
export function normalizeWorkflowStatus(rawStatus?: string | null, rawPertanianStatus?: string | null, rawPertekNum?: string | null, rawSkNum?: string | null): PkkprStatusPermohonan {
  const s = String(rawStatus || '').toUpperCase().trim();
  const ps = String(rawPertanianStatus || '').toUpperCase().trim();

  // 1. Direct match with canonical status
  if (s === 'REVIEW_PUPTR') return 'REVIEW_PUPTR';
  if (s === 'ESCALATED_PERTANIAN') return 'ESCALATED_PERTANIAN';
  if (s === 'REJECTED_PERTANIAN') return 'REJECTED_PERTANIAN';
  if (s === 'PERTEK_PERTANIAN') return 'PERTEK_PERTANIAN';
  if (s === 'REJECTED_FINAL') return 'REJECTED_FINAL';
  if (s === 'PROSES_OSS') return 'PROSES_OSS';
  if (s === 'IZIN_TERBIT') return 'IZIN_TERBIT';

  // 2. Published / TTE Issued
  if (s === 'PUBLISHED' || s === 'IZIN_TERBIT' || (rawSkNum && rawSkNum.includes('DPMPTSP'))) {
    return 'IZIN_TERBIT';
  }

  // 3. Rejected Final
  if (s === 'REJECTED_FINAL' || s === 'REJECTED_PERMANENT' || s === 'REQUIRES REVISION' || s === 'REVISION' || s === 'RETURNED') {
    return 'REJECTED_FINAL';
  }

  // 4. In OSS queue
  if (s === 'PROSES_OSS' || s === 'FORWARDED_TO_OSS' || s === 'APPROVED_PUPTR' || (rawPertekNum && !rawSkNum)) {
    return 'PROSES_OSS';
  }

  // 5. Returned from Pertanian
  if (s === 'REJECTED_PERTANIAN' || ps === 'REJECTED') {
    return 'REJECTED_PERTANIAN';
  }
  if (s === 'PERTEK_PERTANIAN' || s === 'APPROVED_PERTANIAN' || ps === 'APPROVED') {
    return 'PERTEK_PERTANIAN';
  }

  // 6. Escalated to Pertanian
  if (s === 'FORWARDED_TO_PERTANIAN' || s === 'ESCALATED_PERTANIAN' || ps === 'FORWARDED') {
    return 'ESCALATED_PERTANIAN';
  }

  // Default initial state
  return 'REVIEW_PUPTR';
}

/**
 * Filter predicate based on Role and active table queue visibility
 */
export function isVisibleInActiveQueue(status: PkkprStatusPermohonan, role: UserRoleOpd): boolean {
  switch (role) {
    case 'ADMIN_PUPTR':
      // PUPTR manages initial reviews, and action on returned Pertanian items
      return status === 'REVIEW_PUPTR' || status === 'REJECTED_PERTANIAN' || status === 'PERTEK_PERTANIAN';

    case 'ADMIN_PERTANIAN':
      // Pertanian only processes items actively escalated to them
      return status === 'ESCALATED_PERTANIAN';

    case 'ADMIN_DPMPTSP':
    case 'ADMIN_OSS':
      // OSS only processes items approved by PUPTR waiting for TTE & publishing
      return status === 'PROSES_OSS';

    case 'PEMOHON':
      return true;

    case 'SUPERADMIN':
      return true;

    default:
      return false;
  }
}

// Backward Compatibility Aliases
export type PkkprWorkflowStatus = PkkprStatusPermohonan;
export const PKKPR_STATUS_METAS = WORKFLOW_STATUS_CONFIG;
export const normalizePkkprWorkflowStatus = normalizeWorkflowStatus;
export const isAppVisibleForRoleQueue = isVisibleInActiveQueue;

