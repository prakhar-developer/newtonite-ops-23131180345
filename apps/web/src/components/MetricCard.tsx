import React from 'react';
import { LucideIcon, MoreVertical } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  sparklineColor?: string;
  fillCount?: number; // 1-20 bars filled
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  isPositive = true,
  icon: Icon,
  iconColor = '#4f46e5',
  sparklineColor = '#4f46e5',
  fillCount = 14,
}) => {
  const totalBars = 24;

  return (
    <div
      className="card"
      style={{
        padding: '20px 22px',
        flex: 1,
        minWidth: '220px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: `${iconColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: iconColor,
            }}
          >
            <Icon size={15} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{title}</span>
        </div>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}>
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Main Metric Value */}
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '28px',
          fontWeight: 800,
          color: 'var(--text-main)',
          marginBottom: '14px',
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </div>

      {/* Micro-Barcode / Sparkline Progress Series (Exact ShipNova look) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '12px' }}>
        {Array.from({ length: totalBars }).map((_, i) => {
          const isFilled = i < fillCount;
          return (
            <div
              key={i}
              style={{
                width: '3.5px',
                height: isFilled ? '14px' : '10px',
                borderRadius: '1.5px',
                background: isFilled ? sparklineColor : '#e2e8f0',
                transition: 'all 0.2s ease',
              }}
            />
          );
        })}
      </div>

      {/* Delta Trend Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: isPositive ? '#16a34a' : '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          {isPositive ? '▲' : '▼'} {trend}
        </span>
      </div>
    </div>
  );
};
