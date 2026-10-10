import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Bus,
  MapPin,
  Calendar,
  Users,
  Wrench,
  FileText,
  Settings,
  ShieldCheck,
  LogOut
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/admin/fleet', label: 'Fleet & Buses', icon: <Bus size={20} /> },
    { to: '/admin/routes', label: 'Routes & Drivers', icon: <MapPin size={20} /> },
    { to: '/admin/trips', label: 'Trips & Schedules', icon: <Calendar size={20} /> },
    { to: '/admin/bookings', label: 'All Bookings', icon: <FileText size={20} /> },
    { to: '/admin/maintenance', label: 'Maintenance', icon: <Wrench size={20} /> },
    { to: '/admin/users', label: 'Users & Admins', icon: <Users size={20} /> },
    { to: '/admin/settings', label: 'System Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#3b82f6', color: '#fff', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.5px' }}>SAFAR</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Admin Console</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: isActive ? '#fff' : '#94a3b8',
                backgroundColor: isActive ? '#2563eb' : 'transparent',
                transition: 'background 0.2s ease'
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
          <div style={{ marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>{user?.fullName}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              color: '#f87171',
              padding: '0.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: '8px'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
