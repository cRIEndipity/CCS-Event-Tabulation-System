import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// --- Types ---
export type Committee = {
  id: string;
  name: string;
  status: 'Active' | 'Archived';
  baseBearing?: number; // B_base
};

export type EventType = 'Individual' | 'Group';

export type Event = {
  id: string;
  committeeId: string;
  name: string;
  type: EventType;
  judgeCount: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  criteria: Criterion[];
  scheduledDate?: string;  // ISO date string
  scheduledTime?: string;  // Time string
  venue?: string;
  bearing?: number;  // Weight percentage for this event within its committee (for overall championship)
  
  // Rating inputs for weight calculation
  ratingTL?: number;
  ratingC?: number;
  ratingRI?: number;
  ratingPI?: number;

  judgeIds?: string[]; // IDs of judges assigned to this event
};

export type Criterion = {
  id: string;
  name: string;
  percentage: number;
};

export type Judge = {
  id: string;
  name: string;
  role: string;
};

export type College = {
  id: string;
  name: string;
};

export type Department = {
  id: string;
  collegeId: string;
  name: string;
  teamName: string;
  color: string;
};

export type Participant = {
  id: string;
  name: string;
  departmentId: string;
  eventId: string;
};

export type Score = {
  eventId: string;
  judgeId: string;
  participantId: string;
  criteriaId: string;
  value: number;
  encodedBy?: string;
  lastUpdated?: string;
};

export type ChatMessage = {
  id: string;
  senderEmail: string;
  senderName: string;
  content: string;
  timestamp: string;
  role: 'Admin' | 'Representative';
};

interface AppState {
  currentUser: any;
  setCurrentUser: (user: any) => void;
  colleges: College[];
  committees: Committee[];
  events: Event[];
  judges: Judge[];
  departments: Department[];
  participants: Participant[];
  scores: Score[];
  messages: ChatMessage[];
  isLoading: boolean;
  
