import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import './AdminUsers.css';

const ROLE_LABELS = {
  user: 'User',
  trainer: 'Trainer',
  'super admin': 'Super Admin',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

function displayDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function isMemberActive(membership) {
  if (!membership?.isActive) return false;
  if (!membership?.endDate) return false;
  return new Date(membership.endDate) >= new Date();
}

// ─── Membership Modal ────────────────────────────────────────────────────────
function MembershipModal({ user, onClose, onSaved }) {
  const m = user.membership || {};
  const [form, setForm] = useState({
    isActive: m.isActive ?? false,
    plan: m.plan || '',
    startDate: m.startDate ? formatDate(m.startDate) : '',
    endDate: m.endDate ? formatDate(m.endDate) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.patch(`/admin/users/${user._id}/membership`, form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update membership');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Edit Membership</h3>
        <p className="modal-subtitle">{user.firstname} {user.lastname}</p>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="plan">Plan Name</label>
            <input id="plan" name="plan" type="text" value={form.plan} onChange={handleChange} placeholder="e.g. Monthly, Annual" disabled={loading} />
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="startDate">Start Date</label>
              <input id="startDate" name="startDate" type="date" value={form.startDate} onChange={handleChange} disabled={loading} />
            </div>
            <div className="modal-field">
              <label htmlFor="endDate">End Date</label>
              <input id="endDate" name="endDate" type="date" value={form.endDate} onChange={handleChange} disabled={loading} />
            </div>
          </div>
          <label className="modal-toggle">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} disabled={loading} />
            <span>Active</span>
          </label>
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="modal-btn-save" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Password Reset Modal ─────────────────────────────────────────────────────
function PasswordModal({ user, onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/admin/users/${user._id}/reset-password`, { newPassword });
      setSuccess('Password reset successfully');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Reset Password</h3>
        <p className="modal-subtitle">{user.firstname} {user.lastname} · {user.email}</p>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter new password"
              disabled={loading}
            />
          </div>
          {error && <div className="modal-error">{error}</div>}
          {success && <div className="modal-success">{success}</div>}
          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose} disabled={loading}>Close</button>
            <button type="submit" className="modal-btn-save modal-btn-danger" disabled={loading}>{loading ? 'Resetting…' : 'Reset Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [membershipTarget, setMembershipTarget] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.firstname?.toLowerCase().includes(q) ||
      u.lastname?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Members</h1>
        <p className="admin-subtitle">{users.length} total users</p>
      </div>

      <div className="admin-search-wrap">
        <input
          className="admin-search"
          type="text"
          placeholder="Search by name, email or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="admin-loading">Loading users…</p>
      ) : filtered.length === 0 ? (
        <p className="admin-empty">No users found.</p>
      ) : (
        <div className="admin-user-list">
          {filtered.map((u) => {
            const active = isMemberActive(u.membership);
            const isUser = u.role === 'user';

            return (
              <div key={u._id} className="admin-user-card">
                <div className="auc-top">
                  <div className="auc-info">
                    <div className="auc-avatar">
                      {u.firstname?.[0]}{u.lastname?.[0]}
                    </div>
                    <div>
                      <div className="auc-name">{u.firstname} {u.lastname}</div>
                      <div className="auc-email">{u.email}</div>
                    </div>
                  </div>
                  <span className={`auc-role-badge role-${u.role?.replace(' ', '-')}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </div>

                {isUser && (
                  <div className="auc-membership">
                    <span className={`auc-mem-status ${active ? 'mem-active' : 'mem-inactive'}`}>
                      {active ? '● Active' : '● Inactive'}
                    </span>
                    {u.membership?.plan && <span className="auc-mem-plan">{u.membership.plan}</span>}
                    {u.membership?.endDate && (
                      <span className="auc-mem-date">Expires {displayDate(u.membership.endDate)}</span>
                    )}
                  </div>
                )}

                <div className="auc-actions">
                  {isUser && (
                    <button className="auc-btn auc-btn-membership" onClick={() => setMembershipTarget(u)}>
                      Edit Membership
                    </button>
                  )}
                  <button className="auc-btn auc-btn-password" onClick={() => setPasswordTarget(u)}>
                    Reset Password
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {membershipTarget && (
        <MembershipModal
          user={membershipTarget}
          onClose={() => setMembershipTarget(null)}
          onSaved={fetchUsers}
        />
      )}
      {passwordTarget && (
        <PasswordModal
          user={passwordTarget}
          onClose={() => setPasswordTarget(null)}
        />
      )}
    </div>
  );
}

export default AdminUsers;
