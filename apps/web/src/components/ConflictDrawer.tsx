import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ConflictDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
  errorMessage: string;
  conflictDetails?: {
    currentVersion?: number;
    submittedVersion?: number;
    currentAssignee?: string;
  };
}

export const ConflictDrawer: React.FC<ConflictDrawerProps> = ({
  isOpen,
  onClose,
  onReload,
  errorMessage,
  conflictDetails,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: '460px',
        width: 'calc(100vw - 48px)',
        background: '#ffffff',
        border: '2px solid #ef4444',
        borderRadius: '14px',
        boxShadow: 'var(--shadow-modal)',
        zIndex: 2000,
        padding: '20px',
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Concurrency Conflict (HTTP 409)
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Optimistic state rollback triggered</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, marginBottom: '14px' }}>
        {errorMessage}
      </div>

      {conflictDetails && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#475569',
            marginBottom: '16px',
          }}
        >
          {conflictDetails.currentVersion && (
            <div>
              Server Version: <strong>v{conflictDetails.currentVersion}</strong> (Your stale snapshot: v
              {conflictDetails.submittedVersion})
            </div>
          )}
          {conflictDetails.currentAssignee && (
            <div>
              Current Owner: <strong>{conflictDetails.currentAssignee}</strong>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          onClick={onClose}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
        <button
          onClick={onReload}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#0f172a',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} />
          Reload Fresh Snapshot
        </button>
      </div>
    </div>
  );
};
