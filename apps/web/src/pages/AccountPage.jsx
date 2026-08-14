import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, User, MapPin, Trash2, Plus, PackageSearch, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getProvinces, getDistricts, getWards } from '@/lib/vnAddress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

const AddAddressForm = ({ userId, onAdded, onCancel }) => {
  const { toast } = useToast();
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [cityCode, setCityCode] = useState(''); const [cityName, setCityName] = useState('');
  const [districtCode, setDistrictCode] = useState(''); const [districtName, setDistrictName] = useState('');
  const [wardCode, setWardCode] = useState(''); const [wardName, setWardName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { getProvinces().then(setProvinces); }, []);

  const onSelectCity = async (code) => {
    setCityCode(code);
    setCityName(provinces.find((p) => String(p.code) === code)?.name ?? '');
    setDistrictCode(''); setDistrictName(''); setWardCode(''); setWardName(''); setWards([]);
    setDistricts(await getDistricts(code));
  };
  const onSelectDistrict = async (code) => {
    setDistrictCode(code);
    setDistrictName(districts.find((d) => String(d.code) === code)?.name ?? '');
    setWardCode(''); setWardName('');
    setWards(await getWards(code));
  };
  const onSelectWard = (code) => {
    setWardCode(code);
    setWardName(wards.find((w) => String(w.code) === code)?.name ?? '');
  };

  const save = async (e) => {
    e.preventDefault();
    if (!cityName || !districtName || !wardName || !streetAddress.trim()) {
      toast({ title: 'Vui lòng điền đủ thông tin địa chỉ', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('customer_addresses').insert({
      customer_id: userId,
      label: label || null,
      city: cityName,
      district: districtName,
      ward: wardName,
      street_address: streetAddress.trim(),
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Thêm địa chỉ thất bại', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Đã thêm địa chỉ' });
    onAdded();
  };

  return (
    <form onSubmit={save} className="space-y-3 rounded-md border border-border p-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Tên gợi nhớ (không bắt buộc)</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nhà riêng, Công ty..." />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tỉnh / Thành phố</Label>
          <Select value={cityCode} onValueChange={onSelectCity}>
            <SelectTrigger><SelectValue placeholder="Chọn Tỉnh/Thành" /></SelectTrigger>
            <SelectContent>{provinces.map((p) => <SelectItem key={p.code} value={String(p.code)}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Quận / Huyện</Label>
          <Select value={districtCode} onValueChange={onSelectDistrict} disabled={!cityCode}>
            <SelectTrigger><SelectValue placeholder="Chọn Quận/Huyện" /></SelectTrigger>
            <SelectContent>{districts.map((d) => <SelectItem key={d.code} value={String(d.code)}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Phường / Xã</Label>
          <Select value={wardCode} onValueChange={onSelectWard} disabled={!districtCode}>
            <SelectTrigger><SelectValue placeholder="Chọn Phường/Xã" /></SelectTrigger>
            <SelectContent>{wards.map((w) => <SelectItem key={w.code} value={String(w.code)}>{w.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Số nhà, tên đường</Label>
        <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Ví dụ: 349 đường Tân Túc" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu địa chỉ</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Huỷ</Button>
      </div>
    </form>
  );
};

const AccountPage = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    setLoadingAddresses(true);
    const { data } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    setAddresses(data ?? []);
    setLoadingAddresses(false);
  }, [user]);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', user.id);
    setSavingProfile(false);
    if (error) {
      toast({ title: 'Cập nhật thất bại', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Đã cập nhật thông tin' });
  };

  const deleteAddress = async (id) => {
    const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
    if (error) {
      toast({ title: 'Xoá địa chỉ thất bại', description: error.message, variant: 'destructive' });
      return;
    }
    setAddresses((list) => list.filter((a) => a.id !== id));
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${sessionData?.session?.access_token}`,
        },
      });
      if (!res.ok) throw new Error('Xoá tài khoản thất bại, vui lòng thử lại.');

      toast({ title: 'Đã xoá tài khoản' });
      await signOut();
      navigate('/');
    } catch (error) {
      toast({ title: 'Có lỗi xảy ra', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  if (authLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <p className="mt-2 text-muted-foreground">Đăng nhập để xem trang cá nhân của bạn.</p>
        <Button asChild className="mt-6"><Link to="/login">Đăng nhập</Link></Button>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Tài khoản của tôi — BÁO LỐP</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Tài khoản của tôi</h1>

        <section className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><User className="h-4 w-4" /> Thông tin cá nhân</h2>
          <form onSubmit={saveProfile} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="opacity-60" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </form>
        </section>

        <section className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><MapPin className="h-4 w-4" /> Sổ địa chỉ</h2>
            {!showAddForm && (
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}><Plus className="mr-1 h-3.5 w-3.5" /> Thêm địa chỉ</Button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {loadingAddresses ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : addresses.length === 0 && !showAddForm ? (
              <p className="text-sm text-muted-foreground">Bạn chưa lưu địa chỉ nào.</p>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3 text-sm">
                  <div>
                    {addr.label && <p className="font-medium">{addr.label}</p>}
                    <p className="text-muted-foreground">{addr.street_address}, {addr.ward}, {addr.district}, {addr.city}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="shrink-0 text-destructive hover:text-destructive" onClick={() => deleteAddress(addr.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}

            {showAddForm && (
              <AddAddressForm
                userId={user.id}
                onAdded={() => { setShowAddForm(false); loadAddresses(); }}
                onCancel={() => setShowAddForm(false)}
              />
            )}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><PackageSearch className="h-4 w-4" /> Đơn hàng</h2>
          <p className="mt-2 text-sm text-muted-foreground">Xem tiến trình và lịch sử các đơn hàng bạn đã đặt.</p>
          <Button asChild size="sm" className="mt-3"><Link to="/account/orders">Xem đơn hàng của tôi</Link></Button>
        </section>

        <section className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-destructive"><ShieldAlert className="h-4 w-4" /> Xoá tài khoản</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Xoá vĩnh viễn tài khoản và toàn bộ thông tin cá nhân, sổ địa chỉ của bạn. Đơn hàng đã đặt vẫn được giữ lại cho mục đích lưu trữ nhưng sẽ không còn gắn với tài khoản. Không thể hoàn tác.
          </p>
          <Button variant="destructive" size="sm" className="mt-3" onClick={() => setConfirmDeleteOpen(true)}>Xoá tài khoản của tôi</Button>
        </section>
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá tài khoản vĩnh viễn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bạn sẽ không thể đăng nhập lại bằng tài khoản này nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xoá vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AccountPage;
