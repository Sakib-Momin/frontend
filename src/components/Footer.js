// src/components/Footer.js
import React from 'react';
import { Heart, Github, Linkedin, Mail } from 'lucide-react';

export default function Footer({ onNavigate }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* LEFT SIDE: Copyright & Credit */}
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center md:text-left">
            <span className="text-sm font-semibold text-slate-500">
              © {currentYear} AI Intelligence.
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
              Crafted with <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse" /> by 
              <span className="font-black text-slate-800 tracking-tight ml-0.5">Sakib Momin</span>
            </span>
          </div>

          {/* RIGHT SIDE: Legal Links & Socials Grouped Together */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            
            {/* Legal Links */}
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
              <button onClick={() => onNavigate('terms')} className="hover:text-indigo-600 transition-colors">Terms of Service</button>
              <span className="text-slate-300">•</span>
              <button onClick={() => onNavigate('privacy')} className="hover:text-indigo-600 transition-colors">Privacy Policy</button>
            </div>

            {/* Subtle Vertical Divider (Hidden on Mobile) */}
            <div className="hidden sm:block w-px h-4 bg-slate-200"></div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              <a 
                href="mailto:mominsakib5@gmail.com" 
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="Email Me"
              >
                <Mail size={18} />
              </a>
              <a 
                href="https://www.linkedin.com/in/sakib-momin-a93248257" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-[#0077b5] hover:bg-blue-50 rounded-lg transition-all"
                title="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a 
                href="https://github.com/Sakib-Momin" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                title="GitHub"
              >
                <Github size={18} />
              </a>
            </div>
            
          </div>

        </div>
      </div>
    </footer>
  );
}