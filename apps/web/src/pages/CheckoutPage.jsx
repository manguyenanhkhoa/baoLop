import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Truck, Landmark, Wallet, MapPinned, Ticket, X, Check } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { createOrder, formatCurrency, VND_CURRENCY } from '@/api/EcommerceApi';
import { isHoChiMinhCity } from '@/lib/vnAddress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MapPicker from '@/components/MapPicker';
import AddressPicker from '@/components/AddressPicker';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: Truck },
  { id: 'bank_transfer', label: 'Chuyển khoản ngân hàng (VCB - quét QR)', icon: Landmark },
  { id: 'momo', label: 'Ví Momo (sắp ra mắt)', icon: Wallet, disabled: true },
];

const FEE_HCM = 20000;
const FEE_NATIONWIDE = 30000;

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(profile?.full_name ?? '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone ?? '');
  const [addressData, setAddressData] = useState(null); // { city, district, ward, streetAddress, saveNew, existingId? }
  const [location, setLocation] = useState(null); // {lat, lng}
  const [mapOpen, setMapOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);

  const [voucherInput, setVoucherInput] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [voucher, setVoucher] = useState(null); // { code, discountInCents }
  const [voucherError, setVoucherError] = useState('');

  useEffect(() => {
    if (profile?.full_name) setCustomerName(profile.full_name);
    if (profile?.phone) setCustomerPhone(profile.phone);
  }, [profile]);

  const subtotalInCents = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.variant.sale_price_in_cents ?? item.variant.price_in_cents) * item.quantity, 0),
    [cartItems]
  );
  const shippingFeeInCents = addressData ? (isHoChiMinhCity(addressData.city) ? FEE_HCM : FEE_NATIONWIDE) : 0;
  const discountInCents = voucher?.discountInCents ?? 0;
  const totalInCents = Math.max(0, subtotalInCents + shippingFeeInCents - discountInCents);

  const applyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setApplyingVoucher(true);
    setVoucherError('');
    try {
      const productIds = cartItems.map((item) => item.product.id);
      const { data, error } = await supabase.rpc('apply_voucher', {
        p_code: voucherInput.trim(),
        p_subtotal_cents: subtotalInCents,
        p_product_ids: productIds,
        p_customer_id: user.id,
      });
      if (error) throw error;
      const result = data?.[0];
      if (!result?.valid) {
        setVoucherError(result?.message ?? 'Mã voucher không hợp lệ.');
        setVoucher(null);
        return;
      }
      setVoucher({ code: voucherInput.trim().toUpperCase(), discountInCents: result.discount_in_cents });
      toast({ title: `Đã áp dụng mã ${voucherInput.trim().toUpperCase()}` });
    } catch (error) {
      setVoucherError(error.message ?? 'Không kiểm tra được voucher.');
      setVoucher(null);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setVoucher(null);
    setVoucherInput('');
    setVoucherError('');
  };

  // Bắt buộc đăng nhập mới được đặt hàng
  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Cần đăng nhập để đặt hàng</h1>
        <p className="mt-2 text-muted-foreground">Đăng nhập hoặc tạo tài khoản để tiếp tục thanh toán và theo dõi đơn hàng của bạn.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild><Link to="/login" state={{ from: '/checkout' }}>Đăng nhập</Link></Button>
          <Button asChild variant="outline"><Link to="/register">Tạo tài khoản</Link></Button>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

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
    if (!addressData) {
      toast({ title: 'Chưa chọn địa chỉ giao hàng', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    try {
      const fullAddress = `${addressData.streetAddress}, ${addressData.ward}, ${addressData.district}, ${addressData.city}`;

      const { order } = await createOrder({
        customerId: user.id,
        customerName,
        customerPhone,
        customerAddress: fullAddress,
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        paymentMethod,
        shippingFeeInCents,
        voucherCode: voucher?.code ?? null,
        discountInCents,
        items: cartItems,
      });

      if (addressData.saveNew) {
        await supabase.from('customer_addresses').insert({
          customer_id: user.id,
          city: addressData.city,
          district: addressData.district,
          ward: addressData.ward,
          street_address: addressData.streetAddress,
        });
      }

      clearCart();

      navigate('/success', {
        state: { orderId: order.id, totalInCents, paymentMethod },
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
              <h2 className="font-display text-lg font-semibold">Thông tin người nhận</h2>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Họ và tên</Label>
                  <Input id="customerName" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Số điện thoại</Label>
                  <Input id="customerPhone" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="09xxxxxxxx" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Địa chỉ giao hàng</h2>
                <button type="button" onClick={() => setMapOpen(true)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  <MapPinned className="h-3.5 w-3.5" /> Ghim vị trí trên bản đồ
                </button>
              </div>
              <div className="mt-4">
                <AddressPicker userId={user.id} onChange={setAddressData} />
              </div>
              {location && <p className="mt-2 text-xs text-muted-foreground">📍 Đã ghim vị trí chính xác trên bản đồ.</p>}
            </div>

            <MapPicker
              open={mapOpen}
              onOpenChange={setMapOpen}
              onConfirm={({ lat, lng }) => setLocation({ lat, lng })}
            />

            <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Ticket className="h-4 w-4" /> Mã giảm giá</h2>
              {voucher ? (
                <div className="mt-3 flex items-center justify-between rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 font-medium text-primary"><Check className="h-4 w-4" /> {voucher.code} — giảm {formatCurrency(voucher.discountInCents, VND_CURRENCY)}</span>
                  <button type="button" onClick={removeVoucher} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Input
                    value={voucherInput}
                    onChange={(e) => { setVoucherInput(e.target.value); setVoucherError(''); }}
                    placeholder="Nhập mã voucher"
                    className="uppercase"
                  />
                  <Button type="button" variant="outline" onClick={applyVoucher} disabled={applyingVoucher || !voucherInput.trim()}>
                    {applyingVoucher ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
                  </Button>
                </div>
              )}
              {voucherError && <p className="mt-2 text-xs text-destructive">{voucherError}</p>}
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

            <Button type="submit" disabled={submitting || !addressData} className="w-full py-3 text-base">
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
                <span>Phí vận chuyển{!addressData && ' (chọn địa chỉ để tính)'}</span>
                <span>{addressData ? formatCurrency(shippingFeeInCents, VND_CURRENCY) : '—'}</span>
              </div>
              {discountInCents > 0 && (
                <div className="flex items-center justify-between text-primary">
                  <span>Giảm giá ({voucher.code})</span>
                  <span>-{formatCurrency(discountInCents, VND_CURRENCY)}</span>
                </div>
              )}
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
