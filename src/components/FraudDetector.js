// src/components/FraudDetector.js
import React, { useState, useRef } from 'react';
import {
  Upload, Brain, Shield, AlertTriangle, CheckCircle, XCircle,
  Info, Calendar, Briefcase, Code2, Award, TrendingUp, Eye,
  Zap, ChevronDown, ChevronUp, AlertCircle, Link,
  User, BookOpen, Target, BarChart2, FileText, Hash,
  CheckSquare, MinusSquare, Clock, Building2,
} from 'lucide-react';

import { auth, db } from '../firebase';
import { doc, setDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { trackFeatureUsage, logActivity, updateSystemStats } from '../utils/analytics';

// ── Severity config — UNCHANGED UI ──────────────────────────
const SEVERITY = {
  critical: { bg:"bg-red-50", border:"border-red-200", badge:"bg-red-500 text-white", label:"CRITICAL", icon:<XCircle size={16} className="text-red-500 flex-shrink-0"/> },
  high:     { bg:"bg-rose-50", border:"border-rose-200", badge:"bg-rose-500 text-white",  label:"HIGH RISK",icon:<XCircle size={16} className="text-rose-500 flex-shrink-0"/> },
  medium:   { bg:"bg-amber-50",border:"border-amber-200",badge:"bg-amber-500 text-white",label:"MEDIUM", icon:<AlertTriangle size={16} className="text-amber-500 flex-shrink-0"/> },
  low:      { bg:"bg-blue-50", border:"border-blue-200", badge:"bg-blue-500 text-white", label:"LOW",    icon:<Info size={16} className="text-blue-500 flex-shrink-0"/> },
};

// ── Category icons & colors ──────────────────────────────────
const CATEGORY_CONFIG = {
  "Timeline Fraud":      { icon:<Calendar size={14}/>,  color:"bg-red-100 text-red-700 border-red-200"    },
  "Experience Fraud":    { icon:<Briefcase size={14}/>, color:"bg-rose-100 text-rose-700 border-rose-200"  },
  "Skills Fraud":        { icon:<Code2 size={14}/>,     color:"bg-amber-100 text-amber-700 border-amber-200"},
  "Certification Fraud": { icon:<Award size={14}/>,     color:"bg-orange-100 text-orange-700 border-orange-200"},
  "Identity Fraud":      { icon:<User size={14}/>,      color:"bg-purple-100 text-purple-700 border-purple-200"},
  "Education Fraud":     { icon:<BookOpen size={14}/>,  color:"bg-indigo-100 text-indigo-700 border-indigo-200"},
  "Content Fraud":       { icon:<FileText size={14}/>,  color:"bg-slate-100 text-slate-700 border-slate-200"},
};

// ── Detection module explainers — UNCHANGED ──────────────────
const DETECTION_MODULES = [
  { icon:<Calendar size={18} className="text-indigo-600"/>, title:"Timeline Forensics", color:"border-slate-200 bg-white shadow-sm",
    checks:["Overlapping employment dates — two full-time jobs at the same time","Employment gaps over 8 months with no explanation","Suspiciously short stints under 90 days (3+ roles)","Rapid job hopping: 3+ roles in 2 years","Future dates in employment history","Impossible timeline (work started before graduation)"] },
  { icon:<Briefcase size={18} className="text-indigo-600"/>, title:"Experience Authenticity", color:"border-slate-200 bg-white shadow-sm",
    checks:["Senior/Lead titles with under 3 years total experience","Role–skill contradiction (claimed role vs skills actually present)","Thin experience entries: only 1 bullet per role","Copy-pasted bullet points across different employers","Near-identical experience descriptions across roles","Tense inconsistency (mixing past/present across all roles)"] },
  { icon:<Award size={18} className="text-indigo-600"/>, title:"Certificate Fraud Detection", color:"border-slate-200 bg-white shadow-sm",
    checks:["Certifications with no issuing organisation named","High-value certs (AWS, CISSP, PMP) without matching skills","4+ enterprise certs claimed in under 2 years","Credential mismatch: cert claimed but prerequisite skills absent","Cert dates predating when the certification programme launched","No Credential IDs provided for verification"] },
  { icon:<Code2 size={18} className="text-indigo-600"/>, title:"Skills Integrity", color:"border-slate-200 bg-white shadow-sm",
    checks:["14+ technologies listed with under 2 years of experience","Advanced technologies never mentioned in experience bullets","No implementation verbs despite enterprise tech in skills","Contradictory career profile (marketing + DevOps, etc.)","Skills mentioned that contradict the claimed role type","Skill count vs experience span implausibility"] },
  { icon:<Link size={18} className="text-indigo-600"/>, title:"Identity & Verifiability", color:"border-slate-200 bg-white shadow-sm",
    checks:["No LinkedIn profile URL found","No GitHub or portfolio for technical roles","Generic placeholder company names detected","Suspicious education institution naming patterns","No verifiable digital footprint anywhere","Phone or email missing from contact section"] },
  { icon:<Brain size={18} className="text-indigo-600"/>, title:"Content Quality Analysis", color:"border-slate-200 bg-white shadow-sm",
    checks:["AI-generated content signature (6+ buzzwords)","Repetitive bullet structures across all roles","Near-duplicate bullets across different employers","Passive, vague language with zero quantified outcomes","No action verbs; entirely responsibility-based writing","CGPA/GPA exceeding the mathematical maximum (10.0 or 4.0)"] },
];

// ── Prevention tips — UNCHANGED ──────────────────────────────
const PREVENTION_TIPS = [
  { icon:<Calendar size={16}/>, color:"text-indigo-600 bg-white border-slate-200 shadow-sm", title:"Use Month/Year for all dates", body:"Vague dates like '2020–2022' trigger flags. Use 'Jan 2020 – Mar 2022'. If you had a gap, note it: 'Career Break – Upskilling in React'." },
  { icon:<Target size={16}/>, color:"text-indigo-600 bg-white border-slate-200 shadow-sm", title:"Quantify every achievement", body:"Replace 'managed a team' with 'led a team of 6 engineers to deliver 3 product features, reducing churn by 18%'. Numbers kill vagueness flags." },
  { icon:<Award size={16}/>, color:"text-indigo-600 bg-white border-slate-200 shadow-sm", title:"Include cert verification IDs", body:"Always add Credential ID from platforms like Coursera, AWS, or LinkedIn Learning. Verifiable certs score zero fraud points." },
  { icon:<Link size={16}/>, color:"text-indigo-600 bg-white border-slate-200 shadow-sm", title:"Add your LinkedIn profile", body:"A matching LinkedIn profile is the single strongest signal of authenticity. It cross-validates your timeline, titles, and education." },
  { icon:<Code2 size={16}/>, color:"text-indigo-600 bg-white border-slate-200 shadow-sm", title:"Only list verifiable skills", body:"Every skill listed should have an associated project or role that used it. If you can't explain it in an interview, remove it." },
  { icon:<BookOpen size={16}/>, color:"text-indigo-600 bg-white border-slate-200 shadow-sm", title:"Write in your own voice", body:"AI-generated text is detectable. Add specific team names, project codenames, client types, or tools. Real experience has specific details." },
];

// ── Trust ring — UNCHANGED ───────────────────────────────────
function TrustRing({ score, status }) {
  const r = 54, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center">
      <svg width="136" height="136" viewBox="0 0 136 136">
        <circle cx="68" cy="68" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10"/>
        <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 68 68)" style={{transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)'}}/>
        <text x="68" y="62" textAnchor="middle" fill="#ffffff" fontSize="28" fontWeight="800">{score}</text>
        <text x="68" y="78" textAnchor="middle" fill="#ffffff" opacity="0.8" fontSize="9" fontWeight="600">TRUST SCORE</text>
      </svg>
      <span style={{fontWeight:800,color:'#ffffff',fontSize:12,letterSpacing:'0.12em',marginTop:'8px'}}>
        {status==='Flagged'?'SUSPICIOUS':'VERIFIED'}
      </span>
    </div>
  );
}

