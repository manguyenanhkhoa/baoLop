import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, VND_CURRENCY } from '@/api/EcommerceApi';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

const emptyVariant = () => ({
  _key: crypto.randomUUID(),
  id: null,
  title: '',
  price_in_cents: '',
  sale_price_in_cents: '',
  inventory_quantity: '',
  image_url: '',
});

const emptyForm = () => ({
  id: null,
  title: '',
  subtitle: '',
  description: '',
  image: '',
  ribbon_text: '',
  purchasable: true,
  variants: [emptyVariant()],
});

const AdminProductsPage = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Không tải được danh sách sản phẩm', description: error.message, variant: 'destructive' });
    } else {
      setProducts(data ?? []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const openCreate = () => {
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (product) => {
    setForm({
      id: product.id,
      title: product.title ?? '',
      subtitle: product.subtitle ?? '',
      description: product.description ?? '',
      image: product.image ?? '',
      ribbon_text: product.ribbon_text ?? '',
      purchasable: product.purchasable ?? true,
      variants: (product.product_variants ?? []).map((v) => ({
        _key: v.id,
        id: v.id,
        title: v.title ?? '',
        price_in_cents: v.price_in_cents ?? '',
        sale_price_in_cents: v.sale_price_in_cents ?? '',
        inventory_quantity: v.inventory_quantity ?? '',
        image_url: v.image_url ?? '',
      })),
    });
    setDialogOpen(true);
  };

  const updateVariant = (key, field, value) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) => (v._key === key ? { ...v, [field]: value } : v)),
    }));
  };

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, emptyVariant()] }));

  const removeVariant = (key) => setForm((f) => ({
    ...f,
    variants: f.variants.filter((v) => v._key !== key),
  }));

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const productPayload = {
        title: form.title,
        subtitle: form.subtitle || null,
        description: form.description || null,
        image: form.image || null,
        images: form.image ? [{ url: form.image }] : [],
        ribbon_text: form.ribbon_text || null,
        purchasable: form.purchasable,
        additional_info: [],
      };

      let productId = form.id;

      if (productId) {
        const { error } = await supabase.from('products').update(productPayload).eq('id', productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(productPayload).select().single();
        if (error) throw error;
        productId = data.id;
      }

      // Xoá variant nào bị bỏ đi khi sửa (so với DB hiện tại)
      if (form.id) {
        const keepIds = form.variants.filter((v) => v.id).map((v) => v.id);
        const { error: delError } = await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', productId)
          .not('id', 'in', `(${keepIds.length ? keepIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);
        if (delError) throw delError;
      }

      for (const v of form.variants) {
        const variantPayload = {
          product_id: productId,
          title: v.title,
          price_in_cents: Number(v.price_in_cents) || 0,
          sale_price_in_cents: v.sale_price_in_cents === '' ? null : Number(v.sale_price_in_cents),
          inventory_quantity: Number(v.inventory_quantity) || 0,
          manage_inventory: true,
          image_url: v.image_url || form.image || null,
        };

        if (v.id) {
          const { error } = await supabase.from('product_variants').update(variantPayload).eq('id', v.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('product_variants').insert(variantPayload);
          if (error) throw error;
        }
      }

      toast({ title: form.id ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm' });
      setDialogOpen(false);
      loadProducts();
    } catch (error) {
      toast({ title: 'Lưu thất bại', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id);
    if (error) {
      toast({ title: 'Xoá thất bại', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Đã xoá sản phẩm' });
      loadProducts();
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Sản phẩm</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Thêm sản phẩm</Button>
      </div>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            ) : products.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Chưa có sản phẩm nào.</TableCell></TableRow>
            ) : products.map((p) => {
              const totalStock = (p.product_variants ?? []).reduce((s, v) => s + (v.inventory_quantity ?? 0), 0);
              const minPrice = Math.min(...(p.product_variants ?? []).map((v) => v.sale_price_in_cents ?? v.price_in_cents ?? 0));
              return (
                <TableRow key={p.id}>
                  <TableCell className="flex items-center gap-3">
                    {p.image && <img src={p.image} alt={p.title} className="h-10 w-10 rounded object-cover" />}
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{(p.product_variants ?? []).length} biến thể</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(minPrice, VND_CURRENCY)}</TableCell>
                  <TableCell>{totalStock}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={onSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên sản phẩm</Label>
              <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phụ đề</Label>
              <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>URL ảnh chính</Label>
                <Input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Nhãn (VD: Mới về, Bán chạy)</Label>
                <Input value={form.ribbon_text} onChange={(e) => setForm((f) => ({ ...f, ribbon_text: e.target.value }))} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Biến thể (màu/size, giá, tồn kho)</Label>
                <Button type="button" size="sm" variant="outline" onClick={addVariant}><Plus className="mr-1 h-3 w-3" />Thêm biến thể</Button>
              </div>
              <div className="mt-2 space-y-3">
                {form.variants.map((v) => (
                  <div key={v._key} className="grid grid-cols-12 gap-2 rounded-md border border-border p-3">
                    <Input className="col-span-3" placeholder="Tên biến thể" required value={v.title} onChange={(e) => updateVariant(v._key, 'title', e.target.value)} />
                    <Input className="col-span-2" type="number" placeholder="Giá (đ)" required value={v.price_in_cents} onChange={(e) => updateVariant(v._key, 'price_in_cents', e.target.value)} />
                    <Input className="col-span-2" type="number" placeholder="Giá SALE" value={v.sale_price_in_cents} onChange={(e) => updateVariant(v._key, 'sale_price_in_cents', e.target.value)} />
                    <Input className="col-span-2" type="number" placeholder="Tồn kho" required value={v.inventory_quantity} onChange={(e) => updateVariant(v._key, 'inventory_quantity', e.target.value)} />
                    <Input className="col-span-2" placeholder="URL ảnh riêng" value={v.image_url} onChange={(e) => updateVariant(v._key, 'image_url', e.target.value)} />
                    <Button type="button" size="icon" variant="ghost" className="col-span-1 text-destructive" onClick={() => removeVariant(v._key)} disabled={form.variants.length === 1}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Huỷ</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá sản phẩm này?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" và toàn bộ biến thể của nó sẽ bị xoá vĩnh viễn. Không thể hoàn tác.
            </AlertDialogDescription>
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

export default AdminProductsPage;
