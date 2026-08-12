import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Loader2, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ResetPasswordPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [readySession, setReadySession] = useState(false);

  // Khi bấm link trong email, Supabase tự đăng nhập tạm bằng token trong URL
  // và bắn sự kiện PASSWORD_RECOVERY — đợi sự kiện đó rồi mới cho đổi mật khẩu.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReadySession(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReadySession(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'Mật khẩu quá ngắn', description: 'Mật khẩu cần ít nhất 6 ký tự.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Mật khẩu xác nhận không khớp', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast({ title: 'Đổi mật khẩu thất bại', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Đổi mật khẩu thành công 🎉', description: 'Đăng nhập lại bằng mật khẩu mới nhé.' });
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!readySession) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Đang xác thực link đặt lại mật khẩu...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Đặt lại mật khẩu</title></Helmet>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold">Đặt mật khẩu mới</h1>
        <p className="mt-2 text-sm text-muted-foreground">Nhập mật khẩu mới cho tài khoản của bạn.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu mới</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Đổi mật khẩu
          </Button>
        </form>
      </div>
    </>
  );
};

export default ResetPasswordPage;
