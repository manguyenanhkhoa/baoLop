import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Package, ShoppingBag, Users, ArrowLeft, Ticket } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/admin/products', label: 'Sản phẩm', icon: Package },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { to: '/admin/vouchers', label: 'Voucher', icon: Ticket },
  { to: '/admin/customers', label: 'Khách hàng', icon: Users },
];

const AdminLayout = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card sm:block">
        <div className="p-6">
          <span className="font-display text-lg font-bold">Quản trị BÁO LỐP</span>
          <p className="mt-1 text-xs text-muted-foreground truncate">{profile?.full_name}</p>
        </div>
        <nav className="space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-secondary'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 space-y-2 px-3">
          <Button asChild variant="ghost" size="sm" className="w-full justify-start">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Về trang shop</Link>
          </Button>
          <Button onClick={signOut} variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
            Đăng xuất
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto p-6 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
