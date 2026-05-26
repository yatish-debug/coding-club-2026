import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Users, Calendar, Award, Code, ArrowRight, ExternalLink, Megaphone, Pin } from 'lucide-react';
import CodeWindow from '../components/CodeWindow';
import GlowingCard from '../components/GlowingCard';
import { getEvents, getAnnouncements } from '../utils/api';

export default function Home() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load events
        const eventsData = await getEvents();
        const now = new Date();
        const upcoming = eventsData
          .filter(e => new Date(e.date) >= now)
          .slice(0, 2);
        setUpcomingEvents(upcoming.length > 0 ? upcoming : eventsData.slice(0, 2));

        // Load announcements (top 3)
        const annData = await getAnnouncements();
        setAnnouncements(annData.slice(0, 3));
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = [
    { label: 'Active Coders', count: '500+', icon: <Users className="text-emerald-400" size={24} /> },
    { label: 'Events Completed', count: '50+', icon: <Calendar className="text-indigo-400" size={24} /> },
    { label: 'Projects Engineered', count: '20+', icon: <Code className="text-blue-400" size={24} /> },
    { label: 'Hackathons Won', count: '15+', icon: <Award className="text-amber-400" size={24} /> },
  ];

  return (
    <div className="space-y-24 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Taglines */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide font-mono uppercase">
                <Terminal size={14} /> GFGCOE_Coding_Club.init()
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Empowering College <br />
                <span className="text-gradient">Minds to Code</span> & Innovate
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0">
                Welcome to the premier student developers community of GFGCOE. We organize hackathons, coordinate open source campaigns, solve DSA sheets, and engineer high-quality full-stack applications.
              </p>
              
              {/* Call-to-actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/events"
                  className="glow-btn w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-all text-center flex items-center justify-center gap-2 cursor-pointer font-mono"
                >
                  EXPLORE_EVENTS_ <ArrowRight size={16} />
                </Link>
                <Link
                  to="/about"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-200 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-300 hover:bg-slate-900 text-center transition-all cursor-pointer font-mono"
                >
                  // ABOUT_US
                </Link>
              </div>
            </div>

            {/* Right Terminal Window */}
            <div className="lg:col-span-5 w-full flex justify-center animate-fade-in">
              <CodeWindow />
            </div>
          </div>
        </div>
      </section>

      {/* 2. ANNOUNCEMENTS NOTICEBOARD SECTION */}
      {announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              <Megaphone size={18} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-200">
              Latest Bulletin Board
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {announcements.map((ann) => (
              <GlowingCard 
                key={ann.id} 
                hoverGlow={ann.is_pinned ? "emerald" : "indigo"} 
                className="flex flex-col justify-between min-h-[180px] relative overflow-hidden"
              >
                {ann.is_pinned && (
                  <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                    <div className="absolute top-2 right-2 p-1 bg-emerald-400/10 border border-emerald-400/20 rounded text-emerald-400" title="Pinned Announcement">
                      <Pin size={12} className="fill-emerald-400" />
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 pr-6">
                  <div className="text-[10px] font-mono text-slate-500">
                    {new Date(ann.date_created).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h3 className="text-base font-bold text-slate-200 line-clamp-1">{ann.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">{ann.content}</p>
                </div>
                
                <div className="pt-3 border-t border-slate-900/60 mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>CLUB_BROADCAST</span>
                  {ann.is_pinned && <span className="text-emerald-400 font-semibold font-mono">PINNED_</span>}
                </div>
              </GlowingCard>
            ))}
          </div>
        </section>
      )}

      {/* 3. CLUB STATISTICS SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl py-10 px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/60 border border-slate-800/50 shadow-xl shadow-slate-950/20">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center text-center p-4 lg:p-2 ${
                idx > 1 ? 'pt-8 lg:pt-2' : ''
              }`}
            >
              <div className="p-3 bg-slate-900/40 rounded-2xl border border-slate-800/30 mb-3 hover:scale-110 transition-transform duration-300">
                {stat.icon}
              </div>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
                {stat.count}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 mt-1 font-mono uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. UPCOMING EVENTS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              📆 Upcoming <span className="text-emerald-400">Club Sessions</span>
            </h2>
            <p className="text-sm text-slate-400">
              Never miss a workshop, coding contest, or hackathon. Join us live!
            </p>
          </div>
          <Link
            to="/events"
            className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm flex items-center gap-1 group font-mono"
          >
            VIEW_ALL_EVENTS <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="glass-panel h-64 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl">
            <p className="text-slate-400 font-mono">NO_UPCOMING_EVENTS_FOUND</p>
            <p className="text-xs text-slate-500 mt-1">Check back later or view our past sessions!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {upcomingEvents.map((event) => {
              const eventDate = new Date(event.date);
              const formattedDate = eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const formattedTime = eventDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <GlowingCard key={event.id} hoverGlow="emerald" className="flex flex-col justify-between min-h-[260px]">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-wide uppercase">
                        {event.category || 'Workshop'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {formattedDate} @ {formattedTime}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold tracking-tight text-slate-100">
                        {event.title}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-900/60 mt-6 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-mono">
                      📍 {event.location}
                    </span>
                    {event.registration_link ? (
                      <a
                        href={event.registration_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 font-mono shadow-md shadow-emerald-500/5 cursor-pointer"
                      >
                        REGISTER_ <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-indigo-400 font-mono">REGISTRATION_CLOSED</span>
                    )}
                  </div>
                </GlowingCard>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. REASON TO JOIN GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Why Join <span className="text-emerald-400">GFGCOE Coding Club</span>?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            We offer the perfect environment for engineering, networking, and cracking tough interview rounds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/40 hover:border-indigo-500/20 transition-all duration-300">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
              <Code size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Weekly Coding Meets</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              We gather weekly to solve complex algos, review data structures, and prepare for tier-1 company rounds.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/40 hover:border-emerald-500/20 transition-all duration-300">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
              <Terminal size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Live Project Collaborations</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Join teams building live web assets, Android programs, and machine learning scrapers for college needs.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/40 hover:border-blue-500/20 transition-all duration-300">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
              <Users size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Robust Mentor Support</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Direct guidance from senior coordinators and Alumni currently engineering at BigTech giants.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
