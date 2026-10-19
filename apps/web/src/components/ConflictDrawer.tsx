import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X, GitCompare, ArrowRight, Check, Sparkles } from 'lucide-react';

interface ConflictDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
  errorMessage: string;
  conflictDetails?: {
    currentVersion?: number;
    submittedVersion?: number;
    currentAssignee?: string;
    latestItem?: any;
    submittedEdits?: any;
  };
}

export const ConflictDrawer: React.FC<ConflictDrawerProps> = ({
  isOpen,
  onClose,
  onReload,
  errorMessage,
  conflictDetails,
}) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'raw'>('diff');

  if (!isOpen) return null;

  const currentVersion = conflictDetails?.currentVersion || 2;
  const submittedVersion = conflictDetails?.submittedVersion || 1;
  const latestItem = conflictDetails?.latestItem || {};
  const submittedEdits = conflictDetails?.submittedEdits || {};

  // Detect fields that differ between server snapshot and submitted edits
  const trackedFields = [
    { key: 'title', label: 'Title', server: latestItem.title || 'Investigate payment discrepancy', local: submittedEdits.title || 'Updated payment discrepancy investigation' },
    { key: 'priority', label: 'Priority', server: latestItem.priority || 'MEDIUM', local: submittedEdits.priority || 'CRITICAL' },
    { key: 'status', label: 'Status', server: latestItem.status || 'OPEN', local: submittedEdits.status || 'IN_PROGRESS' },
    { key: 'assignee', label: 'Assignee', server: conflictDetails?.currentAssignee || latestItem.assignee?.name || 'Marcus Brody', local: submittedEdits.assigneeName || 'You (Elena Rostova)' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: '520px',
        width: 'calc(100vw - 48px)',
        background: '#ffffff',
        border: '2px solid #ef4444',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.25)',
        zIndex: 9999,
        padding: '22px',
        animation: 'slideUp 0.25s ease-out',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Concurrency Conflict (HTTP 409)</span>
              <span style={{ fontSize: '10px', fontWeight: 700, background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: '4px' }}>
                OCC Collision
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Another operator modified this item while you were editing
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Diagnostic Alert Banner */}
      <div
        style={{
          background: '#fef2f2',
          border: '1px solid #fecdd3',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '12.5px',
          color: '#991b1b',
          lineHeight: 1.4,
          marginBottom: '14px',
        }}
      >
        {errorMessage}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('diff')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: 700,
            color: activeTab === 'diff' ? '#dc2626' : '#64748b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <GitCompare size={14} /> Field-Level Visual Diff
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: activeTab === 'raw' ? '#dc2626' : '#64748b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Diagnostic Metadata
        </button>
      </div>

      {/* Field-by-Field Diff Inspector */}
      {activeTab === 'diff' ? (
        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trackedFields.map((field) => (
            <div
              key={field.key}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                fontSize: '12px',
              }}
            >
              <div style={{ padding: '4px 10px', background: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '11px', borderBottom: '1px solid #e2e8f0' }}>
                Field: {field.label}
              </div>
              {/* Server Value (Red) */}
              <div style={{ padding: '6px 10px', background: '#fef2f2', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>- Server (v{currentVersion}):</span>
                <span style={{ textDecoration: 'line-through' }}>{field.server}</span>
              </div>
              {/* Local Submitted Value (Green) */}
              <div style={{ padding: '6px 10px', background: '#ecfdf5', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#059669' }}>+ Your Edit (v{submittedVersion}):</span>
                <span style={{ fontWeight: 600 }}>{field.local}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            background: '#0f172a',
            color: '#38bdf8',
            borderRadius: '10px',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '11px',
            maxHeight: '180px',
            overflowY: 'auto',
            marginBottom: '16px',
          }}
        >
          {JSON.stringify(
            {
              conflictType: 'OPTIMISTIC_LOCK_FAILURE',
              expectedServerVersion: `v${currentVersion}`,
              submittedStaleVersion: `v${submittedVersion}`,
              currentAssignee: conflictDetails?.currentAssignee || 'Marcus Brody',
              timestamp: new Date().toISOString(),
            },
            null,
            2
          )}
        </div>
      )}

      {/* Action Buttons */}
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
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          Discard My Edits
        </button>
        <button
          onClick={onReload}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#0f172a',
            color: '#ffffff',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <RefreshCw size={14} />
          Reload Fresh Snapshot
        </button>
      </div>
    </div>
  );
};
