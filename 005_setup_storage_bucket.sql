-- Create public buckets for storage assets, KTP, and evidence
insert into storage.buckets (id, name, public)
values 
  ('hero-assets', 'hero-assets', true),
  ('ktp_masyarakat', 'ktp_masyarakat', true),
  ('pengaduan_evidence', 'pengaduan_evidence', true),
  ('investments', 'investments', true)
on conflict (id) do nothing;

-- Set up row level security policies for public access
create policy "Public Access Read"
on storage.objects for select
to public
using ( bucket_id in ('hero-assets', 'ktp_masyarakat', 'pengaduan_evidence', 'investments') );

create policy "Public Access Insert"
on storage.objects for insert
to public
with check ( bucket_id in ('hero-assets', 'ktp_masyarakat', 'pengaduan_evidence', 'investments') );

create policy "Auth Update Access"
on storage.objects for update
to authenticated
using ( bucket_id in ('hero-assets', 'ktp_masyarakat', 'pengaduan_evidence', 'investments') );

create policy "Auth Delete Access"
on storage.objects for delete
to authenticated
using ( bucket_id in ('hero-assets', 'ktp_masyarakat', 'pengaduan_evidence', 'investments') );
