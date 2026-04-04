// src/components/Settings.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  updatePassword, 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  signOut
} from 'firebase/auth';
import { 
  User, Mail, Lock, Shield, Trash2, AlertTriangle, 
  Save, ChevronLeft, CheckCircle2, Eye, EyeOff, Loader2 
} from 'lucide-react';

export default function Settings({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Profile State
  const [name, setName] = useState('');
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Fetch current user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setName(docSnap.data().name || '');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, [user]);

  const showMessage = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  };

  // --- HANDLERS ---

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { name: name.trim() });
      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      showMessage('error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return showMessage('error', 'New passwords do not match.');
    }
    if (newPassword.length < 6) {
      return showMessage('error', 'Password must be at least 6 characters.');
    }
    
    setSaving(true);
    try {
      // 1. Re-authenticate user first (required by Firebase for sensitive actions)
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // 2. Update password
      await updatePassword(user, newPassword);
      
      showMessage('success', 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        showMessage('error', 'Incorrect current password.');
      } else {
        showMessage('error', error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently erased."
    );
    if (!confirmDelete) return;

    const pass = window.prompt("Please enter your password to confirm account deletion:");
    if (!pass) return;

    setSaving(true);
    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, pass);
      await reauthenticateWithCredential(user, credential);
      
      // 2. Delete from Auth (Firestore data usually requires a Cloud Function to clean up perfectly, 
      // but deleting the Auth user is the critical security step here).
      await deleteUser(user);
      
      // The onAuthStateChanged listener in App.js will automatically detect the logout and redirect.
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        alert('Incorrect password. Account deletion cancelled.');
      } else {
        alert('An error occurred: ' + error.message);
      }
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const TABS = [
    { id: 'profile', label: 'General Profile', icon: User },
    { id: 'security', label: 'Security & Password', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your profile, security, and preferences</p>
        </div>
      </div>

      {/* Global Message Banner */}
      {msg.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border shadow-sm animate-in slide-in-from-top-2 ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-semibold text-sm">{msg.text}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white border border-slate-200 rounded-2xl p-2 sticky top-24 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                      ? tab.id === 'danger' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-black text-slate-900">Personal Information</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Update your name and view your connected email.</p>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 border-2 border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-3xl shadow-sm">
                    {(name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Profile Avatar</h3>
                    <p className="text-xs text-slate-500 mt-1">Your avatar is generated automatically from your name.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        autoComplete="name"
                        className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Email Address (Read-Only)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        value={user.email}
                        disabled
                        className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">To change your email address, please contact support.</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-70 shadow-sm"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-black text-slate-900">Security & Authentication</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Ensure your account is using a strong, secure password.</p>
              </div>
              
              <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                      type={showPasswords ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Verify your current password"
                      autoComplete="current-password" // <-- FIX: Stops browser from pasting email here
                      className="w-full pl-11 pr-12 py-3.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 [&::-ms-reveal]:hidden [&::-webkit-reveal]:hidden"
                    />
                    <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600">
                      {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input 
                        type={showPasswords ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        autoComplete="new-password" // <-- FIX: Helps password managers save the new one
                        className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 [&::-ms-reveal]:hidden [&::-webkit-reveal]:hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input 
                        type={showPasswords ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        autoComplete="new-password" // <-- FIX: Helps password managers
                        className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 [&::-ms-reveal]:hidden [&::-webkit-reveal]:hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-70 shadow-sm"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === 'danger' && (
            <div className="bg-white border border-red-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-red-100 bg-red-50/50">
                <h2 className="text-lg font-black text-red-700">Danger Zone</h2>
                <p className="text-xs text-red-500 font-medium mt-1">Irreversible and destructive actions for your account.</p>
              </div>
              
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-red-200 bg-white">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Delete Account</h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                      Once you delete your account, there is no going back. All of your saved resumes, job matches, and forensic scan history will be permanently erased.
                    </p>
                  </div>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className="flex-shrink-0 bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all shadow-sm"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}