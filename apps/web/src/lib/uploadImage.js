import { supabase } from '@/lib/supabaseClient';

const BUCKET = 'product-images';
const MAX_SIZE_MB = 5;

// Upload 1 file ảnh lên Supabase Storage, trả về public URL để lưu vào
// products.image / product_variants.image_url.
export async function uploadProductImage(file) {
  if (!file) throw new Error('Không có file nào được chọn.');
  if (!file.type.startsWith('image/')) throw new Error('Chỉ chấp nhận file ảnh (jpg, png, webp...).');
  if (file.size > MAX_SIZE_MB * 1024 * 1024) throw new Error(`Ảnh phải nhỏ hơn ${MAX_SIZE_MB}MB.`);

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
