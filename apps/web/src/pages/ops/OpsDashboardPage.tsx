import React, { useState, useEffect } from 'react';
import {
  Layers,
  UserCheck,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  X,
  Zap,
  Download,
} from 'lucide-react';
import { api, ApiError } from '../../services/api';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { WorkItemDetailPage } from './WorkItemDetailPage';
import { ConflictDrawer } from '../../components/ConflictDrawer';
import { useToast } from '../../context/ToastContext';

interface OpsDashboardPageProps {
  searchQuery: string;
  onOpenNewModal: () => void;
}

export const OpsDashboardPage: React.FC<OpsDashboardPageProps> = ({
  searchQuery,
  onOpenNewModal,
}) => {
  const toast = useToast();

  const [kpis, setKpis] = useState<any>({
    totalItems: 0,
    assignedToMe: 0,
    unassignedUrgent: 0,
    awaitingApproval: 0,
    slaBreached: 0,
    avgCsat: 4.8,
  });

  const [items, setItems] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeView, setActiveView] = useState<'all' | 'assigned_to_me' | 'unassigned_urgent' | 'awaiting_approval' | 'breached_sla'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [slaBreachedOnly, setSlaBreachedOnly] = useState<boolean>(false);
  const [scanningSla, setScanningSla] = useState(false);

  // Keyset Cursor Pagination
  const [page, setPage] = useState(1);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Selected item drawer & conflict drawer
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<ApiError | null>(null);

  // Live Auto-Refresh
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Deep-linking: listen for URL ?item=ID parameter
  useEffect(() => {
    const checkUrlItem = () => {
      const params = new URLSearchParams(window.location.search);
      const itemId = params.get('item');
      if (itemId) {
        setSelectedItemId(itemId);
      }
    };
    checkUrlItem();
    window.addEventListener('popstate', checkUrlItem);
    return () => window.removeEventListener('popstate', checkUrlItem);
  }, []);

  const handleCloseDrawer = () => {
    setSelectedItemId(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has('item')) {
      url.searchParams.delete('item');
      window.history.pushState({}, '', url.toString());
    }
  };

  // Load teams once
  useEffect(() => {
    api.listTeams().then(setTeams).catch(console.error);
  }, []);

  const fetchDashboardData = async (cursor?: string) => {
    try {
      setLoading(true);
      const [kpiData, itemsData] = await Promise.all([
        api.getKpis(),
        api.listWorkItems({
          view: activeView === 'breached_sla' ? undefined : activeView,
          teamId: teamFilter || undefined,
          status: (statusFilter as any) || undefined,
          priority: (priorityFilter as any) || undefined,
          slaBreached: activeView === 'breached_sla' || slaBreachedOnly ? true : undefined,
          q: searchQuery || undefined,
          cursor,
          limit: 15,
        }),
      ]);
      setKpis(kpiData);
      setItems(itemsData.items);
      setNextCursor(itemsData.nextCursor);
      setHasMore(itemsData.hasMore);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSlas = async () => {
    try {
      setScanningSla(true);
      const res = await api.scanSlas();
      toast.success(
        `⚡ SLA Audit Complete: ${res.breachedCount} item${res.breachedCount === 1 ? '' : 's'} marked as Breached!`
      );
      await fetchDashboardData(currentCursor);
    } catch (err: any) {
      toast.error(`SLA scan failed: ${err.message || 'Server error'}`);
    } finally {
      setScanningSla(false);
    }
  };

  const handleExportCsv = () => {
    if (items.length === 0) {
      toast.error('No items to export.');
      return;
    }
    const headers = ['ID', 'Title', 'Team', 'Type', 'Priority', 'Status', 'Assignee', 'SLA Status', 'Created At'];
    const rows = items.map((item) => [
      item.id,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      item.team?.name || '',
      item.type || '',
      item.priority || '',
      item.status || '',
      item.assignee?.name || 'Unassigned',
      item.slaBreached ? 'BREACHED' : 'ON_TARGET',
      item.createdAt || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `instos_audit_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${items.length} work items to CSV report.`);
  };

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
    setCursorHistory([]);
    setCurrentCursor(undefined);
    fetchDashboardData(undefined);
  }, [activeView, teamFilter, statusFilter, priorityFilter, slaBreachedOnly, searchQuery]);

  // Periodic Auto-refresh (every 12 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboardData(currentCursor);
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeView, teamFilter, statusFilter, priorityFilter, slaBreachedOnly, searchQuery, currentCursor]);

  // Handle Next Page
  const handleNextPage = () => {
    if (!nextCursor || !hasMore) return;
    setCursorHistory((prev) => [...prev, currentCursor || '']);
    setCurrentCursor(nextCursor);
    setPage((p) => p + 1);
    fetchDashboardData(nextCursor);
  };

  // Handle Previous Page
  const handlePrevPage = () => {
    if (page <= 1) return;
    const newHistory = [...cursorHistory];
    const prevCursor = newHistory.pop();
    setCursorHistory(newHistory);
    setCurrentCursor(prevCursor || undefined);
    setPage((p) => p - 1);
    fetchDashboardData(prevCursor || undefined);
  };

  // Reset all filters
  const resetFilters = () => {
    setActiveView('all');
    setTeamFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setSlaBreachedOnly(false);
  };

  const hasActiveFilters = teamFilter || statusFilter || priorityFilter || slaBreachedOnly || activeView !== 'all';

  // Quick Claim from row
  const handleQuickClaim = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    try {
      await api.claimWorkItem(itemId);
      toast.success('Work item claimed successfully!');
      fetchDashboardData(currentCursor);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setConflictError(err);
      } else {
        toast.error((err as Error).message);
      }
    }
  };

  return (
    <div className="content-body">
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)',
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Operations Command Center
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              High-concurrency operational dispatch, SLA governance & team triage
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Auto-Refresh Toggle Pill */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '20px',
              background: autoRefresh ? '#ecfdf5' : '#f1f5f9',
              border: `1px solid ${autoRefresh ? '#a7f3d0' : '#e2e8f0'}`,
              color: autoRefresh ? '#065f46' : '#64748b',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={autoRefresh ? 'Live auto-refresh enabled (every 12s)' : 'Auto-refresh paused'}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: autoRefresh ? '#10b981' : '#94a3b8',
                boxShadow: autoRefresh ? '0 0 6px #10b981' : 'none',
              }}
            />
            {autoRefresh ? 'Live Sync (12s)' : 'Sync Paused'}
          </button>

          {/* SLA Scan Trigger Button */}
          <button
            onClick={handleScanSlas}
            disabled={scanningSla}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '10px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
              fontSize: '12px',
              fontWeight: 700,
              cursor: scanningSla ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Execute immediate deterministic SLA breach scan across all open tickets"
          >
            <Zap size={14} className={scanningSla ? 'animate-spin' : ''} />
            {scanningSla ? 'Scanning SLAs...' : '⚡ Audit SLAs Now'}
          </button>

          <button className="btn-secondary" onClick={() => fetchDashboardData(currentCursor)}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn-primary" onClick={onOpenNewModal}>
            <Plus size={16} /> New Work Item
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <MetricCard
          title="Total Work Items"
          value={kpis.totalItems}
          trend="+12 this week"
          isPositive={true}
          icon={Layers}
          iconColor="#4f46e5"
          sparklineColor="#4f46e5"
          fillCount={16}
        />
        <MetricCard
          title="Assigned to Me"
          value={kpis.assignedToMe}
          trend="+4 vs yesterday"
          isPositive={true}
          icon={UserCheck}
          iconColor="#059669"
          sparklineColor="#059669"
          fillCount={12}
        />
        <MetricCard
          title="Unassigned Urgent"
          value={kpis.unassignedUrgent}
          trend="Immediate Action"
          isPositive={kpis.unassignedUrgent === 0}
          icon={AlertOctagon}
          iconColor="#dc2626"
          sparklineColor="#dc2626"
          fillCount={kpis.unassignedUrgent > 0 ? 20 : 2}
        />
        <MetricCard
          title="Awaiting Approval"
          value={kpis.awaitingApproval}
          trend="Lead Review Gate"
          isPositive={true}
          icon={Clock}
          iconColor="#b45309"
          sparklineColor="#b45309"
          fillCount={10}
        />
        <MetricCard
          title="Customer CSAT"
          value={`${kpis.avgCsat || 4.8} / 5`}
          trend={`${kpis.slaBreached || 0} Breached SLAs`}
          isPositive={(kpis.slaBreached || 0) === 0}
          icon={CheckCircle2}
          iconColor="#0284c7"
          sparklineColor="#0284c7"
          fillCount={22}
        />
      </div>

      {/* Main Layout: Left Data Table + Right Rail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left: Filter Tabs, Deep Dropdowns & Data Table */}
        <div className="card" style={{ padding: '22px 24px', overflow: 'hidden' }}>
          {/* Row 1: Fast View Segmented Control */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div className="segmented-control">
              <button
                className={`segment-btn ${activeView === 'all' ? 'active' : ''}`}
                onClick={() => setActiveView('all')}
              >
                All Items
              </button>
              <button
                className={`segment-btn ${activeView === 'assigned_to_me' ? 'active' : ''}`}
                onClick={() => setActiveView('assigned_to_me')}
              >
                Assigned to Me ({kpis.assignedToMe})
              </button>
              <button
                className={`segment-btn ${activeView === 'unassigned_urgent' ? 'active' : ''}`}
                onClick={() => setActiveView('unassigned_urgent')}
              >
                Unassigned Urgent ({kpis.unassignedUrgent})
              </button>
              <button
                className={`segment-btn ${activeView === 'awaiting_approval' ? 'active' : ''}`}
                onClick={() => setActiveView('awaiting_approval')}
              >
                Awaiting Approval ({kpis.awaitingApproval})
              </button>
              <button
                className={`segment-btn ${activeView === 'breached_sla' ? 'active' : ''}`}
                onClick={() => setActiveView('breached_sla')}
                style={activeView === 'breached_sla' ? { background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' } : {}}
              >
                🚨 Breached SLAs ({kpis.slaBreached || 0})
              </button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-subtle)', fontWeight: 600 }}>
              Showing {items.length} items on Page {page}
            </div>
          </div>

          {/* Row 2: Multi-Dimensional Filter Bar (Team, Status, Priority) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              marginBottom: '18px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
              <SlidersHorizontal size={14} /> Filters:
            </div>

            {/* Team Filter */}
            <select
              className="instos-select"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              style={{ width: 'auto', padding: '6px 28px 6px 10px', fontSize: '12px', height: '34px' }}
            >
              <option value="">All Operational Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="instos-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', padding: '6px 28px 6px 10px', fontSize: '12px', height: '34px' }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="AWAITING_APPROVAL">Awaiting Approval</option>
              <option value="AWAITING_CUSTOMER">Awaiting Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              className="instos-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ width: 'auto', padding: '6px 28px 6px 10px', fontSize: '12px', height: '34px' }}
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* SLA Breached Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: slaBreachedOnly ? '#dc2626' : '#64748b',
                cursor: 'pointer',
                marginLeft: '4px',
              }}
            >
              <input
                type="checkbox"
                checked={slaBreachedOnly}
                onChange={(e) => setSlaBreachedOnly(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#dc2626' }}
              />
              <span>Breached SLA Only</span>
            </label>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                <X size={13} /> Reset Filters
              </button>
            )}

            {/* Export CSV Button for Audit & Compliance */}
            <button
              onClick={handleExportCsv}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: hasActiveFilters ? '10px' : 'auto',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
              title="Export current filtered work items to RFC-4180 CSV report"
            >
              <Download size={13} color="#475569" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Data Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item / Customer</th>
                  <th>Team</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>SLA Target</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-subtle)' }}>
                      No operational work items match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} onClick={() => setSelectedItemId(item.id)}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>
                            v{item.version}
                          </span>
                          {item.ticket && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#4f46e5', fontWeight: 600 }}>
                                Ticket #{item.ticket.ticketNumber} ({item.ticket.customer?.name || 'Customer'})
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                          {item.team?.name}
                        </span>
                      </td>
                      <td>
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        {item.assignee ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src={item.assignee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt=""
                              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.assignee.name.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', background: '#ffedd5', padding: '2px 8px', borderRadius: '4px' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td>
                        {item.slaBreached ? (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldAlert size={11} /> BREACHED
                          </span>
                        ) : item.slaDeadline ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(item.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!item.assigneeId ? (
                          <button
                            onClick={(e) => handleQuickClaim(e, item.id)}
                            style={{
                              background: '#0f172a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Zap size={12} /> Claim
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-subtle)', fontWeight: 600 }}>
                            View &rarr;
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Keyset Cursor Pagination Footer Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '18px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>
              Showing {items.length} items (Page {page})
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={handlePrevPage}
                style={{ padding: '6px 14px', fontSize: '12px', opacity: page <= 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <button
                className="btn-secondary"
                disabled={!hasMore}
                onClick={handleNextPage}
                style={{ padding: '6px 14px', fontSize: '12px', opacity: !hasMore ? 0.5 : 1 }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Rail: Health & Support Hub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Account Service Health Card */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Operations Health</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                ~ 96% On-Time
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Active operational teams meeting contractual turnaround SLAs.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  <span>Customer Support</span>
                  <span style={{ color: '#16a34a' }}>98%</span>
                </div>
                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '98%', height: '100%', background: '#4f46e5' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  <span>Payments Ops</span>
                  <span style={{ color: '#16a34a' }}>94%</span>
                </div>
                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '94%', height: '100%', background: '#059669' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  <span>Infra Incident Response</span>
                  <span style={{ color: '#b45309' }}>91%</span>
                </div>
                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '91%', height: '100%', background: '#f59e0b' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Help & Portal Link Card */}
          <div className="card" style={{ padding: '20px', background: '#0f172a', color: '#ffffff' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Customer Support Hub</div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
              Customers can raise tickets directly or track resolutions via the public portal or embedded widget.
            </p>
            <a
              href="/portal"
              target="_blank"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#4f46e5',
                color: '#ffffff',
                padding: '9px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Open Customer Portal <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Item Detail Drawer */}
      {selectedItemId && (
        <WorkItemDetailPage
          itemId={selectedItemId}
          onClose={handleCloseDrawer}
          onItemUpdated={() => fetchDashboardData(currentCursor)}
          onConflict={(err) => setConflictError(err)}
        />
      )}

      {/* Concurrency Conflict Resolution Drawer */}
      <ConflictDrawer
        isOpen={Boolean(conflictError)}
        onClose={() => setConflictError(null)}
        onReload={() => {
          setConflictError(null);
          fetchDashboardData(currentCursor);
        }}
        errorMessage={conflictError?.message || 'A concurrency conflict occurred on the server.'}
        conflictDetails={conflictError?.details as any}
      />
    </div>
  );
};
