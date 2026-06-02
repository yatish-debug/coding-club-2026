import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Calendar, Code, Users, BookOpen, AlertCircle, 
  RefreshCw, X, ShieldAlert, Key, UserCheck, Award, Terminal, 
  Megaphone, Pin, BarChart3, Lock, ShieldCheck, ChevronRight, Menu, ToggleLeft, ToggleRight,
  User, CheckCircle2, Bookmark, FolderPlus, Download, ExternalLink, Zap, Globe, Upload, Sliders
} from 'lucide-react';
import api, { 
  getEvents, createEvent, updateEvent, deleteEvent,
  getProjects, createProject, updateProject, deleteProject,
  getCommittee, createCommitteeMember, updateCommitteeMember, deleteCommitteeMember,
  getResources, createResource, updateResource, deleteResource,
  getUsers, createUser, updateUser, deleteUser, getMe,
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getMyRegistrations, uploadStudentProject,
  getApprovalRequests, approveGuestRequest, rejectGuestRequest,
  getContests, createContest, updateContest, deleteContest,
  addContestQuestion, deleteContestQuestion,
  getAdminClaims, resolvePointClaim,
  getAdminCms, updateCmsSetting,
  getClubAchievements, createClubAchievement, updateClubAchievement, deleteClubAchievement,
  getExecutiveAnalytics,
  getCodingProfiles, updateMyCodingProfile, syncCodingProfiles,
  importUsersCsv,
  getCommitteeLeaderboard, getCommitteeLeaderboardStats, recalculateLeaderboard, 
  resetLeaderboard, getLeaderboardSnapshots, restoreLeaderboardSnapshot, 
  createCodingProfileAdmin, updateCodingProfileAdmin, deleteCodingProfileAdmin, 
  syncSingleCodingProfile, toggleCodingProfileTracking
} from '../utils/api';
import GlowingCard from '../components/GlowingCard';

const parseMarkdown = (md) => {
  if (!md) return "";
  let html = md;
  // Parse headings
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-slate-200 mt-3">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-emerald-400 mt-4">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-extrabold text-emerald-400 mt-6">$1</h2>');
  // Parse bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100 font-bold">$1</strong>');
  // Parse code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-450 my-2 overflow-x-auto">$1</pre>');
  // Parse single-line code
  html = html.replace(/`(.*?)`/g, '<code class="bg-slate-950 px-1 py-0.5 border border-slate-900 text-emerald-400 font-mono text-xs rounded">$1</code>');
  // Parse lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-slate-400">$1</li>');
  return html;
};

