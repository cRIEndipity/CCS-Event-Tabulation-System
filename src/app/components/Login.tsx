import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/app/lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';
import { Shield, ArrowRight, ArrowLeft, Mail, Lock, User, Hash, GraduationCap, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LoginProps {
  onLogin: () => void;
}

type ViewState = 'login' | 'verify_admin' | 'register';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { departments } = useApp();
  const [view, setView] = useState<ViewState>('login');
  const [isLoading, setIsLoading] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Admin Verification State
  const [adminEmailInput, setAdminEmailInput] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regIdNumber, setRegIdNumber] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regYear, setRegYear] = useState('');
  const [regDeptId, setRegDeptId] = useState('');

  const ADMIN_EMAIL = 'ccstabulationadmin@soft.ui';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (data.session) {
        onLogin();
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmailInput.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setView('register');
      setAdminEmailInput('');
      toast.success('Administration verified. Proceeding to registration.');
    } else {
      toast.error('Incorrect Administrator Email. Access denied.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use the server-side signup to create the user with metadata
      // Since the original server signup was basic, we'll try client side signup first 
      // as Supabase usually allows client side signup unless disabled.
      // If client side is disabled, we would use the server function.
      // Let's use client side standard signup with metadata.
      
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            name: regName,
            id_number: regIdNumber,
            year_level: regYear,
            department_id: regDeptId,
            role: 'tabulator' // Default role for new signups
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Account created successfully! You can now login.');
        setView('login');
        // Clear form
        setRegName('');
        setRegIdNumber('');
        setRegEmail('');
        setRegPassword('');
        setRegYear('');
        setRegDeptId('');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side - Branding (Landscape) */}
      <div className="hidden lg:flex w-5/12 bg-slate-900 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="url(#grid-pattern)" />
            <defs>
              <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
          </svg>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Shield className="text-white h-7 w-7" />
            </div>
            <span className="text-white font-bold text-xl tracking-wider">CCS TABULATION</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Official Event <br/>
            <span className="text-blue-400">Management System</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
            Secure, accurate, and real-time scoring for academic and cultural competitions.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex gap-2 mb-4">
            <div className="h-1 w-12 bg-blue-500 rounded-full"></div>
            <div className="h-1 w-3 bg-slate-700 rounded-full"></div>
            <div className="h-1 w-3 bg-slate-700 rounded-full"></div>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Authorized Access Only</p>
          <p className="text-xs text-slate-600 mt-1">© 2026 College of Computer Studies</p>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.div 
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-10 rounded-2xl shadow-xl border border-slate-100"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
                  <p className="text-slate-500 mt-1">Please sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-medium text-slate-900"
                        placeholder="name@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-medium text-slate-900"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                    {!isLoading && <ArrowRight size={18} />}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-slate-500 text-sm mb-3">Don't have an account?</p>
                  <button 
                    onClick={() => setView('verify_admin')}
                    className="text-blue-700 font-bold hover:text-blue-900 transition-colors text-sm"
                  >
                    Create Account
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'verify_admin' && (
              <motion.div 
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-10 rounded-2xl shadow-xl border border-slate-100"
              >
                <button 
                  onClick={() => setView('login')}
                  className="mb-6 flex items-center text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} className="mr-1" /> Back to Login
                </button>

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Administration Check</h2>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    To create a Tabulation Representative account, you must first verify which administration you are under.
                  </p>
                </div>

                <form onSubmit={handleVerifyAdmin} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Administrator Email</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
                      <input
                        type="email"
                        value={adminEmailInput}
                        onChange={(e) => setAdminEmailInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-blue-50 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-medium text-slate-900"
                        placeholder="Enter the Admin's Email"
                        autoFocus
                        required
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Ask your head administrator for this email address.</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    Verify Administration
                    <ArrowRight size={18} />
                  </button>
                </form>
              </motion.div>
            )}

            {view === 'register' && (
              <motion.div 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setView('verify_admin')}
                  className="mb-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} className="mr-1" /> Back
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
                  <p className="text-slate-500 mt-1">Tabulation Representative Registration</p>
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
                    <Shield size={12} className="mr-1" /> Verified under {ADMIN_EMAIL}
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm"
                          placeholder="Juan Dela Cruz"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">ID Number</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={regIdNumber}
                          onChange={(e) => setRegIdNumber(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm"
                          placeholder="e.g. 1234567"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Year Level</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                          value={regYear}
                          onChange={(e) => setRegYear(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm appearance-none"
                          required
                        >
                          <option value="">Select</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Department / Team</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                          value={regDeptId}
                          onChange={(e) => setRegDeptId(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm appearance-none"
                          required
                        >
                          <option value="">Select the department you represent</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name} ({dept.teamName})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm"
                          placeholder="student@university.edu.ph"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm"
                          placeholder="Create a strong password"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoading ? 'Creating Account...' : 'Complete Registration'}
                    {!isLoading && <ArrowRight size={18} />}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};