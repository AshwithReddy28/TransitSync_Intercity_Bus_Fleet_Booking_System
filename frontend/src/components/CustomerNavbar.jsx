import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, User, LogOut, Ticket, Search } from 'lucide-react';

export default function CustomerNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'var(--primary)' }}>
          <div style={{ background: 'var(--primary)', color: '#fff', padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
            <Bus size={22} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>
            SAFAR
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={18} /> Search Trips
          </Link>

          {user ? (
            <>
              <Link to="/my-bookings" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Ticket size={18} /> My Bookings
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginLeft: '0.5rem', paddingLeft: '0.8rem', borderLeft: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {user.fullName}
                </span>
                <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>
                Create Account
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
