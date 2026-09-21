CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    old_data jsonb,
    new_data jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert logs
CREATE POLICY "Enable insert for authenticated users only" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow all authenticated users to read (restrict to Admins later if role column is added)
CREATE POLICY "Enable read access for authenticated users" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (true);

-- generic trigger function for auditing
CREATE OR REPLACE FUNCTION public.audit_log_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (action, table_name, record_id, user_id, old_data)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.id, auth.uid(), to_jsonb(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (action, table_name, record_id, user_id, old_data, new_data)
        VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (action, table_name, record_id, user_id, new_data)
        VALUES ('INSERT', TG_TABLE_NAME, NEW.id, auth.uid(), to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage example:
-- DROP TRIGGER IF EXISTS audit_investments_trigger ON public.investments;
-- CREATE TRIGGER audit_investments_trigger
-- AFTER INSERT OR UPDATE OR DELETE ON public.investments
-- FOR EACH ROW EXECUTE PROCEDURE public.audit_log_trigger_func();

