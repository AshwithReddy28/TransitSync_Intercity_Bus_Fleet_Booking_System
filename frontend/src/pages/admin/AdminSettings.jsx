import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { Settings as SettingsIcon, Shield } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaved(false);
    try {
      await api.put('/admin/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to update settings');
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>System Policies & Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Configurable tax rates, refund tiers, booking caps, and company information
        </p>
      </div>

      <div className="card" style={{ maxWidth: '640px' }}>
        {saved && (
          <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Settings updated successfully! Changes take effect immediately.
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Company Name
            </label>
            <input
              type="text"
              value={settings['company_name'] || ''}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings['tax_rate_percent'] || ''}
                onChange={(e) => setSettings({ ...settings, tax_rate_percent: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Fixed Service Fee (₹)
              </label>
              <input
                type="number"
                step="1"
                value={settings['service_fee_fixed'] || ''}
                onChange={(e) => setSettings({ ...settings, service_fee_fixed: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Max Seats Allowed Per Booking
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={settings['max_seats_per_booking'] || ''}
              onChange={(e) => setSettings({ ...settings, max_seats_per_booking: e.target.value })}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Dynamic Cancellation Refund Rules
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Refund % if cancelled &gt; 24 Hours prior to departure:
                </label>
                <input
                  type="number"
                  value={settings['refund_rule_24h_plus'] || ''}
                  onChange={(e) => setSettings({ ...settings, refund_rule_24h_plus: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Refund % if cancelled between 12 to 24 Hours prior to departure:
                </label>
                <input
                  type="number"
                  value={settings['refund_rule_12h_to_24h'] || ''}
                  onChange={(e) => setSettings({ ...settings, refund_rule_12h_to_24h: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Refund % if cancelled &lt; 12 Hours prior to departure:
                </label>
                <input
                  type="number"
                  value={settings['refund_rule_sub_12h'] || ''}
                  onChange={(e) => setSettings({ ...settings, refund_rule_sub_12h: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            Save System Configurations
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
