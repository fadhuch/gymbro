import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MobileBottomNav from './components/MobileBottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import Dashboard from './pages/Dashboard';
import TodaysWorkout from './pages/TodaysWorkout';
import AddWorkout from './pages/AddWorkout';
import ManageSplits from './pages/ManageSplits';

function RouteTransitionLoader() {
  const location = useLocation();
  const isFirstRender = useRef(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setShow(true);
    const hideTimer = setTimeout(() => setShow(false), 420);

    return () => clearTimeout(hideTimer);
  }, [location.pathname]);

  return (
    <div className={`route-loader ${show ? 'active' : ''}`} aria-hidden="true">
      <div className="route-loader-bar" />
    </div>
  );
}

function PrivateShell({ children }) {
  return (
    <>
      <RouteTransitionLoader />
      {children}
      <MobileBottomNav />
    </>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="app-loading-screen">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// For routes that require active membership (user role only)
function MemberRoute({ children }) {
  const { isAuthenticated, isMembershipActive, membershipLoaded, user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading-screen">Loading...</div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role === 'user' && !membershipLoaded) {
    return <div className="app-loading-screen">Loading...</div>;
  }
  if (!isMembershipActive) return <Navigate to="/profile" />;
  return children;
}

// For super admin-only pages
function SuperAdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading-screen">Loading...</div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'super admin') return <Navigate to="/dashboard" />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isMembershipActive, membershipLoaded, user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return children;
  }

  if (user?.role === 'user' && !membershipLoaded) {
    return <div className="app-loading-screen">Loading...</div>;
  }

  const shouldGoToProfile = user?.role === 'user' && !isMembershipActive;

  return <Navigate to={shouldGoToProfile ? '/profile' : '/dashboard'} />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route
            path="/profile"
            element={<PrivateRoute><PrivateShell><Profile /></PrivateShell></PrivateRoute>}
          />
          <Route
            path="/dashboard"
            element={<MemberRoute><PrivateShell><Dashboard /></PrivateShell></MemberRoute>}
          />
          <Route
            path="/workout/today"
            element={<MemberRoute><PrivateShell><TodaysWorkout /></PrivateShell></MemberRoute>}
          />
          <Route
            path="/workout/new"
            element={<MemberRoute><PrivateShell><AddWorkout /></PrivateShell></MemberRoute>}
          />
          <Route
            path="/workout/splits"
            element={<MemberRoute><PrivateShell><ManageSplits /></PrivateShell></MemberRoute>}
          />
          <Route
            path="/admin/users"
            element={<SuperAdminRoute><PrivateShell><AdminUsers /></PrivateShell></SuperAdminRoute>}
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
