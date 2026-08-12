// Supabase Edge Function: notify-new-order
//
// Được gọi tự động mỗi khi có 1 dòng mới trong bảng "orders" (qua Database
// Webhook cấu hình trong Supabase Dashboard). Lấy chi tiết đơn hàng rồi gửi
// email thông báo cho admin qua Resend.
//
// Cách deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> đặt tên đúng "notify-new-order" -> dán toàn bộ nội dung file này -> Deploy.
//
// Cần đặt 2 secret (Dashboard -> Edge Functions -> Manage secrets):
//   RESEND_API_KEY = key Resend của bạn (re_...)
//   ADMIN_EMAIL    = email admin muốn nhận thông báo

// deno-lint-ignore-file no-explicit-any
Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const order = payload?.record;

    if (!order?.id) {
      return new Response(JSON.stringify({ error: 'Không có dữ liệu đơn hàng' }), { status: 400 });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL');

    if (!RESEND_API_KEY || !ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: 'Thiếu secret RESEND_API_KEY hoặc ADMIN_EMAIL' }), { status: 500 });
    }

    // Lấy danh sách sản phẩm trong đơn (dùng service role để đọc không bị RLS chặn)
    const itemsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${order.id}&select=product_title,variant_title,quantity,price_in_cents`,
      { headers: { apikey: SERVICE_ROLE_KEY!, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
    );
    const items: any[] = itemsRes.ok ? await itemsRes.json() : [];

    const money = (cents: number) => `${Math.round(cents ?? 0).toLocaleString('vi-VN')}đ`;

    const itemsHtml = items
      .map((it) => `<li>${it.product_title} (${it.variant_title}) × ${it.quantity} — ${money(it.price_in_cents * it.quantity)}</li>`)
      .join('');

    const paymentLabel: Record<string, string> = { cod: 'COD', bank_transfer: 'Chuyển khoản VCB', momo: 'Momo', vnpay: 'VNPay' };

    const html = `
      <h2>🔔 Đơn hàng mới #${String(order.id).slice(0, 8).toUpperCase()}</h2>
      <p><b>Khách hàng:</b> ${order.customer_name} — ${order.customer_phone}</p>
      <p><b>Địa chỉ:</b> ${order.customer_address}</p>
      <p><b>Thanh toán:</b> ${paymentLabel[order.payment_method] ?? order.payment_method}</p>
      <p><b>Sản phẩm:</b></p>
      <ul>${itemsHtml}</ul>
      <p><b>Phí ship:</b> ${money(order.shipping_fee_in_cents)}</p>
      <p><b>Tổng cộng: ${money(order.total_in_cents)}</b></p>
      <p style="margin-top:16px"><a href="https://bao-lop-web.vercel.app/admin/orders">Xem trong trang Quản trị</a></p>
    `;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BÁO LỐP <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        subject: `🔔 Đơn hàng mới từ ${order.customer_name} — ${money(order.total_in_cents)}`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      return new Response(JSON.stringify({ error: 'Gửi email thất bại', detail: errText }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
