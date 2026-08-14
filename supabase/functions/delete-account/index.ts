// Supabase Edge Function: delete-account
//
// Cho phép người dùng ĐANG ĐĂNG NHẬP tự xoá tài khoản của chính họ.
// Việc xoá user thật sự cần quyền service_role (không được phép làm từ
// trình duyệt), nên phải đi qua Edge Function này.
//
// Cách deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> đặt tên CHÍNH XÁC: delete-account -> dán toàn bộ nội dung file này -> Deploy.
// Không cần thêm secret nào — SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY được
// Supabase tự động cấp sẵn cho mọi Edge Function.

// deno-lint-ignore-file no-explicit-any
Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Thiếu Authorization header' }), { status: 401 });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Xác thực token của người gọi để lấy đúng user id của chính họ
    // (không cho phép truyền id tuỳ ý để xoá người khác).
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: authHeader },
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: 'Không xác thực được người dùng' }), { status: 401 });
    }

    const user = await userRes.json();

    const deleteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    });

    if (!deleteRes.ok) {
      const detail = await deleteRes.text();
      return new Response(JSON.stringify({ error: 'Xoá tài khoản thất bại', detail }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
