// src/components/AtsScorer.js
import React, { useState, useRef } from 'react';
import {
  FileText, Upload, Brain, Terminal, AlertTriangle, CheckCircle,
  Target, TrendingUp, XCircle, Info, ChevronDown, ChevronUp,
  Award, Code2, User, BookOpen, Zap, BarChart2, Eye,
  Shield, AlertCircle, Clock, Layout, Star, ArrowRight,
  CheckSquare, Hash,
} from 'lucide-react';

import { auth, db } from '../firebase';
import { doc, setDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { trackFeatureUsage, logActivity, updateSystemStats } from '../utils/analytics';

// ─── BASE STYLES ──────────────────────────────────────
const FONT_CSS = `
  .ats-bg {
    background:
      radial-gradient(ellipse 70% 40% at 20% 0%, rgba(79,70,229,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 50% 30% at 80% 80%, rgba(99,102,241,0.07) 0%, transparent 50%),
      #f8fafc;
  }
  .score-ring-track { transition: stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1); }
  .dim-bar-fill     { transition: width 1s cubic-bezier(.4,0,.2,1); }
  .reveal { animation: revealUp 0.5s ease both; }
  @keyframes revealUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .tag-pulse { animation: tagPulse 2s ease-in-out infinite; }
  @keyframes tagPulse { 0%,100%{opacity:1;} 50%{opacity:0.6;} }
`;

// ─── GRADE CONFIG ────────────────────────────────────────────
const GRADE_CONFIG = {
  "A+": { ring:"#22c55e", bg:"bg-green-50",  border:"border-green-200", text:"text-green-700",  badge:"bg-green-500" },
  "A":  { ring:"#22c55e", bg:"bg-green-50",  border:"border-green-200", text:"text-green-700",  badge:"bg-green-500" },
  "B+": { ring:"#3b82f6", bg:"bg-blue-50",   border:"border-blue-200",  text:"text-blue-700",   badge:"bg-blue-500"  },
  "B":  { ring:"#3b82f6", bg:"bg-blue-50",   border:"border-blue-200",  text:"text-blue-700",   badge:"bg-blue-500"  },
  "C":  { ring:"#f59e0b", bg:"bg-amber-50",  border:"border-amber-200", text:"text-amber-700",  badge:"bg-amber-500" },
  "D":  { ring:"#ef4444", bg:"bg-red-50",    border:"border-red-200",   text:"text-red-700",    badge:"bg-red-500"   },
  "F":  { ring:"#ef4444", bg:"bg-red-50",    border:"border-red-200",   text:"text-red-700",    badge:"bg-red-500"   },
};

const PRIORITY_CONFIG = {
  high:   { label:"High Impact", bg:"bg-red-50",   border:"border-red-200",  text:"text-red-700",  dot:"bg-red-500"   },
  medium: { label:"Medium",      bg:"bg-amber-50", border:"border-amber-200",text:"text-amber-700", dot:"bg-amber-500" },
  low:    { label:"Low",         bg:"bg-blue-50",  border:"border-blue-200", text:"text-blue-700",  dot:"bg-blue-400"  },
};

const CATEGORY_ICONS = {
  contact:    <User size={14}/>,
  structure:  <Layout size={14}/>,
  keywords:   <Code2 size={14}/>,
  impact:     <TrendingUp size={14}/>,
  verbs:      <Zap size={14}/>,
  formatting: <FileText size={14}/>,
  soft_skills:<Star size={14}/>,
  ats:        <Shield size={14}/>,
};

const DIM_ICONS = {
  contact:       <User size={16} className="text-indigo-500"/>,
  sections:      <Layout size={16} className="text-purple-500"/>,
  keywords:      <Code2 size={16} className="text-cyan-500"/>,
  verbs:         <Zap size={16} className="text-amber-500"/>,
  quantification:<Hash size={16} className="text-green-500"/>,
  formatting:    <FileText size={16} className="text-blue-500"/>,
  length:        <Clock size={16} className="text-rose-500"/>,
  education:     <BookOpen size={16} className="text-violet-500"/>,
  soft_skills:   <Star size={16} className="text-orange-500"/>,
  compatibility: <Shield size={16} className="text-teal-500"/>,
};

// ── ATS best practices guide content ─────────────────────────
const ATS_GUIDE = [
  {
    icon: <Layout size={20} className="text-indigo-500"/>,
    title: "Use a Single-Column Layout",
    body: "Multi-column resumes confuse ATS parsers. The text is read left-to-right across both columns, scrambling your content. Use one column only.",
    tip: "Templates from Canva, Zety, and Novoresume often break ATS. Use plain Word or Google Docs."
  },
  {
    icon: <FileText size={20} className="text-purple-500"/>,
    title: "Include All 7 Standard Sections",
    body: "ATS systems look for: Summary, Experience, Education, Skills, Projects, Certifications, Contact Info. Missing sections reduce match probability by 30–60%.",
    tip: "Label sections with standard headers exactly: 'Work Experience' not 'Where I've Worked'."
  },
  {
    icon: <Code2 size={20} className="text-cyan-500"/>,
    title: "Mirror Keywords from Job Descriptions",
    body: "ATS software scores you against the JD. Copy exact skill names from the job post. If they say 'Node.js', don't write 'NodeJS'. Exact match = full points.",
    tip: "Run the JD through a word frequency tool. The top 10 terms are your required keywords."
  },
  {
    icon: <Hash size={20} className="text-green-500"/>,
    title: "Quantify Every Achievement",
    body: "Bullets with numbers score 37% higher in ATS. Every role should have at least 2 quantified bullets using %, $, user counts, time saved, or performance gains.",
    tip: "If you don't have numbers, estimate conservatively: 'team of ~8', 'reduced by approx. 25%'."
  },
  {
    icon: <Zap size={20} className="text-amber-500"/>,
    title: "Start Every Bullet with a Power Verb",
    body: "ATS NLP models extract action verbs to classify your experience level. 'Responsible for X' signals junior; 'Architected X' signals senior. Verb choice matters.",
    tip: "Never repeat the same verb twice in a role. Aim for 8–12 unique power verbs across your resume."
  },
  {
    icon: <User size={20} className="text-rose-500"/>,
    title: "Complete Your Contact Header",
    body: "ATS parsers extract contact info first. Missing LinkedIn reduces shortlist probability by 40%. Missing phone = auto-reject in many enterprise ATS systems (Workday, Taleo).",
    tip: "Format: Full Name | Email | Phone | City, Country | linkedin.com/in/handle | github.com/handle"
  },
  {
    icon: <Clock size={20} className="text-teal-500"/>,
    title: "Use Month/Year Date Format",
    body: "Year-only dates (2020–2022) are ambiguous to ATS. Use 'Jan 2020 – Mar 2022'. This enables accurate experience calculation and prevents false fraud flags.",
    tip: "For current roles: 'Jan 2023 – Present'. Never leave end dates blank."
  },
  {
    icon: <Shield size={20} className="text-violet-500"/>,
    title: "Save as ATS-Safe PDF",
    body: "Export from Word or Google Docs as PDF. Never scan a printed resume. Never use Photoshop/Illustrator PDFs. The text must be machine-selectable.",
    tip: "Test: can you Ctrl+A → Ctrl+C → paste into Notepad and read it? If yes, it's ATS-safe."
  },
];

// ─── SCORE RING SVG ──────────────────────────────────────────
function ScoreRing({ score, grade }) {
  const r = 70; const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const gc = GRADE_CONFIG[grade?.grade] || GRADE_CONFIG["C"];
  return (
    <div className="flex flex-col items-center">
      <svg width="168" height="168" viewBox="0 0 168 168">
        <circle cx="84" cy="84" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12"/>
        <circle cx="84" cy="84" r={r} fill="none" stroke={gc.ring} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={circ - pct * circ}
          strokeLinecap="round" transform="rotate(-90 84 84)"
          className="score-ring-track"/>
        <text x="84" y="78" textAnchor="middle" fill="#0f172a" fontSize="34"
          fontWeight="800">{score}</text>
        <text x="84" y="96" textAnchor="middle" fill="#94a3b8" fontSize="10"
          fontWeight="600">OUT OF 100</text>
      </svg>
      <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black mt-1 ${gc.bg} ${gc.border} ${gc.text} border`}>
        <span>{grade?.grade}</span>
        <span className="text-xs font-semibold opacity-70">·</span>
        <span className="text-xs">{grade?.label}</span>
      </div>
    </div>
  );
}

// ─── DIMENSION ROW ───────────────────────────────────────────
function DimRow({ dimKey, dim, delay = 0 }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((dim.score / dim.max) * 100);
  const barColor = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
  const textColor = pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="reveal border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-indigo-300 transition-all"
      style={{ animationDelay: `${delay}s` }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
          {DIM_ICONS[dimKey]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-slate-800 text-sm">{dim.label}</span>
            <span className={`text-sm font-black ${textColor}`}>{dim.score}/{dim.max}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full dim-bar-fill ${barColor}`} style={{ width: `${pct}%` }}/>
          </div>
        </div>
        <div className="ml-2 text-slate-400">
          {open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50">
          <p className="text-sm text-slate-600 mb-3 italic">{dim.detail}</p>
          {/* Context-specific expanded content */}
          {dimKey === 'contact' && dim.checks && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(dim.checks).map(([k, v]) => (
                <div key={k} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${v ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {v ? <CheckCircle size={11}/> : <XCircle size={11}/>} {k}
                </div>
              ))}
            </div>
          )}
          {dimKey === 'sections' && dim.sections && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(dim.sections).map(([k, v]) => (
                <div key={k} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${v ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {v ? <CheckCircle size={11}/> : <AlertCircle size={11}/>} {k}
                </div>
              ))}
            </div>
          )}
          {dimKey === 'keywords' && (
            <div>
              {dim.tier1_skills?.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Core Skills ({dim.tier1_skills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dim.tier1_skills.map(s => <span key={s} className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md font-bold">{s}</span>)}
                  </div>
                </div>
              )}
              {dim.tier2_skills?.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Domain Skills ({dim.tier2_skills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dim.tier2_skills.map(s => <span key={s} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
          {dimKey === 'verbs' && (
            <div className="space-y-2">
              {dim.power_verbs?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Power Verbs Found ({dim.power_verbs.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dim.power_verbs.map(v => <span key={v} className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-md font-bold">{v}</span>)}
                  </div>
                </div>
              )}
              {dim.weak_phrases?.length > 0 && (
                <div>
                  <p className="text-[10px] text-red-400 uppercase tracking-widest mb-1.5">Weak Phrases to Remove</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dim.weak_phrases.map(p => <span key={p} className="text-[10px] bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-md font-bold line-through">{p}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
          {dimKey === 'quantification' && dim.patterns && (
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(dim.patterns).map(([k, v]) => (
                <div key={k} className={`text-center px-2 py-2 rounded-lg border ${v > 0 ? 'bg-green-50 border-green-200' : 'bg-slate-100 border-slate-200'}`}>
                  <div className={`font-black text-lg ${v > 0 ? 'text-green-600' : 'text-slate-400'}`}>{v}</div>
                  <div className="text-[9px] text-slate-500 uppercase">{k.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          )}
          {dimKey === 'formatting' && dim.issues?.length > 0 && (
            <div className="space-y-1.5">
              {dim.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle size={12} className="text-red-500 flex-shrink-0 mt-0.5"/>
                  <span className="text-xs text-red-700">{issue}</span>
                </div>
              ))}
            </div>
          )}
          {dimKey === 'length' && (
            <div className="flex gap-4">
              <div className="text-center bg-white border border-slate-200 rounded-lg px-4 py-2">
                <div className="font-black text-xl text-indigo-600">{dim.pages}</div>
                <div className="text-[10px] text-slate-500 uppercase">Pages</div>
              </div>
              <div className="text-center bg-white border border-slate-200 rounded-lg px-4 py-2">
                <div className="font-black text-xl text-indigo-600">{dim.word_count}</div>
                <div className="text-[10px] text-slate-500 uppercase">Words</div>
              </div>
            </div>
          )}
          {dimKey === 'soft_skills' && dim.found?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dim.found.map(s => <span key={s} className="text-[10px] bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded-md font-bold">{s}</span>)}
            </div>
          )}
          {dimKey === 'compatibility' && dim.flags?.length > 0 && (
            <div className="space-y-1.5">
              {dim.flags.map((f, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle size={12} className="text-amber-500 flex-shrink-0 mt-0.5"/>
                  <span className="text-xs text-amber-700">{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SUGGESTION CARD ─────────────────────────────────────────
function SuggestionCard({ s, idx }) {
  const pc = PRIORITY_CONFIG[s.priority] || PRIORITY_CONFIG.medium;
  return (
    <div className={`p-5 rounded-2xl border ${pc.bg} ${pc.border} reveal`}
      style={{ animationDelay: `${idx * 0.06}s` }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${pc.dot}`}/>
          <span className={`font-black text-sm ${pc.text}`}>{s.title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${pc.dot.replace('bg-', 'bg-')} text-white`}>{pc.label}</span>
          <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{s.impact}</span>
        </div>
      </div>
      <p className={`text-sm leading-relaxed ${pc.text} opacity-90`}>{s.detail}</p>
      {s.category && CATEGORY_ICONS[s.category] && (
        <div className={`flex items-center gap-1 mt-2 ${pc.text} opacity-60`}>
          {CATEGORY_ICONS[s.category]}
          <span className="text-[10px] uppercase tracking-wide">{s.category.replace('_', ' ')}</span>
        </div>
      )}
    </div>
  );
}

// ─── UPDATED GUIDE CARD (Always Open, No Accordion) ──────────
function GuideCard({ item, idx }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all reveal flex flex-col h-full"
      style={{ animationDelay: `${idx * 0.05}s` }}>
      <div className="flex items-center gap-4 px-6 py-5 bg-slate-50 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
          {item.icon}
        </div>
        <span className="font-bold text-slate-800 text-base">{item.title}</span>
      </div>
      <div className="p-6 bg-white flex-1 flex flex-col justify-between">
        <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
        <div className="mt-4 flex items-start gap-2 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <ArrowRight size={14} className="text-indigo-500 flex-shrink-0 mt-0.5"/>
          <p className="text-xs font-semibold text-indigo-700 leading-relaxed">{item.tip}</p>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
const AtsScorer = ({ user, requireLogin }) => {
  const [file, setFile]           = useState(null);
  const [analysis, setAnalysis]   = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const reportRef = useRef(null);

  const handleUpload = async () => {
    // Auth Wall Logic Preserved!
    if (!user) { alert("Please log in to analyse your resume!"); if(requireLogin) requireLogin(); return; }
    
    if (!file) return alert("Please select a file first!");
    setAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("http://localhost:5000/analyze", { method: "POST", body: formData });
      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
        setActiveSection('overview');
        setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);

        try {
          const statsRef = doc(db, 'system_stats', 'overview');
          const updates = { totalResumes: increment(1), atsScans: increment(1) };
          if (result.fraud_count > 0) updates.fraudDetections = increment(1);
          await setDoc(statsRef, updates, { merge: true });
          const userEmail = auth.currentUser?.email || 'Anonymous User';
          await addDoc(collection(db, 'recent_activity'), {
            type:'ats', action:'ATS scan completed', email:userEmail,
            time:'Just now', timestamp:serverTimestamp()
          });
          const currentUser = auth.currentUser;
          await trackFeatureUsage('ATS Scorer');
          await logActivity('ats', 'ATS scan completed', currentUser?.email || 'Anonymous User');
          await updateSystemStats('ats_scan');
        } catch(dbError){ console.error("Non-critical analytics error:", dbError); }
      } else {
        alert("Error analysing resume. Is the Flask server running?");
      }
    } catch(error){
      alert("Error: Backend connection failed. Ensure Flask is running on port 5000.");
    }
    setAnalyzing(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setFile(f);
    else alert("Only PDF files are accepted.");
  };

  const dims = analysis?.dimensions || {};
  const grade = analysis?.grade || {};
  const suggestions = analysis?.suggestions || [];
  const highPrio = suggestions.filter(s => s.priority === 'high');
  const midPrio  = suggestions.filter(s => s.priority === 'medium');
  const lowPrio  = suggestions.filter(s => s.priority === 'low');

  const NAV_TABS = [
    { key:'overview',   label:'Overview',    icon:<BarChart2 size={14}/> },
    { key:'dimensions', label:'Dimensions',  icon:<Target size={14}/> },
    { key:'suggestions',label:'Suggestions', icon:<Zap size={14}/>, badge: highPrio.length > 0 ? highPrio.length : null },
    { key:'skills',     label:'Skills',      icon:<Code2 size={14}/> },
    { key:'terminal',   label:'Raw Parse',   icon:<Terminal size={14}/> },
  ];

  return (
    <>
      <style>{FONT_CSS}</style>

      <div className="ats-bg min-h-screen">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-12">

          {/* ══ HERO ══════════════════════════════════════════════ */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-100 border border-indigo-200 rounded-full px-4 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 tag-pulse"/>
              <span className="text-indigo-600 text-xs font-bold uppercase tracking-widest">10-Dimension Scoring Engine</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight">
              Enterprise<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">ATS Scorer</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto italic leading-relaxed">
              Industry-standard resume analysis benchmarked against Jobscan, Teal, Greenhouse, Workday, and Taleo ATS systems. 100-point scoring across 10 weighted dimensions.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-2">
              {[["10","Scoring Dimensions"],["100","Point Scale"],["Jobscan-Level","Accuracy"],["<5s","Analysis Time"]].map(([v,l],i)=>(
                <div key={i} className="text-center">
                  <div className="font-black text-slate-900 text-xl">{v}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ UPLOAD ════════════════════════════════════════════ */}
          <div className="max-w-2xl mx-auto">
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all duration-300
                ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'}`}
            >
              <input type="file" accept=".pdf" onChange={e=>setFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"/>
              <div className="p-10 text-center">
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all border ${file ? 'bg-green-50 border-green-300' : 'bg-slate-100 border-slate-200'}`}>
                  {file ? <CheckCircle size={28} className="text-green-500"/> : <Upload size={28} className="text-slate-400"/>}
                </div>
                {file ? (
                  <>
                    <p className="font-bold text-green-700 text-sm mb-1">{file.name}</p>
                    <p className="text-slate-400 text-xs">{(file.size / 1024).toFixed(1)} KB · Click Analyse to continue</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-slate-600 text-base mb-1">Drop your resume PDF here</p>
                    <p className="text-slate-400 text-xs">or click to browse · PDF only · max 5MB</p>
                  </>
                )}
              </div>
            </div>

            <button onClick={handleUpload} disabled={analyzing}
              className={`w-full mt-4 py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all
                ${analyzing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:-translate-y-0.5'}`}>
              {analyzing
                ? <><div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"/> Running ATS Pipeline...</>
                : <><Brain size={18}/> Analyse Resume — Get ATS Score</>}
            </button>

            {analyzing && (
              <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
                {["Extracting text from PDF...","Scanning 10 scoring dimensions...","Detecting keywords across 100+ skills...","Analysing action verbs and metrics...","Computing industry-standard score..."].map((msg,i)=>(
                  <div key={i} className="flex items-center gap-2.5 mb-1.5 reveal" style={{animationDelay:`${i*0.2}s`}}>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse flex-shrink-0"/>
                    <span className="text-xs text-slate-500">{msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══ REPORT ════════════════════════════════════════════ */}
          {analysis && (
            <div ref={reportRef} className="space-y-8">

              {/* Score Hero */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-8 p-8">
                  <ScoreRing score={analysis.ats_score} grade={analysis.grade}/>
                  <div className="flex-1 text-center md:text-left">
                    <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">
                      Scan Complete — {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">{analysis.grade?.label} Resume</h2>
                    <p className="text-slate-500 text-sm italic leading-relaxed max-w-md">{analysis.grade?.desc}</p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {[
                        { label:"ATS Score",    val:`${analysis.ats_score}/100`, color:"text-indigo-600" },
                        { label:"Grade",        val:analysis.grade?.grade, color:"text-purple-600" },
                        { label:"Pages",        val:`${analysis.pages || '—'}`, color:"text-slate-700" },
                        { label:"Words",        val:`${analysis.word_count || '—'}`, color:"text-slate-700" },
                        { label:"Skills Found", val:`${analysis.skills_detected?.length || 0}`, color:"text-cyan-600" },
                        { label:"Fixes Needed", val:`${highPrio.length} high / ${midPrio.length} med`, color:highPrio.length>0?"text-red-500":"text-green-600" },
                      ].map((m,i)=>(
                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                          <div className="text-[9px] text-slate-400 uppercase tracking-widest">{m.label}</div>
                          <div className={`font-black text-base ${m.color}`}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nav tabs */}
                <div className="border-t border-slate-100 px-8 flex gap-1 overflow-x-auto pb-0">
                  {NAV_TABS.map(t=>(
                    <button key={t.key} onClick={()=>setActiveSection(t.key)}
                      className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold uppercase tracking-wide border-b-2 transition-all whitespace-nowrap
                        ${activeSection===t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                      {t.icon} {t.label}
                      {t.badge && <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">{t.badge}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── TAB: OVERVIEW ──────────────────────────────── */}
              {activeSection === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quick wins */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 md:col-span-2">
                    <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                      <Zap size={16} className="text-amber-500"/> Top 5 Quick Wins
                    </h3>
                    <div className="space-y-3">
                      {suggestions.slice(0,5).map((s,i)=>{
                        const pc=PRIORITY_CONFIG[s.priority]||PRIORITY_CONFIG.medium;
                        return (
                          <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${pc.bg} ${pc.border}`}>
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${pc.dot}`}/>
                            <div>
                              <p className={`font-bold text-xs ${pc.text}`}>{s.title}</p>
                              <p className={`text-[10px] mt-0.5 ${pc.text} opacity-75`}>{s.impact} potential</p>
                            </div>
                          </div>
                        );
                      })}
                      {suggestions.length===0 && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                          <CheckCircle size={20} className="text-green-500"/>
                          <p className="font-bold text-green-700 text-sm">Outstanding — no critical issues found!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fraud quick-check */}
                  <div className={`rounded-2xl border p-6 ${analysis.fraud_detection==='Flagged'?'bg-red-50 border-red-200':'bg-green-50 border-green-200'}`}>
                    <h3 className="font-black text-sm mb-3 flex items-center gap-2 text-slate-800">
                      <Shield size={16} className={analysis.fraud_detection==='Flagged'?'text-red-500':'text-green-500'}/>
                      Fraud Scan Result
                    </h3>
                    {analysis.fraud_detection==='Flagged'
                      ? <><p className="text-sm text-red-700 italic">{analysis.fraud_count} suspicious pattern(s) found. Check the Fraud Detector page for full details.</p></>
                      : <p className="text-sm text-green-700 italic">No suspicious patterns detected. Resume authenticity verified.</p>}
                  </div>

                  {/* Benchmarks */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                      <Award size={16} className="text-purple-500"/> Industry Benchmarks
                    </h3>
                    <div className="space-y-2.5">
                      {[
                        {label:"Jobscan Pass Threshold",     val:70, color:"bg-blue-500"},
                        {label:"Greenhouse Competitive",     val:75, color:"bg-indigo-500"},
                        {label:"Workday Top Candidate",      val:80, color:"bg-purple-500"},
                        {label:"Top 10% of Submissions",     val:88, color:"bg-green-500"},
                      ].map((bm,i)=>(
                        <div key={i}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-500">{bm.label}</span>
                            <span className={`font-bold ${analysis.ats_score >= bm.val ? 'text-green-600' : 'text-red-500'}`}>
                              {analysis.ats_score >= bm.val ? '✓ Pass' : `Need +${bm.val - analysis.ats_score}`}
                            </span>
                          </div>
                          <div className="relative h-1.5 bg-slate-100 rounded-full">
                            <div className={`h-full rounded-full ${bm.color}`} style={{width:`${bm.val}%`}}/>
                            <div className="absolute top-0 h-full flex items-center" style={{left:`${Math.min(analysis.ats_score,100)}%`}}>
                              <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow -translate-x-1/2 ${analysis.ats_score >= bm.val ? 'bg-green-500' : 'bg-red-400'}`}/>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB: DIMENSIONS ────────────────────────────── */}
              {activeSection === 'dimensions' && (
                <div className="space-y-3">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 mb-4">
                    <p className="text-sm text-indigo-700 italic">Click any dimension to expand detailed analysis. All 10 dimensions are weighted to reflect real ATS scoring logic.</p>
                  </div>
                  {Object.entries(dims).map(([k, d], i) => (
                    <DimRow key={k} dimKey={k} dim={d} delay={i * 0.05}/>
                  ))}
                </div>
              )}

              {/* ─── TAB: SUGGESTIONS ───────────────────────────── */}
              {activeSection === 'suggestions' && (
                <div className="space-y-8">
                  {highPrio.length > 0 && (
                    <div>
                      <h3 className="font-black text-red-600 text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                        <XCircle size={16}/> High Impact — Fix These First ({highPrio.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {highPrio.map((s,i)=><SuggestionCard key={i} s={s} idx={i}/>)}
                      </div>
                    </div>
                  )}
                  {midPrio.length > 0 && (
                    <div>
                      <h3 className="font-black text-amber-600 text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertTriangle size={16}/> Medium Priority ({midPrio.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {midPrio.map((s,i)=><SuggestionCard key={i} s={s} idx={i}/>)}
                      </div>
                    </div>
                  )}
                  {lowPrio.length > 0 && (
                    <div>
                      <h3 className="font-black text-blue-600 text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Info size={16}/> Polish & Refinements ({lowPrio.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lowPrio.map((s,i)=><SuggestionCard key={i} s={s} idx={i}/>)}
                      </div>
                    </div>
                  )}
                  {suggestions.length === 0 && (
                    <div className="flex items-center gap-5 p-8 bg-green-50 border border-green-200 rounded-2xl">
                      <CheckCircle size={36} className="text-green-500 flex-shrink-0"/>
                      <div>
                        <p className="font-black text-green-800 text-lg">Perfect Execution!</p>
                        <p className="text-sm text-green-600 italic mt-1">Your resume is fully optimised across all 10 ATS dimensions. No improvements needed.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB: SKILLS ────────────────────────────────── */}
              {activeSection === 'skills' && (
                <div className="space-y-6">
                  {/* Core skills */}
                  {analysis.tier1_skills?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <h3 className="font-black text-slate-800 text-sm mb-1 flex items-center gap-2">
                        <Code2 size={16} className="text-indigo-500"/> Core Technical Skills
                        <span className="text-xs text-slate-400 font-normal">({analysis.tier1_skills.length} found — highest ATS weight)</span>
                      </h3>
                      <p className="text-xs text-slate-400 italic mb-4">These are Tier-1 skills with maximum ATS keyword weight. Each match significantly improves your score.</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.tier1_skills.map((s,i)=>(
                          <span key={i} className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold">
                            <CheckCircle size={10}/> {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Domain skills */}
                  {analysis.tier2_skills?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <h3 className="font-black text-slate-800 text-sm mb-1 flex items-center gap-2">
                        <Star size={16} className="text-purple-500"/> Domain & Tool Skills
                        <span className="text-xs text-slate-400 font-normal">({analysis.tier2_skills.length} found)</span>
                      </h3>
                      <p className="text-xs text-slate-400 italic mb-4">Tier-2 skills supporting your domain expertise. Important for role-specific ATS filters.</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.tier2_skills.map((s,i)=>(
                          <span key={i} className="bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-xl text-xs font-bold">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Soft skills */}
                  {dims.soft_skills?.found?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                        <Star size={16} className="text-orange-500"/> Soft Skills Detected ({dims.soft_skills.found.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {dims.soft_skills.found.map((s,i)=>(
                          <span key={i} className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-xl text-xs font-bold">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* All skills combined */}
                  {analysis.skills_detected?.length === 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                      <AlertTriangle size={32} className="text-red-400 mx-auto mb-3"/>
                      <p className="font-black text-red-700">No Skills Detected</p>
                      <p className="text-sm text-red-600 mt-1 italic">Critical issue. Add a dedicated Skills section with specific technologies, tools, and domain expertise.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB: RAW PARSE ─────────────────────────────── */}
              {activeSection === 'terminal' && (
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                  <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-bold flex items-center gap-2">
                      <Terminal size={18} className="text-green-400"/> ATS Raw Parse Output
                    </h3>
                    <span className="text-xs text-slate-400">{analysis.word_count} words extracted</span>
                  </div>
                  <div className="p-4 bg-slate-900/80 mb-3 mx-4 mt-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-green-400">// </span>This is exactly what the ATS database receives when parsing your PDF.<br/>
                      <span className="text-green-400">// </span>Check for: scrambled words, missing spaces, broken contact info, or lost section headers.<br/>
                      <span className="text-green-400">// </span>If text looks garbled here, your PDF is not ATS-readable.
                    </p>
                  </div>
                  <div className="p-6 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-green-400 leading-relaxed whitespace-pre-wrap">{analysis.parsed_text}</pre>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ══ ATS GUIDE (always visible) ═══════════════════════ */}
          <div>
            <div className="text-center mb-8">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Knowledge Base</div>
              <h2 className="text-3xl font-black text-slate-900">How to Build a Perfect ATS Resume</h2>
              <p className="text-slate-500 text-sm italic mt-2 max-w-xl mx-auto">
                Eight rules used by top candidates at FAANG, consulting firms, and Fortune 500 companies.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ATS_GUIDE.map((item, i) => <GuideCard key={i} item={item} idx={i}/>)}
            </div>
          </div>

          {/* ══ PLATFORM COMPARISON ════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
              <BarChart2 size={20} className="text-indigo-500"/> How We Compare to Other ATS Platforms
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-[11px] text-slate-400 uppercase tracking-widest">Feature</th>
                    {["This Tool","Jobscan","Resume.io","Teal"].map(p=>(
                      <th key={p} className={`text-center py-3 px-4 text-[11px] uppercase tracking-widest ${p==="This Tool"?"text-indigo-600":"text-slate-400"}`}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Scoring Dimensions",        "10", "8","5","6"],
                    ["Keyword Tier Weighting",     "✓",  "✓","✗","✗"],
                    ["Action Verb Analysis",       "✓",  "✓","✗","✓"],
                    ["Fraud Detection",            "✓",  "✗","✗","✗"],
                    ["Formatting Parseability",    "✓",  "✓","✓","✓"],
                    ["ATS Platform Benchmarks",    "✓",  "✓","✗","✗"],
                    ["Raw Text Parse View",        "✓",  "✗","✗","✗"],
                    ["Soft Skill Detection",       "✓",  "✗","✗","✓"],
                    ["Education Signal Scoring",   "✓",  "✗","✓","✓"],
                    ["Free to Use",                "✓",  "✗","✗","✓"],
                  ].map((row,i)=>(
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      {row.map((cell,j)=>(
                        <td key={j} className={`py-2.5 px-4 ${j===0?'text-sm text-slate-700':'text-center text-sm'} ${j>0&&cell==='✓'?'text-green-500 font-bold':''} ${j>0&&cell==='✗'?'text-slate-300':''} ${j===1?'font-black text-indigo-600':''}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══ FOOTER DISCLAIMER ════════════════════════════════ */}
          <p className="text-xs text-slate-400 text-center pb-6 leading-relaxed">
            ATS scores are calculated using industry-standard heuristics and may vary from scores generated by specific employer ATS platforms. Use this as a guide, not a guarantee.
          </p>

        </div>
      </div>
    </>
  );
};

export default AtsScorer;