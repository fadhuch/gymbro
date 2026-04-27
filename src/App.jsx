import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MobileBottomNav from './components/MobileBottomNav';
import Login from './pages/Login';
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

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="app-loading-screen">Loading...</div>;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route
            path="/dashboard"
            element={<PrivateRoute><PrivateShell><Dashboard /></PrivateShell></PrivateRoute>}
          />
          <Route
            path="/workout/today"
            element={<PrivateRoute><PrivateShell><TodaysWorkout /></PrivateShell></PrivateRoute>}
          />
          <Route
            path="/workout/new"
            element={<PrivateRoute><PrivateShell><AddWorkout /></PrivateShell></PrivateRoute>}
          />
          <Route
            path="/workout/splits"
            element={<PrivateRoute><PrivateShell><ManageSplits /></PrivateShell></PrivateRoute>}
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
