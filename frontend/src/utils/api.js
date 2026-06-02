import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration (401 errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page to allow re-authentication
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- AUTHENTICATION API ---
export const loginUser = async (username, password) => {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  
  const response = await axios.post(`${API_BASE_URL}/token`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data; // { access_token, token_type }
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// --- PUBLIC DATA APIS ---
export const getEvents = async () => {
  const response = await api.get('/events');
  return response.data;
};

export const getEvent = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const getCommittee = async () => {
  const response = await api.get('/committee');
  return response.data;
};

export const getResources = async () => {
  const response = await api.get('/resources');
  return response.data;
};

// --- ADMIN CRUD - EVENTS ---
export const createEvent = async (eventData) => {
  const response = await api.post('/admin/events', eventData);
  return response.data;
};

export const updateEvent = async (id, eventData) => {
  const response = await api.put(`/admin/events/${id}`, eventData);
  return response.data;
};

export const deleteEvent = async (id) => {
  await api.delete(`/admin/events/${id}`);
};

// --- ADMIN CRUD - PROJECTS ---
export const createProject = async (projectData) => {
  const response = await api.post('/admin/projects', projectData);
  return response.data;
};

export const updateProject = async (id, projectData) => {
  const response = await api.put(`/admin/projects/${id}`, projectData);
  return response.data;
};

export const deleteProject = async (id) => {
  await api.delete(`/admin/projects/${id}`);
};

// --- ADMIN CRUD - COMMITTEE ---
export const createCommitteeMember = async (memberData) => {
  const response = await api.post('/admin/committee', memberData);
  return response.data;
};

export const updateCommitteeMember = async (id, memberData) => {
  const response = await api.put(`/admin/committee/${id}`, memberData);
  return response.data;
};

export const deleteCommitteeMember = async (id) => {
  await api.delete(`/admin/committee/${id}`);
};

// --- ADMIN CRUD - RESOURCES ---
export const createResource = async (resourceData) => {
  const response = await api.post('/admin/resources', resourceData);
  return response.data;
};

export const updateResource = async (id, resourceData) => {
  const response = await api.put(`/admin/resources/${id}`, resourceData);
  return response.data;
};

export const deleteResource = async (id) => {
  await api.delete(`/admin/resources/${id}`);
};

// --- ADMIN CRUD - USER ACCOUNTS ---
export const getUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/admin/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  await api.delete(`/admin/users/${id}`);
};

// --- ADMIN CRUD - ANNOUNCEMENTS ---
export const getAnnouncements = async () => {
  const response = await api.get('/announcements');
  return response.data;
};

export const createAnnouncement = async (announcementData) => {
  const response = await api.post('/admin/announcements', announcementData);
  return response.data;
};

export const updateAnnouncement = async (id, announcementData) => {
  const response = await api.put(`/admin/announcements/${id}`, announcementData);
  return response.data;
};

export const deleteAnnouncement = async (id) => {
  await api.delete(`/admin/announcements/${id}`);
};

// --- STUDENT MEMBER PORTAL APIS ---
export const registerForEvent = async (eventId) => {
  const response = await api.post(`/events/${eventId}/register`);
  return response.data;
};

export const getMyRegistrations = async () => {
  const response = await api.get('/users/me/registrations');
  return response.data;
};

export const uploadStudentProject = async (projectData) => {
  const response = await api.post('/users/me/projects', projectData);
  return response.data;
};

// --- GAMIFICATION & LEADERBOARD APIS ---
export const getLeaderboard = async (timeframe = 'all_time') => {
  const response = await api.get(`/gamification/leaderboard?timeframe=${timeframe}`);
  return response.data;
};

export const getMyGamification = async () => {
  const response = await api.get('/users/me/gamification');
  return response.data;
};

// --- GUEST REGISTRATION & APPROVAL WORKFLOW APIS ---
export const guestRegister = async (guestData) => {
  const response = await api.post('/auth/guest-register', guestData);
  return response.data;
};

export const getGuestStatus = async (username) => {
  const response = await api.get(`/auth/guest-status/${username}`);
  return response.data;
};

export const getApprovalRequests = async () => {
  const response = await api.get('/admin/approval-requests');
  return response.data;
};

export const approveGuestRequest = async (id) => {
  const response = await api.post(`/admin/approval-requests/${id}/approve`);
  return response.data;
};

export const rejectGuestRequest = async (id) => {
  const response = await api.post(`/admin/approval-requests/${id}/reject`);
  return response.data;
};

// --- CONTEST APIS ---
export const getContests = async () => {
  const response = await api.get('/contests');
  return response.data;
};

export const getContestQuestions = async (contestId) => {
  const response = await api.get(`/contests/${contestId}/questions`);
  return response.data;
};

export const createContest = async (contestData) => {
  const response = await api.post('/admin/contests', contestData);
  return response.data;
};

export const updateContest = async (id, contestData) => {
  const response = await api.put(`/admin/contests/${id}`, contestData);
  return response.data;
};

export const deleteContest = async (id) => {
  await api.delete(`/admin/contests/${id}`);
};

export const addContestQuestion = async (contestId, qData) => {
  const response = await api.post(`/admin/contests/${contestId}/questions`, qData);
  return response.data;
};

export const deleteContestQuestion = async (qId) => {
  await api.delete(`/admin/contests/questions/${qId}`);
};

// --- POINT CLAIMS APIS ---
export const submitPointClaim = async (claimData) => {
  const response = await api.post('/users/me/claims', claimData);
  return response.data;
};

export const getMyClaims = async () => {
  const response = await api.get('/users/me/claims');
  return response.data;
};

export const getAdminClaims = async () => {
  const response = await api.get('/admin/claims');
  return response.data;
};

export const resolvePointClaim = async (claimId, resolutionData) => {
  const response = await api.post(`/admin/claims/${claimId}/resolve`, resolutionData);
  return response.data;
};

// --- DOWNLOAD TRACKING API ---
export const trackDownload = async (id) => {
  const response = await api.post(`/resources/${id}/download`);
  return response.data;
};

// --- WEBSITE CMS APIS ---
export const getPublicCms = async () => {
  const response = await api.get('/cms');
  return response.data;
};

export const getAdminCms = async () => {
  const response = await api.get('/admin/cms');
  return response.data;
};

export const updateCmsSetting = async (settingData) => {
  const response = await api.post('/admin/cms', settingData);
  return response.data;
};

// --- CLUB ACHIEVEMENTS APIS ---
export const getClubAchievements = async () => {
  const response = await api.get('/achievements');
  return response.data;
};

export const createClubAchievement = async (achData) => {
  const response = await api.post('/admin/achievements', achData);
  return response.data;
};

export const updateClubAchievement = async (id, achData) => {
  const response = await api.put(`/admin/achievements/${id}`, achData);
  return response.data;
};

export const deleteClubAchievement = async (id) => {
  await api.delete(`/admin/achievements/${id}`);
};

// --- EXECUTIVE TELEMETRY ANALYTICS ---
export const getExecutiveAnalytics = async () => {
  const response = await api.get('/admin/analytics');
  return response.data;
};

// --- CODING PROFILES STANDINGS APIS ---
export const getCodingProfiles = async () => {
  const response = await api.get('/coding-profiles');
  return response.data;
};

export const updateMyCodingProfile = async (profileData) => {
  const response = await api.post('/coding-profiles/my', profileData);
  return response.data;
};

export const syncCodingProfiles = async () => {
  const response = await api.post('/admin/coding-profiles/sync');
  return response.data;
};

// --- MEMBERS CSV BULK IMPORT/EXPORT APIS ---
export const importUsersCsv = async (formData) => {
  const response = await api.post('/admin/users/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getExportUsersUrl = () => {
  const token = localStorage.getItem('token');
  return `${API_BASE_URL}/admin/users/export?token=${token}`; // or raw link
};

// --- NEW COMMITTEE LEADERBOARD & SNAPSHOT APIS ---
export const getCommitteeLeaderboard = async () => {
  const response = await api.get('/committee-leaderboard');
  return response.data;
};

export const getCommitteeLeaderboardStats = async () => {
  const response = await api.get('/admin/committee-leaderboard/stats');
  return response.data;
};

export const recalculateLeaderboard = async () => {
  const response = await api.post('/admin/leaderboard/recalculate');
  return response.data;
};

export const resetLeaderboard = async (resetData) => {
  const response = await api.post('/admin/leaderboard/reset', resetData);
  return response.data;
};

export const getLeaderboardSnapshots = async () => {
  const response = await api.get('/admin/leaderboard/snapshots');
  return response.data;
};

export const restoreLeaderboardSnapshot = async (id) => {
  const response = await api.post(`/admin/leaderboard/snapshots/${id}/restore`);
  return response.data;
};

export const createCodingProfileAdmin = async (profileData) => {
  const response = await api.post('/admin/coding-profiles', profileData);
  return response.data;
};

export const updateCodingProfileAdmin = async (id, profileData) => {
  const response = await api.put(`/admin/coding-profiles/${id}`, profileData);
  return response.data;
};

export const deleteCodingProfileAdmin = async (id) => {
  await api.delete(`/admin/coding-profiles/${id}`);
};

export const syncSingleCodingProfile = async (id) => {
  const response = await api.post(`/admin/coding-profiles/${id}/sync`);
  return response.data;
};

export const toggleCodingProfileTracking = async (id) => {
  const response = await api.post(`/admin/coding-profiles/${id}/toggle-tracking`);
  return response.data;
};

export default api;

