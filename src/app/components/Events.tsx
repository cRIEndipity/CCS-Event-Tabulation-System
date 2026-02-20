import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Filter, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Events: React.FC = () => {
  const { events, committees, addEvent, deleteEvent, updateEvent } = useApp();
  const [selectedCommittee, setSelectedCommittee] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // New Event State
  const [newEventName, setNewEventName] = useState('');
  const [newEventCommittee, setNewEventCommittee] = useState('');
  const [newEventType, setNewEventType] = useState<'Individual' | 'Group'>('Individual');
  const [newEventJudgeCount, setNewEventJudgeCount] = useState(3);
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('');

  const filteredEvents = selectedCommittee === 'all' 
    ? events 
    : events.filter(e => e.committeeId === selectedCommittee);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim() || !newEventCommittee) {
      toast.error('Please fill in required fields');
      return;
    }
    setIsLoading(true);
    try {
      await addEvent({
        committeeId: newEventCommittee,
        name: newEventName,
        type: newEventType,
        judgeCount: newEventJudgeCount,
        status: 'Upcoming',
        criteria: [],
        scheduledDate: newEventDate || undefined,
        scheduledTime: newEventTime || undefined,
        venue: newEventVenue || undefined,
      });
      // Reset form
      setNewEventName('');
      setNewEventCommittee('');
      setNewEventDate('');
      setNewEventTime('');
      setNewEventVenue('');
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? All associated scores will also be deleted.')) {
      await deleteEvent(id);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'Upcoming' | 'Ongoing' | 'Completed') => {
    await updateEvent(id, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Events Management</h2>
          <p className="text-slate-500 text-sm mt-1">Configure competition events and parameters</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedCommittee}
              onChange={(e) => setSelectedCommittee(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
            >
              <option value="all">All Committees</option>
              {committees.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm text-sm disabled:opacity-50"
            disabled={isLoading}
          >
            <Plus size={18} />
            Add Event
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Event Name</th>
              <th className="px-6 py-4">Committee</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Judges</th>
              <th className="px-6 py-4">Scheduled</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No events found. Try changing the filter or add a new event.
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => {
                const committee = committees.find(c => c.id === event.committeeId);
                return (
                  <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{event.name}</td>
                    <td className="px-6 py-4 text-slate-600">{committee?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-slate-600">{event.type}</td>
                    <td className="px-6 py-4 text-slate-600">{event.judgeCount}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-slate-600">
                        {event.scheduledDate ? new Date(event.scheduledDate).toLocaleDateString() : '-'}
                      </div>
                      {event.scheduledTime && <div className="text-xs text-slate-400">{event.scheduledTime}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={event.status}
                        onChange={(e) => handleStatusChange(event.id, e.target.value as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer ${
                          event.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          event.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Event</h3>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Name *</label>
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  placeholder="e.g., Vocal Solo"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Committee *</label>
                <select
                  value={newEventCommittee}
                  onChange={(e) => setNewEventCommittee(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Committee</option>
                  {committees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as 'Individual' | 'Group')}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                    disabled={isLoading}
                  >
                    <option value="Individual">Individual</option>
                    <option value="Group">Group</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Number of Judges</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newEventJudgeCount}
                    onChange={(e) => setNewEventJudgeCount(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Venue (Optional)</label>
                <input
                  type="text"
                  value={newEventVenue}
                  onChange={(e) => setNewEventVenue(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  placeholder="e.g., Main Auditorium"
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
                  {isLoading ? 'Creating' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};