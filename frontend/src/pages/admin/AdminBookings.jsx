import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bookings');
      setBookings(res.data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOnBehalf = async (id) => {
    if (!window.confirm('Cancel this booking on behalf of the customer and trigger refund calculation?')) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Passenger Bookings & Tickets</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Real-time passenger roster, seat reservations, and cancellation oversight
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading bookings...</div>
        ) : bookings.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem' }}>PNR</th>
                <th style={{ padding: '0.75rem' }}>Customer</th>
                <th style={{ padding: '0.75rem' }}>Trip Route</th>
                <th style={{ padding: '0.75rem' }}>Seats</th>
                <th style={{ padding: '0.75rem' }}>Total Paid</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 800 }}>{b.pnr}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div>{b.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.customerEmail}</div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div>{b.origin} → {b.destination}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(b.departureTime).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {b.seats?.map(s => s.seatNumber).join(', ')}
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>₹{b.totalAmount}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancelOnBehalf(b.id)}
                        className="btn-danger"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                      >
                        Cancel & Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
            No bookings recorded yet
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
