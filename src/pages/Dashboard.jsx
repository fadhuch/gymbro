import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState({
    checkedInToday: false,
    checkedInAt: null,
    stats: [],
    progress: [],
    recentWorkouts: [],
    motivation: null,
  });

  const fetchDashboard = async () => {
    try {
      setError('');
      const response = await api.get('/dashboard');
      setDashboard(response.data.dashboard);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      setError('');
      const response = await api.post('/dashboard/check-in');
      setDashboard(response.data.dashboard);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const getInitials = () => {
    const first = user?.firstname?.[0] || '';
    const last = user?.lastname?.[0] || '';
    return (first + last).toUpperCase();
  };

  const getDayGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTodayLabel = () =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

  const formatCheckedInTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const streakStat = dashboard.stats.find((s) => s.label === 'Streak Days');
  const streakCount = Number(streakStat?.value || 0);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="db-loading">
          <div className="db-loading-spinner" />
          <p>Loading your stats…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span className="nav-logo-icon">💪</span>
          <span className="nav-logo-text">GymBro</span>
        </div>
        <div className="nav-user">
          <div className="nav-avatar" title={`${user?.firstname} ${user?.lastname}`}>
            {getInitials()}
          </div>
          <button onClick={logout} className="logout-btn">Sign out</button>
        </div>
      </nav>

      <div className="dashboard-content">

        {/* Header */}
        <div className="db-header">
          <p className="db-date">{getTodayLabel()}</p>
          <h1 className="db-greeting">{getDayGreeting()}, {user?.firstname}!</h1>
          <p className="db-subtext">
            {dashboard.checkedInToday
              ? "You're already crushing it — keep going 🔥"
              : 'Ready to make today count?'}
          </p>
          {error && <p className="db-error">{error}</p>}
        </div>

        {/* Check-In Hero Card */}
        <div className={`checkin-card${dashboard.checkedInToday ? ' is-checked-in' : ''}`}>
          <div className="checkin-card-left">
            <div className="checkin-status-icon">
              {dashboard.checkedInToday ? '✅' : '🏋️'}
            </div>
            <div className="checkin-text">
              <p className="checkin-label">
                {dashboard.checkedInToday ? 'YOU\'RE IN THE GYM' : 'READY TO TRAIN?'}
              </p>
              <p className="checkin-sublabel">
                {dashboard.checkedInToday
                  ? `Checked in at ${formatCheckedInTime(dashboard.checkedInAt)} — session is live`
                  : 'Tap to log your gym visit for today'}
              </p>
            </div>
          </div>
          <div className="checkin-card-right">
            {streakCount > 0 && (
              <div className="checkin-streak">
                <span className="streak-fire">🔥</span>
                <span className="streak-count">{streakCount}</span>
                <span className="streak-label">day{streakCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {!dashboard.checkedInToday ? (
              <button
                onClick={handleCheckIn}
                className="checkin-btn"
                disabled={checkingIn}
              >
                {checkingIn ? 'Checking in…' : 'Check In Now'}
              </button>
            ) : (
              <button
                onClick={() => navigate('/workout/today')}
                className="goto-workout-btn"
              >
                Today's Plan →
              </button>
            )}
          </div>
        </div>

        {/* Daily Motivation */}
        {dashboard.motivation?.quote && (
          <div className="motivation-card">
            <span className="motivation-tag">Daily Motivation</span>
            <blockquote className="motivation-quote">
              "{dashboard.motivation.quote}"
            </blockquote>
            <p className="motivation-author">— {dashboard.motivation.author}</p>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          {dashboard.stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Workouts */}
        <div className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Recent Sessions</h2>
            <button className="db-section-link" onClick={() => navigate('/workout/today')}>
              View plan →
            </button>
          </div>
          <div className="workouts-list">
            {dashboard.recentWorkouts.length > 0 ? (
              dashboard.recentWorkouts.map((workout, index) => (
                <div key={index} className="workout-row">
                  <div className="workout-row-icon">{workout.image}</div>
                  <div className="workout-row-info">
                    <p className="workout-row-name">{workout.name}</p>
                    <p className="workout-row-meta">{workout.date} · {workout.duration}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="db-empty-state">
                <span className="db-empty-icon">🏋️</span>
                <p>No sessions yet — check in to start logging your progress!</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Progress */}
        {dashboard.progress.length > 0 && (
          <div className="db-section">
            <h2 className="db-section-title">Monthly Progress</h2>
            <div className="progress-card">
              {dashboard.progress.map((item, index) => (
                <div key={index} className="progress-row">
                  <div className="progress-row-top">
                    <span className="progress-row-label">{item.label}</span>
                    <span className="progress-row-pct">{item.percent}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
