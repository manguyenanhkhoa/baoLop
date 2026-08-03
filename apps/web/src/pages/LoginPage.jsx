import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LoginPage = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from ?? '/';

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await signIn({ email, password });

    if (error) {
      setSubmitting(false);
      toast({
        title: 'Đăng nhập thất bại',
        description: error.message === 'Invalid login credentials'
          ? 'Email hoặc mật khẩu không đúng.'
          : error.message,
        variant: 'destructive',
      });
      return;
    }

    // Lấy ngay hồ sơ (tên, quyền admin) để hiện box chào mừng đúng vai trò,
    // không cần đợi AuthProvider tự cập nhật (tránh độ trễ/hiện sai).
    let fullName = '';
    let isAdmin = false;
    if (data?.user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, is_admin')
        .eq('id', data.user.id)
        .single();
      fullName = profile?.full_name ?? '';
      isAdmin = profile?.is_admin === true;
    }

    sessionStorage.setItem('welcomeBox', JSON.stringify({ fullName, isAdmin }));

    setSubmitting(false);
    navigate(isAdmin ? '/admin' : from, { replace: true });
  };

  return (
    <>
      <Helmet><title>Đăng nhập</title></Helmet>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <h1 className="font-display text-3xl font-bold">Đăng nhập</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary hover:underline">Đăng ký ngay</Link>
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Đăng nhập
          </Button>
        </form>
      </div>
    </>
  );
};

export default LoginPage;
