import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Không throw để tránh vỡ toàn bộ app khi thiếu biến môi trường lúc dev,
  // nhưng sẽ log rõ ràng để dễ nhận ra khi deploy thiếu cấu hình.
  console.error(
    '[supabaseClient] Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY. ' +
    'Kiểm tra file .env (local) hoặc Environment Variables trên Vercel.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
