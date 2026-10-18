import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield } from 'lucide-react';
import { api } from '../../services/api';

export const AdminTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await api.listTeams();
      setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createTeam({ name, slug, description });
      setName('');
      setSlug('');
      setDescription('');
      setShowModal(false);
      await fetchTeams();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Teams & Access Control</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Manage cross-functional operational teams and isolation boundaries
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Create Team
        </button>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Slug / Identifier</th>
              <th>Description</th>
              <th>Active Members</th>
              <th>Total Work Items</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{t.name}</td>
                <td>
                  <code style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    {t.slug}
                  </code>
                </td>
                <td style={{ color: '#64748b' }}>{t.description || '—'}</td>
                <td>
                  <span style={{ fontWeight: 600 }}>{t._count?.memberships || 0}</span>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{t._count?.workItems || 0}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="drawer-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '440px', padding: '28px', margin: 'auto' }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Create Operational Team</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Team Name *
                </label>
                <input
                  type="text"
                  className="instos-input"
                  placeholder="e.g. Fraud Investigation"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Slug (Alphanumeric identifier) *
                </label>
                <input
                  type="text"
                  className="instos-input"
                  placeholder="e.g. fraud-ops"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  className="instos-textarea"
                  rows={3}
                  placeholder="Operational responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
