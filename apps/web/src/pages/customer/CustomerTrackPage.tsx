import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowLeft,
  CheckCircle,
  Clock,
  Send,
  Star,
  MessageSquare,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';

export const CustomerTrackPage: React.FC<{ token: string }> = ({ token }) => {
  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reply state
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // CSAT rating state
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submittingCsat, setSubmittingCsat] = useState(false);
  const [csatSubmitted, setCsatSubmitted] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await api.getTicketByToken(token);
      setTicket(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [token]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setSendingReply(true);
    try {
      await api.addCustomerMessage(token, { body: replyBody.trim() });
      setReplyBody('');
      await fetchTicket();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleSubmitCsat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCsat(true);
    try {
      await api.submitCsatFeedback(token, { rating, feedback });
      setCsatSubmitted(true);
      await fetchTicket();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmittingCsat(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading support ticket details...</div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="card" style={{ padding: '36px', maxWidth: '480px', textAlign: 'center' }}>
          <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Invalid Tracking Token</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            We could not locate a ticket matching this tracking token. Please double check the link from your confirmation email.
          </p>
          <a href="/portal" className="btn-primary" style={{ display: 'inline-block' }}>
            Back to Customer Portal
          </a>
        </div>
      </div>
    );
  }

  const steps = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const currentStepIdx = steps.indexOf(ticket.status) !== -1 ? steps.indexOf(ticket.status) : 1;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          height: '64px',
          background: '#ffffff',
          borderBottom: '1px solid var(--border-light)',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/portal" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} /> Back
          </a>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            Ticket #{ticket.ticketNumber}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </header>

      {/* Main Container */}
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: '860px', width: '100%', margin: '0 auto' }}>
        {/* Progress Stepper Bar */}
        <div className="card" style={{ padding: '24px 32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Progress line */}
            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '20px',
                right: '20px',
                height: '3px',
                background: '#e2e8f0',
                zIndex: 1,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '20px',
                width: `${(currentStepIdx / (steps.length - 1)) * 100}%`,
                height: '3px',
                background: '#4f46e5',
                zIndex: 2,
                transition: 'width 0.3s ease',
              }}
            />

            {steps.map((s, idx) => {
              const isPastOrCurrent = idx <= currentStepIdx;
              return (
                <div
                  key={s}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 3,
                    background: '#ffffff',
                    padding: '0 8px',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isPastOrCurrent ? '#4f46e5' : '#f1f5f9',
                      color: isPastOrCurrent ? '#ffffff' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}
                  >
                    {isPastOrCurrent ? '✓' : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: isPastOrCurrent ? 700 : 500,
                      color: isPastOrCurrent ? '#0f172a' : '#94a3b8',
                    }}
                  >
                    {s.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ticket Overview Card */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
                {ticket.category}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{ticket.title}</h2>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
              Logged {new Date(ticket.createdAt).toLocaleDateString()}
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: '20px' }}>
            {ticket.description}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '16px',
              fontSize: '12px',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Reported by</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {ticket.customer.name} ({ticket.customer.email})
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Operational Team</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {ticket.workItem?.team?.name || 'Customer Operations'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Assigned Agent</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {ticket.workItem?.assignee?.name || 'Triage Queue'}
              </span>
            </div>
          </div>
        </div>

        {/* Resolution & CSAT Feedback Box (Shown when Resolved) */}
        {ticket.status === 'RESOLVED' && !csatSubmitted && (
          <div
            className="card"
            style={{
              padding: '24px',
              marginBottom: '24px',
              background: '#ecfdf5',
              border: '2px solid #86efac',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <CheckCircle size={22} color="#16a34a" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>
                Issue Resolved! Please confirm your satisfaction
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#15803d', marginBottom: '16px' }}>
              Our operations team has completed this request. Please rate your experience to help us improve.
            </p>

            <form onSubmit={handleSubmitCsat} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: star <= rating ? '#eab308' : '#cbd5e1',
                    }}
                  >
                    <Star size={24} fill={star <= rating ? '#eab308' : 'none'} />
                  </button>
                ))}
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534', alignSelf: 'center', marginLeft: '6px' }}>
                  {rating} of 5 Stars
                </span>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="instos-input"
                  placeholder="Optional feedback / comments..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  style={{ borderColor: '#86efac' }}
                />
              </div>

              <div>
                <button type="submit" disabled={submittingCsat} className="btn-primary" style={{ background: '#16a34a', padding: '10px 20px' }}>
                  {submittingCsat ? 'Confirming...' : 'Confirm Resolution & Close Ticket'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Discussion / Conversation History */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '18px' }}>
            Updates & Discussion ({ticket.comments?.length || 0})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {ticket.comments?.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-subtle)', padding: '24px 0', textAlign: 'center' }}>
                No messages yet. An operational agent will respond shortly.
              </div>
            ) : (
              ticket.comments?.map((c: any) => {
                const isCustomer = Boolean(c.customerAuthor);
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: isCustomer ? '#f8fafc' : '#eef2ff',
                      border: isCustomer ? '1px solid var(--border-light)' : '1px solid #c7d2fe',
                      maxWidth: '85%',
                      alignSelf: isCustomer ? 'flex-end' : 'flex-start',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', gap: '16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isCustomer ? 'var(--text-main)' : '#4338ca' }}>
                        {c.author?.name || c.customerAuthor?.name || 'Support Agent'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {c.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Customer Reply Form */}
          {ticket.status !== 'CLOSED' && (
            <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  className="instos-input"
                  placeholder="Type a message or provide more details..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sendingReply}
                className="btn-primary"
                style={{ padding: '10px 22px', flexShrink: 0, height: '42px' }}
              >
                <Send size={14} /> {sendingReply ? 'Sending...' : 'Reply'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
