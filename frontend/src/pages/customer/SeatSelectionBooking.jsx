import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerNavbar from '../../components/CustomerNavbar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Bus, User, Check, ShieldAlert, ArrowLeft, Armchair } from 'lucide-react';

export default function SeatSelectionBooking() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [seatMap, setSeatMap] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers, setPassengers] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeDeck, setActiveDeck] = useState('LOWER');

  useEffect(() => {
    fetchSeatMap();
  }, [tripId]);

  const fetchSeatMap = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/trips/${tripId}/seat-map`);
      setSeatMap(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load seat layout');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status !== 'AVAILABLE') return;

    const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.seatNumber !== seat.seatNumber));
      const updatedPassengers = { ...passengers };
      delete updatedPassengers[seat.seatNumber];
      setPassengers(updatedPassengers);
    } else {
      if (selectedSeats.length >= (seatMap?.maxSeatsPerBooking || 6)) {
        alert(`You can select at most ${seatMap.maxSeatsPerBooking} seats per booking.`);
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
      setPassengers({
        ...passengers,
        [seat.seatNumber]: {
          seatNumber: seat.seatNumber,
          passengerName: user?.fullName || '',
          passengerAge: 25,
          passengerGender: 'MALE'
        }
      });
    }
  };

  const handlePassengerChange = (seatNumber, field, value) => {
    setPassengers(prev => ({
      ...prev,
      [seatNumber]: {
        ...prev[seatNumber],
        [field]: value
      }
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (selectedSeats.length === 0) {
      setError('Please select at least one seat.');
      return;
    }

    const passengerList = selectedSeats.map(s => passengers[s.seatNumber]);

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/bookings', {
        tripId: Number(tripId),
        passengers: passengerList,
        paymentMethod,
        idempotencyKey: `IDEMP-${tripId}-${Date.now()}`
      });

      navigate(`/ticket/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Some selected seats may have been taken.');
      // Refresh seat map on collision
      fetchSeatMap();
      setSelectedSeats([]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CustomerNavbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading live bus layout...</div>
      </div>
    );
  }

  // Calculate pricing breakdown
  const count = selectedSeats.length;
  const baseTotal = count * (seatMap?.baseFare || 0);
  const taxRate = seatMap?.taxRatePercent || 5.0;
  const taxTotal = (baseTotal * taxRate) / 100;
  const serviceFee = count > 0 ? (seatMap?.serviceFee || 25.0) : 0;
  const grandTotal = baseTotal + taxTotal + serviceFee;

  const seatsForCurrentDeck = seatMap?.seats.filter(s => s.deck === activeDeck) || [];
  const maxRow = Math.max(...seatsForCurrentDeck.map(s => s.rowNum), 1);
  const maxCol = Math.max(...seatsForCurrentDeck.map(s => s.colNum), 4);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      <CustomerNavbar />

      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem', flex: 1, width: '100%' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={16} /> Back to Search Results
        </button>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <ShieldAlert size={20} />
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Seat Map Visualizer */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Interactive Seat Layout</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {seatMap.coachTypeName} ({seatMap.decks > 1 ? 'Double Deck' : 'Single Deck'})
                </span>
              </div>

              {seatMap.decks > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveDeck('LOWER')}
                    className={activeDeck === 'LOWER' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    Lower Deck
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDeck('UPPER')}
                    className={activeDeck === 'UPPER' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    Upper Deck
                  </button>
                </div>
              )}
            </div>

            {/* Seat Map Legend */}
            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem', fontSize: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}></div>
                Available
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: 'var(--primary)' }}></div>
                Selected
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#e2e8f0', opacity: 0.6 }}></div>
                Booked
              </div>
            </div>

            {/* Realistic Bus Frame */}
            <div style={{
              background: '#f1f5f9',
              border: '2px solid #cbd5e1',
              borderRadius: '24px',
              padding: '1.5rem',
              maxWidth: '460px',
              margin: '0 auto',
              position: 'relative'
            }}>
              {/* Front Cabin / Steering Wheel */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '2px dashed #cbd5e1',
                paddingBottom: '0.75rem',
                marginBottom: '1.5rem',
                color: '#64748b',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Bus size={18} /> FRONT OF BUS
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  ☸ DRIVER
                </div>
              </div>

              {/* Grid of Seats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${maxCol}, 1fr)`,
                gap: '12px',
                justifyItems: 'center'
              }}>
                {Array.from({ length: maxRow }, (_, rIdx) => {
                  const row = rIdx + 1;
                  return Array.from({ length: maxCol }, (_, cIdx) => {
                    const col = cIdx + 1;
                    const seat = seatsForCurrentDeck.find(s => s.rowNum === row && s.colNum === col);

                    if (!seat) {
                      // Walkway / Aisle
                      return <div key={`empty-${row}-${col}`} style={{ width: '44px', height: '44px' }}></div>;
                    }

                    const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);
                    const isBooked = seat.status === 'BOOKED';

                    let bgColor = '#ffffff';
                    let textColor = '#1e293b';
                    let borderColor = '#94a3b8';

                    if (isBooked) {
                      bgColor = '#cbd5e1';
                      textColor = '#94a3b8';
                      borderColor = '#cbd5e1';
                    } else if (isSelected) {
                      bgColor = 'var(--primary)';
                      textColor = '#ffffff';
                      borderColor = 'var(--primary)';
                    }

                    return (
                      <button
                        key={seat.seatNumber}
                        type="button"
                        disabled={isBooked}
                        onClick={() => handleSeatClick(seat)}
                        title={`Seat ${seat.seatNumber} · ₹${seat.fare}`}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '8px',
                          border: `2px solid ${borderColor}`,
                          backgroundColor: bgColor,
                          color: textColor,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          boxShadow: isSelected ? '0 0 0 2px rgba(37, 99, 235, 0.3)' : 'var(--shadow-sm)',
                          transition: 'transform 0.1s ease',
                          transform: isSelected ? 'scale(1.05)' : 'none'
                        }}
                      >
                        <span>{seat.seatNumber}</span>
                      </button>
                    );
                  });
                })}
              </div>
            </div>
          </div>

          {/* Booking Summary & Passenger Details Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Booking Summary
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Selected Seats:</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  {selectedSeats.length > 0 ? (
                    selectedSeats.map(s => (
                      <span key={s.seatNumber} style={{
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}>
                        Seat {s.seatNumber}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Click on available seats on the map to select
                    </span>
                  )}
                </div>
              </div>

              {/* Fare Calculation Breakdown */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Base Fare ({count} seats × ₹{seatMap.baseFare})</span>
                  <span>₹{baseTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Taxes ({taxRate}%)</span>
                  <span>₹{taxTotal.toFixed(2)}</span>
                </div>
                {count > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Service Fee</span>
                    <span>₹{serviceFee.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                  <span>Grand Total</span>
                  <span style={{ color: 'var(--primary)' }}>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Passenger Forms */}
            {selectedSeats.length > 0 && (
              <form onSubmit={handleBookingSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Passenger Information
                </h3>

                {selectedSeats.map((seat) => (
                  <div key={seat.seatNumber} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                      Passenger for Seat {seat.seatNumber}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={passengers[seat.seatNumber]?.passengerName || ''}
                          onChange={(e) => handlePassengerChange(seat.seatNumber, 'passengerName', e.target.value)}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          required
                          min={1}
                          max={120}
                          placeholder="Age"
                          value={passengers[seat.seatNumber]?.passengerAge || ''}
                          onChange={(e) => handlePassengerChange(seat.seatNumber, 'passengerAge', e.target.value)}
                        />
                      </div>
                      <div>
                        <select
                          value={passengers[seat.seatNumber]?.passengerGender || 'MALE'}
                          onChange={(e) => handlePassengerChange(seat.seatNumber, 'passengerGender', e.target.value)}
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Payment Method
                  </label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="UPI">Instant UPI (GooglePay / PhonePe / Paytm)</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    padding: '0.85rem',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Check size={18} />
                  {submitting ? 'Confirming Reservation...' : `Pay ₹${grandTotal.toFixed(2)} & Confirm`}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
