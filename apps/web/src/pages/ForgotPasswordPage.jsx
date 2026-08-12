import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ForgotPasswordPage = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);

    if (error) {
      toast({ title: 'Không gửi được email', description: error.message, variant: 'destructive' });
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">Kiểm tra email của bạn</h1>
        <p className="mt-2 text-muted-foreground">
          Mình đã gửi link đặt lại mật khẩu tới <span className="font-medium text-foreground">{email}</span>.
          Mở email và bấm vào link để đặt mật khẩu mới. (Nhớ kiểm tra cả mục Spam nếu chưa thấy.)
        </p>
        <Button asChild className="mt-6"><Link to="/login">Quay lại đăng nhập</Link></Button>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Quên mật khẩu</title></Helmet>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <h1 className="font-display text-3xl font-bold">Quên mật khẩu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nhập email đã đăng ký, mình sẽ gửi link để bạn đặt lại mật khẩu mới.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi link đặt lại mật khẩu
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Quay lại đăng nhập</Link>
        </p>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