  // Actions
  addCollege: (college: Omit<College, 'id'>) => Promise<void>;
  deleteCollege: (id: string) => Promise<void>;
  addDepartment: (dept: Omit<Department, 'id'>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addCommittee: (committee: Omit<Committee, 'id'>) => Promise<void>;
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  updateEvents: (updates: { id: string, changes: Partial<Event> }[]) => Promise<void>;
  addJudge: (judge: Omit<Judge, 'id'>) => Promise<void>;
  addParticipant: (participant: Omit<Participant, 'id'>) => Promise<void>;
  deleteCommittee: (id: string) => Promise<void>;
  updateCommittee: (id: string, updates: Partial<Committee>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  deleteJudge: (id: string) => Promise<void>;
  deleteParticipant: (id: string) => Promise<void>;
  updateScore: (score: Score) => Promise<void>;
  updateScores: (newScores: Score[]) => Promise<void>;
  lockEvent: (eventId: string) => Promise<void>;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data from Supabase
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [collegesRes, committeesRes, eventsRes, judgesRes, deptsRes, partsRes, scoresRes, msgsRes, criteriaRes] = await Promise.all([
        supabase.from('colleges').select('*'),
        supabase.from('committees').select('*'),
        supabase.from('events').select('*'),
        supabase.from('judges').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('participants').select('*'),
        supabase.from('scores').select('*'),
        supabase.from('chat_messages').select('*').order('timestamp', { ascending: true }),
        supabase.from('criteria').select('*'),
      ]);

      // Transform Supabase data to component types
      setColleges(collegesRes.data?.map(c => ({ id: c.id, name: c.name })) || []);
      setCommittees(committeesRes.data?.map(c => ({ id: c.id, name: c.name, status: c.status, baseBearing: c.base_bearing })) || []);
      setJudges(judgesRes.data?.map(j => ({ id: j.id, name: j.name, role: j.role })) || []);
      setDepartments(deptsRes.data?.map(d => ({ id: d.id, collegeId: d.college_id, name: d.name, teamName: d.team_name, color: d.color })) || []);
      setParticipants(partsRes.data?.map(p => ({ id: p.id, name: p.name, departmentId: p.department_id, eventId: p.event_id })) || []);
      setScores(scoresRes.data?.map(s => ({ eventId: s.event_id, judgeId: s.judge_id, participantId: s.participant_id, criteriaId: s.criterion_id, value: s.value, encodedBy: s.encoded_by, lastUpdated: s.last_updated })) || []);
      setMessages(msgsRes.data?.map(m => ({ id: m.id, senderEmail: m.sender_email, senderName: m.sender_name, content: m.content, timestamp: m.timestamp, role: m.role })) || []);

      // Map events with their criteria
      const eventsData = eventsRes.data || [];
      const criteriaData = criteriaRes.data || [];
      const mappedEvents = eventsData.map(e => ({
        id: e.id,
        committeeId: e.committee_id,
        name: e.name,
        type: e.type,
        judgeCount: e.judge_count,
        status: e.status,
        scheduledDate: e.scheduled_date,
        scheduledTime: e.scheduled_time,
        venue: e.venue,
        bearing: e.bearing,
        ratingTL: e.rating_tl,
        ratingC: e.rating_c,
        ratingRI: e.rating_ri,
        ratingPI: e.rating_pi,
        criteria: criteriaData.filter(c => c.event_id === e.id).map(c => ({ id: c.id, name: c.name, percentage: c.percentage })) || [],
      }));
      setEvents(mappedEvents);

      if (collegesRes.error) console.error('Error fetching colleges:', collegesRes.error);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Subscribe to real-time changes
    const channels = [
      supabase.channel('colleges').on('*', () => fetchData()).subscribe(),
      supabase.channel('committees').on('*', () => fetchData()).subscribe(),
      supabase.channel('events').on('*', () => fetchData()).subscribe(),
      supabase.channel('judges').on('*', () => fetchData()).subscribe(),
      supabase.channel('departments').on('*', () => fetchData()).subscribe(),
      supabase.channel('participants').on('*', () => fetchData()).subscribe(),
      supabase.channel('scores').on('*', () => fetchData()).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  // College Actions
  const addCollege = async (college: Omit<College, 'id'>) => {
    try {
      const { error } = await supabase.from('colleges').insert([{ id: uuidv4(), name: college.name }]);
      if (error) throw error;
      await fetchData();
      toast.success('College added successfully');
    } catch (error) {
      console.error('Error adding college:', error);
      toast.error('Failed to add college');
    }
  };

  const deleteCollege = async (id: string) => {
    try {
      const { error } = await supabase.from('colleges').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      toast.success('College deleted successfully');
    } catch (error) {
      console.error('Error deleting college:', error);
      toast.error('Failed to delete college');
    }
  };

  // Department Actions
  const addDepartment = async (dept: Omit<Department, 'id'>) => {
    try {
      const { error } = await supabase.from('departments').insert([{
        id: uuidv4(),
        college_id: dept.collegeId,
        name: dept.name,
        team_name: dept.teamName,
        color: dept.color
      }]);
      if (error) throw error;
      await fetchData();
      toast.success('Team added successfully');
    } catch (error) {
      console.error('Error adding department:', error);
      toast.error('Failed to add team');
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      toast.success('Team deleted successfully');
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete team');
    }
  };

  // Committee Actions
  const addCommittee = async (committee: Omit<Committee, 'id'>) => {
    try {
      const { error } = await supabase.from('committees').insert([{
        id: uuidv4(),
        name: committee.name,
        status: committee.status,
        base_bearing: committee.baseBearing || null
      }]);
      if (error) throw error;
      await fetchData();
      toast.success('Committee added successfully');
    } catch (error) {
      console.error('Error adding committee:', error);
      toast.error('Failed to add committee');
    }
  };

  const deleteCommittee = async (id: string) => {
    try {
      const { error } = await supabase.from('committees').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      toast.success('Committee deleted successfully');
    } catch (error) {
      console.error('Error deleting committee:', error);
      toast.error('Failed to delete committee');
    }
  };

  const updateCommittee = async (id: string, updates: Partial<Committee>) => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.baseBearing !== undefined) updateData.base_bearing = updates.baseBearing;

      const { error } = await supabase.from('committees').update(updateData).eq('id', id);
      if (error) throw error;
      await fetchData();
      toast.success('Committee updated successfully');
    } catch (error) {
      console.error('Error updating committee:', error);
      toast.error('Failed to update committee');
    }
  };

