insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'erp-imagenes',
  'erp-imagenes',
  true,
  8388608,
  array['image/webp', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "imagenes erp lectura publica" on storage.objects;
create policy "imagenes erp lectura publica"
on storage.objects
for select
to public
using (bucket_id = 'erp-imagenes');

drop policy if exists "imagenes erp autenticados administran" on storage.objects;
create policy "imagenes erp autenticados administran"
on storage.objects
for all
to authenticated
using (bucket_id = 'erp-imagenes')
with check (bucket_id = 'erp-imagenes');
