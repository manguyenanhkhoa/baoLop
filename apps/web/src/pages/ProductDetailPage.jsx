import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProduct, getProductQuantities } from '@/api/EcommerceApi';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Loader2, ArrowLeft, CheckCircle, Minus, Plus, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlNWU1Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPktow7RuZyBjw7MgxeF1aDwvdGV4dD4KPC9zdmc+Cg==";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = useCallback(async () => {
    if (product && selectedVariant) {
      const availableQuantity = selectedVariant.inventory_quantity;
      try {
        await addToCart(product, selectedVariant, quantity, availableQuantity);
        toast({
          title: 'Đã thêm vào giỏ 🛒',
          description: `${quantity} x ${product.title} (${selectedVariant.title}).`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Có lỗi xảy ra',
          description: error.message,
        });
      }
    }
  }, [product, selectedVariant, quantity, addToCart, toast]);

  const handleQuantityChange = useCallback((amount) => {
    setQuantity((prevQuantity) => {
      const newQuantity = prevQuantity + amount;
      if (newQuantity < 1) return 1;
      return newQuantity;
    });
  }, []);

  const handlePrevImage = useCallback(() => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
    }
  }, [product?.images?.length]);

  const handleNextImage = useCallback(() => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
    }
  }, [product?.images?.length]);

  const handleVariantSelect = useCallback((variant) => {
    setSelectedVariant(variant);

    if (variant.image_url && product?.images?.length > 0) {
      const imageIndex = product.images.findIndex((image) => image.url === variant.image_url);
      if (imageIndex !== -1) {
        setCurrentImageIndex(imageIndex);
      }
    }
  }, [product?.images]);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedProduct = await getProduct(id);

        const quantitiesResponse = await getProductQuantities({
          fields: 'inventory_quantity',
          product_ids: [fetchedProduct.id],
        });

        const variantQuantityMap = new Map();
        quantitiesResponse.variants.forEach((variant) => {
          variantQuantityMap.set(variant.id, variant.inventory_quantity);
        });

        const productWithQuantities = {
          ...fetchedProduct,
          variants: fetchedProduct.variants.map((variant) => ({
            ...variant,
            inventory_quantity: variantQuantityMap.get(variant.id) ?? variant.inventory_quantity,
          })),
        };

        setProduct(productWithQuantities);

        if (productWithQuantities.variants && productWithQuantities.variants.length > 0) {
          setSelectedVariant(productWithQuantities.variants[0]);
        }
      } catch (err) {
        setError(err.message || 'Không tải được sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <Link to="/store" className="mb-6 inline-flex items-center gap-2 text-foreground/80 transition-colors hover:text-primary">
          <ArrowLeft size={16} />
          Quay lại
        </Link>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center text-destructive">
          <XCircle className="mx-auto mb-4 h-14 w-14" />
          <p className="mb-2 font-medium">Không tải được sản phẩm</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const price = selectedVariant?.sale_price_formatted ?? selectedVariant?.price_formatted;
  const originalPrice = selectedVariant?.price_formatted;
  const availableStock = selectedVariant ? selectedVariant.inventory_quantity : 0;
  const isStockManaged = selectedVariant?.manage_inventory ?? false;
  const canAddToCart = !isStockManaged || quantity <= availableStock;

  const currentImage = product.images[currentImageIndex];
  const hasMultipleImages = product.images.length > 1;

  return (
    <>
      <Helmet>
        <title>{product.title} — BÁO LỐP</title>
        <meta name="description" content={product.description?.substring(0, 160) || product.title} />
      </Helmet>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/store" className="mb-6 inline-flex items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-primary">
          <ArrowLeft size={16} />
          Quay lại cửa hàng
        </Link>
        <div className="grid gap-8 rounded-lg border border-border bg-card p-4 sm:p-8 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="relative">
            <div className="relative h-80 overflow-hidden rounded-md border border-border sm:h-96 md:h-[460px]">
              <img
                src={!currentImage?.url ? placeholderImage : currentImage.url}
                alt={product.title}
                className="h-full w-full object-cover"
              />

              {hasMultipleImages && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow transition-colors hover:bg-background"
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow transition-colors hover:bg-background"
                    aria-label="Ảnh sau"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {product.ribbon_text && (
                <div className="absolute left-3 top-3 rounded-sm bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground sm:left-4 sm:top-4 sm:text-sm">
                  {product.ribbon_text}
                </div>
              )}
            </div>

            {hasMultipleImages && (
              <div className="mt-4 hidden gap-2 overflow-x-auto md:flex">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${index === currentImageIndex ? 'border-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <img src={!image.url ? placeholderImage : image.url} alt={`${product.title} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {hasMultipleImages && (
              <div className="mt-4 flex justify-center gap-2 md:hidden">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${index === currentImageIndex ? 'bg-primary' : 'bg-border'}`}
                    aria-label={`Xem ảnh ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-col">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{product.title}</h1>
            {product.subtitle && <p className="mt-1 text-muted-foreground">{product.subtitle}</p>}

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{price}</span>
              {selectedVariant?.sale_price_in_cents != null && (
                <span className="text-lg text-muted-foreground line-through">{originalPrice}</span>
              )}
            </div>

            {product.description && (
              <div className="prose prose-sm mt-4 max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: product.description }} />
            )}

            {product.additional_info?.length > 0 && (
              <div className="mt-5 space-y-4">
                {product.additional_info
                  .sort((a, b) => a.order - b.order)
                  .map((info) => (
                    <div key={info.id} className="border-l-2 border-primary/40 pl-4">
                      <h3 className="mb-1 text-sm font-semibold">{info.title}</h3>
                      <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: info.description }} />
                    </div>
                  ))}
              </div>
            )}

            {product.variants.length > 1 && (
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-medium">Phiên bản</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                      onClick={() => handleVariantSelect(variant)}
                      size="sm"
                    >
                      {variant.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-border p-1">
                <Button onClick={() => handleQuantityChange(-1)} variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Minus size={16} /></Button>
                <span className="w-10 text-center font-semibold">{quantity}</span>
                <Button onClick={() => handleQuantityChange(1)} variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Plus size={16} /></Button>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <Button onClick={handleAddToCart} size="lg" className="w-full text-base font-semibold" disabled={!canAddToCart || !product.purchasable}>
                <ShoppingCart className="mr-2 h-5 w-5" /> Thêm vào giỏ
              </Button>

              {isStockManaged && canAddToCart && product.purchasable && (
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-green-700">
                  <CheckCircle size={16} /> Còn {availableStock} sản phẩm
                </p>
              )}

              {isStockManaged && !canAddToCart && product.purchasable && (
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-amber-700">
                  <XCircle size={16} /> Không đủ hàng, chỉ còn {availableStock} sản phẩm.
                </p>
              )}

              {!product.purchasable && (
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-destructive">
                  <XCircle size={16} /> Hiện tạm hết hàng
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default ProductDetailPage;
