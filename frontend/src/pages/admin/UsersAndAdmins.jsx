import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { UserCheck, UserX, Shield, Plus, Edit, KeyRound, Trash2 } from 'lucide-react';

export default function UsersAndAdmins() {
  const [customers, setCustomers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState('CUSTOMERS');
  
  // Modals
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editCustomerModal, setEditCustomerModal] = useState(null);
  const [resetPwdModal, setResetPwdModal] = useState(null);

  const [adminForm, setAdminForm] = useState({
    email: '',
    fullName: '',
    password: '',
    phone: ''
  });

  const [customerEditForm, setCustomerEditForm] = useState({
    id: null,
    fullName: '',
    email: '',
    phone: ''
  });

  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        api.get('/admin/customers'),
        api.get('/admin/admins')
      ]);
      setCustomers(cRes.data.content || []);
      setAdmins(aRes.data.content || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/toggle-status`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle user status');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/admins', adminForm);
      setShowAdminModal(false);
      setAdminForm({ email: '', fullName: '', password: '', phone: '' });
      fetchUsers();
      alert('New administrator registered successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create administrator');
    }
  };

  const handleSaveCustomerEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/customers/${customerEditForm.id}`, customerEditForm);
      setEditCustomerModal(null);
      fetchUsers();
      alert('Customer details updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update customer');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    try {
      await api.post(`/admin/customers/${resetPwdModal.id}/reset-password`, { newPassword });
      setResetPwdModal(null);
      setNewPassword('');
      alert(`Password for ${resetPwdModal.email} has been updated.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate customer "${name}"?`)) return;
    try {
      await api.delete(`/admin/customers/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Account & Access Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Full control: edit customer profiles, reset passwords, create admins, or toggle account access
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={activeTab === 'CUSTOMERS' ? 'btn-primary' : 'btn-secondary'}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('ADMINS')}
            className={activeTab === 'ADMINS' ? 'btn-primary' : 'btn-secondary'}
          >
            Administrators ({admins.length})
          </button>
          {activeTab === 'ADMINS' && (
            <button
              onClick={() => setShowAdminModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.5rem' }}
            >
              <Plus size={16} /> New Admin
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th style={{ padding: '0.75rem' }}>Email</th>
              <th style={{ padding: '0.75rem' }}>Phone</th>
              <th style={{ padding: '0.75rem' }}>Role</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Admin Powers</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'CUSTOMERS' ? customers : admins).map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.fullName}</td>
                <td style={{ padding: '0.75rem' }}>{u.email}</td>
                <td style={{ padding: '0.75rem' }}>{u.phone || '-'}</td>
                <td style={{ padding: '0.75rem' }}>{u.role?.name}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span className={`badge badge-${u.status.toLowerCase()}`}>{u.status}</span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                    {activeTab === 'CUSTOMERS' && (
                      <>
                        <button
                          onClick={() => {
                            setCustomerEditForm({ id: u.id, fullName: u.fullName, email: u.email, phone: u.phone || '' });
                            setEditCustomerModal(u);
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Edit Customer Details"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => setResetPwdModal(u)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Reset Password"
                        >
                          <KeyRound size={14} /> Password
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      className={u.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                    >
                      {u.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Customer Modal */}
      {editCustomerModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Edit Customer Profile
            </h3>
            <form onSubmit={handleSaveCustomerEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={customerEditForm.fullName}
                  onChange={(e) => setCustomerEditForm({ ...customerEditForm, fullName: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={customerEditForm.email}
                  onChange={(e) => setCustomerEditForm({ ...customerEditForm, email: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Phone Number</label>
                <input
                  type="tel"
                  value={customerEditForm.phone}
                  onChange={(e) => setCustomerEditForm({ ...customerEditForm, phone: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditCustomerModal(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwdModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60
        }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Reset Customer Password
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Set a new password for: <strong>{resetPwdModal.email}</strong>
            </p>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { setResetPwdModal(null); setNewPassword(''); }} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showAdminModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Create Administrator Account
            </h3>

            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Temporary Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Phone</label>
                <input
                  type="tel"
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAdminModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
