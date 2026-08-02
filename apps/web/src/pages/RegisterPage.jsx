import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RegisterPage = () => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'Mật khẩu quá ngắn', description: 'Mật khẩu cần ít nhất 6 ký tự.', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Mật khẩu xác nhận không khớp', description: 'Vui lòng nhập lại cho khớp với mật khẩu ở trên.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    // emailRedirectTo: dùng đúng domain đang chạy (localhost lúc dev, domain
    // thật lúc đã deploy) để link xác nhận trong email luôn trỏ đúng chỗ.
    const { error } = await signUp({
      email,
      password,
      fullName,
      phone,
      emailRedirectTo: `${window.location.origin}/login`,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: 'Đăng ký thất bại',
        description: error.message === 'User already registered'
          ? 'Email này đã được đăng ký.'
          : error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Tạo tài khoản thành công 🎉',
      description: 'Kiểm tra email để xác nhận tài khoản, sau đó quay lại đăng nhập nhé.',
    });
    navigate('/login');
  };

  return (
    <>
      <Helmet><title>Đăng ký</title></Helmet>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <h1 className="font-display text-3xl font-bold">Tạo tài khoản</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary hover:underline">Đăng nhập</Link>
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại <span className="text-muted-foreground font-normal">(không bắt buộc)</span></Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Đăng ký
          </Button>
        </form>
      </div>
    </>
  );
};

export default RegisterPage;
