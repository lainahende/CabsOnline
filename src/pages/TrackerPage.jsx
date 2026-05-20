import { useState } from 'react';
import { supabase } from '../supabase';

export default function TrackerPage() {
  const [ref, setRef] = useState('');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!/^BRN\d{5}$/.test(ref)) {
      setError('Invalid format — must be like BRN00001');
      setBooking(null);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_ref', ref)
        .single();
      if (err || !data) {
        setError('No booking found with that reference number');
        setBooking(null);
      } else {
        setBooking(data);
      }
    } catch (err) {
      setError('Something went wrong: ' + err.message);
    }
    setLoading(false);
  }

  function getStatusStep(status) {
    if (status === 'unassigned') return 1;
    if (status === 'assigned') return 2;
    if (status === 'complete') return 3;
    return 1;
  }

  const steps = ['Booking received', 'Driver assigned', 'Complete'];

  return (
    <div className="page">
      <div className="card">
        <h2>Track your booking</h2>
        <form
          onSubmit={handleSearch}
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}
        >
          <div style={{ flex: 1 }}>
            <label>Booking reference number</label>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase())}
              placeholder="e.g. BRN00001"
            />
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && <div className="msg-error">{error}</div>}
      </div>

      {booking && (
        <>
          <div className="card">
            <h2>Booking status</h2>

            {/* Status stepper */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              {steps.map((step, i) => {
                const stepNum = i + 1;
                const active = getStatusStep(booking.status) >= stepNum;
                const current = getStatusStep(booking.status) === stepNum;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: i < steps.length - 1 ? 1 : 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: active ? '#4f46e5' : '#e5e5e5',
                          color: active ? '#fff' : '#999',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          border: current ? '3px solid #818cf8' : 'none',
                          transition: 'all 0.3s',
                        }}
                      >
                        {active && getStatusStep(booking.status) > stepNum
                          ? '✓'
                          : stepNum}
                      </div>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: active ? '#4f46e5' : '#999',
                          fontWeight: active ? 500 : 400,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {step}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          height: 3,
                          margin: '0 8px',
                          marginBottom: 22,
                          background:
                            getStatusStep(booking.status) > stepNum
                              ? '#4f46e5'
                              : '#e5e5e5',
                          transition: 'background 0.3s',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.9rem', color: '#555' }}>
                Current status:
              </span>
              <span
                className={`badge ${
                  booking.status === 'unassigned'
                    ? 'badge-yellow'
                    : booking.status === 'assigned'
                    ? 'badge-blue'
                    : 'badge-green'
                }`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          <div className="card">
            <h2>Booking details</h2>
            <table>
              <tbody>
                <tr>
                  <td style={{ color: '#555', width: 180 }}>Reference</td>
                  <td>
                    <strong>{booking.booking_ref}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#555' }}>Name</td>
                  <td>{booking.cname}</td>
                </tr>
                <tr>
                  <td style={{ color: '#555' }}>Phone</td>
                  <td>{booking.phone}</td>
                </tr>
                <tr>
                  <td style={{ color: '#555' }}>Pickup address</td>
                  <td>
                    {[
                      booking.unumber,
                      booking.snumber,
                      booking.stname,
                      booking.sbname,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#555' }}>Destination</td>
                  <td>{booking.dsbname || '—'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#555' }}>Pickup date</td>
                  <td>{booking.date}</td>
                </tr>
                <tr>
                  <td style={{ color: '#555' }}>Pickup time</td>
                  <td>{booking.time}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
