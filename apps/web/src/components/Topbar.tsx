import React, { useState } from 'react';
import { Search, Bell, ChevronDown, UserCheck, Shield } from 'lucide-react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';

interface TopbarProps {
  breadcrumbs: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNewModal?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  breadcrumbs,
  searchQuery,
  onSearchChange,
  onOpenNewModal,
}) => {
  const { user, switchPersona } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  return (
    <header
      style={{
        height: '64px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={idx}>
            <span
              style={{
                color: idx === breadcrumbs.length - 1 ? 'var(--text-main)' : 'var(--text-subtle)',
                fontWeight: idx === breadcrumbs.length - 1 ? 600 : 500,
              }}
            >
              {b}
            </span>
            {idx < breadcrumbs.length - 1 && <span style={{ color: 'var(--text-subtle)' }}>/</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-subtle)',
            borderRadius: '10px',
            padding: '8px 14px',
            width: '280px',
            border: '1px solid transparent',
            transition: 'all 0.15s ease',
          }}
        >
          <Search size={16} color="var(--text-subtle)" />
          <input
            type="text"
            placeholder="Search items, titles, IDs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: 'var(--text-main)',
              width: '100%',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              background: '#ffffff',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border-light)',
              color: 'var(--text-subtle)',
            }}
          >
            ⌘K
          </span>
        </div>

        {/* 1-Click Persona Switcher for Quick Authorization Evaluation */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              background: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-main)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <UserCheck size={15} color="#4f46e5" />
            <span>Switch Role</span>
            <ChevronDown size={14} color="var(--text-subtle)" />
          </button>

          {showPersonaMenu && (
            <div
              style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                width: '280px',
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-modal)',
                zIndex: 1000,
                padding: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-subtle)',
                  padding: '6px 10px',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '4px',
                }}
              >
                1-Click Role Switcher (Live RBAC)
              </div>
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.email}
                  onClick={() => {
                    switchPersona(p.email);
                    setShowPersonaMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: user?.email === p.email ? 'var(--bg-subtle)' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: '#4f46e5' }}>{p.roleDescription}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create Button */}
        {onOpenNewModal && (
          <button className="btn-primary" onClick={onOpenNewModal}>
            + New Work Item
          </button>
        )}

        {/* Current User Profile Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px' }}>
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
            alt={user?.name || 'User'}
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
              {user?.name?.split(' ')[0] || 'Operator'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: user?.systemRole === 'SUPER_ADMIN' ? '#4f46e5' : '#16a34a',
              }}
            >
              {user?.systemRole === 'SUPER_ADMIN' ? 'Admin' : 'Operator'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
