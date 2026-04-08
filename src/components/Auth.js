// src/components/Auth.js
import React, { useState } from 'react';
import { auth, db } from '../firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,           
  browserSessionPersistence 
} from 'firebase/auth';

// --- FIRESTORE IMPORTS ---
import { doc, setDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// --- ANALYTICS IMPORTS ---
import { updateSystemStats, trackUserGrowth, logActivity } from '../utils/analytics';

import { 
  Mail, Lock, Cpu, ArrowRight, AlertTriangle, 
  Eye, EyeOff, CheckCircle2, User 
} from 'lucide-react';

// FIX: Added onNavigate prop to handle link clicks
const Auth = ({ onNavigate }) => {
  const [mode, setMode] = useState('login'); 
  const [name, setName] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 🔐 STRICT SESSION ENFORCEMENT: 
      await setPersistence(auth, browserSessionPersistence);

      if (mode === 'signup') {
        if (!termsAccepted) {
          setError('You must accept the Terms of Service and Privacy Policy to register.');
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match!');
          setLoading(false);
          return;
        }
        
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        if (name.trim().length < 2) {
          setError('Please enter a valid full name.');
          setLoading(false);
          return;
        }

        // ==========================================
        // 🛑 NEW CODE: DISPOSABLE EMAIL BLOCKER
        // ==========================================
        const blockedDomains = ['yopmail.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
        const userDomain = email.split('@')[1].toLowerCase();
        
        if (blockedDomains.includes(userDomain)) {
          setError('Disposable or temporary email addresses are not allowed.');
          setLoading(false);
          return;
        }
        // ==========================================

        // 1. Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // ==========================================
        // 📱 NEW CODE: MOBILE PUSH NOTIFICATION
        // ==========================================
        try {
          const webhookUrl = "https://discord.com/api/webhooks/1491469305651527752/SsXAAL5plxc6mBblif4TdcYKA_-kX2dqrL4gFyOYTxXFdQ19YeOM0hBqSCIfVJAjg8Yz";
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              content: `🚨 **NEW USER ALERT!** 🚨\n**Name:** ${name.trim()}\n**Email:** ${user.email}` 
            })
          });
        } catch (err) {
          console.error("Webhook failed, but user was still created", err);
        }
        // ==========================================
        // ==========================================
        // 📊 BACKGROUND TASKS: Database & Analytics
        // ==========================================
        try {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            name: name.trim(), 
            role: 'user', 
            status: 'Online',
            lastLogin: new Date().toLocaleDateString(),
            createdAt: serverTimestamp(),
            acceptedTerms: true 
          });

          const statsRef = doc(db, 'system_stats', 'overview');
          await setDoc(statsRef, { totalUsers: increment(1) }, { merge: true });

          await addDoc(collection(db, 'recent_activity'), {
            type: 'user',
            action: 'New user registered',
            email: email,
            time: 'Just now',
            timestamp: serverTimestamp()
          });

          await updateSystemStats('user_registered');
          await trackUserGrowth();
          await logActivity('user', 'New user registered', email);
          
        } catch (dbError) {
          console.error("Non-critical DB error during signup:", dbError);
        }
        // ==========================================

        setSuccess('Account created successfully! Redirecting...');
        
      } else if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        try {
          await setDoc(doc(db, 'users', user.uid), {
            lastLogin: new Date().toLocaleDateString(),
            status: 'Online'
          }, { merge: true });

          await addDoc(collection(db, 'recent_activity'), {
            type: 'user',
            action: 'User logged in',
            email: email,
            time: 'Just now',
            timestamp: serverTimestamp()
          });
        } catch (dbError) {
          console.error("Non-critical DB error during login:", dbError);
        }
        
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Password reset email sent! Check your inbox.');
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err) {
      let errorMsg = err.message;
      if (errorMsg.includes('invalid-credential')) errorMsg = 'Invalid email or password.';
      if (errorMsg.includes('invalid-email')) errorMsg = 'Please enter a valid email address.';
      if (errorMsg.includes('email-already-in-use')) errorMsg = 'This email is already registered.';
      if (errorMsg.includes('weak-password')) errorMsg = 'Password must be at least 6 characters.';
      if (errorMsg.includes('user-not-found')) errorMsg = 'No account found with this email.';
      if (errorMsg.includes('wrong-password')) errorMsg = 'Incorrect password.';
      if (errorMsg.includes('too-many-requests')) errorMsg = 'Too many attempts. Please try again later.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setTermsAccepted(false); 
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full">
        
        {/* Main Auth Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 p-8 animate-in zoom-in-95 duration-500 backdrop-blur-sm">
          
          {/* Branding Header */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Cpu size={36} className="text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-900 tracking-tight uppercase">
              AI Intelligence
            </h1>
            
            <p className="text-slate-500 font-medium mt-2 text-center">
              {mode === 'login' && 'Welcome back! Sign in to continue.'}
              {mode === 'signup' && 'Create your account to get started.'}
              {mode === 'reset' && 'Reset your password securely.'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-green-700 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{success}</p>
            </div>
          )}

          {/* Auth Forms */}
          <form onSubmit={handleAuth} className="space-y-5">
            
            {/* Full Name Field (Signup ONLY) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Arjun Sharma"
                    className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 hover:border-slate-300"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 hover:border-slate-300"
                />
              </div>
            </div>

            {/* Password Field (Login & Signup) */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 hover:border-slate-300 [&::-ms-reveal]:hidden [&::-webkit-reveal]:hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Password Strength Indicator (Signup only) */}
                {mode === 'signup' && password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      <div className={`h-1 flex-1 rounded-full transition-all ${password.length >= 2 ? 'bg-red-500' : 'bg-slate-200'}`} />
                      <div className={`h-1 flex-1 rounded-full transition-all ${password.length >= 6 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                      <div className={`h-1 flex-1 rounded-full transition-all ${password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-500' : 'bg-slate-200'}`} />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                      {password.length < 6 && 'Weak - Add more characters'}
                      {password.length >= 6 && password.length < 8 && 'Fair - Add special characters'}
                      {password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && 'Strong - Great password!'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password Field (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    required 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full pl-11 pr-12 py-3.5 border rounded-xl bg-slate-50 outline-none focus:ring-4 transition-all font-medium text-slate-800 hover:border-slate-300 [&::-ms-reveal]:hidden [&::-webkit-reveal]:hidden ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-50' 
                        : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle2 size={14} className="text-green-500" />
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Passwords match</p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} className="text-red-500" />
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Passwords don't match</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MANDATORY LEGAL CLICKWRAP (Signup only) */}
            {mode === 'signup' && (
              <div className="flex items-start gap-3 pt-2">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-slate-50 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                <label htmlFor="terms" className="text-[11px] text-slate-500 font-medium leading-relaxed select-none">
                  {/* FIX: Made the text interactive by calling onNavigate */}
                  I agree to the <span onClick={(e) => { e.preventDefault(); onNavigate('terms'); }} className="font-bold text-indigo-600 hover:underline cursor-pointer">Terms of Service</span> and <span onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }} className="font-bold text-indigo-600 hover:underline cursor-pointer">Privacy Policy</span>. I acknowledge this is an "As-Is" AI tool and I will not upload sensitive financial or personal data.
                </label>
              </div>
            )}

            {/* Forgot Password Link (Login only) */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 underline decoration-2 underline-offset-4 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || (mode === 'signup' && (!termsAccepted || password !== confirmPassword))}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' && 'Signing in...'}
                  {mode === 'signup' && 'Creating account...'}
                  {mode === 'reset' && 'Sending email...'}
                </>
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'reset' && 'Send Reset Link'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-slate-500">
                {mode === 'login' && "Don't have an account?"}
                {mode === 'signup' && "Already have an account?"}
                {mode === 'reset' && "Remember your password?"}
                <button 
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  className="ml-2 text-indigo-600 font-bold hover:text-indigo-800 underline decoration-2 underline-offset-4 transition-colors"
                >
                  {mode === 'login' && 'Sign up free'}
                  {mode === 'signup' && 'Sign in'}
                  {mode === 'reset' && 'Back to login'}
                </button>
              </p>
            </div>
          </div>

        </div>

        {/* Additional Info Card */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 font-medium">
            🔒 Your data is encrypted and secure
          </p>
        </div>

      </div>
    </div>
  );
};

export default Auth;