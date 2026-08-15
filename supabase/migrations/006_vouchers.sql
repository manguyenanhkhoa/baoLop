-- MIGRATION 006: voucher/mã giảm giá
-- Chạy trong Supabase SQL Editor.

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent numeric not null check (discount_percent > 0 and discount_percent <= 100),
  min_order_value_cents integer not null default 0,
  product_id uuid references public.products(id) on delete cascade, -- null = áp dụng toàn bộ đơn
  expires_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.vouchers enable row level security;

-- Chỉ admin mới được xem/sửa toàn bộ bảng voucher trực tiếp (tránh lộ
-- danh sách mã cho khách dò). Khách áp dụng mã qua hàm apply_voucher bên dưới.
drop policy if exists "vouchers_admin_all" on public.vouchers;
create policy "vouchers_admin_all" on public.vouchers
  for all using (public.is_admin()) with check (public.is_admin());

-- Cột lưu voucher đã áp dụng cho đơn hàng
alter table public.orders
  add column if not exists voucher_code text,
  add column if not exists discount_in_cents integer not null default 0;

-- Hàm kiểm tra + áp dụng voucher (chạy với quyền của người tạo hàm, nên
-- đọc được bảng vouchers dù RLS chặn select trực tiếp từ client).
create or replace function public.apply_voucher(
  p_code text,
  p_subtotal_cents integer,
  p_product_ids uuid[]
)
returns table (
  valid boolean,
  message text,
  discount_in_cents integer,
  voucher_id uuid
)
language plpgsql
security definer
as $$
declare
  v public.vouchers%rowtype;
begin
  select * into v from public.vouchers
    where upper(code) = upper(trim(p_code))
    limit 1;

  if not found then
    return query select false, 'Mã voucher không tồn tại.', 0, null::uuid;
    return;
  end if;

  if not v.is_active then
    return query select false, 'Mã voucher đã bị vô hiệu hoá.', 0, null::uuid;
    return;
  end if;

  if now() > v.expires_at then
    return query select false, 'Mã voucher đã hết hạn.', 0, null::uuid;
    return;
  end if;

  if p_subtotal_cents < v.min_order_value_cents then
    return query select false,
      format('Đơn hàng cần tối thiểu %s đ để dùng mã này.', to_char(v.min_order_value_cents, 'FM999,999,999')),
      0, null::uuid;
    return;
  end if;

  if v.product_id is not null and not (v.product_id = any(p_product_ids)) then
    return query select false, 'Mã voucher chỉ áp dụng cho 1 sản phẩm cụ thể không có trong giỏ hàng.', 0, null::uuid;
    return;
  end if;

  return query select true, 'Áp dụng thành công.',
    floor(p_subtotal_cents * v.discount_percent / 100)::integer, v.id;
end;
$$;

grant execute on function public.apply_voucher(text, integer, uuid[]) to authenticated;
