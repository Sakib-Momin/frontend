// src/components/admin/DashboardOverview.js
import React from 'react';
import { 
  Shield, Users, FileText, TrendingUp, Activity, 
  AlertTriangle, CheckCircle2, Clock, Database,
  Settings, Download, XCircle, Cpu, Zap, PieChart
} from 'lucide-react';

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const DashboardOverview = ({ 
  stats, usersListLength, activeSessionsCount, calculatedSystemHealth, 
  recentActivity, systemStatus, userGrowthData, featureUsageData, 
  handleExportUserData, exportLoading 
}) => {

  // --- CHART CONFIGURATIONS ---
  const userGrowthChartData = {
    labels: userGrowthData?.labels || [],
    datasets: [{
      label: 'New Users', data: userGrowthData?.data || [], fill: true,
      backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgb(99, 102, 241)',
      borderWidth: 3, tension: 0.4, pointBackgroundColor: 'rgb(99, 102, 241)',
      pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6
    }]
  };

  const userGrowthChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, titleFont: { size: 14, weight: 'bold' }, bodyFont: { size: 13 }, cornerRadius: 12 } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { font: { size: 11, weight: '600' }, color: '#64748b' } },
      x: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' }, color: '#64748b' } }
    }
  };

  const featureUsageChartData = {
    labels: featureUsageData?.labels || [],
    datasets: [{
      data: featureUsageData?.data || [],
      backgroundColor: ['rgba(239, 68, 68, 0.85)', 'rgba(99, 102, 241, 0.85)', 'rgba(16, 185, 129, 0.85)', 'rgba(245, 158, 11, 0.85)'],
      borderColor: ['#fff', '#fff', '#fff', '#fff'],
      borderWidth: 3, hoverOffset: 4
    }]
  };

  const featureUsageChartOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { padding: 20, font: { size: 12, weight: '600' }, color: '#334155', usePointStyle: true, pointStyle: 'circle' } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, titleFont: { size: 14, weight: 'bold' }, bodyFont: { size: 13 }, cornerRadius: 12,
        callbacks: { label: function(context) { const total = context.dataset.data.reduce((a, b) => a + b, 0); const percentage = ((context.parsed / total) * 100).toFixed(1); return ` ${context.parsed} uses (${percentage}%)`; } }
      }
    }
  };

  return (
    <>
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Shield className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 font-semibold mt-1">System Overview & Enterprise Analytics</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - DEFENSIVE FALLBACKS ADDED */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Users className="text-white" size={22} /></div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full shadow-sm">+12%</span>
          </div>
          <h3 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">{(usersListLength || 0).toLocaleString()}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registered Users</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><FileText className="text-white" size={22} /></div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full shadow-sm">+24%</span>
          </div>
          <h3 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">{(stats?.totalResumes || 0).toLocaleString()}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Docs Processed</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><AlertTriangle className="text-white" size={22} /></div>
            <span className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full shadow-sm">+8%</span>
          </div>
          <h3 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">{(stats?.fraudDetections || 0).toLocaleString()}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fraud Detected</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-400 opacity-10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Activity className="text-white" size={22} /></div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full shadow-sm flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Live</span>
          </div>
          <h3 className="text-4xl font-black text-slate-900 mb-1 tracking-tight relative z-10">{(activeSessionsCount || 0).toLocaleString()}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">Active Sessions</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3"><Clock size={22} className="text-indigo-500" /> Recent Activity Log</h2>
          </div>
          <div className="space-y-4">
            {(recentActivity || []).map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-colors border border-slate-100/50">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${activity.type === 'user' ? 'bg-blue-100' : activity.type === 'fraud' ? 'bg-rose-100' : activity.type === 'resume' ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
                  {activity.type === 'user' && <Users size={18} className="text-blue-600" />}
                  {activity.type === 'fraud' && <AlertTriangle size={18} className="text-rose-600" />}
                  {activity.type === 'resume' && <FileText size={18} className="text-emerald-600" />}
                  {activity.type === 'ats' && <TrendingUp size={18} className="text-indigo-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm md:text-base">{activity.action}</p>
                  <p className="text-xs font-semibold text-slate-500 truncate">{activity.email}</p>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health & New Premium Feature */}
        <div className="space-y-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-xl shadow-slate-200/40">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4"><Database size={22} className="text-emerald-500" /> System Health</h2>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Network Status</span>
                <span className={`text-3xl font-black tracking-tight ${calculatedSystemHealth >= 90 ? 'text-emerald-500' : calculatedSystemHealth >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>{(calculatedSystemHealth || 0)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${calculatedSystemHealth >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : calculatedSystemHealth >= 70 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'}`} style={{ width: `${(calculatedSystemHealth || 0)}%` }} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-2xl border ${(systemStatus?.apiStatus || 'offline') === 'online' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                <div className="flex items-center gap-3">
                  {(systemStatus?.apiStatus || 'offline') === 'online' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-rose-500" />}
                  <span className="text-sm font-bold text-slate-700">API Status</span>
                </div>
                <span className={`text-xs font-black tracking-widest uppercase ${(systemStatus?.apiStatus || 'offline') === 'online' ? 'text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full' : 'text-rose-600 bg-rose-100 px-3 py-1 rounded-full'}`}>{systemStatus?.apiStatus || 'offline'}</span>
              </div>
              
              <div className={`flex items-center justify-between p-4 rounded-2xl border ${(systemStatus?.databaseStatus || 'error') === 'healthy' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                <div className="flex items-center gap-3">
                  {(systemStatus?.databaseStatus || 'error') === 'healthy' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-rose-500" />}
                  <span className="text-sm font-bold text-slate-700">Database</span>
                </div>
                <span className={`text-xs font-black tracking-widest uppercase ${(systemStatus?.databaseStatus || 'error') === 'healthy' ? 'text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full' : 'text-rose-600 bg-rose-100 px-3 py-1 rounded-full'}`}>{systemStatus?.databaseStatus || 'error'}</span>
              </div>
            </div>
          </div>

          {/* Premium Industrial Widget */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 shadow-2xl shadow-indigo-900/20 text-white relative overflow-hidden border border-indigo-500/20 group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-[64px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 -mr-10 -mt-10"></div>
            <h2 className="text-lg font-black mb-6 flex items-center gap-3 relative z-10 text-indigo-50">
              <Cpu size={22} className="text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              AI Processing Engine
            </h2>
            <div className="space-y-6 relative z-10">
              <div>
                <div className="flex justify-between text-xs font-black tracking-widest uppercase mb-2 text-indigo-300">
                  <span>Server Load</span>
                  <span className="text-white">42%</span>
                </div>
                <div className="w-full h-2 bg-slate-950/50 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full w-[42%] shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-5 border-t border-white/10">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">NLP Latency</span>
                <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"><Zap size={14}/> 124ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-xl shadow-slate-200/40">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><TrendingUp size={22} className="text-indigo-500" /> Platform Growth</h2>
          <div className="h-72 w-full"><Line data={userGrowthChartData} options={userGrowthChartOptions} /></div>
        </div>
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-xl shadow-slate-200/40">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><PieChart size={22} className="text-indigo-500" /> Feature Analytics</h2>
          <div className="h-72 w-full relative flex items-center justify-center">
             <Doughnut data={featureUsageChartData} options={featureUsageChartOptions} />
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardOverview;