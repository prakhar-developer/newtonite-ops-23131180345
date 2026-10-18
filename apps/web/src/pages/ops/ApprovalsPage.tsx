import React, { useState, useEffect } from 'react';
import { CheckSquare, ShieldCheck, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { api, ApiError } from '../../services/api';
import { PriorityBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { WorkItemDetailPage } from './WorkItemDetailPage';
import { ConflictDrawer } from '../../components/ConflictDrawer';

export const ApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<ApiError | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.listWorkItems({
        view: 'awaiting_approval',
        limit: 50,
      });
      setItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleLeadApprove = async (item: any) => {
    try {
      await api.transitionWorkItem(item.id, {
        version: item.version,
        targetStatus: 'RESOLVED',
        reason: 'Approved via Lead Four-Eyes Gate',
      });
      await fetchApprovals();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setConflictError(err);
      } else {
        alert((err as Error).message);
      }
    }
  };

  const handleRejectToProgress = async (item: any) => {
    const reason = prompt('Please state reason for rejecting approval (moves back to In Progress):');
    if (!reason) return;

    try {
      await api.transitionWorkItem(item.id, {
        version: item.version,
        targetStatus: 'IN_PROGRESS',
        reason,
      });
      await fetchApprovals();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setConflictError(err);
      } else {
        alert((err as Error).message);
      }
    }
  };

  return (
    <div className="content-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Lead Approval Gate (Four-Eyes Verification)
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Operational work items awaiting secondary Lead review before final resolution.
            </p>
          </div>
        </div>

        <button className="btn-secondary" onClick={fetchApprovals}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Queue
        </button>
      </div>

      {/* Main List */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-subtle)' }}>
              <CheckSquare size={36} color="#16a34a" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700, color: '#0f172a' }}>All Clear!</div>
              <div style={{ fontSize: '13px' }}>No items are currently awaiting Lead approval.</div>
            </div>
          ) : (
            items.map((item) => {
              const isOwnItem = item.assigneeId === user?.id;

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '18px 20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSelectedItemId(item.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
                        {item.team?.name}
                      </span>
                      <PriorityBadge priority={item.priority} />
                      <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>v{item.version}</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Assignee: <strong>{item.assignee?.name || 'Unassigned'}</strong> • Target SLA: {item.slaDeadline ? new Date(item.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isOwnItem ? (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', background: '#fee2e2', padding: '6px 12px', borderRadius: '8px' }}>
                        Cannot approve own work (Four-Eyes Rule)
                      </span>
                    ) : (
                      <>
                        <button
                          className="btn-secondary"
                          onClick={() => handleRejectToProgress(item)}
                          style={{ fontSize: '12px', color: '#dc2626' }}
                        >
                          Reject
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => handleLeadApprove(item)}
                          style={{ fontSize: '12px', background: '#16a34a' }}
                        >
                          <ShieldCheck size={14} /> Approve & Resolve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedItemId && (
        <WorkItemDetailPage
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
          onItemUpdated={fetchApprovals}
          onConflict={(err) => setConflictError(err)}
        />
      )}

      <ConflictDrawer
        isOpen={Boolean(conflictError)}
        onClose={() => setConflictError(null)}
        onReload={() => {
          setConflictError(null);
          fetchApprovals();
        }}
        errorMessage={conflictError?.message || 'A concurrency conflict occurred on the server.'}
        conflictDetails={conflictError?.details as any}
      />
    </div>
  );
};
