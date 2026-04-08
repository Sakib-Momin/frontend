// src/components/AboutUs.js
import React, { useState } from 'react';
import { 
  Github, Linkedin, Mail, Bug, MessageSquare, 
  Heart, Send, Code2, GraduationCap, Sparkles, 
  CheckCircle2, Loader2, Server
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AboutUs({ user }) {
  const [feedbackType, setFeedbackType] = useState('feedback'); // 'feedback' or 'bug'
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or null

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      // Save feedback directly to your Firestore database!
      await addDoc(collection(db, 'platform_feedback'), {
        type: feedbackType,
        message: message.trim(),
        userEmail: email.trim(),
        uid: user?.uid || 'anonymous',
        status: 'new',
        timestamp: serverTimestamp()
      });
      
      // ==========================================
      // 📱 NEW CODE: MOBILE PUSH NOTIFICATION
      // ==========================================
      try {
        // IMPORTANT: Paste your new Webhook URL for your #bug-reports channel here!
        const webhookUrl = "https://discord.com/api/webhooks/1491471682194374657/0L96HMCTMSYLXlXQaDtIEvlX4iVzR_Cmf5W_NdgxdzzKTv8zGVTr7nKggMfZzp_H5ObB"; 
        
        // Dynamically change the emoji and title based on what the user selected
        const emoji = feedbackType === 'bug' ? '🐛' : '💡';
        const title = feedbackType === 'bug' ? 'NEW BUG REPORT' : 'NEW PLATFORM FEEDBACK';
        
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: `${emoji} **${title}** ${emoji}\n**From:** ${email.trim()}\n**Message:** ${message.trim()}` 
          })
        });
      } catch (webhookErr) {
        console.error("Discord Webhook failed, but database save worked", webhookErr);
      }
      // ==========================================

      setSubmitStatus('success');
      setMessage('');
      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest mb-6">
          <Sparkles size={14} /> Empowering Careers
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
          Built to level the playing field for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">every student.</span>
        </h1>
        <p className="text-lg text-slate-500 font-medium leading-relaxed">
          Premium ATS scoring and resume building shouldn't be hidden behind expensive paywalls. 
          AI Intelligence is a free, powerful platform designed to help you land your dream job.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Story & Profile */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* The Story Card */}
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200/60 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Code2 size={120} />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <GraduationCap size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">The Project Origin</h2>
            </div>
            
            <div className="space-y-4 text-slate-600 leading-relaxed font-medium">
              <p>
                What started as an academic endeavor for my Master of Computer Applications (MCA) program quickly evolved into a fully-fledged platform. 
              </p>
              <p>
                During my second year, I noticed how many talented peers were being rejected by automated ATS systems simply because of poor resume formatting. Enterprise tools charged steep monthly fees just to score a resume.
              </p>
              <p>
                <strong>AI Intelligence</strong> was engineered to solve this. This platform provides industry-standard 10-dimension ATS parsing, intelligent job matching, and a responsive resume builder—completely free of charge. It stands as a testament to the power of student-led development and cloud-native architecture.
              </p>
            </div>
          </div>

          {/* Developer Profile Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden text-white">
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <Server size={180} />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-3xl border-4 border-white/10 flex items-center justify-center font-black text-4xl shadow-xl flex-shrink-0">
                S
              </div>
              
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Code2 size={12} /> Lead Developer
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-1">Sakib Momin</h3>
                <p className="text-indigo-200 font-medium text-sm mb-6">
                  Java Full Stack Developer · AWS Cloud Enthusiast · MCA Student
                </p>
                
                <div className="flex flex-wrap gap-3">
                  {/* Replace '#' with your actual profile links */}
                  <a href="mailto:mominsakib5@gmail.com" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5">
                    <Mail size={16} /> Contact
                  </a>
                  <a href="https://www.linkedin.com/in/sakib-momin-a93248257" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#0077b5]/20 hover:bg-[#0077b5]/40 text-blue-300 border border-[#0077b5]/30 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5">
                    <Linkedin size={16} /> LinkedIn
                  </a>
                  <a href="https://github.com/Sakib-Momin" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5">
                    <Github size={16} /> GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Feedback & Bug Report Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-xl shadow-slate-200/40 sticky top-24">
            
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 mb-2">Help Improve the Platform</h3>
              <p className="text-sm text-slate-500 font-medium">Found a glitch? Have a feature request? Let me know directly.</p>
            </div>

            {submitStatus === 'success' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart size={32} />
                </div>
                <h4 className="text-lg font-black text-emerald-800 mb-2">Message Received!</h4>
                <p className="text-sm text-emerald-600 font-medium">Thank you for your contribution. Your input helps make this tool better for everyone.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                
                {/* Type Toggle */}
                <div className="flex bg-slate-100/80 p-1.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('feedback')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      feedbackType === 'feedback' 
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <MessageSquare size={16} /> General Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('bug')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      feedbackType === 'bug' 
                        ? 'bg-white text-rose-600 shadow-sm border border-slate-200/50' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Bug size={16} /> Report a Bug
                  </button>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Where can I reach you?"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 text-sm"
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {feedbackType === 'bug' ? 'Bug Details' : 'Your Thoughts'}
                  </label>
                  <textarea 
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={feedbackType === 'bug' ? "What went wrong? Steps to reproduce the issue..." : "What do you love? What's missing?"}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 text-sm resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${
                    feedbackType === 'bug' 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                  } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Sending...</>
                  ) : (
                    <><Send size={18} /> Submit {feedbackType === 'bug' ? 'Report' : 'Feedback'}</>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                 v2.0.4 • Hosted securely on Google Firebase
               </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}