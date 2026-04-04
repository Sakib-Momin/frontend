// src/components/JobMatcher.js
import React, { useState, useRef } from 'react';
import {
  Search, Upload, Target, Brain, Zap, Layout, ArrowRight,
  CheckCircle, XCircle, AlertTriangle, Info, ChevronDown,
  ChevronUp, FileText, User, BookOpen, Award, Star,
  BarChart2, Code2, Shield, TrendingUp, Eye, Hash,
  Briefcase, Clock, AlertCircle, CheckSquare,
} from 'lucide-react';

import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { trackFeatureUsage, logActivity } from '../utils/analytics';

// ─── STYLES ──────────────────────────────────────────
const FONT_CSS = `
  .jm-bg {
    background:
      radial-gradient(ellipse 60% 40% at 10% 0%, rgba(79,70,229,0.10) 0%, transparent 60%),
      radial-gradient(ellipse 50% 30% at 90% 90%, rgba(16,185,129,0.06) 0%, transparent 50%),
      #f8fafc;
  }
  .score-ring { transition: stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1); }
  .reveal { animation: revealUp 0.45s ease both; }
  @keyframes revealUp { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
  .bar-fill { transition: width 1s cubic-bezier(.4,0,.2,1); }
  .pulse-dot { animation: pdot 2s ease-in-out infinite; }
  @keyframes pdot { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
`;

// ─── CONFIGS ──────────────────────────────────────────────
const GRADE_CFG = {
  "A+":{ ring:"#22c55e", badge:"bg-green-500", bg:"bg-green-50", border:"border-green-200", text:"text-green-700" },
  "A": { ring:"#22c55e", badge:"bg-green-500", bg:"bg-green-50", border:"border-green-200", text:"text-green-700" },
  "B+":{ ring:"#3b82f6", badge:"bg-blue-500",  bg:"bg-blue-50",  border:"border-blue-200",  text:"text-blue-700" },
  "B": { ring:"#3b82f6", badge:"bg-blue-500",  bg:"bg-blue-50",  border:"border-blue-200",  text:"text-blue-700" },
  "C": { ring:"#f59e0b", badge:"bg-amber-500", bg:"bg-amber-50", border:"border-amber-200", text:"text-amber-700"},
  "D": { ring:"#ef4444", badge:"bg-red-500",   bg:"bg-red-50",   border:"border-red-200",   text:"text-red-700"  },
};

const ISSUE_CFG = {
  critical:{ bg:"bg-red-50",   border:"border-red-200",   text:"text-red-700",   dot:"bg-red-500",   label:"Critical" },
  high:    { bg:"bg-red-50",   border:"border-red-200",   text:"text-red-700",   dot:"bg-red-400",   label:"High"     },
  medium:  { bg:"bg-amber-50", border:"border-amber-200", text:"text-amber-700", dot:"bg-amber-500", label:"Medium"   },
  low:     { bg:"bg-blue-50",  border:"border-blue-200",  text:"text-blue-700",  dot:"bg-blue-400",  label:"Low"      },
};

const SUGG_CFG = {
  critical:{ bg:"bg-red-50",   border:"border-red-200",   text:"text-red-700",   badge:"bg-red-500"   },
  high:    { bg:"bg-amber-50", border:"border-amber-200", text:"text-amber-800", badge:"bg-amber-500" },
  medium:  { bg:"bg-blue-50",  border:"border-blue-200",  text:"text-blue-700",  badge:"bg-blue-500"  },
  low:     { bg:"bg-slate-50", border:"border-slate-200", text:"text-slate-700", badge:"bg-slate-400" },
};

const DIM_ICONS = {
  skills:      <Code2 size={15} className="text-indigo-500"/>,
  semantic:    <Brain size={15} className="text-purple-500"/>,
  experience:  <Briefcase size={15} className="text-amber-500"/>,
  education:   <BookOpen size={15} className="text-cyan-500"/>,
  achievement: <Hash size={15} className="text-green-500"/>,
  language:    <Eye size={15} className="text-rose-500"/>,
  cultural_fit:<Star size={15} className="text-orange-500"/>,
};

