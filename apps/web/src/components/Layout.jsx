import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ShoppingCart as CartIcon, Search, Boxes, User, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import ShoppingCart from '@/components/ShoppingCart';
const navClass = ({
  isActive
}) => `text-sm font-medium uppercase tracking-wide transition-colors ${isActive ? 'text-primary' : 'text-foreground/80 hover:text-primary'}`;
const Layout = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [query, setQuery] = useState('');
  const {
    cartItems
  } = useCart();
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const count = cartItems.reduce((n, i) => n + i.quantity, 0);
  const onSearch = e => {
    e.preventDefault();
    navigate(`/store?q=${encodeURIComponent(query.trim())}`);
  };
  return <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] items-center gap-4 px-4 py-3 sm:px-6">
          {/* <Link to="/" className="flex items-center gap-2 shrink-0"><Boxes className="h-7 w-7 text-primary" /><span className="font-display text-xl font-bold tracking-tight">BÁO LỐP</span></Link> */}
<Link to="/" className="flex items-center gap-2 shrink-0">
  <img
    src="/baoLop_white.ico"
    alt="Báo Lốp"
    className="h-8 w-8 object-contain"
  />
  <span className="font-display text-xl font-bold tracking-tight">
    BÁO LỐP
  </span>
</Link>
          <form onSubmit={onSearch} className="relative hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kiếm" className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary" />
          </form>

          <nav className="ml-auto hidden items-center gap-6 lg:flex">
            <NavLink to="/" className={navClass} end>Trang chủ</NavLink>
            <NavLink to="/store" className={navClass}>Sản phẩm</NavLink>
          </nav>

          {isAdmin && (
            <Link to="/admin" className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:border-primary sm:flex">
              <LayoutDashboard className="h-4 w-4" />
              Quản trị
            </Link>
          )}

          {user ? (
            <button onClick={signOut} className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:border-primary sm:flex" title={profile?.full_name}>
              <User className="h-4 w-4" />
              Đăng xuất
            </button>
          ) : (
            <Link to="/login" className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:border-primary sm:flex">
              <User className="h-4 w-4" />
              Đăng nhập
            </Link>
          )}

          <button onClick={() => setIsCartOpen(true)} className="relative ml-2 rounded-full border border-border p-2 hover:border-primary" aria-label="Giỏ hàng">
            <CartIcon className="h-5 w-5" />
            {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {count}
              </span>}
          </button>
        </div>

        <form onSubmit={onSearch} className="relative px-4 pb-3 md:hidden">
          <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm sản phẩm..." className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </form>
      </header>

      <main className="flex-1">
        <Outlet context={{
        openCart: () => setIsCartOpen(true)
      }} />
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-[90rem] gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            {/* <div className="flex items-center gap-2">
              <Boxes className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold">BÁO LỐP</span>
            </div> */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
  <img
    src="/baoLop_white.ico"
    alt="Báo Lốp"
    className="h-8 w-8 object-contain"
  />
  <span className="font-display text-xl font-bold tracking-tight">
    BÁO LỐP
  </span>
</Link>
            <p className="mt-3 text-sm text-muted-foreground">Chuyên mô hình, sa bàn và xe die-cast tỉ lệ 1:64, 1:34 chính hãng, chất lượng cao.</p>
          </div>
          <div>
            <h4 className="font-display font-semibold">Danh mục</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/store" className="hover:text-primary">Xe 1:64</Link></li>
              <li><Link to="/store" className="hover:text-primary">Xe 1:34</Link></li>
              <li><Link to="/store" className="hover:text-primary">Sa bàn</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold">Hỗ trợ</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Chính sách vận chuyển</li>
              <li>Đổi trả &amp; bảo hành</li>
              <li>Hướng dẫn đặt hàng</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold">Liên hệ</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Hotline: 0559 819 742</li>
              <li>Email: manguyenanhkhoa@gmail.com</li>
              <li>Địa chỉ: 349 đường Tân Túc, huyện Bình Chánh, Thành phố Hồ Chí Minh</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Design by Sombre Licorne.
        </div>
      </footer>

      <ShoppingCart isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
    </div>;
};
export default Layout;