-- Avatars storage bucket and RLS policies (PLAN 8.2)
-- Users can read/write only their own path: {userId}/...

-- Create the avatars bucket (public so avatar URLs work in <img>).
-- Intentionally do not set file_size_limit or allowed_mime_types here so
-- template users can configure those per-project in the dashboard or API.
insert into storage.buckets (id, name, public)
values (
  'avatars',
  'avatars',
  true
)
on conflict (id) do update set
  public = excluded.public;

-- Policies on storage.objects: only allow access to own path (first folder = auth.uid()::text)

create policy "Users can read own avatars"
on storage.objects for select
to authenticated
using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload own avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
