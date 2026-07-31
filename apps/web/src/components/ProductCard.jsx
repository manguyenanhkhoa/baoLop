import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjMyMDFkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";

const ProductCard = ({ product, index = 0 }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const variant = useMemo(() => product.variants[0], [product]);
  const hasSale = variant && variant.sale_price_in_cents !== null && variant.sale_price_in_cents !== undefined;
  const displayPrice = hasSale ? variant.sale_price_formatted : variant?.price_formatted;
  const originalPrice = hasSale ? variant.price_formatted : null;

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.variants.length > 1) {
      navigate(`/product/${product.id}`);
      return;
    }
    try {
      await addToCart(product, variant, 1, variant.inventory_quantity);
      toast({ title: 'Đã thêm vào giỏ', description: `${product.title} đã được thêm vào giỏ hàng.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Lỗi', description: error.message });
    }
  }, [product, variant, addToCart, toast, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: (index % 8) * 0.04 }}
    >
      <Link to={`/product/${product.id}`} className="block h-full">
        <div className="group h-full flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-primary/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40">
          <div className="relative overflow-hidden">
            <img
              src={product.image || placeholderImage}
              alt={product.title}
              className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {product.ribbon_text && (
              <span className="absolute left-3 top-3 rounded-sm bg-primary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground">
                {product.ribbon_text}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{product.type?.value || 'Mô hình'}</p>
            <h3 className="mt-1 font-display text-lg font-semibold leading-tight line-clamp-2">{product.title}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">{displayPrice}</span>
              {originalPrice && <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>}
            </div>
            <Button onClick={handleAddToCart} className="mt-4 w-full font-semibold">
              <ShoppingCart className="mr-2 h-4 w-4" /> Thêm vào giỏ
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
