import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { MapPin, Users, Plus } from 'lucide-react';

export default function RoutesAndDrivers() {
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState('ROUTES');

  // Route Form
  const [routeForm, setRouteForm] = useState({
    origin: '',
    destination: '',
    distanceKm: 450,
    estimatedDurationMinutes: 480
  });

  // Driver Form
  const [driverForm, setDriverForm] = useState({
    name: '',
    licenseNumber: '',
    phone: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rRes, dRes] = await Promise.all([
        api.get('/admin/routes'),
        api.get('/admin/drivers')
      ]);
      setRoutes(rRes.data.content || []);
      setDrivers(dRes.data.content || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/routes', routeForm);
      setRouteForm({ origin: '', destination: '', distanceKm: 450, estimatedDurationMinutes: 480 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create route');
    }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/drivers', driverForm);
      setDriverForm({ name: '', licenseNumber: '', phone: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add driver');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Routes & Drivers</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Configure intercity corridors and certified staff drivers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('ROUTES')}
            className={activeTab === 'ROUTES' ? 'btn-primary' : 'btn-secondary'}
          >
            Routes ({routes.length})
          </button>
          <button
            onClick={() => setActiveTab('DRIVERS')}
            className={activeTab === 'DRIVERS' ? 'btn-primary' : 'btn-secondary'}
          >
            Drivers ({drivers.length})
          </button>
        </div>
      </div>

      {activeTab === 'ROUTES' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Active Corridors</h3>
            {routes.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem' }}>Origin</th>
                    <th style={{ padding: '0.75rem' }}>Destination</th>
                    <th style={{ padding: '0.75rem' }}>Distance</th>
                    <th style={{ padding: '0.75rem' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{r.origin}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{r.destination}</td>
                      <td style={{ padding: '0.75rem' }}>{r.distanceKm} km</td>
                      <td style={{ padding: '0.75rem' }}>{Math.floor(r.estimatedDurationMinutes / 60)} hrs {r.estimatedDurationMinutes % 60} mins</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No routes configured</div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Add New Route</h3>
            <form onSubmit={handleCreateRoute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Origin City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad"
                  value={routeForm.origin}
                  onChange={(e) => setRouteForm({ ...routeForm, origin: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Destination City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru"
                  value={routeForm.destination}
                  onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Distance (KM)</label>
                <input
                  type="number"
                  required
                  value={routeForm.distanceKm}
                  onChange={(e) => setRouteForm({ ...routeForm, distanceKm: Number(e.target.value) })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  value={routeForm.estimatedDurationMinutes}
                  onChange={(e) => setRouteForm({ ...routeForm, estimatedDurationMinutes: Number(e.target.value) })}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Create Route</button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Driver Roster</h3>
            {drivers.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem' }}>Driver Name</th>
                    <th style={{ padding: '0.75rem' }}>License Number</th>
                    <th style={{ padding: '0.75rem' }}>Phone</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{d.name}</td>
                      <td style={{ padding: '0.75rem' }}>{d.licenseNumber}</td>
                      <td style={{ padding: '0.75rem' }}>{d.phone}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge badge-${d.status.toLowerCase()}`}>{d.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No drivers registered</div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Register Driver</h3>
            <form onSubmit={handleCreateDriver} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Driver Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Gowda"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>License Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-KA-2019-9944"
                  value={driverForm.licenseNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Contact Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9888877777"
                  value={driverForm.phone}
                  onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Save Driver</button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
