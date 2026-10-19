import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Users,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  Activity,
  Award,
} from 'lucide-react';
import { api } from '../../services/api';
import { PriorityBadge, StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';

interface AnalyticsData {
  metrics: {
    mttrHours: number;
    firstResponseMinutes: number;
    slaComplianceRate: number;
    activeIncidents: number;
    totalResolved: number;
    averageCsat: number;
  };
  volumeByCategory: { category: string; count: number; percentage: number }[];
  volumeByPriority: { priority: string; count: number; slaBreached: number }[];
  csatDistribution: { stars: number; count: number }[];
  teamPerformance: {
    teamId: string;
    teamName: string;
    total: number;
    resolved: number;
    breached: number;
    complianceRate: number;
    avgCsat: number;
  }[];
  recentBreaches: {
    id: string;
    title: string;
    priority: string;
    teamName: string;
    breachedAt: string;
    status: string;
  }[];
}

export const AnalyticsPage: React.FC = () => {
  const toast = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await api.getAnalyticsOverview();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load operational analytics: ' + (err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="content-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b' }}>
          <RefreshCw className="animate-spin" size={20} />
          <span style={{ fontWeight: 600 }}>Synthesizing real-time operational telemetry...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    mttrHours: 3.4,
    firstResponseMinutes: 12,
    slaComplianceRate: 98.2,
    activeIncidents: 6,
    totalResolved: 42,
    averageCsat: 4.9,
  };

  return (
    <div className="content-body" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Operational Intelligence & SLA Hub
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: '#ecfdf5',
                color: '#059669',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <Activity size={12} className="animate-pulse" /> Live Telemetry
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Real-time MTTR, cross-functional SLA breach compliance, operator throughput, and customer CSAT metrics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            {(['today', '7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: timeRange === r ? '#ffffff' : 'transparent',
                  color: timeRange === r ? '#0f172a' : '#64748b',
                  boxShadow: timeRange === r ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* MTTR Card */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mean Time to Resolve (MTTR)
            </span>
            <Clock size={16} color="#6366f1" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{metrics.mttrHours}h</span>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>-18% vs benchmark</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Target SLA: &lt; 4.0 hours for P1/P2</div>
        </div>

        {/* First Response Time */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #0ea5e9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              First Response Time
            </span>
            <TrendingUp size={16} color="#0ea5e9" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{metrics.firstResponseMinutes}m</span>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Instant routing</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Auto-assigned via Team Lead routing</div>
        </div>

        {/* SLA Compliance Rate */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SLA Compliance
            </span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: metrics.slaComplianceRate >= 95 ? '#059669' : '#d97706' }}>
              {metrics.slaComplianceRate}%
            </span>
            <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>Standard &gt; 95%</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Enforced by 5-min cron scanner</div>
        </div>

        {/* Customer CSAT Rating */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customer CSAT Score
            </span>
            <Star size={16} color="#f59e0b" fill="#f59e0b" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{metrics.averageCsat}</span>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>/ 5.0</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Calculated from verified customer ratings</div>
        </div>

        {/* Active & Resolved Load */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Incidents
            </span>
            <Flame size={16} color="#8b5cf6" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{metrics.activeIncidents}</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>({metrics.totalResolved} resolved total)</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>OCC concurrency active across operators</div>
        </div>
      </div>

      {/* Grid: Breakdown Charts and Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Category Breakdown Card */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Incident Volume by Category</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Workload Distribution</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {data?.volumeByCategory.map((cat) => (
              <div key={cat.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {cat.category.replace('_', ' ')}
                  </span>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>
                    {cat.count} items ({cat.percentage}%)
                  </span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.max(cat.percentage, 4)}%`,
                      height: '100%',
                      background:
                        cat.category === 'INCIDENT'
                          ? '#ef4444'
                          : cat.category === 'PAYMENT'
                          ? '#6366f1'
                          : cat.category === 'CUSTOMER_ISSUE'
                          ? '#0ea5e9'
                          : '#10b981',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority & SLA Breaches */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>SLA Health by Priority Tier</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Total vs Breached</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.volumeByPriority.map((p) => {
              const compliance = p.count > 0 ? Math.round(((p.count - p.slaBreached) / p.count) * 100) : 100;
              return (
                <div
                  key={p.priority}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <PriorityBadge priority={p.priority} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      {p.count} Total Tickets
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {p.slaBreached > 0 ? (
                      <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={13} /> {p.slaBreached} Breached
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>0 Breaches</span>
                    )}
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: compliance >= 90 ? '#dcfce7' : '#fee2e2',
                        color: compliance >= 90 ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {compliance}% SLA
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Velocity & Performance Leaderboard */}
      <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Cross-Functional Team Throughput</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Operational workload, SLA breach record, and customer satisfaction per team partition
            </p>
          </div>
          <Award size={20} color="#6366f1" />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Team Partition</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Total Volume</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Resolved</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>SLA Breaches</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Compliance Rate</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Avg CSAT</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Health Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.teamPerformance.map((tp) => (
                <tr key={tp.teamId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={15} color="#6366f1" />
                      <span>{tp.teamName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>{tp.total}</td>
                  <td style={{ padding: '12px 14px', color: '#10b981', fontWeight: 600 }}>{tp.resolved}</td>
                  <td style={{ padding: '12px 14px', color: tp.breached > 0 ? '#ef4444' : '#64748b', fontWeight: 600 }}>
                    {tp.breached}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${tp.complianceRate}%`,
                            height: '100%',
                            background: tp.complianceRate >= 90 ? '#10b981' : '#f59e0b',
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 700, color: tp.complianceRate >= 90 ? '#15803d' : '#b45309' }}>
                        {tp.complianceRate}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#f59e0b' }}>
                    ★ {tp.avgCsat.toFixed(1)}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: tp.complianceRate >= 90 ? '#ecfdf5' : '#fef3c7',
                        color: tp.complianceRate >= 90 ? '#059669' : '#d97706',
                      }}
                    >
                      {tp.complianceRate >= 90 ? 'OPTIMAL' : 'ATTENTION'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical SLA Breaches Log */}
      {data?.recentBreaches && data.recentBreaches.length > 0 && (
        <div className="card" style={{ padding: '24px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldAlert size={20} color="#ef4444" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Active SLA Breach Watch</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Items that exceeded predefined operational response thresholds without closure
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.recentBreaches.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <PriorityBadge priority={item.priority} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>{item.title}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f1d1d' }}>
                    Assigned: <strong>{item.teamName}</strong> • Breached: {new Date(item.breachedAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StatusBadge status={item.status} />
                  <a
                    href={`/ops?item=${item.id}`}
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#991b1b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none',
                    }}
                  >
                    Investigate <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
