import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const REGULAR_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: 'home' },
  { path: '/workout/new', label: 'Workouts', icon: 'plus' },
  { path: '/workout/today', label: "Today's Plan", icon: 'plan', priority: true },
  { path: '/workout/splits', label: 'Splits', icon: 'grid' },
  { path: '/profile', label: 'Profile', icon: 'person' },
];

const ADMIN_NAV = [
  { path: '/admin/users', label: 'Members', icon: 'users' },
  { path: '/profile', label: 'Profile', icon: 'person' },
];

const NavIcon = ({ type }) => {
  if (type === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    );
  }

  if (type === 'plan') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="4" width="14" height="16" rx="2.5" ry="2.5" />
        <path d="M9 9h6M9 13h6" />
      </svg>
    );
  }

  if (type === 'plus') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (type === 'users') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="17" cy="8" r="2.2" />
        <path d="M21 20c0-2.5-1.8-4.5-4-4.5" />
      </svg>
    );
  }

  if (type === 'person') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="7.5" r="3.5" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="7" cy="7" r="1.6" />
      <circle cx="17" cy="7" r="1.6" />
      <circle cx="7" cy="17" r="1.6" />
      <circle cx="17" cy="17" r="1.6" />
    </svg>
  );
};

function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const NAV_ITEMS = user?.role === 'super admin' ? ADMIN_NAV : REGULAR_NAV;

  return (
    <div className="mobile-bottom-nav" role="navigation" aria-label="Quick workout navigation"
      style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))` }}>
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`mobile-nav-btn ${item.priority ? 'priority' : ''} ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="mobile-nav-icon" aria-hidden="true">
              <NavIcon type={item.icon} />
            </span>
            <span className="sr-only">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default MobileBottomNav;
