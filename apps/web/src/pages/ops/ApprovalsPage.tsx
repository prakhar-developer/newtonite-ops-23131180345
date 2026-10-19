import React, { useState, useEffect } from 'react';
import { CheckSquare, ShieldCheck, ArrowRight, AlertCircle, RefreshCw, X } from 'lucide-react';
import { api, ApiError } from '../../services/api';
import { PriorityBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { WorkItemDetailPage } from './WorkItemDetailPage';
import { ConflictDrawer } from '../../components/ConflictDrawer';
import { useToast } from '../../context/ToastContext';

export const ApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<ApiError | null>(null);

  // Reject modal state
  const [rejectingItem, setRejectingItem] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

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
      toast.success(`Work item "${item.title.slice(0, 30)}..." approved and resolved!`);
      await fetchApprovals();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setConflictError(err);
      } else {
        toast.error((err as Error).message);
      }
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    setSubmittingReject(true);
    try {
      await api.transitionWorkItem(rejectingItem.id, {
        version: rejectingItem.version,
        targetStatus: 'IN_PROGRESS',
        reason: rejectReason || 'Revision requested by Lead',
      });
      toast.warning('Approval rejected; returned to In Progress for revision.');
      setRejectingItem(null);
      setRejectReason('');
      await fetchApprovals();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setConflictError(err);
      } else {
        toast.error((err as Error).message);
      }
    } finally {
      setSubmittingReject(false);
    }
  };

  return (
    <div className="content-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(180, 83, 9, 0.2)',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Lead Approval Gate (Four-Eyes Verification)
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Operational work items awaiting secondary Lead review before final resolution
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
              <CheckSquare size={38} color="#16a34a" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>All Clear!</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                No work items are currently awaiting Lead approval.
              </div>
            </div>
          ) : (
            items.map((item) => {
              const isOwnItem = item.assigneeId === user?.id;

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '18px 22px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
                        {item.team?.name}
                      </span>
                      <PriorityBadge priority={item.priority} />
                      <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>v{item.version}</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                      Assignee: <strong>{item.assignee?.name || 'Unassigned'}</strong> • Target SLA: {item.slaDeadline ? new Date(item.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isOwnItem ? (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '6px 12px', borderRadius: '8px' }}>
                        Cannot approve own work (Four-Eyes Rule)
                      </span>
                    ) : (
                      <>
                        <button
                          className="btn-secondary"
                          onClick={() => setRejectingItem(item)}
                          style={{ fontSize: '12px', color: '#dc2626' }}
                        >
                          Reject / Revise
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

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="drawer-overlay" onClick={() => setRejectingItem(null)}>
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '480px', padding: '28px', margin: 'auto', boxShadow: 'var(--shadow-modal)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Reject Approval Request</h3>
              <button onClick={() => setRejectingItem(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px', lineHeight: 1.5 }}>
              This will return work item "<strong>{rejectingItem.title}</strong>" to <code>IN_PROGRESS</code> so the assignee can provide revisions.
            </p>
            <form onSubmit={handleConfirmReject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">
                  Rejection Rationale <span className="required-badge">*</span>
                </label>
                <textarea
                  className="instos-textarea"
                  rows={3}
                  placeholder="Specify missing documents, audit criteria, or corrective steps required..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setRejectingItem(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingReject} className="btn-primary" style={{ background: '#dc2626' }}>
                  {submittingReject ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
