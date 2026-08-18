import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Upload, ImageIcon, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, VND_CURRENCY } from '@/api/EcommerceApi';
import { uploadProductImage } from '@/lib/uploadImage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

const CATEGORY_OPTIONS = [
  { value: '1:64', label: 'Xe 1:64' },
  { value: '1:32', label: 'Xe 1:32' },
  { value: 'diorama', label: 'Sa bàn / Diorama' },
];

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
  category: '1:64',
  purchasable: true,
  requires_deposit: false,
  deposit_amount_cents: '',
  lead_time_text: '',
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
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingVariantKey, setUploadingVariantKey] = useState(null);

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
      category: product.category ?? '1:64',
      purchasable: product.purchasable ?? true,
      requires_deposit: product.requires_deposit ?? false,
      deposit_amount_cents: product.deposit_amount_cents ?? '',
      lead_time_text: product.lead_time_text ?? '',
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

  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng 1 file lần sau
    if (!file) return;

    setUploadingMain(true);
    try {
      const url = await uploadProductImage(file);
      setForm((f) => ({ ...f, image: url }));
      toast({ title: 'Tải ảnh lên thành công' });
    } catch (error) {
      toast({ title: 'Tải ảnh thất bại', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingMain(false);
    }
  };

  const handleVariantImageUpload = async (key, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingVariantKey(key);
    try {
      const url = await uploadProductImage(file);
      updateVariant(key, 'image_url', url);
      toast({ title: 'Tải ảnh lên thành công' });
    } catch (error) {
      toast({ title: 'Tải ảnh thất bại', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingVariantKey(null);
    }
  };

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
        category: form.category,
        purchasable: form.purchasable,
        requires_deposit: form.requires_deposit,
        deposit_amount_cents: form.requires_deposit ? (Number(form.deposit_amount_cents) || 0) : null,
        lead_time_text: form.requires_deposit ? (form.lead_time_text || null) : null,
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
              <TableHead>Phân loại</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            ) : products.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chưa có sản phẩm nào.</TableCell></TableRow>
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
                      {p.requires_deposit && (
                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                          <Clock className="h-3 w-3" /> Cọc {formatCurrency(p.deposit_amount_cents, VND_CURRENCY)} · {p.lead_time_text}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{CATEGORY_OPTIONS.find((c) => c.value === p.category)?.label ?? p.category}</TableCell>
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
                <Label>Ảnh chính</Label>
                <div className="flex items-center gap-3">
                  {form.image ? (
                    <img src={form.image} alt="" className="h-16 w-16 shrink-0 rounded-md border border-border object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:border-primary">
                      {uploadingMain ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploadingMain ? 'Đang tải lên...' : 'Tải ảnh từ máy'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} disabled={uploadingMain} />
                    </label>
                    <Input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="hoặc dán URL ảnh" className="text-xs" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nhãn (VD: Mới về, Bán chạy)</Label>
                <Input value={form.ribbon_text} onChange={(e) => setForm((f) => ({ ...f, ribbon_text: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phân loại</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                <Switch checked={form.requires_deposit} onCheckedChange={(v) => setForm((f) => ({ ...f, requires_deposit: v }))} />
                <Label className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Cần đặt cọc trước (hàng chưa có sẵn ngay)</Label>
              </div>
              {form.requires_deposit && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Số tiền cọc (đ)</Label>
                    <Input type="number" min="0" required={form.requires_deposit} value={form.deposit_amount_cents} onChange={(e) => setForm((f) => ({ ...f, deposit_amount_cents: e.target.value }))} placeholder="VD: 100000" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Thời gian có hàng</Label>
                    <Input required={form.requires_deposit} value={form.lead_time_text} onChange={(e) => setForm((f) => ({ ...f, lead_time_text: e.target.value }))} placeholder="VD: 7-10 ngày" />
                  </div>
                </div>
              )}
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
                    <div className="col-span-2 flex items-center gap-1">
                      <Input placeholder="URL ảnh riêng" value={v.image_url} onChange={(e) => updateVariant(v._key, 'image_url', e.target.value)} className="text-xs" />
                      <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border hover:border-primary" title="Tải ảnh từ máy">
                        {uploadingVariantKey === v._key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVariantImageUpload(v._key, e)} disabled={uploadingVariantKey === v._key} />
                      </label>
                    </div>
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
