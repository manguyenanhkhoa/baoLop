-- MIGRATION 005: sổ địa chỉ khách hàng + bắt buộc đăng nhập khi đặt hàng
-- Chạy trong Supabase SQL Editor.

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  label text,
  city text not null,
  district text not null,
  ward text not null,
  street_address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.customer_addresses enable row level security;

drop policy if exists "addresses_select_own" on public.customer_addresses;
create policy "addresses_select_own" on public.customer_addresses
  for select using (auth.uid() = customer_id);

drop policy if exists "addresses_write_own" on public.customer_addresses;
create policy "addresses_write_own" on public.customer_addresses
  for all using (auth.uid() = customer_id) with check (auth.uid() = customer_id);

-- Từ giờ bắt buộc phải đăng nhập mới đặt được đơn (bỏ cho phép customer_id null)
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = customer_id);
