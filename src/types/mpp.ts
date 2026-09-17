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
