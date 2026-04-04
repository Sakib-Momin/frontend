// src/components/Terms.js
import React from 'react';
import { Scale, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12 animate-in fade-in duration-500 my-8">
      <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-8">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
          <Scale size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
          <p className="text-slate-500 font-medium mt-1">Effective Date: April 2026</p>
        </div>
      </div>

      <div className="space-y-8 text-slate-600 leading-relaxed font-medium">
        
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-indigo-500"/> 1. Acceptance of Terms
          </h2>
          <p>
            By accessing and using AI Intelligence ("the Platform"), you agree to be bound by these Terms of Service. This Platform is a free, independent student project developed by Sakib Momin. If you do not agree to these terms, please do not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ShieldAlert size={20} className="text-indigo-500"/> 2. Nature of the Service & "As-Is" Disclaimer
          </h2>
          <p>
            The Platform provides AI-driven resume analysis, ATS scoring, and fraud detection for <strong>informational and educational purposes only</strong>. The developer makes no representations, warranties, or guarantees regarding the accuracy, reliability, or completeness of the AI analysis. 
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 text-amber-800 text-sm">
            <strong>DISCLAIMER:</strong> THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. THE DEVELOPER DOES NOT GUARANTEE EMPLOYMENT, INTERVIEW CALLS, OR PERFECT SCORING ACCURACY.
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={20} className="text-indigo-500"/> 3. Limitation of Liability
          </h2>
          <p className="uppercase text-xs font-bold tracking-wide text-slate-500 mb-2">Read Carefully</p>
          <p>
            To the maximum extent permitted by applicable law (including the Information Technology Act, 2000), in no event shall Sakib Momin or associated affiliates be liable for any direct, indirect, incidental, special, or consequential damages—including but not limited to loss of employment opportunities, data loss, or emotional distress—arising out of the use or inability to use the Platform. <strong>The total maximum liability of the developer for any claims under these terms shall be strictly limited to Zero Rupees (₹0 / $0).</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. User Responsibilities & Data Restrictions</h2>
          <p>
            You agree to only upload resumes and professional documents. <strong>You are strictly prohibited from uploading highly sensitive personal data</strong> (such as government-issued ID numbers, bank account details, medical records, or passwords). You are solely responsible for the data you upload.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Governing Law and Jurisdiction</h2>
          <p>
            These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India. Any legal disputes or claims arising out of or related to the Platform shall be subject to the exclusive jurisdiction of the competent courts located in <strong>Maharashtra, India</strong>.
          </p>
        </section>

      </div>
    </div>
  );
}