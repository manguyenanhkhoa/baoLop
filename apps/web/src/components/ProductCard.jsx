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
              className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-56"
            />
            {product.ribbon_text && (
              <span className="absolute left-2 top-2 rounded-sm bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
                {product.ribbon_text}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">{product.type?.value || 'Mô hình'}</p>
            <h3 className="mt-1 font-display text-sm font-semibold leading-tight line-clamp-2 sm:text-lg">{product.title}</h3>
            <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
              <span className="text-base font-bold text-primary sm:text-lg">{displayPrice}</span>
              {originalPrice && <span className="text-xs text-muted-foreground line-through sm:text-sm">{originalPrice}</span>}
            </div>
            <Button onClick={handleAddToCart} className="mt-3 w-full text-xs font-semibold sm:mt-4 sm:text-sm" size="sm">
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> Thêm vào giỏ
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
