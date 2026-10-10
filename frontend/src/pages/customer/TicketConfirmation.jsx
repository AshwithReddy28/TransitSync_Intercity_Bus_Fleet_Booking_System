import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerNavbar from '../../components/CustomerNavbar';
import api from '../../services/api';
import { Ticket, Bus, Calendar, Printer, XCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function TicketConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      setBooking(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve ticket information.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking? Refund policy will be automatically applied.')) {
      return;
    }

    setCancelling(true);
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      setBooking(res.data);
      alert('Booking cancelled successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CustomerNavbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading ticket details...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CustomerNavbar />
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--danger)' }}>
          {error || 'Booking not found'}
        </div>
      </div>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9' }}>
      <CustomerNavbar />

      <main style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem', flex: 1, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('/my-bookings')}
            style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={16} /> Back to My Bookings
          </button>

          <button
            onClick={() => window.print()}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
          >
            <Printer size={16} /> Print Ticket
          </button>
        </div>

        {/* Printable Ticket Card */}
        <div className="card" style={{ padding: '2rem', border: '2px solid #cbd5e1' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border)', paddingBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                TransitSync Express
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Official E-Ticket & Boarding Pass
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${isConfirmed ? 'badge-confirmed' : 'badge-cancelled'}`}>
                {booking.status}
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.35rem' }}>
                PNR: {booking.pnr}
              </div>
            </div>
          </div>

          {/* Route & Schedule */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>JOURNEY ROUTE</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.2rem' }}>
                {booking.origin} → {booking.destination}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Coach: {booking.coachTypeName} ({booking.busRegistration})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEPARTURE TIME</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
                {new Date(booking.departureTime).toLocaleString()}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PASSENGER CONTACT</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>{booking.customerName}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{booking.customerEmail}</div>
            </div>
          </div>

          {/* Reserved Seats & Passenger Names */}
          <div style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Reserved Passengers & Seat Numbers
            </h4>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Seat Number</th>
                  <th style={{ padding: '0.5rem' }}>Passenger Name</th>
                  <th style={{ padding: '0.5rem' }}>Age / Gender</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Seat Fare</th>
                </tr>
              </thead>
              <tbody>
                {booking.seats?.map((seat) => (
                  <tr key={seat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Seat {seat.seatNumber}
                    </td>
                    <td style={{ padding: '0.65rem' }}>{seat.passengerName}</td>
                    <td style={{ padding: '0.65rem' }}>{seat.passengerAge} yrs / {seat.passengerGender}</td>
                    <td style={{ padding: '0.65rem', textAlign: 'right' }}>₹{seat.fare}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment & Refund Breakup */}
          <div style={{ padding: '1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PAYMENT RECORD</div>
              {booking.payments?.map(p => (
                <div key={p.id} style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Method: {p.paymentMethod} · Ref: {p.transactionReference}
                </div>
              ))}
            </div>

            <div style={{ minWidth: '220px', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <span>Base Fare:</span>
                <span>₹{booking.baseFareTotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <span>Taxes & Fees:</span>
                <span>₹{booking.taxAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: '0.35rem' }}>
                <span>Total Paid:</span>
                <span style={{ color: 'var(--primary)' }}>₹{booking.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Refund Details if Cancelled */}
          {!isConfirmed && booking.refunds?.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.9rem' }}>
                Cancellation & Refund Summary
              </div>
              {booking.refunds.map(r => (
                <div key={r.id} style={{ fontSize: '0.85rem', color: '#991b1b', marginTop: '0.25rem' }}>
                  Refund of ₹{r.refundAmount} ({r.refundPercentage}%) processed ({r.hoursBeforeDeparture} hours prior to departure).
                </div>
              ))}
            </div>
          )}

          {/* Cancellation Action */}
          {isConfirmed && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <XCircle size={16} />
                {cancelling ? 'Processing...' : 'Cancel Booking'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
