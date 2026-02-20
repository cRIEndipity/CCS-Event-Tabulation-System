import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Trophy, Award, Medal, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ParticipantRanking = {
  participantId: string;
  participantName: string;
  departmentId: string;
  deptName: string;
  teamName: string;
  color: string;
  collegeId: string;
  
  // Per-judge data
  judgeRankings: {
    judgeId: string;
    totalRawScore: number;
    rank: number;
  }[];
  
  // Final calculations
  averageRank: number;
  totalRawScoreSum: number;
  finalRank: number;
  percentileScore: number;
};

export const Tabulation: React.FC = () => {
  const { events, participants, scores, departments, colleges, judges, lockEvent } = useApp();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isLocking, setIsLocking] = useState(false);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Implement the Average Ranking System
  const computeResults = (): ParticipantRanking[] => {
    if (!selectedEvent) return [];

    const eventParticipants = participants.filter(p => p.eventId === selectedEventId);
    // Use assigned judges if available, otherwise fallback to slice (legacy behavior)
    const eventJudges = (selectedEvent.judgeIds && selectedEvent.judgeIds.length > 0)
      ? judges.filter(j => selectedEvent.judgeIds!.includes(j.id))
      : judges.slice(0, selectedEvent.judgeCount);
    
    if (eventParticipants.length === 0) return [];

    // Step 1: Calculate total raw scores for each participant from each judge
    const participantData: ParticipantRanking[] = eventParticipants.map(participant => {
      const dept = departments.find(d => d.id === participant.departmentId);
      const college = colleges.find(c => c.id === dept?.collegeId);
      
      const judgeRankings = eventJudges.map(judge => {
        // Get all scores for this participant from this judge
        const participantJudgeScores = scores.filter(s => 
          s.eventId === selectedEventId && 
          s.participantId === participant.id && 
          s.judgeId === judge.id
        );

        // Calculate total raw score (sum of all criteria scores)
        const totalRawScore = participantJudgeScores.reduce((sum, s) => sum + s.value, 0);
        
        return {
          judgeId: judge.id,
          totalRawScore,
          rank: 0 // Will be calculated next
        };
      });

      return {
        participantId: participant.id,
        participantName: participant.name,
        departmentId: participant.departmentId,
        deptName: dept?.name || 'Unknown',
        teamName: dept?.teamName || 'Unknown',
        color: dept?.color || '#cbd5e1',
        collegeId: college?.id || '',
        judgeRankings,
        averageRank: 0,
        totalRawScoreSum: 0,
        finalRank: 0,
        percentileScore: 0
      };
    });

    // Step 2: For each judge, determine rankings based on total raw scores
    eventJudges.forEach((judge, judgeIndex) => {
      // Get all participants' scores for this judge
      const judgeScores = participantData.map(p => ({
        participantId: p.participantId,
        totalRawScore: p.judgeRankings[judgeIndex].totalRawScore
      }));

      // Sort by total raw score descending
      judgeScores.sort((a, b) => b.totalRawScore - a.totalRawScore);

      // Assign ranks, handling ties
      let currentRank = 1;
      for (let i = 0; i < judgeScores.length; i++) {
        const currentScore = judgeScores[i].totalRawScore;
        
        // Check for ties
        const tiedParticipants = judgeScores.filter(js => js.totalRawScore === currentScore);
        
        if (tiedParticipants.length > 1) {
          // Calculate average rank for tied participants
          const tiedRanks = Array.from({ length: tiedParticipants.length }, (_, idx) => currentRank + idx);
          const averageRankForTied = tiedRanks.reduce((sum, r) => sum + r, 0) / tiedRanks.length;
          
          // Assign average rank to all tied participants
          tiedParticipants.forEach(tp => {
            const pData = participantData.find(p => p.participantId === tp.participantId);
            if (pData) {
              pData.judgeRankings[judgeIndex].rank = averageRankForTied;
            }
          });
          
          // Skip ahead
          i += tiedParticipants.length - 1;
          currentRank += tiedParticipants.length;
        } else {
          // No tie, assign rank
          const pData = participantData.find(p => p.participantId === judgeScores[i].participantId);
          if (pData) {
            pData.judgeRankings[judgeIndex].rank = currentRank;
          }
          currentRank++;
        }
      }
    });

    // Step 3: Calculate average ranking across all judges
    participantData.forEach(p => {
      const sumOfRanks = p.judgeRankings.reduce((sum, jr) => sum + jr.rank, 0);
      p.averageRank = sumOfRanks / p.judgeRankings.length;
      
      // Also calculate total raw score sum for tie-breaking
      p.totalRawScoreSum = p.judgeRankings.reduce((sum, jr) => sum + jr.totalRawScore, 0);
    });

    // Step 4: Determine final ranking based on average rank (lowest = best)
    // Tie-breaker: if average ranks are equal, higher total raw score wins
    const sortedByAverageRank = [...participantData].sort((a, b) => {
      if (a.averageRank === b.averageRank) {
        // Tie in average rank, use total raw score as tie-breaker
        return b.totalRawScoreSum - a.totalRawScoreSum;
      }
      return a.averageRank - b.averageRank;
    });

    // Assign final ranks (handling ties in average rank with same total score)
    let finalRank = 1;
    for (let i = 0; i < sortedByAverageRank.length; i++) {
      const current = sortedByAverageRank[i];
      
      // Check for complete ties (same average rank AND same total score)
      const completeTies = sortedByAverageRank.filter(p => 
        p.averageRank === current.averageRank && 
        p.totalRawScoreSum === current.totalRawScoreSum
      );
      
      if (completeTies.length > 1 && completeTies.includes(current)) {
        // Calculate average final rank for complete ties
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

    // Step 5: Calculate percentile scores using the formula
    // P = (N - (R - 1)) / N * 100
    // where N = total number of participants, R = final rank
    const N = participantData.length;
    participantData.forEach(p => {
      const R = p.finalRank;
      const K = N - (R - 1);
      const W = (1 / N) * 100;
      p.percentileScore = K * W;
    });

    // Sort by final rank for display
    return sortedByAverageRank;
  };

  const results = computeResults();

  const handleLockScores = async () => {
    if (selectedEventId) {
      if (confirm('Are you sure you want to lock scores? This will mark the event as Completed and prevent further changes.')) {
        setIsLocking(true);
        try {
          await lockEvent(selectedEventId);
          toast.success('Event locked and finalized.');
        } finally {
          setIsLocking(false);
        }
      }
    }
  };

  const getRankIcon = (finalRank: number) => {
    if (finalRank === 1) return <Trophy className="text-yellow-500" size={20} />;
    if (finalRank === 2) return <Medal className="text-slate-400" size={20} />;
    if (finalRank === 3) return <Award className="text-amber-700" size={20} />;
    return <span className="text-slate-500 font-mono font-bold">#{Math.floor(finalRank)}</span>;
  };

  const getRowStyle = (finalRank: number) => {
    if (finalRank === 1) return 'bg-yellow-50 border-l-4 border-yellow-400';
    if (finalRank === 2) return 'bg-slate-50 border-l-4 border-slate-300';
    if (finalRank === 3) return 'bg-orange-50 border-l-4 border-orange-300';
    return 'hover:bg-slate-50 border-l-4 border-transparent';
  };

  // Check if all participants have been scored by all judges
  const checkScoringCompleteness = () => {
    if (!selectedEvent) return { isComplete: false, missingCount: 0 };
    
    const eventParticipants = participants.filter(p => p.eventId === selectedEventId);
    const expectedScoresPerParticipant = selectedEvent.judgeCount * selectedEvent.criteria.length;
    
    let missingCount = 0;
    eventParticipants.forEach(participant => {
      const participantScores = scores.filter(s => 
        s.eventId === selectedEventId && 
        s.participantId === participant.id
      );
      if (participantScores.length < expectedScoresPerParticipant) {
        missingCount++;
      }
    });
    
    return { isComplete: missingCount === 0, missingCount };
  };

  const scoringStatus = checkScoringCompleteness();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tabulation & Results</h2>
          <p className="text-slate-500 text-sm mt-1">View calculated rankings using Average Ranking System</p>
        </div>
        <div className="w-full md:w-64">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none shadow-sm"
          >
            <option value="">-- Select Event to Tabulate --</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.status})</option>
            ))}
          </select>
        </div>
      </div>

      {selectedEvent ? (
        <div className="space-y-6">
          {!scoringStatus.isComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-amber-900">Incomplete Scoring</h4>
                <p className="text-sm text-amber-700 mt-1">
                  {scoringStatus.missingCount} participant(s) have incomplete scores. Rankings may not be accurate until all judges have scored all participants.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedEvent.name} - Official Rankings</h3>
                <p className="text-sm text-slate-500">
                  Judges: {selectedEvent.judgeCount} | Participants: {results.length} | Status: <span className="font-semibold">{selectedEvent.status}</span>
                </p>
              </div>
              {selectedEvent.status !== 'Completed' && (
                <button
                  onClick={handleLockScores}
                  disabled={isLocking}
                  className="flex items-center gap-2 bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLocking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Locking...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Finalize Results
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-24 text-center">Rank</th>
                    <th className="px-6 py-4">Participant / Team</th>
                    <th className="px-6 py-4 text-center">Avg Rank</th>
                    <th className="px-6 py-4 text-center">Total Raw Score</th>
                    <th className="px-6 py-4 text-right">Percentile Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No data available for calculation yet. Make sure participants are registered and scores are encoded.
                      </td>
                    </tr>
                  ) : (
                    results.map((result) => (
                      <tr key={result.participantId} className={`${getRowStyle(result.finalRank)} transition-colors`}>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center">
                            {getRankIcon(result.finalRank)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: result.color }} 
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-base">{result.participantName}</div>
                              <div className="text-xs font-semibold text-slate-500 uppercase tracking-tight">
                                {result.teamName} ({result.deptName})
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-700">
                          {result.averageRank.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-700">
                          {result.totalRawScoreSum.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-xl text-slate-900">
                          {result.percentileScore.toFixed(2)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {results.length > 0 && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
              <h4 className="font-bold text-slate-900 mb-3">Scoring Method: Average Ranking System</h4>
              <div className="text-sm text-slate-600 space-y-2">
                <p>• Each judge ranks participants based on total raw scores</p>
                <p>• Average ranking is calculated across all judges</p>
                <p>• Lower average rank = better placement</p>
                <p>• Tie-breaker: Higher total raw score wins</p>
                <p>• Percentile Score: P = (N - (R - 1)) / N × 100, where N = total participants, R = final rank</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Trophy className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">Select an event to view rankings</h3>
          <p className="text-slate-500">Choose an event from the dropdown above to see the tabulation board.</p>
        </div>
      )}
    </div>
  );
};