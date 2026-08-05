-- MIGRATION 002: thêm phân loại sản phẩm + phí ship
-- Chạy file này trong Supabase SQL Editor (chỉ cần chạy 1 lần).
-- An toàn để chạy lại nhiều lần (dùng IF NOT EXISTS).

alter table public.products
  add column if not exists category text not null default '1:64';

-- Giới hạn giá trị hợp lệ cho category
alter table public.products drop constraint if exists products_category_check;
alter table public.products
  add constraint products_category_check check (category in ('1:64', '1:32', 'diorama'));

alter table public.orders
  add column if not exists shipping_fee_in_cents integer not null default 0;

-- (Tuỳ chọn) Gợi ý cập nhật phân loại cho 9 sản phẩm mẫu nếu bạn đã chạy seed.sql
-- trước đó — chạy đoạn dưới nếu muốn tự động gán lại cho đúng:
update public.products set category = '1:32'
  where title ilike '%tải%' or title ilike '%cứu hỏa%' or title ilike '%container%';
update public.products set category = 'diorama'
  where title ilike 'sa bàn%';
