import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, User, Info, Trash2, Calendar, Clock, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Judges: React.FC = () => {
  const { judges, addJudge, deleteJudge, events, updateEvent, updateEvents } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeRole, setNewJudgeRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeName.trim()) {
      toast.error('Judge name cannot be empty');
      return;
    }
    setIsLoading(true);
    try {
      await addJudge({ name: newJudgeName, role: newJudgeRole || 'General Judge' });
      setNewJudgeName('');
      setNewJudgeRole('');
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const openAssignModal = (judgeId: string) => {
    setSelectedJudgeId(judgeId);
    // Find events where this judge is already assigned
    const assigned = events.filter(e => e.judgeIds?.includes(judgeId)).map(e => e.id);
    setSelectedEventIds(new Set(assigned));
    setIsAssignModalOpen(true);
  };

  const handleToggleEvent = (eventId: string) => {
    const newSet = new Set(selectedEventIds);
    if (newSet.has(eventId)) {
      newSet.delete(eventId);
    } else {
      newSet.add(eventId);
    }
    setSelectedEventIds(newSet);
  };

  const handleSaveAssignments = async () => {
    if (!selectedJudgeId) return;

    setIsLoading(true);
    try {
      // Create a list of updates
      const updates: { id: string, changes: Partial<any> }[] = [];
      
      events.forEach(event => {
        const currentJudgeIds = event.judgeIds || [];
        const shouldHaveJudge = selectedEventIds.has(event.id);
        const hasJudge = currentJudgeIds.includes(selectedJudgeId);

        if (shouldHaveJudge && !hasJudge) {
          // Add judge
          updates.push({
            id: event.id,
            changes: { judgeIds: [...currentJudgeIds, selectedJudgeId] }
          });
        } else if (!shouldHaveJudge && hasJudge) {
          // Remove judge
          updates.push({
            id: event.id,
            changes: { judgeIds: currentJudgeIds.filter(id => id !== selectedJudgeId) }
          });
        }
      });

      if (updates.length > 0) {
        await updateEvents(updates);
      }

      toast.success('Judge assignments updated');
      setIsAssignModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getJudgeSchedule = (judgeId: string) => {
    const assignedEvents = events.filter(e => e.judgeIds?.includes(judgeId));
    
    // Sort by date/time
    return assignedEvents.sort((a, b) => {
      const dateA = a.scheduledDate || '9999-12-31';
      const dateB = b.scheduledDate || '9999-12-31';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.scheduledTime || '23:59').localeCompare(b.scheduledTime || '23:59');
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'TBD';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Date TBD';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Judges Reference List</h2>
          <p className="text-slate-500 text-sm mt-1">Manage adjudicators and their event assignments</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          disabled={isLoading}
        >
          <Plus size={18} />
          Add Judge
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-md p-4 flex items-start gap-3">
        <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-blue-800">
          Note: Assign judges to events to see their schedule. This affects scoring in the Tabulation module.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200 sticky top-0">
            <tr>
              <th className="px-6 py-4">Judge Name</th>
              <th className="px-6 py-4">Role / Designation</th>
              <th className="px-6 py-4">Assigned Schedule</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {judges.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  No judges added yet. Add one to get started.
                </td>
              </tr>
            ) : (
              judges.map((judge) => {
                const schedule = getJudgeSchedule(judge.id);
                
                return (
                  <tr key={judge.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{judge.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{judge.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">{judge.role}</td>
                    <td className="px-6 py-4 align-top">
                      {schedule.length > 0 ? (
                        <div className="space-y-2">
                          {schedule.slice(0, 3).map(event => (
                            <div key={event.id} className="flex items-center gap-2 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                              <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                              <span className="font-semibold text-slate-700 w-16">{formatDate(event.scheduledDate)}</span>
                              <Clock size={12} className="text-slate-400 ml-1 flex-shrink-0" />
                              <span className="text-slate-600 w-14">{formatTime(event.scheduledTime)}</span>
                              <span className="font-medium text-blue-900 truncate max-w-[150px]" title={event.name}>
                                {event.name}
                              </span>
                            </div>
                          ))}
                          {schedule.length > 3 && (
                            <div className="text-xs text-slate-500 italic">
                              +{schedule.length - 3} more event(s)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No events assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openAssignModal(judge.id)}
                          className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded p-1 transition-colors disabled:opacity-50"
                          title="Assign Events"
                          disabled={isLoading}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this judge?')) {
                              await deleteJudge(judge.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors disabled:opacity-50"
                          title="Delete Judge"
                          disabled={isLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Judge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Judge</h3>
            <form onSubmit={handleAddJudge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judge Name *</label>
                <input
                  type="text"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  placeholder="e.g., Dr. Jane Doe"
                  autoFocus
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role (Optional)</label>
                <input
                  type="text"
                  value={newJudgeRole}
                  onChange={(e) => setNewJudgeRole(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  placeholder="e.g., Chairman"
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Adding' : 'Add Judge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Events Modal */}
      {isAssignModalOpen && selectedJudgeId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Assign Events</h3>
            <p className="text-sm text-slate-500 mb-4">Select events for <span className="font-semibold">{judges.find(j => j.id === selectedJudgeId)?.name}</span></p>
            
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-md p-2 space-y-2">
              {events.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No events available</div>
              ) : (
                events.map(event => (
                  <div 
                    key={event.id}
                    className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedEventIds.has(event.id) 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => handleToggleEvent(event.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEventIds.has(event.id)}
                      readOnly
                      className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{event.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          event.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                          event.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {event.status}
                        </span>
                        <span>•</span>
                        <span>{formatDate(event.scheduledDate)} @ {formatTime(event.scheduledTime)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Saving' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};