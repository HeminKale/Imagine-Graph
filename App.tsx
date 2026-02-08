import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function AppRouter() {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState<{ path: string; params?: Record<string, string> }>({ path: '/' });

  useEffect(() => {
    const parseRoute = () => {
      const hash = window.location.hash.slice(1) || '/';

      if (hash === '/login') {
        setRoute({ path: '/login' });
      } else if (hash === '/dashboard') {
        setRoute({ path: '/dashboard' });
      } else if (hash === '/' || hash === '') {
        setRoute({ path: '/' });
      } else {
        setRoute({ path: '/' });
      }
    };

    parseRoute();
    window.addEventListener('hashchange', parseRoute);
    return () => window.removeEventListener('hashchange', parseRoute);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user && (route.path === '/dashboard')) {
        window.location.hash = '#/login';
      } else if (user && (route.path === '/login' || route.path === '/')) {
        window.location.hash = '#/dashboard';
      }
    }
  }, [user, loading, route.path]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-cyan-900 to-blue-950 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-orb"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-orb" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80 font-medium">Loading SOLARIS...</p>
        </div>
      </div>
    );
  }

  if (route.path === '/') {
    return <LandingPage />;
  }

  if (route.path === '/login') {
    return <Login />;
  }

  if (!user) {
    return <LandingPage />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
