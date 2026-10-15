-- Migration: Create mpp_pull_next_queue function for row-level locked next-call queue pulling
CREATE OR REPLACE FUNCTION public.mpp_pull_next_queue(
  p_tenant_id UUID,
  p_served_by UUID,
  p_served_by_name TEXT,
  p_counter_name TEXT
)
RETURNS SETOF public.mpp_queues AS $$
DECLARE
  v_queue public.mpp_queues;
BEGIN
  -- 1. Ambil 1 antrean teratas yang berstatus 'menunggu' untuk tenant ini pada hari ini dengan SKIP LOCKED
  SELECT *
  INTO v_queue
  FROM public.mpp_queues
  WHERE tenant_id = p_tenant_id
    AND queue_date = CURRENT_DATE
    AND status = 'menunggu'
  ORDER BY queue_number ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- 2. Jika ditemukan, update baris antrean tersebut
  IF v_queue.id IS NOT NULL THEN
    UPDATE public.mpp_queues
    SET status = 'dipanggil',
        call_count = COALESCE(v_queue.call_count, 0) + 1,
        served_by = p_served_by,
        served_by_name = p_served_by_name,
        counter_name = p_counter_name,
        called_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_queue.id
    RETURNING * INTO v_queue;
    
    RETURN NEXT v_queue;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
