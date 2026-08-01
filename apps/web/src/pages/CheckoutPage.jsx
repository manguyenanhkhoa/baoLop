import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Loader2, Truck, CreditCard, Wallet } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { createOrder } from '@/api/EcommerceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: Truck },
  { id: 'vnpay', label: 'VNPay', icon: CreditCard },
  { id: 'momo', label: 'Ví Momo', icon: Wallet },
];

const CheckoutPage = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(profile?.full_name ?? '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone ?? '');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);

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
      await createOrder({
        customerId: user?.id ?? null,
        customerName,
        customerPhone,
        customerAddress,
        paymentMethod,
        items: cartItems,
      });

      clearCart();

      if (paymentMethod !== 'cod') {
        toast({
          title: 'Đã ghi nhận đơn hàng',
          description: 'Cổng thanh toán online đang được thiết lập, shop sẽ liên hệ xác nhận thanh toán với bạn sớm nhất.',
        });
      }

      navigate('/success');
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
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Thanh toán</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          <form onSubmit={onSubmit} className="space-y-6 lg:col-span-3">
            <div className="rounded-lg border border-border bg-card p-6">
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

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Phương thức thanh toán</h2>
              <div className="mt-4 space-y-2">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${paymentMethod === id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={id}
                      checked={paymentMethod === id}
                      onChange={() => setPaymentMethod(id)}
                      className="accent-primary"
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
              {paymentMethod !== 'cod' && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Cổng thanh toán {paymentMethod === 'vnpay' ? 'VNPay' : 'Momo'} đang được thiết lập.
                  Đơn hàng vẫn sẽ được ghi nhận, shop sẽ liên hệ để xác nhận thanh toán.
                </p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full py-3 text-base">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đặt hàng
            </Button>
          </form>

          <div className="rounded-lg border border-border bg-card p-6 lg:col-span-2 h-fit">
            <h2 className="font-display text-lg font-semibold">Đơn hàng của bạn</h2>
            <div className="mt-4 space-y-3">
              {cartItems.map((item) => (
                <div key={item.variant.id} className="flex items-center gap-3">
                  <img src={item.product.image} alt={item.product.title} className="h-14 w-14 rounded-md object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.product.title}</p>
                    <p className="text-xs text-muted-foreground">{item.variant.title} × {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{item.variant.sale_price_formatted}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-medium">Tổng cộng</span>
              <span className="text-xl font-bold text-primary">{getCartTotal()}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
