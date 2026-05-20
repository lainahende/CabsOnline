import { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../supabase';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ onSelect, onAddress }) {
  useMapEvents({
    async click(e) {
      onSelect(e.latlng);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data && data.address) {
          onAddress(data.address, data.display_name);
        }
      } catch {
        // silently fail, user can fill in manually
      }
    },
  });
  return null;
}

function FlyTo({ position }) {
  const map = useMap();
  if (position) map.flyTo(position, 15);
  return null;
}

function getDefaultDateTime() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const date = `${day}/${month}/${year}`;
  const time = now.toTimeString().slice(0, 5);
  return { date, time };
}

async function generateRef() {
  const { data } = await supabase
    .from('bookings')
    .select('booking_ref')
    .order('booking_ref', { ascending: false })
    .limit(1);
  if (data && data.length > 0) {
    const num = parseInt(data[0].booking_ref.slice(3)) + 1;
    return 'BRN' + String(num).padStart(5, '0');
  }
  return 'BRN00001';
}

export default function BookingPage() {
  const { date, time } = getDefaultDateTime();
  const [form, setForm] = useState({
    cname: '',
    phone: '',
    unumber: '',
    snumber: '',
    stname: '',
    sbname: '',
    dsbname: '',
    date,
    time,
  });
  const [marker, setMarker] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [errors, setErrors] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function searchAddress(e) {
    e.preventDefault();
    if (!addressSearch.trim()) return;
    setAddressLoading(true);
    setAddressError('');
    try {
      const query = encodeURIComponent(
        addressSearch + ', Auckland, New Zealand'
      );
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length === 0) {
        setAddressError('Address not found — try a different search');
        setAddressLoading(false);
        return;
      }
      const { lat, lon, address } = data[0];
      const position = { lat: parseFloat(lat), lng: parseFloat(lon) };
      setMarker(position);
      setFlyTo(position);

      // Use structured address fields from Nominatim
      setForm((f) => ({
        ...f,
        snumber: address.house_number || f.snumber,
        stname: address.road || f.stname,
        sbname:
          address.suburb ||
          address.neighbourhood ||
          address.city_district ||
          f.sbname,
      }));
    } catch {
      setAddressError('Search failed — check your connection');
    }
    setAddressLoading(false);
  }
  function validate() {
    const errs = [];
    if (!form.cname.trim()) errs.push('Name is required');
    if (!/^\d{10,12}$/.test(form.phone))
      errs.push('Phone must be 10–12 digits');
    if (!form.snumber.trim()) errs.push('Street number is required');
    if (!form.stname.trim()) errs.push('Street name is required');
    if (!form.date) errs.push('Date is required');
    if (!form.time) errs.push('Time is required');
    const [d, m, y] = form.date.split('/');
    const selected = new Date(`${y}-${m}-${d}T${form.time}`);
    if (selected < new Date())
      errs.push('Pickup date/time cannot be in the past');
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setLoading(true);
    try {
      const booking_ref = await generateRef();
      const { error } = await supabase.from('bookings').insert([
        {
          booking_ref,
          cname: form.cname,
          phone: form.phone,
          unumber: form.unumber,
          snumber: form.snumber,
          stname: form.stname,
          sbname: form.sbname,
          dsbname: form.dsbname,
          date: form.date,
          time: form.time,
          status: 'unassigned',
        },
      ]);
      if (error) throw error;
      setConfirmation({ ref: booking_ref, date: form.date, time: form.time });
      setForm({
        cname: '',
        phone: '',
        unumber: '',
        snumber: '',
        stname: '',
        sbname: '',
        dsbname: '',
        date,
        time,
      });
      setMarker(null);
      setFlyTo(null);
      setAddressSearch('');
    } catch (err) {
      setErrors(['Booking failed: ' + err.message]);
    }
    setLoading(false);
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Book a Cab</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div>
              <label>Customer name</label>
              <input
                name="cname"
                value={form.cname}
                onChange={handleChange}
                placeholder="Full name"
              />
            </div>
            <div>
              <label>Phone number</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10–12 digits"
              />
            </div>
            <div>
              <label>Unit number (optional)</label>
              <input
                name="unumber"
                value={form.unumber}
                onChange={handleChange}
                placeholder="Unit"
              />
            </div>
            <div>
              <label>Street number</label>
              <input
                name="snumber"
                value={form.snumber}
                onChange={handleChange}
                placeholder="Street number"
              />
            </div>
            <div>
              <label>Street name</label>
              <input
                name="stname"
                value={form.stname}
                onChange={handleChange}
                placeholder="Street name"
              />
            </div>
            <div>
              <label>Suburb (optional)</label>
              <input
                name="sbname"
                value={form.sbname}
                onChange={handleChange}
                placeholder="Suburb"
              />
            </div>
            <div>
              <label>Destination suburb (optional)</label>
              <input
                name="dsbname"
                value={form.dsbname}
                onChange={handleChange}
                placeholder="Destination"
              />
            </div>
            <div>
              <label>Pickup date (dd/mm/yyyy)</label>
              <input
                name="date"
                value={form.date}
                onChange={handleChange}
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div>
              <label>Pickup time (HH:MM)</label>
              <input
                name="time"
                value={form.time}
                onChange={handleChange}
                placeholder="HH:MM"
              />
            </div>
          </div>

          {/* Map address search */}
          <label style={{ marginTop: '1.5rem' }}>
            Search for your pickup location
          </label>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: 6,
              marginBottom: 8,
            }}
          >
            <input
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              placeholder="e.g. 1 Queen Street, Auckland"
              onKeyDown={(e) => e.key === 'Enter' && searchAddress(e)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={searchAddress}
              disabled={addressLoading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {addressLoading ? 'Searching...' : 'Find on map'}
            </button>
          </div>
          {addressError && (
            <p
              style={{ fontSize: '0.82rem', color: '#dc2626', marginBottom: 6 }}
            >
              {addressError}
            </p>
          )}
          <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 8 }}>
            Or click directly on the map to drop a pin
          </p>

          <div
            style={{
              height: 300,
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid #ddd',
            }}
          >
            <MapContainer
              center={[-36.8485, 174.7633]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker
                onSelect={(pos) => {
                  setMarker(pos);
                  setFlyTo(null);
                }}
                onAddress={(address, displayName) => {
                  setAddressSearch(displayName);
                  setForm((f) => ({
                    ...f,
                    snumber: address.house_number || f.snumber,
                    stname: address.road || f.stname,
                    sbname:
                      address.suburb ||
                      address.neighbourhood ||
                      address.city_district ||
                      f.sbname,
                  }));
                }}
              />
              <FlyTo position={flyTo} />
              {marker && <Marker position={marker} />}
            </MapContainer>
          </div>

          {marker && (
            <p style={{ fontSize: '0.82rem', color: '#555', marginTop: 6 }}>
              📍 Pin set at {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
            </p>
          )}

          {errors.length > 0 && (
            <div className="msg-error">
              {errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ marginTop: '1.2rem' }}
            disabled={loading}
          >
            {loading ? 'Booking...' : 'Confirm booking'}
          </button>
        </form>

        {confirmation && (
          <div className="msg-success">
            <strong>Thank you for your booking!</strong>
            <br />
            Booking reference number: {confirmation.ref}
            <br />
            Pickup time: {confirmation.time}
            <br />
            Pickup date: {confirmation.date}
          </div>
        )}
      </div>
    </div>
  );
}
