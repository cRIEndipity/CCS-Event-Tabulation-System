import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Percent, 
  Gavel, 
  UserPlus, 
  Building2, 
  Edit3, 
  Trophy, 
  BarChart3, 
  LogOut,
  MessageCircle,
  GraduationCap,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Screen = 
  | 'dashboard' 
  | 'committees' 
  | 'events' 
  | 'schedule'
  | 'criteria' 
  | 'judges' 
  | 'participants' 
  | 'colleges' 
  | 'encoding' 
  | 'tabulation' 
  | 'results' 
  | 'reports'
  | 'chat';

interface LayoutProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  currentUser: any;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentScreen, onNavigate, onLogout, currentUser, children }) => {
  
  const navItems: { id: Screen; label: string; icon: React.ReactNode; group?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, group: 'Main' },
    { id: 'colleges', label: 'Colleges & Teams', icon: <Building2 size={18} />, group: 'Setup' },
    { id: 'committees', label: 'Committees', icon: <Users size={18} />, group: 'Setup' },
    { id: 'events', label: 'Events', icon: <Calendar size={18} />, group: 'Setup' },
    { id: 'schedule', label: 'Schedule', icon: <Calendar size={18} />, group: 'Management' },
    { id: 'criteria', label: 'Criteria & Bearings', icon: <Percent size={18} />, group: 'Management' },
    { id: 'judges', label: 'Judges', icon: <Gavel size={18} />, group: 'Management' },
    { id: 'participants', label: 'Participants', icon: <UserPlus size={18} />, group: 'Management' },
    { id: 'encoding', label: 'Score Encoding', icon: <Edit3 size={18} />, group: 'Operations' },
    { id: 'tabulation', label: 'Tabulation & Results', icon: <Trophy size={18} />, group: 'Operations' },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} />, group: 'Operations' },
    { id: 'chat', label: 'Internal Chat', icon: <MessageCircle size={18} />, group: 'Communication' },
  ];

  const groupedNav = navItems.reduce((acc, item) => {
    const group = item.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  const isAdmin = currentUser?.email === 'ccstabulationadmin@soft.ui';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 relative overflow-hidden border-r border-slate-700">
        {/* Professional Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />
        
        {/* Decorative Gradient Overlays */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-maroon-600/20 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

        {/* Logo Section */}
        <div className="p-6 relative z-10 border-b border-white/10">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl flex items-center justify-center shadow-lg shadow-maroon-900/30 border border-maroon-500/50 overflow-hidden">
              <img src="/wolf-favicon.png" alt="CCS Wolf Logo" className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight leading-none">
                CCS Tabulation
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Official System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar relative z-10 px-3">
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group} className="mb-6">
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 px-3">
                {group}
              </h3>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center justify-between group px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 relative ${
                        currentScreen === item.id
                          ? 'bg-maroon-600 text-white shadow-lg shadow-maroon-900/30'
                          : 'hover:bg-white/10 hover:text-white text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`transition-all duration-200 ${currentScreen === item.id ? '' : 'group-hover:text-maroon-400'}`}>
                          {item.icon}
                        </span>
                        <span className="tracking-tight">{item.label}</span>
                      </div>
                      {currentScreen === item.id && (
                        <motion.div layoutId="active-indicator" className="w-1 h-1 rounded-full bg-white" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Status & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/30 backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="h-9 w-9 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-lg flex items-center justify-center text-white shadow-md">
              <ShieldCheck size={18} />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-white truncate">{isAdmin ? 'Admin Access' : 'Representative'}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-slate-400 font-semibold">Active Session</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:text-white hover:bg-red-600/20 border border-red-500/30 rounded-lg transition-all duration-200 hover:border-red-500/50"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-8 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-gradient-to-b from-navy-600 to-maroon-600 rounded-full" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {navItems.find(i => i.id === currentScreen)?.label}
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  {groupTitle(currentScreen, navItems)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 py-2 px-4 rounded-xl border border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[9px] font-bold text-maroon-600 uppercase tracking-wider">
                  {isAdmin ? 'Administrator' : 'Representative'}
                </p>
              </div>
              <div className="h-9 w-9 bg-gradient-to-br from-navy-900 to-slate-800 text-white rounded-lg flex items-center justify-center font-bold shadow-md border border-slate-300">
                {(currentUser?.user_metadata?.full_name?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Subtle Footer for System Info */}
        <footer className="h-8 bg-white border-t border-slate-100 px-10 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <p>© 2026 CCS Tabulation System • Academic Excellence</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="w-1 h-1 bg-green-500 rounded-full" /> System v2.1.0</span>
            <span className="flex items-center gap-1"><span className="w-1 h-1 bg-blue-500 rounded-full" /> Supabase Secured</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Helper to get group title for breadcrumb
function groupTitle(screenId: Screen, navItems: any[]) {
  return navItems.find(i => i.id === screenId)?.group || 'Dashboard';
}