import React, { useState, useEffect } from 'react';
import { useApp, Score } from '../context/AppContext';
import { Save, AlertCircle, CheckCircle2, Edit3, Gavel, Users, Activity, Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ScoreEncoding: React.FC = () => {
  const { events, judges, participants, scores, updateScores, currentUser } = useApp();
  
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state to track inputs before saving/committing context if needed, 
  // but for now we can update context directly or keep a local buffer.
  // Direct context update might be laggy if many inputs. Let's use local buffer.
  const [localScores, setLocalScores] = useState<Record<string, number>>({});

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const eventParticipants = participants.filter(p => p.eventId === selectedEventId);

  // Initialize local scores from context when selection changes
  useEffect(() => {
    if (selectedEventId && selectedJudgeId) {
      const currentScores = scores.filter(s => s.eventId === selectedEventId && s.judgeId === selectedJudgeId);
      const scoreMap: Record<string, number> = {};
      currentScores.forEach(s => {
        scoreMap[`${s.participantId}-${s.criteriaId}`] = s.value;
      });
      setLocalScores(scoreMap);
    } else {
      setLocalScores({});
    }
  }, [selectedEventId, selectedJudgeId, scores]);

  const handleScoreChange = (participantId: string, criteriaId: string, value: string, max: number) => {
    let numValue = parseFloat(value);
    if (isNaN(numValue)) numValue = 0;
    
    // Validation
    if (numValue < 0) numValue = 0;
    if (numValue > max) {
      toast.error(`Score cannot exceed the criteria percentage of ${max}%`);
      numValue = max;
    }

    setLocalScores(prev => ({
      ...prev,
      [`${participantId}-${criteriaId}`]: numValue
    }));
  };

  const calculateParticipantTotal = (participantId: string) => {
    if (!selectedEvent) return 0;
    return selectedEvent.criteria.reduce((sum, c) => {
      return sum + (localScores[`${participantId}-${c.id}`] || 0);
    }, 0);
  };

  const handleSaveAll = async () => {
    if (!selectedEvent || !selectedJudgeId) return;

    setIsSaving(true);
    try {
      const scoresToUpdate: Score[] = [];

      Object.entries(localScores).forEach(([key, value]) => {
        const [participantId, criteriaId] = key.split('-');
        const score: Score = {
          eventId: selectedEvent.id,
          judgeId: selectedJudgeId,
          participantId,
          criteriaId,
          value,
          encodedBy: currentUser?.email || 'Unknown',
          lastUpdated: new Date().toISOString()
        };
        scoresToUpdate.push(score);
      });

      if (scoresToUpdate.length > 0) {
        await updateScores(scoresToUpdate);
        toast.success('Scores saved successfully');
      } else {
        toast.error('No scores to save. Please enter scores for at least one participant.');
      }
    } catch (error) {
      toast.error('Failed to save scores. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-navy-600 to-maroon-600 rounded-full" />
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Score Encoding</h2>
          </div>
          <p className="text-slate-600 font-medium flex items-center gap-2 ml-4">
            <Database size={16} className="text-maroon-600" />
            Official entry portal for judge-provided scorecards
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50 shadow-sm">
          <Activity size={16} className="text-green-600" />
          <span className="text-xs font-semibold text-green-700">Secure Protocol Active</span>
        </div>
      </div>

      {/* Selection Panel */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Event Selection</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 outline-none transition-all font-semibold text-slate-800"
          >
            <option value="">-- Select Event --</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Judge Assignment</label>
          <select
            value={selectedJudgeId}
            onChange={(e) => setSelectedJudgeId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 outline-none transition-all font-semibold text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedEventId}
          >
            <option value="">-- Select Judge --</option>
            {judges.map(j => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedEvent && selectedJudgeId ? (
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 bg-navy-950 border-b border-navy-900 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-maroon-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-maroon-900/20">
                <Gavel size={24} />
              </div>
              <div>
                <h3 className="font-black text-white text-xl tracking-tight leading-none">{selectedEvent.name}</h3>
                <p className="text-maroon-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-maroon-400" />
                  Official Scoring Ledger
                </p>
              </div>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="group flex items-center gap-3 bg-maroon-600 hover:bg-maroon-700 text-white px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-maroon-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="group-hover:rotate-12 transition-transform" />
                  Commit Scores
                </>
              )}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-[0.15em] text-[10px]">
                  <th className="px-8 py-6 min-w-[250px] border-b border-slate-100">Participant Entity</th>
                  {selectedEvent.criteria.map(c => (
                    <th key={c.id} className="px-8 py-6 text-center min-w-[120px] border-b border-slate-100 bg-slate-50/30">
                      {c.name} <span className="block text-[8px] font-black text-maroon-600 mt-1">({c.percentage} MAX)</span>
                    </th>
                  ))}
                  <th className="px-8 py-6 text-center min-w-[100px] bg-navy-900 text-white border-b border-navy-800">Total Sum</th>
                  <th className="px-8 py-6 text-center border-b border-slate-100">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {eventParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={selectedEvent.criteria.length + 3} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-slate-50 rounded-full">
                          <Users className="text-slate-300" size={40} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No participants registered for this event scope.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  eventParticipants.map(participant => {
                    const total = calculateParticipantTotal(participant.id);
                    const isComplete = selectedEvent.criteria.every(c => 
                      localScores[`${participant.id}-${c.id}`] !== undefined
                    );

                    return (
                      <tr key={participant.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                        <td className="px-8 py-6 border-r border-slate-50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black group-hover:bg-navy-900 group-hover:text-white transition-all duration-300">
                              {participant.name.charAt(0)}
                            </div>
                            <span className="font-black text-slate-800 tracking-tight group-hover:text-maroon-700 transition-colors">
                              {participant.name}
                            </span>
                          </div>
                        </td>
                        {selectedEvent.criteria.map(c => (
                          <td key={c.id} className="px-8 py-6 text-center border-r border-slate-50">
                            <div className="relative inline-block">
                              <input
                                type="number"
                                min="0"
                                max={c.percentage}
                                step="0.5"
                                value={localScores[`${participant.id}-${c.id}`] ?? ''}
                                onChange={(e) => handleScoreChange(participant.id, c.id, e.target.value, c.percentage)}
                                className="w-20 px-3 py-2 text-center bg-white border border-slate-200 rounded-xl font-black text-navy-900 focus:ring-4 focus:ring-maroon-600/10 focus:border-maroon-600 outline-none transition-all shadow-sm group-hover:shadow-md"
                              />
                            </div>
                          </td>
                        ))}
                        <td className="px-8 py-6 text-center bg-navy-50/50 border-r border-slate-50">
                          <span className={`text-xl font-black tracking-tighter ${total > 0 ? 'text-maroon-700' : 'text-slate-300'}`}>
                            {total.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex justify-center">
                            {isComplete ? (
                              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner border border-green-200">
                                <CheckCircle2 size={16} />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border border-amber-100 animate-pulse">
                                <AlertCircle size={16} />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
              All entries are timestamped and linked to encoder: <span className="text-navy-900">{currentUser?.email}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 group">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500">
            <Gavel className="text-slate-200 h-12 w-12" />
          </div>
          <p className="text-slate-800 text-xl font-black tracking-tight">Scope Selection Required</p>
          <p className="text-slate-400 mt-3 max-w-sm mx-auto font-medium leading-relaxed">Please select both an active Event scope and an assigned Judge reference to initialize the scoring matrix.</p>
        </div>
      )}
    </div>
  );
};