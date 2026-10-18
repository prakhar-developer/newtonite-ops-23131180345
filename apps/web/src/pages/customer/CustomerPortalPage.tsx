import React, { useState } from 'react';
import {
  LifeBuoy,
  Search,
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';

export const CustomerPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'raise' | 'track'>('raise');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState('CUSTOMER_ISSUE');
  const [priority, setPriority] = useState('MEDIUM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any | null>(null);

  // Tracking tab input
  const [trackingInput, setTrackingInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createTicket({
        name,
        email,
        company: company || undefined,
        category,
        priority,
        title,
        description,
        channel: 'PORTAL',
      });
      setCreatedTicket(res);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    window.location.href = `/portal/track/${trackingInput.trim()}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: '70px',
          background: '#ffffff',
          borderBottom: '1px solid var(--border-light)',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
            <Layers size={18} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>
              instOS Support
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Customer Support & Ingestion Hub</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a
            href="/"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Shield size={15} /> Internal Operator Login &rarr;
          </a>
        </div>
      </header>

      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          padding: '50px 24px 30px',
          textAlign: 'center',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.03em' }}>
            How can our operational team help you?
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
            Submit an operational ticket, request payment investigation, report urgent outages, or track previous requests.
          </p>

          {/* Tab Selector */}
          <div className="segmented-control" style={{ padding: '6px' }}>
            <button
              className={`segment-btn ${activeTab === 'raise' ? 'active' : ''}`}
              onClick={() => setActiveTab('raise')}
              style={{ padding: '8px 24px', fontSize: '13px' }}
            >
              Raise New Request
            </button>
            <button
              className={`segment-btn ${activeTab === 'track' ? 'active' : ''}`}
              onClick={() => setActiveTab('track')}
              style={{ padding: '8px 24px', fontSize: '13px' }}
            >
              Track Existing Request
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ flex: 1, padding: '40px 24px', maxWidth: '720px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'raise' ? (
          createdTicket ? (
            /* Success State */
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle size={36} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Support Request #{createdTicket.ticketNumber} Received!
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                We sent a confirmation email to <strong>{createdTicket.customer.email}</strong>. Our operational team has
                been notified and an SLA countdown has been initialized.
              </p>

              <div
                style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  fontSize: '13px',
                }}
              >
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-subtle)' }}>Tracking PIN / Token:</span>{' '}
                  <code style={{ color: '#4f46e5', fontWeight: 700 }}>{createdTicket.trackingToken}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-subtle)' }}>Status:</span>{' '}
                  <span style={{ fontWeight: 600, color: '#16a34a' }}>Open / Queued</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <a
                  href={`/portal/track/${createdTicket.trackingToken}`}
                  className="btn-primary"
                  style={{ padding: '12px 24px', fontSize: '14px' }}
                >
                  View Live Tracking Page &rarr;
                </a>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setCreatedTicket(null);
                    setTitle('');
                    setDescription('');
                  }}
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            /* Ticket Form */
            <div className="card" style={{ padding: '32px 36px' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="instos-input"
                      placeholder="e.g. Alex Mercer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Work Email *
                    </label>
                    <input
                      type="email"
                      className="instos-input"
                      placeholder="e.g. alex@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Company / Organization (Optional)
                  </label>
                  <input
                    type="text"
                    className="instos-input"
                    placeholder="e.g. Acme Logistics Corp"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Issue Category *
                    </label>
                    <select
                      className="instos-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="CUSTOMER_ISSUE">General Support Issue</option>
                      <option value="PAYMENT">Payment Reconciliation / Charge Dispute</option>
                      <option value="INCIDENT">System Outage / API Gateway Error</option>
                      <option value="COMPLIANCE">Compliance / KYC Document Review</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Urgency / Priority *
                    </label>
                    <select
                      className="instos-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="LOW">Low (General guidance)</option>
                      <option value="MEDIUM">Medium (Normal operational turnaround)</option>
                      <option value="HIGH">High (Impacting production systems)</option>
                      <option value="CRITICAL">Critical (Total blocker / urgent incident)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    className="instos-input"
                    placeholder="Brief description of the problem"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Details & Steps to Reproduce *
                  </label>
                  <textarea
                    className="instos-textarea"
                    rows={4}
                    placeholder="Please provide order IDs, error messages, or exact steps to help our team investigate..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '14px', marginTop: '8px' }}
                >
                  {submitting ? 'Submitting Request...' : 'Submit Support Request'}
                </button>
              </form>
            </div>
          )
        ) : (
          /* Track Tab */
          <div className="card" style={{ padding: '36px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Track Existing Support Request
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Enter the unique tracking token or PIN provided in your confirmation email to inspect real-time progress,
              reply to assigned operators, or confirm resolution.
            </p>

            <form onSubmit={handleTrackSearch} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="instos-input"
                placeholder="Paste Tracking Token (e.g. 550e8400-e29b-...)"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary" style={{ flexShrink: 0, padding: '10px 20px' }}>
                <Search size={16} /> Track
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
