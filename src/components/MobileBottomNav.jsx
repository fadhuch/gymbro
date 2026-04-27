import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'home' },
  { path: '/workout/today', label: "Today's Plan", icon: 'plan', priority: true },
  { path: '/workout/new', label: 'Workouts', icon: 'plus' },
  { path: '/workout/splits', label: 'Splits', icon: 'grid' },
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

  return (
    <div className="mobile-bottom-nav" role="navigation" aria-label="Quick workout navigation">
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
