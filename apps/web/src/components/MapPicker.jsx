import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, LocateFixed, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Leaflet + bundler cần trỏ lại icon marker mặc định thủ công.
const markerIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const HCMC_CENTER = [10.7769, 106.7009];

async function reverseGeocode(lat, lng) {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`);
  if (!res.ok) throw new Error('Không thể xác định địa chỉ.');
  const data = await res.json();
  return data.display_name;
}

async function searchAddress(query) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&accept-language=vi&limit=5&q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Không tìm kiếm được.');
  return res.json();
}

const ClickHandler = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapPicker = ({ open, onOpenChange, onConfirm }) => {
  const [position, setPosition] = useState(null); // {lat, lng}
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mapKey, setMapKey] = useState(0); // ép MapContainer render lại khi mở dialog

  useEffect(() => {
    if (open) setMapKey((k) => k + 1);
  }, [open]);

  const pickPoint = useCallback(async (lat, lng) => {
    setPosition({ lat, lng });
    setLoadingAddress(true);
    try {
      const display = await reverseGeocode(lat, lng);
      setAddress(display);
    } catch {
      setAddress('');
    } finally {
      setLoadingAddress(false);
    }
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => pickPoint(pos.coords.latitude, pos.coords.longitude),
      () => {}
    );
  };

  const onSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await searchAddress(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const pickSearchResult = (r) => {
    setSearchResults([]);
    setQuery('');
    pickPoint(Number(r.lat), Number(r.lon));
  };

  const confirm = () => {
    if (!position) return;
    onConfirm({ lat: position.lat, lng: position.lng, address });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chọn vị trí giao hàng trên bản đồ</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSearch} className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm địa chỉ, ví dụ: 349 Tân Túc, Bình Chánh" />
          <Button type="submit" size="icon" variant="outline" disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <Button type="button" size="icon" variant="outline" onClick={useMyLocation} title="Dùng vị trí hiện tại">
            <LocateFixed className="h-4 w-4" />
          </Button>
        </form>

        {searchResults.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded-md border border-border">
            {searchResults.map((r) => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => pickSearchResult(r)}
                className="block w-full border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-secondary"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}

        <div className="h-72 w-full overflow-hidden rounded-md border border-border">
          <MapContainer key={mapKey} center={position ? [position.lat, position.lng] : HCMC_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onPick={pickPoint} />
            {position && <Marker position={[position.lat, position.lng]} icon={markerIcon} />}
          </MapContainer>
        </div>
        <p className="text-xs text-muted-foreground">Bấm vào bản đồ để đặt ghim vị trí giao hàng.</p>

        <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 p-3 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {loadingAddress ? (
            <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang xác định địa chỉ...</span>
          ) : (
            <span>{address || 'Chưa chọn vị trí nào.'}</span>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button type="button" onClick={confirm} disabled={!position || loadingAddress}>Dùng vị trí này</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapPicker;
