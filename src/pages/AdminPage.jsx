import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function AdminPage() {
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    unassigned: 0,
    assigned: 0,
    complete: 0,
  });

  useEffect(() => {
    fetchStats();
    fetchUpcoming();
  }, []);

  async function fetchStats() {
    const { data } = await supabase.from('bookings').select('status');
    if (data) {
      setStats({
        total: data.length,
        unassigned: data.filter((b) => b.status === 'unassigned').length,
        assigned: data.filter((b) => b.status === 'assigned').length,
        complete: data.filter((b) => b.status === 'complete').length,
      });
    }
  }

  async function fetchUpcoming() {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'unassigned')
      .order('date', { ascending: true });
    if (!err) setBookings(data);
    setLoading(false);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (search === '') {
      fetchUpcoming();
      return;
    }
    if (!/^BRN\d{5}$/.test(search)) {
      setError('Invalid format — must be like BRN00001');
      setBookings([]);
      return;
    }
    setError('');
    setLoading(true);
    const { data, error: err } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_ref', search);
    if (!err) {
      setBookings(data);
      if (data.length === 0) setError('No booking found with that reference');
    }
    setLoading(false);
  }

  async function assignBooking(ref) {
    const { error: err } = await supabase
      .from('bookings')
      .update({ status: 'assigned' })
      .eq('booking_ref', ref);
    if (!err) {
      setMessage(`Booking ${ref} has been assigned!`);
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_ref === ref ? { ...b, status: 'assigned' } : b
        )
      );
      fetchStats();
      setTimeout(() => setMessage(''), 3000);
    }
  }

  async function deleteBooking(ref) {
    if (!window.confirm(`Delete booking ${ref}? This cannot be undone.`))
      return;
    const { error: err } = await supabase
      .from('bookings')
      .delete()
      .eq('booking_ref', ref);
    if (!err) {
      setMessage(`Booking ${ref} deleted.`);
      setBookings((prev) => prev.filter((b) => b.booking_ref !== ref));
      fetchStats();
      setTimeout(() => setMessage(''), 3000);
    }
  }

  return (
    <div className="page">
      {/* Stats cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {[
          { label: 'Total bookings', value: stats.total, color: '#4f46e5' },
          { label: 'Unassigned', value: stats.unassigned, color: '#d97706' },
          { label: 'Assigned', value: stats.assigned, color: '#2563eb' },
          { label: 'Complete', value: stats.complete, color: '#16a34a' },
        ].map((s) => (
          <div
            key={s.label}
            className="card"
            style={{ textAlign: 'center', padding: '1rem' }}
          >
            <div
              style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#777', marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card">
        <h2>Search bookings</h2>
        <form
          onSubmit={handleSearch}
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}
        >
          <div style={{ flex: 1 }}>
            <label>
              Booking reference (leave empty to show all unassigned)
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              placeholder="e.g. BRN00001"
            />
          </div>
          <button className="btn btn-primary">Search</button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearch('');
              fetchUpcoming();
              setError('');
            }}
          >
            Clear
          </button>
        </form>
        {error && (
          <div className="msg-error" style={{ marginTop: '0.75rem' }}>
            {error}
          </div>
        )}
        {message && (
          <div className="msg-success" style={{ marginTop: '0.75rem' }}>
            {message}
          </div>
        )}
      </div>

      {/* Results table */}
      <div className="card">
        <h2>
          {search ? 'Search results' : 'Unassigned bookings'}
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 400,
              color: '#888',
              marginLeft: 8,
            }}
          >
            {bookings.length} record{bookings.length !== 1 ? 's' : ''}
          </span>
        </h2>

        {loading ? (
          <div style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
            Loading...
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
            No bookings found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Pickup address</th>
                  <th>Destination</th>
                  <th>Date & time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.booking_ref}>
                    <td>
                      <strong>{b.booking_ref}</strong>
                    </td>
                    <td>{b.cname}</td>
                    <td>{b.phone}</td>
                    <td>
                      {[b.unumber, b.snumber, b.stname, b.sbname]
                        .filter(Boolean)
                        .join(' ')}
                    </td>
                    <td>{b.dsbname || '—'}</td>
                    <td>
                      {b.date} {b.time}
                    </td>
                    <td>
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
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {b.status === 'unassigned' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => assignBooking(b.booking_ref)}
                          >
                            Assign
                          </button>
                        )}
                        <button
                          className="btn btn-sm"
                          style={{ background: '#fee2e2', color: '#dc2626' }}
                          onClick={() => deleteBooking(b.booking_ref)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
