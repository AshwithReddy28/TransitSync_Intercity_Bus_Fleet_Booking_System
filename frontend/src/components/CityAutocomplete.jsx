import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

const POPULAR_CITIES = [
  "Hyderabad", "MGBS Bus Station (Hyderabad)", "Jubilee Bus Station (JBS - Hyderabad)",
  "Karimnagar", "Adilabad", "Delhi", "Bengaluru", "Chennai", "Mumbai", "Pune", 
  "Goa", "Vijayawada", "Visakhapatnam", "Tirupati", "Coimbatore", "Kochi", "Mysuru", 
  "Ahmedabad", "Jaipur", "Kolkata", "Nagpur", "Indore", "Surat", "Bhopal", "Warangal", "Nizamabad"
];

export default function CityAutocomplete({ label, placeholder, value, onChange, required = true }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (val.trim().length > 0) {
      const filtered = POPULAR_CITIES.filter(city => 
        city.toLowerCase().startsWith(val.trim().toLowerCase()) ||
        city.toLowerCase().includes(val.trim().toLowerCase())
      );
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setSuggestions(POPULAR_CITIES.slice(0, 8));
      setIsOpen(true);
    }
  };

  const handleSelectCity = (city) => {
    setQuery(city);
    onChange(city);
    setIsOpen(false);
  };

  const handleFocus = () => {
    if (!query) {
      setSuggestions(POPULAR_CITIES.slice(0, 8));
      setIsOpen(true);
    } else {
      const filtered = POPULAR_CITIES.filter(city => 
        city.toLowerCase().includes(query.trim().toLowerCase())
      );
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          required={required}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          autoComplete="off"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          listStyle: 'none',
          padding: '0.35rem 0',
          margin: '0.35rem 0 0 0',
          maxHeight: '220px',
          overflowY: 'auto',
          zIndex: 100
        }}>
          {suggestions.map((city) => (
            <li
              key={city}
              onMouseDown={() => handleSelectCity(city)}
              style={{
                padding: '0.6rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-main)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MapPin size={15} style={{ color: 'var(--primary)' }} />
              <span>{city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
