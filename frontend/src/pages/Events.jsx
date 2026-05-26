import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import GlowingCard from '../components/GlowingCard';
import { getEvents, registerForEvent, getMyRegistrations } from '../utils/api';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [justRegisteredId, setJustRegisteredId] = useState(null);

  useEffect(() => {
    fetchEventsAndRegistrations();
  }, []);

  const fetchEventsAndRegistrations = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);

      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        const regs = await getMyRegistrations();
        setMyRegistrations(regs.map(r => r.event_id));
      }
    } catch (err) {
      console.error('Failed to load events/registrations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await registerForEvent(eventId);
      setJustRegisteredId(eventId);
      setMyRegistrations((prev) => [...prev, eventId]);
      alert('🎉 Registration Confirmed! You have successfully RSVPed and earned +30 Leaderboard Points!');
      setTimeout(() => setJustRegisteredId(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to register. Please ensure you are logged in using institutional credentials.');
    }
  };

  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.date) >= now);
  const pastEvents = events.filter(e => new Date(e.date) < now);

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 pb-20 text-left relative">
      
      {/* Dynamic point popup */}
      {justRegisteredId && (
        <div className="fixed bottom-10 right-10 bg-emerald-400 text-slate-900 px-6 py-4 rounded-2xl font-mono font-bold shadow-2xl z-50 animate-bounce flex items-center gap-2 border border-emerald-300">
          <CheckCircle2 size={20} /> EVENT_RSVP_CONFIRMED (+30 PTS)
        </div>
      )}

      {/* Page Title Header */}
      <div className="space-y-4">
        <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
          // CLUB_CALENDAR
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Club <span className="text-emerald-400">Events & Sessions</span>
        </h1>
        <p className="text-slate-400 max-w-xl">
          Participate in our interactive coding labs, hackathons, seminars, and networking sessions. Accelerate your engineering journey.
        </p>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex gap-4 border-b border-slate-900/60 pb-1">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-4 px-1 text-sm font-semibold tracking-wide border-b-2 font-mono transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          UPCOMING_SESSIONS ({upcomingEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-4 px-1 text-sm font-semibold tracking-wide border-b-2 font-mono transition-all cursor-pointer ${
            activeTab === 'past'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          PAST_LABS ({pastEvents.length})
        </button>
      </div>

      {/* Events list content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <RefreshCw className="animate-spin text-emerald-400" size={32} />
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-slate-800/40">
          <p className="text-slate-400 font-mono">NO_EVENTS_REGISTERED_IN_THIS_CATEGORY</p>
          <p className="text-xs text-slate-500 mt-1">Please inspect alternate tabs or refresh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayedEvents.map((event) => {
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

            const isAlreadyRegistered = myRegistrations.includes(event.id);

            return (
              <GlowingCard key={event.id} hoverGlow="emerald" className="flex flex-col md:flex-row gap-6 min-h-[220px]">
                {event.image_url && (
                  <div className="w-full md:w-44 h-40 rounded-xl overflow-hidden border border-slate-800/40 shrink-0">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="flex flex-col justify-between flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono tracking-wide uppercase">
                        {event.category || 'Workshop'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Calendar size={12} /> {formattedDate}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-100">
                      {event.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                      {event.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-900/60 flex flex-wrap justify-between items-center gap-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <MapPin size={12} /> {event.location}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/events/${event.id}`}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 text-[11px] font-bold rounded-lg font-mono transition-all uppercase"
                      >
                        Details_
                      </Link>
                      {activeTab === 'upcoming' ? (
                        isAlreadyRegistered ? (
                          <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-lg font-mono">
                            REGISTERED_✓
                          </span>
                        ) : isLoggedIn ? (
                          <button
                            onClick={() => handleRegister(event.id)}
                            className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 font-mono cursor-pointer"
                          >
                            RSVP_
                          </button>
                        ) : event.registration_link ? (
                          <a
                            href={event.registration_link}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 font-mono cursor-pointer"
                          >
                            RSVP_ <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-[11px] text-indigo-400 font-mono">CLOSED</span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">COMPLETED_✓</span>
                      )}
                    </div>
                  </div>
                </div>
              </GlowingCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
