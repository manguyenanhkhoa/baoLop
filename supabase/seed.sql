-- Dữ liệu sản phẩm mẫu (chạy SAU KHI đã chạy schema.sql)
-- An toàn để chạy lại: xoá dữ liệu cũ trước khi chèn lại.
delete from public.product_variants;
delete from public.products;

do $$
declare
  v_product_id uuid;
begin
  insert into public.products (id, title, subtitle, description, image, images, ribbon_text, purchasable, additional_info)
  values (gen_random_uuid(), 'Mô hình xe Ford Mustang GT 1:64', 'Khung hợp kim nguyên khối, chi tiết sắc nét', '<p>Mô hình xe Ford Mustang GT tỉ lệ 1:64, đúc bằng hợp kim kẽm cao cấp, sơn tĩnh điện bền màu. Phù hợp trưng bày hoặc sưu tầm.</p>', 'https://picsum.photos/seed/mustang/800/600', '[{"url":"https://picsum.photos/seed/mustang/800/600"},{"url":"https://picsum.photos/seed/mustang-2/800/600"}]'::jsonb, 'Bán chạy', true, '[{"id":"a1","title":"Chất liệu","description":"<p>Hợp kim kẽm (die-cast), kính chắn gió nhựa trong.</p>","order":1},{"id":"a2","title":"Đóng gói","description":"<p>Hộp acrylic trong suốt, kèm đế trưng bày.</p>","order":2}]'::jsonb)
  returning id into v_product_id;

  insert into public.product_variants (product_id, title, price_in_cents, sale_price_in_cents, inventory_quantity, manage_inventory, image_url)
  values (v_product_id, 'Màu đỏ', 350000, null, 14, true, 'https://picsum.photos/seed/mustang/800/600');
  insert into public.product_variants (product_id, title, price_in_cents, sale_price_in_cents, inventory_quantity, manage_inventory, image_url)
  values (v_product_id, 'Màu xanh', 350000, 299000, 6, true, 'https://picsum.photos/seed/mustang-2/800/600');
end $$;

do $$
declare
  v_product_id uuid;
begin
  insert into public.products (id, title, subtitle, description, image, images, ribbon_text, purchasable, additional_info)
  values (gen_random_uuid(), 'Mô hình xe Lamborghini Aventador 1:64', 'Phiên bản giới hạn, cửa cắt kéo mở được', '<p>Aventador tỉ lệ 1:64 với cửa mở kiểu cắt kéo, nội thất chi tiết, phù hợp cho người mới bắt đầu sưu tầm.</p>', 'https://picsum.photos/seed/lambo/800/600', '[{"url":"https://picsum.photos/seed/lambo/800/600"}]'::jsonb, 'Mới về', true, '[{"id":"a1","title":"Chất liệu","description":"<p>Hợp kim kẽm, lốp cao su.</p>","order":1}]'::jsonb)
  returning id into v_product_id;

  insert into public.product_variants (product_id, title, price_in_cents, sale_price_in_cents, inventory_quantity, manage_inventory, image_url)
  values (v_product_id, 'Màu vàng', 420000, null, 9, true, 'https://picsum.photos/seed/lambo/800/600');
end $$;

do $$
declare
  v_product_id uuid;
begin
  insert into public.products (id, title, subtitle, description, image, images, ribbon_text, purchasable, additional_info)
  values (gen_random_uuid(), 'Mô hình xe Toyota AE86 1:64', 'Bản độ drift, mâm độ chi tiết', '<p>AE86 phong cách drift huyền thoại, mâm xe độ và tem xe chi tiết sắc nét.</p>', 'https://picsum.photos/seed/ae86/800/600', '[{"url":"https://picsum.photos/seed/ae86/800/600"}]'::jsonb, null, true, '[]'::jsonb)
  returning id into v_product_id;

  insert into public.product_variants (product_id, title, price_in_cents, sale_price_in_cents, inventory_quantity, manage_inventory, image_url)
  values (v_product_id, 'Bản Trắng - Đen', 320000, null, 0, true, 'https://picsum.photos/seed/ae86/800/600');
end $$;

do $$
declare
  v_product_id uuid;
begin
  insert into public.products (id, title, subtitle, description, image, images, ribbon_text, purchasable, additional_info)
  values (gen_random_uuid(), 'Mô hình xe tải Volvo FH16 1:34', 'Chi tiết cabin, thùng xe có thể tháo rời', '<p>Mô hình xe tải Volvo FH16 tỉ lệ 1:34, thùng xe tháo lắp được, phù hợp trưng bày trong bộ sưu tập xe tải.</p>', 'https://picsum.photos/seed/volvo-truck/800/600', '[{"url":"https://picsum.photos/seed/volvo-truck/800/600"},{"url":"https://picsum.photos/seed/volvo-truck-2/800/600"}]'::jsonb, 'Bán chạy', true, '[{"id":"a1","title":"Kích thước","description":"<p>Dài khoảng 26cm.</p>","order":1}]'::jsonb)
  returning id into v_product_id;

  insert into public.product_variants (product_id, title, price_in_cents, sale_price_in_cents, inventory_quantity, manage_inventory, image_url)
  values (v_product_id, 'Màu xanh dương', 650000, 549000, 5, true, 'https://picsum.photos/seed/volvo-truck/800/600');
