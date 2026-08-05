import React, { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, VND_CURRENCY } from '@/api/EcommerceApi';
import { useToast } from '@/hooks/use-toast';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const STATUS_OPTIONS = [
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã huỷ' },
];

const PAYMENT_LABEL = { cod: 'COD', vnpay: 'VNPay', momo: 'Momo' };
const PAYMENT_STATUS_LABEL = { pending: 'Chờ thanh toán', paid: 'Đã thanh toán', failed: 'Thất bại' };

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

  const updateStatus = async (orderId, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      toast({ title: 'Cập nhật thất bại', description: error.message, variant: 'destructive' });
      return;
    }
    setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Đơn hàng</h1>

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
            ) : orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <p className="font-medium">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_address}</p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {(o.order_items ?? []).map((it) => (
                    <div key={it.id}>{it.product_title} ({it.variant_title}) × {it.quantity}</div>
                  ))}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(o.total_in_cents, VND_CURRENCY)}
                  {o.shipping_fee_in_cents > 0 && (
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                      (gồm ship {formatCurrency(o.shipping_fee_in_cents, VND_CURRENCY)})
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={o.payment_status === 'paid' ? 'default' : 'secondary'}>
                    {PAYMENT_LABEL[o.payment_method] ?? o.payment_method} · {PAYMENT_STATUS_LABEL[o.payment_status] ?? o.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
