import React, { useState } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { ShoppingCart as CartIcon, Search, User, LayoutDashboard, Menu, LogOut, Settings, PackageSearch, ChevronDown, Sun, Moon } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import ShoppingCart from '@/components/ShoppingCart';
import WelcomeBanner from '@/components/WelcomeBanner';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const navClass = ({ isActive }) =>
  `text-sm font-medium uppercase tracking-wide transition-colors ${isActive ? 'text-primary' : 'text-foreground/80 hover:text-primary'}`;

const mobileNavClass = ({ isActive }) =>
  `rounded-md px-3 py-2.5 text-base font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground/90 hover:bg-secondary'}`;

const Logo = () => (
  <Link to="/" className="flex shrink-0 items-center gap-2">
    <img src="/baoLop.ico" alt="Báo Lốp" className="h-8 w-8 object-contain" />
    <span className="font-display text-lg font-bold tracking-tight sm:text-xl">BÁO LỐP</span>
  </Link>
);

const Layout = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { cartItems } = useCart();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const count = cartItems.reduce((n, i) => n + i.quantity, 0);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/store?q=${encodeURIComponent(query.trim())}`);
    setIsMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          {/* Nút menu mobile */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button className="shrink-0 rounded-md p-2 hover:bg-secondary lg:hidden" aria-label="Mở menu">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm">
              <SheetHeader className="flex-row items-center justify-between space-y-0">
                <SheetTitle className="text-left"><Logo /></SheetTitle>
                <button onClick={toggleTheme} className="rounded-full border border-border p-2 hover:border-primary" aria-label="Đổi chế độ sáng/tối">
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </SheetHeader>

              <form onSubmit={onSearch} className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
                />
              </form>

              <nav className="mt-6 flex flex-col gap-1">
                <SheetClose asChild>
                  <NavLink to="/" className={mobileNavClass} end>Trang chủ</NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/store" className={mobileNavClass}>Sản phẩm</NavLink>
                </SheetClose>
                {isAdmin && (
                  <SheetClose asChild>
                    <NavLink to="/admin" className={mobileNavClass}>
                      <span className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />Quản trị</span>
                    </NavLink>
                  </SheetClose>
                )}
                {user && !isAdmin && (
                  <>
                    <SheetClose asChild>
                      <NavLink to="/account" className={mobileNavClass}>Thông tin &amp; địa chỉ</NavLink>
                    </SheetClose>
                    <SheetClose asChild>
                      <NavLink to="/account/orders" className={mobileNavClass}>Đơn hàng của tôi</NavLink>
                    </SheetClose>
                  </>
                )}
              </nav>

              <div className="mt-6 border-t border-border pt-4">
                {user ? (
                  <SheetClose asChild>
                    <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-base font-medium text-destructive hover:bg-secondary">
                      <LogOut className="h-4 w-4" />
                      Đăng xuất {profile?.full_name ? `(${profile.full_name})` : ''}
                    </button>
                  </SheetClose>
                ) : (
                  <div className="flex flex-col gap-2">
                    <SheetClose asChild>
                      <Link to="/login" className="rounded-md bg-primary px-3 py-2.5 text-center text-base font-semibold text-primary-foreground">Đăng nhập</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/register" className="rounded-md border border-border px-3 py-2.5 text-center text-base font-medium">Tạo tài khoản</Link>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Logo />

          <form onSubmit={onSearch} className="relative hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mô kiếm dio, hãng xe,..." className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary" />
          </form>

          <nav className="ml-auto hidden items-center gap-6 lg:flex">
            <NavLink to="/" className={navClass} end>Trang chủ</NavLink>
            <NavLink to="/store" className={navClass}>Sản phẩm</NavLink>
          </nav>

          {isAdmin && (
            <>
              <Link to="/admin" className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:border-primary lg:flex">
                <LayoutDashboard className="h-4 w-4" />
                Quản trị
              </Link>
              <button onClick={signOut} className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:border-primary lg:flex">
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </>
          )}

          {user && !isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden items-center gap-1.5 rounded-full border border-border py-1.5 pl-1.5 pr-3 text-sm font-medium hover:border-primary lg:flex">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate">{profile?.full_name || 'Tài khoản'}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{profile?.full_name || user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account"><Settings className="mr-2 h-4 w-4" /> Thông tin &amp; địa chỉ</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/orders"><PackageSearch className="mr-2 h-4 w-4" /> Đơn hàng của tôi</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {!user && (
            <Link to="/login" className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:border-primary lg:flex">
              <User className="h-4 w-4" />
              Đăng nhập
            </Link>
          )}

          <button onClick={toggleTheme} className="ml-auto rounded-full border border-border p-2 hover:border-primary" aria-label="Đổi chế độ sáng/tối">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button onClick={() => setIsCartOpen(true)} className="relative rounded-full border border-border p-2 hover:border-primary" aria-label="Giỏ hàng">
            <CartIcon className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
        </div>

        <form onSubmit={onSearch} className="relative px-4 pb-3 md:hidden">
          <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm sản phẩm..." className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </form>
      </header>

      <main className="flex-1">
        <WelcomeBanner />
        <Outlet context={{ openCart: () => setIsCartOpen(true) }} />
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-[90rem] gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">Chuyên mô hình, Diorama và xe die-cast chính hãng, chất lượng.</p>
          </div>
          <div>
            <h4 className="font-display font-semibold">Danh mục</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/store?category=1:64" className="hover:text-primary">Xe 1:64</Link></li>
              <li><Link to="/store?category=1:32" className="hover:text-primary">Khác</Link></li>
              <li><Link to="/store?category=diorama" className="hover:text-primary">Diorama</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold">Hỗ trợ</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Chính sách vận chuyển</li>
              <li>Bảo hành</li>
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
    </div>
  );
};

export default Layout;
