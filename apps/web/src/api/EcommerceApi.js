// EcommerceApi.js
//
// File này BỊ THIẾU trong source code export từ Hostinger Horizons (nó gọi
// tới backend e-commerce nội bộ của Hostinger, không được export ra ngoài).
// Đây là bản thay thế chạy độc lập, dùng dữ liệu mẫu local trong
// `src/data/products.js`, để dự án build & chạy được trên bất kỳ nền tảng
// nào (Vercel, Netlify, v.v.) mà không phụ thuộc hạ tầng Hostinger.
//
// Khi nào bạn có backend/database thật (Supabase, API riêng...), chỉ cần
// thay nội dung bên trong các hàm dưới đây bằng lời gọi `fetch(...)` thật,
// giữ nguyên tên hàm + shape dữ liệu trả về là toàn bộ UI vẫn chạy đúng,
// không cần sửa các file khác.

import { PRODUCTS, formatCurrency as formatCurrencyImpl } from '@/data/products';

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

// Trả về danh sách sản phẩm.
// params: { limit?: string | number }
export async function getProducts(params = {}) {
  await delay();

  const limit = params?.limit ? Number(params.limit) : undefined;
  const products = typeof limit === 'number' && !Number.isNaN(limit)
    ? PRODUCTS.slice(0, limit)
    : PRODUCTS.slice();

  return { products };
}

// Trả về chi tiết 1 sản phẩm theo id.
export async function getProduct(id) {
  await delay();

  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) {
    throw new Error('Không tìm thấy sản phẩm.');
  }

  return product;
}

// Trả về tồn kho của các variant thuộc danh sách product_ids.
// params: { fields?: string, product_ids: string[] }
export async function getProductQuantities(params = {}) {
  await delay();

  const productIds = params?.product_ids ?? [];

  const variants = PRODUCTS
    .filter((p) => productIds.includes(p.id))
    .flatMap((p) => p.variants.map((v) => ({
      id: v.id,
      inventory_quantity: v.inventory_quantity,
    })));

  return { variants };
}

// Khởi tạo phiên thanh toán.
// params: { items: {variant_id, quantity}[], successUrl: string, cancelUrl: string }
//
// LƯU Ý: chưa nối với cổng thanh toán thật nào (VNPay/Momo/Stripe...).
// Hàm này hiện chỉ mô phỏng để trang không bị lỗi khi bấm "Thanh toán" —
// nó điều hướng thẳng tới trang thành công mà KHÔNG thu tiền thật.
// Khi có cổng thanh toán, thay nội dung hàm này bằng lời gọi API backend
// tương ứng và trả về { url } là link thanh toán thật do cổng đó cung cấp.
export async function initializeCheckout({ items, successUrl, cancelUrl } = {}) {
  await delay(300);

  if (!items || items.length === 0) {
    throw new Error('Giỏ hàng đang trống.');
  }

  console.warn(
    '[EcommerceApi] initializeCheckout: chưa nối cổng thanh toán thật. ' +
    'Đang điều hướng thẳng tới trang thành công (không thu tiền).',
    { items, cancelUrl }
  );

  return { url: successUrl };
}

// Định dạng tiền tệ. amountInCents ở đây là số tiền VNĐ (không chia 100),
// currencyInfo lấy từ variant.currency_info.
export function formatCurrency(amountInCents, currencyInfo) {
  return formatCurrencyImpl(amountInCents, currencyInfo);
}
