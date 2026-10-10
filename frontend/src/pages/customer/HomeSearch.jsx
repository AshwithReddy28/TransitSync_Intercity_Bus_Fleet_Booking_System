import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../../components/CustomerNavbar';
import CityAutocomplete from '../../components/CityAutocomplete';
import api from '../../services/api';
import { Search, Bus, Filter, ArrowRight, ShieldCheck, SlidersHorizontal, Snowflake, Sparkles, Star, Tag, Check, Award } from 'lucide-react';

export default function HomeSearch() {
  const [origin, setOrigin] = useState('Hyderabad');
  const [destination, setDestination] = useState('Bengaluru');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Filters (RedBus style)
  const [filterAc, setFilterAc] = useState('ALL'); // ALL, AC, NON_AC
  const [filterSeatType, setFilterSeatType] = useState('ALL'); // ALL, SLEEPER, SEATER
  const [maxPrice, setMaxPrice] = useState(2500);
  const [sortBy, setSortBy] = useState('EARLIEST'); // EARLIEST, PRICE_LOW, PRICE_HIGH
  const [operatorSearch, setOperatorSearch] = useState('');
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [copiedCoupon, setCopiedCoupon] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTrips('Hyderabad', 'Bengaluru', date);
  }, []);

  const fetchTrips = async (org, dst, dt) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/trips/search?origin=${encodeURIComponent(org)}&destination=${encodeURIComponent(dst)}&date=${dt}`);
      setTrips(res.data);
    } catch (err) {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;
    fetchTrips(origin, destination, date);
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOperatorName = (trip) => {
    if (trip.modelName && trip.modelName.includes(' - ')) {
      return trip.modelName.split(' - ')[0].trim();
    }
    if (trip.modelName) return trip.modelName;
    return 'SAFAR Express';
  };

  // Distinct bus operators available in current search
  const allAvailableOperators = Array.from(new Set(trips.map(t => getOperatorName(t))));

  const handleOperatorToggle = (op) => {
    if (selectedOperators.includes(op)) {
      setSelectedOperators(selectedOperators.filter(o => o !== op));
    } else {
      setSelectedOperators([...selectedOperators, op]);
    }
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  // Filter and sort logic
  const filteredTrips = trips.filter((trip) => {
    // 1. Cost filter
    if (Number(trip.baseFare) > maxPrice) return false;

    // 2. AC / Non-AC filter
    const isAc = trip.hasAc !== undefined ? trip.hasAc : (trip.coachTypeName?.toUpperCase().includes('AC') || trip.coachTypeCode?.toUpperCase().includes('AC'));
    if (filterAc === 'AC' && !isAc) return false;
    if (filterAc === 'NON_AC' && isAc) return false;

    // 3. Sleeper / Seater filter
    const isSleeper = trip.coachTypeName?.toUpperCase().includes('SLEEPER') || trip.coachTypeCode?.toUpperCase().includes('SLEEPER');
    if (filterSeatType === 'SLEEPER' && !isSleeper) return false;
    if (filterSeatType === 'SEATER' && isSleeper) return false;

    // 4. Operator filter
    const op = getOperatorName(trip);
    if (selectedOperators.length > 0 && !selectedOperators.includes(op)) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'PRICE_LOW') return Number(a.baseFare) - Number(b.baseFare);
    if (sortBy === 'PRICE_HIGH') return Number(b.baseFare) - Number(a.baseFare);
    return new Date(a.departureTime) - new Date(b.departureTime);
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f5f8' }}>
      <CustomerNavbar />

      {/* RedBus-Inspired Search Bar Ribbon */}
      <section style={{
        background: 'linear-gradient(135deg, #d84e55 0%, #b83238 100%)',
        color: '#ffffff',
        padding: '2.5rem 1.5rem 3rem',
        boxShadow: '0 4px 12px rgba(216, 78, 85, 0.2)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
              India's Leading Intercity Bus Booking · SAFAR
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#fed7d7', marginTop: '0.25rem' }}>
              Real-time seats, RedBus verified operators, live tracking & secure instant PNR
            </p>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
            color: 'var(--text-main)'
          }}>
            <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) 140px', gap: '1.25rem', alignItems: 'end' }}>
              <CityAutocomplete
                label="FROM / BOARDING POINT"
                placeholder="City or Bus Stop (e.g. MGBS, Hyderabad)"
                value={origin}
                onChange={setOrigin}
              />

              <CityAutocomplete
                label="TO / DROPPING POINT"
                placeholder="City or Bus Stop (e.g. Bengaluru, Karimnagar)"
                value={destination}
                onChange={setDestination}
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  JOURNEY DATE
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ height: '42px', fontWeight: 600 }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  height: '42px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(216, 78, 85, 0.4)'
                }}
              >
                <Search size={18} />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Container: Left Sidebar Filters + Right Bus Listings */}
      <main style={{ maxWidth: '1240px', margin: '1.5rem auto 3rem', padding: '0 1.25rem', flex: 1, width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: '1.75rem', alignItems: 'start' }}>
          
          {/* RedBus-Style Filter Sidebar */}
          <aside style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.4rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', color: '#1e293b' }}>
                <SlidersHorizontal size={16} /> Filter Results
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterAc('ALL');
                  setFilterSeatType('ALL');
                  setMaxPrice(2500);
                  setSortBy('EARLIEST');
                  setSelectedOperators([]);
                  setOperatorSearch('');
                }}
                style={{ background: 'transparent', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700 }}
              >
                CLEAR ALL
              </button>
            </div>

            {/* Bus Operators Filter */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Bus Operator
              </div>
              <input
                type="text"
                placeholder="Search bus operator..."
                value={operatorSearch}
                onChange={(e) => setOperatorSearch(e.target.value)}
                style={{
                  fontSize: '0.85rem',
                  padding: '0.45rem 0.75rem',
                  marginBottom: '0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1'
                }}
              />
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allAvailableOperators
                  .filter(op => op.toLowerCase().includes(operatorSearch.toLowerCase()))
                  .map(op => {
                    const count = trips.filter(t => getOperatorName(t) === op).length;
                    const isChecked = selectedOperators.includes(op);
                    return (
                      <label key={op} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', cursor: 'pointer', color: '#475569' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleOperatorToggle(op)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                          />
                          <span>{op}</span>
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{count}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #edf2f7', margin: 0 }} />

            {/* AC / Non-AC Filter */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Air Conditioning
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                {['ALL', 'AC', 'NON_AC'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterAc(type)}
                    style={{
                      padding: '0.45rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      backgroundColor: filterAc === type ? 'var(--primary)' : '#f1f5f9',
                      color: filterAc === type ? '#ffffff' : '#475569',
                      border: '1px solid ' + (filterAc === type ? 'var(--primary)' : '#e2e8f0')
                    }}
                  >
                    {type === 'ALL' ? 'All' : type === 'AC' ? 'AC' : 'Non-AC'}
                  </button>
                ))}
              </div>
            </div>

            {/* Seat Layout Filter */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Seat Type
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                {['ALL', 'SLEEPER', 'SEATER'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterSeatType(type)}
                    style={{
                      padding: '0.45rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      backgroundColor: filterSeatType === type ? 'var(--primary)' : '#f1f5f9',
                      color: filterSeatType === type ? '#ffffff' : '#475569',
                      border: '1px solid ' + (filterSeatType === type ? 'var(--primary)' : '#e2e8f0')
                    }}
                  >
                    {type === 'ALL' ? 'All' : type === 'SLEEPER' ? 'Sleeper' : 'Seater'}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Cost Filter */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <span>Max Ticket Price</span>
                <span style={{ color: 'var(--primary)' }}>₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min={200}
                max={2500}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                <span>₹200</span>
                <span>₹2,500</span>
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Sort By
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem' }}
              >
                <option value="EARLIEST">Departure: Earliest First</option>
                <option value="PRICE_LOW">Price: Low to High</option>
                <option value="PRICE_HIGH">Price: High to Low</option>
              </select>
            </div>
          </aside>

          {/* Right Column: RedBus Offers Banner + Verified Trips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* RedBus-Style Offers Banner */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.85rem' }}>
                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                Special offers just for you on SAFAR
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                
                {/* Coupon 1 */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px dashed #86efac',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#166534', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      SAFAR500
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.35rem' }}>
                      Save up to ₹500 on your bus booking
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCoupon('SAFAR500')}
                    style={{
                      background: copiedCoupon === 'SAFAR500' ? '#15803d' : '#ffffff',
                      color: copiedCoupon === 'SAFAR500' ? '#ffffff' : '#166534',
                      border: '1px solid #86efac',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px'
                    }}
                  >
                    {copiedCoupon === 'SAFAR500' ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Coupon 2 */}
                <div style={{
                  background: '#fff1f2',
                  border: '1px dashed #fca5a5',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#9f1239', background: '#ffe4e6', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      FIRST
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#be123c', marginTop: '0.35rem' }}>
                      Flat 15% discount for first-time travelers
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCoupon('FIRST')}
                    style={{
                      background: copiedCoupon === 'FIRST' ? '#be123c' : '#ffffff',
                      color: copiedCoupon === 'FIRST' ? '#ffffff' : '#9f1239',
                      border: '1px solid #fca5a5',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px'
                    }}
                  >
                    {copiedCoupon === 'FIRST' ? 'Copied!' : 'Copy'}
                  </button>
                </div>

              </div>
            </div>

            {/* Results Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {filteredTrips.length} Buses found
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {origin} → {destination} · {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Trip Cards */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', background: '#fff', borderRadius: '12px' }}>
                Searching SAFAR verified schedules...
              </div>
            ) : filteredTrips.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredTrips.map((trip) => {
                  const isAc = trip.hasAc !== undefined ? trip.hasAc : trip.coachTypeName?.toUpperCase().includes('AC');
                  const operatorName = getOperatorName(trip);
                  const isPrimo = trip.baseFare > 900;

                  return (
                    <div
                      key={trip.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        padding: '1.25rem 1.5rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        transition: 'box-shadow 0.2s ease'
                      }}
                    >
                      {/* Top Row: Operator, Primo Tag, Rating, Fare */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {isPrimo && (
                              <span style={{
                                background: '#fef3c7',
                                color: '#b45309',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}>
                                <Award size={12} /> Primo
                              </span>
                            )}
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                              {operatorName}
                            </span>
                            <span style={{
                              background: '#15803d',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}>
                              <Star size={11} fill="#ffffff" /> 4.7
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                            {trip.coachTypeName} · {trip.busRegistration}
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              On Time
                            </span>
                            {isAc && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0369a1', background: '#e0f2fe', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                AC Coach
                              </span>
                            )}
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              Free cancellation
                            </span>
                          </div>
                        </div>

                        {/* Right: Fare */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>
                            ₹{trip.baseFare}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Onwards per seat
                          </div>
                        </div>
                      </div>

                      {/* Middle: Departure, Duration, Arrival, Available Seats, View Seats CTA */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '0.85rem',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}>
                        {/* Time & Duration */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                              {formatTime(trip.departureTime)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {trip.origin}
                            </div>
                          </div>

                          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                            <div>9h 00m</div>
                            <div style={{ color: '#cbd5e1' }}>────────</div>
                          </div>

                          <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                              {formatTime(trip.arrivalTime)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {trip.destination}
                            </div>
                          </div>
                        </div>

                        {/* Seats and CTA */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: trip.availableSeats > 5 ? '#15803d' : '#b91c1c'
                            }}>
                              {trip.availableSeats} Seats left
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Window & Single available
                            </div>
                          </div>

                          <button
                            onClick={() => navigate(`/book/${trip.id}`)}
                            disabled={trip.availableSeats === 0}
                            style={{
                              backgroundColor: 'var(--primary)',
                              color: '#ffffff',
                              padding: '0.65rem 1.4rem',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 2px 6px rgba(216, 78, 85, 0.3)'
                            }}
                          >
                            View Seats <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <Bus size={42} style={{ color: '#94a3b8', marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                  No Buses Found matching current filters
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  Try resetting your operator or price filters to view all scheduled SAFAR buses.
                </p>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
