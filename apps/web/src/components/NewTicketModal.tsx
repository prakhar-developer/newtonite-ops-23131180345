import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { api } from '../services/api';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: () => void;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onItemCreated,
}) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('TASK');
  const [priority, setPriority] = useState('MEDIUM');
  const [teamId, setTeamId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.listTeams().then((data) => {
        setTeams(data);
        if (data.length > 0 && !teamId) {
          setTeamId(data[0].id);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return;

    setSubmitting(true);
    try {
      await api.createWorkItem({
        title,
        description,
        type,
        priority,
        teamId,
      });
      setTitle('');
      setDescription('');
      onItemCreated();
      onClose();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '520px',
          padding: '28px',
          margin: 'auto',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Create Operational Work Item</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">
              Designated Team <span className="required-badge">*</span>
            </label>
            <select
              className="instos-select"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              required
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">
                Item Type <span className="required-badge">*</span>
              </label>
              <select className="instos-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="INCIDENT">Incident</option>
                <option value="CUSTOMER_ISSUE">Customer Issue</option>
                <option value="PAYMENT">Payment Investigation</option>
                <option value="COMPLIANCE">Compliance Request</option>
                <option value="TASK">Operational Task</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                Priority <span className="required-badge">*</span>
              </label>
              <select className="instos-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">Low (7 Days SLA)</option>
                <option value="MEDIUM">Medium (72 Hours SLA)</option>
                <option value="HIGH">High (24 Hours SLA)</option>
                <option value="URGENT">Urgent (6 Hours SLA)</option>
                <option value="CRITICAL">Critical (2 Hours SLA)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Title / Summary <span className="required-badge">*</span>
            </label>
            <input
              type="text"
              className="instos-input"
              placeholder="e.g. Database connection pool spike"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Description & Context
            </label>
            <textarea
              className="instos-textarea"
              rows={4}
              placeholder="Relevant logs, error traces, or operational requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
