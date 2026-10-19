import React from 'react';
import {
  LayoutDashboard,
  LifeBuoy,
  CheckSquare,
  Users,
  Shield,
  Layers,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN';

  const menuItems = [
    { id: 'ops', label: 'Operations Desk', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approval Gate', icon: CheckSquare },
    { id: 'portal', label: 'Customer Portal', icon: LifeBuoy, isExternal: true },
    ...(isSuperAdmin
      ? [
          { id: 'teams', label: 'Teams & Access', icon: Users },
          { id: 'users', label: 'Role Governance', icon: Shield },
          { id: 'outbox', label: 'Outbox Worker', icon: Layers },
        ]
      : []),
  ];

  return (
    <aside
      style={{
        width: '260px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
      }}
    >
      {/* Brand Logo (ShipNova style) */}
      <div
        style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>
              instOS
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>High-Reliability Ops</div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div style={{ padding: '20px 14px', flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-subtle)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0 12px 10px',
          }}
        >
          Main Menu
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isExternal) {
                    window.open('/portal', '_blank');
                  } else {
                    onSelectTab(item.id);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'var(--dark-btn)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={isActive ? '#ffffff' : 'var(--text-muted)'} />
                  <span>{item.label}</span>
                </div>
                {item.isExternal && <ExternalLink size={14} color="#94a3b8" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Logout */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#ef4444',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
