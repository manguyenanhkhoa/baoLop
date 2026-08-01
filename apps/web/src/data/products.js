// Dữ liệu sản phẩm mẫu (local mock data).
//
// File này thay thế cho backend e-commerce nội bộ của Hostinger Horizons
// (vốn không được export ra cùng source code). Bạn có thể:
//  - Sửa trực tiếp danh sách sản phẩm bên dưới, hoặc
//  - Thay toàn bộ file này bằng lời gọi tới backend/API thật của bạn
//    (Supabase, một API tự viết, Google Sheets, v.v.)
//
// Chỉ cần giữ nguyên hình dạng (shape) dữ liệu bên dưới thì phần giao diện
// (ProductCard, StorePage, ProductDetailPage, ShoppingCart...) sẽ chạy đúng
// mà không cần sửa gì thêm.

export const VND_CURRENCY = {
  code: 'VND',
  symbol: 'đ',
  decimal_digits: 0,
};

const img = (seed, w = 800, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const buildVariant = ({
  id,
  title,
  price,
  salePrice = null,
  inventory = 10,
  manageInventory = true,
  imageUrl,
}) => ({
  id,
  title,
  price_in_cents: price,
  sale_price_in_cents: salePrice,
  price_formatted: formatCurrency(price, VND_CURRENCY),
  // Luôn có giá trị "hiệu lực" để hiển thị trong giỏ hàng, kể cả khi
  // sản phẩm không giảm giá (tránh lỗi hiện "undefined" trong ShoppingCart.jsx).
  sale_price_formatted: formatCurrency(salePrice ?? price, VND_CURRENCY),
  inventory_quantity: inventory,
  manage_inventory: manageInventory,
  image_url: imageUrl,
  currency_info: VND_CURRENCY,
});

export function formatCurrency(amount, currencyInfo = VND_CURRENCY) {
  const digits = currencyInfo?.decimal_digits ?? 0;
  const divisor = 10 ** digits;
  const value = (amount ?? 0) / divisor;
  const formattedNumber = value.toLocaleString('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${formattedNumber}${currencyInfo?.symbol ?? ''}`;
}

export const PRODUCTS = [
  {
    id: 'p1',
    title: 'Mô hình xe Ford Mustang GT 1:64',
    subtitle: 'Khung hợp kim nguyên khối, chi tiết sắc nét',
    image: img('mustang'),
    images: [{ url: img('mustang') }, { url: img('mustang-2') }],
    description: '<p>Mô hình xe Ford Mustang GT tỉ lệ 1:64, đúc bằng hợp kim kẽm cao cấp, sơn tĩnh điện bền màu. Phù hợp trưng bày hoặc sưu tầm.</p>',
    ribbon_text: 'Bán chạy',
    purchasable: true,
    additional_info: [
      { id: 'a1', title: 'Chất liệu', description: '<p>Hợp kim kẽm (die-cast), kính chắn gió nhựa trong.</p>', order: 1 },
      { id: 'a2', title: 'Đóng gói', description: '<p>Hộp acrylic trong suốt, kèm đế trưng bày.</p>', order: 2 },
    ],
    variants: [
      buildVariant({ id: 'p1-v1', title: 'Màu đỏ', price: 350000, inventory: 14, imageUrl: img('mustang') }),
      buildVariant({ id: 'p1-v2', title: 'Màu xanh', price: 350000, salePrice: 299000, inventory: 6, imageUrl: img('mustang-2') }),
    ],
  },
  {
    id: 'p2',
    title: 'Mô hình xe Lamborghini Aventador 1:64',
    subtitle: 'Phiên bản giới hạn, cửa cắt kéo mở được',
    image: img('lambo'),
    images: [{ url: img('lambo') }],
    description: '<p>Aventador tỉ lệ 1:64 với cửa mở kiểu cắt kéo, nội thất chi tiết, phù hợp cho người mới bắt đầu sưu tầm.</p>',
    ribbon_text: 'Mới về',
    purchasable: true,
    additional_info: [
      { id: 'a1', title: 'Chất liệu', description: '<p>Hợp kim kẽm, lốp cao su.</p>', order: 1 },
    ],
    variants: [
      buildVariant({ id: 'p2-v1', title: 'Màu vàng', price: 420000, inventory: 9, imageUrl: img('lambo') }),
    ],
  },
  {
    id: 'p3',
    title: 'Mô hình xe Toyota AE86 1:64',
    subtitle: 'Bản độ drift, mâm độ chi tiết',
    image: img('ae86'),
    images: [{ url: img('ae86') }],
    description: '<p>AE86 phong cách drift huyền thoại, mâm xe độ và tem xe chi tiết sắc nét.</p>',
    ribbon_text: null,
    purchasable: true,
    additional_info: [],
    variants: [
      buildVariant({ id: 'p3-v1', title: 'Bản Trắng - Đen', price: 320000, inventory: 0, imageUrl: img('ae86') }),
    ],
  },
  {
    id: 'p4',
    title: 'Mô hình xe tải Volvo FH16 1:34',
    subtitle: 'Chi tiết cabin, thùng xe có thể tháo rời',
    image: img('volvo-truck'),
    images: [{ url: img('volvo-truck') }, { url: img('volvo-truck-2') }],
    description: '<p>Mô hình xe tải Volvo FH16 tỉ lệ 1:34, thùng xe tháo lắp được, phù hợp trưng bày trong bộ sưu tập xe tải.</p>',
    ribbon_text: 'Bán chạy',
    purchasable: true,
    additional_info: [
      { id: 'a1', title: 'Kích thước', description: '<p>Dài khoảng 26cm.</p>', order: 1 },
    ],
    variants: [
      buildVariant({ id: 'p4-v1', title: 'Màu xanh dương', price: 650000, salePrice: 549000, inventory: 5, imageUrl: img('volvo-truck') }),
    ],
  },
  {
    id: 'p5',
    title: 'Mô hình xe cứu hỏa Scania 1:34',
    subtitle: 'Có thang cứu hỏa kéo dài được',
    image: img('scania-fire'),
    images: [{ url: img('scania-fire') }],
    description: '<p>Xe cứu hỏa Scania tỉ lệ 1:34, thang có thể kéo dài và xoay, đèn còi mô phỏng chi tiết.</p>',
    ribbon_text: null,
    purchasable: true,
    additional_info: [],
    variants: [
      buildVariant({ id: 'p5-v1', title: 'Bản tiêu chuẩn', price: 720000, inventory: 3, imageUrl: img('scania-fire') }),
    ],
  },
  {
    id: 'p6',
    title: 'Mô hình xe container MAN TGX 1:34',
    subtitle: 'Kèm rơ-moóc container 40 feet',
    image: img('man-tgx'),
    images: [{ url: img('man-tgx') }],
    description: '<p>Bộ đầu kéo MAN TGX cùng rơ-moóc container 40 feet tỉ lệ 1:34, bánh xe cao su xoay được.</p>',
    ribbon_text: null,
    purchasable: true,
    additional_info: [],
    variants: [
      buildVariant({ id: 'p6-v1', title: 'Màu trắng', price: 890000, inventory: 4, imageUrl: img('man-tgx') }),
    ],
  },
  {
    id: 'p7',
    title: 'Sa bàn Góc phố Sài Gòn xưa',
    subtitle: 'Diorama tái hiện góc phố thập niên 90',
    image: img('diorama-saigon'),
    images: [{ url: img('diorama-saigon') }, { url: img('diorama-saigon-2') }],
    description: '<p>Sa bàn diorama tái hiện một góc phố Sài Gòn thập niên 90, kèm nhà phố, cột điện và tiểu cảnh cây xanh, tỉ lệ tương thích xe 1:64.</p>',
    ribbon_text: 'Hàng thủ công',
    purchasable: true,
    additional_info: [
      { id: 'a1', title: 'Kích thước sa bàn', description: '<p>30cm x 20cm, đế gỗ MDF sơn phủ.</p>', order: 1 },
    ],
    variants: [
      buildVariant({ id: 'p7-v1', title: 'Bản tiêu chuẩn', price: 890000, inventory: 2, imageUrl: img('diorama-saigon') }),
    ],
  },
  {
    id: 'p8',
    title: 'Sa bàn Trạm xăng ven đường',
    subtitle: 'Diorama trạm xăng phong cách Mỹ',
    image: img('diorama-gas'),
    images: [{ url: img('diorama-gas') }],
    description: '<p>Sa bàn trạm xăng phong cách Mỹ cổ điển, có mái che, trụ bơm xăng và biển hiệu chi tiết, tỉ lệ tương thích xe 1:64.</p>',
    ribbon_text: null,
    purchasable: true,
    additional_info: [],
    variants: [
      buildVariant({ id: 'p8-v1', title: 'Bản tiêu chuẩn', price: 750000, salePrice: 649000, inventory: 7, imageUrl: img('diorama-gas') }),
    ],
  },
  {
    id: 'p9',
    title: 'Mô hình xe Porsche 911 GT3 1:64',
    subtitle: 'Bản đua, cánh gió sau chi tiết',
    image: img('porsche'),
    images: [{ url: img('porsche') }],
    description: '<p>Porsche 911 GT3 tỉ lệ 1:64 phong cách đua, cánh gió sau và ống xả đôi chi tiết sắc nét.</p>',
    ribbon_text: 'Mới về',
    purchasable: true,
    additional_info: [],
    variants: [
      buildVariant({ id: 'p9-v1', title: 'Màu trắng - đỏ', price: 380000, inventory: 11, imageUrl: img('porsche') }),
    ],
  },
];
