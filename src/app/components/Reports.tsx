import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Trophy, Award, Medal, Filter, ChevronDown, Printer } from 'lucide-react';

// Define the ParticipantRanking type locally since we can't easily export/import complex types without refactoring
type ParticipantRanking = {
  participantId: string;
  participantName: string;
  departmentId: string;
  deptName?: string;
  teamName?: string;
  color?: string;
  averageRank: number;
  totalRawScoreSum: number;
  finalRank: number;
  percentileScore: number;
};

export const Reports: React.FC = () => {
  const { departments, participants, events, scores, judges, committees, colleges } = useApp();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('detailed');

  // --- Logic Duplication from Results.tsx/Tabulation.tsx ---
  
  const getEventRankings = (eventId: string): ParticipantRanking[] => {
    const event = events.find(e => e.id === eventId);
    if (!event) return [];

    const eventParticipants = participants.filter(p => p.eventId === eventId);
    // Use assigned judges if available, otherwise fallback to slice (legacy behavior)
    const eventJudges = (event.judgeIds && event.judgeIds.length > 0)
      ? judges.filter(j => event.judgeIds!.includes(j.id))
      : judges.slice(0, event.judgeCount);
    
    if (eventParticipants.length === 0) return [];

    const participantData: ParticipantRanking[] = eventParticipants.map(participant => {
      const dept = departments.find(d => d.id === participant.departmentId);
      const judgeRankings = eventJudges.map(judge => {
        const participantJudgeScores = scores.filter(s => 
          s.eventId === eventId && 
          s.participantId === participant.id && 
          s.judgeId === judge.id
        );
        const totalRawScore = participantJudgeScores.reduce((sum, s) => sum + s.value, 0);
        return { judgeId: judge.id, totalRawScore, rank: 0 };
      });

      return {
        participantId: participant.id,
        participantName: participant.name,
        departmentId: participant.departmentId,
        deptName: dept?.name,
        teamName: dept?.teamName,
        color: dept?.color,
        judgeRankings,
        averageRank: 0,
        totalRawScoreSum: 0,
        finalRank: 0,
        percentileScore: 0
      };
    });

    // Rank for each judge
    eventJudges.forEach((judge, judgeIndex) => {
      const judgeScores = participantData.map(p => ({
        participantId: p.participantId,
        totalRawScore: p.judgeRankings[judgeIndex].totalRawScore
      }));

      judgeScores.sort((a, b) => b.totalRawScore - a.totalRawScore);

      let currentRank = 1;
      for (let i = 0; i < judgeScores.length; i++) {
        const currentScore = judgeScores[i].totalRawScore;
        const tiedParticipants = judgeScores.filter(js => js.totalRawScore === currentScore);
        
        if (tiedParticipants.length > 1) {
          const tiedRanks = Array.from({ length: tiedParticipants.length }, (_, idx) => currentRank + idx);
          const averageRankForTied = tiedRanks.reduce((sum, r) => sum + r, 0) / tiedRanks.length;
          
          tiedParticipants.forEach(tp => {
            const pData = participantData.find(p => p.participantId === tp.participantId);
            if (pData) pData.judgeRankings[judgeIndex].rank = averageRankForTied;
          });
          
          i += tiedParticipants.length - 1;
          currentRank += tiedParticipants.length;
        } else {
          const pData = participantData.find(p => p.participantId === judgeScores[i].participantId);
          if (pData) pData.judgeRankings[judgeIndex].rank = currentRank;
          currentRank++;
        }
      }
    });

    // Calculate average ranking
    participantData.forEach(p => {
      const sumOfRanks = p.judgeRankings.reduce((sum, jr) => sum + jr.rank, 0);
      p.averageRank = sumOfRanks / p.judgeRankings.length;
      p.totalRawScoreSum = p.judgeRankings.reduce((sum, jr) => sum + jr.totalRawScore, 0);
    });

    // Determine final ranking
    const sortedByAverageRank = [...participantData].sort((a, b) => {
      if (a.averageRank === b.averageRank) return b.totalRawScoreSum - a.totalRawScoreSum;
      return a.averageRank - b.averageRank;
    });

    let finalRank = 1;
    for (let i = 0; i < sortedByAverageRank.length; i++) {
      const current = sortedByAverageRank[i];
      const completeTies = sortedByAverageRank.filter(p => 
        p.averageRank === current.averageRank && 
        p.totalRawScoreSum === current.totalRawScoreSum
      );
      
      if (completeTies.length > 1 && completeTies.includes(current)) {
        const tiedRanks = Array.from({ length: completeTies.length }, (_, idx) => finalRank + idx);
        const avgFinalRank = tiedRanks.reduce((sum, r) => sum + r, 0) / tiedRanks.length;
        completeTies.forEach(p => p.finalRank = avgFinalRank);
        i += completeTies.length - 1;
        finalRank += completeTies.length;
      } else {
        current.finalRank = finalRank;
        finalRank++;
      }
    }

    // Calculate percentile scores
    const N = participantData.length;
    participantData.forEach(p => {
      const R = p.finalRank;
      const K = N - (R - 1);
      const W = (1 / N) * 100;
      p.percentileScore = K * W;
    });

    return sortedByAverageRank.sort((a, b) => a.finalRank - b.finalRank);
  };

  const calculateOverall = (filterCommitteeId?: string) => {
    const departmentScores: Record<string, { total: number; eventCount: number }> = {};
    departments.forEach(d => departmentScores[d.id] = { total: 0, eventCount: 0 });

    const completedEvents = events.filter(e => 
      e.status === 'Completed' && 
      (!filterCommitteeId || e.committeeId === filterCommitteeId)
    );
    
    completedEvents.forEach(event => {
      const rankings = getEventRankings(event.id);
      const collegeTeams: Record<string, ParticipantRanking[]> = {};
      
      rankings.forEach(ranking => {
        const dept = departments.find(d => d.id === ranking.departmentId);
        if (dept) {
          const college = colleges.find(c => c.id === dept.collegeId);
          if (college) {
            if (!collegeTeams[college.id]) collegeTeams[college.id] = [];
            collegeTeams[college.id].push(ranking);
          }
        }
      });

      Object.values(collegeTeams).forEach(teams => {
        if (teams.length > 0) {
          const topTeam = teams[0];
          const weight = event.bearing && event.bearing > 0 ? event.bearing : 1;
          departmentScores[topTeam.departmentId].total += topTeam.percentileScore * weight;
          departmentScores[topTeam.departmentId].eventCount += 1;
        }
      });
    });

    return Object.entries(departmentScores)
      .map(([deptId, data]) => ({
        department: departments.find(d => d.id === deptId),
        score: data.total,
        eventCount: data.eventCount
      }))
      .filter(r => r.department && r.eventCount > 0)
      .sort((a, b) => b.score - a.score);
  };

  // --- Data Preparation for Charts ---
  const participantData = departments.map(dept => ({
    name: dept.teamName.length > 10 ? dept.teamName.substring(0, 10) + '...' : dept.teamName,
    fullName: dept.teamName,
    count: participants.filter(p => p.departmentId === dept.id).length,
    color: dept.color
  }));

  const eventStatusData = [
    { name: 'Completed', value: events.filter(e => e.status === 'Completed').length, color: '#10b981' },
    { name: 'Ongoing', value: events.filter(e => e.status === 'Ongoing').length, color: '#3b82f6' },
    { name: 'Upcoming', value: events.filter(e => e.status === 'Upcoming').length, color: '#94a3b8' },
  ];

  // Calculations for Tables
  const eventRankings = selectedEventId ? getEventRankings(selectedEventId) : [];
  const committeeRankings = selectedCommitteeId ? calculateOverall(selectedCommitteeId) : [];
  const overallRankings = calculateOverall();

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={16} />;
    if (rank === 2) return <Medal className="text-slate-400" size={16} />;
    if (rank === 3) return <Award className="text-amber-700" size={16} />;
    return <span className="text-slate-500 font-mono font-bold text-xs">#{Math.floor(rank)}</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Detailed breakdown of rankings and statistics</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('detailed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'detailed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Detailed Reports
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visual Analytics
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-50">
              <CardTitle className="text-lg font-bold text-slate-800">Participation by Team</CardTitle>
              <CardDescription>Number of registered contestants per team</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={participantData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={11} 
                      fontWeight="bold" 
                      tick={{ fill: '#64748b' }} 
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      fontSize={11} 
                      fontWeight="bold" 
                      tick={{ fill: '#64748b' }} 
                      axisLine={{ stroke: '#e2e8f0' }}
                      allowDecimals={false} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Participants">
                      {participantData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#1e3a8a'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-50">
              <CardTitle className="text-lg font-bold text-slate-800">Event Progress Status</CardTitle>
              <CardDescription>Current state of all competition events</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {eventStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      formatter={(value) => <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Per Event Ranking */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="text-blue-600" size={20} />
                  Per Event Ranking
                </h3>
                <p className="text-sm text-slate-500">Official results for specific events</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none min-w-[200px]"
                  >
                    <option value="">Select Event...</option>
                    {events.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.status})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {selectedEventId ? (
                eventRankings.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 w-16 text-center">Rank</th>
                        <th className="px-6 py-3">Participant</th>
                        <th className="px-6 py-3">Team / Department</th>
                        <th className="px-6 py-3 text-center">Avg Rank</th>
                        <th className="px-6 py-3 text-right">Percentile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eventRankings.map((r, idx) => (
                        <tr key={r.participantId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 text-center">
                            <div className="flex justify-center">{getRankIcon(r.finalRank)}</div>
                          </td>
                          <td className="px-6 py-3 font-medium text-slate-900">{r.participantName}</td>
                          <td className="px-6 py-3 text-slate-600">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }}></span>
                              {r.teamName}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center font-mono text-slate-500">{r.averageRank.toFixed(2)}</td>
                          <td className="px-6 py-3 text-right font-bold text-slate-800">{r.percentileScore.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-slate-500 italic">No rankings available for this event yet.</div>
                )
              ) : (
                <div className="p-8 text-center text-slate-500 italic">Please select an event to view rankings.</div>
              )}
            </div>
          </section>

          {/* Section 2: Committee Overall Ranking */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Medal className="text-indigo-600" size={20} />
                  Committee Overall Ranking
                </h3>
                <p className="text-sm text-slate-500">Consolidated standings per committee</p>
              </div>
              <div className="relative">
                <select
                  value={selectedCommitteeId}
                  onChange={(e) => setSelectedCommitteeId(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none min-w-[200px]"
                >
                  <option value="">Select Committee...</option>
                  {committees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {selectedCommitteeId ? (
                committeeRankings.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 w-16 text-center">Rank</th>
                        <th className="px-6 py-3">Team Name</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3 text-center">Events Won/Placed</th>
                        <th className="px-6 py-3 text-right">Total Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {committeeRankings.map((r, idx) => (
                        <tr key={r.department?.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 text-center">
                            <div className="flex justify-center">{getRankIcon(idx + 1)}</div>
                          </td>
                          <td className="px-6 py-3 font-bold text-slate-900">{r.department?.teamName}</td>
                          <td className="px-6 py-3 text-slate-600">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.department?.color }}></span>
                              {r.department?.name}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center text-slate-500">{r.eventCount}</td>
                          <td className="px-6 py-3 text-right font-bold text-indigo-700">{r.score.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-slate-500 italic">No data available for this committee yet.</div>
                )
              ) : (
                <div className="p-8 text-center text-slate-500 italic">Please select a committee to view standings.</div>
              )}
            </div>
          </section>

          {/* Section 3: Overall Champion */}
          <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden text-white">
            <div className="p-6 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-yellow-400">
                  <Trophy className="text-yellow-400" size={24} />
                  OVERALL CHAMPIONSHIP STANDINGS
                </h3>
                <p className="text-sm text-slate-400">Final tabulation across all committees and events</p>
              </div>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm transition-colors border border-white/10"
              >
                <Printer size={16} /> Print Report
              </button>
            </div>
            
            <div className="p-6">
              {overallRankings.length > 0 ? (
                <div className="space-y-4">
                  {overallRankings.map((r, idx) => (
                    <div 
                      key={r.department?.id} 
                      className={`flex items-center p-4 rounded-lg border ${
                        idx === 0 
                          ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/50' 
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className={`w-12 h-12 flex items-center justify-center rounded-lg text-xl font-black mr-4 ${
                        idx === 0 ? 'bg-yellow-500 text-slate-900' : 
                        idx === 1 ? 'bg-slate-300 text-slate-800' :
                        idx === 2 ? 'bg-orange-700 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-lg font-bold ${idx === 0 ? 'text-yellow-400' : 'text-white'}`}>
                          {r.department?.teamName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{r.department?.name}</span>
                          <span>•</span>
                          <span>{r.eventCount} Events Contested</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black">{r.score.toFixed(4)}</div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-500">Total Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-700 rounded-lg">
                  Not enough data to determine overall champion yet.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};