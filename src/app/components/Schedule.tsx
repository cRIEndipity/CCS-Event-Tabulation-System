import React, { useState } from 'react';
import { useApp, Event } from '../context/AppContext';
import { Calendar, Clock, MapPin, Users, Filter, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export const Schedule: React.FC = () => {
  const { events, committees, updateEvent } = useApp();
  const [selectedCommittee, setSelectedCommittee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Event>>({});

  const filteredEvents = events.filter(e => {
    const matchesCommittee = selectedCommittee === 'all' || e.committeeId === selectedCommittee;
    const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
    return matchesCommittee && matchesStatus;
  });

  // Sort events by date and time
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = a.scheduledDate || '9999-12-31';
    const dateB = b.scheduledDate || '9999-12-31';
    const timeA = a.scheduledTime || '23:59';
    const timeB = b.scheduledTime || '23:59';
    
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    return timeA.localeCompare(timeB);
  });

  // Group events by date
  const eventsByDate = sortedEvents.reduce((acc, event) => {
    const date = event.scheduledDate || 'Unscheduled';
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const formatDate = (dateStr: string) => {
    if (dateStr === 'Unscheduled') return 'Unscheduled Events';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'Time TBD';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Ongoing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Upcoming': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const startEditing = (event: Event) => {
    setEditingEventId(event.id);
    setEditForm({
      scheduledDate: event.scheduledDate,
      scheduledTime: event.scheduledTime,
      status: event.status,
      venue: event.venue
    });
  };

  const cancelEditing = () => {
    setEditingEventId(null);
    setEditForm({});
  };

  const saveEditing = (eventId: string) => {
    updateEvent(eventId, editForm);
    setEditingEventId(null);
    setEditForm({});
    toast.success('Event schedule updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Event Schedule</h2>
          <p className="text-slate-500 text-sm mt-1">Manage and view competition timeline</p>
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
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {Object.keys(eventsByDate).length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No events found</h3>
          <p className="text-slate-500">Try adjusting your filters or add new events.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(eventsByDate).map(([date, dateEvents]) => (
            <div key={date} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-blue-900 text-white px-6 py-3 flex items-center gap-2">
                <Calendar size={20} />
                <h3 className="font-bold text-lg">{formatDate(date)}</h3>
                <span className="ml-auto text-sm opacity-90">{dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {dateEvents.map((event) => {
                  const committee = committees.find(c => c.id === event.committeeId);
                  const isEditing = editingEventId === event.id;

                  return (
                    <div key={event.id} className={`p-6 transition-colors ${isEditing ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-lg font-bold text-slate-900">{event.name}</h4>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => saveEditing(event.id)}
                                className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                                title="Save"
                              >
                                <Save size={18} />
                              </button>
                              <button 
                                onClick={cancelEditing}
                                className="p-2 bg-slate-400 text-white rounded hover:bg-slate-500"
                                title="Cancel"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                              <input 
                                type="date" 
                                value={editForm.scheduledDate || ''} 
                                onChange={(e) => setEditForm({...editForm, scheduledDate: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Time</label>
                              <input 
                                type="time" 
                                value={editForm.scheduledTime || ''} 
                                onChange={(e) => setEditForm({...editForm, scheduledTime: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                              <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                                className="w-full p-2 border border-slate-300 rounded text-sm"
                              >
                                <option value="Upcoming">Upcoming</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Venue</label>
                              <input 
                                type="text" 
                                value={editForm.venue || ''} 
                                onChange={(e) => setEditForm({...editForm, venue: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded text-sm"
                                placeholder="TBD"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <Clock size={20} className="text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-bold text-slate-900">{event.name}</h4>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                                    {event.status}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-slate-600">
                                  <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-slate-400" />
                                    <span>{formatTime(event.scheduledTime)}</span>
                                  </div>
                                  
                                  {event.venue && (
                                    <div className="flex items-center gap-2">
                                      <MapPin size={16} className="text-slate-400" />
                                      <span>{event.venue}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-2">
                                    <Users size={16} className="text-slate-400" />
                                    <span>{committee?.name || 'Unknown Committee'}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">Type:</span>
                                    <span className="font-medium">{event.type}</span>
                                  </div>
                                </div>
                                
                                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                  <span>Judges: {event.judgeCount}</span>
                                  <span>•</span>
                                  <span>Criteria: {event.criteria.length}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => startEditing(event)}
                            className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit Schedule"
                          >
                            <Edit2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};