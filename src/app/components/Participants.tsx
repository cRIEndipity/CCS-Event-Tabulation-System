import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, User, Building2, Trash2, Users, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

export const Participants: React.FC = () => {
  const { participants, departments, events, colleges, addParticipant, deleteParticipant } = useApp();
  const [activeTab, setActiveTab] = useState<'participants' | 'summary'>('participants');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newEvent, setNewEvent] = useState('');

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDept || !newEvent) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsLoading(true);
    try {
      await addParticipant({
        name: newName,
        departmentId: newDept,
        eventId: newEvent
      });
      setIsModalOpen(false);
      setNewName('');
      setNewDept('');
      setNewEvent('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteParticipant = async (id: string, name: string) => {
    if (window.confirm(`Delete participant "${name}"?`)) {
      await deleteParticipant(id);
    }
  };

  const getCollegeName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return '';
    return colleges.find(c => c.id === dept.collegeId)?.name || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Participant Management</h2>
          <p className="text-slate-500 text-sm mt-1">Assign contestants to specific events and teams</p>
        </div>
        <div className="flex bg-slate-200 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'participants' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Participants
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'summary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Team Summary
          </button>
        </div>
      </div>

      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm text-sm disabled:opacity-50"
              disabled={isLoading}
            >
              <Plus size={18} />
              Add Participant
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4">Participant Name</th>
                  <th className="px-6 py-4">Team & College</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                      No participants registered yet.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => {
                    const dept = departments.find(d => d.id === p.departmentId);
                    const college = colleges.find(c => c.id === dept?.collegeId);
                    const evt = events.find(e => e.id === p.eventId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                              <User size={14} />
                            </div>
                            {p.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dept?.color || '#ccc' }}></div>
                              {dept?.teamName || 'Unknown Team'}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold ml-3.5">
                              {college?.name || 'No College'} • {dept?.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-normal text-slate-600 border-slate-200">
                            {evt?.name || 'Unknown Event'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteParticipant(p.id, p.name)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1 disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const college = colleges.find(c => c.id === dept.collegeId);
            const deptParticipants = participants.filter(p => p.departmentId === dept.id);
            const eventCounts: Record<string, number> = {};
            deptParticipants.forEach(p => {
              eventCounts[p.eventId] = (eventCounts[p.eventId] || 0) + 1;
            });

            return (
              <div key={dept.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: dept.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{dept.teamName}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">{college?.name}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Total Members:</span>
                    <Badge className="bg-blue-50 text-blue-800 border-blue-200">{deptParticipants.length}</Badge>
                  </div>
                  {Object.entries(eventCounts).map(([eventId, count]) => {
                    const event = events.find(e => e.id === eventId);
                    return (
                      <div key={eventId} className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 rounded">
                        <span className="text-slate-600 truncate">{event?.name || 'Unknown'}</span>
                        <Badge variant="outline" className="text-slate-700">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Participant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Participant</h3>
            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Participant Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  placeholder="e.g., Juan Dela Cruz"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department/Team *</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.teamName} ({colleges.find(c => c.id === d.collegeId)?.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event *</label>
                <select
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Event</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Adding' : 'Add Participant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
