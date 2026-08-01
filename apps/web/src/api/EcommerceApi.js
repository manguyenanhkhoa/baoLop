// EcommerceApi.js
//
// Lớp gọi dữ liệu cho toàn bộ store. Giờ lấy dữ liệu thật từ Supabase
// (bảng products / product_variants / orders / order_items — xem
// supabase/schema.sql). Giữ nguyên tên hàm + shape dữ liệu trả về để
// không phải sửa lại các trang/component đang dùng.

import { supabase } from '@/lib/supabaseClient';

export const VND_CURRENCY = {
  code: 'VND',
  symbol: 'đ',
  decimal_digits: 0,
};

export function formatCurrency(amountInCents, currencyInfo = VND_CURRENCY) {
  const digits = currencyInfo?.decimal_digits ?? 0;
  const divisor = 10 ** digits;
  const value = (amountInCents ?? 0) / divisor;
  const formattedNumber = value.toLocaleString('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${formattedNumber}${currencyInfo?.symbol ?? ''}`;
}

// Chuyển 1 dòng "product" (kèm product_variants) từ Supabase sang shape
// mà UI đang cần (price_formatted, sale_price_formatted, currency_info...).
function mapProduct(row) {
  const variants = (row.product_variants ?? [])
    .slice()
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    .map((v) => ({
      id: v.id,
      title: v.title,
      price_in_cents: v.price_in_cents,
      sale_price_in_cents: v.sale_price_in_cents,
      price_formatted: formatCurrency(v.price_in_cents, VND_CURRENCY),
      // Luôn có giá trị hiệu lực để hiển thị trong giỏ hàng, kể cả khi
      // sản phẩm không giảm giá.
      sale_price_formatted: formatCurrency(v.sale_price_in_cents ?? v.price_in_cents, VND_CURRENCY),
      inventory_quantity: v.inventory_quantity,
      manage_inventory: v.manage_inventory,
      image_url: v.image_url,
      currency_info: VND_CURRENCY,
    }));

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    image: row.image,
    images: row.images ?? [],
    description: row.description,
    ribbon_text: row.ribbon_text,
    purchasable: row.purchasable,
    additional_info: row.additional_info ?? [],
    variants,
  };
}

const PRODUCT_SELECT = '*, product_variants(*)';

// Trả về danh sách sản phẩm.
// params: { limit?: string | number }
export async function getProducts(params = {}) {
  let query = supabase.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false });

  const limit = params?.limit ? Number(params.limit) : undefined;
  if (typeof limit === 'number' && !Number.isNaN(limit)) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return { products: (data ?? []).map(mapProduct) };
}

// Trả về chi tiết 1 sản phẩm theo id.
export async function getProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .single();

  if (error) throw new Error('Không tìm thấy sản phẩm.');

  return mapProduct(data);
}

// Trả về tồn kho của các variant thuộc danh sách product_ids.
// params: { fields?: string, product_ids: string[] }
export async function getProductQuantities(params = {}) {
  const productIds = params?.product_ids ?? [];

  if (productIds.length === 0) {
    return { variants: [] };
  }

  const { data, error } = await supabase
    .from('product_variants')
    .select('id, inventory_quantity')
    .in('product_id', productIds);

  if (error) throw error;

  return { variants: data ?? [] };
}

// Tạo đơn hàng thật trong Supabase.
// order: { customerId, customerName, customerPhone, customerAddress,
//          paymentMethod: 'cod' | 'vnpay' | 'momo', items: [{variant, product, quantity}] }
export async function createOrder(order) {
  const totalInCents = order.items.reduce(
    (sum, item) => sum + (item.variant.sale_price_in_cents ?? item.variant.price_in_cents) * item.quantity,
    0
  );

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: order.customerId ?? null,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_address: order.customerAddress,
      payment_method: order.paymentMethod,
      payment_status: 'pending',
      status: 'processing',
      total_in_cents: totalInCents,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = order.items.map((item) => ({
    order_id: newOrder.id,
    variant_id: item.variant.id,
    product_title: item.product.title,
    variant_title: item.variant.title,
    quantity: item.quantity,
    price_in_cents: item.variant.sale_price_in_cents ?? item.variant.price_in_cents,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;

  // LƯU Ý: 'vnpay' / 'momo' chưa nối cổng thanh toán thật (chưa có API key).
  // Khi có key, thay đoạn dưới bằng lời gọi 1 serverless function (Vercel
  // API route) để tạo URL thanh toán thật và trả về ở đây.
  if (order.paymentMethod === 'vnpay' || order.paymentMethod === 'momo') {
    console.warn(
      `[EcommerceApi] Cổng thanh toán "${order.paymentMethod}" chưa được cấu hình API key. ` +
      'Đơn hàng đã được tạo với trạng thái "chờ thanh toán", chưa thu tiền thật.'
    );
  }

  return { order: newOrder, totalInCents };
}
