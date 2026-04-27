import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState({
    checkedInToday: false,
    stats: [],
    progressImageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
    progress: [],
    recentWorkouts: [],
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
      setError('');
      const response = await api.post('/dashboard/check-in');
      setDashboard(response.data.dashboard);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Check-in failed');
    }
  };

  if (loading) {
    return <div className="dashboard-container"><div className="dashboard-content">Loading dashboard...</div></div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>💪 GymBro</h2>
        </div>
        <div className="nav-user">
          <span className="user-name">{user?.firstname} {user?.lastname}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome back, {user?.firstname}! 👋</h1>
          <p>Ready to crush your fitness goals today?</p>
          {error && <p style={{ color: '#dc2626', marginTop: '0.5rem' }}>{error}</p>}
        </div>

        <div className="quick-actions">
          <button 
            onClick={handleCheckIn} 
            className={`action-btn ${dashboard.checkedInToday ? 'checked-in' : 'check-in-btn'}`}
            disabled={dashboard.checkedInToday}
          >
            <span className="action-emoji" aria-hidden="true">🕒</span>
            <span className="action-label">{dashboard.checkedInToday ? 'Checked In' : 'Clock In'}</span>
          </button>
          <button
            onClick={() => navigate('/workout/today')}
            className="action-btn workout-btn desktop-only-action"
          >
            <span className="action-emoji" aria-hidden="true">🏋️</span>
            <span className="action-label">Today&apos;s Plan</span>
          </button>
          <button 
            onClick={() => navigate('/workout/new')}
            className="action-btn workout-btn desktop-only-action"
          >
            <span className="action-emoji" aria-hidden="true">➕</span>
            <span className="action-label">Workouts</span>
          </button>
          <button
            onClick={() => navigate('/workout/splits')}
            className="action-btn workout-btn desktop-only-action"
          >
            <span className="action-emoji" aria-hidden="true">🗓️</span>
            <span className="action-label">Splits</span>
          </button>
        </div>

        <div className="stats-grid">
          {dashboard.stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="progress-section">
          <h2>Your Progress</h2>
          <div className="progress-image-container">
            <div className="progress-image">
              <img 
                src={dashboard.progressImageUrl}
                alt="Gym Progress"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="placeholder-img">📊 Progress Chart</div>';
                }}
              />
            </div>
            <div className="progress-details">
              <h3>Monthly Overview</h3>
              {dashboard.progress.map((item, index) => (
                <div key={index} className="progress-item">
                  <span>{item.label}</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${item.percent}%` }}></div>
                  </div>
                  <span className="progress-percent">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="workouts-section">
          <h2>Recent Workouts</h2>
          <div className="workouts-list">
            {dashboard.recentWorkouts.map((workout, index) => (
              <div key={index} className="workout-card">
                <div className="workout-icon">{workout.image}</div>
                <div className="workout-info">
                  <h3>{workout.name}</h3>
                  <p>{workout.date} • {workout.duration}</p>
                </div>
              </div>
            ))}
            {dashboard.recentWorkouts.length === 0 && (
              <div className="workout-card">
                <div className="workout-info">
                  <h3>No workouts yet</h3>
                  <p>Start a session to see your live history here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
