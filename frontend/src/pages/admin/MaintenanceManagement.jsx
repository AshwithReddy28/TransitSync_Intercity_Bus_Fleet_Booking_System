import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { Wrench, Plus, CheckCircle } from 'lucide-react';

export default function MaintenanceManagement() {
  const [records, setRecords] = useState([]);
  const [buses, setBuses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    busId: '',
    serviceType: 'Engine Oil & Filter Change',
    scheduledDate: new Date().toISOString().split('T')[0],
    cost: 4500,
    notes: 'Regular periodic maintenance'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mRes, bRes] = await Promise.all([
        api.get('/admin/maintenance'),
        api.get('/admin/buses')
      ]);
      setRecords(mRes.data.content || []);
      const busList = bRes.data.content || [];
      setBuses(busList);
      if (busList.length > 0) {
        setFormData(prev => ({ ...prev, busId: busList[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/maintenance', formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule maintenance');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/admin/maintenance/${id}/complete`, { completedDate: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete maintenance');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Fleet Maintenance</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Schedule servicing, track garage costs, and enforce vehicle safety
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem' }}
        >
          <Plus size={16} /> Schedule Servicing
        </button>
      </div>

      <div className="card">
        {records.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem' }}>Bus</th>
                <th style={{ padding: '0.75rem' }}>Service Type</th>
                <th style={{ padding: '0.75rem' }}>Scheduled Date</th>
                <th style={{ padding: '0.75rem' }}>Completed Date</th>
                <th style={{ padding: '0.75rem' }}>Cost</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{r.busRegistration}</td>
                  <td style={{ padding: '0.75rem' }}>{r.serviceType}</td>
                  <td style={{ padding: '0.75rem' }}>{r.scheduledDate}</td>
                  <td style={{ padding: '0.75rem' }}>{r.completedDate || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>₹{r.cost}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {r.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleComplete(r.id)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                      >
                        Mark Done
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
            No maintenance tasks recorded
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
          <div className="card" style={{ maxWidth: '480px', width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Schedule Vehicle Maintenance
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Bus</label>
                <select
                  value={formData.busId}
                  onChange={(e) => setFormData({ ...formData, busId: Number(e.target.value) })}
                >
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.registrationNumber} ({b.modelName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Service Type</label>
                <input
                  type="text"
                  required
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Scheduled Date</label>
                <input
                  type="date"
                  required
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Estimated Cost (₹)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
