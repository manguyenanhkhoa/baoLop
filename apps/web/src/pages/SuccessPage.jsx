import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, VND_CURRENCY } from '@/api/EcommerceApi';
import { BANK_ACCOUNT, buildVietQrUrl } from '@/lib/paymentConfig';

const SuccessPage = () => {
  const location = useLocation();
  const { toast } = useToast();
  const state = location.state;

  const isBankTransfer = state?.paymentMethod === 'bank_transfer';
  const orderCode = state?.orderId ? state.orderId.slice(0, 8).toUpperCase() : '';
  const transferNote = orderCode ? `DH ${orderCode}` : 'Thanh toan don hang';

  const copyAccountNo = () => {
    navigator.clipboard.writeText(BANK_ACCOUNT.accountNo);
    toast({ title: 'Đã sao chép số tài khoản' });
  };

  return (
    <>
      <Helmet><title>Đặt hàng thành công — BÁO LỐP</title><meta name="description" content="Cảm ơn bạn đã đặt hàng tại BÁO LỐP." /></Helmet>
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <CheckCircle className="h-16 w-16 text-primary sm:h-20 sm:w-20" />
        <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">Đặt hàng thành công!</h1>
        {orderCode && <p className="mt-1 text-sm text-muted-foreground">Mã đơn hàng: <span className="font-mono font-semibold text-foreground">{orderCode}</span></p>}
        <p className="mt-3 text-muted-foreground">
          Cảm ơn bạn đã mua sắm tại BÁO LỐP. Chúng tôi sẽ liên hệ và giao hàng trong thời gian sớm nhất.
        </p>

        {isBankTransfer && (
          <div className="mt-8 w-full rounded-lg border border-border bg-card p-5 text-left sm:p-6">
            <h2 className="text-center font-display text-lg font-semibold">Quét mã để chuyển khoản</h2>
            <img
              src={buildVietQrUrl({ amountInCents: state.totalInCents, note: transferNote })}
              alt="Mã QR chuyển khoản"
              className="mx-auto mt-4 h-56 w-56 rounded-md border border-border bg-white p-2 sm:h-64 sm:w-64"
            />
            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Ngân hàng</span><span className="font-medium">{BANK_ACCOUNT.bankName}</span></div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số tài khoản</span>
                <button onClick={copyAccountNo} className="inline-flex items-center gap-1 font-medium hover:text-primary">
                  {BANK_ACCOUNT.accountNo} <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Chủ tài khoản</span><span className="font-medium">{BANK_ACCOUNT.accountName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Số tiền</span><span className="font-semibold text-primary">{formatCurrency(state.totalInCents, VND_CURRENCY)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Nội dung CK</span><span className="font-medium">{transferNote}</span></div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Mở app ngân hàng bất kỳ → quét mã QR trên → kiểm tra đúng số tiền và nội dung → xác nhận chuyển khoản. Đơn hàng sẽ được xử lý ngay khi shop nhận được tiền.
            </p>
          </div>
        )}

        <Button asChild className="mt-8"><Link to="/store">Tiếp tục mua sắm</Link></Button>
      </div>
    </>
  );
};

export default SuccessPage;
