import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';

export const AdminOutboxPage: React.FC = () => {
  const [stats, setStats] = useState<any>({
    PENDING: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    FAILED: 0,
    DEAD_LETTER: 0,
  });
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOutbox = async () => {
    try {
      setLoading(true);
      const res = await api.getOutboxStats();
      setStats(res.stats);
      setJobs(res.recent);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutbox();
    const interval = setInterval(fetchOutbox, 4000); // Auto-refresh every 4s
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (jobId: string) => {
    try {
      await api.retryOutboxJob(jobId);
      await fetchOutbox();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="content-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Transactional Outbox Monitor</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Asynchronous event queue, background workers, and Dead-Letter Queue (DLQ) health
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchOutbox}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>PENDING JOBS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#4f46e5' }}>{stats.PENDING || 0}</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>IN PROCESSING</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7' }}>{stats.PROCESSING || 0}</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>COMPLETED</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>{stats.COMPLETED || 0}</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>DEAD LETTER (DLQ)</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: stats.DEAD_LETTER > 0 ? '#dc2626' : '#64748b' }}>
            {stats.DEAD_LETTER || 0}
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Event Type</th>
              <th>Aggregate</th>
              <th>Attempts</th>
              <th>Status</th>
              <th>Scheduled / Processed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-subtle)' }}>
                  No outbox jobs recorded yet.
                </td>
              </tr>
            ) : (
              jobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <code style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>{j.eventType}</code>
                    {j.lastError && (
                      <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
                        Error: {j.lastError}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {j.aggregateType} ({j.aggregateId.slice(0, 8)}...)
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                      {j.attempts} / {j.maxAttempts}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          j.status === 'COMPLETED'
                            ? '#dcfce7'
                            : j.status === 'DEAD_LETTER'
                            ? '#fee2e2'
                            : '#f1f5f9',
                        color:
                          j.status === 'COMPLETED'
                            ? '#16a34a'
                            : j.status === 'DEAD_LETTER'
                            ? '#dc2626'
                            : '#0f172a',
                      }}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {j.processedAt ? new Date(j.processedAt).toLocaleTimeString() : new Date(j.nextRetryAt).toLocaleTimeString()}
                  </td>
                  <td>
                    {j.status === 'DEAD_LETTER' && (
                      <button
                        className="btn-secondary"
                        onClick={() => handleRetry(j.id)}
                        style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
                      >
                        <RotateCcw size={12} /> Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
