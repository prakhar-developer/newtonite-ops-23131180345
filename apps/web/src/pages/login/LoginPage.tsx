import React, { useState } from 'react';
import { Layers, Shield, ArrowRight, Lock, Mail, ExternalLink, Sparkles } from 'lucide-react';
import { useAuth, DEMO_PERSONAS } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, switchPersona } = useAuth();
  const [email, setEmail] = useState('admin@instos.dev');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
      }}
    >
      <div style={{ maxWidth: '460px', width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: '#0f172a',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
              marginBottom: '14px',
            }}
          >
            <Layers size={28} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
            instOS Operations
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
            Sign in to access your cross-team operational command center
          </p>
        </div>

        {/* Login Card */}
        <div
          className="card"
          style={{
            padding: '36px',
            marginBottom: '20px',
            boxShadow: '0 15px 35px -5px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          }}
        >
          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '18px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">
                Work Email Address <span className="required-badge">*</span>
              </label>
              <div className="input-with-icon">
                <span className="icon-prefix">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className="instos-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="required-badge">*</span>
              </label>
              <div className="input-with-icon">
                <span className="icon-prefix">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  className="instos-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                justifyContent: 'center',
                fontSize: '14.5px',
                fontWeight: 700,
                marginTop: '6px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Operations'}
            </button>
          </form>
        </div>

        {/* 1-Click Fast Persona Login Cards (For Quick Evaluation) */}
        <div
          className="card"
          style={{
            padding: '20px 22px',
            marginBottom: '20px',
            border: '1.5px solid #e0e7ff',
            background: '#ffffff',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#4f46e5',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={13} /> 1-Click Fast Persona Evaluation
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.email}
                type="button"
                onClick={() => switchPersona(p.email)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-subtle)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4f46e5';
                  e.currentTarget.style.background = '#eef2ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.background = 'var(--bg-subtle)';
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {p.name.charAt(0)}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {p.role} · {p.team}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Customer Portal Link */}
        <div style={{ textAlign: 'center' }}>
          <a
            href="/portal"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            Are you a customer? Visit Support Portal &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};
