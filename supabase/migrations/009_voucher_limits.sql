-- MIGRATION 009: voucher dùng 1 lần/khách + voucher chỉ dành khách mới
-- Chạy trong Supabase SQL Editor.

alter table public.vouchers
  add column if not exists new_customers_only boolean not null default false;

-- Bảng ghi lại ai đã dùng voucher nào, để chặn dùng lại lần 2
create table if not exists public.voucher_redemptions (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.vouchers(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (voucher_id, customer_id)
);

alter table public.voucher_redemptions enable row level security;

drop policy if exists "voucher_redemptions_admin_select" on public.voucher_redemptions;
create policy "voucher_redemptions_admin_select" on public.voucher_redemptions
  for select using (public.is_admin());

-- Tự động ghi nhận "đã dùng voucher" ngay khi đơn hàng có voucher_code được tạo.
-- Nhờ ràng buộc unique ở trên, nếu khách cố tình dùng lại mã đã dùng, việc tạo
-- đơn hàng sẽ bị chặn ở tầng database (an toàn kể cả khi có race condition).
create or replace function public.record_voucher_redemption()
returns trigger
language plpgsql
security definer
as $$
declare
  v_voucher_id uuid;
begin
  if new.voucher_code is not null and new.customer_id is not null then
    select id into v_voucher_id from public.vouchers where upper(code) = upper(new.voucher_code) limit 1;
    if v_voucher_id is not null then
      insert into public.voucher_redemptions (voucher_id, customer_id, order_id)
      values (v_voucher_id, new.customer_id, new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_record_voucher_redemption on public.orders;
create trigger trg_record_voucher_redemption
  after insert on public.orders
  for each row execute function public.record_voucher_redemption();

-- Cập nhật hàm apply_voucher: thêm kiểm tra "đã dùng chưa" + "chỉ khách mới"
drop function if exists public.apply_voucher(text, integer, uuid[]);

create or replace function public.apply_voucher(
  p_code text,
  p_subtotal_cents integer,
  p_product_ids uuid[],
  p_customer_id uuid
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
  v_already_used boolean;
  v_prior_orders integer;
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

  select exists(
    select 1 from public.voucher_redemptions
    where voucher_id = v.id and customer_id = p_customer_id
  ) into v_already_used;

  if v_already_used then
    return query select false, 'Bạn đã sử dụng mã này rồi, mỗi khách chỉ dùng được 1 lần.', 0, null::uuid;
    return;
  end if;

  if v.new_customers_only then
    select count(*) into v_prior_orders
      from public.orders
      where customer_id = p_customer_id and status <> 'cancelled';

    if v_prior_orders > 0 then
      return query select false, 'Mã này chỉ dành cho khách hàng mới (chưa từng đặt đơn nào).', 0, null::uuid;
      return;
    end if;
  end if;

  return query select true, 'Áp dụng thành công.',
    floor(p_subtotal_cents * v.discount_percent / 100)::integer, v.id;
end;
$$;

grant execute on function public.apply_voucher(text, integer, uuid[], uuid) to authenticated;
