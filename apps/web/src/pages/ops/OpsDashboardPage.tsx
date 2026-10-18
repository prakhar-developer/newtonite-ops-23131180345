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
} from 'lucide-react';
import { api, ApiError } from '../../services/api';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { WorkItemDetailPage } from './WorkItemDetailPage';
import { ConflictDrawer } from '../../components/ConflictDrawer';

interface OpsDashboardPageProps {
  searchQuery: string;
  onOpenNewModal: () => void;
}

export const OpsDashboardPage: React.FC<OpsDashboardPageProps> = ({
  searchQuery,
  onOpenNewModal,
}) => {
  const [kpis, setKpis] = useState<any>({
    totalItems: 0,
    assignedToMe: 0,
    unassignedUrgent: 0,
    awaitingApproval: 0,
    slaBreached: 0,
    avgCsat: 4.8,
  });

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'all' | 'assigned_to_me' | 'unassigned_urgent' | 'awaiting_approval'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Concurrency Conflict state
  const [conflictError, setConflictError] = useState<ApiError | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [kpiData, itemsData] = await Promise.all([
        api.getKpis(),
        api.listWorkItems({
          view: activeView,
          q: searchQuery || undefined,
          limit: 25,
        }),
      ]);
      setKpis(kpiData);
      setItems(itemsData.items);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeView, searchQuery]);

  return (
    <div className="content-body">
      {/* Header Row (ShipNova style) */}
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
              width: '40px',
              height: '40px',
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
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Operations Command Center
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              High-concurrency cross-team operational dispatch and triage
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn-secondary" onClick={fetchDashboardData}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn-primary" onClick={onOpenNewModal}>
            <Plus size={16} /> New Work Item
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Row (Exact ShipNova look) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
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
          value={`${kpis.avgCsat} / 5`}
          trend="+98% On-Time SLA"
          isPositive={true}
          icon={CheckCircle2}
          iconColor="#0284c7"
          sparklineColor="#0284c7"
          fillCount={22}
        />
      </div>

      {/* Main Layout: Left Data Table + Right Rail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left: Filter Tabs & Data Table */}
        <div className="card" style={{ padding: '20px 24px', overflow: 'hidden' }}>
          {/* Segmented Control Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
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
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-subtle)', fontWeight: 600 }}>
              Showing {items.length} items
            </div>
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
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-subtle)' }}>
                      No operational work items found in this view.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} onClick={() => setSelectedItemId(item.id)}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>v{item.version}</span>
                          {item.ticket && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#4f46e5', fontWeight: 600 }}>
                                #{item.ticket.ticketNumber} ({item.ticket.customer?.name})
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>
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
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>BREACHED</span>
                        ) : item.slaDeadline ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(item.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Rail: Recent Activity & SLA Service Health (ShipNova look) */}
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
          onClose={() => setSelectedItemId(null)}
          onItemUpdated={fetchDashboardData}
          onConflict={(err) => setConflictError(err)}
        />
      )}

      {/* Concurrency Conflict Resolution Drawer */}
      <ConflictDrawer
        isOpen={Boolean(conflictError)}
        onClose={() => setConflictError(null)}
        onReload={() => {
          setConflictError(null);
          fetchDashboardData();
        }}
        errorMessage={conflictError?.message || 'A concurrency conflict occurred on the server.'}
        conflictDetails={conflictError?.details as any}
      />
    </div>
  );
};
