import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, ChevronDown, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, VND_CURRENCY } from '@/api/EcommerceApi';
import { useToast } from '@/hooks/use-toast';
import { ORDER_STATUS_STEPS, ORDER_STATUS_CANCELLED, ALL_ORDER_STATUSES, getStatusIndex, SHIPPING_PROVIDERS } from '@/lib/orderStatus';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';

const PAYMENT_LABEL = { cod: 'COD', bank_transfer: 'Chuyển khoản VCB', vnpay: 'VNPay', momo: 'Momo' };
const PAYMENT_STATUS_LABEL = { pending: 'Chờ thanh toán', paid: 'Đã thanh toán', failed: 'Thất bại' };

const OrderRow = ({ order, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [shippingCode, setShippingCode] = useState(order.shipping_code ?? '');
  const [shippingProvider, setShippingProvider] = useState(order.shipping_provider ?? '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const currentIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  const setStatus = async (status) => {
    setSaving(true);
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Cập nhật thất bại', description: error.message, variant: 'destructive' });
      return;
    }
    onUpdate(order.id, { status });
  };

  const setPaymentStatus = async (payment_status) => {
    setSaving(true);
    const { error } = await supabase.from('orders').update({ payment_status }).eq('id', order.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Cập nhật thất bại', description: error.message, variant: 'destructive' });
      return;
    }
    onUpdate(order.id, { payment_status });
    toast({ title: 'Đã cập nhật trạng thái thanh toán' });
  };

  const switchToCod = async () => {
    setSaving(true);
    const { error } = await supabase.from('orders').update({ payment_method: 'cod' }).eq('id', order.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Cập nhật thất bại', description: error.message, variant: 'destructive' });
      return;
    }
    onUpdate(order.id, { payment_method: 'cod' });
    toast({ title: 'Đã chuyển sang thanh toán khi nhận hàng (COD)' });
  };

  const saveShippingInfo = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('orders')
      .update({ shipping_code: shippingCode || null, shipping_provider: shippingProvider || null })
      .eq('id', order.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Lưu thất bại', description: error.message, variant: 'destructive' });
      return;
    }
    onUpdate(order.id, { shipping_code: shippingCode, shipping_provider: shippingProvider });
    toast({ title: 'Đã lưu thông tin vận chuyển' });
  };

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
            <div>
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {(order.order_items ?? []).length} sản phẩm
        </TableCell>
        <TableCell className="font-semibold">
          {formatCurrency(order.total_in_cents, VND_CURRENCY)}
          {order.shipping_fee_in_cents > 0 && (
            <p className="mt-0.5 text-xs font-normal text-muted-foreground">
              (gồm ship {formatCurrency(order.shipping_fee_in_cents, VND_CURRENCY)})
            </p>
          )}
          {order.voucher_code && (
            <p className="mt-0.5 text-xs font-normal text-primary">
              Voucher {order.voucher_code} (-{formatCurrency(order.discount_in_cents, VND_CURRENCY)})
            </p>
          )}
        </TableCell>
        <TableCell>
          <Badge variant={order.payment_status === 'paid' ? 'default' : (order.payment_method !== 'cod' ? 'destructive' : 'secondary')}>
            {PAYMENT_LABEL[order.payment_method] ?? order.payment_method} · {PAYMENT_STATUS_LABEL[order.payment_status] ?? order.payment_status}
          </Badge>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Select value={order.status} onValueChange={setStatus} disabled={saving}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_ORDER_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow>
          <TableCell colSpan={5} className="bg-secondary/30">
            <div className="grid gap-6 py-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sản phẩm</p>
                <div className="mt-2 space-y-1 text-sm">
                  {(order.order_items ?? []).map((it) => (
                    <div key={it.id} className="flex justify-between">
                      <span>{it.product_title} ({it.variant_title}) × {it.quantity}</span>
                      <span className="text-muted-foreground">{formatCurrency(it.price_in_cents * it.quantity, VND_CURRENCY)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Địa chỉ giao hàng</p>
                <p className="mt-1 flex items-start gap-1.5 text-sm">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {order.customer_address}
                  {order.latitude && order.longitude && (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${order.latitude}&mlon=${order.longitude}#map=17/${order.latitude}/${order.longitude}`}
                      target="_blank" rel="noreferrer"
                      className="ml-1 shrink-0 text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      (xem bản đồ)
                    </a>
                  )}
                </p>
              </div>

              {!isCancelled && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thanh toán</p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center" onClick={(e) => e.stopPropagation()}>
                    <Select value={order.payment_status} onValueChange={setPaymentStatus}>
                      <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ thanh toán</SelectItem>
                        <SelectItem value="paid">Đã thanh toán</SelectItem>
                        <SelectItem value="failed">Thất bại</SelectItem>
                      </SelectContent>
                    </Select>
                    {order.payment_method !== 'cod' && order.payment_status !== 'paid' && (
                      <Button size="sm" variant="outline" onClick={switchToCod} disabled={saving}>
                        Chuyển sang thanh toán khi nhận hàng (COD)
                      </Button>
                    )}
                  </div>
                  {order.payment_method !== 'cod' && order.payment_status === 'pending' && (
                    <p className="mt-2 text-xs font-medium text-destructive">
                      ⚠️ Khách chọn {PAYMENT_LABEL[order.payment_method]} nhưng chưa xác nhận thanh toán — kiểm tra tài khoản ngân hàng/ví trước khi đóng gói, hoặc chuyển sang COD nếu khách muốn trả tiền mặt khi nhận hàng.
                    </p>
                  )}

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vận chuyển</p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row" onClick={(e) => e.stopPropagation()}>
                    <Select value={shippingProvider} onValueChange={setShippingProvider}>
                      <SelectTrigger className="sm:w-56"><SelectValue placeholder="Nền tảng vận chuyển" /></SelectTrigger>
                      <SelectContent>
                        {SHIPPING_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Mã vận đơn" value={shippingCode} onChange={(e) => setShippingCode(e.target.value)} className="sm:w-48" />
                    <Button size="sm" onClick={saveShippingInfo} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu'}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Nhập mã vận đơn khi bàn giao cho shipper — khách sẽ thấy mã này ở trang theo dõi đơn hàng của họ.
                  </p>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cập nhật nhanh</p>
                  <div className="mt-2 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {ORDER_STATUS_STEPS.map((s, i) => (
                      <button
                        key={s.value}
                        onClick={() => setStatus(s.value)}
                        disabled={saving}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${i <= currentIndex && !isCancelled ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'}`}
                      >
                        {s.shortLabel}
                      </button>
                    ))}
                    <button
                      onClick={() => setStatus('cancelled')}
                      disabled={saving}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${isCancelled ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-border text-destructive hover:border-destructive/50'}`}
                    >
                      Huỷ đơn
                    </button>
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const AdminOrdersPage = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Không tải được đơn hàng', description: error.message, variant: 'destructive' });
    } else {
      setOrders(data ?? []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleUpdate = (orderId, patch) => {
    setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Đơn hàng</h1>
      <p className="mt-1 text-sm text-muted-foreground">Bấm vào 1 dòng để xem chi tiết, cập nhật trạng thái và mã vận đơn.</p>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chưa có đơn hàng nào.</TableCell></TableRow>
            ) : orders.map((o) => <OrderRow key={o.id} order={o} onUpdate={handleUpdate} />)}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
