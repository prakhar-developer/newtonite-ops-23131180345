import React, { useState, useEffect } from 'react';
import { Shield, Plus, UserPlus, Check } from 'lucide-react';
import { api } from '../../services/api';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create User state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [systemRole, setSystemRole] = useState<'OPERATOR' | 'SUPER_ADMIN'>('OPERATOR');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uData, tData] = await Promise.all([api.listUsers(), api.listTeams()]);
      setUsers(uData);
      setTeams(tData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createUser({
        name,
        email,
        password,
        systemRole,
      });
      setName('');
      setEmail('');
      setShowModal(false);
      await fetchData();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, teamId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, teamId, newRole);
      await fetchData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="content-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Role & Permission Governance</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Assign dynamic team roles (Viewer, Member, Lead, Admin) and enforce server-side RBAC
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={16} /> Add Operator Account
        </button>
      </div>

      <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Operator</th>
              <th>System Role</th>
              <th>Assigned Teams & Dynamic Role</th>
              <th>Quick Assign / Modify Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt=""
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: u.systemRole === 'SUPER_ADMIN' ? '#4f46e5' : '#475569',
                      background: u.systemRole === 'SUPER_ADMIN' ? '#eef2ff' : '#f1f5f9',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {u.systemRole}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {u.memberships?.length === 0 ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>No team memberships</span>
                    ) : (
                      u.memberships?.map((m: any) => (
                        <span
                          key={m.id}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          <strong>{m.team?.name}:</strong> {m.role}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td>
                  {/* Quick Dynamic Role Assignment */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <select
                      id={`team-${u.id}`}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    <select
                      id={`role-${u.id}`}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="MEMBER">Member</option>
                      <option value="LEAD">Lead</option>
                      <option value="ADMIN">Admin</option>
                    </select>

                    <button
                      className="btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '11px' }}
                      onClick={() => {
                        const tId = (document.getElementById(`team-${u.id}`) as HTMLSelectElement).value;
                        const r = (document.getElementById(`role-${u.id}`) as HTMLSelectElement).value;
                        handleRoleChange(u.id, tId, r);
                      }}
                    >
                      Apply
                    </button>
                  </div>
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
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Add Operator Account</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="instos-input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Work Email *
                </label>
                <input
                  type="email"
                  className="instos-input"
                  placeholder="e.g. john@instos.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Initial Password
                </label>
                <input
                  type="password"
                  className="instos-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  System Role
                </label>
                <select
                  className="instos-select"
                  value={systemRole}
                  onChange={(e) => setSystemRole(e.target.value as any)}
                >
                  <option value="OPERATOR">Standard Operator</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
