import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { getProducts, getProductQuantities } from '@/api/EcommerceApi';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: '1:64', label: 'Xe 1:64' },
  { key: '1:32', label: 'Xe 1:32' },
  { key: 'diorama', label: 'Sa bàn / Diorama' },
];

const PRICES = [
  { key: 'all', label: 'Mọi mức giá', min: 0, max: Infinity },
  { key: 'a', label: 'Dưới 400.000đ', min: 0, max: 400000 },
  { key: 'b', label: '400.000đ – 800.000đ', min: 400000, max: 800000 },
  { key: 'c', label: 'Trên 800.000đ', min: 800000, max: Infinity },
];

const StorePage = () => {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(params.get('category') || 'all');
  const [price, setPrice] = useState('all');
  const q = params.get('q') || '';

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getProducts({ limit: '100' });
        const ids = res.products.map((p) => p.id);
        let map = new Map();
        if (ids.length) {
          const qr = await getProductQuantities({ fields: 'inventory_quantity', product_ids: ids });
          qr.variants.forEach((v) => map.set(v.id, v.inventory_quantity));
        }
        setProducts(res.products.map((p) => ({
          ...p,
          variants: p.variants.map((v) => ({ ...v, inventory_quantity: map.get(v.id) ?? v.inventory_quantity })),
        })));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const priceRange = PRICES.find((x) => x.key === price);
    return products.filter((p) => {
      if (q && !(`${p.title} ${p.subtitle || ''}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (category !== 'all' && p.category !== category) return false;
      const cents = p.variants[0]?.sale_price_in_cents ?? p.variants[0]?.price_in_cents ?? 0;
      if (cents < priceRange.min || cents > priceRange.max) return false;
      return true;
    });
  }, [products, q, category, price]);

  const clearFilters = () => {
    setCategory('all');
    setPrice('all');
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('category');
      next.delete('q');
      return next;
    });
  };

  return (
    <>
      <Helmet>
        <title>Sản phẩm — BÁO LỐP</title>
        <meta name="description" content="Lọc và tìm mô hình, sa bàn, xe die-cast 1:64 và 1:32 theo loại và mức giá." />
      </Helmet>

      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Cửa hàng</h1>
        <p className="mt-2 text-muted-foreground">
          {q ? `Kết quả cho "${q}" — ` : ''}{loading ? 'Đang tải...' : `${filtered.length} sản phẩm`}
        </p>

        <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-lg border border-border bg-card p-4 sm:p-5 lg:sticky lg:top-24">
            <div className="mb-4 flex items-center gap-2 font-display font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Bộ lọc
            </div>

            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phân loại</p>
              <div className="flex flex-wrap gap-1.5 lg:flex-col">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${category === c.key ? 'bg-primary text-primary-foreground font-semibold' : 'bg-secondary/60 hover:bg-secondary lg:bg-transparent'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mức giá</p>
              <div className="flex flex-wrap gap-1.5 lg:flex-col">
                {PRICES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setPrice(s.key)}
                    className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${price === s.key ? 'bg-primary text-primary-foreground font-semibold' : 'bg-secondary/60 hover:bg-secondary lg:bg-transparent'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {(category !== 'all' || price !== 'all' || q) && (
              <Button variant="outline" className="mt-5 w-full" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </aside>

          <div>
            {loading ? (
              <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary sm:h-12 sm:w-12" /></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground sm:py-24">
                Không tìm thấy sản phẩm phù hợp.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
                {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StorePage;
