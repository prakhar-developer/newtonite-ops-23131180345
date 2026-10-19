import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  UserCheck,
  AlertTriangle,
  Clock,
  MessageSquare,
  CheckCircle2,
  Inbox,
  CheckCheck,
} from 'lucide-react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { api } from '../services/api';

interface TopbarProps {
  breadcrumbs: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNewModal?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  breadcrumbs,
  searchQuery,
  onSearchChange,
  onOpenNewModal,
  onOpenCommandPalette,
}) => {
  const { user, switchPersona } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.read) {
        await api.markNotificationsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setShowNotifications(false);
      if (notif.workItemId) {
        const url = new URL(window.location.href);
        url.searchParams.set('item', notif.workItemId);
        window.history.pushState({}, '', url.toString());
        window.dispatchEvent(new Event('popstate'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotifications =
    notifFilter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'SLA_BREACH':
        return <AlertTriangle size={15} color="#dc2626" />;
      case 'APPROVAL_REQUIRED':
        return <Clock size={15} color="#d97706" />;
      case 'ASSIGNED':
        return <UserCheck size={15} color="#4f46e5" />;
      case 'TICKET_CREATED':
        return <Inbox size={15} color="#0284c7" />;
      case 'COMMENT':
        return <MessageSquare size={15} color="#8b5cf6" />;
      default:
        return <CheckCircle2 size={15} color="#10b981" />;
    }
  };

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
        position: 'relative',
        zIndex: 50,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Search Bar / Quick Command Palette Launcher */}
        <div
          onClick={onOpenCommandPalette}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-subtle)',
            borderRadius: '10px',
            padding: '8px 14px',
            width: '260px',
            border: '1px solid transparent',
            transition: 'all 0.15s ease',
            cursor: onOpenCommandPalette ? 'pointer' : 'default',
          }}
          title="Press ⌘K or Ctrl+K to open Spotlight Command Palette"
        >
          <Search size={16} color="var(--text-subtle)" />
          <input
            type="text"
            placeholder="Search or press ⌘K..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: 'var(--text-main)',
              width: '100%',
              cursor: onOpenCommandPalette ? 'pointer' : 'text',
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
            onClick={() => {
              setShowPersonaMenu(!showPersonaMenu);
              setShowNotifications(false);
            }}
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
              cursor: 'pointer',
            }}
            title="1-Click Switch Persona (Test RBAC)"
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

        {/* In-App Notifications Bell Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowPersonaMenu(false);
            }}
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              background: showNotifications ? '#f1f5f9' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-card)',
            }}
            title="In-App Notifications"
          >
            <Bell size={17} color={unreadCount > 0 ? '#4f46e5' : '#64748b'} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  height: '18px',
                  minWidth: '18px',
                  borderRadius: '9px',
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
                  animation: 'pulse 2s infinite',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout Drawer */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: 0,
                width: '380px',
                maxHeight: '520px',
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-modal)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#fafafa',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background: '#e0e7ff',
                        color: '#4338ca',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <button
                  onClick={handleMarkAllRead}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#4f46e5',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: '4px',
                  }}
                  title="Mark all notifications as read"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              </div>

              {/* Tabs */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border-light)',
                  padding: '4px 16px',
                  gap: '12px',
                  background: '#ffffff',
                }}
              >
                <button
                  onClick={() => setNotifFilter('all')}
                  style={{
                    padding: '8px 4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    borderBottom: notifFilter === 'all' ? '2px solid #4f46e5' : '2px solid transparent',
                    color: notifFilter === 'all' ? '#4f46e5' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifFilter('unread')}
                  style={{
                    padding: '8px 4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    borderBottom: notifFilter === 'unread' ? '2px solid #4f46e5' : '2px solid transparent',
                    color: notifFilter === 'unread' ? '#4f46e5' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notifications List */}
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
                {filteredNotifications.length === 0 ? (
                  <div
                    style={{
                      padding: '36px 20px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '13px',
                    }}
                  >
                    <CheckCircle2 size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontWeight: 600, color: '#64748b', margin: 0 }}>All caught up!</p>
                    <p style={{ fontSize: '12px', marginTop: '4px', margin: 0 }}>
                      No {notifFilter === 'unread' ? 'unread' : ''} notifications right now.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        background: notif.read ? '#ffffff' : '#f8faff',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = notif.read ? '#ffffff' : '#f8faff';
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {getNotifIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '2px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '12.5px',
                              fontWeight: notif.read ? 600 : 700,
                              color: notif.read ? '#334155' : '#0f172a',
                            }}
                          >
                            {notif.title}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '12px',
                            color: notif.read ? '#64748b' : '#334155',
                            margin: 0,
                            lineHeight: '1.4',
                          }}
                        >
                          {notif.message}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#64748b',
                              background: '#f1f5f9',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {notif.teamName}
                          </span>
                          {notif.priority && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: notif.priority === 'CRITICAL' ? '#dc2626' : '#475569',
                              }}
                            >
                              • {notif.priority}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unread indicator dot */}
                      {!notif.read && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#4f46e5',
                            marginTop: '6px',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '4px' }}>
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
