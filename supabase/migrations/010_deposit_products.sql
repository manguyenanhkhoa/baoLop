-- MIGRATION 010: sản phẩm đặt cọc trước (pre-order/deposit)
-- Chạy trong Supabase SQL Editor.

alter table public.products
  add column if not exists requires_deposit boolean not null default false,
  add column if not exists deposit_amount_cents integer,
  add column if not exists lead_time_text text; -- VD: "7-10 ngày"

alter table public.order_items
  add column if not exists is_deposit boolean not null default false,
  add column if not exists remaining_amount_cents integer not null default 0;