// ── HOW IT WORKS steps ──────────────────────────────────────
const HOW_IT_WORKS = [
  { step:"01", title:"JD Deep Parse", color:"text-indigo-600 bg-indigo-50 border-indigo-200",
    desc:"We extract every required and preferred skill, seniority level, years of experience, education requirement, domain, and soft skills from your job description using NLP." },
  { step:"02", title:"Resume Profiling", color:"text-purple-600 bg-purple-50 border-purple-200",
    desc:"Your resume is scanned for 100+ technical skills (in 2 tiers), experience timeline, seniority signals, education level, quantified achievements, and vocabulary domain." },
  { step:"03", title:"7-Dimension Scoring", color:"text-cyan-600 bg-cyan-50 border-cyan-200",
    desc:"Both profiles are compared across 7 dimensions: Skill Match (30pts), Semantic Relevance (20pts), Experience (15pts), Education (10pts), Achievements (10pts), Language Mirror (10pts), Cultural Fit (5pts)." },
  { step:"04", title:"Gap Analysis", color:"text-amber-600 bg-amber-50 border-amber-200",
    desc:"Every mismatch — missing skills, experience gaps, language gaps, domain misalignment — is identified with specific actionable fixes rather than generic advice." },
  { step:"05", title:"Tailored Report", color:"text-green-600 bg-green-50 border-green-200",
    desc:"You receive a prioritised list of changes ranked by score impact, specific rewrite examples, and JD-specific language suggestions to maximise your match score." },
];

// ── Tips for accurate matching ───────────────────────────────
const MATCH_TIPS = [
  { icon:<FileText size={18} className="text-indigo-500"/>, title:"Use the Full JD — Not Just the Title",
    body:"Paste the complete job description including responsibilities, requirements, and 'nice to haves'. Our engine extracts 40+ signals from the full text. Titles alone score 60% less accurately." },
  { icon:<Code2 size={18} className="text-cyan-500"/>, title:"Tailor Per Application, Not Once",
    body:"The same resume rarely scores above 70% for two different JDs. Each company uses different terminology for the same skills. Match score improves 15–25pts with per-role tailoring." },
  { icon:<Eye size={18} className="text-purple-500"/>, title:"Mirror Exact JD Spelling",
    body:"'NodeJS' and 'Node.js' are different strings to ATS. Use the exact spelling from the JD. Check our Language Mirror dimension to see which phrases you're missing." },
  { icon:<Hash size={18} className="text-green-500"/>, title:"Quantify Before You Match",
    body:"Run the ATS Scorer on your resume first. Achieve 6+ metrics in your resume before matching. Achievement Quality is 10% of the match score and directly affects recruiter engagement." },
  { icon:<User size={18} className="text-amber-500"/>, title:"Match Seniority Level Consciously",
    body:"Applying for senior roles with junior-level language costs you 5–10pts. Conversely, over-qualifying for junior roles can also reduce your score. Match your language to the JD level." },
  { icon:<Award size={18} className="text-rose-500"/>, title:"80+ Score Before Applying",
    body:"Data from Jobscan shows candidates with 80%+ match scores are 3× more likely to get interviews. If you're below 70%, spend 30 mins tailoring before submitting." },
];

// ─── COMPONENTS ─────────────────────────────────────────────

