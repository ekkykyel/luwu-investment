-- Migration: Create Profiles Table and Setup User Creation Trigger
-- Description: Creates public.profiles for role-based access control (Admin OSS vs. Investor) and configures an automatic database trigger on user signup.

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'investor', -- 'investor' or 'admin_oss' or 'superadmin'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
-- Anyone can view profiles (or restrict if needed, here we allow users to read all profiles for general UI/meta access)
CREATE POLICY "Public profiles are viewable by users." 
    ON public.profiles 
    FOR SELECT 
    USING (true);

-- Users can update only their own profile details
CREATE POLICY "Users can update own profile." 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = id);

-- 2. Create an Automatic Trigger (The Magic Bridge)
-- Create a function that automatically creates a profile entry whenever a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'investor')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on every new auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_new_user();

-- Note to administrator:
-- To manually update the role column for your current admin account in public.profiles:
-- UPDATE public.profiles SET role = 'admin_oss' WHERE email = 'your-admin-email@example.com';
