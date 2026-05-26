import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Mail, ArrowRight, Heart } from 'lucide-react';
import { Github, Linkedin, Twitter } from './Icons';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="relative bg-slate-950 border-t border-slate-900 pt-16 pb-8 transition-colors duration-300">
      {/* Background radial highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 pb-12 border-b border-slate-900">
          
          {/* Column 1: Info & Brand */}
          <div className="md:col-span-1.5 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                <Terminal size={18} />
              </div>
              <span className="text-lg font-bold text-slate-100">
                GFG<span className="text-emerald-400">COE</span> Coding Club
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm">
              Empowering college minds through cutting-edge technology. Collaborating, creating open-source projects, and tackling coding hurdles together.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-900 hover:scale-105 transition-all duration-200"
              >
                <Github size={16} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-900 hover:scale-105 transition-all duration-200"
              >
                <Linkedin size={16} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-900 hover:scale-105 transition-all duration-200"
              >
                <Twitter size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono">
              // Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { name: 'Home', path: '/' },
                { name: 'About Us', path: '/about' },
                { name: 'Events', path: '/events' },
                { name: 'Projects', path: '/projects' },
                { name: 'Committee', path: '/committee' },
                { name: 'Resources', path: '/resources' },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-slate-400 hover:text-emerald-400 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono">
              // Contact Us
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-emerald-400" />
                <span>codingclub@gfgcoe.org</span>
              </li>
              <li>
                <p className="leading-relaxed">
                  GFGCOE Tech Campus,<br />
                  Academic Block B, Room 304,<br />
                  Pune, Maharashtra - 411001
                </p>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono">
              // Club Newsletter
            </h4>
            <p className="text-sm text-slate-400">
              Get notified of hackathons, weekly coding challenges, and study resources.
            </p>
            {subscribed ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium font-mono text-center">
                SUBSCRIBED_SUCCESSFULLY
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 py-2 text-sm text-slate-100 placeholder-slate-500 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 w-full"
                />
                <button
                  type="submit"
                  className="p-2.5 text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-slate-500 font-mono">
          <p>© {new Date().getFullYear()} GFGCOE Coding Club. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart size={12} className="text-emerald-500 fill-emerald-500 animate-pulse" /> by GFGCOE Web Team
          </p>
        </div>
      </div>
    </footer>
  );
}
