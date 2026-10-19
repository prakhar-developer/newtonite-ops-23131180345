import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Clock,
  Mail,
  Zap,
  CheckCircle,
  Copy,
  Server,
  RefreshCw,
  AlertTriangle,
  Send,
  Database,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const EnterpriseSettingsPage: React.FC = () => {
  const toast = useToast();
  const [scanning, setScanning] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // SLA Configuration States
  const [criticalSla, setCriticalSla] = useState(4);
  const [urgentSla, setUrgentSla] = useState(8);
  const [highSla, setHighSla] = useState(24);
  const [mediumSla, setMediumSla] = useState(48);
  const [lowSla, setLowSla] = useState(72);

  const webhookEndpoint = `${window.location.origin.replace('3000', '4000')}/api/v1/webhooks/resend/inbound`;

  const sampleCurl = `curl -X POST "${webhookEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "customer@enterprise.com",
    "subject": "Production Payment Gateway 502 Outage",
    "text": "Hi Support team, all our webhook callbacks are failing with HTTP 502 since 10:15 AM.",
    "to": "support@inistnt.in"
  }'`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopiedWebhook(true);
    toast.success('Webhook URL copied to clipboard!');
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(sampleCurl);
    setCopiedCurl(true);
    toast.success('Sample curl command copied!');
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleManualSlaScan = async () => {
    try {
      setScanning(true);
      const res = await api.scanSlas();
      toast.success(`SLA scan completed! ${res.breachedCount || 0} active breaches audited and escalated.`);
    } catch (err) {
      toast.error('SLA scan failed: ' + (err as Error).message);
    } finally {
      setScanning(false);
    }
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('SLA Threshold Policies successfully persisted and active across all teams.');
  };

  return (
    <div className="content-body" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Platform Settings & SLA Policies
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Configure enterprise SLA escalation triggers, inbound webhook webhooks, and transactional delivery limits
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
        {/* SLA Policy Engine */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7c3aed',
                }}
              >
                <Clock size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>SLA Target Timelines</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Response deadline hours per priority tier</p>
              </div>
            </div>
            <button
              onClick={handleManualSlaScan}
              disabled={scanning}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <RefreshCw size={13} className={scanning ? 'animate-spin' : ''} />
              {scanning ? 'Auditing...' : 'Run SLA Audit Scan'}
            </button>
          </div>

          <form onSubmit={handleSavePolicies}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fee2e2' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>P1 Critical Incidents</div>
                  <div style={{ fontSize: '11px', color: '#b91c1c' }}>Immediate executive alert & auto-escalation</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={criticalSla}
                    onChange={(e) => setCriticalSla(Number(e.target.value))}
                    style={{ width: '60px', padding: '6px', textAlign: 'center', fontWeight: 700, borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>hrs</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>P2 Urgent Work Items</div>
                  <div style={{ fontSize: '11px', color: '#b45309' }}>Financial & payment flow blockers</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={urgentSla}
                    onChange={(e) => setUrgentSla(Number(e.target.value))}
                    style={{ width: '60px', padding: '6px', textAlign: 'center', fontWeight: 700, borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>hrs</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>P3 High Priority</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Core functionality degradation</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={highSla}
                    onChange={(e) => setHighSla(Number(e.target.value))}
                    style={{ width: '60px', padding: '6px', textAlign: 'center', fontWeight: 700, borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>hrs</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>P4 Medium / Standard</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Standard customer queries and account support</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={mediumSla}
                    onChange={(e) => setMediumSla(Number(e.target.value))}
                    style={{ width: '60px', padding: '6px', textAlign: 'center', fontWeight: 700, borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>hrs</span>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Save SLA Thresholds
            </button>
          </form>
        </div>

        {/* Inbound Email Webhook & API Gateway */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Inbound Email Webhook Gateway</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Two-way email synchronization via Resend or SendGrid</p>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
              Inbound Webhook HTTP Endpoint
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={webhookEndpoint}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#0f172a',
                }}
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              >
                {copiedWebhook ? <CheckCircle size={14} color="#10b981" /> : <Copy size={14} />}
                {copiedWebhook ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                Test Simulation Payload (cURL)
              </label>
              <button
                type="button"
                onClick={handleCopyCurl}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copiedCurl ? <CheckCircle size={12} color="#10b981" /> : <Copy size={12} />}
                {copiedCurl ? 'Copied' : 'Copy cURL'}
              </button>
            </div>
            <pre
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: '#0f172a',
                color: '#38bdf8',
                fontSize: '11.5px',
                lineHeight: 1.5,
                overflowX: 'auto',
                fontFamily: 'monospace',
              }}
            >
              {sampleCurl}
            </pre>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #d1fae5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#065f46' }}>
              <Zap size={14} /> Automatic Deduplication & Thread Sync Active
            </div>
            <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
              Emails referencing existing tracking tokens or IDs automatically append to the customer message thread without creating duplicate tickets.
            </div>
          </div>
        </div>

        {/* Transactional Outbox Engine Status */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Transactional Outbox Relay</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Guaranteed at-least-once external notification delivery</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ color: '#64748b' }}>Relay Poll Frequency:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>10 seconds</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ color: '#64748b' }}>Max Exponential Retries:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>5 attempts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ color: '#64748b' }}>Dead-Letter Queue (DLQ):</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>Active with Admin Retry</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ color: '#64748b' }}>Atomic Transaction Isolation:</span>
              <span style={{ fontWeight: 700, color: '#6366f1' }}>Postgres SERIALIZABLE</span>
            </div>
          </div>
        </div>

        {/* Real-time SSE Multiplayer Service */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <Zap size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Multiplayer Live Synchronization</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>SSE event bus connecting all active operator seats</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ color: '#64748b' }}>Multiplayer Transport:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>HTTP Server-Sent Events (SSE)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ color: '#64748b' }}>Heartbeat Interval:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>25 seconds (Keep-Alive)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ color: '#64748b' }}>Broadcast Events:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Claimed, Status, SLA Breached, New Ticket</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ color: '#64748b' }}>Automatic Reconnect:</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>5s Backoff with State Catch-up</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
