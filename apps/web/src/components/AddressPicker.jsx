import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, MapPin, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getProvinces, getDistricts, getWards } from '@/lib/vnAddress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';

// value: null (chưa chọn) hoặc { city, district, ward, streetAddress, saveNew }
const AddressPicker = ({ userId, onChange }) => {
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [mode, setMode] = useState('new'); // 'new' | id của địa chỉ đã lưu

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [cityCode, setCityCode] = useState('');
  const [cityName, setCityName] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [wardName, setWardName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [saveNew, setSaveNew] = useState(true);

  // Tải sổ địa chỉ đã lưu của khách
  useEffect(() => {
    if (!userId) { setLoadingSaved(false); return; }
    (async () => {
      const { data } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      setSavedAddresses(data ?? []);
      if (data && data.length > 0) {
        setMode(data[0].id);
      }
      setLoadingSaved(false);
    })();
  }, [userId]);

  // Tải danh sách tỉnh/thành 1 lần
  useEffect(() => {
    (async () => {
      try {
        setProvinces(await getProvinces());
      } finally {
        setLoadingProvinces(false);
      }
    })();
  }, []);

  const onSelectCity = useCallback(async (code) => {
    setCityCode(code);
    const p = provinces.find((x) => String(x.code) === code);
    setCityName(p?.name ?? '');
    setDistrictCode(''); setDistrictName('');
    setWardCode(''); setWardName('');
    setWards([]);
    setLoadingDistricts(true);
    try {
      setDistricts(await getDistricts(code));
    } finally {
      setLoadingDistricts(false);
    }
  }, [provinces]);

  const onSelectDistrict = useCallback(async (code) => {
    setDistrictCode(code);
    const d = districts.find((x) => String(x.code) === code);
    setDistrictName(d?.name ?? '');
    setWardCode(''); setWardName('');
    setLoadingWards(true);
    try {
      setWards(await getWards(code));
    } finally {
      setLoadingWards(false);
    }
  }, [districts]);

  const onSelectWard = useCallback((code) => {
    setWardCode(code);
    const w = wards.find((x) => String(x.code) === code);
    setWardName(w?.name ?? '');
  }, [wards]);

  // Báo lên component cha mỗi khi dữ liệu thay đổi
  useEffect(() => {
    if (mode !== 'new') {
      const addr = savedAddresses.find((a) => a.id === mode);
      if (addr) {
        onChange({
          city: addr.city, district: addr.district, ward: addr.ward,
          streetAddress: addr.street_address, saveNew: false, existingId: addr.id,
        });
      }
      return;
    }
    if (cityName && districtName && wardName && streetAddress.trim()) {
      onChange({ city: cityName, district: districtName, ward: wardName, streetAddress: streetAddress.trim(), saveNew });
    } else {
      onChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cityName, districtName, wardName, streetAddress, saveNew, savedAddresses]);

  return (
    <div className="space-y-4">
      {loadingSaved ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải sổ địa chỉ...</div>
      ) : savedAddresses.length > 0 && (
        <div className="space-y-2">
          {savedAddresses.map((addr) => (
            <label
              key={addr.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors ${mode === addr.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
            >
              <input type="radio" name="addressMode" className="mt-1 accent-primary" checked={mode === addr.id} onChange={() => setMode(addr.id)} />
              <div className="flex-1">
                {addr.label && <p className="font-medium">{addr.label}</p>}
                <p className="text-muted-foreground">{addr.street_address}, {addr.ward}, {addr.district}, {addr.city}</p>
              </div>
              {mode === addr.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </label>
          ))}
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors ${mode === 'new' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
          >
            <input type="radio" name="addressMode" className="accent-primary" checked={mode === 'new'} onChange={() => setMode('new')} />
            <Plus className="h-4 w-4" /> Dùng địa chỉ khác
          </label>
        </div>
      )}

      {mode === 'new' && (
        <div className="space-y-3 rounded-md border border-border p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tỉnh / Thành phố</Label>
              <Select value={cityCode} onValueChange={onSelectCity} disabled={loadingProvinces}>
                <SelectTrigger><SelectValue placeholder={loadingProvinces ? 'Đang tải...' : 'Chọn Tỉnh/Thành'} /></SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => <SelectItem key={p.code} value={String(p.code)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quận / Huyện</Label>
              <Select value={districtCode} onValueChange={onSelectDistrict} disabled={!cityCode || loadingDistricts}>
                <SelectTrigger><SelectValue placeholder={loadingDistricts ? 'Đang tải...' : 'Chọn Quận/Huyện'} /></SelectTrigger>
                <SelectContent>
                  {districts.map((d) => <SelectItem key={d.code} value={String(d.code)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phường / Xã</Label>
              <Select value={wardCode} onValueChange={onSelectWard} disabled={!districtCode || loadingWards}>
                <SelectTrigger><SelectValue placeholder={loadingWards ? 'Đang tải...' : 'Chọn Phường/Xã'} /></SelectTrigger>
                <SelectContent>
                  {wards.map((w) => <SelectItem key={w.code} value={String(w.code)}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Số nhà, tên đường</Label>
            <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Ví dụ: 349 đường Tân Túc" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={saveNew} onCheckedChange={setSaveNew} />
            Lưu địa chỉ này cho lần đặt hàng sau
          </label>
        </div>
      )}

      {savedAddresses.length === 0 && !loadingSaved && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Bạn chưa có địa chỉ nào được lưu, điền địa chỉ mới bên dưới.</p>
      )}
    </div>
  );
};

export default AddressPicker;
