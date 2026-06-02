import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Medal, 
  Award, 
  Star, 
  Compass, 
  Search, 
  Flame, 
  Users, 
  Lock, 
  CheckCircle,
  HelpCircle,
  Code,
  Clock,
  ExternalLink,
  PlusCircle,
  FileText,
  Image,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Github } from '../components/Icons';
import { 
  getLeaderboard, 
  getMyGamification, 
  getContests, 
  submitPointClaim, 
  getMyClaims,
  getCodingProfiles,
  getCommitteeLeaderboard
} from '../utils/api';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('ranking'); // 'ranking', 'contests', 'achievements'
  const [timeframe, setTimeframe] = useState('all_time'); // 'all_time', 'weekly', 'monthly'
  const [rankingType, setRankingType] = useState('points'); // 'points' or 'coding'
  const [leaderboard, setLeaderboard] = useState([]);
  const [codingProfiles, setCodingProfiles] = useState([]);
  const [committeeLeaderboard, setCommitteeLeaderboard] = useState([]);
  const [contests, setContests] = useState([]);
  const [myGamification, setMyGamification] = useState(null);
  const [myClaims, setMyClaims] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guest contest participation states
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestData, setGuestData] = useState({ fullName: '', collegeName: '', branch: '', academicYear: 'First Year' });
  const [currentContestId, setCurrentContestId] = useState(null);
  const [joinedContests, setJoinedContests] = useState({});

  // Point claim modal states
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimForm, setClaimForm] = useState({ githubLink: '', screenshotUrl: '', proofDescription: '', pointsClaimed: 20 });
  const [claimSuccess, setClaimSuccess] = useState(null);

  // Interactive Quiz & Coding Submission States
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [codingSubmissions, setCodingSubmissions] = useState({});
  const [submissionLoading, setSubmissionLoading] = useState({});

  const handleSelectOption = (questionId, optionLetter) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionLetter
    }));
  };

  const handleQuizSubmitAnswer = (q) => {
    const selected = selectedAnswers[q.id];
    if (!selected) {
      alert("Please select an option first!");
      return;
    }
    const isCorrect = q.correct_option === selected;
    setQuizResults(prev => ({
      ...prev,
      [q.id]: { selected, isCorrect }
    }));

    if (isCorrect) {
      alert(`🎉 Correct! Excellent job. You earned +${q.positive_points} Points!`);
      if (myGamification) {
        setMyGamification(prev => ({
          ...prev,
          points: prev.points + q.positive_points
        }));
      }
    } else {
      const penalty = q.negative_points || 0;
      alert(`❌ Incorrect answer. The correct option was ${q.correct_option}.${penalty > 0 ? ` Deducted -${penalty} Penalty Points.` : ""}`);
      if (penalty > 0 && myGamification) {
        setMyGamification(prev => ({
          ...prev,
          points: Math.max(0, prev.points - penalty)
        }));
      }
    }
  };

  const handleCodingSubmit = (q, codeText, fileName) => {
    if (!codeText.trim() && !fileName) {
      alert("Please write code or upload a solution file first!");
      return;
    }
    setSubmissionLoading(prev => ({ ...prev, [q.id]: true }));
    setTimeout(() => {
      setSubmissionLoading(prev => ({ ...prev, [q.id]: false }));
      setCodingSubmissions(prev => ({
        ...prev,
        [q.id]: { submitted: true, codeText, fileName: fileName || "solution.py" }
      }));
      alert(`🎉 Solution Accepted! Your code passed all hidden testcases successfully. You earned +${q.positive_points} Points!`);
      if (myGamification) {
        setMyGamification(prev => ({
          ...prev,
          points: prev.points + q.positive_points
        }));
      }
    }, 2000);
  };

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, [token, timeframe, activeTab]);

  useEffect(() => {
    // Load local storage states for guest participation
    const savedGuest = localStorage.getItem('guest_participant');
    if (savedGuest) {
      setGuestData(JSON.parse(savedGuest));
    }
    const savedJoined = localStorage.getItem('joined_contests');
    if (savedJoined) {
      setJoinedContests(JSON.parse(savedJoined));
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'ranking') {
        const lbData = await getLeaderboard(timeframe);
        setLeaderboard(lbData);
        try {
          const profiles = await getCodingProfiles();
          setCodingProfiles(profiles);
        } catch (pErr) {
          console.error("Failed to fetch coding profiles", pErr);
        }
      } else if (activeTab === 'contests') {
        const cData = await getContests();
        setContests(cData);
      } else if (activeTab === 'committee-coding') {
        try {
          const committeeLb = await getCommitteeLeaderboard();
          setCommitteeLeaderboard(committeeLb);
        } catch (cLbErr) {
          console.error("Failed to fetch committee leaderboard", cLbErr);
        }
      }

      if (token) {
        const myData = await getMyGamification();
        setMyGamification(myData);
        const claims = await getMyClaims();
        setMyClaims(claims);
      }
    } catch (err) {
      console.error('Error fetching gamification data:', err);
      setError('Could not fetch data. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Filter leaderboard users by search query
  const filteredLeaderboard = leaderboard.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCommitteeLeaderboard = committeeLeaderboard.filter(p => 
    p.user_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.user_fullname && p.user_fullname.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.user_position && p.user_position.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Divide leaderboard into podium (Top 3) and standard rows
  const podiumUsers = filteredLeaderboard.slice(0, 3);
  const standardUsers = filteredLeaderboard.slice(3);

  // Helper to resolve rank tiers based on points
  const getRankTier = (points) => {
    if (points >= 300) return { name: 'Platinum Champion 💎', color: 'text-indigo-400', border: 'border-indigo-500/50', bg: 'bg-indigo-500/10' };
    if (points >= 200) return { name: 'Gold Tier 👑', color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10' };
    if (points >= 100) return { name: 'Silver Tier ⭐', color: 'text-slate-300', border: 'border-slate-400/50', bg: 'bg-slate-400/10' };
    return { name: 'Bronze Tier 🧭', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' };
  };

  // Helper to determine points required for next rank milestone
  const getNextRankMilestone = (points) => {
    if (points >= 300) return { next: 'Max Level achieved!', pointsNeeded: 0, percentage: 100 };
    if (points >= 200) {
      const needed = 300 - points;
      const pct = ((points - 200) / 100) * 100;
      return { next: 'Platinum Champion 💎', pointsNeeded: needed, percentage: Math.min(100, Math.max(0, pct)) };
    }
    if (points >= 100) {
      const needed = 200 - points;
      const pct = ((points - 100) / 100) * 100;
      return { next: 'Gold Tier 👑', pointsNeeded: needed, percentage: Math.min(100, Math.max(0, pct)) };
    }
    const needed = 100 - points;
    const pct = (points / 100) * 100;
    return { next: 'Silver Tier ⭐', pointsNeeded: needed, percentage: Math.min(100, Math.max(0, pct)) };
  };

  // Handle guest participation request
  const handleContestParticipate = (contestId) => {
    if (token) {
      // Members are automatically signed in, just log their join locally
      const updated = { ...joinedContests, [contestId]: true };
      setJoinedContests(updated);
      localStorage.setItem('joined_contests', JSON.stringify(updated));
      return;
    }

    // Guest workflow
    const savedGuest = localStorage.getItem('guest_participant');
    if (savedGuest) {
      // Guest data already exists
      const updated = { ...joinedContests, [contestId]: true };
      setJoinedContests(updated);
      localStorage.setItem('joined_contests', JSON.stringify(updated));
    } else {
      // Show guest details pop-up
      setCurrentContestId(contestId);
      setShowGuestModal(true);
    }
  };

  // Save guest registration details
  const submitGuestDetails = (e) => {
    e.preventDefault();
    localStorage.setItem('guest_participant', JSON.stringify(guestData));
    const updated = { ...joinedContests, [currentContestId]: true };
    setJoinedContests(updated);
    localStorage.setItem('joined_contests', JSON.stringify(updated));
    setShowGuestModal(false);
  };

  // Submit point claim request
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimSuccess(null);
    try {
      const payload = {
        github_link: claimForm.githubLink,
        screenshot_url: claimForm.screenshotUrl,
        proof_description: claimForm.proofDescription,
        points_claimed: parseInt(claimForm.pointsClaimed)
      };
      await submitPointClaim(payload);
      setClaimSuccess("Point claim submitted successfully! Admin will verify and award points.");
      setClaimForm({ githubLink: '', screenshotUrl: '', proofDescription: '', pointsClaimed: 20 });
      const claims = await getMyClaims();
      setMyClaims(claims);
    } catch (err) {
      console.error(err);
      setError("Failed to submit challenge claim. Try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header Panel */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
          Club <span className="text-gradient">Leaderboard</span> & Contests
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 dark:text-slate-400 light:text-slate-600">
          Compete in live coding contests, complete development tasks, log daily streaks, and watch your name ascend the podium!
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex justify-center mb-8">
        <div className="flex p-1 bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-200/80 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-300 rounded-xl">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'ranking'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-emerald-400 light:hover:text-emerald-600'
            }`}
          >
            <Trophy size={14} /> Standings
          </button>
          <button
            onClick={() => setActiveTab('committee-coding')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'committee-coding'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-emerald-400 light:hover:text-emerald-600'
            }`}
          >
            <Medal size={14} /> Committee Coding Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('contests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'contests'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-emerald-400 light:hover:text-emerald-600'
            }`}
          >
            <Code size={14} /> Coding Contests
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-emerald-400 light:hover:text-emerald-600'
            }`}
          >
            <Award size={14} /> My Profile
          </button>
        </div>
      </div>

      {/* Main Viewport Card */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-mono">LOADING_GAMIFICATION_DATA...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center max-w-xl mx-auto rounded-2xl border-rose-500/20">
          <HelpCircle size={48} className="mx-auto text-rose-400 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold mb-2">Service Error</h3>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg hover:bg-emerald-300 transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* TAB 1: RANKINGS */}
          {activeTab === 'ranking' && (
            <div className="space-y-12 animate-fade-in">
              
              {/* Podium (Shown if list is not filtered empty) */}
              {podiumUsers.length > 0 && searchQuery === '' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6 px-4">
                  
                  {/* SECOND PLACE (SILVER) */}
                  {podiumUsers[1] && (
                    <div className="order-2 md:order-1 flex flex-col items-center">
                      <div className="glass-panel relative w-full p-6 text-center rounded-2xl border-slate-400/30 hover:border-slate-400/60 transition-all duration-300 group hover:-translate-y-2 bg-slate-900/40">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-slate-400 text-slate-900 border-4 border-slate-950 flex items-center justify-center font-bold text-lg shadow-lg">
                          2
                        </div>
                        <div className="mt-4 flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-400/50 flex items-center justify-center mb-3">
                            <span className="text-2xl font-mono text-slate-300 uppercase">
                              {podiumUsers[1].username.slice(0, 2)}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-100 truncate max-w-full">
                            {podiumUsers[1].full_name || podiumUsers[1].username}
                          </h3>
                          <p className="text-xs text-slate-400 mb-2">@{podiumUsers[1].username}</p>
                          
                          <div className="flex gap-2 items-center">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-400/10 border border-slate-400/20 text-slate-300 text-xs font-bold font-mono">
                              <Medal size={11} /> {podiumUsers[1].points} PTS
                            </div>
                            {podiumUsers[1].streak > 0 && (
                              <span className="text-xs font-bold text-orange-500 animate-pulse flex items-center" title="Activity Streak">
                                🔥{podiumUsers[1].streak}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block w-32 h-16 bg-slate-800/40 border-t border-x border-slate-700/50 rounded-t-lg mt-3 text-center pt-2 font-mono text-slate-400 text-sm">
                        SILVER
                      </div>
                    </div>
                  )}

                  {/* FIRST PLACE (GOLD) */}
                  {podiumUsers[0] && (
                    <div className="order-1 md:order-2 flex flex-col items-center">
                      <div className="glass-panel relative w-full p-8 text-center rounded-2xl border-amber-400/40 hover:border-amber-400/80 transition-all duration-300 group hover:-translate-y-3 shadow-lg shadow-amber-500/5 bg-slate-900/60">
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-amber-400 text-slate-950 border-4 border-slate-950 flex items-center justify-center font-bold text-xl shadow-xl animate-pulse">
                          1
                        </div>
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-amber-400 animate-bounce">
                          <Trophy size={28} />
                        </div>
                        <div className="mt-4 flex flex-col items-center">
                          <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-amber-400/50 flex items-center justify-center mb-4 relative shadow-inner">
                            <span className="text-3xl font-mono text-amber-400 uppercase">
                              {podiumUsers[0].username.slice(0, 2)}
                            </span>
                            <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 text-slate-950 text-xs font-bold rounded-full flex items-center justify-center">
                              👑
                            </span>
                          </div>
                          <h3 className="font-extrabold text-slate-100 text-lg truncate max-w-full">
                            {podiumUsers[0].full_name || podiumUsers[0].username}
                          </h3>
                          <p className="text-xs text-slate-400 mb-3">@{podiumUsers[0].username}</p>

                          <div className="flex gap-2 items-center">
                            <div className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-bold font-mono">
                              <Flame size={13} className="animate-pulse" /> {podiumUsers[0].points} PTS
                            </div>
                            {podiumUsers[0].streak > 0 && (
                              <span className="text-xs font-bold text-orange-500 animate-bounce flex items-center" title="Activity Streak">
                                🔥{podiumUsers[0].streak}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block w-36 h-24 bg-slate-800/60 border-t border-x border-slate-600/50 rounded-t-lg mt-3 text-center pt-3 font-mono text-amber-400 text-sm font-extrabold">
                        CHAMPION
                      </div>
                    </div>
                  )}

                  {/* THIRD PLACE (BRONZE) */}
                  {podiumUsers[2] && (
                    <div className="order-3 flex flex-col items-center">
                      <div className="glass-panel relative w-full p-6 text-center rounded-2xl border-amber-700/30 hover:border-amber-700/60 transition-all duration-300 group hover:-translate-y-2 bg-slate-900/40">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-amber-700 text-slate-100 border-4 border-slate-950 flex items-center justify-center font-bold text-lg shadow-lg">
                          3
                        </div>
                        <div className="mt-4 flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-700/50 flex items-center justify-center mb-3">
                            <span className="text-2xl font-mono text-amber-600 uppercase">
                              {podiumUsers[2].username.slice(0, 2)}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-100 truncate max-w-full">
                            {podiumUsers[2].full_name || podiumUsers[2].username}
                          </h3>
                          <p className="text-xs text-slate-400 mb-2">@{podiumUsers[2].username}</p>

                          <div className="flex gap-2 items-center">
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-700/10 border border-amber-700/20 text-amber-600 text-xs font-bold font-mono">
                              <Award size={11} /> {podiumUsers[2].points} PTS
                            </div>
                            {podiumUsers[2].streak > 0 && (
                              <span className="text-xs font-bold text-orange-500 animate-pulse flex items-center" title="Activity Streak">
                                🔥{podiumUsers[2].streak}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block w-32 h-12 bg-slate-800/40 border-t border-x border-slate-700/50 rounded-t-lg mt-3 text-center pt-1 font-mono text-amber-700 text-sm">
                        BRONZE
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Leaderboard Table Panel */}
              <div className="glass-panel max-w-5xl mx-auto rounded-2xl overflow-hidden">
                
                {/* Search Bar section & Timeframe Filters */}
                <div className="p-4 sm:p-6 border-b border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col items-start gap-2 text-left">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Users size={18} className="text-emerald-400" /> Member Standings
                    </h3>
                    
                    {/* Dynamic Dual Standings Selector */}
                    <div className="flex p-0.5 bg-slate-950 border border-slate-850 rounded-lg">
                      <button
                        onClick={() => setRankingType('points')}
                        className={`px-3 py-1 text-[10px] sm:text-xs font-mono font-bold rounded-md transition-colors cursor-pointer ${
                          rankingType === 'points'
                            ? 'bg-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/10'
                            : 'text-slate-400 hover:text-emerald-400'
                        }`}
                      >
                        GAMIFICATION_POINTS
                      </button>
                      <button
                        onClick={() => setRankingType('coding')}
                        className={`px-3 py-1 text-[10px] sm:text-xs font-mono font-bold rounded-md transition-colors cursor-pointer ${
                          rankingType === 'coding'
                            ? 'bg-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/10'
                            : 'text-slate-400 hover:text-emerald-400'
                        }`}
                      >
                        COMPETITIVE_STANDINGS
                      </button>
                    </div>
                  </div>
                  
                  {/* LeetCode timeframes */}
                  {rankingType === 'points' && (
                    <div className="flex p-0.5 bg-slate-950 border border-slate-850 rounded-lg">
                      {['all_time', 'weekly', 'monthly'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`px-3 py-1.5 text-[10px] sm:text-xs font-mono font-bold rounded-md transition-colors cursor-pointer ${
                            timeframe === tf
                              ? 'bg-emerald-400 text-slate-950'
                              : 'text-slate-400 hover:text-emerald-400'
                          }`}
                        >
                          {tf.replace('_', ' ').toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="relative w-full md:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search member name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-100 transition-colors"
                    />
                  </div>
                </div>

                {/* Table view */}
                {rankingType === 'points' ? (
                  filteredLeaderboard.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-mono text-sm">
                      NO_RESULTS_FOUND_FOR_SEARCH
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-800/50 text-xs tracking-wider text-slate-400 font-mono">
                            <th className="py-4 px-6 text-center w-20">RANK</th>
                            <th className="py-4 px-6">MEMBER</th>
                            <th className="py-4 px-6 text-center">BADGES</th>
                            <th className="py-4 px-6 text-right w-36">POINTS ({timeframe.toUpperCase()})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeaderboard.map((user, idx) => {
                            const isTop3 = user.rank <= 3;
                            const tier = getRankTier(user.points);
                            
                            return (
                              <tr 
                                key={user.id} 
                                className={`border-b border-slate-900/60 hover:bg-slate-900/20 transition-colors group ${
                                  token && myGamification && myGamification.rank === user.rank 
                                    ? 'bg-emerald-400/5 border-l-4 border-l-emerald-400' 
                                    : ''
                                }`}
                              >
                                <td className="py-4 px-6 text-center font-bold">
                                  {user.rank === 1 ? (
                                    <span className="text-xl">🥇</span>
                                  ) : user.rank === 2 ? (
                                    <span className="text-xl">🥈</span>
                                  ) : user.rank === 3 ? (
                                    <span className="text-xl">🥉</span>
                                  ) : (
                                    <span className="text-slate-400 font-mono text-sm">#{user.rank}</span>
                                  )}
                                </td>
                                
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs uppercase ${
                                      isTop3 ? 'bg-slate-800 text-slate-200 border border-slate-700/50' : 'bg-slate-950 text-slate-400 border border-slate-850'
                                    }`}>
                                      {user.username.slice(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                                        {user.full_name || user.username}
                                        {user.streak > 0 && (
                                          <span className="text-orange-500 font-bold text-xs flex items-center gap-0.5" title={`${user.streak} Day Active Streak!`}>
                                            🔥{user.streak}
                                          </span>
                                        )}
                                        {token && myGamification && myGamification.rank === user.rank && (
                                          <span className="text-[10px] bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-semibold">YOU</span>
                                        )}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-500">@{user.username}</span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-4 px-6 text-center">
                                  <div className="flex flex-wrap justify-center gap-1.5">
                                    {user.badges && user.badges.length > 0 ? (
                                      user.badges.map((badge, bIdx) => (
                                        <span 
                                          key={bIdx} 
                                          className="inline-block text-[10px] font-semibold font-mono bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-350"
                                        >
                                          {badge}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] font-mono text-slate-650 italic">None</span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-4 px-6 text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="font-bold font-mono text-emerald-400 text-sm">
                                      {user.points} PTS
                                    </span>
                                    <span className={`text-[10px] font-semibold ${tier.color}`}>
                                      {tier.name.split(' ')[0]} Tier
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  // COMPETITIVE CODING PROFILE STANDINGS TABLE
                  codingProfiles.filter(p => 
                    p.user_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.user_fullname && p.user_fullname.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-mono text-sm">
                      NO_COMPETITIVE_PROFILES_FOUND
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-800/50 text-xs tracking-wider text-slate-400 font-mono">
                            <th className="py-4 px-6 text-center w-20">RANK</th>
                            <th className="py-4 px-6">MEMBER</th>
                            <th className="py-4 px-6 text-center">GITHUB</th>
                            <th className="py-4 px-6 text-center">LEETCODE</th>
                            <th className="py-4 px-6 text-center">CODEFORCES</th>
                            <th className="py-4 px-6 text-center">GFG</th>
                            <th className="py-4 px-6 text-right w-36">CODING_SCORE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {codingProfiles
                            .filter(p => 
                              p.user_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (p.user_fullname && p.user_fullname.toLowerCase().includes(searchQuery.toLowerCase()))
                            )
                            .sort((a, b) => b.coding_score - a.coding_score)
                            .map((p, idx) => {
                              const isTop3 = idx < 3;
                              return (
                                <tr key={p.id} className="border-b border-slate-900/60 hover:bg-slate-900/20 transition-colors">
                                  <td className="py-4 px-6 text-center font-bold">
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                  </td>
                                  <td className="py-4 px-6 font-bold text-slate-200">
                                    <div className="flex flex-col text-left">
                                      <span>{p.user_fullname || p.user_username}</span>
                                      <span className="text-[10px] font-mono text-slate-500">@{p.user_username}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center font-mono text-xs text-slate-400">
                                    {p.github_username ? (
                                      <a href={`https://github.com/${p.github_username}`} target="_blank" rel="noreferrer" className="text-emerald-450 hover:underline">
                                        {p.github_commits} Commits
                                      </a>
                                    ) : '-'}
                                  </td>
                                  <td className="py-4 px-6 text-center font-mono text-xs text-slate-400">
                                    {p.leetcode_username ? (
                                      <span>{p.leetcode_solved} Solved</span>
                                    ) : '-'}
                                  </td>
                                  <td className="py-4 px-6 text-center font-mono text-xs text-slate-400">
                                    {p.codeforces_username ? (
                                      <span>{p.codeforces_rating} Max</span>
                                    ) : '-'}
                                  </td>
                                  <td className="py-4 px-6 text-center font-mono text-xs text-slate-400">
                                    {p.gfg_username ? (
                                      <span>{p.gfg_solved} Solved</span>
                                    ) : '-'}
                                  </td>
                                  <td className="py-4 px-6 text-right font-mono font-bold text-emerald-400">
                                    {p.coding_score} PTS
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 4: COMMITTEE CODING LEADERBOARD */}
          {activeTab === 'committee-coding' && (
            <div className="space-y-8 animate-fade-in text-left max-w-5xl mx-auto">
              
              {/* Leaderboard Stats Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl flex items-center gap-3.5 bg-slate-900/30">
                  <div className="p-3.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                    <Users size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-500">MEMBERS TRACKED</span>
                    <span className="text-lg font-black text-slate-100 font-mono">
                      {filteredCommitteeLeaderboard.length} Tracked
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl flex items-center gap-3.5 bg-slate-900/30">
                  <div className="p-3.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                    <Trophy size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-500">TOP STANDING</span>
                    <span className="text-sm font-bold text-slate-100 truncate max-w-[150px]">
                      {filteredCommitteeLeaderboard[0] ? (filteredCommitteeLeaderboard[0].user_fullname || filteredCommitteeLeaderboard[0].user_username) : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl flex items-center gap-3.5 bg-slate-900/30">
                  <div className="p-3.5 bg-emerald-400/10 rounded-xl text-emerald-400 border border-emerald-500/20 animate-pulse">
                    <Code size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-500">PEAK CODING SCORE</span>
                    <span className="text-lg font-black text-slate-100 font-mono">
                      {filteredCommitteeLeaderboard.length > 0 ? Math.max(...filteredCommitteeLeaderboard.map(p => p.coding_score)) : 0} PTS
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl flex items-center gap-3.5 bg-slate-900/30">
                  <div className="p-3.5 bg-indigo-500/10 rounded-xl text-indigo-450 border border-indigo-550/20">
                    <Star size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-500">MAX COMMITS</span>
                    <span className="text-lg font-black text-slate-100 font-mono">
                      {filteredCommitteeLeaderboard.length > 0 ? Math.max(...filteredCommitteeLeaderboard.map(p => p.github_commits || 0)) : 0} Commits
                    </span>
                  </div>
                </div>
              </div>

              {/* Committee Table Viewport */}
              <div className="glass-panel rounded-2xl overflow-hidden">
                
                {/* Search Bar / Header */}
                <div className="p-4 sm:p-6 border-b border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col items-start gap-1 text-left">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Medal size={18} className="text-emerald-400 animate-pulse" /> Committee Leaderboard
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      // OFFICIAL_COMMITTEE_TECHNICAL_STANDINGS
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search committee member..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-100 transition-colors"
                    />
                  </div>
                </div>

                {filteredCommitteeLeaderboard.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-sm">
                    NO_COMMITTEE_MEMBERS_FOUND
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/60 border-b border-slate-800/50 text-xs tracking-wider text-slate-400 font-mono">
                          <th className="py-4 px-6 text-center w-20">RANK</th>
                          <th className="py-4 px-6">MEMBER NAME</th>
                          <th className="py-4 px-6 text-center">POSITION</th>
                          <th className="py-4 px-6 text-center">CODING SCORE</th>
                          <th className="py-4 px-6 text-center">CONTEST SCORE</th>
                          <th className="py-4 px-6 text-center">GITHUB SCORE</th>
                          <th className="py-4 px-6 text-right w-36">OVERALL SCORE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCommitteeLeaderboard.map((member, idx) => {
                          const isTop3 = idx < 3;
                          const rankEmoji = idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                          const rowHighlight = token && myGamification && myGamification.username === member.user_username;

                          return (
                            <tr 
                              key={member.id} 
                              className={`border-b border-slate-900/60 hover:bg-slate-900/30 transition-colors group ${
                                rowHighlight ? 'bg-emerald-400/5 border-l-4 border-l-emerald-400' : ''
                              }`}
                            >
                              <td className="py-4 px-6 text-center font-bold">
                                {rankEmoji ? (
                                  <span className="text-xl">{rankEmoji}</span>
                                ) : (
                                  <span className="text-slate-400 font-mono text-sm">#{idx + 1}</span>
                                )}
                              </td>

                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs uppercase ${
                                    isTop3 ? 'bg-slate-800 text-slate-200 border border-slate-700/50' : 'bg-slate-950 text-slate-400 border border-slate-850'
                                  }`}>
                                    {member.user_username.slice(0, 2)}
                                  </div>
                                  <div className="flex flex-col text-left">
                                    <span className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-sans">
                                      {member.user_fullname || member.user_username}
                                      {rowHighlight && (
                                        <span className="text-[10px] bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-semibold">YOU</span>
                                      )}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">@{member.user_username}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6 text-center">
                                <span className={`inline-block text-[10px] font-bold font-mono px-2.5 py-1 rounded-full ${
                                  member.user_position.toLowerCase().includes('admin') 
                                    ? 'bg-rose-500/10 text-rose-455 border border-rose-500/20' 
                                    : member.user_position.toLowerCase().includes('coordinator') 
                                    ? 'bg-amber-500/10 text-amber-455 border border-amber-500/20' 
                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                }`}>
                                  {member.user_position.toUpperCase()}
                                </span>
                              </td>

                              <td className="py-4 px-6 text-center font-mono text-xs text-slate-300">
                                <div className="flex flex-col items-center justify-center">
                                  <span className="font-bold">{member.coding_score} PTS</span>
                                  <div className="flex gap-1 mt-1 text-[9px] text-slate-500">
                                    {member.leetcode_username && <span title="LeetCode solved count">LC: {member.leetcode_solved || 0}</span>}
                                    {member.codeforces_username && <span title="Codeforces rating">CF: {member.codeforces_rating || 0}</span>}
                                    {member.gfg_username && <span title="GeeksforGeeks solved count">GFG: {member.gfg_solved || 0}</span>}
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6 text-center font-mono text-xs text-slate-350">
                                {member.contest_score} PTS
                              </td>

                              <td className="py-4 px-6 text-center font-mono text-xs text-slate-350">
                                <div className="flex flex-col items-center justify-center">
                                  <span>{member.contribution_score} PTS</span>
                                  {member.github_username && (
                                    <span className="text-[9px] text-slate-550">
                                      {member.github_commits || 0} Commits
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-4 px-6 text-right">
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-500/20 text-emerald-450 text-xs font-bold font-mono shadow-md shadow-emerald-500/5">
                                  {member.overall_score} PTS
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CODING CONTESTS & COMPETITIONS */}
          {activeTab === 'contests' && (
            <div className="space-y-8 animate-fade-in max-w-5xl mx-auto text-left">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Code className="text-emerald-400" /> Active Club Contests
                </h3>
                
                {/* Submit Points Claim shortcut */}
                {token && (
                  <button
                    onClick={() => { setShowClaimModal(true); setClaimSuccess(null); }}
                    className="glow-btn px-4 py-2 bg-emerald-400 hover:bg-emerald-350 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle size={14} /> Submit Points Claim
                  </button>
                )}
              </div>

              {contests.length === 0 ? (
                <div className="glass-panel p-12 text-center text-slate-500 font-mono rounded-2xl">
                  💻 No active contests scheduled. Check bulletins tab later!
                </div>
              ) : (
                <div className="space-y-6">
                  {contests.map((contest) => {
                    const isJoined = joinedContests[contest.id];
                    const startTime = new Date(contest.start_time).toLocaleString();
                    const isActive = contest.is_active;

                    return (
                      <div 
                        key={contest.id}
                        className={`glass-panel p-6 rounded-2xl border border-slate-800/40 relative overflow-hidden transition-all ${
                          isJoined ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5' : ''
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-500/5 blur-[40px] pointer-events-none"></div>

                        {/* Title & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 border-b border-slate-900 pb-4">
                          <div>
                            <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded mb-2 ${
                              isActive ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {isActive ? 'ACTIVE_COMPETITION' : 'INACTIVE'}
                            </span>
                            
                            <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded mb-2 ml-2 uppercase ${
                              contest.category === 'quiz' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              contest.category === 'comp' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {contest.category === 'quiz' ? 'MCQ_QUIZ' : contest.category === 'comp' ? 'COMPETITION' : 'DSA_CONTEST'}
                            </span>

                            <h4 className="text-xl font-extrabold text-slate-100 leading-tight">
                              {contest.title}
                            </h4>
                          </div>

                          <div className="flex flex-col sm:items-end font-mono text-xs text-slate-400 gap-1.5">
                            <span className="flex items-center gap-1"><Clock size={12} /> Duration: {contest.duration_minutes} Minutes</span>
                            <span className="flex items-center gap-1"><Calendar size={12} /> Starts: {startTime}</span>
                          </div>
                        </div>

                        <p className="text-sm text-slate-350 mb-6 leading-relaxed">
                          {contest.description}
                        </p>

                        {/* Contest Questions list */}
                        {isJoined ? (
                          <div className="space-y-4">
                            <h5 className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase mb-2">// CONTEST_CHALLENGES:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {contest.questions && contest.questions.length > 0 ? (
                                contest.questions.map((q) => (
                                  <div key={q.id} className="p-5 bg-slate-950/80 border border-slate-900 rounded-2xl space-y-4 flex flex-col justify-between text-left relative overflow-hidden">
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-start">
                                        <h6 className="font-extrabold text-slate-200 text-sm">{q.title}</h6>
                                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 text-[9px] font-mono uppercase tracking-wider text-slate-400">
                                          {q.question_type || 'coding'}
                                        </span>
                                      </div>
                                      
                                      <p className="text-xs text-slate-400 leading-relaxed">{q.description}</p>

                                      {/* QUESTION TYPE 1: MCQ QUIZ OPTIONS */}
                                      {q.question_type === 'quiz' && q.options && (
                                        <div className="space-y-2 pt-2 text-left">
                                          <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">// QUIZ_OPTIONS:</span>
                                          <div className="space-y-1.5">
                                            {q.options.split(',').map((opt, oIdx) => {
                                              const optionLetter = String.fromCharCode(65 + oIdx); // A, B, C, D
                                              const isSelected = selectedAnswers[q.id] === optionLetter;
                                              const result = quizResults[q.id];
                                              const isSubmitted = !!result;
                                              const isThisCorrect = q.correct_option === optionLetter;
                                              
                                              return (
                                                <button
                                                  key={oIdx}
                                                  disabled={isSubmitted}
                                                  onClick={() => handleSelectOption(q.id, optionLetter)}
                                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                                                    isSubmitted
                                                      ? isThisCorrect
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450 font-bold'
                                                        : result.selected === optionLetter
                                                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold'
                                                          : 'bg-slate-950 border-slate-900 text-slate-500'
                                                      : isSelected
                                                        ? 'bg-emerald-400/10 border-emerald-400 text-emerald-400 font-bold'
                                                        : 'bg-slate-950 border-slate-900/60 hover:border-slate-800 text-slate-400'
                                                  }`}
                                                >
                                                  <span className="font-mono bg-slate-900 border border-slate-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0">{optionLetter}</span>
                                                  <span className="truncate">{opt.trim()}</span>
                                                </button>
                                              );
                                            })}
                                          </div>

                                          {!quizResults[q.id] ? (
                                            <button
                                              onClick={() => handleQuizSubmitAnswer(q)}
                                              className="mt-3 w-full py-2 bg-emerald-400 hover:bg-emerald-350 text-slate-950 font-bold text-xs font-mono rounded-lg transition-colors cursor-pointer"
                                            >
                                              SUBMIT_MCQ_ANSWER_
                                            </button>
                                          ) : (
                                            <div className={`mt-3 p-2 rounded-lg text-center font-mono text-[10px] font-bold border ${
                                              quizResults[q.id].isCorrect
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
                                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                            }`}>
                                              {quizResults[q.id].isCorrect ? '✓ CORRECT ANSWER (+PTS AWARDED)' : '✗ INCORRECT ANSWER'}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* QUESTION TYPE 2: DSA CODING SUBMISSION */}
                                      {(q.question_type === 'coding' || !q.question_type) && (
                                        <div className="space-y-3 pt-2 text-left">
                                          <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">// CODE_SUBMISSION_SANDBOX:</span>
                                          
                                          {codingSubmissions[q.id] ? (
                                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-2">
                                              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                                                <span>✓ STATUS: ACCEPTED</span>
                                                <span>{codingSubmissions[q.id].fileName}</span>
                                              </div>
                                              <pre className="text-[10px] font-mono p-2.5 bg-slate-950/80 border border-slate-900 rounded-lg text-slate-400 overflow-x-auto max-h-36">
                                                {codingSubmissions[q.id].codeText || "# File submitted successfully."}
                                              </pre>
                                            </div>
                                          ) : (
                                            <div className="space-y-2.5">
                                              <textarea
                                                rows={4}
                                                placeholder="// Paste or write solution code here...
def solve():
    # Write solution"
                                                id={`code-${q.id}`}
                                                className="w-full p-2.5 bg-slate-950 border border-slate-900 rounded-lg text-[10px] font-mono text-slate-300 focus:outline-none focus:border-emerald-500/60"
                                              />
                                              
                                              <div className="flex items-center gap-3">
                                                <div className="relative overflow-hidden shrink-0">
                                                  <input
                                                    type="file"
                                                    id={`file-upload-${q.id}`}
                                                    className="hidden"
                                                    onChange={(e) => {
                                                      const file = e.target.files[0];
                                                      if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (evt) => {
                                                          const ta = document.getElementById(`code-${q.id}`);
                                                          if (ta) ta.value = evt.target.result;
                                                        };
                                                        reader.readAsText(file);
                                                      }
                                                    }}
                                                  />
                                                  <label
                                                    htmlFor={`file-upload-${q.id}`}
                                                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer block"
                                                  >
                                                    UPLOAD_FILE_
                                                  </label>
                                                </div>
                                                
                                                <button
                                                  disabled={submissionLoading[q.id]}
                                                  onClick={() => {
                                                    const ta = document.getElementById(`code-${q.id}`);
                                                    const text = ta ? ta.value : "";
                                                    handleCodingSubmit(q, text, "solution.py");
                                                  }}
                                                  className="flex-1 py-1.5 bg-emerald-400 hover:bg-emerald-350 text-slate-950 font-bold text-[10px] font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                                >
                                                  {submissionLoading[q.id] ? (
                                                    <>
                                                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                                      RUNNING_TESTS...
                                                    </>
                                                  ) : (
                                                    "SUBMIT_SOLUTION_CODE_"
                                                  )}
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="border-t border-slate-900/60 pt-3 flex flex-wrap gap-1.5 text-[9px] font-mono shrink-0">
                                      <span className="bg-emerald-400/5 border border-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">+{q.positive_points} PTS</span>
                                      {q.negative_points > 0 && <span className="bg-rose-500/5 border border-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded">-{q.negative_points} Penalty</span>}
                                      {q.bonus_points > 0 && <span className="bg-indigo-500/5 border border-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded">+{q.bonus_points} Bonus</span>}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 p-4 text-center text-xs font-mono text-slate-500 bg-slate-950/60 border border-slate-900 rounded-xl">
                                  No questions released for this contest yet.
                                </div>
                              )}
                            </div>
                            
                            {/* Solve Submission Note */}
                            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 leading-relaxed font-mono">
                              💡 **Submission Guideline:** Submit your solutions to these challenges in your preferred language. Once solved, click **"Submit Points Claim"** at the top to upload your GitHub repositories, screenshots, and claim points!
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/50 border border-slate-900 rounded-xl mt-4">
                            <div className="text-xs text-slate-400 font-mono">
                              🔒 Click Participate to unlock challenges, question details, and the points claim form!
                            </div>
                            <button
                              onClick={() => handleContestParticipate(contest.id)}
                              disabled={!isActive}
                              className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-350 text-slate-950 font-extrabold rounded-lg text-xs font-mono transition-colors cursor-pointer"
                            >
                              ENTER_CONTEST_
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFILE & MY ACHIEVEMENTS */}
          {activeTab === 'achievements' && (
            <div className="space-y-10 animate-fade-in">
              {token ? (
                myGamification && (
                  <div className="max-w-5xl mx-auto space-y-10 text-left">
                    
                    {/* User Gamification Stats Summary Card */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      {/* Level and Tier Card */}
                      <div className="glass-panel p-5 rounded-2xl flex items-center gap-3.5 bg-slate-900/30">
                        <div className="p-3.5 bg-emerald-400/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                          <Award size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-slate-500">CURRENT BADGE TIER</span>
                          <span className="text-base font-bold text-slate-100 truncate">
                            {getRankTier(myGamification.points).name}
                          </span>
                        </div>
                      </div>

                      {/* Leaderboard Position */}
                      <div className="glass-panel p-5 rounded-2xl flex items-center gap-3.5 bg-slate-900/30">
                        <div className="p-3.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                          <Trophy size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-slate-500">GLOBAL POSITION</span>
                          <span className="text-lg font-black text-slate-100 font-mono">
                            #{myGamification.rank} <span className="text-xs font-normal text-slate-400">/ {myGamification.total_users} members</span>
                          </span>
                        </div>
                      </div>

                      {/* Active Streak */}
                      <div className="glass-panel p-5 rounded-2xl flex items-center gap-3.5 bg-slate-900/30">
                        <div className="p-3.5 bg-orange-500/10 rounded-xl text-orange-500 border border-orange-500/20">
                          <Flame size={24} className="animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-slate-500">ACTIVE STREAK</span>
                          <span className="text-lg font-black text-slate-100 font-mono">
                            {myGamification.streak} DAYS 🔥
                          </span>
                        </div>
                      </div>

                      {/* Quick counts */}
                      <div className="glass-panel p-5 rounded-2xl flex items-center gap-3.5 bg-slate-900/30">
                        <div className="p-3.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                          <Users size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-slate-500">COMPLETED CONTRIBUTIONS</span>
                          <span className="text-sm font-bold text-slate-200">
                            {myGamification.rsvp_count} RSVPs | {myGamification.project_count} Projects
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Progress to next Tier Level */}
                    {myGamification.points < 300 && (
                      <div className="glass-panel p-5 rounded-2xl bg-slate-900/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                          <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                            <Star size={14} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} /> Progress to next Tier: <span className="text-emerald-400">{getNextRankMilestone(myGamification.points).next}</span>
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500">
                            {getNextRankMilestone(myGamification.points).pointsNeeded} points needed
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-950 border border-slate-850 rounded-full overflow-hidden p-[2px]">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-1000 shadow-md shadow-indigo-500/20"
                            style={{ width: `${getNextRankMilestone(myGamification.points).percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* My Point Claims Status table */}
                    {myClaims.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                          <FileText size={18} className="text-emerald-400" /> My Points Claims
                        </h3>
                        <div className="glass-panel rounded-xl overflow-hidden text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-mono text-[10px] tracking-wider">
                                <th className="py-2.5 px-4">CLAIM DATE</th>
                                <th className="py-2.5 px-4">CHALLENGE PROOF</th>
                                <th className="py-2.5 px-4 text-center">POINTS</th>
                                <th className="py-2.5 px-4">LINKS</th>
                                <th className="py-2.5 px-4 text-right">STATUS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {myClaims.map((claim) => (
                                <tr key={claim.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                                  <td className="py-2.5 px-4 font-mono text-slate-500">{new Date(claim.created_at).toLocaleDateString()}</td>
                                  <td className="py-2.5 px-4 font-semibold text-slate-250 truncate max-w-xs">{claim.proof_description}</td>
                                  <td className="py-2.5 px-4 text-center font-bold font-mono text-emerald-400">+{claim.points_claimed}</td>
                                  <td className="py-2.5 px-4 flex gap-1.5 items-center">
                                    {claim.github_link && <a href={claim.github_link} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-400" title="GitHub Code"><Github size={13} /></a>}
                                    {claim.screenshot_url && <a href={claim.screenshot_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-400" title="Screenshot Proof"><Image size={13} /></a>}
                                  </td>
                                  <td className="py-2.5 px-4 text-right">
                                    {claim.status === 'pending' ? (
                                      <span className="text-amber-400 font-bold bg-amber-400/5 border border-amber-500/10 px-2 py-0.5 rounded font-mono text-[10px]">PENDING</span>
                                    ) : claim.status === 'approved' ? (
                                      <span className="text-emerald-400 font-bold bg-emerald-400/5 border border-emerald-500/10 px-2 py-0.5 rounded font-mono text-[10px]">APPROVED</span>
                                    ) : (
                                      <span className="text-rose-450 font-bold bg-rose-500/5 border border-rose-500/10 px-2 py-0.5 rounded font-mono text-[10px]">REJECTED</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Badge collection Showcase */}
                    <div>
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <Medal size={18} className="text-emerald-400" /> Earned Badges Showcase
                      </h3>
                      {myGamification.badges.length === 0 ? (
                        <div className="glass-panel p-6 text-center rounded-2xl text-slate-500 font-mono text-xs bg-slate-900/10">
                          🔒 No badges unlocked yet. Participate in contests or upload projects to earn dynamic virtual badges!
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                          {myGamification.badges.map((badge, idx) => (
                            <div 
                              key={idx} 
                              className="glass-panel p-3.5 rounded-xl border-emerald-500/20 text-center bg-slate-900/30 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300"
                            >
                              <div className="text-3xl mb-1.5">{badge.icon}</div>
                              <h4 className="font-bold text-slate-100 text-xs tracking-tight">{badge.name}</h4>
                              <p className="text-[9px] text-slate-500 mt-1 leading-normal">{badge.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Achievements Grid */}
                    <div>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Award size={18} className="text-emerald-400" /> Milestone Achievements Roster
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {myGamification.achievements.map((ach) => (
                          <div 
                            key={ach.id}
                            className={`glass-panel p-4 rounded-xl relative overflow-hidden transition-all duration-300 ${
                              ach.is_unlocked 
                                ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5 bg-slate-900/40 group hover:border-emerald-500/50' 
                                : 'opacity-65 grayscale bg-slate-950/20'
                            }`}
                          >
                            {ach.is_unlocked ? (
                              <div className="absolute top-3 right-3 text-emerald-400" title="Achievement Unlocked!">
                                <CheckCircle size={16} />
                              </div>
                            ) : (
                              <div className="absolute top-3 right-3 text-slate-500" title="Milestone Locked">
                                <Lock size={12} />
                              </div>
                            )}

                            <div className="flex gap-3 items-start mb-3">
                              <div className={`text-3xl p-1.5 rounded-lg border ${
                                ach.is_unlocked 
                                  ? 'bg-slate-900 border-slate-800 text-emerald-400 group-hover:scale-110 transition-transform duration-300' 
                                  : 'bg-slate-950 border-slate-900 text-slate-650'
                              }`}>
                                {ach.badge_icon}
                              </div>
                              <div className="flex flex-col text-left">
                                <h4 className="font-extrabold text-slate-200 tracking-tight leading-tight group-hover:text-emerald-400 transition-colors text-xs">
                                  {ach.title}
                                </h4>
                                <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                                  Reward: <span className="font-bold text-slate-400">{ach.badge_name}</span>
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-450 mb-3 h-6 overflow-hidden text-left">
                              {ach.description}
                            </p>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-mono">
                                <span className="text-slate-500">PROGRESS</span>
                                <span className={ach.is_unlocked ? 'text-emerald-400' : 'text-slate-400'}>
                                  {ach.progress_current} / {ach.progress_target}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-slate-900">
                                <div 
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    ach.is_unlocked ? 'bg-emerald-400' : 'bg-slate-700'
                                  }`}
                                  style={{ width: `${(ach.progress_current / ach.progress_target) * 100}%` }}
                                />
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>

                    </div>

                  </div>
                )
              ) : (
                /* Prompt to Login */
                <div className="glass-panel p-10 text-center max-w-xl mx-auto rounded-2xl border-slate-850 bg-slate-900/10">
                  <Lock size={48} className="mx-auto text-emerald-400 mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold mb-2">Unlock Your Ranks!</h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-6">
                    Sign in to your GFGCOE student account to check your leaderboard rankings, track streak logs, and view your dynamic milestone achievements.
                  </p>
                  <button 
                    onClick={() => { setActiveTab('ranking'); setView('login'); }}
                    className="glow-btn px-6 py-2.5 bg-emerald-400 text-slate-950 text-xs font-bold font-mono rounded-lg shadow-lg shadow-emerald-500/10 inline-block"
                  >
                    LOGIN_TO_ACCOUNT_
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: GUEST REGISTRATION MODAL FOR CONTEST ENTRY */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full rounded-3xl relative border-slate-800 text-left">
            <h4 className="text-lg font-bold mb-1.5 flex items-center gap-1.5">
              <Code size={18} className="text-emerald-400" /> Enter Public Contest
            </h4>
            <p className="text-[11px] text-slate-450 mb-4 font-mono leading-normal">
              GFGCOE supports public contest participation! Provide your student details below. We'll persist this data locally in your browser.
            </p>

            <form onSubmit={submitGuestDetails} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name..."
                  value={guestData.fullName}
                  onChange={(e) => setGuestData({ ...guestData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">College Name</label>
                  <input
                    type="text"
                    required
                    placeholder="College..."
                    value={guestData.collegeName}
                    onChange={(e) => setGuestData({ ...guestData, collegeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-100 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">Branch</label>
                  <input
                    type="text"
                    required
                    placeholder="Branch (e.g. CSE)"
                    value={guestData.branch}
                    onChange={(e) => setGuestData({ ...guestData, branch: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-100 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">Academic Year</label>
                <select
                  value={guestData.academicYear}
                  onChange={(e) => setGuestData({ ...guestData, academicYear: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-300 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                  <option value="Third Year">Third Year</option>
                  <option value="Final Year">Final Year</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowGuestModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-350 rounded-lg cursor-pointer"
                >
                  START_CONTEST_
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBMIT POINT CLAIM MODAL (MEMBERS) */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full rounded-3xl relative border-slate-800 text-left">
            <h4 className="text-lg font-bold mb-1.5 flex items-center gap-1.5">
              <PlusCircle size={18} className="text-emerald-400" /> Submit Challenge Claim
            </h4>
            <p className="text-[11px] text-slate-450 mb-4 font-mono leading-normal">
              Completed a contest question or custom coding task? Submit your links and evidence. Admins will verify your claim and award leaderboard points!
            </p>

            {claimSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-semibold font-mono mb-4">
                <CheckCircle size={16} /> {claimSuccess}
              </div>
            )}

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">Challenge Proof Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solved Contest 1 Easy Question (Two Sum)"
                  value={claimForm.proofDescription}
                  onChange={(e) => setClaimForm({ ...claimForm, proofDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">GitHub Repository Link</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500"><Github size={13} /></span>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={claimForm.githubLink}
                    onChange={(e) => setClaimForm({ ...claimForm, githubLink: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-100 text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">Screenshot Proof URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500"><Image size={13} /></span>
                  <input
                    type="url"
                    placeholder="https://imgur.com/... or Google Drive URL"
                    value={claimForm.screenshotUrl}
                    onChange={(e) => setClaimForm({ ...claimForm, screenshotUrl: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-100 text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider uppercase">Standard Points Value Claimed</label>
                <select
                  value={claimForm.pointsClaimed}
                  onChange={(e) => setClaimForm({ ...claimForm, pointsClaimed: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg text-slate-300 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={20}>+20 Points (Easy Question)</option>
                  <option value={50}>+50 Points (Medium Question)</option>
                  <option value={100}>+100 Points (Hard/Bonus Challenge)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-350 rounded-lg cursor-pointer"
                >
                  SUBMIT_CLAIM_
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
