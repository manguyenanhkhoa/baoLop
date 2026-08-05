// Thông tin tài khoản nhận chuyển khoản (VietQR).
// Đổi giá trị dưới đây nếu bạn thay đổi số tài khoản/ngân hàng.
export const BANK_ACCOUNT = {
  bankId: '970436', // Mã ngân hàng Vietcombank (BIN) theo chuẩn VietQR
  bankName: 'Vietcombank',
  accountNo: '1012804236',
  accountName: 'MA NGUYEN ANH KHOA',
};

// Tạo URL ảnh QR VietQR (dịch vụ công khai, miễn phí, không cần đăng ký).
// amountInCents ở đây thực chất là số tiền VNĐ (không có phần thập phân).
export function buildVietQrUrl({ amountInCents, note }) {
  const { bankId, accountNo, accountName } = BANK_ACCOUNT;
  const params = new URLSearchParams({
    amount: String(amountInCents ?? ''),
    addInfo: note ?? '',
    accountName,
  });
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?${params.toString()}`;
}
