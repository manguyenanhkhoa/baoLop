import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, PartyPopper, LayoutDashboard, ShoppingBag } from 'lucide-react';

const WelcomeBanner = () => {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('welcomeBox');
    if (raw) {
      try {
        setInfo(JSON.parse(raw));
      } catch {
        // bỏ qua nếu dữ liệu hỏng
      }
    }
  }, []);

  if (!info) return null;

  const dismiss = () => {
    sessionStorage.removeItem('welcomeBox');
    setInfo(null);
  };

  const displayName = info.fullName || (info.isAdmin ? 'Quản trị viên' : 'bạn');

  return (
    <div className="mx-auto max-w-[90rem] px-4 pt-4 sm:px-6">
      <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4">
        <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="font-display font-semibold">
            Chào mừng {displayName} quay lại BÁO LỐP!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {info.isAdmin
              ? 'Bạn đang đăng nhập với quyền Quản trị viên — quản lý sản phẩm, đơn hàng và khách hàng tại khu vực quản trị.'
              : 'Cảm ơn bạn đã đồng hành cùng shop. Khám phá thêm mô hình và sa bàn mới nhé.'}
          </p>
          <div className="mt-3 flex gap-2">
            {info.isAdmin ? (
              <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Vào trang Quản trị
              </Link>
            ) : (
              <>
                <Link to="/store" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Xem sản phẩm
                </Link>
                <Link to="/account" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary">
                  Tài khoản của tôi
                </Link>
              </>
            )}
          </div>
        </div>
        <button onClick={dismiss} className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-secondary" aria-label="Đóng">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default WelcomeBanner;
