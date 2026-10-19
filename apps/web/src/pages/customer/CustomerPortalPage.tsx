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
  User,
  Mail,
  Building2,
  CreditCard,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const CustomerPortalPage: React.FC = () => {
  const toast = useToast();
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

  const categories = [
    {
      id: 'CUSTOMER_ISSUE',
      title: 'General Support',
      desc: 'Account issues, app guidance, or general questions',
      icon: MessageSquare,
      color: '#4f46e5',
      bg: '#eef2ff',
    },
    {
      id: 'PAYMENT',
      title: 'Payments & Billing',
      desc: 'Disputes, charge reconciliation, or invoice queries',
      icon: CreditCard,
      color: '#059669',
      bg: '#ecfdf5',
    },
    {
      id: 'INCIDENT',
      title: 'System Outage',
      desc: 'Production API downtime or gateway service errors',
      icon: AlertTriangle,
      color: '#dc2626',
      bg: '#fef2f2',
    },
    {
      id: 'COMPLIANCE',
      title: 'Compliance / KYC',
      desc: 'Identity verification or regulatory document review',
      icon: ShieldCheck,
      color: '#d97706',
      bg: '#fffbeb',
    },
  ];

  const priorities = [
    { id: 'LOW', label: 'Low', sla: '~7 Days SLA', color: '#64748b' },
    { id: 'MEDIUM', label: 'Medium', sla: '~72h SLA', color: '#0284c7' },
    { id: 'HIGH', label: 'High', sla: '~24h SLA', color: '#ea580c' },
    { id: 'CRITICAL', label: 'Critical', sla: '~2h SLA', color: '#dc2626' },
  ];

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
      toast.success('Support request submitted successfully!');
    } catch (err) {
      toast.error((err as Error).message);
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
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)',
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px', color: '#0f172a', letterSpacing: '-0.02em' }}>
              instOS Support
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Customer Support & Ingestion Hub</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a
            href="/"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#4f46e5',
              background: '#eef2ff',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Shield size={14} /> Operator Login &rarr;
          </a>
        </div>
      </header>

      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          padding: '50px 24px 34px',
          textAlign: 'center',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: '#eef2ff',
              color: '#4f46e5',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            <Sparkles size={13} /> SLA-Enforced Operations Center
          </div>
          <h1 style={{ fontSize: '34px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.03em' }}>
            How can our operational team help you?
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, marginBottom: '28px' }}>
            Submit an operational ticket, request payment reconciliation, report outages, or track past inquiries.
          </p>

          {/* Tab Selector */}
          <div className="segmented-control" style={{ padding: '5px', background: '#e2e8f0', borderRadius: '12px' }}>
            <button
              className={`segment-btn ${activeTab === 'raise' ? 'active' : ''}`}
              onClick={() => setActiveTab('raise')}
              style={{ padding: '10px 28px', fontSize: '13.5px' }}
            >
              Raise New Request
            </button>
            <button
              className={`segment-btn ${activeTab === 'track' ? 'active' : ''}`}
              onClick={() => setActiveTab('track')}
              style={{ padding: '10px 28px', fontSize: '13.5px' }}
            >
              Track Existing Request
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <div style={{ flex: 1, padding: '40px 24px 64px', maxWidth: '780px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'raise' ? (
          createdTicket ? (
            /* Success State */
            <div className="card" style={{ padding: '48px 40px', textAlign: 'center', border: '1.5px solid #bbf7d0' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 8px 16px rgba(22, 163, 74, 0.15)',
                }}
              >
                <CheckCircle size={38} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Support Request #{createdTicket.ticketNumber} Dispatched!
              </h2>
              <p style={{ fontSize: '14.5px', color: '#64748b', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                We sent a confirmation email to <strong>{createdTicket.customer?.email}</strong>. Our designated team has
                been notified and an automated SLA countdown has begun.
              </p>

              <div
                style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  padding: '20px',
                  marginBottom: '28px',
                  textAlign: 'left',
                  fontSize: '13.5px',
                  maxWidth: '520px',
                  margin: '0 auto 28px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-subtle)' }}>Tracking PIN / Token:</span>
                  <code style={{ color: '#4f46e5', fontWeight: 700, fontSize: '13px', background: '#eef2ff', padding: '3px 8px', borderRadius: '6px' }}>
                    {createdTicket.trackingToken}
                  </code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-subtle)' }}>Initial Status:</span>
                  <span style={{ fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: '12px', fontSize: '11px' }}>
                    OPEN & QUEUED
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href={`/portal/track/${createdTicket.trackingToken}`}
                  className="btn-primary"
                  style={{ padding: '12px 28px', fontSize: '14px' }}
                >
                  View Live Tracking Page <ArrowRight size={16} />
                </a>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setCreatedTicket(null);
                    setTitle('');
                    setDescription('');
                  }}
                  style={{ padding: '12px 24px', fontSize: '14px' }}
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            /* Main Form Card */
            <div className="card" style={{ padding: '36px 40px', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.06)' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Section 1: Customer Contact */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                    1. Requester Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Full Name <span className="required-badge">*</span>
                      </label>
                      <div className="input-with-icon">
                        <span className="icon-prefix">
                          <User size={16} />
                        </span>
                        <input
                          type="text"
                          className="instos-input"
                          placeholder="e.g. Alex Mercer"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Work Email <span className="required-badge">*</span>
                      </label>
                      <div className="input-with-icon">
                        <span className="icon-prefix">
                          <Mail size={16} />
                        </span>
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
                  </div>

                  <div className="form-group" style={{ marginTop: '14px' }}>
                    <label className="form-label">
                      Company / Organization <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
                    </label>
                    <div className="input-with-icon">
                      <span className="icon-prefix">
                        <Building2 size={16} />
                      </span>
                      <input
                        type="text"
                        className="instos-input"
                        placeholder="e.g. Acme Logistics Corp"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />

                {/* Section 2: Category Selector */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                    2. Select Request Category <span className="required-badge">*</span>
                  </div>

                  <div className="category-grid">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <div
                          key={cat.id}
                          className={`category-card ${isSelected ? 'active' : ''}`}
                          onClick={() => setCategory(cat.id)}
                        >
                          <div
                            className="icon-wrapper"
                            style={{
                              background: isSelected ? cat.color : cat.bg,
                              color: isSelected ? '#ffffff' : cat.color,
                            }}
                          >
                            <Icon size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                              {cat.title}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                              {cat.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Urgency / Priority Selector */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                    3. Urgency & Operational Priority <span className="required-badge">*</span>
                  </div>

                  <div className="priority-pills">
                    {priorities.map((p) => {
                      const isSelected = priority === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`priority-pill ${isSelected ? 'active' : ''}`}
                          onClick={() => setPriority(p.id)}
                        >
                          <span style={{ color: isSelected ? '#ffffff' : p.color }}>{p.label}</span>
                          <span className="sla-tag">{p.sla}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />

                {/* Section 4: Details */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                    4. Incident Details
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">
                      Subject / Brief Summary <span className="required-badge">*</span>
                    </label>
                    <div className="input-with-icon">
                      <span className="icon-prefix">
                        <FileText size={16} />
                      </span>
                      <input
                        type="text"
                        className="instos-input"
                        placeholder="e.g. Payment failed for Invoice #INV-89241"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Detailed Description & Steps to Reproduce <span className="required-badge">*</span>
                    </label>
                    <textarea
                      className="instos-textarea"
                      rows={5}
                      placeholder="Please include transaction references, error logs, account IDs, or exact timestamps..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                    <div className="form-hint">
                      The more detail you provide, the faster our operational agents can triage and resolve your request.
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    justifyContent: 'center',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    marginTop: '10px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  }}
                >
                  {submitting ? 'Submitting Support Request...' : 'Submit Support Request'}
                </button>
              </form>
            </div>
          )
        ) : (
          /* Track Existing Tab */
          <div className="card" style={{ padding: '40px', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#eef2ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Search size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
                  Track Support Ticket Progress
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b' }}>
                  Check status, SLA countdowns, and direct operator replies
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
              Enter the unique tracking token or PIN provided in your confirmation email to inspect real-time progress,
              reply directly to assigned operators, or confirm resolution.
            </p>

            <form onSubmit={handleTrackSearch} style={{ display: 'flex', gap: '12px' }}>
              <div className="input-with-icon" style={{ flex: 1 }}>
                <span className="icon-prefix">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="instos-input"
                  placeholder="Paste Tracking Token (e.g. 550e8400-e29b-41d4-a716-446655440000)"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ flexShrink: 0, padding: '10px 24px', fontSize: '13.5px' }}
              >
                Inspect Ticket
              </button>
            </form>

            <div
              style={{
                marginTop: '32px',
                padding: '16px 20px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                Lost your tracking token? Search your email inbox for <strong>support@inistnt.in</strong>
              </div>
              <a
                href="mailto:support@inistnt.in"
                style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Contact Support <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
