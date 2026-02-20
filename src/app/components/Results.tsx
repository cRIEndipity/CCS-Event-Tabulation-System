import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Award, Printer, Download, Star } from 'lucide-react';
import { Badge } from './ui/badge';

type ParticipantRanking = {
  participantId: string;
  participantName: string;
  departmentId: string;
  averageRank: number;
  totalRawScoreSum: number;
  finalRank: number;
  percentileScore: number;
};

export const Results: React.FC = () => {
  const { events, participants, scores, departments, colleges, judges } = useApp();
  const [activeTab, setActiveTab] = useState<'events' | 'overall'>('events');

  // Helper to get rankings for an event using Average Ranking System
  const getEventRankings = (eventId: string): ParticipantRanking[] => {
    const event = events.find(e => e.id === eventId);
    if (!event) return [];

    const eventParticipants = participants.filter(p => p.eventId === eventId);
    // Use assigned judges if available, otherwise fallback to slice (legacy behavior)
    const eventJudges = (event.judgeIds && event.judgeIds.length > 0)
      ? judges.filter(j => event.judgeIds!.includes(j.id))
      : judges.slice(0, event.judgeCount);
    
    if (eventParticipants.length === 0) return [];

    // Calculate rankings using Average Ranking System
    const participantData: ParticipantRanking[] = eventParticipants.map(participant => {
      const judgeRankings = eventJudges.map(judge => {
        const participantJudgeScores = scores.filter(s => 
          s.eventId === eventId && 
          s.participantId === participant.id && 
          s.judgeId === judge.id
        );
        const totalRawScore = participantJudgeScores.reduce((sum, s) => sum + s.value, 0);
        
        return {
          judgeId: judge.id,
          totalRawScore,
          rank: 0
        };
      });

      return {
        participantId: participant.id,
        participantName: participant.name,
        departmentId: participant.departmentId,
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
            if (pData) {
              pData.judgeRankings[judgeIndex].rank = averageRankForTied;
            }
          });
          
          i += tiedParticipants.length - 1;
          currentRank += tiedParticipants.length;
        } else {
          const pData = participantData.find(p => p.participantId === judgeScores[i].participantId);
          if (pData) {
            pData.judgeRankings[judgeIndex].rank = currentRank;
          }
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
      if (a.averageRank === b.averageRank) {
        return b.totalRawScoreSum - a.totalRawScoreSum;
      }
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
        
        completeTies.forEach(p => {
          p.finalRank = avgFinalRank;
        });
        
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

    return sortedByAverageRank;
  };

  const getEventWinner = (eventId: string) => {
    const rankings = getEventRankings(eventId);
    return rankings.length > 0 ? rankings[0] : null;
  };

  // Calculate Overall Champion using percentile scores
  const calculateOverall = () => {
    const departmentScores: Record<string, { total: number; eventCount: number }> = {};
    departments.forEach(d => departmentScores[d.id] = { total: 0, eventCount: 0 });

    const completed = events.filter(e => e.status === 'Completed');
    
    completed.forEach(event => {
      const rankings = getEventRankings(event.id);
      
      // Group rankings by college to handle multiple teams per college
      const collegeTeams: Record<string, ParticipantRanking[]> = {};
      rankings.forEach(ranking => {
        const dept = departments.find(d => d.id === ranking.departmentId);
        if (dept) {
          const college = colleges.find(c => c.id === dept.collegeId);
          if (college) {
            if (!collegeTeams[college.id]) {
              collegeTeams[college.id] = [];
            }
            collegeTeams[college.id].push(ranking);
          }
        }
      });

      // For each college, only count the highest-ranked team
      Object.values(collegeTeams).forEach(teams => {
        if (teams.length > 0) {
          // Teams are already sorted by ranking, so first one is highest
          const topTeam = teams[0];
          // Use event bearing if available, otherwise default to 1 (equal weight)
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

  const overallResults = calculateOverall();
  const completedEvents = events.filter(e => e.status === 'Completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Official Results & Winners</h2>
          <p className="text-slate-500 text-sm mt-1">Finalized winners using Average Ranking System</p>
        </div>
        <div className="flex bg-slate-200 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'events' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Event Winners
          </button>
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'overall' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overall Champions
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm transition-colors border border-slate-200">
          <Printer size={16} /> Print Results
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm transition-colors border border-slate-200">
          <Download size={16} /> Export PDF
        </button>
      </div>

      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedEvents.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <Trophy className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No completed events yet.</p>
              <p className="text-slate-400 text-sm">Lock an event in Tabulation to generate winners.</p>
            </div>
          ) : (
            completedEvents.map(event => {
              const winner = getEventWinner(event.id);
              const dept = departments.find(d => d.id === winner?.departmentId);
              const college = colleges.find(c => c.id === dept?.collegeId);
              
              return (
                <div key={event.id} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                  <div className="bg-slate-900 p-5 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Star size={48} className="text-white fill-white" />
                    </div>
                    <h3 className="text-white font-bold text-lg relative z-10">{event.name}</h3>
                    <p className="text-slate-400 text-xs uppercase tracking-widest mt-1 font-semibold">{event.type} CATEGORY</p>
                  </div>
                  <div className="p-8 flex flex-col items-center flex-1 justify-center text-center bg-gradient-to-b from-white to-slate-50/50">
                    {winner ? (
                      <>
                        <div className="relative mb-6">
                          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center ring-8 ring-amber-50">
                            <Trophy className="text-amber-600" size={40} />
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white">
                            CHAMPION
                          </div>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 mb-1">{winner.participantName}</h4>
                        <div className="flex flex-col items-center gap-1 mb-4">
                          <span className="font-bold text-indigo-600 text-sm">
                            {dept?.teamName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {college?.name}
                          </span>
                        </div>
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 px-4 py-1.5 text-md font-bold hover:bg-indigo-50">
                          Percentile: {winner.percentileScore.toFixed(2)}%
                        </Badge>
                        <div className="mt-2 text-xs text-slate-500">
                          Avg Rank: {winner.averageRank.toFixed(2)}
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-500 italic">No participants ranked</p>
                    )}
                  </div>
                  <div className="bg-slate-50 p-4 text-center border-t border-slate-100 flex items-center justify-center gap-2">
                    <Award size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Official Final Result</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'overall' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-10 bg-indigo-900 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
              <h3 className="text-4xl font-black uppercase tracking-tighter relative z-10 mb-2">Overall Standings</h3>
              <p className="opacity-70 text-lg relative z-10 font-medium">Percentile accumulation across all completed events</p>
            </div>
            
            <div className="p-8 lg:p-12">
              {overallResults.length > 0 ? (
                <div className="space-y-4">
                  {overallResults.map((result, index) => {
                    const college = colleges.find(c => c.id === result.department?.collegeId);
                    return (
                      <div 
                        key={result.department?.id || index} 
                        className={`group flex items-center p-6 rounded-2xl border-2 transition-all duration-300 ${
                          index === 0 
                            ? 'bg-amber-50 border-amber-200 shadow-lg shadow-amber-100 scale-[1.02]' 
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-16 h-16 flex items-center justify-center rounded-2xl font-black text-2xl mr-6 transform transition-transform group-hover:rotate-6 ${
                          index === 0 ? 'bg-amber-400 text-amber-900 shadow-lg shadow-amber-200' : 
                          index === 1 ? 'bg-slate-200 text-slate-600 shadow-md' :
                          index === 2 ? 'bg-orange-100 text-orange-700 shadow-sm' : 'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h4 className="font-black text-xl text-slate-900 tracking-tight">
                              {result.department?.teamName || 'Unknown Team'}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                {result.department?.name}
                              </span>
                              <span className="text-xs text-slate-400 font-medium italic">
                                {college?.name}
                              </span>
                              <span className="text-xs text-slate-400">
                                ({result.eventCount} event{result.eventCount !== 1 ? 's' : ''})
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 ease-out" 
                              style={{ 
                                width: `${(result.score / (overallResults[0].score || 1)) * 100}%`,
                                backgroundColor: result.department?.color || '#ccc'
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right pl-8">
                          <div className={`text-4xl font-black ${index === 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                            {result.score.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Percentile</div>
                        </div>
                      </div>
                    );
                  })}\n                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Award className="mx-auto h-16 w-16 text-slate-200 mb-6" />
                  <p className="text-slate-500 text-lg font-bold">No championship data available.</p>
                  <p className="text-slate-400">Complete and lock events to see the race for the Overall Champion!</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
            <h4 className="font-bold text-slate-900 mb-3">Scoring Method: Average Ranking System</h4>
            <div className="text-sm text-slate-600 space-y-2">
              <p>• Overall standings calculated using percentile scores from each event</p>
              <p>• For multiple teams per college, only the highest-ranked team's score counts</p>
              <p>• Team with highest accumulated percentile score = Overall Champion</p>
              <p>• A tie in overall results means a tie</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
