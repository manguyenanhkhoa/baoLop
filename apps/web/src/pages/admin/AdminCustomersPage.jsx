import React, { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, VND_CURRENCY } from '@/api/EcommerceApi';
import { useToast } from '@/hooks/use-toast';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const AdminCustomersPage = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('customer_id, total_in_cents, customer_name, customer_phone'),
    ]);

    if (profilesError || ordersError) {
      toast({
        title: 'Không tải được danh sách khách hàng',
        description: (profilesError ?? ordersError).message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const statsByCustomer = new Map();
    for (const o of orders ?? []) {
      if (!o.customer_id) continue;
      const cur = statsByCustomer.get(o.customer_id) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += o.total_in_cents ?? 0;
      statsByCustomer.set(o.customer_id, cur);
    }

    const merged = (profiles ?? []).map((p) => ({
      ...p,
      orderCount: statsByCustomer.get(p.id)?.count ?? 0,
      totalSpent: statsByCustomer.get(p.id)?.total ?? 0,
    }));

    setRows(merged);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Khách hàng</h1>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Số đơn</TableHead>
              <TableHead>Tổng chi tiêu</TableHead>
              <TableHead>Ngày tham gia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chưa có khách hàng nào đăng ký.</TableCell></TableRow>
            ) : rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  {c.full_name || 'Chưa cập nhật tên'} {c.is_admin && <Badge className="ml-2" variant="secondary">Admin</Badge>}
                </TableCell>
                <TableCell>{c.phone || '—'}</TableCell>
                <TableCell>{c.orderCount}</TableCell>
                <TableCell>{formatCurrency(c.totalSpent, VND_CURRENCY)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString('vi-VN')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCustomersPage;
