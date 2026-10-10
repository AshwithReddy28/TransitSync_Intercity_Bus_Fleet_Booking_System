import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { Calendar, Plus, XCircle } from 'lucide-react';

export default function TripScheduling() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    departureTime: '',
    arrivalTime: '',
    baseFare: 850
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, rRes, bRes, dRes] = await Promise.all([
        api.get('/admin/trips'),
        api.get('/admin/routes/active'),
        api.get('/admin/buses'),
        api.get('/admin/drivers/active')
      ]);
      setTrips(tRes.data.content || []);
      setRoutes(rRes.data || []);
      const activeBuses = (bRes.data.content || []).filter(b => b.status === 'ACTIVE');
      setBuses(activeBuses);
      setDrivers(dRes.data || []);

      if (rRes.data.length > 0 && activeBuses.length > 0 && dRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          routeId: rRes.data[0].id,
          busId: activeBuses[0].id,
          driverId: dRes.data[0].id
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/trips', formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule trip');
    }
  };

  const handleCancelTrip = async (id) => {
    if (!window.confirm('Cancel this trip?')) return;
    try {
      await api.post(`/admin/trips/${id}/cancel`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel trip');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Trips & Schedules</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Dispatch schedules, prevent overlaps, and configure fares
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem' }}
        >
          <Plus size={16} /> Schedule Trip
        </button>
      </div>

      <div className="card">
        {trips.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem' }}>Route</th>
                <th style={{ padding: '0.75rem' }}>Bus & Coach</th>
                <th style={{ padding: '0.75rem' }}>Driver</th>
                <th style={{ padding: '0.75rem' }}>Departure</th>
                <th style={{ padding: '0.75rem' }}>Base Fare</th>
                <th style={{ padding: '0.75rem' }}>Seats Left</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{t.origin} → {t.destination}</td>
                  <td style={{ padding: '0.75rem' }}>{t.busRegistration} ({t.coachTypeName})</td>
                  <td style={{ padding: '0.75rem' }}>{t.driverName}</td>
                  <td style={{ padding: '0.75rem' }}>{new Date(t.departureTime).toLocaleString()}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>₹{t.baseFare}</td>
                  <td style={{ padding: '0.75rem' }}>{t.availableSeats} / {t.totalSeats}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {t.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleCancelTrip(t.id)}
                        style={{ background: 'transparent', color: 'var(--danger)', padding: '0.2rem' }}
                        title="Cancel Trip"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
            No trips scheduled. Click "Schedule Trip" to add one.
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Schedule New Bus Trip
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Route</label>
                <select
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: Number(e.target.value) })}
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.origin} → {r.destination} ({r.distanceKm} km)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Assign Bus</label>
                <select
                  value={formData.busId}
                  onChange={(e) => setFormData({ ...formData, busId: Number(e.target.value) })}
                >
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.registrationNumber} - {b.coachTypeName} ({b.totalCapacity} seats)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Assign Driver</label>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: Number(e.target.value) })}
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Departure</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Arrival</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Base Fare (₹)</label>
                <input
                  type="number"
                  required
                  min={50}
                  value={formData.baseFare}
                  onChange={(e) => setFormData({ ...formData, baseFare: Number(e.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Verify & Schedule Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
