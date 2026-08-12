import { ClipboardList, CheckCircle2, PackageCheck, Truck, PartyPopper, XCircle } from 'lucide-react';

// Thứ tự các bước trong vòng đời 1 đơn hàng (không tính "Đã huỷ").
export const ORDER_STATUS_STEPS = [
  { value: 'pending_confirmation', label: 'Chưa xác nhận', shortLabel: 'Chờ xác nhận', icon: ClipboardList },
  { value: 'confirmed', label: 'Đã xác nhận', shortLabel: 'Đã xác nhận', icon: CheckCircle2 },
  { value: 'packing', label: 'Đang đóng gói', shortLabel: 'Đóng gói', icon: PackageCheck },
  { value: 'picked_up', label: 'Shipper đã lấy hàng', shortLabel: 'Đang giao', icon: Truck },
  { value: 'delivered', label: 'Giao hàng thành công', shortLabel: 'Hoàn tất', icon: PartyPopper },
];

export const ORDER_STATUS_CANCELLED = { value: 'cancelled', label: 'Đã huỷ', shortLabel: 'Đã huỷ', icon: XCircle };

export const ALL_ORDER_STATUSES = [...ORDER_STATUS_STEPS, ORDER_STATUS_CANCELLED];

export function getStatusIndex(status) {
  return ORDER_STATUS_STEPS.findIndex((s) => s.value === status);
}

export function getStatusInfo(status) {
  return ALL_ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUS_STEPS[0];
}

export const SHIPPING_PROVIDERS = [
  'Giao Hàng Tiết Kiệm (GHTK)',
  'Giao Hàng Nhanh (GHN)',
  'J&T Express',
  'Ninja Van',
  'Viettel Post',
  'Grab Express',
  'Shop tự giao',
  'Khác',
];
