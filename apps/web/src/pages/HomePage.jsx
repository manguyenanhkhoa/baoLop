import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, Award, Loader2 } from 'lucide-react';
import { getProducts, getProductQuantities } from '@/api/EcommerceApi';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';

const heroImage = "https://images.hostinger.com/ba532802-1349-48ee-a6d7-3d644c4dfd81.png";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProducts({ limit: '8' });
        const ids = res.products.map((p) => p.id);
        let map = new Map();
        if (ids.length) {
          const q = await getProductQuantities({ fields: 'inventory_quantity', product_ids: ids });
          q.variants.forEach((v) => map.set(v.id, v.inventory_quantity));
        }
        setProducts(res.products.map((p) => ({
          ...p,
          variants: p.variants.map((v) => ({ ...v, inventory_quantity: map.get(v.id) ?? v.inventory_quantity })),
        })));
      } catch (e) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <Helmet>
        <title>Báo Lốp - Mô Hình Xe</title>
        <meta name="description" content="Cửa hàng xe die-cast và diorama. " />
      </Helmet>

      <section className="relative flex min-h-[70vh] items-center sm:min-h-[82vh]">
        <img src={heroImage} alt="Bộ sưu tập mô hình" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="relative mx-auto w-full max-w-[90rem] px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-2xl">
            <span className="inline-block rounded-full border border-primary/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary sm:px-4 sm:text-xs">Từ Sombre Licorne</span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] sm:mt-5 sm:text-6xl sm:leading-[1.05] md:text-7xl">
              Thế giới <span className="text-primary">mô hình</span> & diorama
            </h1>
            <p className="mt-4 max-w-xl text-base text-foreground/80 sm:mt-5 sm:text-lg">
              Xe die-cast 1:64, diorama tiểu cảnh thủ công và nhiều phụ kiện cho người sưu tầm. Chất lượng, giao hàng toàn quốc.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
              <Button asChild size="lg" className="font-semibold">
                <Link to="/store">Khám phá sản phẩm <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold">
                <Link to="/store?category=diorama">Xem sa bàn</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-[90rem] gap-5 px-4 py-6 sm:grid-cols-3 sm:gap-6 sm:px-6 sm:py-8">
          {[
            { icon: Truck, t: 'Giao hàng toàn quốc', d: 'Đóng gói chống sốc cẩn thận' },
            { icon: ShieldCheck, t: 'Cam kết chính hãng', d: 'Bảo hành từ 7 ngày' },
            { icon: Award, t: 'Chất lượng sưu tầm', d: 'Chi tiết sắc nét, tỉ lệ chuẩn' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex items-center gap-3 sm:gap-4">
              <Icon className="h-7 w-7 shrink-0 text-primary sm:h-9 sm:w-9" />
              <div>
                <p className="font-display text-sm font-semibold sm:text-base">{t}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-6 flex items-end justify-between sm:mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-4xl">Sản phẩm nổi bật</h2>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">Những mẫu được người sưu tầm yêu thích nhất.</p>
          </div>
          <Link to="/store" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary sm:h-12 sm:w-12" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>
    </>
  );
};

export default HomePage;
