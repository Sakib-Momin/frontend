import React, { useState, useEffect } from 'react';
import { Cpu, Layout, ShieldCheck, Search, FileText, LogOut, User, Shield, Info, Menu, X } from 'lucide-react'; // <-- IMPORTED Menu and X
import ResumeBuilder from './components/ResumeBuilder';
import FraudDetector from './components/FraudDetector';
import AtsScorer from './components/AtsScorer';
import JobMatcher from './components/JobMatcher';
import AboutUs from './components/AboutUs';
import AdminDashboard from './components/AdminDashboard';
import Settings from './components/Settings';
import Footer from './components/Footer';
import Terms from './components/Terms'; // <-- NEW IMPORT
import Privacy from './components/Privacy'; // <-- NEW IMPORT

// --- AUTH & DB IMPORTS ---
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import Auth from './components/Auth';

function App() {
  const [view, setView] = useState(() => {
    return localStorage.getItem('currentView') || "fraud";
  }); 

  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(''); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // <-- NEW STATE FOR HAMBURGER MENU

  useEffect(() => {
    localStorage.setItem('currentView', view);
  }, [view]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            
            setUserName(userData.name || '');

            if (userData.role === 'admin') {
              setIsAdmin(true);
              if (view === "auth" || view === "fraud") {
                  setView("admin-dashboard");
              }
            } else {
              setIsAdmin(false);
              if (view === "auth") {
                const preAuth = localStorage.getItem('preAuthView') || 'fraud';
                setView(preAuth);
                localStorage.removeItem('preAuthView'); 
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setIsAdmin(false);
          setUserName('');
        }
      } else {
        setIsAdmin(false);
        setUserName('');
      }
      
      setLoading(false);
    });
    return () => unsubscribe(); 
  }, [view]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAdmin(false);
      setUserName('');
      setView("fraud"); 
      setIsMobileMenuOpen(false); // Close menu on logout
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  const requireLogin = () => {
    localStorage.setItem('preAuthView', view);
    setView("auth");
    setIsMobileMenuOpen(false);
  };

  // Helper to change views and close the mobile menu automatically
  const handleNav = (targetView) => {
    setView(targetView);
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Cpu className="text-indigo-600 animate-pulse mx-auto mb-4" size={64} />
          <p className="text-slate-500 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // --- HEADER / NAVIGATION BAR ---
  const renderNav = () => (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm flex-shrink-0">
      {/* EXPANDED DESKTOP WIDTH: max-w-[1600px] instead of max-w-7xl */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav(isAdmin ? "admin-dashboard" : "fraud")}>
            <div className="relative">
              <Cpu className="text-indigo-600" size={26} />
              {isAdmin && (
                <div className="absolute -top-1 -right-1 bg-amber-400 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm" />
              )}
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight uppercase">
              AI <span className="text-indigo-600">Intelligence</span>
            </span>
            {isAdmin && (
              <span className="ml-2 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full hidden sm:inline-block">
                Admin
              </span>
            )}
          </div>
          
          {/* DESKTOP NAVIGATION (Hidden on screens smaller than 'lg' 1024px) */}
          <div className="hidden lg:flex items-center space-x-2">
            
            {!isAdmin && (
              <>
                <button onClick={() => handleNav("fraud")} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${view === 'fraud' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <ShieldCheck size={16}/> Fraud Detector
                </button>
                <button onClick={() => handleNav("ats")} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${view === 'ats' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <FileText size={16}/> ATS Scorer
                </button>
                <button onClick={() => handleNav("matcher")} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${view === 'matcher' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <Search size={16}/> Job Matcher
                </button>
                <button onClick={() => handleNav("builder")} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${view === 'builder' ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <Layout size={16}/> Resume Builder
                </button>
                <button onClick={() => handleNav("about")} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${view === 'about' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <Info size={16}/> About Us
                </button>
              </>
            )}

            {isAdmin && (
              <button onClick={() => handleNav("admin-dashboard")} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${view === 'admin-dashboard' ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Shield size={16}/> Admin Dashboard
              </button>
            )}
            
            {/* Desktop Auth / Profile */}
            <div className="pl-3 ml-2 border-l border-slate-200">
              {!user ? (
                <button onClick={() => handleNav("auth")} className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-wide text-xs flex items-center gap-2 transition-all shadow-md ${view === 'auth' ? 'bg-indigo-700 text-white shadow-indigo-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5'}`}>
                  <User size={16}/> Login / Sign Up
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleNav('settings')}
                    className="flex items-center gap-3 pr-4 border-r border-slate-200 text-left hover:opacity-80 transition-opacity cursor-pointer group"
                    title="Account Settings"
                  >
                    <div className="text-right hidden xl:block">
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5 group-hover:text-indigo-500 transition-colors">
                        {isAdmin ? 'System Admin' : 'Settings'}
                      </p>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                        {userName || user.email.split('@')[0]}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-lg shadow-sm group-hover:shadow-md transition-shadow">
                      {(userName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  </button>

                  <button onClick={handleLogout} className="p-2.5 md:px-4 md:py-2 rounded-xl font-bold text-sm flex items-center gap-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all group" title="Logout">
                    <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" /> 
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* HAMBURGER TOGGLE BUTTON (Visible only on mobile/tablet) */}
          <div className="lg:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE DROP-DOWN MENU */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-6 flex flex-col space-y-3">
            
            {!isAdmin && (
              <>
                <button onClick={() => handleNav("fraud")} className={`w-full justify-start px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all ${view === 'fraud' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <ShieldCheck size={18}/> Fraud Detector
                </button>
                <button onClick={() => handleNav("ats")} className={`w-full justify-start px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all ${view === 'ats' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <FileText size={18}/> ATS Scorer
                </button>
                <button onClick={() => handleNav("matcher")} className={`w-full justify-start px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all ${view === 'matcher' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Search size={18}/> Job Matcher
                </button>
                <button onClick={() => handleNav("builder")} className={`w-full justify-start px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all ${view === 'builder' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Layout size={18}/> Resume Builder
                </button>
                <button onClick={() => handleNav("about")} className={`w-full justify-start px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all ${view === 'about' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Info size={18}/> About Us
                </button>
              </>
            )}

            {isAdmin && (
              <button onClick={() => handleNav("admin-dashboard")} className={`w-full justify-start px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all ${view === 'admin-dashboard' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Shield size={18}/> Admin Dashboard
              </button>
            )}

            {/* Mobile Auth / Profile Section */}
            <div className="pt-4 mt-2 border-t border-slate-100">
              {!user ? (
                <button onClick={() => handleNav("auth")} className="w-full justify-center px-5 py-3.5 rounded-xl font-black uppercase tracking-wide text-sm flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md">
                  <User size={18}/> Login / Sign Up
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleNav('settings')}
                    className="w-full flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-xl shadow-sm">
                      {(userName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">{isAdmin ? 'System Admin' : 'Account Settings'}</p>
                      <p className="text-sm font-bold text-slate-800">{userName || user.email}</p>
                    </div>
                  </button>

                  <button onClick={handleLogout} className="w-full justify-center px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors">
                    <LogOut size={18} /> 
                    <span>Log Out Securely</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {renderNav()}

      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 flex-grow">
        {view === "fraud" && <FraudDetector user={user} requireLogin={requireLogin} />}
        {view === "ats" && <AtsScorer user={user} requireLogin={requireLogin} />}
        {view === "matcher" && <JobMatcher user={user} requireLogin={requireLogin} onBuildResume={() => setView("builder")} />}
        {view === "builder" && <ResumeBuilder user={user} requireLogin={requireLogin} onBack={() => setView("fraud")} />}
        {view === "settings" && <Settings user={user} onBack={() => setView("fraud")} />}
        {view === "about" && <AboutUs user={user} />}
        
        {/* FIX: Passed onNavigate down to Auth so the links work! */}
        {view === "auth" && <Auth onNavigate={handleNav} />}
        
        {view === "admin-dashboard" && isAdmin && <AdminDashboard />}
        
        {/* NEW LEGAL PAGES */}
        {view === "terms" && <Terms />}
        {view === "privacy" && <Privacy />}
        
        {view === "admin-dashboard" && !isAdmin && (
          <div className="text-center py-20">
            <Shield className="mx-auto text-red-500 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Access Denied</h2>
            <p className="text-slate-500">You don't have permission to access this page.</p>
            <button 
              onClick={() => handleNav("fraud")}
              className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </main>

      <Footer onNavigate={handleNav} />
    </div>
  );
}

export default App;