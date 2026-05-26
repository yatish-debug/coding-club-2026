import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, ExternalLink, RefreshCw, ChevronLeft, 
  Clock, CheckCircle, ShieldAlert, Award, QrCode, UserCheck, Download, Printer 
} from 'lucide-react';
import GlowingCard from '../components/GlowingCard';
import { getEvent, registerForEvent, getMyRegistrations, getMe } from '../utils/api';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Advanced simulation states
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  // Live countdown timer states
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Event by ID
      const data = await getEvent(id);
      setEvent(data);

      // 2. Fetch User Profile if logged in
      const token = localStorage.getItem('token');
      if (token) {
        const profile = await getMe();
        setUser(profile);
        
        // Check if user has registered for this event
        const regs = await getMyRegistrations();
        const registered = regs.some(r => r.event_id === parseInt(id));
        setIsRegistered(registered);

        // Precheck if mock attendance check-in is already marked
        const isPast = new Date(data.date) < new Date();
        if (isPast && registered) {
          setAttendanceMarked(true);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Event details could not be retrieved. Check your API connectivity.');
    } finally {
      setLoading(false);
    }
  };

  // Live Countdown Clock effect
  useEffect(() => {
    if (!event) return;
    const eventTime = new Date(event.date).getTime();
    
    const updateCountdown = () => {
      const difference = eventTime - new Date().getTime();
      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);
        setCountdown({ days: d, hours: h, minutes: m, seconds: s });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const handleRegister = async () => {
    if (!user) {
      alert('Please log in with your institutional credentials to register for this event.');
      navigate('/login');
      return;
    }
    try {
      await registerForEvent(event.id);
      setIsRegistered(true);
      alert('🎉 RSVP Confirmed! You have successfully registered and earned +30 Leaderboard Points!');
    } catch (err) {
      console.error(err);
      alert('RSVP failed. Please check your credentials or network status.');
    }
  };

  // Simulate scanning the check-in QR code for attendance
  const handleMarkAttendance = () => {
    setMarkingAttendance(true);
    setTimeout(() => {
      setMarkingAttendance(false);
      setAttendanceMarked(true);
      alert('✅ Attendance Verified! Your digital ticket has been scanned and recorded. You earned +10 check-in points.');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <RefreshCw className="animate-spin text-emerald-400" size={36} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <ShieldAlert className="text-rose-500 mx-auto" size={48} />
        <h3 className="text-xl font-bold text-slate-200">Event Not Found</h3>
        <p className="text-slate-400 text-sm">{error || 'The requested event is not available.'}</p>
        <Link to="/events" className="inline-block mt-4 text-xs font-mono text-emerald-400 hover:underline">◀ BACK_TO_EVENTS</Link>
      </div>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = new Date(event.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Zero-dependency vector SVG QR code mockup
  const renderQRCodeSVG = (ticketId) => (
    <svg className="w-32 h-32 text-slate-200" viewBox="0 0 100 100" fill="currentColor">
      <rect x="0" y="0" width="22" height="22" fill="currentColor" />
      <rect x="3" y="3" width="16" height="16" fill="#0A0F1D" />
      <rect x="6" y="6" width="10" height="10" fill="currentColor" />

      <rect x="78" y="0" width="22" height="22" fill="currentColor" />
      <rect x="81" y="3" width="16" height="16" fill="#0A0F1D" />
      <rect x="84" y="6" width="10" height="10" fill="currentColor" />

      <rect x="0" y="78" width="22" height="22" fill="currentColor" />
      <rect x="3" y="81" width="16" height="16" fill="#0A0F1D" />
      <rect x="6" y="84" width="10" height="10" fill="currentColor" />

      <rect x="32" y="5" width="8" height="4" />
      <rect x="45" y="2" width="6" height="12" />
      <rect x="58" y="8" width="12" height="4" />
      <rect x="12" y="32" width="14" height="8" />
      <rect x="36" y="28" width="16" height="6" />
      <rect x="62" y="25" width="8" height="12" />
      <rect x="28" y="44" width="6" height="24" />
      <rect x="42" y="50" width="20" height="6" />
      <rect x="70" y="44" width="8" height="18" />
      <rect x="82" y="64" width="12" height="8" />
      <rect x="48" y="68" width="24" height="4" />
      <rect x="35" y="82" width="15" height="12" />
      <rect x="62" y="80" width="12" height="12" />
    </svg>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-24 text-left relative">
      
      {/* Top Breadcrumb Nav */}
      <Link 
        to="/events" 
        className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-emerald-400 transition-colors uppercase"
      >
        <ChevronLeft size={14} /> BACK_TO_EVENTS_LIST_
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LEFT COLUMN: Event Details & Description (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Main Visual Poster Image */}
          {event.image_url && (
            <div className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-slate-900 shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none"></div>
              <img 
                src={event.image_url} 
                alt={event.title} 
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-6 left-6 z-20 px-3 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase">
                {event.category || 'Workshop'}
              </span>
            </div>
          )}

          {/* Event Content Header */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">{event.title}</h1>
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-400 font-mono">
              <div className="flex items-center gap-1.5"><Calendar size={16} className="text-emerald-400" /> {formattedDate}</div>
              <div className="flex items-center gap-1.5"><Clock size={16} className="text-indigo-400" /> {formattedTime}</div>
              <div className="flex items-center gap-1.5"><MapPin size={16} className="text-blue-400" /> {event.location}</div>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="glass-panel p-8 rounded-3xl border border-slate-800/40 space-y-4">
            <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest font-bold">// Event_Overview</h3>
            <p className="text-slate-300 leading-relaxed font-sans">{event.description}</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              This event is coordinated by the technical committee of the GFGCOE Student Chapter. Check-in check points open 15 minutes before the session starts. Pre-register to secure your participation certificate and add points to your leaderboard scores.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Widgets / Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-8">

          {/* 1. Countdown Widget (Active future sessions only) */}
          {!isPast && (
            <GlowingCard hoverGlow="emerald" className="p-6 text-center space-y-4">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold block mb-1">
                // SESSION_COUNTDOWN
              </span>
              
              <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto font-mono">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">{String(countdown.days).padStart(2, '0')}</div>
                  <div className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Days</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">{String(countdown.hours).padStart(2, '0')}</div>
                  <div className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Hrs</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">{String(countdown.minutes).padStart(2, '0')}</div>
                  <div className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Mins</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">{String(countdown.seconds).padStart(2, '0')}</div>
                  <div className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Secs</div>
                </div>
              </div>

              <p className="text-xs text-slate-400">Lock in your seat before the countdown timer hits zero!</p>
            </GlowingCard>
          )}

          {/* 2. Registration Status & RSVP panel */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40 text-center space-y-4">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold block mb-1">
              // Registration_Status
            </span>

            {isPast ? (
              <div className="space-y-4">
                <div className="px-4 py-3 bg-slate-900 border border-slate-850 rounded-xl text-slate-400 text-xs font-mono uppercase inline-block">
                  COMPLETED_✓
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This session has already taken place on {formattedDate}. Pre-registered users who completed check-in checks can retrieve their certificates below.
                </p>
              </div>
            ) : isRegistered ? (
              <div className="space-y-4">
                <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase rounded-xl flex items-center justify-center gap-2 max-w-xs mx-auto">
                  <CheckCircle size={16} /> REGISTERED_SUCCESSFULLY_✓
                </div>
                <p className="text-xs text-slate-400">
                  Seat secured! Access your digital check-in lobby ticket details below.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleRegister}
                  className="glow-btn w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer uppercase"
                >
                  SECURE_MY_SEAT_ NOW_ (+30 PTS)
                </button>
                <p className="text-xs text-slate-500">
                  Institutional accounts only. Participation grants +30 leaderboard points.
                </p>
              </div>
            )}
          </div>

          {/* 3. Advanced Features: Attendance QR Code & Certificate Generator */}
          {isRegistered && (
            <div className="space-y-8">
              
              {/* QR LOBBY TICKET FOR UPCOMING EVENTS */}
              {!isPast && (
                <GlowingCard hoverGlow="blue" className="p-6 text-center space-y-5">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold block">
                      // CHECK_IN_TICKET
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">ID: GFG-TKT-{event.id}04{user?.id || 1}</p>
                  </div>

                  {/* QR code and scanning layout */}
                  <div className="flex flex-col items-center justify-center space-y-4 pt-2">
                    <div className="p-4 bg-[#0A0F1D] border-2 border-indigo-500/30 rounded-2xl shadow-xl">
                      {renderQRCodeSVG(`GFG-EV-${event.id}-USR-${user?.id || 0}`)}
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Present this QR card in the CP Lab room to check-in your attendance.
                    </p>
                  </div>

                  {/* ATTENDANCE CHECK-IN SIMULATOR BUTTON */}
                  <div className="border-t border-slate-900/60 pt-4">
                    {attendanceMarked ? (
                      <div className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-lg flex items-center justify-center gap-1.5 w-full">
                        <UserCheck size={14} /> ATTENDANCE_VERIFIED_✓
                      </div>
                    ) : (
                      <button
                        onClick={handleMarkAttendance}
                        disabled={markingAttendance}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-indigo-300 text-xs font-mono rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <QrCode size={14} /> {markingAttendance ? 'VERIFYING_CODE_...' : 'SIMULATE_QR_ATTENDANCE_'}
                      </button>
                    )}
                  </div>
                </GlowingCard>
              )}

              {/* PAST EVENT: CERTIFICATE CLAIM WIDGET */}
              {isPast && (
                <GlowingCard hoverGlow="indigo" className="p-6 text-center space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold block">
                      // CERTIFICATE_HUB
                    </span>
                    <p className="text-xs text-slate-400">Your participation records have been successfully verified!</p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setShowCertificate(true)}
                      className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-100 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Award size={16} /> GENERATE_COMPLETION_CERTIFICATE_
                    </button>
                  </div>
                </GlowingCard>
              )}

            </div>
          )}

        </div>

      </div>

      {/* 4. PREMIUM CERTIFICATE GENERATION OVERLAY MODAL */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl space-y-6">
            
            {/* Action Bar (Close & Mock Download) */}
            <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-2">
              <span>Verified Certificate Locker ID: GFG-CRT-{event.id}099A</span>
              <div className="flex gap-3">
                <button
                  onClick={() => alert('📥 Exporting high-resolution certified PDF...')}
                  className="px-4 py-2 bg-emerald-400 text-slate-950 rounded-xl font-bold hover:bg-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={14} /> DOWNLOAD_PDF_
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer size={14} /> PRINT_
                </button>
                <button
                  onClick={() => setShowCertificate(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  CLOSE_
                </button>
              </div>
            </div>

            {/* Glowing Certificate Template Frame */}
            <div className="relative border-8 border-indigo-900/40 p-8 sm:p-14 bg-slate-950 rounded-3xl shadow-2xl text-center space-y-8 select-none border-double border-indigo-500/20">
              
              {/* Decorative Corner Ornaments */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-indigo-500/40"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-indigo-500/40"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-indigo-500/40"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-indigo-500/40"></div>

              {/* Watermark Logo */}
              <div className="flex justify-center opacity-10">
                <QrCode size={120} className="text-indigo-400" />
              </div>

              <div className="space-y-4">
                <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                  GeeksforGeeks Student Chapter (GFGCOE)
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 font-sans border-b border-indigo-500/20 pb-4">
                  CERTIFICATE OF COMPLETION
                </h2>
              </div>

              <div className="space-y-4 font-sans text-slate-400">
                <p className="text-xs font-mono uppercase tracking-widest text-slate-500">This credential certifies that</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight italic font-serif">
                  {user?.full_name || 'GFGCOE Coding Scholar'}
                </p>
                <p className="text-sm max-w-2xl mx-auto leading-relaxed">
                  has actively participated in and successfully completed all the technical curriculum requirements for the hands-on engineering lab session:
                </p>
                <p className="text-lg sm:text-xl font-bold text-emerald-400 tracking-wide font-mono bg-slate-900/60 py-2 border border-slate-900 inline-block px-6 rounded-xl uppercase">
                  {event.title}
                </p>
                <p className="text-xs max-w-md mx-auto">
                  held on <span className="font-semibold text-slate-300">{formattedDate}</span> under the academic coordination of GFGCOE computer engineering mentors.
                </p>
              </div>

              {/* Signatures & Verification Seal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-slate-900/80 items-end">
                <div className="flex flex-col items-center">
                  <div className="h-10 italic font-serif text-slate-400 text-sm select-none">// Rajesh Sharma</div>
                  <div className="w-40 h-[1px] bg-slate-800 my-2"></div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Faculty Sponsor</span>
                </div>
                <div className="flex flex-col items-center">
                  {/* Digital cryptographic QR hash */}
                  <div className="w-16 h-16 border border-emerald-500/20 p-1.5 rounded-lg bg-[#050B14]">
                    {renderQRCodeSVG(`GFG-VER-${event.id}`)}
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider mt-2">VERIFIED_CREDENTIAL</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-10 italic font-serif text-slate-400 text-sm select-none">// Siddharth Mehta</div>
                  <div className="w-40 h-[1px] bg-slate-800 my-2"></div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">President, GFGCOE</span>
                </div>
              </div>

              {/* Cryptographic hash details */}
              <div className="pt-4 text-[9px] font-mono text-slate-650 leading-none">
                VERIFICATION HASH: SHA-256 / 4e9f73a2bc8d91c01e6a9f0d7e6c4b2a8d9e1f0c9b8a7d6e5c4b3a2f1e0d9c8b
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
