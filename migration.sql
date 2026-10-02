ALTER TABLE public.profiles 
ADD COLUMN negara_asal TEXT DEFAULT 'Indonesia',
ADD COLUMN status_modal TEXT DEFAULT 'PMDN';

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, negara_asal, status_modal)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'investor'),
    COALESCE(NEW.raw_user_meta_data->>'negara_asal', 'Indonesia'),
    COALESCE(NEW.raw_user_meta_data->>'status_modal', 'PMDN')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
