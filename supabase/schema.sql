-- ============================================================
-- SCHEMA CHO baoLop (chạy trong Supabase → SQL Editor → New query)
-- Chạy TOÀN BỘ file này một lần. An toàn để chạy lại (dùng IF NOT EXISTS).
-- ============================================================

-- 1) PROFILES: mở rộng thông tin cho auth.users (Supabase Auth có sẵn users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tự động tạo 1 dòng profile khi có user mới đăng ký
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  image text,
  images jsonb not null default '[]',
  ribbon_text text,
  purchasable boolean not null default true,
  additional_info jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- 3) PRODUCT VARIANTS
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  price_in_cents integer not null,
  sale_price_in_cents integer,
  inventory_quantity integer not null default 0,
  manage_inventory boolean not null default true,
  image_url text,
  created_at timestamptz not null default now()
);

-- 4) ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  payment_method text not null default 'cod', -- 'cod' | 'vnpay' | 'momo'
  payment_status text not null default 'pending', -- 'pending' | 'paid' | 'failed'
  status text not null default 'processing', -- 'processing' | 'shipped' | 'completed' | 'cancelled'
  total_in_cents integer not null,
  created_at timestamptz not null default now()
);

-- 5) ORDER ITEMS
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_title text not null,
  variant_title text not null,
  quantity integer not null,
  price_in_cents integer not null
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Helper: kiểm tra người dùng hiện tại có phải admin không
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- PROFILES: ai cũng đọc được profile của chính mình; admin đọc được tất cả
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- PRODUCTS: ai cũng xem được (khách vãng lai xem sản phẩm); chỉ admin sửa/xoá/thêm
drop policy if exists "products_select_all" on public.products;
create policy "products_select_all" on public.products
  for select using (true);

drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- VARIANTS: giống products
drop policy if exists "variants_select_all" on public.product_variants;
create policy "variants_select_all" on public.product_variants
  for select using (true);

drop policy if exists "variants_write_admin" on public.product_variants;
create policy "variants_write_admin" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- ORDERS: khách chỉ thấy đơn của mình; admin thấy tất cả
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (auth.uid() = customer_id or public.is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = customer_id or customer_id is null);

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin());

-- ORDER ITEMS: theo quyền của order tương ứng
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items
  for insert with check (true);

-- ============================================================
-- Sau khi chạy xong file này, hãy nhập dữ liệu sản phẩm mẫu
-- (chạy file seed.sql), và tự tay set is_admin = true cho tài
-- khoản của bạn bằng lệnh:
--
-- update public.profiles set is_admin = true where id =
--   (select id from auth.users where email = 'email-cua-ban@gmail.com');
-- ============================================================
