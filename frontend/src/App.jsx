import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Projects from './pages/Projects';
import Committee from './pages/Committee';
import Resources from './pages/Resources';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Leaderboard from './pages/Leaderboard';
import { getMe } from './utils/api';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Sync dark/light theme state with document element
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('light', savedTheme === 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  // Sync auth state on startup
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setAuthLoading(true);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const profile = await getMe();
        setUser(profile);
      } catch (err) {
        console.error('Auth check failure', err);
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Guard routing component
  const ProtectedRoute = ({ children }) => {
    if (authLoading) return null; // Wait for profile resolution
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 dark:bg-slate-950 light:bg-slate-50 transition-colors duration-300">
        
        {/* Navigation panel */}
        <Navbar 
          theme={theme} 
          toggleTheme={toggleTheme} 
          user={user} 
          onLogout={handleLogout} 
        />

        {/* Primary Page views */}
        <main className="flex-grow pt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/committee" element={<Committee />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route 
              path="/resources" 
              element={
                <ProtectedRoute>
                  <Resources />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/login" 
              element={user ? <Navigate to="/admin" replace /> : <Login onLoginSuccess={checkAuth} />} 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Fallback redirector */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global footer */}
        <Footer />
        
      </div>
    </Router>
  );
}