// ── Completeness ring ─────────────────────────────────────────
function CompletenessRing({ score }) {
  const r = 40, circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8"/>
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={circ - (score/100)*circ}
        strokeLinecap="round" transform="rotate(-90 48 48)"
        style={{transition:'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)'}}/>
      <text x="48" y="52" textAnchor="middle" fill="#1e293b" fontSize="18" fontWeight="800">{score}%</text>
    </svg>
  );
}

// ── Module card — UNCHANGED ───────────────────────────────────
function ModuleCard({ mod }) {
  return (
    <div className={`rounded-2xl border ${mod.color} overflow-hidden flex flex-col h-full`}>
      <div className="flex items-center gap-4 px-6 py-5 bg-slate-50 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">{mod.icon}</div>
        <span className="font-bold text-slate-900 text-base">{mod.title}</span>
      </div>
      <div className="p-6 bg-white flex-1">
        <ul className="space-y-3">
          {mod.checks.map((c,i)=>(
            <li key={i} className="flex items-start gap-3">
              <Eye size={14} className="text-indigo-400 flex-shrink-0 mt-0.5"/>
              <span className="text-xs text-slate-600 leading-relaxed font-medium">{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Flag card — enhanced with category badge + fix section ────
function FlagCard({ flag, index }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY[flag.severity] || SEVERITY.medium;
  const cat = CATEGORY_CONFIG[flag.category] || { icon:<AlertCircle size={14}/>, color:"bg-slate-100 text-slate-700 border-slate-200" };

  return (
    <div className={`flag-in rounded-2xl border bg-white shadow-sm ${sev.border}`}
      style={{animationDelay:`${index*0.07}s`}}>
      {/* Header — always visible */}
      <div className={`flex items-start gap-5 p-6 ${expanded ? 'border-b border-slate-100' : ''}`}>
        <div className={`w-10 h-10 rounded-full border shadow-inner flex items-center justify-center text-sm font-black flex-shrink-0 ${sev.bg} ${sev.border} text-slate-700`}>
          {String(index+1).padStart(2,'0')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {sev.icon}
            <span className="font-black text-slate-900 text-base leading-tight">{flag.type}</span>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${sev.badge}`}>
              {sev.label}
            </span>
            {flag.category && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.color}`}>
                {cat.icon} {flag.category}
              </span>
            )}
          </div>
          {/* Always show detail */}
          <p className="text-slate-600 leading-relaxed text-sm">{flag.detail}</p>
        </div>
        <button onClick={()=>setExpanded(o=>!o)} className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
          {expanded ? <ChevronUp size={14} className="text-slate-500"/> : <ChevronDown size={14} className="text-slate-500"/>}
        </button>
      </div>

      {/* Expanded — fix / recommendation */}
      {expanded && flag.recommendation && (
        <div className="px-6 pb-5">
          <div className="flex items-start gap-3 bg-amber-50 rounded-xl px-4 py-4 border border-amber-100">
            <Zap size={16} className="text-amber-500 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">How to Fix This</p>
              <p className="text-sm font-medium text-amber-800 leading-relaxed">{flag.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Completeness panel ────────────────────────────────────────
function CompletenessPanel({ completeness }) {
  if (!completeness) return null;
  const { score, present, missing, found_sections, total_sections } = completeness;
  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';

  const SECTION_LABELS = {
    contact_email:          { label:"Email Address",          icon:<User size={13}/>       },
    contact_phone:          { label:"Phone Number",           icon:<User size={13}/>       },
    linkedin_profile:       { label:"LinkedIn Profile",       icon:<Link size={13}/>       },
    github_profile:         { label:"GitHub Profile",         icon:<Code2 size={13}/>      },
    professional_summary:   { label:"Professional Summary",   icon:<FileText size={13}/>   },
    work_experience:        { label:"Work Experience Section", icon:<Briefcase size={13}/> },
    education:              { label:"Education Section",       icon:<BookOpen size={13}/>  },
    skills_section:         { label:"Skills Section",          icon:<Code2 size={13}/>     },
    projects:               { label:"Projects Section",        icon:<Hash size={13}/>      },
    certifications:         { label:"Certifications",          icon:<Award size={13}/>     },
    quantified_achievements:{ label:"Quantified Achievements", icon:<TrendingUp size={13}/>},
    action_verbs:           { label:"Action Verbs",            icon:<Zap size={13}/>       },
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-7">
        <CompletenessRing score={score}/>
        <div>
          <h3 className="font-black text-slate-900 text-xl mb-1">Resume Completeness</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            {found_sections} of {total_sections} professional resume elements detected.{' '}
            {Object.keys(missing).length > 0
              ? `${Object.keys(missing).length} element(s) are missing and should be added.`
              : 'Your resume has all the essential structural elements.'}
          </p>
          <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-sm font-black border ${
            score >= 80 ? 'bg-green-50 border-green-200 text-green-700' :
            score >= 60 ? 'bg-amber-50 border-amber-200 text-amber-700' :
            'bg-red-50 border-red-200 text-red-700'
          }`}>
            <BarChart2 size={12}/>
            {score >= 80 ? 'Complete' : score >= 60 ? 'Mostly Complete' : 'Incomplete'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {Object.entries(SECTION_LABELS).map(([key, { label, icon }]) => {
          const isPresent = present[key];
          return (
            <div key={key} className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
              isPresent
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                {isPresent ? <CheckSquare size={13}/> : <MinusSquare size={13}/>}
              </div>
              <span className="leading-tight">{label}</span>
            </div>
          );
        })}
      </div>

      {Object.keys(missing).length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <h4 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={15} className="text-red-500"/> Missing Elements — Add These to Your Resume
          </h4>
          <div className="space-y-2.5">
            {Object.entries(missing).map(([key, advice]) => (
              <div key={key} className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5"/>
                <p className="text-xs font-medium text-amber-800 leading-relaxed">{advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category summary bar ──────────────────────────────────────
function CategorySummary({ flags }) {
  if (!flags || flags.length === 0) return null;

  const categoryCounts = {};
  flags.forEach(f => {
    const cat = f.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const sorted = Object.entries(categoryCounts).sort(([,a],[,b]) => b-a);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
        <BarChart2 size={15} className="text-indigo-600"/> Issues by Category
      </h3>
      <div className="space-y-3">
        {sorted.map(([cat, count]) => {
          const cfg = CATEGORY_CONFIG[cat] || { icon:<AlertCircle size={13}/>, color:"bg-slate-100 text-slate-700 border-slate-200" };
          const pct = Math.round((count / flags.length) * 100);
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                    {cfg.icon} {cat}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-600">{count} issue{count>1?'s':''}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{width:`${pct}%`}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT — UI IDENTICAL TO PROVIDED CODE
// ═══════════════════════════════════════════════════════════════
const FraudDetector = ({ user, requireLogin }) => {
  const [file, setFile]           = useState(null);
  const [analysis, setAnalysis]   = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [activeTab, setActiveTab] = useState('flags');
  const reportRef = useRef(null);

  const trustScore = analysis ? Math.max(0, 100 - (analysis.fraud_count||0)*15) : null;

  const handleUpload = async () => {
    if (!user) { alert("Please log in to analyse your resume!"); if(requireLogin) requireLogin(); return; }
    if (!file) return alert("Please select a file first!");
    setAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("https://ai-engine-x5jb.onrender.com/analyze", { method:"POST", body:formData });
      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
        setTimeout(()=>reportRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),200);
        try {
          const isFraud   = result.fraud_count > 0;
          const userEmail = auth.currentUser?.email || 'Anonymous User';
          if (isFraud) {
            const statsRef = doc(db,'system_stats','overview');
            await setDoc(statsRef,{fraudDetections:increment(1)},{merge:true});
          }
          await addDoc(collection(db,'recent_activity'),{
            type:isFraud?'fraud':'resume', action:isFraud?'Fraud detected':'Resume verified clean',
            email:userEmail, time:'Just now', timestamp:serverTimestamp()
          });
          await trackFeatureUsage('Fraud Detector');
          await logActivity('fraud','Resume analysed for fraud',auth.currentUser?.email||'Anonymous User');
          await updateSystemStats('resume_analyzed');
          if (isFraud) await updateSystemStats('fraud_detected');
        } catch(dbError){ console.error("Non-critical DB/Analytics error:",dbError); }
      } else { alert("Error analysing resume."); }
    } catch(error){ alert("Error: Backend not reachable. Is Flask running on port 5000?"); }
    setAnalyzing(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type==='application/pdf') setFile(f); else alert("Only PDF files are accepted.");
  };

  // Group flags by severity for organised display
  const flags = analysis?.fraud_flags || [];
  const criticalFlags = flags.filter(f => f.severity === 'critical');
  const highFlags     = flags.filter(f => f.severity === 'high');
  const mediumFlags   = flags.filter(f => f.severity === 'medium');
  const lowFlags      = flags.filter(f => f.severity === 'low');

  const TABS = [
    { key:'flags',        label:'Fraud Flags',    icon:<AlertCircle size={15}/>,  badge: flags.length > 0 ? flags.length : null },
    { key:'completeness', label:'Resume Health',  icon:<BarChart2 size={15}/>   },
    { key:'skills',       label:'Skills & Info',  icon:<Code2 size={15}/>        },
  ];

  return (
    <>
      <style>{`
        .fd-bg { background-color: transparent; }
        .fd-grid { background-image: linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px); background-size: 40px 40px; }
        .pulse-dot { animation: pulseDot 2s ease-out infinite; }
        @keyframes pulseDot { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
        .flag-in { animation: flagIn 0.4s ease both; }
        @keyframes flagIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <div className="min-h-screen text-slate-800">
        <div className="fd-grid min-h-screen">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-20">

            {/* ══ HERO — UNCHANGED ═══════════════════════════ */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <div className="relative w-1.5 h-1.5"><div className="absolute inset-0 rounded-full bg-indigo-600 pulse-dot"/><div className="w-1.5 h-1.5 rounded-full bg-indigo-600"/></div>
                <span className="text-indigo-700 text-xs font-bold uppercase tracking-widest">24-Module Detection Engine</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 leading-tight">
                Resume Fraud<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Intelligence</span>
              </h1>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed italic">
                Industrial-grade forensic analysis detecting fabricated experience, fake certifications,
                ghost companies, AI-generated content, timeline manipulation, and skill fabrication —
                across 24 independent detection modules.
              </p>
              <div className="flex flex-wrap justify-center gap-8 mt-8">
                {[["24","Detection Modules"],["93%","Accuracy Rate"],["< 3s","Scan Time"],["100%","Free"]].map(([v,l],i)=>(
                  <div key={i} className="text-center">
                    <div className="text-2xl font-black text-slate-900">{v}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ UPLOAD — UNCHANGED ════════════════════════ */}
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all duration-300 ${dragOver?'border-indigo-400 bg-indigo-50':'border-slate-300 bg-slate-50 hover:border-indigo-300'}`}>
                <input type="file" accept=".pdf" onChange={e=>setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"/>
                <div className="p-12 text-center">
                  <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all shadow-sm ${file?'bg-green-50 border border-green-200':'bg-white border border-slate-200'}`}>
                    {file?<CheckCircle size={28} className="text-green-500"/>:<Upload size={28} className="text-indigo-400"/>}
                  </div>
                  {file
                    ?<><p className="font-bold text-green-600 text-sm mb-1">{file.name}</p><p className="text-slate-500 text-xs font-semibold">{(file.size/1024).toFixed(1)} KB · Ready for analysis</p></>
                    :<><p className="font-bold text-slate-700 text-base mb-1">Drop your resume PDF here</p><p className="text-slate-400 text-xs font-semibold">or click to browse · PDF only · max 5MB</p></>}
                </div>
              </div>
              <button onClick={handleUpload} disabled={analyzing}
                className={`w-full mt-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${analyzing?'bg-slate-100 text-slate-400 cursor-not-allowed':'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:-translate-y-0.5'}`}>
                {analyzing?<><div className="w-4 h-4 border-2 border-indigo-600 border-t-white rounded-full animate-spin"/>Deep Scanning Resume...</>:<><Brain size={18}/>Run Forensic Analysis</>}
              </button>
              {analyzing && (
                <div className="mt-4 bg-indigo-50 rounded-xl border border-indigo-100 p-5">
                  <div className="space-y-3">
                    {[
                      "Parsing document structure and text...",
                      "Running 24 fraud detection modules...",
                      "Analysing timeline for overlaps and gaps...",
                      "Cross-checking skills against claimed roles...",
                      "Detecting AI content and copy-paste patterns...",
                      "Compiling full forensic report...",
                    ].map((msg,i)=>(
                      <div key={i} className="flex items-center gap-3 flag-in" style={{animationDelay:`${i*0.2}s`}}>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0"/>
                        <span className="font-semibold text-xs text-indigo-700">{msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ══ REPORT ════════════════════════════════════ */}
            {analysis && (
              <div ref={reportRef} className="space-y-8">

                {/* Result banner — UNCHANGED gradient header */}
                <div className={`rounded-3xl border-2 overflow-hidden shadow-lg ${analysis.fraud_detection==='Flagged'?'border-red-200 bg-white':'border-green-200 bg-white'}`}>
                  <div className={`flex flex-col md:flex-row items-center gap-8 p-8 md:p-10 ${analysis.fraud_detection==='Flagged'?'bg-gradient-to-r from-red-600 to-red-500':'bg-gradient-to-r from-emerald-600 to-emerald-500'}`}>
                    <TrustRing score={trustScore} status={analysis.fraud_detection}/>
                    <div className="flex-1 text-center md:text-left">
                      <div className="text-xs text-white/80 font-bold uppercase tracking-widest mb-2">
                        Forensic Report — {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                        {analysis.fraud_detection==='Flagged'?'Suspicious Patterns Detected':'Resume Appears Authentic'}
                      </h2>
                      <p className="text-white/90 text-sm md:text-base italic leading-relaxed max-w-xl">
                        {analysis.fraud_detection==='Flagged'
                          ? `${analysis.fraud_count} anomaly${analysis.fraud_count>1?'s':''} flagged across ${analysis.fraud_count} independent detection modules. Each flag is a verifiable inconsistency with a specific fix.`
                          : 'No suspicious patterns found. Timeline integrity, skill alignment, content authenticity, and verifiability all passed our 24-module forensic scan.'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 min-w-[170px]">
                      {[
                        {label:"Risk Level",    value:analysis.fraud_count===0?"None":analysis.fraud_count<=2?"Moderate":analysis.fraud_count<=5?"High":"Critical", color:analysis.fraud_count===0?"text-emerald-600":analysis.fraud_count<=2?"text-amber-600":analysis.fraud_count<=5?"text-red-600":"text-red-800"},
                        {label:"Total Flags",   value:`${analysis.fraud_count||0}`, color:"text-slate-800"},
                        {label:"Resume Health", value:`${analysis.completeness?.score||0}%`, color:analysis.completeness?.score>=80?"text-emerald-600":analysis.completeness?.score>=60?"text-amber-600":"text-red-600"},
                        {label:"Skills Found",  value:`${analysis.skills_detected?.length||0}`, color:"text-indigo-600"},
                      ].map((m,i)=>(
                        <div key={i} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-white/20">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</div>
                          <div className={`font-black text-xl ${m.color}`}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex flex-wrap gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 w-fit mt-8 mx-8">
                    {TABS.map(t=>(
                      <button key={t.key} onClick={()=>setActiveTab(t.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab===t.key?'bg-white text-indigo-700 shadow-sm border border-slate-200':'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                        {t.icon} {t.label}
                        {t.badge && <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">{t.badge}</span>}
                      </button>
                    ))}
                  </div>

                  <div className="p-8 md:p-10">

                    {/* ─ TAB: FRAUD FLAGS ─ */}
                    {activeTab==='flags' && (
                      <div className="space-y-8">
                        {flags.length === 0 ? (
                          <div className="flex items-center gap-6 p-8 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-white border border-emerald-100 shadow-sm flex items-center justify-center"><CheckCircle size={32} className="text-emerald-500"/></div>
                            <div>
                              <p className="font-black text-emerald-800 text-xl">All 24 checks passed</p>
                              <p className="text-base text-emerald-600 mt-1 italic">No suspicious patterns detected. This resume shows strong authenticity signals.</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Category summary */}
                            <CategorySummary flags={flags}/>

                            {/* Critical flags */}
                            {criticalFlags.length > 0 && (
                              <div>
                                <h3 className="font-black text-red-600 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <XCircle size={15}/> Critical Issues ({criticalFlags.length}) — Immediate Action Required
                                </h3>
                                <div className="space-y-4">
                                  {criticalFlags.map((flag,i)=><FlagCard key={i} flag={flag} index={i}/>)}
                                </div>
                              </div>
                            )}

                            {/* High flags */}
                            {highFlags.length > 0 && (
                              <div>
                                <h3 className="font-black text-rose-600 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <AlertTriangle size={15}/> High Risk ({highFlags.length})
                                </h3>
                                <div className="space-y-4">
                                  {highFlags.map((flag,i)=><FlagCard key={i} flag={flag} index={criticalFlags.length+i}/>)}
                                </div>
                              </div>
                            )}

                            {/* Medium flags */}
                            {mediumFlags.length > 0 && (
                              <div>
                                <h3 className="font-black text-amber-600 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <AlertCircle size={15}/> Medium Risk ({mediumFlags.length})
                                </h3>
                                <div className="space-y-4">
                                  {mediumFlags.map((flag,i)=><FlagCard key={i} flag={flag} index={criticalFlags.length+highFlags.length+i}/>)}
                                </div>
                              </div>
                            )}

                            {/* Low flags */}
                            {lowFlags.length > 0 && (
                              <div>
                                <h3 className="font-black text-blue-600 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Info size={15}/> Low Risk / Advisory ({lowFlags.length})
                                </h3>
                                <div className="space-y-4">
                                  {lowFlags.map((flag,i)=><FlagCard key={i} flag={flag} index={criticalFlags.length+highFlags.length+mediumFlags.length+i}/>)}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* ─ TAB: RESUME HEALTH / COMPLETENESS ─ */}
                    {activeTab==='completeness' && (
                      <CompletenessPanel completeness={analysis.completeness}/>
                    )}

                    {/* ─ TAB: SKILLS & INFO ─ */}
                    {activeTab==='skills' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Skills */}
                          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                            <h3 className="font-black text-slate-900 text-lg mb-5 flex items-center gap-2">
                              <Code2 size={20} className="text-indigo-600"/> Detected Skills ({analysis.skills_detected?.length||0})
                            </h3>
                            {analysis.skills_detected?.length
                              ? <div className="flex flex-wrap gap-2">
                                  {analysis.skills_detected.map((s,i)=>(
                                    <span key={i} className="text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg shadow-sm">{s}</span>
                                  ))}
                                </div>
                              : <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                                  <AlertTriangle size={18} className="text-red-500 flex-shrink-0"/>
                                  <p className="text-sm font-semibold text-red-700">No recognisable technical skills detected. Add a dedicated Skills section.</p>
                                </div>}
                          </div>

                          {/* Personal info */}
                          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                            <h3 className="font-black text-slate-900 text-lg mb-5 flex items-center gap-2">
                              <User size={20} className="text-indigo-600"/> Extracted Contact Info
                            </h3>
                            <div className="space-y-4">
                              {[["Email", analysis.personal_info?.email],["Phone", analysis.personal_info?.phone]].map(([label,val],i)=>(
                                <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-100">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                                  {val
                                    ? <span className="text-sm text-slate-800 font-semibold">{val}</span>
                                    : <span className="text-sm text-red-500 font-bold flex items-center gap-1"><XCircle size={13}/>Not found</span>}
                                </div>
                              ))}
                            </div>
                            {analysis.optimization_tips?.length>0 && (
                              <div className="mt-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">ATS Quick Tips</p>
                                {analysis.optimization_tips.map((tip,i)=>(
                                  <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                                    <TrendingUp size={14} className="text-indigo-500 flex-shrink-0 mt-0.5"/>
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed">{tip.msg}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}

            {/* ══ HOW WE DETECT — UNCHANGED ═════════════════ */}
            <div>
              <div className="text-center mb-10">
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-4 border border-indigo-100">Forensic Engine — 24 Modules</div>
                <h2 className="text-3xl font-black text-slate-900">How We Detect Fraud</h2>
                <p className="text-slate-500 text-base italic mt-3 max-w-2xl mx-auto">Six detection families, each scanning for distinct fraud patterns found in fabricated resumes.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DETECTION_MODULES.map((mod,i)=><ModuleCard key={i} mod={mod}/>)}
              </div>
            </div>

            {/* ══ PREVENTION TIPS — UNCHANGED ═══════════════ */}
            <div>
              <div className="text-center mb-10">
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-4 border border-indigo-100">For Candidates</div>
                <h2 className="text-3xl font-black text-slate-900">How to Pass Every Check</h2>
                <p className="text-slate-500 text-base italic mt-3 max-w-2xl mx-auto">An authentic resume always passes. Here's how to make yours score zero fraud flags.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PREVENTION_TIPS.map((tip,i)=>(
                  <div key={i} className={`rounded-2xl p-6 border transition-all hover:shadow-md ${tip.color}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">{React.cloneElement(tip.icon)}</div>
                      <span className="font-black text-slate-900 text-sm leading-tight">{tip.title}</span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed italic">{tip.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ STATS — UNCHANGED ═════════════════════════ */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 md:p-14">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                {[["78%","of hiring managers report encountering resumes with inflated skills","text-rose-500"],["46%","of candidates embellish responsibilities in at least one role","text-amber-500"],["3.4×","more likely to be shortlisted with a verified, metric-backed resume","text-emerald-500"]].map(([v,d,c],i)=>(
                  <div key={i}>
                    <div className={`text-5xl font-black mb-4 ${c} drop-shadow-sm`}>{v}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed px-4">{d}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-400 text-center pb-8 leading-relaxed max-w-3xl mx-auto">
              This tool provides automated pattern analysis and should not be used as the sole basis for hiring decisions. All flags should be verified through direct conversation with candidates.
            </p>

          </div>
        </div>
      </div>
    </>
  );
};

export default FraudDetector;