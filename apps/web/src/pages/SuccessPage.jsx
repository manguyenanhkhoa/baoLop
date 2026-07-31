import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SuccessPage = () => (
  <>
    <Helmet><title>Đặt hàng thành công — ModelCraft</title><meta name="description" content="Cảm ơn bạn đã đặt hàng tại ModelCraft." /></Helmet>
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <CheckCircle className="h-20 w-20 text-primary" />
      <h1 className="mt-6 font-display text-4xl font-bold">Đặt hàng thành công!</h1>
      <p className="mt-3 text-muted-foreground">Cảm ơn bạn đã mua sắm tại ModelCraft. Chúng tôi sẽ liên hệ và giao hàng trong thời gian sớm nhất.</p>
      <Button asChild className="mt-8"><Link to="/store">Tiếp tục mua sắm</Link></Button>
    </div>
  </>
);

export default SuccessPage;
