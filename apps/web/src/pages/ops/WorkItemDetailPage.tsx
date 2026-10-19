import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Clock,
  Send,
  Lock,
  MessageSquare,
  History,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  UserPlus,
  ArrowUpRight,
  Sparkles,
  FileEdit,
} from 'lucide-react';
import { api, ApiError } from '../../services/api';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface WorkItemDetailPageProps {
  itemId: string;
  onClose: () => void;
  onItemUpdated: () => void;
  onConflict: (err: ApiError) => void;
}

export const WorkItemDetailPage: React.FC<WorkItemDetailPageProps> = ({
  itemId,
  onClose,
  onItemUpdated,
  onConflict,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [item, setItem] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'comments' | 'timeline'>('comments');

  // Form states
  const [commentBody, setCommentBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Transition state
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [transitionReason, setTransitionReason] = useState<string>('');
  const [transitioning, setTransitioning] = useState(false);

  // Rejection inline state
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchItem = async () => {
    try {
      setLoading(true);
      const [data, usersData] = await Promise.all([
        api.getWorkItemById(itemId),
        api.listUsers().catch(() => []),
      ]);
      setItem(data);
      setUsers(usersData);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        onConflict(err);
      } else {
        toast.error((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  // Handle Atomic Claim
  const handleClaim = async () => {
    try {
      await api.claimWorkItem(itemId);
      toast.success('Successfully claimed work item!');
      await fetchItem();
      onItemUpdated();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        onConflict(err);
      } else {
        toast.error((err as Error).message);
      }
    }
  };

  // Handle Reassign
  const handleReassign = async (newAssigneeId: string) => {
    try {
      await api.updateWorkItem(itemId, {
        version: item.version,
        assigneeId: newAssigneeId || null,
      });
      toast.success(newAssigneeId ? 'Assignee updated successfully' : 'Work item unassigned');
      await fetchItem();
      onItemUpdated();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        onConflict(err);
      } else {
        toast.error((err as Error).message);
      }
    }
  };

  // Handle Priority Escalation
  const handlePriorityChange = async (newPriority: string) => {
    try {
      await api.updateWorkItem(itemId, {
        version: item.version,
        priority: newPriority,
      });
      toast.success(`Priority updated to ${newPriority}`);
      await fetchItem();
      onItemUpdated();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        onConflict(err);
      } else {
        toast.error((err as Error).message);
      }
    }
  };

  // Handle State Transition
  const handleTransition = async (e?: React.FormEvent, explicitStatus?: string, explicitReason?: string) => {
    if (e) e.preventDefault();
    const finalStatus = explicitStatus || targetStatus;
    const finalReason = explicitReason || transitionReason;
    if (!finalStatus) return;

    setTransitioning(true);
    try {
      await api.transitionWorkItem(itemId, {
        version: item.version,
        targetStatus: finalStatus,
        reason: finalReason || undefined,
      });
      toast.success(`Transitioned to ${finalStatus}`);
      setTargetStatus('');
      setTransitionReason('');
      setShowRejectBox(false);
      setRejectReason('');
      await fetchItem();
      onItemUpdated();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        onConflict(err);
      } else {
        toast.error((err as Error).message);
      }
    } finally {
      setTransitioning(false);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;

    setSubmittingComment(true);
    try {
      await api.addComment(itemId, {
        body: commentBody.trim(),
        isInternal,
      });
      toast.success(isInternal ? 'Internal note added' : 'Reply sent');
      setCommentBody('');
      await fetchItem();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading || !item) {
    return (
      <div className="drawer-overlay" onClick={onClose}>
        <div className="drawer-container" style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '13.5px', color: '#64748b' }}>Loading operational work item...</div>
        </div>
      </div>
    );
  }

  const permissions = item.permissions || {};

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
                {item.team?.name}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>
                ID: {item.id.slice(0, 8)}...
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-subtle)', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                v{item.version}
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
              {item.title}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Action Bar (Claim, Transition, Approval) */}
        <div
          style={{
            padding: '14px 28px',
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
            {item.slaBreached && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> SLA BREACHED
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Atomic Claim Button */}
            {permissions.canClaim && (
              <button className="btn-primary" onClick={handleClaim} style={{ fontSize: '12px', padding: '8px 14px' }}>
                <User size={14} /> Claim Work Item
              </button>
            )}

            {/* Lead Approval Gate Button */}
            {permissions.canApprove && item.status === 'AWAITING_APPROVAL' && (
              <>
                <button
                  className="btn-indigo"
                  onClick={() => handleTransition(undefined, 'RESOLVED', 'Approved by Team Lead (Four-Eyes verification satisfied)')}
                  disabled={transitioning}
                  style={{ fontSize: '12px', padding: '8px 14px', background: '#16a34a' }}
                >
                  <ShieldCheck size={15} /> Lead Approve & Resolve
                </button>

                <button
                  onClick={() => setShowRejectBox(!showRejectBox)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fca5a5',
                    color: '#dc2626',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reject & Revise
                </button>
              </>
            )}
          </div>
        </div>

        {/* Lead Rejection Form Box */}
        {showRejectBox && (
          <div
            style={{
              padding: '16px 28px',
              background: '#fef2f2',
              borderBottom: '1px solid #fecaca',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>
              Lead Rejection Reason (Moves back to In Progress):
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="instos-input"
                placeholder="State why this approval is rejected (e.g. Missing bank verification slip)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ borderColor: '#fca5a5' }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleTransition(undefined, 'IN_PROGRESS', rejectReason || 'Rejected by Lead')}
                disabled={transitioning}
                style={{ background: '#dc2626', flexShrink: 0, padding: '8px 16px', fontSize: '12px' }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {/* Metadata Grid (with Quick Reassign & Priority Change) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              padding: '16px',
              background: 'var(--bg-subtle)',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '12px',
            }}
          >
            {/* 1. Assignee Reassign Selector */}
            <div>
              <span style={{ color: 'var(--text-subtle)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                Assignee
              </span>
              {permissions.canEdit ? (
                <select
                  className="instos-select"
                  value={item.assigneeId || ''}
                  onChange={(e) => handleReassign(e.target.value)}
                  style={{ padding: '4px 24px 4px 8px', fontSize: '11.5px', height: '30px' }}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {item.assignee?.name || <span style={{ color: '#ea580c' }}>Unassigned</span>}
                </span>
              )}
            </div>

            {/* 2. Priority Escalation Selector */}
            <div>
              <span style={{ color: 'var(--text-subtle)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                Operational Priority
              </span>
              {permissions.canEdit ? (
                <select
                  className="instos-select"
                  value={item.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  style={{ padding: '4px 24px 4px 8px', fontSize: '11.5px', height: '30px' }}
                >
                  <option value="LOW">Low (7 Days)</option>
                  <option value="MEDIUM">Medium (72h)</option>
                  <option value="HIGH">High (24h)</option>
                  <option value="URGENT">Urgent (6h)</option>
                  <option value="CRITICAL">Critical (2h)</option>
                </select>
              ) : (
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.priority}</span>
              )}
            </div>

            {/* 3. SLA Target */}
            <div>
              <span style={{ color: 'var(--text-subtle)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                SLA Target
              </span>
              <span style={{ fontWeight: 600, color: item.slaBreached ? '#dc2626' : 'var(--text-main)' }}>
                {item.slaDeadline ? new Date(item.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                {item.slaBreached && ' (Expired)'}
              </span>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Description</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {item.description}
              </p>
            </div>
          )}

          {/* Workflow Transition Box */}
          {permissions.canTransition && (
            <div
              style={{
                padding: '16px',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                background: '#ffffff',
                marginBottom: '24px',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Advance Workflow State (Server Enforced)
              </h4>
              <form onSubmit={handleTransition} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="instos-select"
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                    required
                  >
                    <option value="">Select Target Status...</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="AWAITING_APPROVAL">Awaiting Approval (Lead Gate)</option>
                    <option value="AWAITING_CUSTOMER">Awaiting Customer Reply</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <button type="submit" disabled={transitioning} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    {transitioning ? 'Moving...' : 'Transition'}
                  </button>
                </div>
                <input
                  type="text"
                  className="instos-input"
                  placeholder="Reason / resolution note (optional)..."
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                />
              </form>
            </div>
          )}

          {/* Sub-Tabs: Comments vs Activity Timeline */}
          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-light)', marginBottom: '16px' }}>
            <button
              onClick={() => setActiveTab('comments')}
              style={{
                padding: '8px 0',
                border: 'none',
                background: 'none',
                fontSize: '13px',
                fontWeight: 700,
                color: activeTab === 'comments' ? 'var(--primary)' : 'var(--text-subtle)',
                borderBottom: activeTab === 'comments' ? '2px solid var(--primary)' : 'none',
                cursor: 'pointer',
              }}
            >
              Discussion & Notes ({item.comments?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              style={{
                padding: '8px 0',
                border: 'none',
                background: 'none',
                fontSize: '13px',
                fontWeight: 700,
                color: activeTab === 'timeline' ? 'var(--primary)' : 'var(--text-subtle)',
                borderBottom: activeTab === 'timeline' ? '2px solid var(--primary)' : 'none',
                cursor: 'pointer',
              }}
            >
              Activity Audit Trail ({item.activities?.length || 0})
            </button>
          </div>

          {/* Tab 1: Discussion Feed */}
          {activeTab === 'comments' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {item.comments?.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-subtle)', padding: '16px 0' }}>No comments yet.</div>
                ) : (
                  item.comments?.map((c: any) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: c.isInternal ? '#fffbeb' : 'var(--bg-subtle)',
                        border: c.isInternal ? '1px solid #fde68a' : '1px solid var(--border-light)',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {c.author?.name || c.customerAuthor?.name || 'Customer'}
                          </span>
                          {c.isInternal && (
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Lock size={10} /> INTERNAL NOTE
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form with Macro Canned Responses */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>⚡ Macro Presets:</span>
                  {[
                    { label: 'Refund Issued', text: 'The transaction charge has been reversed to your original payment method. Please allow 2-3 business days for bank settlement.', internal: false },
                    { label: 'KYC Resubmission', text: 'Please upload a clear, uncropped copy of your government-issued ID with all 4 corners visible via your secure portal link.', internal: false },
                    { label: 'Bug Patched', text: 'Our engineering team identified and deployed a patch for this issue. Caches have been purged and all services are operating nominally.', internal: false },
                    { label: 'Internal Escalation', text: 'Triaged as high impact. Transaction logs inspected in Datadog; escalated to Core Platform Engineering on-call.', internal: true },
                  ].map((macro) => (
                    <button
                      key={macro.label}
                      type="button"
                      onClick={() => {
                        setCommentBody(macro.text);
                        setIsInternal(macro.internal);
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    >
                      + {macro.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className="instos-textarea"
                  rows={3}
                  placeholder={isInternal ? 'Type private internal note (hidden from customer)...' : 'Type public reply to customer...'}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  style={{ minHeight: '80px' }}
                  required
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#4f46e5' }}
                    />
                    <span>Internal Note (Only operators see this)</span>
                  </label>
                  <button type="submit" disabled={submittingComment} className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
                    <Send size={13} /> {submittingComment ? 'Sending...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Activity Audit Timeline */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {item.activities?.map((a: any) => (
                <div key={a.id} style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5', marginTop: '6px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {a.actor?.name || 'System'}: <span style={{ color: '#4f46e5' }}>{a.action}</span>
                    </div>
                    {a.metadata?.reason && <div style={{ color: 'var(--text-muted)' }}>"{a.metadata.reason}"</div>}
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
