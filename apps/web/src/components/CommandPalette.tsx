import React, { useState, useEffect } from 'react';
import {
  Search,
  Zap,
  Plus,
  ArrowRight,
  Shield,
  Layers,
  Clock,
  Users,
  Database,
  ExternalLink,
  UserCheck,
  X,
  BarChart3,
  Sliders,
} from 'lucide-react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onOpenNewModal: () => void;
  onOpenItem?: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenNewModal,
}) => {
  const { switchPersona } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search items as user types
  useEffect(() => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await api.listWorkItems({ q: query, limit: 5 });
        setSearchResults(data.items || []);
      } catch {
        // Non-blocking
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleAction = async (action: () => void) => {
    action();
    onClose();
  };

  const handleTriggerSla = async () => {
    try {
      const res = await api.scanSlas();
      toast.success(`⚡ SLA Audit Complete: ${res.breachedCount} items marked Breached.`);
      window.location.reload();
    } catch {
      toast.error('SLA audit scan failed.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            gap: '12px',
          }}
        >
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Type a command, search work items, or switch roles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontWeight: 500,
              color: '#0f172a',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              background: '#f1f5f9',
              color: '#64748b',
              padding: '2px 8px',
              borderRadius: '6px',
            }}
          >
            ESC
          </span>
        </div>

        {/* Content Section */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '8px' }}>
          {/* Live Search Results */}
          {searchResults.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  padding: '6px 12px',
                }}
              >
                Work Items Match
              </div>
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('item', item.id);
                    window.history.pushState({}, '', url.toString());
                    window.dispatchEvent(new Event('popstate'));
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#1e293b',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        background: '#e0e7ff',
                        color: '#4338ca',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {item.priority}
                    </span>
                    <span>{item.title}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.team?.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                padding: '6px 12px',
              }}
            >
              Operations Actions
            </div>
            <div
              onClick={() => handleAction(onOpenNewModal)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: '#4f46e5',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Plus size={16} /> Create New Work Item
            </div>
            <div
              onClick={() => handleAction(handleTriggerSla)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: '#be123c',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Zap size={16} /> Run Immediate SLA Breach Audit
            </div>
          </div>

          {/* Quick Navigation */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                padding: '6px 12px',
              }}
            >
              Navigate Views
            </div>
            {[
              { id: 'ops', label: 'Operations Command Center', icon: Layers },
              { id: 'analytics', label: 'Analytics & SLA Hub', icon: BarChart3 },
              { id: 'approvals', label: 'Lead Approvals Gate', icon: Clock },
              { id: 'settings', label: 'Platform Settings & SLAs', icon: Sliders },
              { id: 'teams', label: 'Teams & Access Boundaries', icon: Shield },
              { id: 'users', label: 'User Governance & Roles', icon: Users },
              { id: 'outbox', label: 'Transactional Outbox Monitor', icon: Database },
            ].map((nav) => {
              const Icon = nav.icon;
              return (
                <div
                  key={nav.id}
                  onClick={() => handleAction(() => onSelectTab(nav.id))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#334155',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color="#64748b" />
                    <span>{nav.label}</span>
                  </div>
                  <ArrowRight size={13} color="#cbd5e1" />
                </div>
              );
            })}
            <a
              href="/portal"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: '#0284c7',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ExternalLink size={16} color="#0284c7" />
                <span>Open Public Customer Support Portal</span>
              </div>
              <ArrowRight size={13} color="#cbd5e1" />
            </a>
          </div>

          {/* Quick Persona Switcher */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                padding: '6px 12px',
              }}
            >
              Switch Role (1-Click RBAC)
            </div>
            {DEMO_PERSONAS.map((p) => (
              <div
                key={p.email}
                onClick={() =>
                  handleAction(() => {
                    switchPersona(p.email);
                    toast.success(`Switched role to ${p.name}`);
                  })
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#334155',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span>{p.name}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 600 }}>
                  {p.roleDescription}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '10px 16px',
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            fontSize: '11px',
            color: '#94a3b8',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Use ⌘K or Ctrl+K anytime</span>
          <span>instOS Operations Platform</span>
        </div>
      </div>
    </div>
  );
};
