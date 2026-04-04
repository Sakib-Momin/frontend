// src/components/ResumeBuilder.js
import React, { useState, useEffect, useRef } from "react";
import {
  User, Mail, Phone, MapPin, Linkedin, Github, Globe,
  ChevronRight, ChevronLeft, Plus, Trash2, Briefcase,
  GraduationCap, Sparkles, Code2, CheckCircle2, Award,
  FolderOpen, FileText, Layout, Download, Eye, ChevronDown, ChevronUp
} from "lucide-react";

import { auth } from '../firebase';
import { trackFeatureUsage, logActivity } from '../utils/analytics';

// ─── TYPOGRAPHY & RESET ──────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

    /* ── A4 CANVAS: 794px × 1123px at 96dpi ── */
    :root {
      --a4-w: 794px;
      --a4-h: 1123px;
      --margin: 42px;
      --accent: #1e3a5f;
      --accent2: #c8973a;
      --text: #1a1a1a;
      --muted: #6b7280;
      --rule: #d1d5db;
      --bg-sidebar: #1e3a5f;
    }

    /* ── PAGE SHELL ── */
    .cv-page {
      width: var(--a4-w);
      height: var(--a4-h);
      background: #fff;
      display: grid;
      grid-template-columns: 220px 1fr;
      grid-template-rows: auto 1fr;
      font-family: 'Outfit', sans-serif;
      font-size: 10px;
      color: var(--text);
      overflow: hidden;
      position: relative;
    }

    /* ── HEADER (full width) ── */
    .cv-header {
      grid-column: 1 / -1;
      background: var(--accent);
      padding: 32px var(--margin) 26px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .cv-header-left {}
    .cv-name {
      font-family: 'EB Garamond', serif;
      font-size: 32px;
      font-weight: 500;
      color: #ffffff;
      line-height: 1;
      letter-spacing: 0.01em;
    }
    .cv-title {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent2);
      margin-top: 6px;
    }
    .cv-header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .cv-contact-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 9px;
      color: rgba(255,255,255,0.75);
      font-weight: 400;
    }
    .cv-contact-item svg { opacity: 0.6; flex-shrink: 0; }

    /* ── SIDEBAR ── */
    .cv-sidebar {
      background: #f8f7f4;
      padding: 24px 20px;
      border-right: 1px solid #e5e7eb;
      overflow: hidden;
    }
    .cv-sidebar-section { margin-bottom: 20px; }
    .cv-sidebar-title {
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--accent);
      padding-bottom: 5px;
      border-bottom: 2px solid var(--accent2);
      margin-bottom: 10px;
    }

    /* Skills */
    .cv-skill-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px; }
    .cv-skill-name { font-size: 9px; font-weight: 500; color: #374151; }
    .cv-skill-bar-track { height: 3px; background: #e5e7eb; border-radius: 2px; margin-top: 2px; }
    .cv-skill-bar-fill { height: 3px; border-radius: 2px; background: var(--accent2); }

    /* Tags */
    .cv-tag-wrap { display: flex; flex-wrap: wrap; gap: 4px; }
    .cv-tag { font-size: 8px; font-weight: 600; padding: 3px 8px; background: #fff; border: 1px solid #d1d5db; border-radius: 4px; color: #374151; }

    /* Links */
    .cv-link-row { display: flex; align-items: center; gap: 6px; font-size: 9px; color: var(--accent); font-weight: 500; margin-bottom: 5px; }
    .cv-link-row svg { color: var(--accent2); flex-shrink: 0; }

    /* Cert / award items in sidebar */
    .cv-sb-item { margin-bottom: 8px; }
    .cv-sb-item-name { font-size: 9.5px; font-weight: 600; color: #1f2937; line-height: 1.3; }
    .cv-sb-item-sub { font-size: 8.5px; color: var(--muted); margin-top: 1px; }

    /* ── MAIN BODY ── */
    .cv-main {
      padding: 24px var(--margin) 24px 28px;
      overflow: hidden;
    }
    .cv-section { margin-bottom: 18px; }
    .cv-section-title {
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--accent);
      padding-bottom: 5px;
      border-bottom: 2px solid var(--accent2);
      margin-bottom: 10px;
    }

    /* Summary */
    .cv-summary { font-size: 9.5px; color: #4b5563; line-height: 1.65; font-family: 'EB Garamond', serif; font-size: 11px; }

    /* Entry block */
    .cv-entry { margin-bottom: 12px; }
    .cv-entry-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .cv-entry-role { font-size: 11px; font-weight: 700; color: #111827; }
    .cv-entry-org { font-size: 9.5px; font-weight: 500; color: var(--accent2); margin-top: 1px; }
    .cv-entry-location { font-size: 8.5px; color: var(--muted); margin-top: 1px; }
    .cv-entry-date {
      font-size: 8.5px;
      font-weight: 600;
      color: var(--accent);
      white-space: nowrap;
      background: #eef2ff;
      padding: 2px 7px;
      border-radius: 20px;
      flex-shrink: 0;
      margin-left: 8px;
    }
    .cv-entry-desc {
      font-size: 9.5px;
      color: #4b5563;
      margin-top: 5px;
      line-height: 1.6;
      white-space: pre-line;
    }
    .cv-entry-tech { font-size: 8.5px; color: var(--accent2); font-weight: 600; margin-top: 2px; }

    /* Page number */
    .cv-page-num {
      position: absolute;
      bottom: 14px;
      right: var(--margin);
      font-size: 8px;
      color: var(--muted);
      font-weight: 500;
    }

    .cv-empty-state {
      grid-column: 1/-1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #9ca3af;
      font-size: 11px;
      font-style: italic;
    }
  `}</style>
);

// ─── TAILWIND FORM COMPONENTS ──────────────────────────────────
const Field = ({ label, required, error, children, hint }) => (
  <div className="mb-4">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {hint && !error && <div className="text-[10px] text-slate-400 mt-1">{hint}</div>}
    {error && <div className="text-[10px] font-bold text-red-500 tracking-wide uppercase mt-1">{error}</div>}
  </div>
);

const Input = ({ name, placeholder, value, onChange, onKeyDown, type = "text", error, disabled }) => (
  <input
    name={name} type={type} placeholder={placeholder} value={value}
    onChange={onChange} onKeyDown={onKeyDown} disabled={disabled}
    className={`w-full p-3 border rounded-lg bg-white outline-none focus:ring-2 transition-all font-medium text-slate-800 text-sm disabled:opacity-40 disabled:cursor-not-allowed
    ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-blue-400 focus:ring-blue-50'}`}
  />
);

const Textarea = ({ placeholder, value, onChange, rows = 4 }) => (
  <textarea
    placeholder={placeholder} value={value} onChange={onChange} rows={rows}
    className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all font-medium text-slate-800 text-sm resize-none leading-relaxed"
  />
);

// ─── HELPERS ──────────────────────────────────────────────────
const fmtMonth = (m) => {
  if (!m) return "";
  const d = new Date(m + "-02");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const fmtDate = (start, end, current) => {
  const s = start ? fmtMonth(start) : "";
  const e = current ? "Present" : end ? fmtMonth(end) : "";
  if (!s && !e) return "";
  return s && e ? `${s} – ${e}` : s || e;
};

const SKILL_DICT = {
  javascript: "JavaScript", python: "Python", react: "React", nodejs: "Node.js",
  "node js": "Node.js", java: "Java", sql: "SQL", aws: "AWS", html: "HTML",
  css: "CSS", typescript: "TypeScript", docker: "Docker", git: "Git",
  figma: "Figma", mongodb: "MongoDB", mysql: "MySQL", kotlin: "Kotlin",
  swift: "Swift", flutter: "Flutter", "machine learning": "Machine Learning",
  "deep learning": "Deep Learning", kubernetes: "Kubernetes", angular: "Angular",
  vue: "Vue.js", django: "Django", "spring boot": "Spring Boot", redux: "Redux",
  graphql: "GraphQL", "c++": "C++", "c#": "C#", rust: "Rust", go: "Go",
};

const STEPS = [
  { label: "Personal Info", icon: User, desc: "Name, contact & links" },
  { label: "Profile Summary", icon: FileText, desc: "Your professional story" },
  { label: "Education", icon: GraduationCap, desc: "Degrees & qualifications" },
  { label: "Experience", icon: Briefcase, desc: "Work history & roles" },
  { label: "Skills", icon: Code2, desc: "Technical & soft skills" },
  { label: "Projects", icon: FolderOpen, desc: "Portfolio highlights" },
  { label: "Certifications", icon: Award, desc: "Awards & certificates" },
];

const newEdu = () => ({ id: Date.now(), degree: "", school: "", field: "", start: "", end: "", current: false, grade: "" });
const newExp = () => ({ id: Date.now(), role: "", company: "", location: "", start: "", end: "", current: false, desc: "" });
const newProj = () => ({ id: Date.now(), title: "", tech: "", link: "", desc: "" });
const newCert = () => ({ id: Date.now(), name: "", issuer: "", year: "" });

// ─── LIVE CV PREVIEW COMPONENT ─────────────────────────────────
function CVPreview({ data, isFresher, pageNum = 1 }) {
  const { personal, summary, education, experience, skills, projects, certifications } = data;
  const hasName = personal.name?.length >= 2;

  const sidebarSkills = skills.slice(0, 12);
  const sidebarCerts = certifications.filter(c => c.name);
  const sidebarLinks = [
    personal.linkedin && { icon: <Linkedin size={9}/>, label: "LinkedIn", url: personal.linkedin },
    personal.github && { icon: <Github size={9}/>, label: "GitHub", url: personal.github },
    personal.website && { icon: <Globe size={9}/>, label: "Portfolio", url: personal.website },
  ].filter(Boolean);

  return (
    <div className="cv-page shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      {/* HEADER */}
      <div className="cv-header">
        <div className="cv-header-left">
          <div className="cv-name">{personal.name || "Your Full Name"}</div>
          {personal.title && <div className="cv-title">{personal.title}</div>}
        </div>
        <div className="cv-header-right">
          {personal.email && <span className="cv-contact-item"><Mail size={9}/>{personal.email}</span>}
          {personal.phone && <span className="cv-contact-item"><Phone size={9}/>{personal.phone}</span>}
          {(personal.city || personal.country) && (
            <span className="cv-contact-item"><MapPin size={9}/>{[personal.city, personal.country].filter(Boolean).join(", ")}</span>
          )}
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="cv-sidebar">
        {sidebarLinks.length > 0 && (
          <div className="cv-sidebar-section">
            <div className="cv-sidebar-title">Connect</div>
            {sidebarLinks.map((l, i) => (
              <div key={i} className="cv-link-row">{l.icon} <span>{l.label}</span></div>
            ))}
          </div>
        )}

        {sidebarSkills.length > 0 && (
          <div className="cv-sidebar-section">
            <div className="cv-sidebar-title">Skills</div>
            <div className="cv-tag-wrap">
              {sidebarSkills.map(s => <span key={s} className="cv-tag">{s}</span>)}
            </div>
          </div>
        )}

        {sidebarCerts.length > 0 && (
          <div className="cv-sidebar-section">
            <div className="cv-sidebar-title">Certifications</div>
            {sidebarCerts.map((c, i) => (
              <div key={i} className="cv-sb-item">
                <div className="cv-sb-item-name">{c.name}{c.year ? ` (${c.year})` : ""}</div>
                {c.issuer && <div className="cv-sb-item-sub">{c.issuer}</div>}
              </div>
            ))}
          </div>
        )}

        {pageNum === 2 && (
          <div className="cv-sidebar-section">
            <div className="cv-sidebar-title" style={{ color: "#9ca3af" }}>continued…</div>
          </div>
        )}
      </div>

      {/* MAIN BODY */}
      <div className="cv-main">
        {!hasName && (
          <div className="cv-empty-state">
            <Layout size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
            Fill in the form to preview your resume →
          </div>
        )}

        {hasName && (
          <>
            {summary && (
              <div className="cv-section">
                <div className="cv-section-title">Professional Summary</div>
                <div className="cv-summary">{summary}</div>
              </div>
            )}

            {!isFresher && experience.some(e => e.role || e.company) && (
              <div className="cv-section">
                <div className="cv-section-title">Work Experience</div>
                {experience.map((exp, i) => (exp.role || exp.company) && (
                  <div key={i} className="cv-entry">
                    <div className="cv-entry-header">
                      <div style={{ flex: 1 }}>
                        <div className="cv-entry-role">{exp.role || "Role Title"}</div>
                        <div className="cv-entry-org">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                      </div>
                      {(exp.start || exp.end || exp.current) && (
                        <div className="cv-entry-date">{fmtDate(exp.start, exp.end, exp.current)}</div>
                      )}
                    </div>
                    {exp.desc && <div className="cv-entry-desc">{exp.desc}</div>}
                  </div>
                ))}
              </div>
            )}

            {education.some(e => e.school || e.degree) && (
              <div className="cv-section">
                <div className="cv-section-title">Education</div>
                {education.map((edu, i) => (edu.school || edu.degree) && (
                  <div key={i} className="cv-entry">
                    <div className="cv-entry-header">
                      <div style={{ flex: 1 }}>
                        <div className="cv-entry-role">{edu.degree || "Degree"}</div>
                        <div className="cv-entry-org">{edu.school}{edu.field ? ` — ${edu.field}` : ""}</div>
                        {edu.grade && <div className="cv-entry-location">Grade: {edu.grade}</div>}
                      </div>
                      {(edu.start || edu.end || edu.current) && (
                        <div className="cv-entry-date">{fmtDate(edu.start, edu.end, edu.current)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {projects.some(p => p.title) && (
              <div className="cv-section">
                <div className="cv-section-title">Projects</div>
                {projects.filter(p => p.title).map((proj, i) => (
                  <div key={i} className="cv-entry">
                    <div className="cv-entry-header">
                      <div style={{ flex: 1 }}>
                        <div className="cv-entry-role">{proj.title}</div>
                        {proj.tech && <div className="cv-entry-tech">{proj.tech}</div>}
                      </div>
                      {proj.link && <div className="cv-entry-date">↗ View</div>}
                    </div>
                    {proj.desc && <div className="cv-entry-desc">{proj.desc}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="cv-page-num">Page {pageNum}</div>
    </div>
  );
}

// ─── STEPPER ──────────────────────────────────────────────────
function Stepper({ step, totalSteps }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const num = i + 1;
        const isActive = step === num;
        const isDone = step > num;
        return (
          <React.Fragment key={num}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100' :
                isDone ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {isDone ? <CheckCircle2 size={16}/> : num}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wide mt-1.5 text-center leading-tight max-w-[60px] ${
                isActive ? 'text-blue-600' : isDone ? 'text-blue-400' : 'text-slate-300'
              }`}>{s.label.split(' ')[0]}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${isDone ? 'bg-blue-300' : 'bg-slate-100'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── ENTRY CARD ───────────────────────────────────────────────
function EntryCard({ label, idx, onRemove, canRemove, children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{label} #{idx + 1}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(c => !c)} className="text-slate-400 hover:text-slate-600 p-1">
            {collapsed ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
          </button>
          {canRemove && (
            <button onClick={onRemove} className="text-slate-300 hover:text-red-500 p-1 transition-colors">
              <Trash2 size={14}/>
            </button>
          )}
        </div>
      </div>
      {!collapsed && <div className="p-4">{children}</div>}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function ResumeBuilder({ user, requireLogin, onBack }) {
  
  // 💾 LOCAL STORAGE FIX: Load the step from memory, or default to 1
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('resumeBuilderStep');
    return saved ? parseInt(saved, 10) : 1;
  });

  // 💾 LOCAL STORAGE FIX: Load the fresher status from memory
  const [isFresher, setIsFresher] = useState(() => {
    const saved = localStorage.getItem('resumeBuilderFresher');
    return saved ? JSON.parse(saved) : false;
  });

  const [saved, setSaved] = useState(true);
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState({});
  const [previewPage, setPreviewPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState("");
  const totalPreviewPages = 2;

  // 💾 LOCAL STORAGE FIX: Load the giant data object from memory!
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('resumeBuilderData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved resume data");
      }
    }
    // If no memory exists, load the default empty state
    return {
      personal: { name: "", title: "", email: "", phone: "", city: "", country: "", linkedin: "", github: "", website: "" },
      summary: "",
      education: [newEdu()],
      experience: [newExp()],
      skills: [],
      projects: [newProj()],
      certifications: [newCert()],
    };
  });

  // 💾 LOCAL STORAGE FIX: Save every single keystroke to memory instantly!
  useEffect(() => {
    localStorage.setItem('resumeBuilderData', JSON.stringify(data));
    localStorage.setItem('resumeBuilderStep', step.toString());
    localStorage.setItem('resumeBuilderFresher', JSON.stringify(isFresher));
  }, [data, step, isFresher]);

  useEffect(() => {
    setSaved(false);
    const t = setTimeout(() => setSaved(true), 1200);
    return () => clearTimeout(t);
  }, [data]);

  const hasPage2Content = data.experience.filter(e => e.role).length > 2 ||
    data.projects.filter(p => p.title).length > 2 ||
    data.skills.length > 10;

  const setPersonal = (field, value) => setData(p => ({ ...p, personal: { ...p.personal, [field]: value } }));
  const handlePersonal = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "name") v = value.replace(/\b\w/g, c => c.toUpperCase());
    if (["linkedin", "github", "website"].includes(name) && v && !v.startsWith("http")) v = "https://" + v;
    setPersonal(name, v);
    const err = { ...errors };
    if (name === "name") err.name = v.length > 0 && v.length < 2 ? "Name too short" : "";
    if (name === "email") err.email = v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Invalid email" : "";
    if (name === "phone") err.phone = v && v.replace(/\D/g, "").length < 7 ? "Invalid phone" : "";
    setErrors(err);
  };

  const updateEdu = (id, f, v) => setData(p => ({ ...p, education: p.education.map(e => e.id === id ? { ...e, [f]: v } : e) }) );
  const addEdu = () => setData(p => ({ ...p, education: [...p.education, newEdu()] }));
  const removeEdu = (id) => setData(p => ({ ...p, education: p.education.filter(e => e.id !== id) }));

  const updateExp = (id, f, v) => setData(p => ({ ...p, experience: p.experience.map(e => e.id === id ? { ...e, [f]: v } : e) }) );
  const addExp = () => setData(p => ({ ...p, experience: [...p.experience, newExp()] }));
  const removeExp = (id) => setData(p => ({ ...p, experience: p.experience.filter(e => e.id !== id) }));

  const addSkill = () => {
    const raw = skillInput.trim().replace(/,$/, "");
    if (!raw || data.skills.length >= 20) return;
    const key = raw.toLowerCase();
    const formatted = SKILL_DICT[key] || raw.charAt(0).toUpperCase() + raw.slice(1);
    if (!data.skills.includes(formatted)) setData(p => ({ ...p, skills: [...p.skills, formatted] }));
    setSkillInput("");
  };
  const removeSkill = (s) => setData(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  const updateProj = (id, f, v) => setData(p => ({ ...p, projects: p.projects.map(x => x.id === id ? { ...x, [f]: v } : x) }) );
  const addProj = () => setData(p => ({ ...p, projects: [...p.projects, newProj()] }));
  const removeProj = (id) => setData(p => ({ ...p, projects: p.projects.filter(x => x.id !== id) }));

  const updateCert = (id, f, v) => setData(p => ({ ...p, certifications: p.certifications.map(x => x.id === id ? { ...x, [f]: v } : x) }) );
  const addCert = () => setData(p => ({ ...p, certifications: [...p.certifications, newCert()] }));
  const removeCert = (id) => setData(p => ({ ...p, certifications: p.certifications.filter(x => x.id !== id) }));

  // Validation
  const v1 = data.personal.name.length >= 2 && data.personal.email && !errors.email && data.personal.phone && !errors.phone;
  const v2 = data.summary.trim().length >= 20;
  const v3 = data.education.every(e => e.degree && e.school);
  const v4 = isFresher || data.experience.every(e => e.role && e.company);
  const v5 = data.skills.length >= 3;
  const v6 = true; // projects optional
  const v7 = true; // certs optional
  const isValid = [null, v1, v2, v3, v4, v5, v6, v7][step];

  const handleGenerate = async () => {
    // ==========================================
    // 🔐 AUTH WALL INTERCEPTOR
    // ==========================================
    if (!user) {
      alert("Please log in or create an account to download your resume!");
      if (requireLogin) requireLogin();
      return; 
    }
    // ==========================================

    setIsGenerating(true);
    setGenerateMsg("");
    try {
      const response = await fetch("http://localhost:5000/api/resumes/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isFresher }),
      });
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.personal.name.replace(/ /g, "_") || "Resume"}_CV.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      setGenerateMsg("success");
      try {
        await trackFeatureUsage('Resume Builder');
        await logActivity('resume', 'Resume generated', auth.currentUser?.email || 'Anonymous');
      } catch (_) {}
    } catch (err) {
      setGenerateMsg("error:" + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <FontLoader />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">

          {/* PAGE HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                <FileText size={20} className="text-white"/>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resume Builder</h1>
                <p className="text-slate-500 text-sm">Craft a professional, ATS-optimized resume</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-8">

            {/* ═══ LEFT: FORM ═══ */}
            <div className="w-full xl:w-[520px] flex-shrink-0 space-y-4">

              {/* Stepper */}
              <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
                <Stepper step={step} totalSteps={7} />
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black text-blue-500 tracking-widest uppercase">Step {step} of 7</div>
                    <div className="text-lg font-black text-slate-800">{STEPS[step - 1].label}</div>
                    <div className="text-xs text-slate-400 font-medium">{STEPS[step - 1].desc}</div>
                  </div>
                  <div className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition-all ${
                    saved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-500 border border-amber-200'
                  }`}>
                    {saved ? '✓ Auto-saved' : '○ Saving…'}
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-in fade-in duration-200">

                {/* STEP 1: Personal Info */}
                {step === 1 && (
                  <div className="space-y-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Field label="Full Name" required error={errors.name}>
                          <Input name="name" placeholder="Arjun Sharma" value={data.personal.name} onChange={handlePersonal} error={errors.name}/>
                        </Field>
                      </div>
                      <div className="col-span-2">
                        <Field label="Professional Title" hint="e.g. Full-Stack Developer · Data Scientist · Product Manager">
                          <Input name="title" placeholder="Software Engineer" value={data.personal.title} onChange={handlePersonal}/>
                        </Field>
                      </div>
                      <Field label="Email" required error={errors.email}>
                        <Input name="email" type="email" placeholder="arjun@email.com" value={data.personal.email} onChange={handlePersonal} error={errors.email}/>
                      </Field>
                      <Field label="Phone" required error={errors.phone}>
                        <Input name="phone" type="tel" placeholder="+91 98765 43210" value={data.personal.phone} onChange={handlePersonal} error={errors.phone}/>
                      </Field>
                      <Field label="City">
                        <Input name="city" placeholder="Mumbai" value={data.personal.city} onChange={handlePersonal}/>
                      </Field>
                      <Field label="Country">
                        <Input name="country" placeholder="India" value={data.personal.country} onChange={handlePersonal}/>
                      </Field>
                    </div>
                    <div className="pt-2 border-t border-slate-100 mt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Online Presence (Optional)</p>
                      <Field label="LinkedIn URL">
                        <Input name="linkedin" placeholder="linkedin.com/in/yourname" value={data.personal.linkedin} onChange={handlePersonal}/>
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="GitHub URL">
                          <Input name="github" placeholder="github.com/yourname" value={data.personal.github} onChange={handlePersonal}/>
                        </Field>
                        <Field label="Portfolio / Website">
                          <Input name="website" placeholder="yourname.dev" value={data.personal.website} onChange={handlePersonal}/>
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Summary */}
                {step === 2 && (
                  <div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-xs text-blue-700 leading-relaxed">
                      <strong>💡 Pro tip:</strong> A strong summary is 3–4 sentences. Mention your years of experience, core skills, and what value you bring to a team. Avoid "I am" — start with your title or skill.
                    </div>
                    <Field label="Professional Summary / Objective" required>
                      <Textarea
                        rows={6}
                        placeholder="Results-driven Software Engineer with 3+ years of experience building scalable web applications. Proficient in React, Node.js, and AWS. Proven track record of reducing page load times by 40% and shipping features that drive user retention. Seeking a senior engineering role at a product-led company."
                        value={data.summary}
                        onChange={e => setData(p => ({ ...p, summary: e.target.value }))}
                      />
                      <div className={`text-[10px] font-bold uppercase tracking-wide mt-2 flex justify-between ${data.summary.length >= 20 ? "text-emerald-500" : "text-amber-500"}`}>
                        <span>{data.summary.trim().length} characters {data.summary.trim().length < 20 && "— minimum 20 needed"}</span>
                        <span>{data.summary.trim().split(/\s+/).filter(Boolean).length} words</span>
                      </div>
                    </Field>
                  </div>
                )}

                {/* STEP 3: Education */}
                {step === 3 && (
                  <div>
                    {data.education.map((edu, idx) => (
                      <EntryCard key={edu.id} label="Education" idx={idx} onRemove={() => removeEdu(edu.id)} canRemove={data.education.length > 1}>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Field label="Degree / Qualification" required>
                              <Input placeholder="B.Tech Computer Science" value={edu.degree} onChange={e => updateEdu(edu.id, "degree", e.target.value)}/>
                            </Field>
                          </div>
                          <div className="col-span-2">
                            <Field label="Institution" required>
                              <Input placeholder="University of Mumbai" value={edu.school} onChange={e => updateEdu(edu.id, "school", e.target.value)}/>
                            </Field>
                          </div>
                          <div className="col-span-2">
                            <Field label="Field of Study">
                              <Input placeholder="Computer Engineering" value={edu.field} onChange={e => updateEdu(edu.id, "field", e.target.value)}/>
                            </Field>
                          </div>
                          <Field label="Start">
                            <Input type="month" value={edu.start} onChange={e => updateEdu(edu.id, "start", e.target.value)}/>
                          </Field>
                          <Field label="End">
                            <Input type="month" value={edu.end} disabled={edu.current} onChange={e => updateEdu(edu.id, "end", e.target.value)}/>
                          </Field>
                          <div className="col-span-2">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 accent-blue-600 rounded" checked={edu.current} onChange={e => updateEdu(edu.id, "current", e.target.checked)}/>
                              <span className="text-xs font-semibold text-slate-600">Currently studying here</span>
                            </label>
                          </div>
                          <div className="col-span-2">
                            <Field label="GPA / Grade">
                              <Input placeholder="8.7 CGPA / 85%" value={edu.grade} onChange={e => updateEdu(edu.id, "grade", e.target.value)}/>
                            </Field>
                          </div>
                        </div>
                      </EntryCard>
                    ))}
                    <button onClick={addEdu} className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-blue-50 transition-colors text-sm">
                      <Plus size={16}/> Add Qualification
                    </button>
                  </div>
                )}

                {/* STEP 4: Experience */}
                {step === 4 && (
                  <div>
                    <label className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-5 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded" checked={isFresher} onChange={e => setIsFresher(e.target.checked)}/>
                      <div>
                        <div className="font-bold text-indigo-900 text-sm">I'm a Fresher — no work experience</div>
                        <div className="text-[10px] text-indigo-500 font-medium mt-0.5">Your CV will highlight education and projects instead</div>
                      </div>
                    </label>

                    {!isFresher && (
                      <>
                        {data.experience.map((exp, idx) => (
                          <EntryCard key={exp.id} label="Role" idx={idx} onRemove={() => removeExp(exp.id)} canRemove={data.experience.length > 1}>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2">
                                <Field label="Job Title" required>
                                  <Input placeholder="Senior Software Engineer" value={exp.role} onChange={e => updateExp(exp.id, "role", e.target.value)}/>
                                </Field>
                              </div>
                              <Field label="Company" required>
                                <Input placeholder="Infosys Limited" value={exp.company} onChange={e => updateExp(exp.id, "company", e.target.value)}/>
                              </Field>
                              <Field label="Location">
                                <Input placeholder="Pune / Remote" value={exp.location} onChange={e => updateExp(exp.id, "location", e.target.value)}/>
                              </Field>
                              <Field label="Start">
                                <Input type="month" value={exp.start} onChange={e => updateExp(exp.id, "start", e.target.value)}/>
                              </Field>
                              <Field label="End">
                                <Input type="month" value={exp.end} disabled={exp.current} onChange={e => updateExp(exp.id, "end", e.target.value)}/>
                              </Field>
                              <div className="col-span-2">
                                <label className="flex items-center gap-2.5 cursor-pointer mb-3">
                                  <input type="checkbox" className="w-4 h-4 accent-blue-600 rounded" checked={exp.current} onChange={e => updateExp(exp.id, "current", e.target.checked)}/>
                                  <span className="text-xs font-semibold text-slate-600">I currently work here</span>
                                </label>
                              </div>
                              <div className="col-span-2">
                                <Field label="Key Responsibilities & Achievements" hint="Use bullet points. Start with action verbs. Include metrics (%, $, numbers).">
                                  <Textarea
                                    rows={5}
                                    placeholder={"• Led migration of monolith to microservices, reducing deployment time by 60%\n• Built REST APIs serving 2M+ requests/day using Node.js and Redis\n• Mentored a team of 4 junior developers"}
                                    value={exp.desc}
                                    onChange={e => updateExp(exp.id, "desc", e.target.value)}
                                  />
                                </Field>
                              </div>
                            </div>
                          </EntryCard>
                        ))}
                        <button onClick={addExp} className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-blue-50 transition-colors text-sm">
                          <Plus size={16}/> Add Role
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* STEP 5: Skills */}
                {step === 5 && (
                  <div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5 text-xs text-amber-800 leading-relaxed">
                      <strong>💡 ATS tip:</strong> Add skills exactly as they appear in the job description. Include both technical (React, SQL) and tools (Jira, Figma). Aim for 8–15 skills.
                    </div>
                    <Field label="Add Skills" hint="Type a skill and press Enter or comma. Max 20 skills.">
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. React, Python, Docker..."
                          value={skillInput}
                          onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); } }}
                        />
                        <button onClick={addSkill} className="px-4 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 flex-shrink-0">
                          <Plus size={16}/>
                        </button>
                      </div>
                    </Field>
                    {data.skills.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No skills added yet — add at least 3 to continue
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {data.skills.map(s => (
                        <span key={s} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-bold">
                          {s}
                          <button onClick={() => removeSkill(s)} className="text-blue-300 hover:text-red-500 ml-0.5">
                            <Trash2 size={11}/>
                          </button>
                        </span>
                      ))}
                    </div>
                    {data.skills.length < 3 && data.skills.length > 0 && (
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mt-3">Add {3 - data.skills.length} more skill{3 - data.skills.length > 1 ? 's' : ''} to continue</p>
                    )}
                  </div>
                )}

                {/* STEP 6: Projects */}
                {step === 6 && (
                  <div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-xs text-slate-600">
                      <strong>Optional but powerful.</strong> Include 2–3 strong projects. For each, mention the tech stack and a measurable outcome.
                    </div>
                    {data.projects.map((proj, idx) => (
                      <EntryCard key={proj.id} label="Project" idx={idx} onRemove={() => removeProj(proj.id)} canRemove={data.projects.length > 1}>
                        <Field label="Project Title">
                          <Input placeholder="E-Commerce Platform" value={proj.title} onChange={e => updateProj(proj.id, "title", e.target.value)}/>
                        </Field>
                        <Field label="Tech Stack">
                          <Input placeholder="React · Node.js · MongoDB · AWS" value={proj.tech} onChange={e => updateProj(proj.id, "tech", e.target.value)}/>
                        </Field>
                        <Field label="Link (GitHub / Live)">
                          <Input placeholder="github.com/user/project" value={proj.link} onChange={e => updateProj(proj.id, "link", e.target.value)}/>
                        </Field>
                        <Field label="Description">
                          <Textarea rows={3} placeholder="Built a full-stack e-commerce app with real-time inventory management. Handled 5,000+ concurrent users." value={proj.desc} onChange={e => updateProj(proj.id, "desc", e.target.value)}/>
                        </Field>
                      </EntryCard>
                    ))}
                    <button onClick={addProj} className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-blue-50 transition-colors text-sm">
                      <Plus size={16}/> Add Project
                    </button>
                  </div>
                )}

                {/* STEP 7: Certifications */}
                {step === 7 && (
                  <div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-xs text-slate-600">
                      <strong>Optional.</strong> Add any relevant certifications, awards, or achievements.
                    </div>
                    {data.certifications.map((cert, idx) => (
                      <EntryCard key={cert.id} label="Certification" idx={idx} onRemove={() => removeCert(cert.id)} canRemove={data.certifications.length > 1}>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-3">
                            <Field label="Certification Name">
                              <Input placeholder="AWS Solutions Architect" value={cert.name} onChange={e => updateCert(cert.id, "name", e.target.value)}/>
                            </Field>
                          </div>
                          <div className="col-span-2">
                            <Field label="Issuing Organization">
                              <Input placeholder="Amazon Web Services" value={cert.issuer} onChange={e => updateCert(cert.id, "issuer", e.target.value)}/>
                            </Field>
                          </div>
                          <Field label="Year">
                            <Input placeholder="2024" value={cert.year} onChange={e => updateCert(cert.id, "year", e.target.value)}/>
                          </Field>
                        </div>
                      </EntryCard>
                    ))}
                    <button onClick={addCert} className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-blue-50 transition-colors text-sm">
                      <Plus size={16}/> Add Certification
                    </button>
                  </div>
                )}
              </div>

              {/* NAV BUTTONS */}
              <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(s => s - 1)}
                  disabled={step === 1}
                  className={`flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-xl transition-all ${
                    step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ChevronLeft size={16}/> Back
                </button>

                {step < 7 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={!isValid}
                    className={`flex items-center gap-2 font-black text-sm px-6 py-3 rounded-xl transition-all ${
                      isValid ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Continue <ChevronRight size={16}/>
                  </button>
                ) : (
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className={`flex items-center gap-2 font-black text-sm px-7 py-3 rounded-xl transition-all shadow-lg ${
                        !isGenerating ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isGenerating ? (
                        <><Globe className="animate-spin" size={16}/> Generating PDF…</>
                      ) : (
                        <><Download size={16}/> Download PDF</>
                      )}
                    </button>
                    {generateMsg === "success" && <span className="text-[10px] font-bold text-emerald-600 uppercase">✓ Downloaded!</span>}
                    {generateMsg.startsWith("error") && <span className="text-[10px] font-bold text-red-500">✗ {generateMsg.replace("error:", "")}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* ═══ RIGHT: LIVE PREVIEW ═══ */}
            <div className="flex-1 xl:sticky xl:top-6 h-fit">
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                
                {/* Preview Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-emerald-400"/>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Live Preview</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <span>A4 · 794 × 1123px</span>
                    {hasPage2Content && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">2-page resume</span>
                    )}
                  </div>
                </div>

                {/* Page Switcher (only when 2 pages) */}
                {hasPage2Content && (
                  <div className="flex gap-2 mb-4">
                    {[1, 2].map(p => (
                      <button
                        key={p}
                        onClick={() => setPreviewPage(p)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          previewPage === p
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Page {p}
                      </button>
                    ))}
                  </div>
                )}

                {/* BULLETPROOF CONTAINER FIX */}
                <div className="relative w-full rounded-md shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden bg-white" style={{ paddingTop: '141.43%' /* 1123 / 794 */ }}>
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div style={{
                      width: "794px", 
                      height: "1123px",
                      transform: "scale(var(--scale-factor, 1))",
                      transformOrigin: "top left"
                    }}
                    ref={(el) => {
                      if (el && el.parentElement) {
                        const containerWidth = el.parentElement.offsetWidth;
                        const scale = containerWidth / 794;
                        el.style.setProperty('--scale-factor', scale);
                      }
                    }}>
                      <CVPreview data={data} isFresher={isFresher} pageNum={hasPage2Content ? previewPage : 1}/>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-medium">Preview matches downloaded PDF exactly</p>
                  {step === 7 && (
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Download size={13}/> Download
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}