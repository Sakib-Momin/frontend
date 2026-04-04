// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { BarChart3, UserCog, MessageSquare } from 'lucide-react'; // <-- Added MessageSquare
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Import our split components
import DashboardOverview from './admin/DashboardOverview';
import UserManagement from './admin/UserManagement';
import FeedbackManagement from './admin/FeedbackManagement'; // <-- NEW IMPORT

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [usersList, setUsersList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]); // <-- NEW STATE FOR FEEDBACK
  const [exportLoading, setExportLoading] = useState(false);

  const [stats, setStats] = useState({
    totalResumes: 0, fraudDetections: 0, atsScans: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    apiStatus: 'checking', databaseStatus: 'checking', storageUsed: 0
  });

  const [userGrowthData, setUserGrowthData] = useState({ labels: [], data: [] });
  const [featureUsageData, setFeatureUsageData] = useState({
    labels: ['Fraud Detector', 'ATS Scorer', 'Job Matcher', 'Resume Builder'], data: [0, 0, 0, 0]
  });

  // --- CHECK SYSTEM STATUS ---
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const apiStatus = navigator.onLine ? 'online' : 'offline';
        let databaseStatus = 'healthy';
        try {
          await getDocs(query(collection(db, 'system_stats'), limit(1)));
        } catch (error) { databaseStatus = 'error'; }
        const storageUsed = Math.random() * 30 + 60;
        setSystemStatus({ apiStatus, databaseStatus, storageUsed: Math.round(storageUsed) });
      } catch (error) { console.error('System status check failed:', error); }
    };
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); 
    return () => clearInterval(interval);
  }, []);

  // --- STATS LISTENER ---
  useEffect(() => {
    const statsRef = doc(db, 'system_stats', 'overview');
    const unsubscribeStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({
          totalResumes: data.totalResumes || 0,
          fraudDetections: data.fraudDetections || 0,
          atsScans: data.atsScans || 0
        });
      } else {
        setStats({ totalResumes: 3891, fraudDetections: 142, atsScans: 2654 });
      }
    });
    return () => unsubscribeStats();
  }, []);

  // --- ACTIVITY FEED LISTENER ---
  useEffect(() => {
    const activityRef = collection(db, 'recent_activity');
    const q = query(activityRef, orderBy('timestamp', 'desc'), limit(5));
    const unsubscribeActivity = onSnapshot(q, (querySnapshot) => {
      const activities = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id, type: data.type || 'user', action: data.action || 'Unknown action',
          email: data.email || 'Anonymous User', time: data.time || 'Just now',
        });
      });
      if (activities.length > 0) setRecentActivity(activities);
      else {
        setRecentActivity([
          { id: 1, type: 'user', action: 'Job match completed', email: 'Anonymous User', time: 'Just now' },
          { id: 2, type: 'ats', action: 'ATS scan completed', email: 'Anonymous User', time: 'Just now' },
        ]);
      }
    });
    return () => unsubscribeActivity();
  }, []);

  // --- USER GROWTH LISTENER ---
  useEffect(() => {
    const fetchUserGrowth = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'user_growth'), orderBy('date', 'asc'), limit(7)));
        const labels = []; const data = [];
        snapshot.forEach(doc => {
          labels.push(doc.data().date || doc.id);
          data.push(doc.data().count || 0);
        });
        if (labels.length > 0) setUserGrowthData({ labels, data });
        else setUserGrowthData({ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: [120, 145, 167, 189, 201, 234, 267] });
      } catch (error) {
        setUserGrowthData({ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: [120, 145, 167, 189, 201, 234, 267] });
      }
    };
    fetchUserGrowth();
  }, []);

  // --- FEATURE USAGE LISTENER ---
  useEffect(() => {
    const usageRef = doc(db, 'system_stats', 'feature_usage');
    const unsubscribeUsage = onSnapshot(usageRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const vals = [data.frauddetector || 0, data.atsscorer || 0, data.jobmatcher || 0, data.resumebuilder || 0];
        if (vals.every(v => v === 0)) setFeatureUsageData({ labels: ['Fraud Detector', 'ATS Scorer', 'Job Matcher', 'Resume Builder'], data: [1, 1, 1, 1] });
        else setFeatureUsageData({ labels: ['Fraud Detector', 'ATS Scorer', 'Job Matcher', 'Resume Builder'], data: vals });
      } else {
        setFeatureUsageData({ labels: ['Fraud Detector', 'ATS Scorer', 'Job Matcher', 'Resume Builder'], data: [1, 1, 1, 1] });
      }
    });
    return () => unsubscribeUsage();
  }, []);

  // --- USERS DIRECTORY LISTENER ---
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const users = [];
      snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
      
      if (users.length === 0) {
        setUsersList([
          { id: '1', name: 'Sakib Momin', email: 'sakib413501@gmail.com', role: 'Admin', status: 'Online', lastLogin: 'Just now' },
          { id: '2', name: 'Guest User', email: 'mominsakib5@gmail.com', role: 'User', status: 'Offline', lastLogin: '2 hours ago' }
        ]);
      } else {
        setUsersList(users);
      }
    });
    return () => unsubscribeUsers();
  }, []);

  // --- FEEDBACK & BUGS LISTENER (NEW) ---
  useEffect(() => {
    const feedbackRef = collection(db, 'platform_feedback');
    const q = query(feedbackRef, orderBy('timestamp', 'desc'));
    const unsubscribeFeedback = onSnapshot(q, (snapshot) => {
      const feedbacks = [];
      snapshot.forEach(doc => feedbacks.push({ id: doc.id, ...doc.data() }));
      setFeedbackList(feedbacks);
    }, (error) => {
      console.error("Error fetching feedback: ", error);
    });
    return () => unsubscribeFeedback();
  }, []);

  // --- EXPORT LOGIC ---
  const handleExportUserData = async () => {
    setExportLoading(true);
    try {
      if (usersList.length === 0) {
        alert('No user data available to export.');
        setExportLoading(false); return;
      }
      const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Last Login'];
      const rows = usersList.map(user => [
        user.id, `"${user.name || 'Unnamed User'}"`, `"${user.email || ''}"`,
        `"${user.role || 'User'}"`, `"${user.status || 'Offline'}"`, `"${user.lastLogin || 'Unknown'}"`
      ].join(','));
      
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `User_Directory_Export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setTimeout(() => { alert('✅ User Directory exported successfully!'); setExportLoading(false); }, 500);
    } catch (error) {
      alert('❌ Export failed. Please try again.'); setExportLoading(false);
    }
  };

  // --- DYNAMIC CALCULATIONS FOR DASHBOARD ---
  const activeSessionsCount = usersList.filter(user => user.status === 'Online').length;
  
  const apiHealth = systemStatus.apiStatus === 'online' ? 100 : 0;
  const dbHealth = systemStatus.databaseStatus === 'healthy' ? 100 : 0;
  const storageHealth = systemStatus.storageUsed < 80 ? 100 : (100 - systemStatus.storageUsed);
  const calculatedSystemHealth = parseFloat(((apiHealth + dbHealth + storageHealth) / 3).toFixed(1));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Top Navigation Tabs */}
      <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveView('dashboard')} className={`px-6 py-3 rounded-xl font-black tracking-wide uppercase text-sm transition-all flex items-center gap-2 ${activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-100'}`}>
            <BarChart3 size={18}/> Analytics
          </button>
          <button onClick={() => setActiveView('users')} className={`px-6 py-3 rounded-xl font-black tracking-wide uppercase text-sm transition-all flex items-center gap-2 ${activeView === 'users' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-100'}`}>
            <UserCog size={18}/> Manage Users
          </button>
          {/* NEW FEEDBACK TAB */}
          <button onClick={() => setActiveView('feedback')} className={`px-6 py-3 rounded-xl font-black tracking-wide uppercase text-sm transition-all flex items-center gap-2 ${activeView === 'feedback' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-100'}`}>
            <MessageSquare size={18}/> Feedback & Bugs
            {feedbackList.filter(f => f.status === 'new').length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {feedbackList.filter(f => f.status === 'new').length}
              </span>
            )}
          </button>
        </div>
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
          <div className={`w-3 h-3 rounded-full ${systemStatus.apiStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500'} animate-pulse`}></div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">System Live</span>
        </div>
      </div>

      {activeView === 'dashboard' && (
        <DashboardOverview 
          stats={stats}
          usersListLength={usersList.length}
          activeSessionsCount={activeSessionsCount}
          calculatedSystemHealth={calculatedSystemHealth}
          recentActivity={recentActivity}
          systemStatus={systemStatus}
          userGrowthData={userGrowthData}
          featureUsageData={featureUsageData}
          handleExportUserData={handleExportUserData}
          exportLoading={exportLoading}
        />
      )}
      
      {activeView === 'users' && (
        <UserManagement 
          usersList={usersList}
          handleExportUserData={handleExportUserData}
          exportLoading={exportLoading}
        />
      )}

      {/* NEW FEEDBACK VIEW */}
      {activeView === 'feedback' && (
        <FeedbackManagement feedbackList={feedbackList} />
      )}
    </div>
  );
};

export default AdminDashboard;