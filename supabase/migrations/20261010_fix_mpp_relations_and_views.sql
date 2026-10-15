-- =======================================================================
-- MIGRATION: 20261010_fix_mpp_relations_and_views.sql
-- Resolves PostgREST 400 Bad Request on MPP relations by guaranteeing:
-- 1. Explicit Primary Keys & Foreign Key Constraints for PostgREST schema cache
-- 2. Comprehensive Database Views (v_mpp_queues_complete, v_mpp_document_tracking_complete)
-- =======================================================================

-- 1. Ensure Primary Keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_tenants_pkey') THEN
    ALTER TABLE public.mpp_tenants ADD CONSTRAINT mpp_tenants_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_citizens_pkey') THEN
    ALTER TABLE public.mpp_citizens ADD CONSTRAINT mpp_citizens_pkey PRIMARY KEY (nik);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_services_pkey') THEN
    ALTER TABLE public.mpp_services ADD CONSTRAINT mpp_services_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_queues_pkey') THEN
    ALTER TABLE public.mpp_queues ADD CONSTRAINT mpp_queues_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_document_tracking_pkey') THEN
    ALTER TABLE public.mpp_document_tracking ADD CONSTRAINT mpp_document_tracking_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_skm_pkey') THEN
    ALTER TABLE public.mpp_skm ADD CONSTRAINT mpp_skm_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- 2. Ensure Foreign Key Constraints for PostgREST resource embedding
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_queues_tenant_id_fkey') THEN
    ALTER TABLE public.mpp_queues ADD CONSTRAINT mpp_queues_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES public.mpp_tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_queues_service_id_fkey') THEN
    ALTER TABLE public.mpp_queues ADD CONSTRAINT mpp_queues_service_id_fkey 
      FOREIGN KEY (service_id) REFERENCES public.mpp_services(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_queues_citizen_nik_fkey') THEN
    ALTER TABLE public.mpp_queues ADD CONSTRAINT mpp_queues_citizen_nik_fkey 
      FOREIGN KEY (citizen_nik) REFERENCES public.mpp_citizens(nik) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_services_tenant_id_fkey') THEN
    ALTER TABLE public.mpp_services ADD CONSTRAINT mpp_services_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES public.mpp_tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_document_tracking_queue_id_fkey') THEN
    ALTER TABLE public.mpp_document_tracking ADD CONSTRAINT mpp_document_tracking_queue_id_fkey 
      FOREIGN KEY (queue_id) REFERENCES public.mpp_queues(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_skm_queue_id_fkey') THEN
    ALTER TABLE public.mpp_skm ADD CONSTRAINT mpp_skm_queue_id_fkey 
      FOREIGN KEY (queue_id) REFERENCES public.mpp_queues(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_skm_tenant_id_fkey') THEN
    ALTER TABLE public.mpp_skm ADD CONSTRAINT mpp_skm_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES public.mpp_tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mpp_skm_citizen_nik_fkey') THEN
    ALTER TABLE public.mpp_skm ADD CONSTRAINT mpp_skm_citizen_nik_fkey 
      FOREIGN KEY (citizen_nik) REFERENCES public.mpp_citizens(nik) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Comprehensive Pre-Joined Views (Database View Alternative)
CREATE OR REPLACE VIEW public.v_mpp_queues_complete AS
  SELECT 
    q.id,
    q.ticket_code,
    q.citizen_nik,
    q.tenant_id,
    q.service_id,
    q.queue_number,
    q.queue_date,
    q.status,
    q.session,
    q.call_count,
    q.served_by,
    q.served_by_name,
    q.counter_name,
    q.called_at,
    q.served_at,
    q.completed_at,
    q.created_at,
    q.updated_at,
    t.name AS tenant_name,
    t.code AS tenant_code,
    t.floor AS tenant_floor,
    t.logo AS tenant_logo,
    s.service_name,
    s.requirements AS service_requirements,
    s.is_long_process AS service_is_long_process,
    c.full_name AS citizen_name,
    c.phone_number AS citizen_phone,
    c.address AS citizen_address,
    c.occupation AS citizen_occupation,
    c.gender AS citizen_gender
  FROM public.mpp_queues q
  LEFT JOIN public.mpp_tenants t ON q.tenant_id = t.id
  LEFT JOIN public.mpp_services s ON q.service_id = s.id
  LEFT JOIN public.mpp_citizens c ON q.citizen_nik = c.nik;

CREATE OR REPLACE VIEW public.v_mpp_document_tracking_complete AS
  SELECT 
    dt.id,
    dt.queue_id,
    dt.tracking_code,
    dt.current_status,
    dt.created_at,
    dt.updated_at,
    q.ticket_code,
    q.status AS queue_status,
    q.session AS queue_session,
    q.queue_number,
    q.queue_date,
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.code AS tenant_code,
    t.floor AS tenant_floor,
    s.id AS service_id,
    s.service_name,
    c.nik AS citizen_nik,
    c.full_name AS citizen_name,
    c.phone_number AS citizen_phone
  FROM public.mpp_document_tracking dt
  LEFT JOIN public.mpp_queues q ON dt.queue_id = q.id
  LEFT JOIN public.mpp_tenants t ON q.tenant_id = t.id
  LEFT JOIN public.mpp_services s ON q.service_id = s.id
  LEFT JOIN public.mpp_citizens c ON q.citizen_nik = c.nik;

-- 4. Permissions
GRANT SELECT ON public.v_mpp_queues_complete TO anon, authenticated, service_role;
GRANT SELECT ON public.v_mpp_document_tracking_complete TO anon, authenticated, service_role;

-- 5. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
