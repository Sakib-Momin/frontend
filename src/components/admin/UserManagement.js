// src/components/admin/UserManagement.js
import React, { useState } from 'react';
import { Search as SearchIcon, Edit, Key, Trash2, Download, UserCog } from 'lucide-react';

const UserManagement = ({ usersList, handleExportUserData, exportLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // --- ACTIONS (MOCKED FOR CLIENT-SIDE SECURITY) ---
  const triggerBackendAlert = (action) => alert(`🔒 SECURITY RESTRICTION:\n\nCannot execute '${action}' from the client browser. This requires Firebase Admin SDK backend integration (Node.js/Python) to securely modify external user accounts.`);

  // Safely filter users, preventing crashes if data is missing
  const filteredUsers = (usersList || []).filter(user => 
    (user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (user?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <UserCog className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Directory</h1>
            <p className="text-slate-500 font-semibold mt-1">Manage accounts, roles, and platform access.</p>
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Panel */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/40 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 w-full max-w-md">
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search users by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all text-sm font-semibold w-full shadow-inner text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>
          
          <button 
            onClick={handleExportUserData}
            disabled={exportLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            {exportLoading ? (
               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
               <Download size={18} />
            )}
            {exportLoading ? 'Exporting...' : 'Export Directory CSV'}
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-widest font-black text-slate-400">
                <th className="p-5 pl-8">User Details</th>
                <th className="p-5">System Role</th>
                <th className="p-5">Live Status</th>
                <th className="p-5">Last Login</th>
                <th className="p-5 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 bg-white">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-600 flex items-center justify-center font-black text-lg shadow-inner border border-indigo-100/50 group-hover:scale-105 transition-transform">
                        {/* Safely pull the first letter of Name or Email */}
                        {(user.name || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        {/* Intelligently display Name, or fallback to Email Prefix */}
                        <div className="font-bold text-slate-900 text-sm md:text-base tracking-tight">
                          {user.name || (user.email ? user.email.split('@')[0] : 'Unnamed User')}
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    {/* Case-insensitive check for Admin role */}
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm border ${user.role?.toLowerCase() === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {user.role?.toLowerCase() === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'Online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-slate-300'}`}></div>
                      <span className="text-sm font-bold text-slate-700">{user.status || 'Offline'}</span>
                    </div>
                  </td>
                  <td className="p-5 text-sm font-semibold text-slate-500">
                    {user.lastLogin || 'Unknown'}
                  </td>
                  <td className="p-5 pr-8 text-right space-x-2">
                    <button onClick={() => triggerBackendAlert('Edit Profile')} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all hover:scale-105" title="Edit User">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => triggerBackendAlert('Reset Password')} className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all hover:scale-105" title="Reset Password">
                      <Key size={18} />
                    </button>
                    <button onClick={() => triggerBackendAlert('Delete User')} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all hover:scale-105" title="Delete User">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* Empty State */}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <SearchIcon size={48} className="mb-4 text-slate-200" />
                      <p className="text-lg font-bold text-slate-600 mb-1">No users found</p>
                      <p className="text-sm font-medium">Try adjusting your search criteria.</p>
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

export default UserManagement;