  // Event Actions
  const addEvent = async (event: Omit<Event, 'id'>) => {
    try {
      const eventId = uuidv4();
      const { error: eventError } = await supabase.from('events').insert([{
        id: eventId,
        committee_id: event.committeeId,
        name: event.name,
        type: event.type,
        judge_count: event.judgeCount,
        status: event.status,
        scheduled_date: event.scheduledDate,
        scheduled_time: event.scheduledTime,
        venue: event.venue,
        bearing: event.bearing,
        rating_tl: event.ratingTL,
        rating_c: event.ratingC,
        rating_ri: event.ratingRI,
        rating_pi: event.ratingPI,
      }]);
      if (eventError) throw eventError;

      // Add criteria if provided
      if (event.criteria && event.criteria.length > 0) {
        const criteriaData = event.criteria.map(c => ({
          id: uuidv4(),
          event_id: eventId,
          name: c.name,
          percentage: c.percentage
        }));
        const { error: critError } = await supabase.from('criteria').insert(criteriaData);
        if (critError) throw critError;
      }

      await fetchData();
      toast.success('Event added successfully');
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    await updateEvents([{ id, changes: updates }]);
  };

  const updateEvents = async (eventUpdates: { id: string, changes: Partial<Event> }[]) => {
    try {
      for (const { id, changes } of eventUpdates) {
        const updateData: any = {};
        if (changes.name !== undefined) updateData.name = changes.name;
        if (changes.status !== undefined) updateData.status = changes.status;
        if (changes.judgeCount !== undefined) updateData.judge_count = changes.judgeCount;
        if (changes.scheduledDate !== undefined) updateData.scheduled_date = changes.scheduledDate;
        if (changes.scheduledTime !== undefined) updateData.scheduled_time = changes.scheduledTime;
        if (changes.venue !== undefined) updateData.venue = changes.venue;
        if (changes.bearing !== undefined) updateData.bearing = changes.bearing;
        if (changes.ratingTL !== undefined) updateData.rating_tl = changes.ratingTL;
        if (changes.ratingC !== undefined) updateData.rating_c = changes.ratingC;
        if (changes.ratingRI !== undefined) updateData.rating_ri = changes.ratingRI;
        if (changes.ratingPI !== undefined) updateData.rating_pi = changes.ratingPI;

        const { error } = await supabase.from('events').update(updateData).eq('id', id);
        if (error) throw error;
      }
      await fetchData();
      toast.success('Event(s) updated successfully');
    } catch (error) {
      console.error('Error updating events:', error);
      toast.error('Failed to update event(s)');
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const lockEvent = async (eventId: string) => {
    await updateEvent(eventId, { status: 'Completed' });
  };

  // Judge Actions
  const addJudge = async (judge: Omit<Judge, 'id'>) => {
    try {
      const { error } = await supabase.from('judges').insert([{
        id: uuidv4(),
        name: judge.name,
        role: judge.role
      }]);
      if (error) throw error;
      await fetchData();
      toast.success('Judge added successfully');
    } catch (error) {
      console.error('Error adding judge:', error);
      toast.error('Failed to add judge');
    }
  };

  const deleteJudge = async (id: string) => {
    try {
      const { error } = await supabase.from('judges').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      toast.success('Judge deleted successfully');
    } catch (error) {
      console.error('Error deleting judge:', error);
      toast.error('Failed to delete judge');
    }
  };

  // Participant Actions
  const addParticipant = async (participant: Omit<Participant, 'id'>) => {
    try {
      const { error } = await supabase.from('participants').insert([{
        id: uuidv4(),
        name: participant.name,
        department_id: participant.departmentId,
        event_id: participant.eventId
      }]);
      if (error) throw error;
      await fetchData();
      toast.success('Participant added successfully');
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Failed to add participant');
    }
  };

  const deleteParticipant = async (id: string) => {
    try {
      const { error } = await supabase.from('participants').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      toast.success('Participant deleted successfully');
    } catch (error) {
      console.error('Error deleting participant:', error);
      toast.error('Failed to delete participant');
    }
  };

  // Score Actions
  const updateScore = async (score: Score) => {
    await updateScores([score]);
  };

  const updateScores = async (newScores: Score[]) => {
    try {
      for (const score of newScores) {
        const existingScore = await supabase
          .from('scores')
          .select('id')
          .eq('event_id', score.eventId)
          .eq('judge_id', score.judgeId)
          .eq('participant_id', score.participantId)
          .eq('criterion_id', score.criteriaId)
          .single();

        if (existingScore.data) {
          const { error } = await supabase
            .from('scores')
            .update({
              value: score.value,
              encoded_by: score.encodedBy,
              last_updated: new Date().toISOString()
            })
            .eq('id', existingScore.data.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('scores').insert([{
            id: uuidv4(),
            event_id: score.eventId,
            judge_id: score.judgeId,
            participant_id: score.participantId,
            criterion_id: score.criteriaId,
            value: score.value,
            encoded_by: score.encodedBy,
            last_updated: new Date().toISOString()
          }]);
          if (error) throw error;
        }
      }
      await fetchData();
      toast.success('Score(s) updated successfully');
    } catch (error) {
      console.error('Error updating scores:', error);
      toast.error('Failed to update score(s)');
    }
  };

  // Message Actions
  const addMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    try {
      const { error } = await supabase.from('chat_messages').insert([{
        id: uuidv4(),
        sender_email: message.senderEmail,
        sender_name: message.senderName,
        content: message.content,
        role: message.role,
        timestamp: new Date().toISOString()
      }]);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to send message');
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      colleges,
      committees,
      events,
      judges,
      departments,
      participants,
      scores,
      messages,
      isLoading,
      addCollege,
      deleteCollege,
      addDepartment,
      deleteDepartment,
      addCommittee,
      updateCommittee,
      addEvent,
      updateEvent,
      updateEvents,
      addJudge,
      addParticipant,
      deleteCommittee,
      deleteEvent,
      deleteJudge,
      deleteParticipant,
      updateScores,
      updateScore,
      lockEvent,
      addMessage,
      refreshData: fetchData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};