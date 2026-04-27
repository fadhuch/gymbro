import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Profile.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function MembershipCard({ membership, role }) {
  if (role !== 'user') return null;

  const isActive = membership?.isActive && membership?.endDate && new Date(membership.endDate) >= new Date();
  const isExpired = membership?.endDate && new Date(membership.endDate) < new Date();

  return (
    <section className="profile-section">
      <h2 className="profile-section-title">Membership</h2>
      {!membership || (!membership.startDate && !membership.endDate) ? (
        <div className={`membership-card membership-card--inactive`}>
          <div className="mc-chip">No Membership</div>
          <div className="mc-plan">—</div>
          <div className="mc-dates">
            <span>Start<br /><strong>—</strong></span>
            <span>Expires<br /><strong>—</strong></span>
          </div>
          <div className="mc-status mc-status--inactive">Inactive</div>
        </div>
      ) : (
        <div className={`membership-card ${isActive ? 'membership-card--active' : 'membership-card--expired'}`}>
          <div className="mc-chip">{isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}</div>
          <div className="mc-plan">{membership.plan || 'Standard Plan'}</div>
          <div className="mc-dates">
            <span>Start<br /><strong>{formatDate(membership.startDate)}</strong></span>
            <span>Expires<br /><strong>{formatDate(membership.endDate)}</strong></span>
          </div>
          <div className={`mc-status ${isActive ? 'mc-status--active' : 'mc-status--inactive'}`}>
            {isActive ? '● Active' : isExpired ? '● Expired' : '● Inactive'}
          </div>
        </div>
      )}
      {!isActive && (
        <p className="membership-expired-note">
          {isExpired
            ? 'Your membership has expired. Contact your gym to renew access.'
            : 'Your membership is inactive. Contact your gym to activate access.'}
        </p>
      )}
    </section>
  );
}

function Profile() {
  const { user, membership, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setProfile(res.data.user);
      } catch {
        // silently fail; show what we have from context
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePwChange = (e) => {
    setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setPwLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess(res.data.message || 'Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const displayName = profile
    ? `${profile.firstname} ${profile.lastname}`
    : user
    ? `${user.firstname} ${user.lastname}`
    : '—';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div>
          <h1 className="profile-name">{displayName}</h1>
          <p className="profile-email">{profile?.email || user?.email || '—'}</p>
        </div>
      </div>

      <MembershipCard membership={profile?.membership ?? membership} role={user?.role} />

      <section className="profile-section">
        <h2 className="profile-section-title">Personal Info</h2>
        {loadingProfile ? (
          <p className="profile-loading">Loading…</p>
        ) : (
          <div className="profile-info-grid">
            <InfoRow label="First Name" value={profile?.firstname} />
            <InfoRow label="Last Name" value={profile?.lastname} />
            <InfoRow label="Email" value={profile?.email} />
            <InfoRow label="Phone" value={profile?.number} />
            <InfoRow label="Age" value={profile?.age != null ? `${profile.age} yrs` : null} />
            <InfoRow label="Weight" value={profile?.weight != null ? `${profile.weight} kg` : null} />
            <InfoRow label="Height" value={profile?.height != null ? `${profile.height} cm` : null} />
          </div>
        )}
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">Change Password</h2>
        <form onSubmit={handleChangePassword} className="pw-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={pwForm.currentPassword}
              onChange={handlePwChange}
              required
              placeholder="Enter current password"
              disabled={pwLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={pwForm.newPassword}
              onChange={handlePwChange}
              required
              minLength={6}
              placeholder="New password (min 6 chars)"
              disabled={pwLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={pwForm.confirmPassword}
              onChange={handlePwChange}
              required
              placeholder="Repeat new password"
              disabled={pwLoading}
            />
          </div>
          {pwError && <div className="pw-message pw-error">{pwError}</div>}
          {pwSuccess && <div className="pw-message pw-success">{pwSuccess}</div>}
          <button type="submit" className="pw-submit-btn" disabled={pwLoading}>
            {pwLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </section>

      <section className="profile-section">
        <button className="logout-btn" onClick={logout}>
          Sign Out
        </button>
      </section>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || <span className="info-empty">—</span>}</span>
    </div>
  );
}

export default Profile;
