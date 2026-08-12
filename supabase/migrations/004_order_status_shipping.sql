-- MIGRATION 004: luồng trạng thái đơn hàng + thông tin vận chuyển + vị trí bản đồ
-- Chạy trong Supabase SQL Editor.

alter table public.orders
  add column if not exists shipping_code text,
  add column if not exists shipping_provider text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

-- Cập nhật giá trị status mặc định + chuẩn hoá dữ liệu cũ sang trạng thái mới.
-- Các giá trị hợp lệ từ giờ: pending_confirmation, confirmed, packing,
-- picked_up, delivered, cancelled.
update public.orders set status = 'pending_confirmation' where status = 'processing';
update public.orders set status = 'delivered' where status = 'completed';
update public.orders set status = 'picked_up' where status = 'shipped';

alter table public.orders alter column status set default 'pending_confirmation';

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check check (
    status in ('pending_confirmation', 'confirmed', 'packing', 'picked_up', 'delivered', 'cancelled')
  );
