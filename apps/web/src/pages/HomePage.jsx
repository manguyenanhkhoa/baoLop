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
        <meta name="description" content="Cửa hàng mô hình, sa bàn và xe die-cast tỉ lệ 1:64, 1:34. " />
      </Helmet>

      <section className="relative flex min-h-[82vh] items-center">
        <img src={heroImage} alt="Bộ sưu tập mô hình" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="relative mx-auto w-full max-w-[90rem] px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-2xl">
            <span className="inline-block rounded-full border border-primary/50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">Bộ sưu tập chính hãng</span>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl">
              Thế giới <span className="text-primary">mô hình</span> & sa bàn tỉ lệ
            </h1>
            <p className="mt-5 max-w-xl text-lg text-foreground/80">
              Xe die-cast 1:64, 1:34, sa bàn tiểu cảnh thủ công và hàng ngàn phụ kiện cho người sưu tầm. Chất lượng cao, giao hàng toàn quốc.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="font-semibold">
                <Link to="/store">Khám phá sản phẩm <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold">
                <Link to="/store?q=sa bàn">Xem sa bàn</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-[90rem] gap-6 px-6 py-8 sm:grid-cols-3">
          {[
            { icon: Truck, t: 'Giao hàng toàn quốc', d: 'Đóng gói chống sốc cẩn thận' },
            { icon: ShieldCheck, t: 'Cam kết chính hãng', d: 'Đổi trả trong 7 ngày' },
            { icon: Award, t: 'Chất lượng sưu tầm', d: 'Chi tiết sắc nét, tỉ lệ chuẩn' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex items-center gap-4">
              <Icon className="h-9 w-9 shrink-0 text-primary" />
              <div>
                <p className="font-display font-semibold">{t}</p>
                <p className="text-sm text-muted-foreground">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Sản phẩm nổi bật</h2>
            <p className="mt-2 text-muted-foreground">Những mẫu được người sưu tầm yêu thích nhất.</p>
          </div>
          <Link to="/store" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>
    </>
  );
};

export default HomePage;