function ScoreRing({ score, grade }) {
  const r = 68, circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const gc = GRADE_CFG[grade?.grade] || GRADE_CFG["C"];
  return (
    <div className="flex flex-col items-center">
      <svg width="164" height="164" viewBox="0 0 164 164">
        <circle cx="82" cy="82" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12"/>
        <circle cx="82" cy="82" r={r} fill="none" stroke={gc.ring} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={circ - pct*circ}
          strokeLinecap="round" transform="rotate(-90 82 82)" className="score-ring"/>
        <text x="82" y="76" textAnchor="middle" fill="#0f172a" fontSize="32"
          fontWeight="800">{score}</text>
        <text x="82" y="94" textAnchor="middle" fill="#94a3b8" fontSize="10"
          fontWeight="600">MATCH SCORE</text>
      </svg>
      <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black mt-1 ${gc.bg} ${gc.border} ${gc.text} border`}>
        <span>{grade?.grade}</span>
        <span className="opacity-50">·</span>
        <span className="text-xs">{grade?.label}</span>
      </div>
    </div>
  );
}

function DimBar({ dimKey, dim, delay=0 }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((dim.score/dim.max)*100);
  const col = pct>=75?'bg-green-500':pct>=50?'bg-amber-400':'bg-red-400';
  const txt = pct>=75?'text-green-600':pct>=50?'text-amber-500':'text-red-500';
  return (
    <div className="reveal border border-slate-200 rounded-xl bg-white overflow-hidden hover:border-indigo-300 transition-all"
      style={{animationDelay:`${delay}s`}}>
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
          {DIM_ICONS[dimKey]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-slate-800 text-sm">{dim.label}</span>
            <span className={`text-sm font-black ${txt}`}>{dim.score}/{dim.max}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full bar-fill ${col}`} style={{width:`${pct}%`}}/>
          </div>
        </div>
        <div className="ml-2">{open?<ChevronUp size={14} className="text-slate-400"/>:<ChevronDown size={14} className="text-slate-400"/>}</div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50">
          <p className="text-sm text-slate-600 italic mb-3">{dim.detail}</p>

          {dimKey==='skills' && (
            <div className="space-y-3">
              {dim.matched_required?.length>0 && (
                <div>
                  <p className="text-[10px] text-green-600 uppercase tracking-widest mb-1.5">✓ Matched Required ({dim.matched_required.length})</p>
                  <div className="flex flex-wrap gap-1.5">{dim.matched_required.map(s=><span key={s} className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-md font-bold">{s}</span>)}</div>
                </div>
              )}
              {dim.missing_required?.length>0 && (
                <div>
                  <p className="text-[10px] text-red-500 uppercase tracking-widest mb-1.5">✗ Missing Required ({dim.missing_required.length})</p>
                  <div className="flex flex-wrap gap-1.5">{dim.missing_required.map(s=><span key={s} className="text-[10px] bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-md font-bold">{s}</span>)}</div>
                </div>
              )}
              {dim.matched_preferred?.length>0 && (
                <div>
                  <p className="text-[10px] text-blue-500 uppercase tracking-widest mb-1.5">◎ Matched Preferred ({dim.matched_preferred.length})</p>
                  <div className="flex flex-wrap gap-1.5">{dim.matched_preferred.map(s=><span key={s} className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md font-bold">{s}</span>)}</div>
                </div>
              )}
            </div>
          )}
          {dimKey==='semantic' && (
            <div className="grid grid-cols-3 gap-2">
              {[["JD Domains",dim.jd_domains,"indigo"],["Resume Domains",dim.res_domains,"purple"],["Matched",dim.matching_domains,"green"]].map(([label,items,c])=>(
                <div key={label} className={`p-2.5 rounded-lg bg-${c}-50 border border-${c}-200`}>
                  <p className={`text-[9px] text-${c}-600 uppercase tracking-widest mb-1`}>{label}</p>
                  <div className="flex flex-wrap gap-1">{(items||[]).map(d=><span key={d} className={`text-[9px] font-bold text-${c}-700`}>{d}</span>)}</div>
                  {(!items||items.length===0)&&<span className="text-[9px] text-slate-400">—</span>}
                </div>
              ))}
            </div>
          )}
          {dimKey==='experience' && (
            <div className="space-y-1.5">
              {dim.issues?.map((issue,i)=>(
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${issue.startsWith('✓')?'bg-green-50 border border-green-200 text-green-700':'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                  <span className="leading-relaxed">{issue}</span>
                </div>
              ))}
            </div>
          )}
          {dimKey==='achievement' && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(dim.metric_breakdown||{}).map(([k,v])=>(
                <div key={k} className={`text-center p-2 rounded-lg border ${v>0?'bg-green-50 border-green-200':'bg-slate-100 border-slate-200'}`}>
                  <div className={`font-black text-lg ${v>0?'text-green-600':'text-slate-400'}`}>{v}</div>
                  <div className="text-[9px] text-slate-500 uppercase">{k.replace('_',' ')}</div>
                </div>
              ))}
            </div>
          )}
          {dimKey==='language' && (
            <div className="space-y-2">
              {dim.matched_phrases?.length>0&&(
                <div>
                  <p className="text-[10px] text-green-600 uppercase tracking-widest mb-1.5">Mirrored Phrases</p>
                  <div className="flex flex-wrap gap-1.5">{dim.matched_phrases.map(p=><span key={p} className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-md">{p}</span>)}</div>
                </div>
              )}
              {dim.missing_phrases?.length>0&&(
                <div>
                  <p className="text-[10px] text-amber-600 uppercase tracking-widest mb-1.5">Add These JD Phrases</p>
                  <div className="flex flex-wrap gap-1.5">{dim.missing_phrases.map(p=><span key={p} className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-md">{p}</span>)}</div>
                </div>
              )}
            </div>
          )}
          {dimKey==='cultural_fit' && (
            <div className="space-y-2">
              {dim.matched_soft?.length>0&&(
                <div>
                  <p className="text-[10px] text-green-600 uppercase tracking-widest mb-1.5">Matched Soft Skills</p>
                  <div className="flex flex-wrap gap-1.5">{dim.matched_soft.map(s=><span key={s} className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-md">{s}</span>)}</div>
                </div>
              )}
              {dim.missing_soft?.length>0&&(
                <div>
                  <p className="text-[10px] text-amber-600 uppercase tracking-widest mb-1.5">Missing from JD</p>
                  <div className="flex flex-wrap gap-1.5">{dim.missing_soft.map(s=><span key={s} className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-md">{s}</span>)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IssueCard({ issue, idx }) {
  const cfg = ISSUE_CFG[issue.severity] || ISSUE_CFG.medium;
  return (
    <div className={`p-5 rounded-2xl border ${cfg.bg} ${cfg.border} reveal`} style={{animationDelay:`${idx*0.07}s`}}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`}/>
          <span className={`font-black text-sm ${cfg.text}`}>{issue.title}</span>
        </div>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full text-white flex-shrink-0 ${cfg.dot}`}>{cfg.label}</span>
      </div>
      <p className={`text-sm leading-relaxed ${cfg.text} opacity-90 mb-2`}>{issue.detail}</p>
      {issue.fix && (
        <div className="flex items-start gap-2 bg-white/60 rounded-xl p-3 border border-white/80">
          <ArrowRight size={12} className={`flex-shrink-0 mt-0.5 ${cfg.text}`}/>
          <p className={`text-xs leading-relaxed ${cfg.text}`}><strong>Fix:</strong> {issue.fix}</p>
        </div>
      )}
    </div>
  );
}

function SuggCard({ s, idx }) {
  const cfg = SUGG_CFG[s.priority] || SUGG_CFG.medium;
  return (
    <div className={`p-5 rounded-2xl border ${cfg.bg} ${cfg.border} reveal`} style={{animationDelay:`${idx*0.06}s`}}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`font-black text-sm ${cfg.text}`}>{s.title}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full text-white ${cfg.badge}`}>{s.priority}</span>
          <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{s.impact}</span>
        </div>
      </div>
      <p className={`text-sm leading-relaxed ${cfg.text} opacity-85 mb-3`}>{s.detail}</p>
      {s.example && (
        <div className="flex items-start gap-2 bg-slate-900/5 rounded-xl p-3 border border-slate-200">
          <CheckSquare size={12} className="text-slate-500 flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-slate-600 leading-relaxed"><strong>Example:</strong> {s.example}</p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
const JobMatcher = ({ user, requireLogin, onBuildResume }) => {
  const [file, setFile]             = useState(null);
  const [jdText, setJdText]         = useState("");
  const [analyzing, setAnalyzing]   = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const [activeTab, setActiveTab]   = useState('overview');
  const reportRef = useRef(null);

  const handleJobMatch = async () => {
    // ==========================================
    // 🔐 AUTH WALL INTERCEPTOR
    // ==========================================
    if (!user) {
      alert("Please log in or create an account to use the Job Matcher!");
      if (requireLogin) requireLogin();
      return; 
    }
    // ==========================================

    if (!file || !jdText.trim()) return alert("Please upload a resume AND paste a job description!");
    if (jdText.trim().split(/\s+/).length < 30) return alert("Job description seems too short. Please paste the full JD for accurate results.");
    
    setAnalyzing(true);
    const matchData = new FormData();
    matchData.append("file", file);
    matchData.append("jd_text", jdText);
    
    try {
      const response = await fetch("http://localhost:5000/match", { method:"POST", body:matchData });
      if (response.ok) {
        const data = await response.json();
        setMatchResult(data);
        setActiveTab('overview');
        setTimeout(()=>reportRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),200);
        try {
          const userEmail = auth.currentUser?.email || 'Anonymous User';
          await addDoc(collection(db,'recent_activity'),{
            type:'resume', action:'Job match completed',
            email:userEmail, time:'Just now', timestamp:serverTimestamp()
          });
          const currentUser = auth.currentUser;
          await trackFeatureUsage('Job Matcher');
          await logActivity('user','Job match completed', currentUser?.email||'Anonymous User');
        } catch(dbError){ console.error("Non-critical analytics error:", dbError); }
      } else {
        alert("Failed to analyse match. Is Flask running on port 5000?");
      }
    } catch(error){
      alert("Error: Backend connection failed.");
    }
    setAnalyzing(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type==='application/pdf') setFile(f);
  };

  const r = matchResult;
  const dims = r?.dimensions || {};
  const issues = r?.issues || [];
  const suggestions = r?.suggestions || [];
  const jdAnalysis = r?.jd_analysis || {};
  const resumeAnalysis = r?.resume_analysis || {};
  const grade = r?.grade || {};
  const criticalIssues = issues.filter(i=>i.severity==='critical'||i.severity==='high');
  const medLowIssues   = issues.filter(i=>i.severity==='medium'||i.severity==='low');

  const TABS = [
    {key:'overview',    label:'Overview',    icon:<BarChart2 size={13}/>},
    {key:'dimensions',  label:'7 Dimensions',icon:<Target size={13}/>},
    {key:'issues',      label:'Issues',      icon:<AlertCircle size={13}/>, badge:criticalIssues.length||null},
    {key:'suggestions', label:'Suggestions', icon:<Zap size={13}/>},
    {key:'jd',          label:'JD Analysis', icon:<Search size={13}/>},
    {key:'skills',      label:'Skills Map',  icon:<Code2 size={13}/>},
  ];

  return (
    <>
      <style>{FONT_CSS}</style>
      <div className="jm-bg min-h-screen text-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-14">

          {/* ══ HERO ══════════════════════════════════════════ */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-100 border border-indigo-200 rounded-full px-4 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 pulse-dot"/>
              <span className="text-indigo-600 text-xs font-bold uppercase tracking-widest">7-Dimension Matching Engine</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight">
              AI Job<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">Matcher</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto italic leading-relaxed">
              Industrial-grade resume ↔ job description analysis. Seven weighted dimensions, specific gap identification, and tailored rewrite suggestions — not generic advice.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-2">
              {[["7","Scoring Dimensions"],["100","Point Scale"],["JD-Specific","Suggestions"],["<5s","Analysis"]].map(([v,l],i)=>(
                <div key={i} className="text-center">
                  <div className="font-black text-slate-900 text-xl">{v}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ INPUT ═════════════════════════════════════════ */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                <Upload size={20} className="text-indigo-500"/> Upload Resume + Paste Job Description
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resume upload */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2 font-bold">Resume PDF</label>
                  <div
                    onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                    onDragLeave={()=>setDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all
                      ${dragOver?'border-indigo-400 bg-indigo-50':'border-slate-300 bg-slate-50 hover:border-indigo-300'}`}
                  >
                    <input type="file" accept=".pdf" onChange={e=>setFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center border ${file?'bg-green-50 border-green-300':'bg-white border-slate-200'}`}>
                      {file?<CheckCircle size={24} className="text-green-500"/>:<Upload size={24} className="text-slate-400"/>}
                    </div>
                    {file
                      ?<><p className="font-bold text-green-700 text-sm">{file.name}</p><p className="text-xs text-slate-400 mt-0.5">{(file.size/1024).toFixed(1)} KB</p></>
                      :<><p className="font-bold text-slate-600 text-sm">Drop PDF here</p><p className="text-xs text-slate-400">or click to browse</p></>}
                  </div>
                </div>
                {/* JD paste */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2 font-bold">
                    Job Description <span className="text-indigo-500">(paste full text for best results)</span>
                  </label>
                  <textarea
                    className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 outline-none font-medium resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all text-sm text-slate-700 h-40"
                    placeholder={"Paste the complete job description here...\n\nInclude: responsibilities, requirements, nice-to-haves, and company description for the most accurate analysis."}
                    value={jdText}
                    onChange={e=>setJdText(e.target.value)}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-400">{jdText.trim().split(/\s+/).filter(Boolean).length} words pasted</span>
                    {jdText.trim().split(/\s+/).length < 50 && jdText.length > 0
                      && <span className="text-[10px] text-amber-500 font-bold">⚠ Too short — paste the full JD</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <button onClick={handleJobMatch} disabled={analyzing}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all
                  ${analyzing?'bg-slate-200 text-slate-400 cursor-not-allowed':'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:-translate-y-0.5'}`}>
                {analyzing
                  ?<><div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"/>Running Match Algorithm...</>
                  :<><Brain size={18}/> Calculate Match Score — Full Analysis</>}
              </button>
              {analyzing && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {["Parsing job description requirements...","Profiling resume skills and experience...","Running 7-dimension scoring engine...","Detecting skill gaps and mismatches...","Generating tailored suggestions...","Compiling match report..."].map((msg,i)=>(
                    <div key={i} className="flex items-center gap-2 reveal" style={{animationDelay:`${i*0.18}s`}}>
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse flex-shrink-0"/>
                      <span className="text-xs text-slate-500">{msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ══ REPORT ════════════════════════════════════════ */}
          {r && (
            <div ref={reportRef} className="space-y-8">

              {/* Score hero */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-8 p-8">
                  <ScoreRing score={r.match_score} grade={r.grade}/>
                  <div className="flex-1 text-center md:text-left">
                    <div className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-bold">
                      Match Report — {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">{grade.label}</h2>
                    <p className="text-slate-500 text-sm italic leading-relaxed max-w-md">{grade.desc}</p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {[
                        {label:"Match Score",   val:`${r.match_score}/100`, color:"text-indigo-600"},
                        {label:"Grade",         val:grade.grade, color:"text-purple-600"},
                        {label:"Required Skills Matched", val:`${dims.skills?.matched_required?.length||0}/${(dims.skills?.matched_required?.length||0)+(dims.skills?.missing_required?.length||0)}`, color:"text-cyan-600"},
                        {label:"Issues Found",  val:`${criticalIssues.length} high`, color:criticalIssues.length>0?"text-red-500":"text-green-600"},
                        {label:"Resume Exp",    val:`~${resumeAnalysis.exp_years||0} yrs`, color:"text-amber-600"},
                        {label:"JD Requires",   val:`${jdAnalysis.min_years||0}+ yrs (${jdAnalysis.seniority||'—'})`, color:"text-slate-600"},
                      ].map((m,i)=>(
                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                          <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{m.label}</div>
                          <div className={`font-black text-base ${m.color}`}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Tabs */}
                <div className="border-t border-slate-100 px-8 flex gap-1 overflow-x-auto">
                  {TABS.map(t=>(
                    <button key={t.key} onClick={()=>setActiveTab(t.key)}
                      className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold uppercase tracking-wide border-b-2 transition-all whitespace-nowrap
                        ${activeTab===t.key?'border-indigo-600 text-indigo-600':'border-transparent text-slate-400 hover:text-slate-600'}`}>
                      {t.icon} {t.label}
                      {t.badge&&<span className="w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">{t.badge}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─ Overview ─ */}
              {activeTab==='overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dim summary */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2"><BarChart2 size={15} className="text-indigo-500"/> Score Breakdown</h3>
                    <div className="space-y-3">
                      {Object.entries(dims).map(([k,d])=>{
                        const pct=Math.round((d.score/d.max)*100);
                        const col=pct>=75?'bg-green-500':pct>=50?'bg-amber-400':'bg-red-400';
                        return (
                          <div key={k}>
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-1.5">{DIM_ICONS[k]}<span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{d.label}</span></div>
                              <span className={`text-[10px] font-black ${pct>=75?'text-green-600':pct>=50?'text-amber-500':'text-red-500'}`}>{d.score}/{d.max}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full bar-fill ${col}`} style={{width:`${pct}%`}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Top issues */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2"><AlertCircle size={15} className="text-red-500"/> Top Issues to Fix</h3>
                    <div className="space-y-2.5">
                      {issues.slice(0,5).map((issue,i)=>{
                        const cfg=ISSUE_CFG[issue.severity]||ISSUE_CFG.medium;
                        return (
                          <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`}/>
                            <div><p className={`font-bold text-xs ${cfg.text}`}>{issue.title}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{issue.category}</p></div>
                          </div>
                        );
                      })}
                      {issues.length===0&&<div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200"><CheckCircle size={18} className="text-green-500"/><p className="font-bold text-green-700 text-sm">Excellent — no critical issues!</p></div>}
                    </div>
                  </div>
                  {/* Industry benchmarks */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2"><Award size={15} className="text-purple-500"/> Interview Probability</h3>
                    <div className="space-y-3">
                      {[
                        {label:"Phone Screen Likely",    val:60, hint:"Recruiter will typically call"},
                        {label:"Technical Interview",    val:70, hint:"Cleared initial screening"},
                        {label:"Strong Candidate",       val:80, hint:"Top 25% of applicants"},
                        {label:"Exceptional Fit",        val:90, hint:"Top 5% — offer probable"},
                      ].map((bm,i)=>(
                        <div key={i}>
                          <div className="flex justify-between text-[10px] mb-1 font-bold">
                            <span className="text-slate-600 uppercase">{bm.label}</span>
                            <span className={r.match_score>=bm.val?'text-green-600':'text-slate-400'}>
                              {r.match_score>=bm.val?'✓ Reached':`Need +${bm.val-r.match_score}pts`}
                            </span>
                          </div>
                          <div className="relative h-1.5 bg-slate-100 rounded-full">
                            <div className="h-full rounded-full bg-indigo-200" style={{width:`${bm.val}%`}}/>
                            <div className="absolute top-0 h-full flex items-center" style={{left:`${Math.min(r.match_score,100)}%`}}>
                              <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow -translate-x-1/2 ${r.match_score>=bm.val?'bg-green-500':'bg-red-400'}`}/>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Skill quick view */}
                  <div className="bg-indigo-900 rounded-2xl p-6 text-white">
                    <h3 className="font-black text-sm mb-4 flex items-center gap-2 text-indigo-200"><Target size={15}/> Skill Match at a Glance</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-indigo-300 mb-1 font-bold uppercase tracking-wide">
                          <span>Required Skills Matched</span>
                          <span className="text-white">{dims.skills?.match_percentage||0}%</span>
                        </div>
                        <div className="h-2 bg-indigo-950 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full bar-fill" style={{width:`${dims.skills?.match_percentage||0}%`}}/>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        {[
                          {label:"✓ Matched",val:dims.skills?.matched_required?.length||0,col:"text-emerald-400"},
                          {label:"✗ Missing",val:dims.skills?.missing_required?.length||0,col:"text-red-400"},
                          {label:"◎ Preferred",val:dims.skills?.matched_preferred?.length||0,col:"text-blue-300"},
                        ].map((m,i)=>(
                          <div key={i} className="bg-indigo-950/60 rounded-xl p-3 text-center border border-indigo-800">
                            <div className={`font-black text-xl ${m.col}`}>{m.val}</div>
                            <div className="text-[9px] text-indigo-400 font-bold uppercase">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─ Dimensions ─ */}
              {activeTab==='dimensions' && (
                <div className="space-y-3">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3">
                    <p className="text-sm text-indigo-700 italic">Click any dimension to expand the full scoring detail. All 7 dimensions are weighted to reflect real ATS and recruiter scoring logic.</p>
                  </div>
                  {Object.entries(dims).map(([k,d],i)=><DimBar key={k} dimKey={k} dim={d} delay={i*0.05}/>)}
                </div>
              )}

              {/* ─ Issues ─ */}
              {activeTab==='issues' && (
                <div className="space-y-8">
                  {criticalIssues.length>0&&(
                    <div>
                      <h3 className="font-black text-red-600 text-sm uppercase tracking-widest mb-3 flex items-center gap-2"><XCircle size={15}/> Critical & High Issues ({criticalIssues.length})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{criticalIssues.map((iss,i)=><IssueCard key={i} issue={iss} idx={i}/>)}</div>
                    </div>
                  )}
                  {medLowIssues.length>0&&(
                    <div>
                      <h3 className="font-black text-amber-600 text-sm uppercase tracking-widest mb-3 flex items-center gap-2"><AlertTriangle size={15}/> Medium & Low Priority ({medLowIssues.length})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{medLowIssues.map((iss,i)=><IssueCard key={i} issue={iss} idx={i}/>)}</div>
                    </div>
                  )}
                  {issues.length===0&&(
                    <div className="flex items-center gap-5 p-8 bg-green-50 border border-green-200 rounded-2xl">
                      <CheckCircle size={36} className="text-green-500 flex-shrink-0"/>
                      <div><p className="font-black text-green-800 text-lg">No Issues Detected</p><p className="text-sm text-green-600 italic mt-1">Your resume is well-aligned with this job description.</p></div>
                    </div>
                  )}
                </div>
              )}

              {/* ─ Suggestions ─ */}
              {activeTab==='suggestions' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
                    <p className="text-sm text-emerald-700 italic">These suggestions are specific to <strong>this job description</strong>. Each includes an example rewrite you can copy directly.</p>
                  </div>
                  {suggestions.map((s,i)=><SuggCard key={i} s={s} idx={i}/>)}
                </div>
              )}

              {/* ─ JD Analysis ─ */}
              {activeTab==='jd' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2"><Search size={15} className="text-indigo-500"/> JD Requirements Extracted</h3>
                    <div className="space-y-3">
                      {[
                        {label:"Seniority Level",  val:jdAnalysis.seniority||"Not specified"},
                        {label:"Min Experience",   val:`${jdAnalysis.min_years||0}+ years`},
                        {label:"Education Req.",   val:jdAnalysis.education_level||"Not specified"},
                        {label:"Role Domains",     val:(jdAnalysis.domains||[]).join(', ')||"General"},
                      ].map((item,i)=>(
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{item.label}</span>
                          <span className="font-bold text-slate-800 text-sm capitalize">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2"><Star size={15} className="text-amber-500"/> JD Soft Skills Required</h3>
                    {jdAnalysis.soft_skills?.length>0
                      ?<div className="flex flex-wrap gap-1.5">{jdAnalysis.soft_skills.map(s=><span key={s} className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-md font-bold">{s}</span>)}</div>
                      :<p className="text-sm text-slate-400 italic">No specific soft skills mentioned in JD</p>}
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-black text-slate-800 text-sm mb-4">Required Skills from JD ({jdAnalysis.required_skills?.length||0})</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(jdAnalysis.required_skills||[]).map(s=><span key={s} className="text-[10px] bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-md font-bold">{s}</span>)}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-black text-slate-800 text-sm mb-4">Preferred Skills ({jdAnalysis.preferred_skills?.length||0})</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(jdAnalysis.preferred_skills||[]).map(s=><span key={s} className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md font-bold">{s}</span>)}
                      {(!jdAnalysis.preferred_skills||jdAnalysis.preferred_skills.length===0)&&<p className="text-sm text-slate-400 italic">None detected</p>}
                    </div>
                  </div>
                  <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2"><Eye size={15} className="text-purple-500"/> Key JD Phrases (most frequent)</h3>
                    <div className="flex flex-wrap gap-2">
                      {(jdAnalysis.key_phrases||[]).map(p=><span key={p} className="text-[10px] bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-lg font-bold uppercase">{p}</span>)}
                    </div>
                  </div>
                </div>
              )}

              {/* ─ Skills Map ─ */}
              {activeTab==='skills' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-green-50 border border-green-200 rounded-2xl">
                    <h4 className="font-black text-green-800 text-sm mb-3 flex items-center gap-2"><CheckCircle size={14}/> Skills You Have ({dims.skills?.matched_required?.length||0})</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(dims.skills?.matched_required||[]).map(s=><span key={s} className="text-[10px] bg-white border border-green-200 text-green-700 px-2 py-0.5 rounded-md font-bold">{s}</span>)}
                      {(!dims.skills?.matched_required?.length)&&<p className="text-xs text-green-600 italic">None matched</p>}
                    </div>
                  </div>
                  <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
                    <h4 className="font-black text-red-800 text-sm mb-3 flex items-center gap-2"><XCircle size={14}/> Missing Required ({dims.skills?.missing_required?.length||0})</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(dims.skills?.missing_required||[]).map(s=><span key={s} className="text-[10px] bg-white border border-red-200 text-red-600 px-2 py-0.5 rounded-md font-bold">{s}</span>)}
                      {(!dims.skills?.missing_required?.length)&&<p className="text-xs text-red-600 italic">None missing!</p>}
                    </div>
                  </div>
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                    <h4 className="font-black text-amber-800 text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14}/> Missing Preferred ({dims.skills?.missing_preferred?.length||0})</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(dims.skills?.missing_preferred||[]).map(s=><span key={s} className="text-[10px] bg-white border border-amber-200 text-amber-700 px-2 py-0.5 rounded-md font-bold">{s}</span>)}
                      {(!dims.skills?.missing_preferred?.length)&&<p className="text-xs text-amber-600 italic">None missing!</p>}
                    </div>
                  </div>
                  {/* Resume skills */}
                  <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 p-6">
                    <h4 className="font-black text-slate-800 text-sm mb-3">All Skills Detected in Your Resume ({resumeAnalysis.skills?.length||0})</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(resumeAnalysis.skills||[]).map(s=><span key={s} className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">{s}</span>)}
                    </div>
                  </div>
                </div>
              )}

              {/* CTA */}
              <button onClick={onBuildResume}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 transition-all hover:scale-[1.01]">
                <Layout size={22}/> Apply These Tips & Start Building in Resume Builder <ArrowRight size={18}/>
              </button>
            </div>
          )}

          {/* ══ HOW IT WORKS ══════════════════════════════════ */}
          <div>
            <div className="text-center mb-8">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Under the Hood</div>
              <h2 className="text-3xl font-black text-slate-900">How the Matching Engine Works</h2>
              <p className="text-slate-500 text-sm italic mt-2 max-w-xl mx-auto">Five sequential stages transform your JD and resume into a precise, actionable match score.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {HOW_IT_WORKS.map((step,i)=>(
                <div key={i} className={`rounded-2xl border p-5 reveal ${step.color}`} style={{animationDelay:`${i*0.08}s`}}>
                  <div className="text-2xl font-black opacity-30 mb-2">{step.step}</div>
                  <h4 className="font-black text-sm mb-2">{step.title}</h4>
                  <p className="text-xs leading-relaxed opacity-80">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ══ TIPS FOR ACCURATE MATCHES ═════════════════════ */}
          <div>
            <div className="text-center mb-8">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Best Practices</div>
              <h2 className="text-3xl font-black text-slate-900">Tips for Higher Match Scores</h2>
              <p className="text-slate-500 text-sm italic mt-2 max-w-xl mx-auto">Industry-tested strategies used by candidates who consistently land interviews at competitive companies.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MATCH_TIPS.map((tip,i)=>(
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all reveal" style={{animationDelay:`${i*0.06}s`}}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">{tip.icon}</div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{tip.title}</h4>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed italic">{tip.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ══ SCORING METHODOLOGY ════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><BarChart2 size={20} className="text-indigo-500"/> Scoring Methodology</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {["Dimension","Weight","What It Measures","How to Improve"].map(h=>(
                      <th key={h} className="text-left py-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Skill Keyword Match","30%","Exact + frequency-weighted skill matches from JD","Add missing required skills verbatim from JD"],
                    ["Semantic Relevance","20%","NLP vocabulary overlap + role domain alignment","Use JD terminology; ensure domain words appear"],
                    ["Experience Alignment","15%","Years of experience + seniority level match","Add dates clearly; use seniority-appropriate verbs"],
                    ["Education Match","10%","Degree level vs JD educational requirements","Add certs if degree is below requirement"],
                    ["Achievement Quality","10%","Quantified metrics + power action verbs","Add %, $, numbers, and team sizes to every bullet"],
                    ["Language Mirror","10%","JD key phrases appearing in resume text","Copy multi-word phrases exactly from JD"],
                    ["Cultural Fit","5%","Soft skills alignment between JD and resume","Demonstrate soft skills in context, not as a list"],
                  ].map((row,i)=>(
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      {row.map((cell,j)=>(
                        <td key={j} className={`py-2.5 px-3 ${j===0?'font-bold text-slate-700 text-sm':j===1?'font-black text-indigo-600 text-sm':'text-xs text-slate-500 italic'}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══ DISCLAIMER ════════════════════════════════════ */}
          <p className="text-xs text-slate-400 text-center pb-6 leading-relaxed">
            Match scores are computed using NLP heuristics and may vary from scores generated by specific employer ATS systems. Scores above 75 indicate strong alignment; always review your resume with a human before applying.
          </p>

        </div>
      </div>
    </>
  );
};

export default JobMatcher;