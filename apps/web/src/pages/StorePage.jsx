import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { getProducts, getProductQuantities } from '@/api/EcommerceApi';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';

const SIZES = [
  { key: 'all', label: 'Tất cả' },
  { key: '1:64', label: 'Xe 1:64' },
  { key: '1:34', label: 'Xe 1:34' },
  { key: 'sa bàn', label: 'Sa bàn / Diorama' },
];

const PRICES = [
  { key: 'all', label: 'Mọi mức giá', min: 0, max: Infinity },
  { key: 'a', label: 'Dưới 400.000đ', min: 0, max: 400000 },
  { key: 'b', label: '400.000đ – 800.000đ', min: 400000, max: 800000 },
  { key: 'c', label: 'Trên 800.000đ', min: 800000, max: Infinity },
];

const matchSize = (p, size) => {
  if (size === 'all') return true;
  return (p.title || '').toLowerCase().includes(size.toLowerCase());
};

const StorePage = () => {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState('all');
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
      if (!matchSize(p, size)) return false;
      const cents = p.variants[0]?.sale_price_in_cents ?? p.variants[0]?.price_in_cents ?? 0;
      if (cents < priceRange.min || cents > priceRange.max) return false;
      return true;
    });
  }, [products, q, size, price]);

  return (
    <>
      <Helmet>
        <title>Sản phẩm — ModelCraft</title>
        <meta name="description" content="Lọc" />
      </Helmet>

      <div className="mx-auto max-w-[90rem] px-6 py-10">
        <h1 className="font-display text-4xl font-bold">Cửa hàng</h1>
        <p className="mt-2 text-muted-foreground">
          {q ? `Kết quả cho "${q}" — ` : ''}{loading ? 'Đang tải...' : `${filtered.length} sản phẩm`}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
            <div className="mb-4 flex items-center gap-2 font-display font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Bộ lọc
            </div>
            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kích thước / Loại</p>
              <div className="flex flex-col gap-1.5">
                {SIZES.map((s) => (
                  <button key={s.key} onClick={() => setSize(s.key)}
                    className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${size === s.key ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-secondary'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mức giá</p>
              <div className="flex flex-col gap-1.5">
                {PRICES.map((s) => (
                  <button key={s.key} onClick={() => setPrice(s.key)}
                    className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${price === s.key ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-secondary'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {(size !== 'all' || price !== 'all' || q) && (
              <Button variant="outline" className="mt-5 w-full" onClick={() => { setSize('all'); setPrice('all'); setParams({}); }}>
                Xóa bộ lọc
              </Button>
            )}
          </aside>

          <div>
            {loading ? (
              <div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-24 text-center text-muted-foreground">
                Không tìm thấy sản phẩm phù hợp.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
