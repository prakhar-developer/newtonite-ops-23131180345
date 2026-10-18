import React, { useState } from 'react';
import { Layers, Shield, ArrowRight, Lock, Mail } from 'lucide-react';
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
        padding: '32px 16px',
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: '#0f172a',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
              marginBottom: '12px',
            }}
          >
            <Layers size={28} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
            instOS Operations
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Sign in to access your team's operational command center
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#fee2e2',
                color: '#dc2626',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="instos-input"
                  style={{ paddingLeft: '36px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="instos-input"
                  style={{ paddingLeft: '36px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '14px', marginTop: '6px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Operations'}
            </button>
          </form>
        </div>

        {/* 1-Click Fast Persona Login Cards (For Quick Evaluation) */}
        <div className="card" style={{ padding: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            ⚡ 1-Click Evaluation Personas (Pre-Seeded)
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
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-subtle)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <img
                  src={p.avatarUrl}
                  alt=""
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '10px', color: '#4f46e5', whiteSpace: 'nowrap' }}>
                    {p.roleDescription.split(' ')[0]}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Link to Customer Portal */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a
            href="/portal"
            style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            Open Public Customer Support Portal &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};
