export interface MPPCitizen {
  nik: string;
  full_name: string;
  phone_number?: string;
  gender?: string;
  occupation?: string;
  pekerjaan?: string;
  jenis_kelamin?: string;
  kecamatan?: string;
  desa?: string;
  address?: string;
  company_name?: string;
  nib?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MPPTenant {
  id: string;
  name: string;
  code: string;
  logo?: string | null;
  floor?: string;
  description?: string;
  is_active?: boolean;
  officer_pin?: string;
  created_at?: string;
}

export interface MPPTenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'admin' | 'staff' | 'supervisor' | string;
  counter_name?: string;
  officer_name?: string;
  username?: string;
  pin_code?: string;
  is_active?: boolean;
  created_at?: string;
  // relations
  tenant?: MPPTenant;
  profile?: {
    full_name?: string;
    email?: string;
  };
}

export interface MPPService {
  id: string;
  tenant_id: string;
  service_name: string;
  name?: string;
  requirements?: string;
  estimated_time_minutes?: number;
  is_active?: boolean;
  is_long_process?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type QueueStatus = 'menunggu' | 'dipanggil' | 'dilayani' | 'selesai_langsung' | 'masuk_tracking' | 'tidak_hadir';

export interface MPPQueue {
  id: string;
  tenant_id: string;
  service_id: string;
  citizen_nik: string;
  queue_date: string;
  queue_number: number;
  ticket_code: string;
  status: QueueStatus;
  session?: string;
  call_count?: number;
  served_by?: string;
  served_by_name?: string;
  counter_name?: string;
  called_at?: string;
  served_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // relations
  citizen?: MPPCitizen;
  service?: MPPService;
  tenant?: MPPTenant;
}

export interface MPPDocumentTracking {
  id: string;
  queue_id: string;
  tracking_code: string;
  current_status: string;
  created_at: string;
  updated_at: string;
}

export interface MPPTrackingHistory {
  id: string;
  tracking_id: string;
  status_description: string;
  updated_by?: string;
  created_at: string;
}

export interface MPPSkm {
  id: string;
  queue_id: string;
  tenant_id: string;
  citizen_nik: string;
  rating: number; // 1 to 5
  feedback?: string;
  created_at: string;
}

export type MppFoRequestStatus = 'pending' | 'responding' | 'resolved';
export type MppFoSourceType = 'layanan_mandiri' | 'gerai_tenant' | 'kiosk' | 'tenant' | 'general' | 'inklusi' | 'lobby';

export interface MppFoRequest {
  id: string;
  source_type: MppFoSourceType | string;
  source_name: string;
  status: MppFoRequestStatus;
  requested_at: string;
  resolved_by?: string | null;
  resolved_at?: string | null;
  notes?: string | null;
  // Join/client-side fields
  resolver_name?: string | null;
  floor?: number | string | null;
}

export interface Operator {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at?: string;
}

export type MppReprimandStatus = 'sent' | 'read' | 'resolved';

export interface MppReprimand {
  id: string;
  tenant_id: string;
  target_user_id?: string | null;
  target_counter_name?: string | null;
  target_officer_name?: string | null;
  quick_reasons: string[];
  comments: string;
  issued_by?: string | null;
  status: MppReprimandStatus;
  read_by_name?: string | null;
  created_at: string;
  read_at?: string | null;
  // Augmented/Joined fields
  tenant_name?: string;
  tenant_code?: string;
  tenant_logo?: string;
}