end $$;

do $$
declare
  v_product_id uuid;
begin
  insert into public.products (id, title, subtitle, description, image, images, ribbon_text, purchasable, additional_info)
  values (gen_random_uuid(), 'Mô hình xe cứu hỏa Scania 1:34', 'Có thang cứu hỏa kéo dài được', '<p>Xe cứu hỏa Scania tỉ lệ 1:34, thang có thể kéo dài và xoay, đèn còi mô phỏng chi tiết.</p>', 'https://picsum.photos/seed/scania-fire/800/600', '[{"url":"https://picsum.photos/seed/scania-fire/800/600"}]'::jsonb, null, true, '[]'::jsonb)
  returning id into v_product_id;

  insert into public.product_variants (product_id, title, price_in_cents, sale_price_in_cents, inventory_quantity, manage_inventory, image_url)
  values (v_product_id, 'Bản tiêu chuẩn', 720000, null, 3, true, 'https://picsum.photos/seed/scania-fire/800/600');
end $$;

do $$
declare
  v_product_id uuid;
begin
  insert into public.products (id, title, subtitle, description, image, images, ribbon_text, purchasable, additional_info)
  values (gen_random_uuid(), 'Mô hình xe container MAN TGX 1:34', 'Kèm rơ-moóc container 40 feet', '<p>Bộ đầu kéo MAN TGX cùng rơ-moóc container 40 feet tỉ lệ 1:34, bánh xe cao su xoay được.</p>', 'https://picsum.photos/seed/man-tgx/800/600', '[{"url":"https://picsum.photos/seed/man-tgx/800/600"}]'::jsonb, null, true, '[]'::jsonb)
  returning id into v_product_id;

  insert into public.product_variants (product_id, title, price_in_cents, sale_price_in_cents, inventory_quantity, manage_inventory, image_url)
  values (v_product_id, 'Màu trắng', 890000, null, 4, true, 'https://picsum.photos/seed/man-tgx/800/600');
end $$;

do $$
declare
  v_product_id uuid;
begin
  insert into public.products (id, title, subtitle, description, image, images, ribbon_text, purchasable, additional_info)
  values (gen_random_uuid(), 'Sa bàn Góc phố Sài Gòn xưa', 'Diorama tái hiện góc phố thập niên 90', '<p>Sa bàn diorama tái hiện một góc phố Sài Gòn thập niên 90, kèm nhà phố, cột điện và tiểu cảnh cây xanh, tỉ lệ tương thích xe 1:64.</p>', 'https://picsum.photos/seed/diorama-saigon/800/600', '[{"url":"https://picsum.photos/seed/diorama-saigon/800/600"},{"url":"https://picsum.photos/seed/diorama-saigon-2/800/600"}]'::jsonb, 'Hàng thủ công', true, '[{"id":"a1","title":"Kích thước sa bàn","description":"<p>30cm x 20cm, đế gỗ MDF sơn phủ.</p>","order":1}]'::jsonb)
  returning id into v_product_id;

  insert into public.product_variants (product_id, title, price_in_cents, sale_price_in_cents, inventory_quantity, manage_inventory, image_url)
  values (v_product_id, 'Bản tiêu chuẩn', 890000, null, 2, true, 'https://picsum.photos/seed/diorama-saigon/800/600');
end $$;

do $$
declare
  v_product_id uuid;
begin
  insert into public.products (id, title, subtitle, description, image, images, ribbon_text, purchasable, additional_info)
  values (gen_random_uuid(), 'Sa bàn Trạm xăng ven đường', 'Diorama trạm xăng phong cách Mỹ', '<p>Sa bàn trạm xăng phong cách Mỹ cổ điển, có mái che, trụ bơm xăng và biển hiệu chi tiết, tỉ lệ tương thích xe 1:64.</p>', 'https://picsum.photos/seed/diorama-gas/800/600', '[{"url":"https://picsum.photos/seed/diorama-gas/800/600"}]'::jsonb, null, true, '[]'::jsonb)
  returning id into v_product_id;

  insert into public.product_variants (product_id, title, price_in_cents, sale_price_in_cents, inventory_quantity, manage_inventory, image_url)
  values (v_product_id, 'Bản tiêu chuẩn', 750000, 649000, 7, true, 'https://picsum.photos/seed/diorama-gas/800/600');
end $$;

do $$
declare
  v_product_id uuid;
begin
  insert into public.products (id, title, subtitle, description, image, images, ribbon_text, purchasable, additional_info)
  values (gen_random_uuid(), 'Mô hình xe Porsche 911 GT3 1:64', 'Bản đua, cánh gió sau chi tiết', '<p>Porsche 911 GT3 tỉ lệ 1:64 phong cách đua, cánh gió sau và ống xả đôi chi tiết sắc nét.</p>', 'https://picsum.photos/seed/porsche/800/600', '[{"url":"https://picsum.photos/seed/porsche/800/600"}]'::jsonb, 'Mới về', true, '[]'::jsonb)
  returning id into v_product_id;

  insert into public.product_variants (product_id, title, price_in_cents, sale_price_in_cents, inventory_quantity, manage_inventory, image_url)
  values (v_product_id, 'Màu trắng - đỏ', 380000, null, 11, true, 'https://picsum.photos/seed/porsche/800/600');
end $$;

