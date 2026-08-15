-- MIGRATION 007: tự động trừ/hoàn tồn kho theo đơn hàng
-- Chạy trong Supabase SQL Editor.

-- 1) Khi có dòng order_items mới (tức vừa đặt đơn) -> trừ tồn kho
create or replace function public.decrement_variant_stock()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.variant_id is not null then
    update public.product_variants
    set inventory_quantity = greatest(0, inventory_quantity - new.quantity)
    where id = new.variant_id and manage_inventory = true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_decrement_stock on public.order_items;
create trigger trg_decrement_stock
  after insert on public.order_items
  for each row execute function public.decrement_variant_stock();

-- 2) Khi đơn hàng đổi trạng thái sang/khỏi "cancelled" -> hoàn lại / trừ lại tồn kho
create or replace function public.adjust_stock_on_cancel()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    -- Huỷ đơn: hoàn lại hàng vào kho
    update public.product_variants v
    set inventory_quantity = inventory_quantity + oi.quantity
    from public.order_items oi
    where oi.order_id = new.id and oi.variant_id = v.id and v.manage_inventory = true;
  elsif old.status = 'cancelled' and new.status is distinct from 'cancelled' then
    -- Bỏ huỷ (khôi phục đơn): trừ lại hàng như lúc đặt
    update public.product_variants v
    set inventory_quantity = greatest(0, inventory_quantity - oi.quantity)
    from public.order_items oi
    where oi.order_id = new.id and oi.variant_id = v.id and v.manage_inventory = true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_adjust_stock_on_cancel on public.orders;
create trigger trg_adjust_stock_on_cancel
  after update on public.orders
  for each row execute function public.adjust_stock_on_cancel();
