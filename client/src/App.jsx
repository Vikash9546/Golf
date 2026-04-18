import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, Coins, Heart, PlusCircle, ArrowRight, 
  CreditCard, LayoutDashboard, Settings, Crown, BarChart3, CheckCircle2, Zap,
  Users, LogIn, Trophy, Compass, ArrowUpRight, PlayCircle, Globe, FileText, Lock, Building, Bell, ArrowLeft, PenTool, Check, Upload, Trash2
} from 'lucide-react';

// Global Authenticated API Interceptor
export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('hero_jwt_session');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    // Send JWT token securely in every subsequent request header
    if (token) {
        headers['Authorization'] = `Bearer ${token}`; 
    }
    
    return fetch(url, { ...options, headers });
};

const App = () => {
  // Detect if we're on the /admin route
  const isAdminRoute = window.location.pathname === '/admin';

  const [role, setRole] = useState(() => {
     // Persist login across page refreshes by reading the stored JWT
     const token = localStorage.getItem('hero_jwt_session');
     if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                localStorage.removeItem('hero_jwt_session');
                localStorage.removeItem('hero_user_data');
                return isAdminRoute ? 'ADMIN_LOGIN' : 'VISITOR';
            }
            return payload.role === 'ADMIN' ? 'ADMIN' : 'SUBSCRIBER';
        } catch(e) {
            localStorage.removeItem('hero_jwt_session');
            localStorage.removeItem('hero_user_data');
        }
     }
     // If on /admin route, show admin login directly
     return isAdminRoute ? 'ADMIN_LOGIN' : 'VISITOR';
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hero_user_data');
    try {
        return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scores, setScores] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(true); // Default true, update on API fail

  const fetchScores = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:5001/api/scores');
      if (response.ok) {
        const data = await response.json();
        setScores(data);
        setIsSubscribed(true);
      } else if (response.status === 403) {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Failed to fetch scores:", error);
    }
  };

  useEffect(() => {
    if (role === 'SUBSCRIBER' || role === 'ADMIN') {
      fetchScores();
    }
  }, [role]);
  
  // Reset tab on role change to ensure valid state
  useEffect(() => {
    if (role === 'SUBSCRIBER') setActiveTab('dashboard');
    if (role === 'ADMIN') setActiveTab('admin_dashboard');
  }, [role]);

  // State to temporarily show landing page while staying logged in
  const [showLanding, setShowLanding] = useState(false);

  // Logged-in user wants to view the landing page
  if (showLanding) {
    return <PublicVisitorView setRole={setRole} isLoggedIn={true} user={user} scores={scores} onBackToDashboard={() => setShowLanding(false)} />;
  }

  // View Routing Logic based on Role
  if (role === 'VISITOR') {
    return <PublicVisitorView setRole={setRole} isLoggedIn={false} user={null} scores={[]} />;
  }

  if (role === 'LOGIN' || role === 'SIGNUP') {
    return <AuthView initialMode={role} setRole={setRole} setUser={setUser} />;
  }

  // Dedicated Admin Portal login at /admin
  if (role === 'ADMIN_LOGIN') {
    return <AuthView initialMode="LOGIN" setRole={setRole} setUser={setUser} adminOnly={true} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-primary text-gray-100 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-secondary/30 backdrop-blur-md border-r border-white/5 p-6 flex flex-col">
        <div className="mb-8">
            <h1 className="text-2xl font-premium font-bold tracking-tight text-white mb-1 flex items-center justify-between">
                <span>Digital<span className="text-gradient-gold">Heroes</span></span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${role === 'ADMIN' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                    {role} PORTAL
                </span>
            </div>
        </div>

        <nav className="flex-1 space-y-2">
            {/* Home — Landing Page (always visible) */}
            <button 
              onClick={() => setShowLanding(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-gray-400 hover:text-white hover:bg-white/5"
            >
                <Globe size={18} /> Home
            </button>

            {role === 'SUBSCRIBER' && [
                { id: 'dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
                { id: 'scores', icon: Activity, label: 'Score Entry' },
                { id: 'charity', icon: Heart, label: 'Charity Impact' },
                { id: 'subscription', icon: CreditCard, label: 'Subscription' },
                { id: 'profile', icon: Settings, label: 'Profile & Settings' },
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      activeTab === tab.id 
                      ? 'bg-white/10 text-white shadow-inner font-medium' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                    <tab.icon size={18} className={activeTab === tab.id ? 'text-accent' : ''} />
                    {tab.label}
                </button>
            ))}

            {role === 'ADMIN' && [
                { id: 'admin_dashboard', icon: LayoutDashboard, label: 'Overview' },
                { id: 'admin_users', icon: Users, label: 'User Directory' },
                { id: 'admin_draws', icon: Trophy, label: 'Draw Management' },
                { id: 'admin_charities', icon: Building, label: 'Charity Directory' },
                { id: 'admin_reports', icon: BarChart3, label: 'Analytics' },
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      activeTab === tab.id 
                      ? 'bg-red-900/40 text-white shadow-inner font-medium border border-red-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                    <tab.icon size={18} className={activeTab === tab.id ? 'text-red-400' : ''} />
                    {tab.label}
                </button>
            ))}
        </nav>
        
        <div className="mt-8 pt-8 border-t border-white/5">
            <button 
              onClick={() => {
                  localStorage.removeItem('hero_jwt_session');
                  localStorage.removeItem('hero_user_data');
                  setRole('VISITOR');
                  setUser(null);
              }}
              className="flex items-center gap-3 text-gray-500 hover:text-red-400 transition-colors text-sm w-full"
            >
                <LogIn size={18} className="rotate-180" /> Sign Out
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full relative">
         {/* Subscriber Views */}
         {role === 'SUBSCRIBER' && activeTab === 'dashboard' && <DashboardView scores={scores} isSubscribed={isSubscribed} onSubscribe={() => setActiveTab('subscription')} />}
         {role === 'SUBSCRIBER' && activeTab === 'scores' && <ScoreEntryView scores={scores} setScores={setScores} refreshScores={fetchScores} isSubscribed={isSubscribed} onSubscribe={() => setActiveTab('subscription')} />}
         {role === 'SUBSCRIBER' && activeTab === 'subscription' && <SubscriptionView isSubscribed={isSubscribed} onRefreshStatus={fetchScores} />}
         {role === 'SUBSCRIBER' && activeTab === 'charity' && <CharityView />}
         {role === 'SUBSCRIBER' && activeTab === 'profile' && <ProfileSettingsView user={user} setUser={setUser} />}
         
         {/* Admin Views */}
         {role === 'ADMIN' && activeTab === 'admin_dashboard' && <AdminOverview />}
         {role === 'ADMIN' && activeTab === 'admin_users' && <AdminUsersManagement />}
         {role === 'ADMIN' && activeTab === 'admin_draws' && <AdminDrawManagement />}
         {role === 'ADMIN' && activeTab === 'admin_charities' && <AdminCharityManagement />}
         {role === 'ADMIN' && activeTab === 'admin_reports' && <AdminReports />}
      </main>
    </div>
  );
};

// ==========================================
// A. PUBLIC VISITOR VIEW
// ==========================================
const PublicVisitorView = ({ setRole, isLoggedIn = false, user, scores = [], onBackToDashboard }) => {
    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    // Derived User display data
    const displayName = user?.first_name && user?.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user?.email ? user.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ') : 'Visitor';
        
    const initials = user?.first_name && user?.last_name
        ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() :
        displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    return (
        <div className="min-h-screen bg-primary text-gray-100 font-sans selection:bg-accent selection:text-black">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-primary/80 backdrop-blur-lg border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                        <Trophy className="text-accent" size={28} />
                        <h1 className="text-2xl font-premium font-bold tracking-tight text-white">
                            Digital<span className="text-accent">Heroes</span>
                        </h1>
                    </div>
                    <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
                        <button onClick={() => scrollToSection('concept')} className="hover:text-white transition-colors">Concept</button>
                        <button onClick={() => scrollToSection('mechanics')} className="hover:text-white transition-colors">How It Works</button>
                        <button onClick={() => scrollToSection('charities')} className="hover:text-white transition-colors">Impact</button>
                    </div>
                    <div className="flex gap-4 items-center">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-400 hidden lg:block font-bold tracking-tight uppercase">Dashboard Mode: <span className="text-accent">{displayName}</span></span>
                                <button onClick={onBackToDashboard} className="px-5 py-2.5 rounded-full bg-accent/20 hover:bg-accent/30 text-accent text-sm font-medium transition-all border border-accent/30 flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                                    <ArrowLeft size={16} /> Back to Dashboard
                                </button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => setRole('LOGIN')} className="font-medium text-sm flex items-center gap-2 text-white hover:text-accent transition-colors hidden md:flex">
                                    <LogIn size={16} /> Login
                                </button>
                                <button onClick={() => setRole('LOGIN')} className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all backdrop-blur-md border border-white/10 hidden md:flex items-center gap-2">
                                    <Crown size={16} className="text-accent"/> Admin
                                </button>
                                <button className="md:hidden text-white p-2" aria-label="Mobile Navigation Toggle">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero (Platform Concept) */}
            <section id="concept" className="pt-40 pb-20 px-6 min-h-[90vh] flex items-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className={`max-w-7xl mx-auto grid ${isLoggedIn ? 'md:grid-cols-2' : 'grid-cols-1 text-center'} gap-16 items-center relative z-10`}>
                    <div className={!isLoggedIn ? 'max-w-3xl mx-auto' : ''}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-accent text-sm font-medium mb-6 ${!isLoggedIn ? 'mx-auto' : ''}`}>
                            <Shield size={14} /> The Future of Philanthropic Rewards
                        </div>
                        <h2 className="text-5xl md:text-7xl font-premium font-bold leading-tight mb-6">
                            Drive Impact. <br />
                            <span className="text-gradient-gold">Win Big.</span> <br />
                            Change the World.
                        </h2>
                        <p className={`text-lg text-gray-400 mb-8 max-w-lg leading-relaxed ${!isLoggedIn ? 'mx-auto' : ''}`}>
                            Transform your scorecards into digital draw tickets. Participate in massive monthly global draws, climb the rankings, and systematically fund vetted charities across the planet.
                        </p>
                        <div className={`flex gap-4 ${!isLoggedIn ? 'justify-center' : ''}`}>
                            {!isLoggedIn && (
                                <button onClick={() => setRole('SIGNUP')} className="btn-premium-black relative overflow-hidden group shadow-[0_0_40px_rgba(212,175,55,0.2)] hover:shadow-[0_0_60px_rgba(212,175,55,0.4)]">
                                    <span className="relative z-10 flex items-center gap-2 font-bold uppercase tracking-widest text-xs">Join the Platform <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
                                    <div className="absolute inset-0 bg-accent/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                </button>
                            )}
                            <button className="btn-gold-outline flex items-center gap-2 px-6">
                                <PlayCircle size={18} /> Our Mission
                            </button>
                        </div>
                    </div>
                    {isLoggedIn && (
                        <div className="relative hidden md:block animate-in slide-in-from-right duration-700">
                            <div className="glass-panel p-8 transform rotate-1 hover:rotate-0 transition-transform duration-500 relative z-20 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/20 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">{initials}</div>
                                        <div>
                                            <div className="text-white font-premium font-bold capitalize">{displayName}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-green-400">
                                                Live Platform Ticket
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Est. Jackpot</div>
                                        <div className="text-accent font-bold text-2xl tracking-tight">$1.2M</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-5 gap-3">
                                    {[0, 1, 2, 3, 4].map((i) => {
                                        const scoreEntry = scores && scores[i];
                                        return (
                                            <div key={i} className="aspect-square bg-gradient-to-b from-white/10 to-transparent border border-white/5 rounded-2xl flex flex-col items-center justify-center font-premium shadow-xl transition-all hover:border-accent/40 group/num overflow-hidden relative">
                                                {scoreEntry ? (
                                                    <>
                                                        <span className="text-2xl font-bold text-white group-hover/num:scale-110 transition-transform">{scoreEntry.stableford_score}</span>
                                                        <span className="text-[7px] text-accent/60 absolute bottom-2 font-bold uppercase tracking-tighter">Pos {i+1}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xl font-bold text-white/20">--</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 flex items-center justify-between text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                                    <span>Ticket ID: DH-2026-XP</span>
                                    <span className="text-accent">Verified Status ✅</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Mechanics Section */}
            <section id="mechanics" className="py-24 px-6 bg-secondary/50 border-y border-white/5 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-premium font-bold mb-4">Understand Draw Mechanics</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">Our proprietary system is mathematically transparent. Here is how your gameplay transforms direct philanthropy into staggering rewards.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Activity, title: "1. Log Your Activity", desc: "Submit your final points into the secure vault. We maintain a strict rolling tally of your most recent 5 entries to construct your ticket." },
                            { icon: Compass, title: "2. The Master Algorithm", desc: "At the close of the month, our proprietary engine mathematically collates the 5 most frequent data points globally across the platform." },
                            { icon: Trophy, title: "3. Claim & Empower", desc: "Match your ticket with the drawn dataset to command a portion of the jackpot. A guaranteed minimum of 10% routes forcefully to your chosen global foundation." }
                        ].map((step, i) => (
                            <div key={i} className="glass-panel p-8 border hover:border-accent/40 hover:-translate-y-2 transition-all duration-300 group shadow-lg">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                                    <step.icon size={28} className="text-accent group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">{step.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300 transition-colors">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Charities Section */}
            <section id="charities" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-4xl font-premium font-bold mb-4">Explore Listed Charities</h2>
                            <p className="text-gray-400">The core of Digital Heroes is philanthropy. Select where your impact goes.</p>
                        </div>
                        <div className="hidden md:block">
                            <div className="text-right">
                                <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Total Impact</div>
                                <div className="text-3xl font-premium font-bold text-green-400">$2.4M+</div>
                            </div>
                        </div>
                    </div>
                    <div className="mb-12 glass-panel p-0 overflow-hidden flex flex-col md:flex-row relative">
                        <div className="absolute top-0 right-0 bg-accent text-black text-xs font-bold px-3 py-1 rounded-bl-lg z-20">SPOTLIGHT CHARITY</div>
                        <div className="md:w-1/2 h-64 md:h-auto relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10 md:hidden"></div>
                            <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80" alt="Education" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-700" />
                        </div>
                        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-10 bg-black/80 md:bg-transparent">
                            <span className="text-[10px] uppercase tracking-widest text-accent font-bold mb-2">Education</span>
                            <h3 className="text-3xl font-bold mb-4 text-white">Global Education Fund</h3>
                            <p className="text-gray-400 mb-6 leading-relaxed">Empowering children worldwide with quality education and necessary resources. This month, a portion of the main jackpot is natively dedicated to their upcoming infrastructure expansion initiatives.</p>
                            <div className="flex gap-4">
                                <button className="btn-premium-black text-sm py-2 px-6">Support Mission</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { name: 'St. Jude Hospitals', label: 'Health', desc: 'Advancing cures, and means of prevention, for pediatric catastrophic diseases.' },
                            { name: 'Ocean Clean-up Project', label: 'Environment', desc: 'Developing advanced technologies to rid the world\'s oceans of plastic.' },
                            { name: 'Wildlife Rescue', label: 'Conservation', desc: 'Protecting endangered species and their habitats globally.' }
                        ].map((charity, i) => (
                            <div key={i} className="border border-white/10 p-6 rounded-3xl bg-black hover:border-white/30 transition-all flex flex-col justify-between group">
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest text-accent font-bold mb-4 block group-hover:text-white transition-colors">{charity.label}</span>
                                    <h3 className="text-xl font-bold mb-2">{charity.name}</h3>
                                    <p className="text-sm text-gray-400 mb-6">{charity.desc}</p>
                                </div>
                                <button className="text-sm text-white font-medium flex items-center gap-2 hover:text-accent transition-colors">
                                    View Foundation <ArrowUpRight size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

// ==========================================
// B. SUBSCRIBER VIEWS
// ==========================================

const DashboardView = ({ scores, isSubscribed, onSubscribe }) => {
    // PRD: PENDING_PROOF initially implies the user just won > $1k and needs to upload proof
    const [verificationStatus, setVerificationStatus] = React.useState('PENDING_PROOF');

    return (
        <div className="max-w-5xl space-y-8 animate-in fade-in zoom-in-95 duration-500 relative">
            {!isSubscribed && (
                <div className="absolute inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-center justify-center rounded-3xl border border-white/5">
                    <div className="glass-panel p-10 max-w-md text-center shadow-2xl border-accent/20">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="text-accent" size={32} />
                        </div>
                        <h3 className="text-2xl font-premium font-bold text-white mb-2">Subscription Required</h3>
                        <p className="text-gray-400 mb-8">Access to live ticket pools and score logging requires an active annual pass.</p>
                        <button onClick={onSubscribe} className="btn-premium-gold w-full py-4 uppercase tracking-widest text-xs font-bold">Activate Now</button>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-premium font-bold text-white">My Dashboard</h2>
                    <p className="text-gray-400">Welcome back! Your ticket for the October draw is locked.</p>
                </div>
                <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <Heart size={16} fill="currentColor" /> Lifetime Impact: $2,450.00
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Active Ticket */}
                <div className="glass-panel p-6 lg:col-span-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-accent/10 transition-all duration-700"></div>
                    <div className="relative z-10 w-full flex flex-col h-full justify-between">
                        <div>
                            <h3 className="text-xl font-premium font-semibold text-white mb-1 flex items-center gap-2">
                                <Activity className="text-accent" size={20}/> Active Draw Ticket
                            </h3>
                            <p className="text-gray-400 text-sm mb-6">Your rolling 5 latest Stableford scores.</p>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {[0, 1, 2, 3, 4].map((i) => {
                                const scoreObj = scores && scores[i];
                                return (
                                    <div key={i} className="flex flex-col items-center justify-center py-5 bg-black/40 border border-white/5 rounded-xl hover:border-accent/40 hover:bg-black/80 transition-all relative">
                                        {scoreObj ? (
                                            <>
                                                <span className="absolute top-2 right-2 text-[8px] text-gray-500">{new Date(scoreObj.played_at).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                                <span className="text-gray-600 text-[10px] tracking-widest mb-1 mt-2">POS 0{i + 1}</span>
                                                <span className="text-3xl font-premium font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">{scoreObj.stableford_score}</span>
                                            </>
                                        ) : (
                                            <span className="text-2xl font-premium font-bold text-white/10">--</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Subscription & Charity Overview */}
                <div className="glass-panel p-6 lg:col-span-1 space-y-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Subscription</h3>
                        <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                            <div className="font-bold text-white">Annual Pass</div>
                            <span className="bg-green-500/20 text-green-500 border border-green-500/30 px-2 py-0.5 rounded text-xs">Active</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-2 text-right">Renews: Oct 24, 2026</div>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Philanthropy Target</h3>
                        <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                            <span className="font-bold text-white text-sm truncate">Global Education Fund</span>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Contribution Rate:</span>
                                <span className="text-accent font-bold">15%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Participation & Winnings */}
                <div className="glass-panel p-6 flex flex-col justify-between lg:col-span-1">
                    <div>
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-4 text-accent">
                            <Coins size={20} />
                        </div>
                        <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Total Winnings</h3>
                        <div className="text-3xl font-premium font-bold text-white mb-1 tracking-tight">$450<span className="text-lg text-gray-500">.00</span></div>
                        <div className="flex justify-between text-xs mt-2">
                             <span className="text-gray-500">Status:</span>
                             <span className="text-green-400 font-bold bg-green-500/10 px-2 rounded">PAID</span>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10">
                        <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Participation Metric</h3>
                        <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Draws Entered:</span><span className="text-white font-bold">12</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Next Draw:</span><span className="text-white font-bold">Nov 1, 2026</span></div>
                    </div>
                </div>
                
                {/* Winner Verification Status & Proof Upload */}
                <div className="glass-panel p-6 lg:col-span-3 border border-dashed border-gray-600 bg-transparent flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                            <Upload className="text-gray-400" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Winner Verification Eligibility</h3>
                            <p className="text-sm text-gray-400">Required: Upload official golf platform screenshots for verification (Winnings &gt; $1,000).</p>
                        </div>
                    </div>
                    <div>
                        {verificationStatus === 'NOT_REQUIRED' && <span className="text-xs text-gray-500 font-medium px-4 py-2">No pending verification</span>}
                        {verificationStatus === 'PENDING_PROOF' && <button onClick={() => setVerificationStatus('PENDING_REVIEW')} className="px-6 py-2 bg-accent text-black font-medium text-sm rounded-xl hover:bg-yellow-500 transition-colors shadow shadow-accent/20">Upload Screenshot</button>}
                        {verificationStatus === 'PENDING_REVIEW' && <span className="text-xs text-yellow-500 font-medium px-4 py-2 bg-yellow-500/10 rounded-full border border-yellow-500/20">Admin Review Pending</span>}
                        {verificationStatus === 'APPROVED' && <span className="text-xs text-green-500 font-medium px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">Approved - Transferring Funds...</span>}
                        {verificationStatus === 'REJECTED' && <span className="text-xs text-red-500 font-medium px-4 py-2 bg-red-500/10 rounded-full border border-red-500/20">Proof Rejected - Contact Support</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ScoreEntryView = ({ scores, setScores, refreshScores, isSubscribed, onSubscribe }) => {
    const [score, setScore] = React.useState('');
    const [date, setDate] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [editingId, setEditingId] = React.useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const url = editingId ? `http://localhost:5001/api/scores/${editingId}` : 'http://localhost:5001/api/scores';
            const method = editingId ? 'PUT' : 'POST';
            
            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify({
                    stableford_score: parseInt(score, 10),
                    played_at: date
                })
            });

            if (response.ok) {
                alert(`Success: Score of ${score} ${editingId ? 'updated' : 'logged'}!`);
                setScore('');
                setDate('');
                setEditingId(null);
                refreshScores(); // Trigger re-fetch from API
            } else {
                const err = await response.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to sync score with server.');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this score?')) return;
        try {
            const response = await fetchWithAuth(`http://localhost:5001/api/scores/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                refreshScores();
            }
        } catch (error) {
            alert('Delete failed.');
        }
    }

    const handleEdit = (scoreObj) => {
        setEditingId(scoreObj.id);
        setScore(scoreObj.stableford_score.toString());
        setDate(scoreObj.played_at);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {!isSubscribed && (
                <div className="absolute inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-center justify-center rounded-3xl border border-white/5">
                    <div className="glass-panel p-10 max-w-md text-center shadow-2xl border-accent/20">
                        <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Crown className="text-accent" size={40} />
                        </div>
                        <h3 className="text-2xl font-premium font-bold text-white mb-2">Unlock Score Logging</h3>
                        <p className="text-gray-400 mb-8">Your account must be activated to join the rolling 5 pool and become eligible for draws.</p>
                        <button onClick={onSubscribe} className="btn-premium-gold w-full py-4 uppercase tracking-widest text-xs font-bold">Upgrade Account</button>
                    </div>
                </div>
            )}

            <div className="text-center mb-10 pt-10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <Activity className="text-accent" size={28} />
                </div>
                <h2 className="text-3xl font-premium font-bold text-white mb-3">{editingId ? 'Edit Score' : 'Enter Golf Score'}</h2>
                <p className="text-gray-400">Only authorized Stableford scores.</p>
            </div>
            <div className="glass-panel p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Stableford Points</label>
                        <input type="number" required min="1" max="45" placeholder="e.g. 36"
                          value={score} onChange={(e) => setScore(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-3xl font-premium text-white placeholder-gray-700 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-center"
                          autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Date Played</label>
                        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} 
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-accent transition-all" />
                    </div>
                    <div className="flex gap-4">
                        {editingId && (
                            <button type="button" onClick={() => { setEditingId(null); setScore(''); setDate(''); }} className="flex-1 px-4 py-2 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10">Cancel</button>
                        )}
                        <button type="submit" disabled={isSubmitting} className="btn-premium-black flex-1 h-14 text-lg disabled:opacity-50">
                            {isSubmitting ? 'Syncing securely...' : (editingId ? 'Update Score' : 'Submit Score \u2192')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Participation Log */}
            <div className="glass-panel p-8">
                <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Manage Logged Scores</h3>
                <div className="space-y-4">
                    {scores.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">No scores logged yet. Start playing!</p>
                    ) : (
                        scores.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-accent/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black/50 rounded-lg flex items-center justify-center text-accent font-bold text-xl">{s.stableford_score}</div>
                                    <div>
                                        <div className="text-white font-medium">{new Date(s.played_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Stableford Entry</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(s)} className="p-2 text-gray-400 hover:text-white transition-colors" title="Edit"><PenTool size={16}/></button>
                                    <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const ProfileSettingsView = ({ user, setUser }) => {
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        golf_club: user?.golf_club || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetchWithAuth('http://localhost:5001/api/auth/profile', {
                method: 'PATCH',
                body: JSON.stringify(formData)
            });
            const updatedUser = await response.json();
            
            if (response.ok) {
                setUser(updatedUser);
                localStorage.setItem('hero_user_data', JSON.stringify(updatedUser));
                alert('Profile updated successfully!');
            } else {
                alert(`Error: ${updatedUser.message}`);
            }
        } catch (error) {
            alert('Failed to save profile changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const initials = user?.first_name && user?.last_name 
        ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
        : user?.email ? user.email.substring(0, 2).toUpperCase() : 'JD';

    const fullName = user?.first_name && user?.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user?.email ? user.email.split('@')[0] : 'John Doe';

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <h2 className="text-3xl font-premium font-bold text-white mb-8">Profile & Settings</h2>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="col-span-1 space-y-4">
                    <div className="glass-panel p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center text-accent text-3xl font-premium font-bold mb-4 shadow-inner border border-accent/10">
                            {initials}
                        </div>
                        <h3 className="font-bold text-xl text-white capitalize">{fullName}</h3>
                        <p className="text-sm text-gray-400 mb-4">{user?.email}</p>
                        <div className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full uppercase tracking-wider font-bold">Verified Player</div>
                    </div>
                </div>
                <div className="col-span-2 space-y-6">
                    <div className="glass-panel p-6 space-y-4">
                        <h3 className="font-bold border-b border-white/10 pb-2 mb-4 text-white">Personal Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">First Name</label>
                                <input 
                                    type="text" 
                                    value={formData.first_name} 
                                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 mt-1 text-white focus:border-accent/50 outline-none transition-colors" 
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">Last Name</label>
                                <input 
                                    type="text" 
                                    value={formData.last_name} 
                                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 mt-1 text-white focus:border-accent/50 outline-none transition-colors" 
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">Home Golf Club</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Augusta National" 
                                    value={formData.golf_club} 
                                    onChange={(e) => setFormData({...formData, golf_club: e.target.value})}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 mt-1 text-white focus:border-accent/50 outline-none transition-colors" 
                                />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/10 text-right">
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className={`px-6 py-2.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SubscriptionView = ({ isSubscribed, onRefreshStatus }) => {
    const [isActivating, setIsActivating] = React.useState(false);

    const handleActivate = async () => {
        setIsActivating(true);
        try {
            const response = await fetchWithAuth('http://localhost:5001/api/subscription/activate', {
                method: 'POST'
            });
            if (response.ok) {
                alert('Payment Simulated: You are now an ACTIVE hero!');
                onRefreshStatus(); // This will update the isSubscribed state globally
            }
        } catch (error) {
            alert('Simulation failed.');
        } finally {
            setIsActivating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-premium font-bold text-white mb-4">Subscription Management</h2>
                <p className="text-gray-400">Powered securely by Razorpay. Required to participate in the Monthly Draw.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-panel p-8 border-accent/50 relative overflow-hidden bg-gradient-to-b from-secondary/70 to-black/90 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                    {isSubscribed && <div className="absolute top-0 right-0 bg-accent text-black text-xs font-bold px-3 py-1 rounded-bl-lg">CURRENT PLAN</div>}
                    <h3 className="text-xl font-bold text-white mb-2">Annual Pass</h3>
                    <div className="text-4xl font-premium font-bold text-white mb-6">$99<span className="text-base text-gray-500 font-normal">/year</span></div>
                    <ul className="space-y-3 mb-8 text-sm text-gray-300">
                        <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-accent"/> Unlimited Score Entry</li>
                        <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-accent"/> Guaranteed Draw Participation</li>
                        <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-accent"/> Charity Selection Unlock</li>
                    </ul>
                    
                    {isSubscribed ? (
                        <button className="btn-premium-black w-full opacity-50 cursor-not-allowed">Active</button>
                    ) : (
                        <button onClick={handleActivate} disabled={isActivating} className="btn-premium-gold w-full py-4 text-xs font-bold uppercase tracking-widest shadow-lg shadow-accent/20">
                            {isActivating ? 'Processing Payment...' : 'Proceed to Payment \u2192'}
                        </button>
                    )}
                    
                    <p className="text-xs text-center mt-4 text-gray-500">{isSubscribed ? 'Renews Oct 24, 2026' : 'Immediate Access upon payment'}</p>
                </div>
                {/* Billing History Card */}
                <div className="glass-panel p-8">
                    <h3 className="text-xl font-bold text-white mb-6">Billing History</h3>
                    <div className="space-y-4">
                        {isSubscribed ? (
                            [
                                { date: 'Apr 18, 2026', amt: '$99.00', status: 'Paid' },
                                { date: 'Apr 18, 2025', amt: '$99.00', status: 'Paid' }
                            ].map((bill, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                    <div>
                                        <div className="text-sm text-white font-medium">Annual Pass</div>
                                        <div className="text-xs text-gray-500">{bill.date}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-white">{bill.amt}</div>
                                        <div className="text-xs text-green-400">{bill.status}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-10 italic">No history available.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CharityView = () => {
    const foundations = [
        { id: 1, name: 'Global Education Fund', category: 'Education', desc: 'Empowering children worldwide with quality education.', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80', events: ['Annual Charity Golf Classic - Dec 12'] },
        { id: 2, name: 'St. Jude Hospitals', category: 'Health', desc: 'Advancing cures, and means of prevention.', img: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=400&q=80', events: [] },
        { id: 3, name: 'Ocean Clean-up Project', category: 'Environment', desc: 'Developing advanced technologies to rid oceans of plastic.', img: 'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?auto=format&fit=crop&w=400&q=80', events: ['Beach Sweep - Nov 5', 'Golfing for Oceans - Nov 20'] }
    ];
    
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedCharityId, setSelectedCharityId] = React.useState(1);
    const [percent, setPercent] = React.useState(15);
    
    const filteredFoundations = foundations.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeProfile = foundations.find(f => f.id === selectedCharityId);

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-premium font-bold text-white mb-2">Philanthropic Target</h2>
                    <p className="text-gray-400 text-sm">Direct your platform winnings natively toward verified global missions.</p>
                </div>
                <div className="relative">
                     <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search charities or categories..." className="bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white w-full md:w-64 focus:border-accent outline-none transition-all" />
                     <Globe size={16} className="absolute left-3 top-2.5 text-gray-500" />
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Directory List */}
                <div className="glass-panel p-6 lg:col-span-1 h-[600px] overflow-y-auto">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Directory</h3>
                    <div className="space-y-3">
                        {filteredFoundations.map((foundation) => (
                            <div key={foundation.id} onClick={() => setSelectedCharityId(foundation.id)} 
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex gap-4 ${selectedCharityId === foundation.id ? 'bg-green-500/10 border-green-500/50 text-white' : 'bg-black/50 border-white/5 text-gray-400 hover:border-white/20 hover:bg-black/80'}`}
                            >
                                <img src={foundation.img} alt={foundation.name} className="w-12 h-12 rounded-lg object-cover opacity-80" />
                                <div className="flex-1">
                                    <div className="text-[9px] uppercase tracking-widest text-accent font-bold mb-1">{foundation.category}</div>
                                    <span className="font-medium text-sm leading-tight block">{foundation.name}</span>
                                </div>
                                {selectedCharityId === foundation.id && <CheckCircle2 size={18} className="text-green-500 my-auto" />}
                            </div>
                        ))}
                        {filteredFoundations.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No foundations match.</p>}
                    </div>
                </div>

                {/* Profile & Controls */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Profile */}
                    {activeProfile && (
                        <div className="glass-panel p-0 overflow-hidden relative">
                            <div className="h-48 w-full relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                                <img src={activeProfile.img} loading="lazy" alt={activeProfile.name} className="w-full h-full object-cover opacity-50" />
                                <div className="absolute bottom-6 left-6 z-20">
                                    <span className="text-xs font-bold bg-accent text-black px-2 py-1 rounded mb-2 inline-block uppercase tracking-wider">{activeProfile.category}</span>
                                    <h3 className="text-2xl font-bold text-white shadow-sm">{activeProfile.name}</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-400 text-sm mb-6 leading-relaxed bg-white/5 p-4 rounded-lg">{activeProfile.desc}</p>
                                
                                {activeProfile.events.length > 0 && (
                                    <div className="mb-2">
                                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2"><Trophy size={14}/> Upcoming Events</h4>
                                        <div className="space-y-2">
                                            {activeProfile.events.map((ev, i) => (
                                                <div key={i} className="text-sm text-gray-300 bg-black/60 px-4 py-2 rounded border border-white/5 flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-accent"></div> {ev}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Automated Config */}
                        <div className="glass-panel p-6 border-t-4 border-t-green-500">
                            <h3 className="text-lg font-bold text-white mb-2">Automated Payout Slider</h3>
                            <p className="text-xs text-gray-400 mb-6 flex items-center gap-2"><Zap size={14} className="text-accent"/> PRD Enforced: Minimum 10% Required</p>
                            <div className="bg-black/50 border border-white/10 rounded-xl p-6">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-gray-400 text-xs font-medium uppercase">Deduct from winnings</span>
                                    <span className="text-3xl text-white font-premium font-bold">{percent}%</span>
                                </div>
                                <input type="range" min="10" max="100" value={percent} onChange={(e) => setPercent(e.target.value)} className="w-full accent-green-500 cursor-pointer" />
                            </div>
                        </div>

                        {/* Direct Donation */}
                        <div className="glass-panel p-6 border border-white/10 bg-gradient-to-br from-black to-secondary/30 flex flex-col justify-center text-center items-center">
                            <Heart size={32} className="text-gray-500 mb-4" />
                            <h3 className="font-bold text-white mb-2">Independent Donation</h3>
                            <p className="text-xs text-gray-400 mb-6 px-4">Make a direct out-of-pocket voluntary donation to {activeProfile?.name || 'this foundation'} instantly, separate from your draw winnings.</p>
                            <button className="btn-premium-black w-full shadow shadow-white/5" onClick={() => alert('Razorpay Secure Payment Vault Opened for Independent Contribution.')}>
                                Donate Independently
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// C. ADMINISTRATOR VIEWS
// ==========================================

const AdminOverview = () => {
    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <h2 className="text-3xl font-premium font-bold text-red-500 mb-6 flex items-center gap-3">
                <Crown /> System Operations Hub
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Active Subscribers', val: '4,291', trend: '+12%', icon: Users },
                    { label: 'Monthly Prize Pool', val: '$125,500', trend: 'Pending Draw', icon: Coins },
                    { label: 'Charity Escrow', val: '$42,100', trend: 'Ready for payout', icon: Heart },
                    { label: 'Flagged Accounts', val: '3', trend: 'Requires verification', icon: Shield, color: 'text-red-500' }
                ].map((stat, i) => (
                    <div key={i} className="glass-panel p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg bg-white/5 ${stat.color || 'text-gray-400'}`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{stat.val}</div>
                            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                            <div className="text-[10px] uppercase text-gray-400 mt-3 border-t border-white/10 pt-2">{stat.trend}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminUsersManagement = () => {
    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-premium font-bold text-white">User Management</h2>
                 <div className="relative">
                     <input type="text" placeholder="Search by email..." className="bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white w-64" />
                     <Activity size={16} className="absolute left-3 top-2.5 text-gray-500" />
                 </div>
            </div>
            <div className="glass-panel border-hidden overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="p-4 font-medium">User / Email</th>
                            <th className="p-4 font-medium">Subscription</th>
                            <th className="p-4 font-medium">Draw Entries</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {[1,2,3,4].map((u) => (
                            <tr key={u} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-white">Player {u}</div>
                                    <div className="text-gray-500 text-xs">user{u}@example.com</div>
                                </td>
                                <td className="p-4"><span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs">Active (Razorpay)</span></td>
                                <td className="p-4 text-white font-premium">42, 38, 45, 40, 39</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="text-gray-400 hover:text-white px-2 py-1 border border-white/10 rounded transition-colors flex items-center gap-1" title="Edit Profile & Scores"><PenTool size={12}/> Edit Data</button>
                                        <button className="text-gray-400 hover:text-red-400 px-2 py-1 border border-white/10 rounded transition-colors flex items-center gap-1" title="Manage Subscription"><CreditCard size={12}/> Manage Sub</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminDrawManagement = () => {
    const [mode, setMode] = React.useState('algorithm');
    const [isimulated, setIsImulated] = React.useState(false);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
             <h2 className="text-2xl font-premium font-bold text-white mb-2">Draw Engineering Hub</h2>
             
             {/* Configuration & Execution */}
             <div className="grid md:grid-cols-2 gap-6">
                 <div className="glass-panel p-8">
                     <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2"><Settings size={18}/> Logic Configuration</h3>
                     <div className="space-y-4">
                         <label className="flex items-center gap-4 p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                             <input type="radio" value="algorithm" checked={mode === 'algorithm'} onChange={() => setMode('algorithm')} className="text-accent accent-accent w-5 h-5"/>
                             <div>
                                 <div className="font-bold text-white text-sm">Algorithmic Baseline (PRD Default)</div>
                                 <div className="text-xs text-gray-500 mt-1">Selects the 5 most frequent platform-wide scores.</div>
                             </div>
                         </label>
                         <label className="flex items-center gap-4 p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                             <input type="radio" value="random" checked={mode === 'random'} onChange={() => setMode('random')} className="text-accent accent-accent w-5 h-5"/>
                             <div>
                                 <div className="font-bold text-white text-sm">Pure Randomness (Cryptographic)</div>
                                 <div className="text-xs text-gray-500 mt-1">Lottery standard completely randomized draw mechanics.</div>
                             </div>
                         </label>
                     </div>
                 </div>

                 <div className="glass-panel p-8 flex flex-col justify-between border-t-4 border-t-accent">
                     <div>
                         <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Activity size={18}/> Global Execution Engine</h3>
                         <p className="text-sm text-gray-400 mb-6">Force trigger the month-end automated draw bypass.</p>
                     </div>
                     <div className="space-y-3 mt-auto">
                         <button onClick={() => setIsImulated(true)} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors shadow-lg shadow-white/5 border border-white/20">
                             DRY RUN SIMULATION
                         </button>
                         <button onClick={() => alert('DANGER: DB COMMITTED. DRAW PUBLISHED. \n\nEMAIL SERVICE: Dispatching 14,291 "Draw Results & Winner Alerts" via SendGrid successfully.')} disabled={!isimulated} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
                             PUBLISH OFFICIAL RESULTS
                         </button>
                     </div>
                 </div>
             </div>

             {/* Winners Management Requirement */}
             <div className="glass-panel p-8">
                 <h3 className="text-xl font-bold text-white mb-2">Winners Management & Verification</h3>
                 <p className="text-sm text-gray-400 mb-6">View full winners list, verify submissions, and definitively mark payouts as complete.</p>
                 <div className="space-y-4">
                     {/* Verification Queue Item */}
                     <div className="flex flex-col md:flex-row justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10 gap-6">
                         <div className="flex items-center gap-4">
                             <div className="w-16 h-16 bg-black/50 rounded-lg flex items-center justify-center border border-white/10 hidden md:flex hover:bg-white/10 cursor-pointer transition-colors group">
                                 <FileText className="text-gray-500 group-hover:text-accent" />
                             </div>
                             <div>
                                 <div className="text-sm font-bold text-white flex items-center gap-2">John Doe <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full uppercase">5-Match Winner</span></div>
                                 <div className="text-xs text-gray-400 mb-1">Pending Prize: $42,500.00</div>
                                 <a href="#" className="text-xs text-accent hover:underline flex items-center gap-1"><Upload size={12}/> View proof_img_1024.png</a>
                             </div>
                         </div>
                         <div className="flex gap-3 w-full md:w-auto">
                             <button className="flex-1 md:flex-none px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-sm transition-colors border border-red-500/20">Reject Proof</button>
                             <button onClick={() => alert('Proof Verified! Wallet state transitioned to PAID.')} className="flex-1 md:flex-none px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg text-sm transition-colors border border-green-500/20 flex gap-2 items-center justify-center"><Check size={16}/> Approve Payout</button>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const AdminCharityManagement = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-premium font-bold text-white">Charity Roster</h2>
                <button className="btn-premium-black text-sm py-2 px-4 flex items-center gap-2">
                    <PlusCircle size={16} /> Add Foundation
                </button>
            </div>
            <div className="grid gap-4">
                {['Global Education Fund', 'St. Jude Hospitals'].map((c, i) => (
                    <div key={i} className="glass-panel p-6 flex flex-col md:flex-row justify-between md:items-center hover:border-white/20 transition-colors gap-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center text-xs text-gray-500">Image</div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{c}</h3>
                                <p className="text-sm text-gray-400">Active status • $840,200 routed total</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white flex items-center gap-1 border border-white/5"><PenTool size={12}/> Edit Details</button>
                            <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white flex items-center gap-1 border border-white/5"><Image size={12}/> Manage Media & Events</button>
                            <button className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg flex items-center gap-1 border border-red-500/20"><Trash2 size={12}/> Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminReports = () => {
    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-premium font-bold text-white mb-6">Reports & System Analytics</h2>
            
            {/* PRD Analytical Metric Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { title: "Total Users", val: "14,291", color: "text-blue-400" },
                    { title: "Platform Prize Pool", val: "$1,842,500", color: "text-accent" },
                    { title: "Charity Contributions", val: "$420,100", color: "text-green-400" },
                    { title: "Draw Statistics (Executions)", val: "12 / 12", color: "text-purple-400" }
                ].map((stat, i) => (
                    <div key={i} className="glass-panel p-6">
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">{stat.title}</div>
                        <div className={`text-2xl font-premium font-bold ${stat.color}`}>{stat.val}</div>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-panel p-8">
                     <FileText size={32} className="text-accent mb-4" />
                     <h3 className="font-bold text-white mb-2">Financial Ledger</h3>
                     <p className="text-sm text-gray-400 mb-6 h-10">Export a CSV of all Razorpay subscription intakes vs Draw payouts.</p>
                     <button className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10">Export CSV</button>
                </div>
                <div className="glass-panel p-8">
                     <Globe size={32} className="text-accent mb-4" />
                     <h3 className="font-bold text-white mb-2">Score Demographics</h3>
                     <p className="text-sm text-gray-400 mb-6 h-10">Dataset map of stableford anomalies for anti-cheat verification.</p>
                     <button className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10">Export PDF</button>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// D. AUTHENTICATION (LOGIN & SIGNUP)
// ==========================================
const AuthView = ({ initialMode, setRole, setUser, adminOnly = false }) => {
    const [mode, setMode] = useState(adminOnly ? 'LOGIN' : initialMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const endpoint = mode === 'LOGIN' 
                ? 'http://localhost:5001/api/auth/login' 
                : 'http://localhost:5001/api/auth/signup';
                
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                alert(`Error: ${data.message || 'Authentication failed'}`);
                setIsSubmitting(false);
                return;
            }

            // Admin portal: block non-admin accounts
            if (adminOnly && data.user && data.user.role !== 'ADMIN') {
                alert('Access Denied: This portal is restricted to administrators only.');
                setIsSubmitting(false);
                return;
            }

            // Real DB Validation successful -> Store Secure JWT and User Data
            localStorage.setItem('hero_jwt_session', data.token);
            localStorage.setItem('hero_user_data', JSON.stringify(data.user));
            setUser(data.user);
            
            if (data.user && data.user.role === 'ADMIN') {
                setRole('ADMIN');
            } else {
                setRole('SUBSCRIBER');
            }
        } catch (error) {
            console.error('Auth Exception:', error);
            alert('Failed to establish a secure connection to the authentication server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden ${adminOnly ? 'bg-[#0a0a0a]' : 'bg-primary'}`}>
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] ${adminOnly ? 'bg-red-500/5' : 'bg-accent/5'}`}></div>
                <div className={`absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[80px] ${adminOnly ? 'bg-red-500/3' : 'bg-white/5'}`}></div>
            </div>

            <button 
                onClick={() => { window.location.href = '/'; }}
                className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors z-20"
            >
                <ArrowLeft size={16} /> Back to Portal
            </button>

            <div className={`glass-panel p-10 w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500 ${adminOnly ? 'border-red-500/20' : ''}`}>
                <div className="text-center mb-8">
                    {adminOnly ? (
                        <>
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <Shield className="text-red-500" size={32} />
                            </div>
                            <h2 className="text-3xl font-premium font-bold text-white mb-2">Admin Portal</h2>
                            <p className="text-gray-400 text-sm">Restricted access. Authorized administrators only.</p>
                        </>
                    ) : (
                        <>
                            <Trophy className="text-accent mx-auto mb-4" size={40} />
                            <h2 className="text-3xl font-premium font-bold text-white mb-2">
                                {mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {mode === 'LOGIN' ? 'Authenticate to access your dashboard.' : 'Join the most elite philanthropic platform.'}
                            </p>
                        </>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full bg-black/50 border rounded-xl px-4 py-3 text-white outline-none transition-all ${adminOnly ? 'border-red-500/20 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-accent focus:ring-1 focus:ring-accent'}`}
                            placeholder={adminOnly ? 'admin@digitalheroes.com' : 'you@example.com'}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Password</label>
                        <input 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-black/50 border rounded-xl px-4 py-3 text-white outline-none transition-all ${adminOnly ? 'border-red-500/20 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-accent focus:ring-1 focus:ring-accent'}`}
                            placeholder="••••••••"
                        />
                    </div>

                    {mode === 'LOGIN' && (
                        <div className="text-right">
                            <a href="#" className={`text-xs hover:text-white transition-colors ${adminOnly ? 'text-red-400' : 'text-accent'}`}>Forgot Password?</a>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className={`w-full h-12 mt-4 disabled:opacity-50 font-bold rounded-xl transition-colors ${adminOnly ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-premium-black'}`}
                    >
                        {isSubmitting 
                            ? 'Authenticating...' 
                            : (adminOnly ? 'Access Admin Panel' : (mode === 'LOGIN' ? 'Sign In' : 'Initiate Subscription'))}
                    </button>
                </form>

                {/* Only show signup toggle on regular auth, not admin */}
                {!adminOnly && (
                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-gray-400">
                            {mode === 'LOGIN' ? "Don't have an account?" : "Already have an account?"}
                            <button 
                                onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                                className="ml-2 font-medium text-white hover:text-accent transition-colors underline decoration-white/20 underline-offset-4"
                            >
                                {mode === 'LOGIN' ? 'Sign up here' : 'Sign in here'}
                            </button>
                        </p>
                    </div>
                )}
            </div>
            
            {adminOnly && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-xs text-gray-600 max-w-sm">
                    <Lock size={12} className="inline mr-1" /> This portal is secured. Unauthorized access attempts are logged.
                </div>
            )}
        </div>
    );
};

export default App;
