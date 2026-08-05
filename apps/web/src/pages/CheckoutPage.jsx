import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Loader2, Truck, Landmark, Wallet, MapPin } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { createOrder, formatCurrency, VND_CURRENCY } from '@/api/EcommerceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: Truck },
  { id: 'bank_transfer', label: 'Chuyển khoản ngân hàng (VCB - quét QR)', icon: Landmark },
  { id: 'momo', label: 'Ví Momo (sắp ra mắt)', icon: Wallet, disabled: true },
];

const SHIPPING_OPTIONS = [
  { id: 'hcm', label: 'Nội thành TP. Hồ Chí Minh', fee: 20000 },
  { id: 'nationwide', label: 'Toàn quốc (ngoài TP.HCM)', fee: 30000 },
];

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(profile?.full_name ?? '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone ?? '');
  const [customerAddress, setCustomerAddress] = useState('');
  const [shippingArea, setShippingArea] = useState('hcm');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);

  const subtotalInCents = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.variant.sale_price_in_cents ?? item.variant.price_in_cents) * item.quantity, 0),
    [cartItems]
  );
  const shippingFeeInCents = SHIPPING_OPTIONS.find((s) => s.id === shippingArea)?.fee ?? 0;
  const totalInCents = subtotalInCents + shippingFeeInCents;

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Giỏ hàng đang trống</h1>
        <p className="mt-2 text-muted-foreground">Thêm sản phẩm vào giỏ trước khi thanh toán.</p>
        <Button className="mt-6" onClick={() => navigate('/store')}>Xem sản phẩm</Button>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { order } = await createOrder({
        customerId: user?.id ?? null,
        customerName,
        customerPhone,
        customerAddress,
        paymentMethod,
        shippingFeeInCents,
        items: cartItems,
      });

      clearCart();

      navigate('/success', {
        state: {
          orderId: order.id,
          totalInCents,
          paymentMethod,
        },
      });
    } catch (error) {
      toast({
        title: 'Không thể tạo đơn hàng',
        description: error?.message ?? 'Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet><title>Thanh toán</title></Helmet>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 sm:px-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Thanh toán</h1>

        <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-5">
          <form onSubmit={onSubmit} className="space-y-6 lg:col-span-3">
            <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="font-display text-lg font-semibold">Thông tin giao hàng</h2>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Họ và tên</Label>
                  <Input id="customerName" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Số điện thoại</Label>
                  <Input id="customerPhone" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="09xxxxxxxx" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Địa chỉ giao hàng</Label>
                  <Textarea id="customerAddress" required value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" rows={3} />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="font-display text-lg font-semibold">Khu vực giao hàng</h2>
              <div className="mt-4 space-y-2">
                {SHIPPING_OPTIONS.map((s) => (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${shippingArea === s.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <input
                      type="radio"
                      name="shippingArea"
                      value={s.id}
                      checked={shippingArea === s.id}
                      onChange={() => setShippingArea(s.id)}
                      className="accent-primary"
                    />
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium">{s.label}</span>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(s.fee, VND_CURRENCY)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="font-display text-lg font-semibold">Phương thức thanh toán</h2>
              <div className="mt-4 space-y-2">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon, disabled }) => (
                  <label
                    key={id}
                    className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${paymentMethod === id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={id}
                      checked={paymentMethod === id}
                      disabled={disabled}
                      onChange={() => setPaymentMethod(id)}
                      className="accent-primary"
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
              {paymentMethod === 'bank_transfer' && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Sau khi đặt hàng, mã QR chuyển khoản sẽ hiện ra ở bước xác nhận — quét bằng app ngân hàng bất kỳ để thanh toán.
                </p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full py-3 text-base">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đặt hàng
            </Button>
          </form>

          <div className="rounded-lg border border-border bg-card p-4 sm:p-6 lg:col-span-2 h-fit">
            <h2 className="font-display text-lg font-semibold">Đơn hàng của bạn</h2>
            <div className="mt-4 space-y-3">
              {cartItems.map((item) => (
                <div key={item.variant.id} className="flex items-center gap-3">
                  <img src={item.product.image} alt={item.product.title} className="h-12 w-12 rounded-md object-cover sm:h-14 sm:w-14" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.product.title}</p>
                    <p className="text-xs text-muted-foreground">{item.variant.title} × {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{item.variant.sale_price_formatted}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span>{formatCurrency(subtotalInCents, VND_CURRENCY)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Phí vận chuyển</span>
                <span>{formatCurrency(shippingFeeInCents, VND_CURRENCY)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 font-medium text-foreground">
                <span>Tổng cộng</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(totalInCents, VND_CURRENCY)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
