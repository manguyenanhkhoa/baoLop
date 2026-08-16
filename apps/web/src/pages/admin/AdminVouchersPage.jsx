import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, Ticket } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, VND_CURRENCY } from '@/api/EcommerceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

const emptyForm = () => ({
  id: null,
  code: '',
  discount_percent: '',
  min_order_value_cents: '',
  product_id: 'all',
  expires_at: '',
  is_active: true,
  new_customers_only: false,
});

const AdminVouchersPage = () => {
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: v, error }, { data: p }] = await Promise.all([
      supabase.from('vouchers').select('*, products(title)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, title').order('title'),
    ]);
    if (error) {
      toast({ title: 'Không tải được voucher', description: error.message, variant: 'destructive' });
    } else {
      setVouchers(v ?? []);
    }
    setProducts(p ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setForm(emptyForm()); setDialogOpen(true); };

  const openEdit = (v) => {
    setForm({
      id: v.id,
      code: v.code,
      discount_percent: v.discount_percent,
      min_order_value_cents: v.min_order_value_cents,
      product_id: v.product_id ?? 'all',
      expires_at: v.expires_at ? v.expires_at.slice(0, 10) : '',
      is_active: v.is_active,
      new_customers_only: v.new_customers_only ?? false,
    });
    setDialogOpen(true);
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_percent: Number(form.discount_percent),
      min_order_value_cents: Number(form.min_order_value_cents) || 0,
      product_id: form.product_id === 'all' ? null : form.product_id,
      expires_at: new Date(`${form.expires_at}T23:59:59`).toISOString(),
      is_active: form.is_active,
      new_customers_only: form.new_customers_only,
    };

    const query = form.id
      ? supabase.from('vouchers').update(payload).eq('id', form.id)
      : supabase.from('vouchers').insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      toast({
        title: 'Lưu thất bại',
        description: error.code === '23505' ? 'Mã voucher này đã tồn tại.' : error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: form.id ? 'Đã cập nhật voucher' : 'Đã tạo voucher' });
    setDialogOpen(false);
    loadData();
  };

  const confirmDelete = async () => {
    const { error } = await supabase.from('vouchers').delete().eq('id', deleteTarget.id);
    if (error) {
      toast({ title: 'Xoá thất bại', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Đã xoá voucher' });
      loadData();
    }
    setDeleteTarget(null);
  };

  const isExpired = (v) => new Date(v.expires_at) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Voucher</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mỗi khách hàng chỉ dùng được 1 lần cho mỗi mã voucher.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Tạo voucher</Button>
      </div>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Giảm</TableHead>
              <TableHead>Đơn tối thiểu</TableHead>
              <TableHead>Áp dụng</TableHead>
              <TableHead>Hết hạn</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            ) : vouchers.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Chưa có voucher nào.</TableCell></TableRow>
            ) : vouchers.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono font-semibold">{v.code}</TableCell>
                <TableCell>{v.discount_percent}%</TableCell>
                <TableCell>{v.min_order_value_cents > 0 ? formatCurrency(v.min_order_value_cents, VND_CURRENCY) : '—'}</TableCell>
                <TableCell className="text-sm">
                  {v.products?.title ?? 'Toàn bộ đơn hàng'}
                  {v.new_customers_only && <Badge variant="outline" className="ml-1.5">Khách mới</Badge>}
                </TableCell>
                <TableCell className="text-sm">{new Date(v.expires_at).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>
                  {!v.is_active ? <Badge variant="secondary">Tắt</Badge> : isExpired(v) ? <Badge variant="destructive">Hết hạn</Badge> : <Badge>Đang chạy</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(v)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Ticket className="h-4 w-4" />{form.id ? 'Sửa voucher' : 'Tạo voucher'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Mã voucher</Label>
              <Input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="VD: BAOLOP10" className="uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giảm giá (%)</Label>
                <Input required type="number" min="1" max="100" value={form.discount_percent} onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Đơn tối thiểu (đ)</Label>
                <Input type="number" min="0" value={form.min_order_value_cents} onChange={(e) => setForm((f) => ({ ...f, min_order_value_cents: e.target.value }))} placeholder="0 = không giới hạn" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Áp dụng cho</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm((f) => ({ ...f, product_id: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toàn bộ đơn hàng</SelectItem>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ngày hết hạn</Label>
              <Input required type="date" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label>Đang hoạt động</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.new_customers_only} onCheckedChange={(v) => setForm((f) => ({ ...f, new_customers_only: v }))} />
              <Label>Chỉ dành cho khách hàng mới (chưa từng đặt đơn)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Huỷ</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá voucher "{deleteTarget?.code}"?</AlertDialogTitle>
            <AlertDialogDescription>Không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVouchersPage;
