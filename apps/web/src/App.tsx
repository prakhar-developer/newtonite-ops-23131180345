import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { OpsDashboardPage } from './pages/ops/OpsDashboardPage';
import { ApprovalsPage } from './pages/ops/ApprovalsPage';
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminOutboxPage } from './pages/admin/AdminOutboxPage';
import { CustomerPortalPage } from './pages/customer/CustomerPortalPage';
import { CustomerTrackPage } from './pages/customer/CustomerTrackPage';
import { LoginPage } from './pages/login/LoginPage';
import { NewTicketModal } from './components/NewTicketModal';
import { CommandPalette } from './components/CommandPalette';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('ops');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Simple clean client path routing
  const path = window.location.pathname;

  // 1. Public Customer Ticket Tracking route: /portal/track/:token
  if (path.startsWith('/portal/track/')) {
    const token = path.replace('/portal/track/', '').replace(/\/$/, '');
    return <CustomerTrackPage token={token} />;
  }

  // 2. Public Customer Support Portal: /portal
  if (path === '/portal' || path === '/portal/') {
    return <CustomerPortalPage />;
  }

  // 3. Loading state
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Loading instOS workspace...</div>
      </div>
    );
  }

  // 4. If not logged in, render Login Page
  if (!user) {
    return <LoginPage />;
  }

  // 5. Authenticated Operator Command Center
  const breadcrumbMap: Record<string, string[]> = {
    ops: ['Dashboard', 'Operations Command Center'],
    approvals: ['Dashboard', 'Lead Approval Gate'],
    teams: ['Administration', 'Teams & Access Boundaries'],
    users: ['Administration', 'Role & Permission Governance'],
    outbox: ['Infrastructure', 'Transactional Outbox Monitor'],
  };

  return (
    <div className="app-container">
      {/* Sleek ShipNova Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="main-content">
        <Topbar
          breadcrumbs={breadcrumbMap[currentTab] || ['Dashboard', 'Operations Desk']}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenNewModal={() => setShowNewModal(true)}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {currentTab === 'ops' && (
            <OpsDashboardPage
              searchQuery={searchQuery}
              onOpenNewModal={() => setShowNewModal(true)}
            />
          )}
          {currentTab === 'approvals' && <ApprovalsPage />}
          {currentTab === 'teams' && <AdminTeamsPage />}
          {currentTab === 'users' && <AdminUsersPage />}
          {currentTab === 'outbox' && <AdminOutboxPage />}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setShowCommandPalette(false);
        }}
        onOpenNewModal={() => {
          setShowCommandPalette(false);
          setShowNewModal(true);
        }}
      />

      {/* New Work Item Modal */}
      <NewTicketModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onItemCreated={() => {
          // Trigger refresh if needed
          window.location.reload();
        }}
      />
    </div>
  );
};
