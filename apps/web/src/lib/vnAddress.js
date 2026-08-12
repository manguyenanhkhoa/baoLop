// Wrapper cho API địa giới hành chính Việt Nam (miễn phí, không cần key).
// Docs: https://provinces.open-api.vn/
const BASE_URL = 'https://provinces.open-api.vn/api';

export async function getProvinces() {
  const res = await fetch(`${BASE_URL}/p/`);
  if (!res.ok) throw new Error('Không tải được danh sách Tỉnh/Thành.');
  const data = await res.json();
  return data.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export async function getDistricts(provinceCode) {
  const res = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
  if (!res.ok) throw new Error('Không tải được danh sách Quận/Huyện.');
  const data = await res.json();
  return (data.districts ?? []).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export async function getWards(districtCode) {
  const res = await fetch(`${BASE_URL}/d/${districtCode}?depth=2`);
  if (!res.ok) throw new Error('Không tải được danh sách Phường/Xã.');
  const data = await res.json();
  return (data.wards ?? []).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

// Vài cách viết tên TP.HCM khác nhau tuỳ nguồn dữ liệu, dùng để tự tính phí ship.
export function isHoChiMinhCity(cityName) {
  if (!cityName) return false;
  const n = cityName.toLowerCase();
  return n.includes('hồ chí minh') || n.includes('ho chi minh');
}
