import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

// Database schema types
export interface College {
  id: string;
  name: string;
  created_at: string;
}

export interface Department {
  id: string;
  college_id: string;
  name: string;
  team_name: string;
  color: string;
  created_at: string;
}

export interface Committee {
  id: string;
  name: string;
  status: 'Active' | 'Archived';
  base_bearing?: number;
  created_at: string;
}

export interface Event {
  id: string;
  committee_id: string;
  name: string;
  type: 'Individual' | 'Group';
  judge_count: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  scheduled_date?: string;
  scheduled_time?: string;
  venue?: string;
  bearing?: number;
  rating_tl?: number;
  rating_c?: number;
  rating_ri?: number;
  rating_pi?: number;
  created_at: string;
}

export interface Criterion {
  id: string;
  event_id: string;
  name: string;
  percentage: number;
  created_at: string;
}

export interface Judge {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

export interface EventJudge {
  id: string;
  event_id: string;
  judge_id: string;
  created_at: string;
}

export interface Participant {
  id: string;
  name: string;
  department_id: string;
  event_id: string;
  created_at: string;
}

export interface Score {
  id: string;
  event_id: string;
  judge_id: string;
  participant_id: string;
  criterion_id: string;
  value: number;
  encoded_by?: string;
  last_updated: string;
}

export interface ChatMessage {
  id: string;
  sender_email: string;
  sender_name: string;
  content: string;
  role: 'Admin' | 'Representative';
  timestamp: string;
}

// Helper functions
export const initializeDatabase = async () => {
  // This will handle schema creation if tables don't exist
  // In production, you'd run migrations through the Supabase dashboard
  console.log('Database initialized');
};

export const uploadDatabaseSchema = async () => {
  // Execute the SQL schema creation in Supabase
  const schema = `
    -- Create colleges table
    CREATE TABLE IF NOT EXISTS colleges (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create departments table
    CREATE TABLE IF NOT EXISTS departments (
      id UUID PRIMARY KEY,
      college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      team_name TEXT NOT NULL,
      color TEXT DEFAULT '#1e3a8a',
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create committees table
    CREATE TABLE IF NOT EXISTS committees (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      base_bearing NUMERIC,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create events table
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY,
      committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'Individual',
      judge_count INTEGER DEFAULT 3,
      status TEXT DEFAULT 'Upcoming',
      scheduled_date TEXT,
      scheduled_time TEXT,
      venue TEXT,
      bearing NUMERIC,
      rating_tl NUMERIC,
      rating_c NUMERIC,
      rating_ri NUMERIC,
      rating_pi NUMERIC,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create criteria table
    CREATE TABLE IF NOT EXISTS criteria (
      id UUID PRIMARY KEY,
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      percentage NUMERIC DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create judges table
    CREATE TABLE IF NOT EXISTS judges (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create event_judges junction table
    CREATE TABLE IF NOT EXISTS event_judges (
      id UUID PRIMARY KEY,
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create participants table
    CREATE TABLE IF NOT EXISTS participants (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create scores table
    CREATE TABLE IF NOT EXISTS scores (
      id UUID PRIMARY KEY,
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
      participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
      value NUMERIC NOT NULL,
      encoded_by TEXT,
      last_updated TIMESTAMP DEFAULT NOW()
    );

    -- Create chat_messages table
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY,
      sender_email TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      content TEXT NOT NULL,
      role TEXT DEFAULT 'Representative',
      timestamp TIMESTAMP DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX idx_departments_college ON departments(college_id);
    CREATE INDEX idx_events_committee ON events(committee_id);
    CREATE INDEX idx_criteria_event ON criteria(event_id);
    CREATE INDEX idx_event_judges_event ON event_judges(event_id);
    CREATE INDEX idx_event_judges_judge ON event_judges(judge_id);
    CREATE INDEX idx_participants_department ON participants(department_id);
    CREATE INDEX idx_participants_event ON participants(event_id);
    CREATE INDEX idx_scores_event ON scores(event_id);
    CREATE INDEX idx_scores_judge ON scores(judge_id);
    CREATE INDEX idx_scores_participant ON scores(participant_id);
    CREATE INDEX idx_scores_criterion ON scores(criterion_id);
  `;
  
  return schema;
};
