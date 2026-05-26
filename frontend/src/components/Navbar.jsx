import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, Terminal, LogOut } from 'lucide-react';

export default function Navbar({ theme, toggleTheme, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const routes = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Events', path: '/events' },
    { name: 'Projects', path: '/projects' },
    { name: 'Committee', path: '/committee' },
    { name: 'Resources', path: '/resources' },
    { name: 'Leaderboard', path: '/leaderboard' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-nav sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-300">
              <Terminal size={22} className="group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900">
                GFG<span className="text-emerald-400">COE</span>
              </span>
              <span className="text-[10px] tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono -mt-1 uppercase">
                Coding Club
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {routes.map((route) => (
              <Link
                key={route.name}
                to={route.path}
                className={`relative px-1 py-2 text-sm font-medium tracking-wide transition-colors duration-200 ${
                  isActive(route.path)
                    ? 'text-emerald-400 font-semibold'
                    : 'text-slate-300 dark:text-slate-300 light:text-slate-600 hover:text-emerald-400 light:hover:text-emerald-500'
                }`}
              >
                {route.name}
                {isActive(route.path) && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-400 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Hand Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-desktop"
              onClick={toggleTheme}
              className="p-2 text-slate-300 hover:text-emerald-400 bg-slate-800/40 border border-slate-700/50 rounded-lg hover:bg-slate-800 transition-all duration-200 cursor-pointer light:text-slate-700 light:hover:text-emerald-500 light:bg-slate-200/50 light:border-slate-300/50"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Login / Admin Action */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/admin"
                  className="px-4 py-2 text-xs font-semibold text-emerald-400 border border-emerald-500/30 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 transition-all duration-200"
                >
                  Admin Panel
                </Link>
                <button
                  onClick={onLogout}
                  className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-all duration-200 cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="glow-btn px-5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all duration-200 font-mono shadow-lg shadow-emerald-500/10"
              >
                LOGIN_
              </Link>
            )}
          </div>

          {/* Mobile Action Controls */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Theme Toggle */}
            <button
              id="theme-toggle-mobile"
              onClick={toggleTheme}
              className="p-2 text-slate-300 hover:text-emerald-400 bg-slate-800/40 border border-slate-700/50 rounded-lg cursor-pointer light:text-slate-700 light:bg-slate-200/50 light:border-slate-300"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Mobile Hamburger menu */}
            <button
              id="mobile-menu-button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-300 hover:text-emerald-400 bg-slate-800/40 border border-slate-700/50 rounded-lg cursor-pointer light:text-slate-700 light:bg-slate-200/50 light:border-slate-300"
              aria-label="Open Navigation Menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Panel */}
      {isOpen && (
        <div className="md:hidden glass-panel border-t border-slate-800/50 animate-fade-in absolute w-full left-0 z-40">
          <div className="px-2 pt-3 pb-4 space-y-1 sm:px-3">
            {routes.map((route) => (
              <Link
                key={route.name}
                to={route.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive(route.path)
                    ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400 pl-3'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400 pl-4 light:text-slate-700 light:hover:bg-slate-100'
                }`}
              >
                {route.name}
              </Link>
            ))}

            {/* Authenticated Links inside drawer */}
            {user ? (
              <>
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 pl-4"
                >
                  Admin Panel
                </Link>
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-rose-500/10 pl-4 cursor-pointer"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-center mx-3 mt-4 py-2.5 rounded-lg text-sm font-semibold font-mono text-slate-900 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/10"
              >
                LOGIN_
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
