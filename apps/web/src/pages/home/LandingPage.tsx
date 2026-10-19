import React, { useState } from 'react';
import {
  Layers,
  Shield,
  Zap,
  Lock,
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  Activity,
  Terminal,
  Server,
  FileCheck,
  ChevronRight,
  Star,
  RefreshCw,
  Cpu,
  Mail,
  ExternalLink,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const { login } = useAuth();
  const [loggingIn, setLoggingIn] = useState<string | null>(null);

  const handleQuickDemoLaunch = async (email: string) => {
    try {
      setLoggingIn(email);
      await login(email, 'password123');
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      alert('Could not authenticate demo account. Please click Sign In manually.');
    } finally {
      setLoggingIn(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', fontFamily: 'var(--font-sans)' }}>
      {/* Top Navigation */}
      <header
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Layers size={22} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
                instOS
              </span>
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '11px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                }}
              >
                v2.5 Enterprise
              </span>
            </div>
          </div>

          {/* Center Links */}
          <nav
            style={{
              display: 'none',
              gap: '28px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#94a3b8',
            }}
            className="desktop-nav"
          >
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>
              Architecture
            </a>
            <a href="#dual-surface" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>
              Dual-Surface Security
            </a>
            <a href="#benchmarks" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>
              ACID Guarantees
            </a>
            <a href="/portal" style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Customer Portal <ExternalLink size={13} />
            </a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="/portal"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <LifeBuoy size={14} /> Support Portal
            </a>
            <button
              onClick={onOpenLogin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
              }}
            >
              Operator Sign In <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 24px 60px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        {/* Release Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            fontSize: '12px',
            fontWeight: 700,
            color: '#c7d2fe',
            marginBottom: '24px',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          Zero-Loss Outbox • Real-Time SSE Multiplayer • OCC Concurrency
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: '960px',
            margin: '0 auto 20px',
            background: 'linear-gradient(180deg, #ffffff 40%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          High-Reliability Operations & Customer Support Platform
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            color: '#94a3b8',
            maxWidth: '740px',
            margin: '0 auto 36px',
            lineHeight: 1.6,
          }}
        >
          Engineered for mission-critical operations where ticket collision is unacceptable.
          Features dual-surface token isolation, optimistic concurrency locking, atomic claim mutexes, and inbound email parsing.
        </p>

        {/* 1-Click Interactive Live Demos */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: '14px' }}>
            Instant Interactive Test Drive (1-Click Login)
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => handleQuickDemoLaunch('admin@instos.internal')}
              disabled={loggingIn !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.15s ease',
              }}
            >
              <Shield size={16} />
              {loggingIn === 'admin@instos.internal' ? 'Launching Admin...' : 'Launch as Super Admin'}
            </button>

            <button
              onClick={() => handleQuickDemoLaunch('sarah@instos.internal')}
              disabled={loggingIn !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '10px',
                background: '#1e293b',
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: '14px',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
              }}
            >
              <Zap size={16} color="#38bdf8" />
              {loggingIn === 'sarah@instos.internal' ? 'Launching Lead...' : 'Launch as Payments Lead'}
            </button>

            <button
              onClick={() => handleQuickDemoLaunch('alex@instos.internal')}
              disabled={loggingIn !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '10px',
                background: '#1e293b',
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: '14px',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
              }}
            >
              <Users size={16} color="#a855f7" />
              {loggingIn === 'alex@instos.internal' ? 'Launching Operator...' : 'Launch as Tier-1 Operator'}
            </button>

            <a
              href="/portal"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                color: '#38bdf8',
                fontWeight: 600,
                fontSize: '14px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                textDecoration: 'none',
              }}
            >
              <LifeBuoy size={16} /> Test Customer Portal
            </a>
          </div>
        </div>

        {/* Live Reliability Metrics Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            maxWidth: '1040px',
            margin: '0 auto',
            padding: '24px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#6366f1' }}>&lt; 15ms</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '4px' }}>
              Atomic Claim Latency
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Postgres Row Mutex Lock</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#10b981' }}>100%</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '4px' }}>
              Race-Safe Concurrency
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>OCC Version Check + Diff Inspector</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0ea5e9' }}>Zero Loss</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '4px' }}>
              Guaranteed Outbox
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Transactional Relay Pattern</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#f59e0b' }}>99.99%</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '4px' }}>
              SLA Compliance
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Real-time 5-min Auto Escalation</div>
          </div>
        </div>
      </section>

      {/* Product Pillars / Architecture Grid */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Architectural Guardrails Built For Production
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '600px', margin: '8px auto 0' }}>
            Every component addresses a critical failure mode commonly found in basic ticketing mockups.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Card 1: Dual Surface */}
          <div
            id="dual-surface"
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Lock size={22} color="#818cf8" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Dual-Surface Cryptographic Isolation
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              Customers never receive database IDs or JWT tokens. They interact solely via unguessable, CSPRNG 64-character tracking tokens. Internal operator discussions, audit records, and financial PII are cryptographically separated from customer view.
            </p>
          </div>

          {/* Card 2: OCC Git Diff */}
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Terminal size={22} color="#f87171" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              OCC Versioning & Git-Style Diff Inspector
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              Every work item tracks integer version counters. If Alex updates a ticket while Sarah is typing, Sarah receives an HTTP 409 conflict and an interactive side-by-side visual diff (red vs green), preventing accidental overwrites.
            </p>
          </div>

          {/* Card 3: Transactional Outbox */}
          <div
            id="benchmarks"
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Server size={22} color="#34d399" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Transactional Outbox Email Relay
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              External email notifications are written to the database outbox table within the exact same database transaction as the status update. The dedicated background worker delivers with exponential backoff and dead-letter protection.
            </p>
          </div>

          {/* Card 4: SSE Live Multiplayer */}
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(14, 165, 233, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Activity size={22} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              SSE Live Multiplayer Ticker
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              Operators maintain persistent Server-Sent Events connections. When a colleague claims or resolves an item, UI pills update immediately in real-time across all browser windows without polling delays.
            </p>
          </div>

          {/* Card 5: Inbound Email Webhook */}
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Mail size={22} color="#fbbf24" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Inbound Email Webhook Parser
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              Customers can simply email <code>support@inistnt.in</code>. The system parses multipart payload structures, extracts reply references, routes to the designated operational team, and sends a token-based confirmation.
            </p>
          </div>

          {/* Card 6: Bulk Operations & SLA Hub */}
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Cpu size={22} color="#c084fc" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Bulk Triage & SLA Compliance Hub
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              Multi-select dozens of items to bulk-reassign, elevate priority, or execute batch closures. Real-time telemetry aggregates MTTR, CSAT scores, and automated breach alerts.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{ padding: '60px 24px 100px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            padding: '48px 32px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
            Ready to test instOS in your browser?
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '540px', margin: '0 auto 28px' }}>
            No installation required. Test full operator workflows, live SSE claiming, and customer tracking right now.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleQuickDemoLaunch('admin@instos.internal')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
              }}
            >
              Start Super Admin Test Drive <ArrowRight size={16} />
            </button>
            <a
              href="/portal"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '10px',
                background: '#1e293b',
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: '15px',
                border: '1px solid rgba(255,255,255,0.12)',
                textDecoration: 'none',
              }}
            >
              Submit Support Ticket
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span>instOS Cloud Edge — All Production Systems Operational</span>
        </div>
        <div>instOS Enterprise Operations Platform • Engineered for Zero Collision Workflows</div>
      </footer>
    </div>
  );
};