export default function AdminDashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // Default tab
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data lists (Admin/Core views)
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [committee, setCommittee] = useState([]);
  const [resources, setResources] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // NEW ADMIN CMS, ACHIEVEMENTS, SYNC & ANALYTICS STATE
  const [cmsSettings, setCmsSettings] = useState([]);
  const [achievementsList, setAchievementsList] = useState([]);
  const [codingProfilesList, setCodingProfilesList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isSyncingCoding, setIsSyncingCoding] = useState(false);
  const [editingCmsSection, setEditingCmsSection] = useState('hero');
  const [handlesFormData, setHandlesFormData] = useState({ user_id: '', github_username: '', codeforces_username: '', leetcode_username: '', gfg_username: '', hackerrank_username: '' });

  // Gamification & Guest approvals lists
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [contests, setContests] = useState([]);
  const [claims, setClaims] = useState([]);
  
  // Contest form state
  const [showContestModal, setShowContestModal] = useState(false);
  const [editingContestId, setEditingContestId] = useState(null);
  const [contestFormData, setContestFormData] = useState({ title: '', description: '', duration_minutes: 60, start_time: '', category: 'dsa' });

  // Question form state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedContestId, setSelectedContestId] = useState(null);
  const [questionFormData, setQuestionFormData] = useState({ title: '', description: '', positive_points: 20, negative_points: 0, bonus_points: 0, question_type: 'coding', options: '', correct_option: 'A' });

  // Resolve Claim form state
  const [showResolveClaimModal, setShowResolveClaimModal] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [resolveClaimFormData, setResolveClaimFormData] = useState({ status: 'approved', admin_notes: '', points_awarded: 20 });

  // Student specific data lists
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [studentForm, setStudentForm] = useState({ title: '', description: '', tech_stack: '', github_link: '', live_link: '', image_url: '' });

  // Form modals
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Password Reset modals
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Points popup animation indicator
  const [earnedPoints, setEarnedPoints] = useState(0);

  // New coding profile handles & snapshot management states
  const [showHandlesModal, setShowHandlesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [snapshotsList, setSnapshotsList] = useState([]);
  const [showResetLeaderboardModal, setShowResetLeaderboardModal] = useState(false);
  const [resetLeaderboardFormData, setResetLeaderboardFormData] = useState({ snapshot_type: 'monthly', name: '' });
  const [leaderboardStats, setLeaderboardStats] = useState(null);


  useEffect(() => {
    setSelectedIds([]);
    fetchProfileAndData();
  }, [activeTab]);

  const fetchProfileAndData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch current logged-in user profile
      let profile = userProfile;
      if (!profile) {
        profile = await getMe();
        setUserProfile(profile);
      }

      // 2. Load Student Portal-specific data
      if (profile.role === 'student') {
        if (activeTab === 'overview') {
          const regs = await getMyRegistrations();
          setMyRegistrations(regs);
          const anns = await getAnnouncements();
          setAnnouncements(anns.slice(0, 3));
        } else if (activeTab === 'my-events') {
          const regs = await getMyRegistrations();
          setMyRegistrations(regs);
        } else if (activeTab === 'resources') {
          const resData = await getResources();
          setResources(resData);
        } else if (activeTab === 'bulletins') {
          const annData = await getAnnouncements();
          setAnnouncements(annData);
        }
        setLoading(false);
        return;
      }

      // 3. Load Admin/Core-specific tab contents
      if (activeTab === 'overview') {
        const evs = await getEvents(); setEvents(evs);
        const projs = await getProjects(); setProjects(projs);
        const anns = await getAnnouncements(); setAnnouncements(anns);
        if (profile.role === 'admin') {
          const usrs = await getUsers(); setUsersList(usrs);
        }
      } else if (activeTab === 'events') {
        const data = await getEvents(); setEvents(data);
      } else if (activeTab === 'projects') {
        const data = await getProjects(); setProjects(data);
      } else if (activeTab === 'committee' && profile.role === 'admin') {
        const data = await getCommittee(); setCommittee(data);
      } else if (activeTab === 'resources') {
        const data = await getResources(); setResources(data);
      } else if (activeTab === 'users' && profile.role === 'admin') {
        const data = await getUsers(); setUsersList(data);
        try {
          const profs = await getCodingProfiles(); setCodingProfilesList(profs);
        } catch (e) {
          console.error(e);
        }
      } else if (activeTab === 'announcements') {
        const data = await getAnnouncements(); setAnnouncements(data);
      } else if (activeTab === 'approvals' && profile.role === 'admin') {
        const data = await getApprovalRequests(); setApprovalRequests(data);
      } else if (activeTab === 'contests') {
        const data = await getContests(); setContests(data);
      } else if (activeTab === 'claims') {
        const data = await getAdminClaims(); setClaims(data);
      } else if (activeTab === 'cms' && profile.role === 'admin') {
        const data = await getAdminCms(); setCmsSettings(data);
      } else if (activeTab === 'achievements' && profile.role === 'admin') {
        const data = await getClubAchievements(); setAchievementsList(data);
      } else if (activeTab === 'coding-sync' && profile.role === 'admin') {
        const data = await getCodingProfiles(); setCodingProfilesList(data);
        const usrs = await getUsers(); setUsersList(usrs);
        try {
          const snaps = await getLeaderboardSnapshots(); setSnapshotsList(snaps);
          const stats = await getCommitteeLeaderboardStats(); setLeaderboardStats(stats);
        } catch (e) {
          console.error("Failed to load snapshots/stats", e);
        }
      } else if (activeTab === 'analytics' && profile.role === 'admin') {
        const data = await getExecutiveAnalytics(); setAnalyticsData(data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve active database records. Check if FastAPI is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    if (activeTab === 'events') {
      setFormData({ title: '', description: '', date: '', location: '', image_url: '', registration_link: '', category: 'Workshop' });
    } else if (activeTab === 'projects') {
      setFormData({ title: '', description: '', tech_stack: '', github_link: '', live_link: '', image_url: '' });
    } else if (activeTab === 'committee') {
      setFormData({ name: '', role: '', image_url: '', linkedin_url: '', github_url: '', year: '2026' });
    } else if (activeTab === 'resources') {
      setFormData({ title: '', description: '', category: 'DSA', link: '', tags: '' });
    } else if (activeTab === 'users') {
      setFormData({ username: '', email: '', full_name: '', role: 'student', password: '' });
    } else if (activeTab === 'announcements') {
      setFormData({ title: '', content: '', is_pinned: false });
    } else if (activeTab === 'achievements') {
      setFormData({ title: '', description: '', category: 'Hackathons', achieved_by: '', link: '', image_url: '', date: new Date().toISOString().slice(0, 10) });
    }
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    if (activeTab === 'events') {
      const dateObj = new Date(item.date);
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
      setFormData({ ...item, date: localISOTime });
    } else if (activeTab === 'users') {
      setFormData({ ...item, password: '' });
    } else if (activeTab === 'achievements') {
      const dateObj = new Date(item.date);
      setFormData({ ...item, date: dateObj.toISOString().slice(0, 10) });
    } else {
      setFormData({ ...item });
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this record? This action is permanent.')) return;
    setLoading(true);
    try {
      if (activeTab === 'events') await deleteEvent(id);
      else if (activeTab === 'projects') await deleteProject(id);
      else if (activeTab === 'committee') await deleteCommitteeMember(id);
      else if (activeTab === 'resources') await deleteResource(id);
      else if (activeTab === 'users') await deleteUser(id);
      else if (activeTab === 'announcements') await deleteAnnouncement(id);
      else if (activeTab === 'achievements') await deleteClubAchievement(id);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Deletion failure. Access token might be expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you absolutely sure you want to delete the ${selectedIds.length} selected records? This action is permanent.`)) return;
    setLoading(true);
    try {
      if (activeTab === 'events') {
        await Promise.all(selectedIds.map(id => deleteEvent(id)));
      } else if (activeTab === 'projects') {
        await Promise.all(selectedIds.map(id => deleteProject(id)));
      } else if (activeTab === 'committee') {
        await Promise.all(selectedIds.map(id => deleteCommitteeMember(id)));
      } else if (activeTab === 'resources') {
        await Promise.all(selectedIds.map(id => deleteResource(id)));
      } else if (activeTab === 'users') {
        const validUserIds = selectedIds.filter(id => {
          const u = usersList.find(user => user.id === id);
          return u && u.username !== 'admin';
        });
        if (validUserIds.length > 0) {
          await Promise.all(validUserIds.map(id => deleteUser(id)));
        }
      } else if (activeTab === 'announcements') {
        await Promise.all(selectedIds.map(id => deleteAnnouncement(id)));
      } else if (activeTab === 'achievements') {
        await Promise.all(selectedIds.map(id => deleteClubAchievement(id)));
      }
      setSelectedIds([]);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Bulk deletion completed with some errors. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    setLoading(true);
    try {
      const payload = { is_active: !user.is_active };
      await updateUser(user.id, payload);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to modify user status.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResetPassword = (userId) => {
    setResetUserId(userId);
    setNewPassword('');
    setShowResetModal(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      alert('Please enter a valid password.');
      return;
    }
    setLoading(true);
    try {
      const payload = { password: newPassword };
      await updateUser(resetUserId, payload);
      setShowResetModal(false);
      alert('Password reset completed successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to override password.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'gfgcoe_coding_club_members.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to export student CSV roster.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportCsv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const res = await importUsersCsv(formDataObj);
      alert(`✓ Bulk CSV Import Successful!\nImported/Updated: ${res.imported} users.${res.errors.length > 0 ? `\n\nNote:\n${res.errors.join('\n')}` : ''}`);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'CSV Import failed. Make sure the headers match perfectly.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleCmsValueChange = (key, val) => {
    setCmsSettings(prev => prev.map(s => s.key === key ? { ...s, value: val } : s));
  };

  const handleSaveCmsSetting = async (setting) => {
    setLoading(true);
    try {
      await updateCmsSetting(setting);
      alert(`✓ CMS Setting "${setting.key}" updated successfully!`);
    } catch (err) {
      console.error(err);
      alert('Failed to update CMS setting.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncingCoding(true);
    try {
      const res = await syncCodingProfiles();
      alert(`✓ Coding standings evaluation completed!\nEvaluation processed on ${res.synced_count} active user accounts.`);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Standings evaluation pipeline failed.');
    } finally {
      setIsSyncingCoding(false);
    }
  };

  // --- NEW HANDLERS FOR COMMITTEE CODING PROFILE & RESETS ---

  const handleOpenManageHandles = (user) => {
    setSelectedUser(user);
    const existing = codingProfilesList.find(p => p.user_id === user.id);
    if (existing) {
      setHandlesFormData({
        user_id: user.id,
        github_username: existing.github_username || '',
        codeforces_username: existing.codeforces_username || '',
        leetcode_username: existing.leetcode_username || '',
        gfg_username: existing.gfg_username || '',
        hackerrank_username: existing.hackerrank_username || ''
      });
    } else {
      setHandlesFormData({
        user_id: user.id,
        github_username: '',
        codeforces_username: '',
        leetcode_username: '',
        gfg_username: '',
        hackerrank_username: ''
      });
    }
    setShowHandlesModal(true);
  };

  const handleHandlesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const existing = codingProfilesList.find(p => p.user_id === selectedUser.id);
      if (existing) {
        await updateCodingProfileAdmin(existing.id, handlesFormData);
        alert('✓ Coding profile updated successfully!');
      } else {
        await createCodingProfileAdmin(handlesFormData);
        alert('✓ Coding profile attached successfully!');
      }
      setShowHandlesModal(false);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to save coding profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleHandlesRemove = async () => {
    const existing = codingProfilesList.find(p => p.user_id === selectedUser.id);
    if (!existing) return;
    if (!window.confirm("Are you absolutely sure you want to remove this user's coding profile? This will wipe their scores.")) return;
    setLoading(true);
    try {
      await deleteCodingProfileAdmin(existing.id);
      alert('✓ Coding profile removed.');
      setShowHandlesModal(false);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to remove coding profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleHandlesSync = async () => {
    const existing = codingProfilesList.find(p => p.user_id === selectedUser.id);
    if (!existing) return;
    setLoading(true);
    try {
      await syncSingleCodingProfile(existing.id);
      alert('✓ Coding profile metrics synchronized successfully!');
      setShowHandlesModal(false);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to synchronize coding profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleHandlesToggleTracking = async () => {
    const existing = codingProfilesList.find(p => p.user_id === selectedUser.id);
    if (!existing) return;
    setLoading(true);
    try {
      const res = await toggleCodingProfileTracking(existing.id);
      alert(`✓ Coding tracking is now ${res.is_tracking_enabled ? 'ENABLED' : 'DISABLED'}.`);
      setShowHandlesModal(false);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to toggle coding tracking.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateStandings = async () => {
    setLoading(true);
    try {
      const res = await recalculateLeaderboard();
      alert(`✓ Standing recalculations complete! Processed ${res.synced_count} active tracked profiles.`);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to recalculate standings.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetLeaderboardSubmit = async (e) => {
    e.preventDefault();
    if (!resetLeaderboardFormData.name.trim()) {
      alert('Please enter a valid snapshot label.');
      return;
    }
    setLoading(true);
    try {
      const res = await resetLeaderboard(resetLeaderboardFormData);
      alert(`✓ Leaderboard reset and snapshotted successfully!\nSnapshot Label: ${res.snapshot_name}`);
      setShowResetLeaderboardModal(false);
      setResetLeaderboardFormData({ snapshot_type: 'monthly', name: '' });
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to reset leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSnapshot = async (snapId) => {
    if (!window.confirm('WARNING: Restoring a snapshot will overwrite all active standings scores with the archived snapshot data. Do you want to proceed?')) return;
    setLoading(true);
    try {
      await restoreLeaderboardSnapshot(snapId);
      alert('✓ Previous leaderboard standing snapshot restored successfully!');
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to restore snapshot.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeTab === 'events') {
        const payload = { ...formData, date: new Date(formData.date).toISOString() };
        if (editingId) await updateEvent(editingId, payload);
        else await createEvent(payload);
      } else if (activeTab === 'projects') {
        if (editingId) await updateProject(editingId, formData);
        else await createProject(formData);
      } else if (activeTab === 'committee') {
        if (editingId) await updateCommitteeMember(editingId, formData);
        else await createCommitteeMember(formData);
      } else if (activeTab === 'resources') {
        if (editingId) await updateResource(editingId, formData);
        else await createResource(formData);
      } else if (activeTab === 'announcements') {
        if (editingId) await updateAnnouncement(editingId, formData);
        else await createAnnouncement(formData);
      } else if (activeTab === 'achievements') {
        const payload = { ...formData, date: new Date(formData.date).toISOString() };
        if (editingId) await updateClubAchievement(editingId, payload);
        else await createClubAchievement(payload);
      } else if (activeTab === 'users') {
        if (!formData.email.toLowerCase().endsWith('@gfgcoe.codingclub.in')) {
          alert('Validation Error: Institutional IDs ending with @gfgcoe.codingclub.in are strictly required.');
          setLoading(false);
          return;
        }
        if (editingId) {
          const { password, ...updatePayload } = formData;
          if (password) updatePayload.password = password;
          await updateUser(editingId, updatePayload);
        } else {
          await createUser(formData);
        }
      }
      setShowModal(false);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Save failed. Review input fields.');
    } finally {
      setLoading(false);
    }
  };

  // --- STUDENT MEMBER SPECIAL PROJECT UPLOAD SUBMISSION ---
  const handleStudentProjectUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await uploadStudentProject(studentForm);
      setStudentForm({ title: '', description: '', tech_stack: '', github_link: '', live_link: '', image_url: '' });
      setEarnedPoints(100);
      alert('🎉 Project Uploaded Successfully! Your build is live on the Projects board and you earned +100 Leaderboard Points!');
      setTimeout(() => setEarnedPoints(0), 4000);
      
      // Update profile locally to increment points immediately on the UI!
      setUserProfile((prev) => ({ ...prev, points: prev.points + 100 }));
      
    } catch (err) {
      console.error(err);
      alert('Project upload failed. Review tech stack comma formats.');
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  //     STUDENT MEMBER EXCLUSIVE RENDERS
  // ==========================================

  const renderStudentOverview = () => {
    const studentPoints = userProfile?.points || 0;
    const registeredCount = myRegistrations.length;
    const certsCount = userProfile?.certificates ? userProfile.certificates.split(',').length : 0;

    return (
      <div className="space-y-8 animate-fade-in text-left">
        
        {/* Welcome Section Banner */}
        <GlowingCard hoverGlow="emerald" className="relative overflow-hidden p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              // ACTIVE_PORTAL_SESSION
            </span>
            <h3 className="text-2xl font-extrabold text-slate-100 font-sans tracking-tight">
              Welcome back, <span className="text-gradient">{userProfile?.full_name || 'Member'}</span>!
            </h3>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Unlock DSA study sheets, review notifications, and upload your project builds. Ready to secure some more points?
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <Zap className="text-emerald-400 animate-bounce" size={24} />
            <div className="text-left font-mono">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Rank Status</div>
              <div className="text-sm font-bold text-slate-200">Gold Tier #12</div>
            </div>
          </div>
        </GlowingCard>

        {/* Activity & Scorecard Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Circular Points Indicator Scorecard widget */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40 flex flex-col items-center justify-between text-center min-h-[260px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/5 blur-[30px] pointer-events-none"></div>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold">// Leaderboard Score</span>
            
            <div className="relative flex items-center justify-center w-36 h-36 my-2">
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                <circle cx="50" cy="50" r="42" stroke="#10B981" strokeWidth="6" fill="transparent" 
                        strokeDasharray="264" strokeDashoffset={264 - (264 * Math.min(studentPoints, 500)) / 500} 
                        className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold text-slate-100 tracking-tight">{studentPoints}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider uppercase">PTS</span>
              </div>
            </div>

            <span className="text-[11px] font-mono text-slate-400">Award Target: 500 PTS for Platinum Tier</span>
          </div>

          {/* Activity counts deck */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800/40 flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Registered Events</span>
                <Calendar size={18} className="text-indigo-400" />
              </div>
              <div className="text-left pt-4">
                <div className="text-3xl font-extrabold text-slate-200">{registeredCount}</div>
                <p className="text-[11px] text-slate-500 font-mono mt-1 uppercase">Active RSVP Sessions</p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-800/40 flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">My Certificates</span>
                <Award size={18} className="text-blue-400" />
              </div>
              <div className="text-left pt-4">
                <div className="text-3xl font-extrabold text-slate-200">{certsCount}</div>
                <p className="text-[11px] text-slate-500 font-mono mt-1 uppercase">Verified Credentials</p>
              </div>
            </div>

            {/* Notifications bulletins */}
            <div className="sm:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800/40 text-left">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold block mb-4">// System Notifications</span>
              <ul className="space-y-3.5 text-xs font-mono text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">▶</span>
                  <div>
                    <span className="text-slate-300 font-semibold">Event RSVP Confirmed:</span> Pre-registered for ByteCraft 2026. Mock points credited successfully.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">▶</span>
                  <div>
                    <span className="text-slate-300 font-semibold">DSA Material Unlocked:</span> Comprehensive Graphs and shortest path guides are ready inside the Study Resources.
                  </div>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    );
  };

  const renderStudentEvents = () => (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight text-slate-200">Registered Events & RSVPs</h3>
        <p className="text-xs text-slate-500">Your scheduled club sessions and hackathons. Join meetings or check dates.</p>
      </div>

      {myRegistrations.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl">
          <p className="text-slate-400 font-mono">NO_ACTIVE_EVENT_REGISTRATIONS</p>
          <a href="/events" className="mt-4 inline-block px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold rounded-lg text-xs font-mono">RSVP_FOR_EVENTS_NOW_</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myRegistrations.map((reg) => {
            const ev = reg.event;
            if (!ev) return null;
            return (
              <GlowingCard key={reg.id} hoverGlow="emerald" className="flex flex-col justify-between min-h-[160px]">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">{ev.category}</span>
                    <span className="text-slate-400">{new Date(ev.date).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-200">{ev.title}</h4>
                  <p className="text-xs text-slate-500 font-mono">📍 {ev.location}</p>
                </div>
                <div className="pt-4 border-t border-slate-900/60 mt-4 flex justify-between items-center text-xs font-mono">
                  <span className="text-[10px] text-slate-500">RSVP_CONFIRMED_✓</span>
                  <a 
                    href={ev.registration_link || "#"} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-900 rounded font-bold transition-all text-xs"
                  >
                    ENTER_LOBBY_
                  </a>
                </div>
              </GlowingCard>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderStudentCertificates = () => {
    const certsList = userProfile?.certificates ? userProfile.certificates.split(',') : [];
    return (
      <div className="space-y-6 animate-fade-in text-left">
        <div className="space-y-2">
          <h3 className="text-xl font-bold tracking-tight text-slate-200">Technical Certifications Wallet</h3>
          <p className="text-xs text-slate-500">View and download your digital certificate credentials earned by participating in coding events.</p>
        </div>

        {certsList.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl">
            <p className="text-slate-400 font-mono">NO_CREDENTIALS_FOUND_IN_WALLET</p>
            <p className="text-[11px] text-slate-500 mt-1">Participate in club hackathons to secure verified certificates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certsList.map((cert, idx) => (
              <GlowingCard key={idx} hoverGlow="blue" className="p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden border border-indigo-900/10">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-500/5 blur-[25px] pointer-events-none"></div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase">Verified</span>
                    <span className="text-slate-500">ID: GFG-{idx}049B</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-200">{cert.trim()}</h4>
                </div>
                <div className="pt-4 border-t border-slate-900/60 mt-4 flex justify-between items-center text-xs font-mono">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Credential target verified</span>
                  <button 
                    onClick={() => alert('📥 Downloading Mock PDF Credential Certificate...')}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 rounded-lg transition-colors cursor-pointer"
                    title="Download Certificate"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </GlowingCard>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStudentUploadProject = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-left">
      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight text-slate-200">Upload Project Build</h3>
        <p className="text-xs text-slate-500">Publish your web applications or competitive tools to the public club showcase. **Earns +100 PTS!**</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-500/5 blur-[35px] pointer-events-none"></div>

        <form onSubmit={handleStudentProjectUpload} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-500">PROJECT_TITLE</label>
            <input type="text" required placeholder="e.g. GFG Arena portal..." value={studentForm.title} onChange={(e) => setStudentForm({ ...studentForm, title: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-500">TECH_STACK (COMMA SEPARATED)</label>
            <input type="text" required placeholder="React, Tailwind, Node.js..." value={studentForm.tech_stack} onChange={(e) => setStudentForm({ ...studentForm, tech_stack: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-500">REPOSITORY_GITHUB_URL</label>
              <input type="url" placeholder="https://github.com/..." value={studentForm.github_link} onChange={(e) => setStudentForm({ ...studentForm, github_link: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-500">LIVE_DEPLOYMENT_URL</label>
              <input type="url" placeholder="https://myproj.org/..." value={studentForm.live_link} onChange={(e) => setStudentForm({ ...studentForm, live_link: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-500">IMAGE_URL (SCREENSHOT OVERVIEW)</label>
            <input type="url" placeholder="https://unsplash.com/..." value={studentForm.image_url} onChange={(e) => setStudentForm({ ...studentForm, image_url: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-500">PROJECT_DESCRIPTION</label>
            <textarea rows={4} required placeholder="Detail the system architecture..." value={studentForm.description} onChange={(e) => setStudentForm({ ...studentForm, description: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
          </div>

          <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
            <button type="submit" disabled={loading} className="glow-btn px-6 py-2.5 bg-emerald-400 text-slate-900 hover:bg-emerald-300 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer">
              UPLOAD_PROJECT_ (+100 PTS)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  // ==========================================
  //     NEW ADMINISTRATIVE MODULE RENDERS
  // ==========================================

  const renderCmsEditor = () => {
    const categories = {
      hero: { label: 'Hero Block Settings', desc: 'Main branding titles and descriptions visible on the front landing page.' },
      about: { label: 'About & Brand Story', desc: 'Faculty statements, core team background, and institutional mission/vision cards.' },
      sponsors: { label: 'Partners & Sponsors', desc: 'Manage GeeksforGeeks club sponsors logo names (comma-separated).' },
      statistics: { label: 'Telemetry Statistics', desc: 'Update display counts for student cohort sizes, projects, events and competitions.' },
      contact: { label: 'Institutional Contact', desc: 'Institutional helpline phone numbers and email domains.' },
      footer: { label: 'Footer Brand Texts', desc: 'Branding copyrights text shown at the base of the portal pages.' }
    };

    return (
      <div className="space-y-8 animate-fade-in text-left">
        <div className="flex flex-wrap gap-2 border-b border-slate-900 pb-3">
          {Object.keys(categories).map((cat) => (
            <button
              key={cat}
              onClick={() => setEditingCmsSection(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                editingCmsSection === cat 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 animate-pulse' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {categories[cat].label}
            </button>
          ))}
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-500/5 blur-[35px] pointer-events-none"></div>
          <div className="mb-6">
            <h4 className="text-base font-extrabold text-slate-200 uppercase tracking-wide font-mono">// {categories[editingCmsSection].label}</h4>
            <p className="text-xs text-slate-400 mt-1">{categories[editingCmsSection].desc}</p>
          </div>

          <div className="space-y-6">
            {cmsSettings
              .filter(s => s.category === editingCmsSection)
              .map((setting) => {
                const displayName = setting.key.replace('stat_', 'Stat: ').replace('about_', 'About: ').replace('hero_', 'Hero: ').replace('footer_', 'Footer: ').replace('contact_', 'Contact: ').replace('_', ' ').toUpperCase();
                return (
                  <div key={setting.key} className="space-y-2 p-4 bg-slate-950/40 border border-slate-900/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1 text-left">
                      <span className="text-[10px] font-mono font-bold text-slate-500">{setting.key}</span>
                      <h5 className="text-xs font-bold text-slate-300">{displayName}</h5>
                      {setting.value.length > 80 ? (
                        <textarea
                          rows={3}
                          value={setting.value}
                          onChange={(e) => handleCmsValueChange(setting.key, e.target.value)}
                          className="w-full mt-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                        />
                      ) : (
                        <input
                          type="text"
                          value={setting.value}
                          onChange={(e) => handleCmsValueChange(setting.key, e.target.value)}
                          className="w-full mt-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                        />
                      )}
                    </div>
                    <button
                      onClick={() => handleSaveCmsSetting(setting)}
                      disabled={loading}
                      className="glow-btn shrink-0 md:self-end px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      SAVE_SETTING_
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  const renderAchievementsLedger = () => (
    <div className="glass-panel rounded-3xl border border-slate-800/40 overflow-hidden text-left animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 text-xs font-mono tracking-wider uppercase">
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={achievementsList.length > 0 && selectedIds.length === achievementsList.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(achievementsList.map(ach => ach.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Achieved By</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-sm">
            {achievementsList.map((ach) => (
              <tr key={ach.id} className="hover:bg-slate-900/10 transition-colors">
                <td className="px-6 py-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(ach.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, ach.id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== ach.id));
                      }
                    }}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{ach.title}</span>
                    <span className="text-[10px] text-slate-500 truncate max-w-xs">{ach.description}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    {ach.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300 font-mono text-xs">{ach.achieved_by}</td>
                <td className="px-6 py-4 text-slate-450 font-mono text-xs">
                  {new Date(ach.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleOpenEdit(ach)}
                      className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Edit Achievement"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(ach.id)}
                      className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Achievement"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCodingSyncManager = () => {
    const stats = leaderboardStats || {
      committee_members_tracked: 0,
      top_coder: 'None',
      total_coding_profiles: 0,
      active_coding_members: 0,
      monthly_coding_champion: 'None'
    };

    return (
      <div className="space-y-8 animate-fade-in text-left">
        
        {/* Global Standings Controls Banner */}
        <GlowingCard hoverGlow="emerald" className="p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 text-left">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              // COMMITTEE_STANDINGS_ENGINE
            </span>
            <h3 className="text-2xl font-extrabold text-slate-100 font-sans tracking-tight">
              Committee coding Standings engine
            </h3>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Synchronize coding scores, contest points, repository commits and solved DSA problems from GitHub, LeetCode, Codeforces, HackerRank, and GeeksforGeeks.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto shrink-0 justify-start lg:justify-end">
            <button
              onClick={handleRecalculateStandings}
              disabled={loading}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-450 hover:text-emerald-400 rounded-xl font-mono font-bold text-xs cursor-pointer shadow-lg transition-colors"
            >
              RECALCULATE_STANDINGS_
            </button>
            <button
              onClick={() => setShowResetLeaderboardModal(true)}
              disabled={loading}
              className="px-5 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl font-mono font-bold text-xs cursor-pointer shadow-lg transition-all"
            >
              RESET_LEADERBOARD_
            </button>
            <button
              onClick={handleTriggerSync}
              disabled={isSyncingCoding || loading}
              className="glow-btn flex items-center gap-2 px-6 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-900 rounded-xl font-mono font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {isSyncingCoding ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <Zap size={16} />
              )}
              {isSyncingCoding ? 'SYNCHRONIZING_...' : 'RUN_GLOBAL_SYNC_'}
            </button>
          </div>
        </GlowingCard>

        {/* Database-Driven Statistics widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col justify-between min-h-[100px] text-left">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Tracked Members</span>
            <div className="text-2xl font-extrabold text-slate-200 mt-2">{stats.committee_members_tracked} Members</div>
            <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase">Track status active</p>
          </div>
          
          <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col justify-between min-h-[100px] text-left">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Top Coder</span>
            <div className="text-lg font-bold text-emerald-400 mt-2 truncate">{stats.top_coder}</div>
            <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase">Highest Overall Score</p>
          </div>

          <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col justify-between min-h-[100px] text-left">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Total coding Profiles</span>
            <div className="text-2xl font-extrabold text-slate-200 mt-2">{stats.total_coding_profiles} Profiles</div>
            <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase">Database attached count</p>
          </div>

          <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col justify-between min-h-[100px] text-left">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Active coding Members</span>
            <div className="text-2xl font-extrabold text-slate-200 mt-2">{stats.active_coding_members} Active</div>
            <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase">Score metrics &gt; 0</p>
          </div>

          <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col justify-between min-h-[100px] text-left">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Monthly Champion</span>
            <div className="text-base font-bold text-indigo-400 mt-2 truncate">{stats.monthly_coding_champion}</div>
            <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase">Latest monthly snap</p>
          </div>
        </div>

        {/* Snapshots & History snap archives */}
        {snapshotsList.length > 0 && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40 text-left space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold block">// Historical snapshot archives</span>
              <span className="text-[10px] font-mono text-slate-650">Non-destructive ledger</span>
            </div>
            
            <div className="overflow-x-auto border border-slate-900/60 rounded-xl">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-500 text-[10px] font-mono tracking-wider uppercase text-left">
                    <th className="px-4 py-3">Snapshot Name</th>
                    <th className="px-4 py-3">Resets Category</th>
                    <th className="px-4 py-3">Archive Date</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-xs font-mono">
                  {snapshotsList.map((snap) => (
                    <tr key={snap.id} className="hover:bg-slate-950/20 transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-bold">{snap.name}</td>
                      <td className="px-4 py-3 text-slate-400">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase">
                          {snap.snapshot_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(snap.snapshot_date).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRestoreSnapshot(snap.id)}
                          className="px-3 py-1 bg-slate-900 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/25 text-emerald-450 hover:text-emerald-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          RESTORE_SNAP_
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Committee Members coding profiles table */}
        <div className="glass-panel rounded-3xl border border-slate-800/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 text-xs font-mono tracking-wider uppercase text-left">
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">GitHub Commits</th>
                  <th className="px-6 py-4 font-semibold">LeetCode Solved</th>
                  <th className="px-6 py-4 font-semibold">Codeforces Rating</th>
                  <th className="px-6 py-4 font-semibold">GFG Solved</th>
                  <th className="px-6 py-4 font-semibold">HackerRank</th>
                  <th className="px-6 py-4 font-semibold">Overall Score</th>
                  <th className="px-6 py-4 font-semibold">Tracking Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-sm text-left">
                {codingProfilesList.map((p) => {
                  const student = usersList.find(u => u.id === p.user_id) || {};
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{student.full_name || `@user_${p.user_id}`}</span>
                          <span className="text-xs text-slate-500 font-mono">@{student.username || 'unknown'} ({student.role})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {p.github_username ? (
                          <div className="flex flex-col">
                            <span className="text-slate-300 font-bold">{p.github_commits} Commits</span>
                            <span className="text-[10px] text-slate-500 font-semibold">@{p.github_username}</span>
                          </div>
                        ) : <span className="text-slate-650 italic text-xs">Not linked</span>}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {p.leetcode_username ? (
                          <div className="flex flex-col">
                            <span className="text-slate-300 font-bold">{p.leetcode_solved} Solved</span>
                            <span className="text-[10px] text-slate-500 font-semibold">@{p.leetcode_username}</span>
                          </div>
                        ) : <span className="text-slate-650 italic text-xs">Not linked</span>}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {p.codeforces_username ? (
                          <div className="flex flex-col">
                            <span className="text-emerald-450 font-bold">{p.codeforces_rating} Rating</span>
                            <span className="text-[10px] text-slate-500 font-semibold">@{p.codeforces_username}</span>
                          </div>
                        ) : <span className="text-slate-650 italic text-xs">Not linked</span>}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {p.gfg_username ? (
                          <div className="flex flex-col">
                            <span className="text-slate-300 font-bold">{p.gfg_solved} Solved</span>
                            <span className="text-[10px] text-slate-500 font-semibold">@{p.gfg_username}</span>
                          </div>
                        ) : <span className="text-slate-650 italic text-xs">Not linked</span>}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {p.hackerrank_username ? (
                          <div className="flex flex-col">
                            <span className="text-slate-300 font-bold">Linked</span>
                            <span className="text-[10px] text-slate-500 font-semibold">@{p.hackerrank_username}</span>
                          </div>
                        ) : <span className="text-slate-650 italic text-xs">Not linked</span>}
                      </td>
                      <td className="px-6 py-4 font-mono text-emerald-455 font-extrabold text-base">
                        {p.overall_score}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          p.is_tracking_enabled ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-900 border border-slate-850 text-slate-550'
                        }`}>
                          {p.is_tracking_enabled ? 'ACTIVE_TRACKING' : 'DISABLED'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderExecutiveAnalytics = () => {
    if (!analyticsData) {
      return (
        <div className="flex justify-center py-20 text-emerald-400 font-mono">
          <RefreshCw className="animate-spin mr-2" size={20} /> LOADING_EXECUTIVE_TELEMETRY_
        </div>
      );
    }

    const {
      total_members,
      student_count,
      core_count,
      events_count,
      total_rsvps,
      tech_distribution = [],
      event_participation = [],
      project_trends = [],
      member_growth = []
    } = analyticsData;

    const growthWidth = 500;
    const growthHeight = 180;
    const padding = 30;
    
    let growthPoints = '';
    let growthPointsArea = `0,${growthHeight - padding}`;
    if (member_growth.length > 0) {
      const maxVal = Math.max(...member_growth.map(d => d.value)) || 10;
      const stepX = (growthWidth - padding * 2) / (member_growth.length - 1 || 1);
      member_growth.forEach((d, idx) => {
        const x = padding + idx * stepX;
        const y = growthHeight - padding - ((d.value / maxVal) * (growthHeight - padding * 2));
        growthPoints += `${idx === 0 ? 'M' : 'L'}${x},${y}`;
        growthPointsArea += ` L${x},${y}`;
      });
      growthPointsArea += ` L${growthWidth - padding},${growthHeight - padding} Z`;
    }

    return (
      <div className="space-y-8 animate-fade-in text-left">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <GlowingCard hoverGlow="emerald" className="p-6">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">// TOTAL_MEMBERS</span>
            <div className="text-4xl font-extrabold text-slate-100 mt-2 font-sans">{total_members}</div>
            <p className="text-[10px] text-emerald-400 mt-1 font-mono">Student Cohort Roster Capacity</p>
          </GlowingCard>
          
          <GlowingCard hoverGlow="blue" className="p-6">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">// RSVP_ATTENDANCE</span>
            <div className="text-4xl font-extrabold text-blue-400 mt-2 font-sans">{total_rsvps}</div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">Aggregated RSVPs Across Events</p>
          </GlowingCard>
          
          <GlowingCard hoverGlow="indigo" className="p-6">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">// LAUNCHED_EVENTS</span>
            <div className="text-4xl font-extrabold text-indigo-400 mt-2 font-sans">{events_count}</div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">Active Scheduled Club Sessions</p>
          </GlowingCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40 relative overflow-hidden text-center">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold block mb-6 text-left">// Cohort Registration Growth</span>
            
            <div className="w-full overflow-x-auto flex justify-center">
              <svg width={growthWidth} height={growthHeight} className="overflow-visible">
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((gIdx) => {
                  const y = padding + (gIdx * (growthHeight - padding * 2)) / 3;
                  return (
                    <line key={gIdx} x1={padding} y1={y} x2={growthWidth - padding} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  );
                })}
                {growthPoints && (
                  <path d={growthPointsArea} fill="url(#growthGrad)" />
                )}
                {growthPoints && (
                  <path d={growthPoints} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                )}
                {member_growth.map((d, idx) => {
                  const maxVal = Math.max(...member_growth.map(x => x.value)) || 10;
                  const stepX = (growthWidth - padding * 2) / (member_growth.length - 1 || 1);
                  const x = padding + idx * stepX;
                  const y = growthHeight - padding - ((d.value / maxVal) * (growthHeight - padding * 2));
                  return (
                    <g key={idx} className="group cursor-pointer">
                      <circle cx={x} cy={y} r="5" fill="#10B981" className="transition-all hover:r-7" />
                      <text x={x} y={y - 12} fill="#A7F3D0" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        {d.value}
                      </text>
                      <text x={x} y={growthHeight - 6} fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="middle">
                        {d.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold block mb-6">// Event Participation Distribution</span>
            <div className="space-y-4">
              {event_participation.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No registrations logged yet.</p>
              ) : (
                event_participation.slice(0, 5).map((item, idx) => {
                  const maxVal = Math.max(...event_participation.map(x => x.value)) || 1;
                  const percent = Math.min(100, Math.round((item.value / maxVal) * 100));
                  return (
                    <div key={idx} className="space-y-1.5 text-left">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-350 font-bold truncate max-w-[200px]">{item.name}</span>
                        <span className="text-emerald-450 font-bold">{item.value} RSVPs</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold block mb-6">// Tech Stack Usage Frequency</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tech_distribution.length === 0 ? (
                <p className="text-xs text-slate-500 italic sm:col-span-2">No projects submitted yet.</p>
              ) : (
                tech_distribution.slice(0, 6).map((tech, idx) => {
                  const maxVal = Math.max(...tech_distribution.map(x => x.value)) || 1;
                  const percent = Math.min(100, Math.round((tech.value / maxVal) * 100));
                  return (
                    <div key={idx} className="p-3 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-350 font-bold">{tech.name}</span>
                        <span className="text-emerald-450 font-bold">{tech.value} Projs</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold block mb-6">// Engineering Project Lifecycles</span>
            <div className="space-y-4">
              {project_trends.length === 0 ? (
                <p className="text-xs text-slate-550 italic">No projects showcase entries found.</p>
              ) : (
                project_trends.map((item, idx) => {
                  const maxVal = Math.max(...project_trends.map(x => x.value)) || 1;
                  const percent = Math.min(100, Math.round((item.value / maxVal) * 100));
                  return (
                    <div key={idx} className="space-y-1 text-left">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">{item.name}</span>
                        <span className="text-indigo-400 font-bold">{item.value} Projects</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  //     ADMIN & CORE CONTROL PANEL RENDER
  // ==========================================

  const renderOverview = () => {
    const studentCount = usersList.filter(u => u.role === 'student').length;
    const coreCount = usersList.filter(u => u.role === 'core').length || 1;
    const activeEventsCount = events.length;
    const announcementsCount = announcements.length;

    return (
      <div className="space-y-8 animate-fade-in text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-mono font-bold tracking-wider">ACTIVE_MEMBERS</span>
              <div className="text-2xl font-extrabold text-slate-200 font-sans">{studentCount + coreCount + 1}</div>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl"><Users size={20} /></div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-mono font-bold tracking-wider">CORE_OFFICERS</span>
              <div className="text-2xl font-extrabold text-indigo-400 font-sans">{coreCount}</div>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl"><Award size={20} /></div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-mono font-bold tracking-wider">SCHEDULED_EVENTS</span>
              <div className="text-2xl font-extrabold text-blue-400 font-sans">{activeEventsCount}</div>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl"><Calendar size={20} /></div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-mono font-bold tracking-wider">BULLETINS_PINNED</span>
              <div className="text-2xl font-extrabold text-amber-400 font-sans">{announcementsCount}</div>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl"><Megaphone size={20} /></div>
          </div>
        </div>

        <GlowingCard hoverGlow="emerald" className="space-y-4">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Terminal size={18} className="text-emerald-400" /> Active Controller Session: {userProfile?.full_name}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Welcome to the GFGCOE Coding Club control panel. Use the sidebar navigation menu to coordinate club events, post real-time notice bulletins, showcase projects, and manage user accounts status levels.
          </p>
          <div className="text-xs text-slate-500 font-mono uppercase tracking-wider flex items-center gap-4">
            <span>● Status: online</span>
            <span>● Role: {userProfile?.role}</span>
          </div>
        </GlowingCard>
      </div>
    );
  };

  const renderEventsTable = () => (
    <div className="glass-panel rounded-3xl border border-slate-800/40 overflow-hidden text-left">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 text-xs font-mono tracking-wider uppercase">
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={events.length > 0 && selectedIds.length === events.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(events.map(ev => ev.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Date & Time</th>
              <th className="px-6 py-4 font-semibold">Location</th>
              <th className="px-6 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-sm">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-900/10 transition-colors">
                <td className="px-6 py-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(ev.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, ev.id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== ev.id));
                      }
                    }}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 font-semibold text-slate-200">{ev.title}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    {ev.category || 'Workshop'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                  {new Date(ev.date).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-slate-400 truncate max-w-[150px]">{ev.location}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleOpenEdit(ev)}
                      className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Edit Event"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProjectsTable = () => (
    <div className="glass-panel rounded-3xl border border-slate-800/40 overflow-hidden text-left">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 text-xs font-mono tracking-wider uppercase">
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={projects.length > 0 && selectedIds.length === projects.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(projects.map(proj => proj.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Tech Stack</th>
              <th className="px-6 py-4 font-semibold">Repository</th>
              <th className="px-6 py-4 font-semibold">Live URL</th>
              <th className="px-6 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-sm">
            {projects.map((proj) => (
              <tr key={proj.id} className="hover:bg-slate-900/10 transition-colors">
                <td className="px-6 py-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(proj.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, proj.id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== proj.id));
                      }
                    }}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 font-semibold text-slate-200">{proj.title}</td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400">{proj.tech_stack}</td>
                <td className="px-6 py-4">
                  {proj.github_link ? (
                    <a href={proj.github_link} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1 font-mono text-xs">
                      <ExternalLink size={12} /> repo
                    </a>
                  ) : <span className="text-slate-600 font-mono text-xs">none</span>}
                </td>
                <td className="px-6 py-4">
                  {proj.live_link ? (
                    <a href={proj.live_link} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-mono text-xs">
                      <ExternalLink size={12} /> live
                    </a>
                  ) : <span className="text-slate-600 font-mono text-xs">none</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleOpenEdit(proj)}
                      className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Edit Project"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(proj.id)}
                      className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCommitteeTable = () => (
    <div className="glass-panel rounded-3xl border border-slate-800/40 overflow-hidden text-left">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 text-xs font-mono tracking-wider uppercase">
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={committee.length > 0 && selectedIds.length === committee.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(committee.map(member => member.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Academic Year</th>
              <th className="px-6 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-sm">
            {committee.map((member) => (
              <tr key={member.id} className="hover:bg-slate-900/10 transition-colors">
                <td className="px-6 py-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, member.id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== member.id));
                      }
                    }}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 font-semibold text-slate-200">{member.name}</td>
                <td className="px-6 py-4 text-slate-400">{member.role}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">{member.year}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Edit Coordinator"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Coordinator"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderResourcesTable = () => (
    <div className="glass-panel rounded-3xl border border-slate-800/40 overflow-hidden text-left animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 text-xs font-mono tracking-wider uppercase">
              {userProfile?.role !== 'student' && (
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={resources.length > 0 && selectedIds.length === resources.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(resources.map(res => res.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                  />
                </th>
              )}
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Subtype</th>
              <th className="px-6 py-4 font-semibold">Topic</th>
              <th className="px-6 py-4 font-semibold text-center">Downloads</th>
              <th className="px-6 py-4 font-semibold">Link/Action</th>
              <th className="px-6 py-4 font-semibold">Tags</th>
              {userProfile?.role !== 'student' && <th className="px-6 py-4 font-semibold text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-sm">
            {resources.map((res) => (
              <tr key={res.id} className="hover:bg-slate-900/10 transition-colors">
                {userProfile?.role !== 'student' && (
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(res.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, res.id]);
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== res.id));
                        }
                      }}
                      className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                    />
                  </td>
                )}
                <td className="px-6 py-4 font-semibold text-slate-200">
                  <div className="flex flex-col">
                    <span>{res.title}</span>
                    {res.author && <span className="text-[10px] text-slate-500 font-mono">By {res.author}</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    res.type === 'blog' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                    res.type === 'sheet' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                    res.type === 'pdf' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' :
                    'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  }`}>
                    {res.type || 'link'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 border border-slate-850 text-slate-400">
                    {res.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-mono text-slate-300 font-bold">
                  {res.type === 'blog' ? '-' : `${res.download_count || 0} 📥`}
                </td>
                <td className="px-6 py-4">
                  {res.type === 'blog' ? (
                    <span className="text-slate-500 font-mono text-xs">interactive reading</span>
                  ) : res.link ? (
                    <a href={res.link} target="_blank" rel="noreferrer" className="text-emerald-450 hover:text-emerald-450 inline-flex items-center gap-1 font-mono text-xs">
                      <ExternalLink size={12} /> Resource Link
                    </a>
                  ) : <span className="text-slate-600 font-mono text-xs">-</span>}
                </td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400">{res.tags || 'none'}</td>
                {userProfile?.role !== 'student' && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleOpenEdit(res)}
                        className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Edit Resource"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Resource"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsersTable = () => (
    <div className="glass-panel rounded-3xl border border-slate-800/40 overflow-hidden text-left">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 text-xs font-mono tracking-wider uppercase">
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={usersList.length > 0 && selectedIds.length === usersList.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(usersList.map(u => u.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 font-semibold">Username</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Full Name</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
              <th className="px-6 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-sm">
            {usersList.map((u) => (
              <tr key={u.id} className="hover:bg-slate-900/10 transition-colors">
                <td className="px-6 py-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(u.id)}
                    disabled={u.username === 'admin'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, u.id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== u.id));
                      }
                    }}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                </td>
                <td className="px-6 py-4 font-semibold text-slate-200">{u.username}</td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{u.email}</td>
                <td className="px-6 py-4 text-slate-300">{u.full_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    u.role === 'admin' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' :
                    u.role === 'core' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' :
                    'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggleUserStatus(u)}
                    className="p-1 hover:scale-105 transition-transform text-slate-400 cursor-pointer"
                    title={u.is_active ? 'Deactivate User' : 'Activate User'}
                  >
                    {u.is_active ? (
                      <ToggleRight className="text-emerald-400" size={24} />
                    ) : (
                      <ToggleLeft className="text-slate-600" size={24} />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    {['admin', 'super_admin', 'super admin', 'coordinator', 'core', 'core_team', 'core team'].includes(u.role?.toLowerCase()) && (
                      <button
                        onClick={() => handleOpenManageHandles(u)}
                        className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-450 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Manage Coding Profiles"
                      >
                        <Code size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenResetPassword(u.id)}
                      className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Reset Password"
                    >
                      <Lock size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Edit User"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      disabled={u.username === 'admin'}
                      title="Delete User"
                    >
                      <Trash2 size={14} className={u.username === 'admin' ? 'opacity-30' : ''} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnnouncementsTable = () => (
    <div className="glass-panel rounded-3xl border border-slate-800/40 overflow-hidden text-left">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 text-xs font-mono tracking-wider uppercase">
              {userProfile?.role !== 'student' && (
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={announcements.length > 0 && selectedIds.length === announcements.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(announcements.map(ann => ann.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                  />
                </th>
              )}
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Pinned</th>
              <th className="px-6 py-4 font-semibold">Content</th>
              {userProfile?.role !== 'student' && <th className="px-6 py-4 font-semibold text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-sm">
            {announcements.map((ann) => (
              <tr key={ann.id} className="hover:bg-slate-900/10 transition-colors">
                {userProfile?.role !== 'student' && (
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(ann.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, ann.id]);
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== ann.id));
                        }
                      }}
                      className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                    />
                  </td>
                )}
                <td className="px-6 py-4 font-semibold text-slate-200">{ann.title}</td>
                <td className="px-6 py-4">
                  {ann.is_pinned ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 inline-flex items-center gap-1">
                      <Pin size={10} className="fill-amber-400" /> Pinned
                    </span>
                  ) : <span className="text-slate-600 font-mono text-xs">-</span>}
                </td>
                <td className="px-6 py-4 text-slate-400 max-w-[300px] truncate">{ann.content}</td>
                {userProfile?.role !== 'student' && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleOpenEdit(ann)}
                        className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Edit Announcement"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleApproveGuest = async (reqId) => {
    if (!window.confirm('Are you sure you want to approve this guest request? This will generate their institutional email and password.')) return;
    setLoading(true);
    try {
      await approveGuestRequest(reqId);
      alert('✓ Guest approved successfully! Institutional account has been generated.');
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to approve guest request.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectGuest = async (reqId) => {
    if (!window.confirm('Are you sure you want to reject this guest request?')) return;
    setLoading(true);
    try {
      await rejectGuestRequest(reqId);
      alert('✓ Guest request rejected.');
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to reject guest request.');
    } finally {
      setLoading(false);
    }
  };

  const renderApprovalsTable = () => (
    <div className="glass-panel rounded-3xl border border-slate-800/40 overflow-hidden text-left animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 text-xs font-mono tracking-wider uppercase">
              <th className="px-6 py-4 font-semibold">Guest User</th>
              <th className="px-6 py-4 font-semibold">College & Branch</th>
              <th className="px-6 py-4 font-semibold">Academic Year</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Date Requested</th>
              <th className="px-6 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-sm">
            {approvalRequests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-900/10 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{req.full_name}</span>
                    <span className="text-xs text-slate-500 font-mono">@{req.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-slate-350">{req.college_name}</span>
                    <span className="text-xs text-slate-450">{req.branch}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{req.academic_year}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    req.status === 'pending' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                    req.status === 'approved' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                    'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                  {new Date(req.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-center">
                  {req.status === 'pending' ? (
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleApproveGuest(req.id)}
                        className="px-3 py-1 bg-emerald-450 text-slate-950 hover:bg-emerald-400 rounded-lg transition-all text-xs font-mono font-bold cursor-pointer"
                        title="Approve Guest"
                      >
                        APPROVE
                      </button>
                      <button
                        onClick={() => handleRejectGuest(req.id)}
                        className="px-3 py-1 bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-lg transition-all text-xs font-mono font-bold cursor-pointer"
                        title="Reject Guest"
                      >
                        REJECT
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-550 font-mono text-xs">RESOLVED</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleOpenAddContest = () => {
    setEditingContestId(null);
    setContestFormData({ title: '', description: '', duration_minutes: 60, start_time: '', category: 'dsa' });
    setShowContestModal(true);
  };

  const handleOpenEditContest = (contest) => {
    setEditingContestId(contest.id);
    const dateObj = new Date(contest.start_time);
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
    setContestFormData({
      title: contest.title,
      description: contest.description,
      duration_minutes: contest.duration_minutes,
      start_time: localISOTime,
      category: contest.category || 'dsa'
    });
    setShowContestModal(true);
  };

  const handleContestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...contestFormData,
        start_time: new Date(contestFormData.start_time).toISOString()
      };
      if (editingContestId) {
        await updateContest(editingContestId, payload);
        alert('✓ Contest updated successfully!');
      } else {
        await createContest(payload);
        alert('✓ Contest created successfully!');
      }
      setShowContestModal(false);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to save contest.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContest = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this contest? All questions will be deleted as well.')) return;
    setLoading(true);
    try {
      await deleteContest(id);
      alert('✓ Contest deleted successfully.');
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete contest.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddQuestion = (contestId) => {
    setSelectedContestId(contestId);
    setQuestionFormData({ title: '', description: '', positive_points: 20, negative_points: 0, bonus_points: 0, question_type: 'coding', options: '', correct_option: 'A' });
    setShowQuestionModal(true);
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addContestQuestion(selectedContestId, {
        title: questionFormData.title,
        description: questionFormData.description,
        positive_points: parseInt(questionFormData.positive_points),
        negative_points: parseInt(questionFormData.negative_points),
        bonus_points: parseInt(questionFormData.bonus_points),
        question_type: questionFormData.question_type,
        options: questionFormData.question_type === 'quiz' ? questionFormData.options : null,
        correct_option: questionFormData.question_type === 'quiz' ? questionFormData.correct_option : null
      });
      alert('✓ Question added successfully to contest!');
      setShowQuestionModal(false);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to add question to contest.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this contest question?')) return;
    setLoading(true);
    try {
      await deleteContestQuestion(qId);
      alert('✓ Question deleted.');
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete question.');
    } finally {
      setLoading(false);
    }
  };

  const renderContestsTable = () => (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-end">
        <button
          onClick={handleOpenAddContest}
          className="glow-btn px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-900 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          <Plus size={14} /> CREATE_NEW_CONTEST_
        </button>
      </div>

      {contests.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl">
          <p className="text-slate-400 font-mono">NO_ACTIVE_CONTESTS_CONFIGURED</p>
          <p className="text-xs text-slate-500 mt-1">Click the button above to launch your first competitive programming contest or MCQ quiz!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {contests.map((contest) => (
            <div key={contest.id} className="glass-panel p-6 rounded-2xl border border-slate-800/40 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-3 border-b border-slate-900">
                <div className="text-left">
                  <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded mb-2 ${
                    contest.is_active ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {contest.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  
                  <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded mb-2 ml-2 uppercase ${
                    contest.category === 'quiz' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                    contest.category === 'comp' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {contest.category === 'quiz' ? 'MCQ_QUIZ' : contest.category === 'comp' ? 'COMPETITION' : 'DSA_CONTEST'}
                  </span>

                  <h4 className="text-lg font-extrabold text-slate-200">{contest.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">{contest.description}</p>
                </div>

                <div className="flex flex-col sm:items-end font-mono text-xs text-slate-400 gap-1 mt-1 shrink-0 text-left sm:text-right">
                  <span>Duration: {contest.duration_minutes} Mins</span>
                  <span>Starts: {new Date(contest.start_time).toLocaleString()}</span>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleOpenEditContest(contest)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Edit Contest"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteContest(contest.id)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Contest"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Questions section */}
              <div className="text-left space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase">// CONTEST_QUESTIONS ({contest.questions?.length || 0})</h5>
                  <button
                    onClick={() => handleOpenAddQuestion(contest.id)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-450 hover:text-emerald-400 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={10} /> ADD_QUESTION
                  </button>
                </div>

                {contest.questions && contest.questions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contest.questions.map((q) => (
                      <div key={q.id} className="p-4 bg-slate-950/80 border border-slate-900/60 rounded-xl flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h6 className="font-bold text-slate-350 text-sm">
                              {q.title}
                              <span className="bg-slate-900 border border-slate-850 text-slate-400 px-1.5 py-0.5 rounded uppercase text-[8px] font-mono ml-2">
                                {q.question_type || 'coding'}
                              </span>
                            </h6>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1 hover:bg-slate-900 rounded text-slate-500 hover:text-rose-450 transition-colors cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                          <p className="text-xs text-slate-450 mt-1 line-clamp-3 leading-relaxed">{q.description}</p>
                          
                          {/* MCQ Showcase */}
                          {q.question_type === 'quiz' && q.options && (
                            <div className="mt-3 text-left bg-slate-950 p-2.5 rounded-lg border border-slate-900 space-y-1">
                              <span className="text-[10px] text-slate-500 font-mono tracking-wider block">// QUIZ_OPTIONS:</span>
                              {q.options.split(',').map((opt, oIdx) => {
                                const label = String.fromCharCode(65 + oIdx); // A, B, C, D
                                const isCorrect = q.correct_option === label;
                                return (
                                  <div key={oIdx} className={`text-[11px] flex items-center gap-1.5 px-2 py-0.5 rounded ${isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400'}`}>
                                    <span className="font-bold">{label}.</span> {opt.trim()}
                                    {isCorrect && <span className="text-[9px] font-mono font-bold ml-auto bg-emerald-400/20 text-emerald-400 px-1 rounded">CORRECT</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[9px] font-mono pt-2">
                          <span className="bg-emerald-400/5 border border-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">+{q.positive_points} PTS</span>
                          {q.negative_points > 0 && <span className="bg-rose-500/5 border border-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded">-{q.negative_points} Penalty</span>}
                          {q.bonus_points > 0 && <span className="bg-indigo-500/5 border border-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded">+{q.bonus_points} Bonus</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-slate-550 italic bg-slate-950/40 p-3 border border-slate-900/60 rounded-xl">No questions configured for this contest.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleOpenResolveClaim = (claimId, pointsClaimed) => {
    setSelectedClaimId(claimId);
    setResolveClaimFormData({ status: 'approved', admin_notes: '', points_awarded: pointsClaimed });
    setShowResolveClaimModal(true);
  };

  const handleResolveClaimSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resolvePointClaim(selectedClaimId, {
        status: resolveClaimFormData.status,
        admin_notes: resolveClaimFormData.admin_notes,
        points_awarded: parseInt(resolveClaimFormData.points_awarded)
      });
      alert('✓ Point claim resolved successfully!');
      setShowResolveClaimModal(false);
      await fetchProfileAndData();
    } catch (err) {
      console.error(err);
      alert('Failed to resolve claim.');
    } finally {
      setLoading(false);
    }
  };

  const renderClaimsTable = () => (
    <div className="glass-panel rounded-3xl border border-slate-800/40 overflow-hidden text-left animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 text-xs font-mono tracking-wider uppercase">
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Description</th>
              <th className="px-6 py-4 font-semibold text-center">Claimed Points</th>
              <th className="px-6 py-4">Evidence Links</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
              <th className="px-6 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-sm">
            {claims.map((claim) => (
              <tr key={claim.id} className="hover:bg-slate-900/10 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-200">@{claim.user_username || claim.user_id}</span>
                </td>
                <td className="px-6 py-4 text-slate-350 max-w-xs truncate">
                  {claim.proof_description}
                </td>
                <td className="px-6 py-4 text-center font-mono font-bold text-emerald-400">
                  +{claim.points_claimed}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2.5 items-center">
                    {claim.github_link && (
                      <a href={claim.github_link} target="_blank" rel="noreferrer" className="text-slate-450 hover:text-emerald-400 inline-flex items-center gap-1 font-mono text-xs">
                        <ExternalLink size={12} /> GitHub
                      </a>
                    )}
                    {claim.screenshot_url && (
                      <a href={claim.screenshot_url} target="_blank" rel="noreferrer" className="text-slate-450 hover:text-emerald-400 inline-flex items-center gap-1 font-mono text-xs">
                        <ExternalLink size={12} /> Image
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    claim.status === 'pending' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                    claim.status === 'approved' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                    'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}>
                    {claim.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {claim.status === 'pending' ? (
                    <button
                      onClick={() => handleOpenResolveClaim(claim.id, claim.points_claimed)}
                      className="px-3 py-1.5 bg-emerald-450 text-slate-950 hover:bg-emerald-400 border border-emerald-500/20 rounded-lg transition-all text-xs font-mono font-bold cursor-pointer"
                    >
                      RESOLVE
                    </button>
                  ) : (
                    <span className="text-slate-550 font-mono text-xs">RESOLVED</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- CHOOSE ACTIVE SIDEBAR LINKS BY ROLE ---

  const getSidebarLinks = () => {
    if (userProfile?.role === 'student') {
      return [
        { id: 'overview', label: 'My Portal Overview', icon: <BarChart3 size={18} /> },
        { id: 'my-events', label: 'Registered Events', icon: <Calendar size={18} /> },
        { id: 'upload-project', label: 'Upload Project Build', icon: <FolderPlus size={18} /> },
        { id: 'my-certificates', label: 'My Credentials', icon: <Award size={18} /> },
        { id: 'resources', label: 'Access Resources', icon: <BookOpen size={18} /> },
        { id: 'bulletins', label: 'Pinned Bulletins', icon: <Megaphone size={18} /> },
      ];
    }
    
    return [
      { id: 'overview', label: 'Dashboard Overview', icon: <BarChart3 size={18} />, visible: true },
      { id: 'users', label: 'User Management', icon: <Key size={18} />, visible: userProfile?.role === 'admin' },
      { id: 'approvals', label: 'Guest Approvals', icon: <UserCheck size={18} />, visible: userProfile?.role === 'admin' },
      { id: 'contests', label: 'Contests Manager', icon: <Terminal size={18} />, visible: true },
      { id: 'claims', label: 'Claims Resolver', icon: <Award size={18} />, visible: true },
      { id: 'announcements', label: 'Announcements Board', icon: <Megaphone size={18} />, visible: true },
      { id: 'events', label: 'Events Manager', icon: <Calendar size={18} />, visible: true },
      { id: 'projects', label: 'Projects Showcase', icon: <Code size={18} />, visible: true },
      { id: 'committee', label: 'Committee Lists', icon: <Users size={18} />, visible: userProfile?.role === 'admin' },
      { id: 'resources', label: 'Resources DB', icon: <BookOpen size={18} />, visible: true },
      { id: 'analytics', label: 'Executive Analytics', icon: <BarChart3 size={18} />, visible: userProfile?.role === 'admin' },
      { id: 'cms', label: 'CMS Settings', icon: <Globe size={18} />, visible: userProfile?.role === 'admin' },
      { id: 'achievements', label: 'Achievements Ledger', icon: <Award size={18} />, visible: userProfile?.role === 'admin' },
      { id: 'coding-sync', label: 'Coding Standings Sync', icon: <RefreshCw size={18} />, visible: userProfile?.role === 'admin' },
    ].filter(link => link.visible);
  };

  const sidebarLinks = getSidebarLinks();

  return (
    <div className="min-h-[85vh] flex flex-col md:flex-row relative">
      
      {/* Dynamic Points popup notification for student uploads */}
      {earnedPoints > 0 && (
        <div className="fixed bottom-10 right-10 bg-emerald-400 text-slate-900 px-6 py-4 rounded-2xl font-mono font-bold shadow-2xl z-50 animate-bounce flex items-center gap-2 border border-emerald-300">
          <CheckCircle2 size={20} /> CREDITS_AWARDED (+{earnedPoints} PTS)
        </div>
      )}

      {/* 1. COLLAPSIBLE LEFT NAVIGATION SIDEBAR */}
      <aside className={`glass-panel border-r border-slate-900/80 transition-all duration-300 z-10 shrink-0 text-left ${
        sidebarOpen ? 'w-full md:w-64' : 'w-full md:w-16'
      }`}>
        <div className="p-4 border-b border-slate-900/60 flex items-center justify-between">
          {sidebarOpen && (
            <span className="font-mono text-xs font-bold text-slate-500 tracking-wider">
              {userProfile?.role === 'student' ? 'MEMBER_MENU_' : 'GFGCOE_MENU_'}
            </span>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-slate-800/40 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors ml-auto cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu size={16} />
          </button>
        </div>

        <nav className="p-2 space-y-1.5">
          {sidebarLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`w-full flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-mono transition-all cursor-pointer ${
                activeTab === link.id
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-400 pl-2.5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 pl-3'
              }`}
            >
              <span className={activeTab === link.id ? 'text-emerald-400' : 'text-slate-500'}>
                {link.icon}
              </span>
              {sidebarOpen && <span className="truncate">{link.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* 2. CORE DASHBOARD CONTENT PANEL */}
      <main className="flex-1 p-6 md:p-8 space-y-8 min-w-0">
        
        {/* Dynamic Section Title headers */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
              // {userProfile?.role === 'student' ? 'STUDENT_PORTAL' : 'CONTROL_MODULE'} :: {activeTab.toUpperCase()}
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-100 uppercase">
              {activeTab === 'overview' ? 'Dashboard Summary' : activeTab.replace('-', ' ') + ' Manager'}
            </h2>
          </div>

          {userProfile?.role !== 'student' && activeTab !== 'overview' && activeTab !== 'approvals' && activeTab !== 'contests' && activeTab !== 'claims' && activeTab !== 'analytics' && activeTab !== 'cms' && activeTab !== 'coding-sync' && (
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-rose-450 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Trash2 size={16} /> BULK_DELETE_SELECTED_({selectedIds.length})
                </button>
              )}
              <button
                onClick={handleOpenAdd}
                className="glow-btn px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                <Plus size={16} /> ADD_NEW_{activeTab.toUpperCase().slice(0, -1)}__
              </button>
            </div>
          )}
        </div>

        {/* Dashboard views router logic */}
        {loading && !showModal ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="animate-spin text-emerald-400" size={32} />
          </div>
        ) : (
          <>
            {/* Student Specific view controllers */}
            {userProfile?.role === 'student' && (
              <>
                {activeTab === 'overview' && renderStudentOverview()}
                {activeTab === 'my-events' && renderStudentEvents()}
                {activeTab === 'my-certificates' && renderStudentCertificates()}
                {activeTab === 'upload-project' && renderStudentUploadProject()}
                {activeTab === 'resources' && resources.length > 0 && renderResourcesTable()}
                {activeTab === 'bulletins' && announcements.length > 0 && renderAnnouncementsTable()}
              </>
            )}

            {/* Admin / Core Specific view controllers */}
            {userProfile?.role !== 'student' && (
              <>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'events' && events.length > 0 && renderEventsTable()}
                {activeTab === 'projects' && projects.length > 0 && renderProjectsTable()}
                {activeTab === 'committee' && committee.length > 0 && renderCommitteeTable()}
                {activeTab === 'resources' && resources.length > 0 && renderResourcesTable()}
                
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-3xl border border-slate-800/40 flex flex-col sm:flex-row justify-between items-center gap-6 text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-[35px] pointer-events-none"></div>
                      <div className="space-y-1 flex-1 text-left">
                        <h4 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wide">// BULK MEMBERS INGESTION ENGINE</h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                          Ingest large cohorts using spreadsheets. Duplicate checking ensures user accounts are updated backward-compatibly with standard credentials like <code className="bg-slate-950 px-1 py-0.5 border border-slate-900 text-indigo-400 font-mono text-[10px] rounded">Member@123</code>.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4 items-center shrink-0">
                        <label className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-indigo-455 hover:text-indigo-400 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-lg">
                          <Upload size={14} /> IMPORT_CSV_
                          <input type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
                        </label>
                        <button
                          onClick={handleExportUsers}
                          className="px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-455 hover:text-indigo-400 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-lg"
                        >
                          <Download size={14} /> EXPORT_CSV_
                        </button>
                      </div>
                    </div>
                    {usersList.length > 0 && renderUsersTable()}
                  </div>
                )}
                
                {activeTab === 'announcements' && announcements.length > 0 && renderAnnouncementsTable()}
                {activeTab === 'approvals' && approvalRequests.length > 0 && renderApprovalsTable()}
                {activeTab === 'contests' && renderContestsTable()}
                {activeTab === 'claims' && claims.length > 0 && renderClaimsTable()}
                
                {activeTab === 'cms' && renderCmsEditor()}
                {activeTab === 'achievements' && renderAchievementsLedger()}
                {activeTab === 'coding-sync' && renderCodingSyncManager()}
                {activeTab === 'analytics' && renderExecutiveAnalytics()}
              </>
            )}

            {/* General Empty views logs */}
            {((activeTab === 'resources' && resources.length === 0) ||
              (activeTab === 'announcements' && announcements.length === 0) ||
              (activeTab === 'bulletins' && announcements.length === 0) ||
              (activeTab === 'approvals' && approvalRequests.length === 0) ||
              (activeTab === 'achievements' && achievementsList.length === 0) ||
              (activeTab === 'claims' && claims.length === 0)) && (
              <div className="text-center py-20 glass-panel rounded-3xl">
                <p className="text-slate-400 font-mono">NO_DATA_RECORDS_AVAILABLE_IN_THIS_TAB</p>
              </div>
            )}
          </>
        )}

      </main>

      {/* CRUD Edit / Add Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900">
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
                // {editingId ? 'Edit Record' : 'Create Record'} :: {activeTab.toUpperCase()}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {activeTab === 'events' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">EVENT_TITLE</label>
                    <input type="text" required value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">CATEGORY</label>
                      <select value={formData.category || 'Workshop'} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500">
                        <option value="Workshop">Workshop</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Coding Contest">Coding Contest</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">DATE_TIME</label>
                      <input type="datetime-local" required value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">LOCATION</label>
                    <input type="text" required placeholder="Lab 3 / YouTube..." value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">IMAGE_URL</label>
                    <input type="url" placeholder="https://unsplash.com/..." value={formData.image_url || ''} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">REGISTRATION_LINK</label>
                    <input type="url" placeholder="https://forms.google.com/..." value={formData.registration_link || ''} onChange={(e) => setFormData({ ...formData, registration_link: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">DESCRIPTION</label>
                    <textarea rows={3} required value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                </>
              )}

              {activeTab === 'projects' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">PROJECT_TITLE</label>
                    <input type="text" required value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">TECH_STACK</label>
                    <input type="text" required placeholder="React, FastAPI, SQLite..." value={formData.tech_stack || ''} onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">GITHUB_LINK</label>
                      <input type="url" placeholder="https://github.com/..." value={formData.github_link || ''} onChange={(e) => setFormData({ ...formData, github_link: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">LIVE_LINK</label>
                      <input type="url" placeholder="https://project.org/..." value={formData.live_link || ''} onChange={(e) => setFormData({ ...formData, live_link: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">IMAGE_URL</label>
                    <input type="url" placeholder="https://unsplash.com/..." value={formData.image_url || ''} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">DESCRIPTION</label>
                    <textarea rows={3} required value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                </>
              )}

              {activeTab === 'committee' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">FULL_NAME</label>
                    <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">ROLE_POSITION</label>
                      <input type="text" required placeholder="President / Web Lead..." value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">ACADEMIC_YEAR</label>
                      <input type="text" required placeholder="2026" value={formData.year || ''} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">PROFILE_IMAGE_URL</label>
                    <input type="url" placeholder="https://unsplash.com/..." value={formData.image_url || ''} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">LINKEDIN_URL</label>
                      <input type="url" placeholder="https://linkedin.com/in/..." value={formData.linkedin_url || ''} onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">GITHUB_URL</label>
                      <input type="url" placeholder="https://github.com/..." value={formData.github_url || ''} onChange={(e) => setFormData({ ...formData, github_url: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'resources' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">RESOURCE_TITLE</label>
                      <input type="text" required value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">RESOURCE_TYPE</label>
                      <select value={formData.type || 'resource'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer">
                        <option value="resource">Standard Resource Link</option>
                        <option value="notes">Lecture Notes</option>
                        <option value="sheet">Coding Sheet</option>
                        <option value="pdf">PDF Document</option>
                        <option value="blog">Blog / Tutorial</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">CATEGORY (TOPIC)</label>
                      <select value={formData.category || 'DSA'} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer">
                        <option value="DSA">DSA</option>
                        <option value="Web Dev">Web Dev</option>
                        <option value="AI/ML">AI/ML</option>
                        <option value="Competitive Programming">Competitive Programming</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">TAGS_CSV</label>
                      <input type="text" placeholder="Arrays, Dynamic Programming..." value={formData.tags || ''} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  
                  {formData.type !== 'blog' && (
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">RESOURCE_LINK (LINK / PDF / DRIVE URL)</label>
                      <input type="url" required placeholder="https://drive.google.com/... or github..." value={formData.link || ''} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">AUTHOR_NAME (OPTIONAL)</label>
                    <input type="text" placeholder="e.g. Siddharth Mehta Lead" value={formData.author || ''} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">DESCRIPTION (SHORT OVERVIEW)</label>
                    <textarea rows={2} required value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>

                  {formData.type === 'blog' && (
                    <div className="space-y-2 pt-2 border-t border-slate-900 animate-fade-in">
                      <span className="text-xs font-mono font-semibold text-slate-400 block">// INTEGRATED MARKDOWN EDITOR:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64">
                        <div className="flex flex-col h-full">
                          <label className="text-[10px] font-mono text-slate-500 mb-1">MARKDOWN_SOURCE</label>
                          <textarea
                            value={formData.content || ''}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="# Tutorial Title&#10;## Subtitle&#10;Use **bold** and `inline` code or:&#10;```&#10;code blocks&#10;```"
                            className="flex-grow p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs font-mono text-slate-350 focus:outline-none focus:border-emerald-500/60 resize-none h-full overflow-y-auto"
                          />
                        </div>
                        <div className="flex flex-col h-full">
                          <label className="text-[10px] font-mono text-slate-500 mb-1">LIVE_PREVIEW</label>
                          <div
                            dangerouslySetInnerHTML={{ __html: parseMarkdown(formData.content) || '<span class="text-slate-650 font-mono italic">Start typing markdown to preview...</span>' }}
                            className="flex-grow p-3 bg-slate-900/40 border border-slate-900/60 rounded-xl text-xs text-slate-400 overflow-y-auto max-h-52 text-left leading-relaxed prose prose-invert"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'announcements' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">ANNOUNCEMENT_TITLE</label>
                    <input type="text" required placeholder="Contest Registration Open..." value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1 py-2 flex items-center gap-2">
                    <input type="checkbox" id="is_pinned" checked={formData.is_pinned || false} onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })} className="w-4 h-4 text-emerald-400 bg-slate-900 border-slate-850 rounded focus:ring-emerald-500" />
                    <label htmlFor="is_pinned" className="text-xs font-mono font-semibold text-slate-400 cursor-pointer">PIN_TO_TOP_OF_NOTICEBOARD</label>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">ANNOUNCEMENT_CONTENT</label>
                    <textarea rows={5} required placeholder="Write broadcasting details..." value={formData.content || ''} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                </>
              )}

              {activeTab === 'users' && (
                <>
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-2 text-indigo-400 text-xs font-mono mb-2">
                    <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">SECURITY ENFORCEMENT PROTOCOL:</span>
                      <p className="mt-1 text-[11px] leading-relaxed">
                        Institutional ID matching <code className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800">*@gfgcoe.codingclub.in</code> is required. All standard providers like Gmail, Yahoo, or Outlook are blocked.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">USERNAME_ID</label>
                      <input type="text" required placeholder="e.g. rohan12" disabled={!!editingId} value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-3 py-2 bg-slate-900 disabled:opacity-50 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">ROLE_ACCESS_LEVEL</label>
                      <select value={formData.role || 'student'} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500">
                        <option value="student">Student Member</option>
                        <option value="core">Core Member</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">INSTITUTIONAL_EMAIL_ID</label>
                    <input type="email" required placeholder="username@gfgcoe.codingclub.in" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">FULL_NAME</label>
                    <input type="text" required placeholder="e.g. Rohan Deshmukh" value={formData.full_name || ''} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>

                  {!editingId && (
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">CREDENTIAL_PASSWORD</label>
                      <input type="password" required placeholder="Enter password..." value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'achievements' && (
                <>
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-mono font-semibold text-slate-500">ACHIEVEMENT_TITLE</label>
                    <input type="text" required placeholder="e.g. Smart Hackathon First Place..." value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">CATEGORY</label>
                      <select value={formData.category || 'Hackathons'} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer">
                        <option value="Hackathons">Hackathons</option>
                        <option value="Coding Competitions">Coding Competitions</option>
                        <option value="Research Publications">Research Publications</option>
                        <option value="Certifications">Certifications</option>
                        <option value="Awards">Awards</option>
                        <option value="Community Contributions">Community Contributions</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">ACHIEVEMENT_DATE</label>
                      <input type="date" required value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-mono font-semibold text-slate-500">ACHIEVED_BY (MEMBERS COMMA SEPARATED)</label>
                    <input type="text" required placeholder="e.g. Siddharth Mehta, Amit Patel" value={formData.achieved_by || ''} onChange={(e) => setFormData({ ...formData, achieved_by: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">EVIDENCE_LINK_URL</label>
                      <input type="url" placeholder="https://..." value={formData.link || ''} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-semibold text-slate-500">IMAGE_URL</label>
                      <input type="url" placeholder="https://unsplash.com/..." value={formData.image_url || ''} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-mono font-semibold text-slate-500">DESCRIPTION</label>
                    <textarea rows={3} required placeholder="Detail the victory context..." value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">CANCEL_</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-emerald-400 text-slate-900 hover:bg-emerald-300 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer">{loading ? 'SAVING_...' : 'SAVE_RECORD_'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PASSWORD OVERRIDE MODAL DIALOG */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900">
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
                // Credentials Override
              </h3>
              <button onClick={() => setShowResetModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-400 text-xs font-mono">
                <Lock size={16} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">ADMIN PASSWORD RESET:</span>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    This overrides the user's password using standard bcrypt hashing. Make sure to share the new key with the member.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-500">NEW_CREDENTIAL_PASSWORD</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Enter new password..." 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button type="button" onClick={() => setShowResetModal(false)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">CANCEL_</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-rose-500 text-white hover:bg-rose-400 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer">{loading ? 'OVERRIDING_...' : 'OVERRIDE_KEY_'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTEST EDITOR MODAL */}
      {showContestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900">
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
                // {editingContestId ? 'Edit Contest' : 'Create Contest'}
              </h3>
              <button onClick={() => setShowContestModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleContestSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">CONTEST_TITLE</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. CodeWar 2026..." 
                    value={contestFormData.title} 
                    onChange={(e) => setContestFormData({ ...contestFormData, title: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">CONTEST_CATEGORY</label>
                  <select 
                    value={contestFormData.category || 'dsa'} 
                    onChange={(e) => setContestFormData({ ...contestFormData, category: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="dsa">DSA Coding Contest</option>
                    <option value="quiz">Multiple Choice Quiz</option>
                    <option value="comp">Standard Competition</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">DURATION_MINUTES</label>
                  <input 
                    type="number" 
                    required 
                    min={5} 
                    value={contestFormData.duration_minutes} 
                    onChange={(e) => setContestFormData({ ...contestFormData, duration_minutes: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">START_TIME</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={contestFormData.start_time} 
                    onChange={(e) => setContestFormData({ ...contestFormData, start_time: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-500">DESCRIPTION</label>
                <textarea 
                  rows={4} 
                  required 
                  placeholder="Outline contest rules and topics..." 
                  value={contestFormData.description} 
                  onChange={(e) => setContestFormData({ ...contestFormData, description: e.target.value })} 
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button type="button" onClick={() => setShowContestModal(false)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">CANCEL_</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-emerald-400 text-slate-900 hover:bg-emerald-300 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer">{loading ? 'SAVING_...' : 'SAVE_CONTEST_'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTEST QUESTION ADDER MODAL */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900">
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
                // Add Question to Contest
              </h3>
              <button onClick={() => setShowQuestionModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleQuestionSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">QUESTION_TITLE</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Reverse a String..." 
                    value={questionFormData.title} 
                    onChange={(e) => setQuestionFormData({ ...questionFormData, title: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">QUESTION_TYPE</label>
                  <select 
                    value={questionFormData.question_type || 'coding'} 
                    onChange={(e) => setQuestionFormData({ ...questionFormData, question_type: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="coding">Standard Coding Task</option>
                    <option value="quiz">Multiple Choice Quiz (MCQ)</option>
                  </select>
                </div>
              </div>

              {questionFormData.question_type === 'quiz' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">QUIZ_OPTIONS (COMMA SEPARATED)</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Array, LinkedList, Stack, Queue" 
                      value={questionFormData.options || ''} 
                      onChange={(e) => setQuestionFormData({ ...questionFormData, options: e.target.value })} 
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-500">CORRECT_ANSWER_KEY</label>
                    <select 
                      value={questionFormData.correct_option || 'A'} 
                      onChange={(e) => setQuestionFormData({ ...questionFormData, correct_option: e.target.value })} 
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="A">Option A (First Option)</option>
                      <option value="B">Option B (Second Option)</option>
                      <option value="C">Option C (Third Option)</option>
                      <option value="D">Option D (Fourth Option)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">POSITIVE_PTS</label>
                  <input 
                    type="number" 
                    required 
                    min={0} 
                    value={questionFormData.positive_points} 
                    onChange={(e) => setQuestionFormData({ ...questionFormData, positive_points: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">PENALTY_PTS</label>
                  <input 
                    type="number" 
                    required 
                    min={0} 
                    value={questionFormData.negative_points} 
                    onChange={(e) => setQuestionFormData({ ...questionFormData, negative_points: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">BONUS_PTS</label>
                  <input 
                    type="number" 
                    required 
                    min={0} 
                    value={questionFormData.bonus_points} 
                    onChange={(e) => setQuestionFormData({ ...questionFormData, bonus_points: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-500">QUESTION_DESCRIPTION</label>
                <textarea 
                  rows={4} 
                  required 
                  placeholder="Detail the prompt constraints and solution guidelines..." 
                  value={questionFormData.description} 
                  onChange={(e) => setQuestionFormData({ ...questionFormData, description: e.target.value })} 
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button type="button" onClick={() => setShowQuestionModal(false)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">CANCEL_</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-emerald-400 text-slate-900 hover:bg-emerald-300 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer">{loading ? 'ADDING_...' : 'ADD_QUESTION_'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE POINT CLAIM MODAL */}
      {showResolveClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900">
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
                // Resolve Point Claim
              </h3>
              <button onClick={() => setShowResolveClaimModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleResolveClaimSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">RESOLUTION_STATUS</label>
                  <select 
                    value={resolveClaimFormData.status} 
                    onChange={(e) => setResolveClaimFormData({ ...resolveClaimFormData, status: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="approved">Approve Claim</option>
                    <option value="rejected">Reject Claim</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">POINTS_AWARDED</label>
                  <input 
                    type="number" 
                    required 
                    min={0} 
                    value={resolveClaimFormData.points_awarded} 
                    onChange={(e) => setResolveClaimFormData({ ...resolveClaimFormData, points_awarded: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-500">ADMIN_RESOLUTION_NOTES</label>
                <textarea 
                  rows={3} 
                  placeholder="e.g. Excellent work! Code compiles and passes all test-cases..." 
                  value={resolveClaimFormData.admin_notes} 
                  onChange={(e) => setResolveClaimFormData({ ...resolveClaimFormData, admin_notes: e.target.value })} 
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button type="button" onClick={() => setShowResolveClaimModal(false)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">CANCEL_</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-emerald-400 text-slate-900 hover:bg-emerald-300 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer">{loading ? 'RESOLVING_...' : 'RESOLVE_CLAIM_'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CODING PROFILE HANDLES MODAL */}
      {showHandlesModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900">
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
                // Handles: {selectedUser.full_name || selectedUser.username}
              </h3>
              <button onClick={() => setShowHandlesModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleHandlesSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-500">GITHUB_USERNAME</label>
                <input 
                  type="text" 
                  value={handlesFormData.github_username} 
                  onChange={(e) => setHandlesFormData({ ...handlesFormData, github_username: e.target.value })} 
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">LEETCODE_USERNAME</label>
                  <input 
                    type="text" 
                    value={handlesFormData.leetcode_username} 
                    onChange={(e) => setHandlesFormData({ ...handlesFormData, leetcode_username: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">CODEFORCES_USERNAME</label>
                  <input 
                    type="text" 
                    value={handlesFormData.codeforces_username} 
                    onChange={(e) => setHandlesFormData({ ...handlesFormData, codeforces_username: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">GEEKSFORGEEKS_USERNAME</label>
                  <input 
                    type="text" 
                    value={handlesFormData.gfg_username} 
                    onChange={(e) => setHandlesFormData({ ...handlesFormData, gfg_username: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-500">HACKERRANK_USERNAME</label>
                  <input 
                    type="text" 
                    value={handlesFormData.hackerrank_username} 
                    onChange={(e) => setHandlesFormData({ ...handlesFormData, hackerrank_username: e.target.value })} 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              {codingProfilesList.find(p => p.user_id === selectedUser.id) && (
                <div className="pt-2 border-t border-slate-900 flex justify-between gap-2 items-center flex-wrap">
                  <button
                    type="button"
                    onClick={handleHandlesSync}
                    className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 hover:bg-emerald-500/20 rounded-lg text-[10px] font-mono font-bold cursor-pointer"
                  >
                    SYNC_NOW
                  </button>
                  <button
                    type="button"
                    onClick={handleHandlesToggleTracking}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 rounded-lg text-[10px] font-mono font-bold cursor-pointer"
                  >
                    {codingProfilesList.find(p => p.user_id === selectedUser.id).is_tracking_enabled ? 'DISABLE_TRACKING' : 'ENABLE_TRACKING'}
                  </button>
                  <button
                    type="button"
                    onClick={handleHandlesRemove}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-mono font-bold cursor-pointer"
                  >
                    REMOVE_PROFILE
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button type="button" onClick={() => setShowHandlesModal(false)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">CANCEL_</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-emerald-400 text-slate-900 hover:bg-emerald-300 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer">SAVE_PROFILE_</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET LEADERBOARD MODAL */}
      {showResetLeaderboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900">
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
                // Reset Leaderboard
              </h3>
              <button onClick={() => setShowResetLeaderboardModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleResetLeaderboardSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-500">RESET_INTERVAL_TYPE</label>
                <select 
                  value={resetLeaderboardFormData.snapshot_type} 
                  onChange={(e) => setResetLeaderboardFormData({ ...resetLeaderboardFormData, snapshot_type: e.target.value })} 
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="monthly">Monthly Reset</option>
                  <option value="semester">Semester Reset</option>
                  <option value="annual">Annual Reset</option>
                  <option value="archive">Manual Standing Archive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-500">SNAPSHOT_LABEL_NAME</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Term 1 Standing Snap..." 
                  value={resetLeaderboardFormData.name} 
                  onChange={(e) => setResetLeaderboardFormData({ ...resetLeaderboardFormData, name: e.target.value })} 
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button type="button" onClick={() => setShowResetLeaderboardModal(false)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">CANCEL_</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-rose-500 text-white hover:bg-rose-400 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer">PERFORM_RESET_</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
