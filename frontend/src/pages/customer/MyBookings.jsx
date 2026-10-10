import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../../components/CustomerNavbar';
import api from '../../services/api';
import { Ticket, ArrowRight, Calendar, AlertCircle } from 'lucide-react';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data.content || []);
    } catch (err) {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerNavbar />

      <main style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem', flex: 1, width: '100%' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
          My Booking History
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading bookings...
          </div>
        ) : bookings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bookings.map((b) => (
              <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>PNR: {b.pnr}</span>
                    <span className={`badge ${b.status === 'CONFIRMED' ? 'badge-confirmed' : 'badge-cancelled'}`}>
                      {b.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {b.origin} → {b.destination} on {new Date(b.departureTime).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Seats: {b.seats?.map(s => s.seatNumber).join(', ')} · Total: ₹{b.totalAmount}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/ticket/${b.id}`)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
                >
                  View Ticket <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Ticket size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Bookings Yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              You haven't made any bus bookings yet. Find a trip to get started!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
