-- MIGRATION 003: Storage bucket cho ảnh sản phẩm
-- Chạy trong Supabase SQL Editor (chỉ cần chạy 1 lần).

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Ai cũng xem được ảnh (bucket public)
drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

-- Chỉ admin mới được tải lên / sửa / xoá ảnh
drop policy if exists "Admin upload product images" on storage.objects;
create policy "Admin upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admin update product images" on storage.objects;
create policy "Admin update product images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admin delete product images" on storage.objects;
create policy "Admin delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());
