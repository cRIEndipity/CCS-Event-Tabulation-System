import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Committees } from './components/Committees';
import { Events } from './components/Events';
import { Schedule } from './components/Schedule';
import { Criteria } from './components/Criteria';
import { Judges } from './components/Judges';
import { Participants } from './components/Participants';
import { ScoreEncoding } from './components/ScoreEncoding';
import { Tabulation } from './components/Tabulation';
import { Results } from './components/Results';
import { Reports } from './components/Reports';
import { Chat } from './components/Chat';
import { Toaster, toast } from 'sonner';
import { supabase } from './lib/supabase';

import { Colleges } from './components/Colleges';

// Define Screen type here
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

const AppContent: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentUser, currentUser } = useApp();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setCurrentUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info('Logged out successfully');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading system...</div>;
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard': return <Dashboard />;
      case 'committees': return <Committees />;
      case 'events': return <Events />;
      case 'schedule': return <Schedule />;
      case 'criteria': return <Criteria />;
      case 'judges': return <Judges />;
      case 'participants': return <Participants />;
      case 'colleges': return <Colleges />;
      case 'encoding': return <ScoreEncoding />;
      case 'tabulation': return <Tabulation />;
      case 'results': return <Results />;
      case 'reports': return <Reports />;
      case 'chat': return <Chat />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout 
      currentScreen={currentScreen} 
      onNavigate={setCurrentScreen} 
      onLogout={handleLogout}
      currentUser={currentUser}
    >
      {renderScreen()}
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" richColors />
      <AppContent />
    </AppProvider>
  );
}