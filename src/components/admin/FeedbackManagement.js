// src/components/admin/FeedbackManagement.js
import React, { useState } from 'react';
import { Bug, MessageSquare, CheckCircle2, Clock, Inbox, CircleDot } from 'lucide-react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const FeedbackManagement = ({ feedbackList }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'bug', 'feedback'

  const filteredData = (feedbackList || []).filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'platform_feedback', id), {
        status: newStatus
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest"><CircleDot size={10} /> New</span>;
      case 'in-progress':
        return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-widest"><Clock size={10} /> In Progress</span>;
      case 'resolved':
        return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest"><CheckCircle2 size={10} /> Resolved</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-black uppercase tracking-widest">{status}</span>;
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Inbox className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Feedback & Bugs</h1>
            <p className="text-slate-500 font-semibold mt-1">Review user feedback and track platform issues.</p>
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Panel */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/40 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>All</button>
            <button onClick={() => setFilter('bug')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${filter === 'bug' ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:bg-slate-50'}`}><Bug size={14} /> Bugs</button>
            <button onClick={() => setFilter('feedback')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${filter === 'feedback' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><MessageSquare size={14} /> Feedback</button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-widest font-black text-slate-400">
                <th className="p-5 pl-8 w-1/4">User / Date</th>
                <th className="p-5 w-1/2">Message</th>
                <th className="p-5 w-1/4 text-right pr-8">Status & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 bg-white">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  
                  {/* User Column */}
                  <td className="p-5 pl-8 align-top">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-2 rounded-lg ${item.type === 'bug' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                        {item.type === 'bug' ? <Bug size={16} /> : <MessageSquare size={16} />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm tracking-tight">{item.userEmail || 'Anonymous'}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">
                          {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleDateString() : 'Just now'}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Message Column */}
                  <td className="p-5 align-top">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {item.message}
                    </p>
                  </td>
                  
                  {/* Status & Actions Column */}
                  <td className="p-5 pr-8 align-top text-right space-y-3">
                    <div className="flex justify-end mb-3">
                      {getStatusBadge(item.status || 'new')}
                    </div>
                    
                    {/* Action Dropdown / Buttons */}
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.status !== 'new' && (
                        <button onClick={() => handleStatusUpdate(item.id, 'new')} className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors border border-amber-200">
                          Mark New
                        </button>
                      )}
                      {item.status !== 'in-progress' && (
                        <button onClick={() => handleStatusUpdate(item.id, 'in-progress')} className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors border border-blue-200">
                          In Progress
                        </button>
                      )}
                      {item.status !== 'resolved' && (
                        <button onClick={() => handleStatusUpdate(item.id, 'resolved')} className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors border border-emerald-200">
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                  
                </tr>
              ))}
              
              {/* Empty State */}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Inbox size={48} className="mb-4 text-slate-200" />
                      <p className="text-lg font-bold text-slate-600 mb-1">Inbox Zero!</p>
                      <p className="text-sm font-medium">No feedback or bugs to show right now.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeedbackManagement;