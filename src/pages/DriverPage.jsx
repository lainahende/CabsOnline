import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function DriverPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('assigned');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  async function fetchBookings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', filter)
      .order('date', { ascending: true });
    if (!error) setBookings(data);
    setLoading(false);
  }

  async function markComplete(ref) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'complete' })
      .eq('booking_ref', ref);
    if (!error) {
      setMessage(`Booking ${ref} marked as complete!`);
      setBookings((prev) => prev.filter((b) => b.booking_ref !== ref));
      setTimeout(() => setMessage(''), 3000);
    }
  }

  async function claimBooking(ref) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'assigned' })
      .eq('booking_ref', ref);
    if (!error) {
      setMessage(`Booking ${ref} claimed successfully!`);
      setBookings((prev) => prev.filter((b) => b.booking_ref !== ref));
      setTimeout(() => setMessage(''), 3000);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Driver panel</h2>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
          {['unassigned', 'assigned', 'complete'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="btn"
              style={{
                flex: 1,
                background: filter === s ? '#4f46e5' : '#f0f0f0',
                color: filter === s ? '#fff' : '#333',
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchBookings}
          style={{ marginBottom: '1rem' }}
        >
          ↻ Refresh
        </button>

        {message && <div className="msg-success">{message}</div>}
      </div>

      {loading ? (
        <div className="card" style={{ color: '#888', textAlign: 'center' }}>
          Loading bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ color: '#888', textAlign: 'center' }}>
          No {filter} bookings found
        </div>
      ) : (
        bookings.map((b) => (
          <div
            key={b.booking_ref}
            className="card"
            style={{ marginBottom: '0.75rem' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <strong style={{ fontSize: '1rem' }}>{b.booking_ref}</strong>
                  <span
                    className={`badge ${
                      b.status === 'unassigned'
                        ? 'badge-yellow'
                        : b.status === 'assigned'
                        ? 'badge-blue'
                        : 'badge-green'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.88rem',
                    color: '#555',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span>
                    👤 {b.cname} — {b.phone}
                  </span>
                  <span>
                    📍{' '}
                    {[b.unumber, b.snumber, b.stname, b.sbname]
                      .filter(Boolean)
                      .join(' ')}
                  </span>
                  {b.dsbname && <span>🏁 Destination: {b.dsbname}</span>}
                  <span>
                    🕐 {b.date} at {b.time}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginLeft: 16,
                }}
              >
                {b.status === 'unassigned' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => claimBooking(b.booking_ref)}
                  >
                    Claim
                  </button>
                )}
                {b.status === 'assigned' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => markComplete(b.booking_ref)}
                  >
                    Mark complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
