import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { Bus, Plus, Trash2, Edit } from 'lucide-react';

export default function FleetManagement() {
  const [buses, setBuses] = useState([]);
  const [coachTypes, setCoachTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    coachTypeId: '',
    modelName: '',
    totalCapacity: 32,
    amenities: 'AC, Charging Point, Reading Lamp',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [busRes, coachRes] = await Promise.all([
        api.get('/admin/buses'),
        api.get('/admin/coach-types')
      ]);
      setBuses(busRes.data.content || []);
      setCoachTypes(coachRes.data || []);
      if (coachRes.data.length > 0) {
        setFormData(prev => ({ ...prev, coachTypeId: coachRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/buses', formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add bus');
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Are you sure you want to archive this bus?')) return;
    try {
      await api.delete(`/admin/buses/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive bus');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Fleet Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage buses, coach classifications, and layout capacities
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem' }}
        >
          <Plus size={16} /> Add Bus to Fleet
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading fleet...</div>
        ) : buses.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem' }}>Registration</th>
                <th style={{ padding: '0.75rem' }}>Coach Type</th>
                <th style={{ padding: '0.75rem' }}>Model</th>
                <th style={{ padding: '0.75rem' }}>Capacity</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{b.registrationNumber}</td>
                  <td style={{ padding: '0.75rem' }}>{b.coachTypeName}</td>
                  <td style={{ padding: '0.75rem' }}>{b.modelName}</td>
                  <td style={{ padding: '0.75rem' }}>{b.totalCapacity} seats</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleArchive(b.id)}
                      style={{ background: 'transparent', color: 'var(--danger)', padding: '0.3rem' }}
                      title="Archive Bus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No buses in fleet. Click "Add Bus to Fleet" to register your first vehicle.
          </div>
        )}
      </div>

      {/* Add Modal */}
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
              Add New Bus to Fleet
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Registration Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-EQ-5544"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Coach Type
                </label>
                <select
                  value={formData.coachTypeId}
                  onChange={(e) => setFormData({ ...formData, coachTypeId: Number(e.target.value) })}
                >
                  {coachTypes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Model / Make
                </label>
                <input
                  type="text"
                  placeholder="e.g. Volvo 9600 Multi-Axle"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Total Capacity
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  max={60}
                  value={formData.totalCapacity}
                  onChange={(e) => setFormData({ ...formData, totalCapacity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Amenities (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save & Generate Layout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
