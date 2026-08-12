import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Loader2, PackageSearch, Truck, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, VND_CURRENCY } from '@/api/EcommerceApi';
import { ORDER_STATUS_STEPS, getStatusIndex, getStatusInfo } from '@/lib/orderStatus';
import { Button } from '@/components/ui/button';

const OrderTimeline = ({ order }) => {
  const currentIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  if (isCancelled) {
    return <p className="mt-3 text-sm font-medium text-destructive">Đơn hàng đã bị huỷ.</p>;
  }

  return (
    <div className="mt-4 flex items-start gap-0 overflow-x-auto pb-2">
      {ORDER_STATUS_STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i <= currentIndex;
        return (
          <div key={step.value} className="flex min-w-[84px] flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : done ? 'bg-primary' : 'bg-border'}`} />
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className={`h-0.5 flex-1 ${i === ORDER_STATUS_STEPS.length - 1 ? 'opacity-0' : i < currentIndex ? 'bg-primary' : 'bg-border'}`} />
            </div>
            <p className={`mt-1.5 text-[11px] leading-tight ${done ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{step.shortLabel}</p>
          </div>
        );
      })}
    </div>
  );
};

const OrderCard = ({ order }) => {
  const statusInfo = getStatusInfo(order.status);
  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-semibold">#{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'cancelled' ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary'}`}>
          {statusInfo.label}
        </span>
      </div>

      <OrderTimeline order={order} />

      {order.shipping_code && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
          <Truck className="h-4 w-4 shrink-0 text-primary" />
          <span>{order.shipping_provider} — Mã vận đơn: <span className="font-mono font-semibold">{order.shipping_code}</span></span>
        </div>
      )}

      <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
        {(order.order_items ?? []).map((it) => (
          <div key={it.id} className="flex justify-between text-muted-foreground">
            <span>{it.product_title} ({it.variant_title}) × {it.quantity}</span>
            <span>{formatCurrency(it.price_in_cents * it.quantity, VND_CURRENCY)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-1 font-semibold text-foreground">
          <span>Tổng cộng</span>
          <span>{formatCurrency(order.total_in_cents, VND_CURRENCY)}</span>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {order.customer_address}
      </p>
    </div>
  );
};

const AccountOrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <p className="mt-2 text-muted-foreground">Đăng nhập để xem tiến trình đơn hàng của bạn.</p>
        <Button asChild className="mt-6"><Link to="/login">Đăng nhập</Link></Button>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Đơn hàng của tôi — BÁO LỐP</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Đơn hàng của tôi</h1>

        {orders.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
            <PackageSearch className="h-10 w-10" />
            <p>Bạn chưa có đơn hàng nào.</p>
            <Button asChild size="sm"><Link to="/store">Mua sắm ngay</Link></Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        )}
      </div>
    </>
  );
};

export default AccountOrdersPage;
