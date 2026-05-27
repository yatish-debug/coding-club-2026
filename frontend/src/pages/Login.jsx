import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, ShieldAlert, ArrowRight, Lock, User, PlusCircle, CheckCircle2, Search, Info } from 'lucide-react';
import { loginUser, guestRegister, getGuestStatus } from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [view, setView] = useState('login'); // 'login', 'register', 'status'
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Register form state
  const [regForm, setRegForm] = useState({
    fullName: '',
    collegeName: '',
    branch: '',
    academicYear: 'First Year',
    username: '',
    password: ''
  });
  const [regSuccess, setRegSuccess] = useState(null);

  // Status check state
  const [statusUsername, setStatusUsername] = useState('');
  const [statusResult, setStatusResult] = useState(null);

  const navigate = useNavigate();

  // Login handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Auto-complete domain suffix if not specified for convenience
    let loginUsername = username;
    if (loginUsername && !loginUsername.includes('@') && loginUsername !== 'admin' && loginUsername !== 'core_member') {
      loginUsername = `${loginUsername}@gfgcoe.codingclub.in`;
    }

    try {
      const data = await loginUser(loginUsername, password);
      localStorage.setItem('token', data.access_token);
      onLoginSuccess();
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Incorrect credentials or unapproved account.');
    } finally {
      setLoading(false);
    }
  };

  // Register guest handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setRegSuccess(null);

    try {
      const payload = {
        full_name: regForm.fullName,
        college_name: regForm.collegeName,
        branch: regForm.branch,
        academic_year: regForm.academicYear,
        username: regForm.username.toLowerCase().trim(),
        password: regForm.password
      };
      await guestRegister(payload);
      setRegSuccess(`Request submitted successfully! Your account username is: "${regForm.username}". Admin will review your join request.`);
      setRegForm({
        fullName: '',
        collegeName: '',
        branch: '',
        academicYear: 'First Year',
        username: '',
        password: ''
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit registration request.');
    } finally {
      setLoading(false);
    }
  };

  // Status checker handler
  const handleCheckStatus = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setStatusResult(null);

    try {
      const data = await getGuestStatus(statusUsername.toLowerCase().trim());
      setStatusResult(data);
    } catch (err) {
      console.error(err);
      setError('Error checking request status. Verify username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6 text-left">
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mb-2">
          <Terminal size={32} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          GFGCOE <span className="text-emerald-400">Coding Club</span>
        </h1>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          {view === 'login' ? 'SECURE_ACCESS_VERIFICATION' : view === 'register' ? 'GUEST_JOIN_REGISTRATION' : 'REQUEST_STATUS_INQUIRY'}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 p-1 bg-slate-900 border border-slate-800 rounded-xl">
        <button 
          onClick={() => { setView('login'); setError(null); setRegSuccess(null); setStatusResult(null); }}
          className={`py-2 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer ${view === 'login' ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/15' : 'text-slate-400 hover:text-emerald-400'}`}
        >
          LOGIN
        </button>
        <button 
          onClick={() => { setView('register'); setError(null); setRegSuccess(null); setStatusResult(null); }}
          className={`py-2 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer ${view === 'register' ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/15' : 'text-slate-400 hover:text-emerald-400'}`}
        >
          JOIN CLUB
        </button>
        <button 
          onClick={() => { setView('status'); setError(null); setRegSuccess(null); setStatusResult(null); }}
          className={`py-2 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer ${view === 'status' ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/15' : 'text-slate-400 hover:text-emerald-400'}`}
        >
          STATUS
        </button>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/5 blur-[30px] pointer-events-none"></div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-semibold font-mono mb-6">
            <ShieldAlert size={16} /> {error}
          </div>
        )}

        {regSuccess && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-emerald-400 text-xs font-semibold font-mono mb-6">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> 
            <div>{regSuccess}</div>
          </div>
        )}

        {/* VIEW 1: LOGIN */}
        {view === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 font-mono tracking-wider uppercase">
                // CLUB_EMAIL_ID_OR_USERNAME
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="username or username@gfgcoe.codingclub.in"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-slate-100 placeholder-slate-650 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 font-mono tracking-wider uppercase">
                // SECRET_PASSWORD
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-slate-100 placeholder-slate-650 text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glow-btn w-full py-3.5 rounded-xl text-sm font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-all font-mono flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? 'AUTHENTICATING_...' : 'VERIFY_IDENTITY_'} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* VIEW 2: REGISTER GUEST */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">// FULL_NAME</label>
              <input
                type="text"
                required
                placeholder="Enter full name..."
                value={regForm.fullName}
                onChange={(e) => setRegForm({...regForm, fullName: e.target.value})}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-100 placeholder-slate-650 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">// COLLEGE_NAME</label>
                <input
                  type="text"
                  required
                  placeholder="College name..."
                  value={regForm.collegeName}
                  onChange={(e) => setRegForm({...regForm, collegeName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-100 placeholder-slate-650 text-xs focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">// BRANCH</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE, IT"
                  value={regForm.branch}
                  onChange={(e) => setRegForm({...regForm, branch: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-100 placeholder-slate-650 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">// ACADEMIC_YEAR</label>
              <select
                value={regForm.academicYear}
                onChange={(e) => setRegForm({...regForm, academicYear: e.target.value})}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="First Year">First Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Final Year">Final Year</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">// DESIRED_USERNAME</label>
              <input
                type="text"
                required
                placeholder="Choose username (e.g. ronaldo7)..."
                value={regForm.username}
                onChange={(e) => setRegForm({...regForm, username: e.target.value})}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-100 placeholder-slate-650 text-xs focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">// CHOOSE_PASSWORD</label>
              <input
                type="password"
                required
                placeholder="Choose password..."
                value={regForm.password}
                onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-100 placeholder-slate-650 text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 font-mono flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              {loading ? 'SUBMITTING_...' : 'SUBMIT_JOIN_REQUEST_'} <PlusCircle size={14} />
            </button>
          </form>
        )}

        {/* VIEW 3: CHECK STATUS */}
        {view === 'status' && (
          <div className="space-y-6">
            <form onSubmit={handleCheckStatus} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 font-mono tracking-wider uppercase">
                  // ENTER_SUBMITTED_USERNAME
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter username (e.g. ronaldo7)..."
                    value={statusUsername}
                    onChange={(e) => setStatusUsername(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-slate-100 placeholder-slate-650 text-sm focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 font-mono flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? 'QUERYING_DATABASE_...' : 'QUERY_APPROVAL_STATUS_'}
              </button>
            </form>

            {statusResult && (
              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-3 font-mono text-left">
                <h4 className="text-xs font-bold border-b border-slate-900 pb-2 text-slate-300 flex items-center gap-1.5">
                  <Info size={14} className="text-emerald-400" /> STATUS_INQUIRY_RESPONSE:
                </h4>
                
                {statusResult.status === 'not_found' ? (
                  <div className="text-xs text-rose-450 italic">
                    ❌ No approval request was found for this username. Make sure you typed it correctly or submit a new join request.
                  </div>
                ) : (
                  <div className="text-xs space-y-2">
                    <div><span className="text-slate-500">FULL NAME :</span> <span className="text-slate-350">{statusResult.full_name}</span></div>
                    <div><span className="text-slate-500">COLLEGE   :</span> <span className="text-slate-350">{statusResult.college_name}</span></div>
                    <div>
                      <span className="text-slate-500">APPROVAL  :</span>{' '}
                      {statusResult.status === 'pending' ? (
                        <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-500/10">PENDING_REVIEW ⏳</span>
                      ) : statusResult.status === 'approved' ? (
                        <span className="text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/10">APPROVED_ACCESS ✅</span>
                      ) : (
                        <span className="text-rose-400 font-semibold bg-rose-400/10 px-2 py-0.5 rounded border border-rose-500/10">REJECTED ❌</span>
                      )}
                    </div>

                    {statusResult.status === 'approved' && (
                      <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 leading-relaxed">
                        🎉 **Congratulations!** Your request has been approved. You are now an active club member.
                        <div className="mt-2 font-bold text-slate-100">
                          Your Login ID is: <code className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800 text-emerald-400 text-xs">{statusResult.username}@gfgcoe.codingclub.in</code>
                        </div>
                        Use this ID and your chosen password to log in under the **LOGIN** tab.
                      </div>
                    )}
                    {statusResult.status === 'rejected' && (
                      <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[11px] text-rose-400 leading-relaxed">
                        ⚠️ **Notice:** Your join request was not accepted by the administrator. Contact faculty coordinators for feedback.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>      
    </div>
  );
}
