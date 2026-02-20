import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Calendar, Trophy, Building2, TrendingUp, UserCheck, ShieldCheck, Activity, BarChart3 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { committees, events, participants, departments, colleges } = useApp();

  // Get recent events for display
  const recentEvents = events.slice(0, 5).map(event => ({
    id: event.id,
    name: event.name,
    type: event.type,
    status: event.status,
    judgeCount: event.judges?.length || 0
  }));

  const stats = [
    { label: 'Total Colleges', value: colleges.length, icon: Building2, color: 'from-blue-500/10 to-blue-600/10', iconColor: 'text-blue-600', borderColor: 'border-blue-200/50' },
    { label: 'Competing Teams', value: departments.length, icon: ShieldCheck, color: 'from-purple-500/10 to-purple-600/10', iconColor: 'text-purple-600', borderColor: 'border-purple-200/50' },
    { label: 'Active Events', value: events.filter(e => e.status !== 'Completed').length, icon: Calendar, color: 'from-maroon-500/10 to-maroon-600/10', iconColor: 'text-maroon-600', borderColor: 'border-maroon-200/50' },
    { label: 'Total Participants', value: participants.length, icon: Trophy, color: 'from-amber-500/10 to-amber-600/10', iconColor: 'text-amber-600', borderColor: 'border-amber-200/50' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-navy-600 to-maroon-600 rounded-full" />
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Tabulation Dashboard</h1>
          </div>
          <p className="text-slate-600 font-medium flex items-center gap-2 ml-4">
            <Activity size={16} className="text-green-500" />
            Real-time CCS Event Monitoring System
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 tabular-nums">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`group relative bg-gradient-to-br ${stat.color} backdrop-blur-sm p-6 rounded-2xl border ${stat.borderColor} shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden`}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)',
                }} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-white shadow-sm ${stat.iconColor}`}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <BarChart3 size={16} className="text-slate-300 group-hover:text-green-500 transition-colors" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</span>
                  <span className="text-4xl font-bold text-slate-900 tabular-nums tracking-tight">{stat.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white/50">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Active Competition Feed</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time status updates</p>
            </div>
            <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-colors border border-slate-200">
              View All Events
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30 text-slate-400 font-black uppercase tracking-[0.15em] text-[9px]">
                  <th className="px-8 py-5">Event Identifier</th>
                  <th className="px-8 py-5">Judge Status</th>
                  <th className="px-8 py-5">Live State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full">
                          <Calendar className="text-slate-300" size={32} />
                        </div>
                        <p className="text-sm font-medium text-slate-400 italic">No events recorded for this session.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-navy-900/10 ${
                            event.type === 'Academic' ? 'bg-navy-900' : 'bg-maroon-800'
                          }`}>
                            {event.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 group-hover:text-maroon-700 transition-colors">{event.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{event.type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(event.judgeCount, 3))].map((_, i) => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 overflow-hidden">
                                J{i+1}
                              </div>
                            ))}
                            {event.judgeCount > 3 && (
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[8px] font-black text-white">
                                +{event.judgeCount - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider">
                            {event.judgeCount} Registered
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] shadow-sm border ${
                          event.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          event.status === 'Ongoing' ? 'bg-navy-50 text-navy-700 border-navy-100 animate-pulse' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            event.status === 'Completed' ? 'bg-emerald-500' :
                            event.status === 'Ongoing' ? 'bg-navy-600' :
                            'bg-slate-400'
                          }`} />
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-navy-950 rounded-[2.5rem] shadow-2xl p-10 text-white relative overflow-hidden flex-1 group">
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
              <Trophy size={200} className="rotate-12 transform group-hover:scale-110 transition-transform duration-700" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-10">
                <div className="w-12 h-12 bg-maroon-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-maroon-900/20">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">System Integrity</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Current Performance Metrics</p>
              </div>

              <div className="space-y-8 flex-1">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                    <span>Tabulation Logic</span>
                    <span className="text-maroon-400">Stable</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className="bg-gradient-to-r from-maroon-600 to-maroon-400 h-full w-[94%] rounded-full shadow-[0_0_15px_rgba(220,38,38,0.3)]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                    <span>Encryption Sync</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-full w-[100%] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Real-time synchronization <span className="text-white">engaged</span>. All results are audited via percentile formulas.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-maroon-50 rounded-2xl flex items-center justify-center text-maroon-600">
                <Users size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800">Admin Oversight</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Committee Management</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};