// src/components/Privacy.js
import React from 'react';
import { Database, Lock, EyeOff, Trash2 } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12 animate-in fade-in duration-500 my-8">
      <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-8">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
          <EyeOff size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-slate-500 font-medium mt-1">Committed to your data security</p>
        </div>
      </div>

      <div className="space-y-8 text-slate-600 leading-relaxed font-medium">
        
        <p className="text-lg text-slate-500">
          AI Intelligence respects your privacy. This policy explains how we collect, use, and protect your personal information when you use our free resume tools.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <Database size={20} className="text-indigo-600 mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">1. Data We Collect</h3>
            <p className="text-sm">We collect your email address, name (for account creation), and the text extracted from the PDF resumes you upload for analysis. We do not store the actual PDF files long-term.</p>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <Lock size={20} className="text-indigo-600 mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">2. How We Protect It</h3>
            <p className="text-sm">Your data is securely stored using Google Firebase, which complies with world-class security and encryption standards. We <strong>never</strong> sell, rent, or trade your data to third parties.</p>
          </div>
        </div>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Trash2 size={20} className="text-rose-500"/> 3. The Right to be Forgotten
          </h2>
          <p>
            You have complete control over your data. At any time, you can visit the <strong>Account Settings &gt; Danger Zone</strong> section of the dashboard to permanently delete your account. This action instantly and irreversibly erases your profile, email, and historical platform data from our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Usage of Data</h2>
          <p>
            The text extracted from your resume is processed securely by our Python/Flask backend solely for the purpose of generating your ATS Score and Fraud Detection report. Anonymous, aggregated statistics (e.g., "Total Resumes Scanned") are kept for platform analytics, but these contain no personally identifiable information (PII).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Contact Information</h2>
          <p>
            If you have any questions, concerns, or requests regarding your data privacy, please contact the developer at <strong>mominsakib5@gmail.com</strong>.
          </p>
        </section>

      </div>
    </div>
  );
}