-- CCS Event Tabulation System - Supabase Database Schema (CORRECTED)
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create colleges table
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create departments/teams table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  color TEXT DEFAULT '#1e3a8a',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create committees table
CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Archived')),
  base_bearing NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Individual' CHECK (type IN ('Individual', 'Group')),
  judge_count INTEGER DEFAULT 3,
  judge_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed')),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create judges table
CREATE TABLE IF NOT EXISTS judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL DEFAULT 0,
  encoded_by TEXT,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, judge_id, participant_id, criterion_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  role TEXT DEFAULT 'Representative' CHECK (role IN ('Admin', 'Representative')),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_departments_college ON departments(college_id);
CREATE INDEX IF NOT EXISTS idx_events_committee ON events(committee_id);
CREATE INDEX IF NOT EXISTS idx_criteria_event ON criteria(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_department ON participants(department_id);
CREATE INDEX IF NOT EXISTS idx_participants_event ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_event ON scores(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge ON scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_participant ON scores(participant_id);
CREATE INDEX IF NOT EXISTS idx_scores_criterion ON scores(criterion_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read colleges" ON colleges;
DROP POLICY IF EXISTS "Allow public read departments" ON departments;
DROP POLICY IF EXISTS "Allow public read committees" ON committees;
DROP POLICY IF EXISTS "Allow public read events" ON events;
DROP POLICY IF EXISTS "Allow public read criteria" ON criteria;
DROP POLICY IF EXISTS "Allow public read judges" ON judges;
DROP POLICY IF EXISTS "Allow public read participants" ON participants;
DROP POLICY IF EXISTS "Allow public read scores" ON scores;
DROP POLICY IF EXISTS "Allow public read chat" ON chat_messages;

DROP POLICY IF EXISTS "Allow public insert colleges" ON colleges;
DROP POLICY IF EXISTS "Allow public update colleges" ON colleges;
DROP POLICY IF EXISTS "Allow public delete colleges" ON colleges;

DROP POLICY IF EXISTS "Allow public insert departments" ON departments;
DROP POLICY IF EXISTS "Allow public update departments" ON departments;
DROP POLICY IF EXISTS "Allow public delete departments" ON departments;

DROP POLICY IF EXISTS "Allow public insert committees" ON committees;
DROP POLICY IF EXISTS "Allow public update committees" ON committees;
DROP POLICY IF EXISTS "Allow public delete committees" ON committees;

DROP POLICY IF EXISTS "Allow public insert events" ON events;
DROP POLICY IF EXISTS "Allow public update events" ON events;
DROP POLICY IF EXISTS "Allow public delete events" ON events;

DROP POLICY IF EXISTS "Allow public insert criteria" ON criteria;
DROP POLICY IF EXISTS "Allow public update criteria" ON criteria;
DROP POLICY IF EXISTS "Allow public delete criteria" ON criteria;

DROP POLICY IF EXISTS "Allow public insert judges" ON judges;
DROP POLICY IF EXISTS "Allow public update judges" ON judges;
DROP POLICY IF EXISTS "Allow public delete judges" ON judges;

DROP POLICY IF EXISTS "Allow public insert participants" ON participants;
DROP POLICY IF EXISTS "Allow public update participants" ON participants;
DROP POLICY IF EXISTS "Allow public delete participants" ON participants;

DROP POLICY IF EXISTS "Allow public insert scores" ON scores;
DROP POLICY IF EXISTS "Allow public update scores" ON scores;
DROP POLICY IF EXISTS "Allow public delete scores" ON scores;

DROP POLICY IF EXISTS "Allow public insert chat" ON chat_messages;

-- Create new policies for public access
CREATE POLICY "Allow public read colleges" ON colleges FOR SELECT USING (true);
CREATE POLICY "Allow public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow public read committees" ON committees FOR SELECT USING (true);
CREATE POLICY "Allow public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public read criteria" ON criteria FOR SELECT USING (true);
CREATE POLICY "Allow public read judges" ON judges FOR SELECT USING (true);
CREATE POLICY "Allow public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Allow public read scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Allow public read chat" ON chat_messages FOR SELECT USING (true);

CREATE POLICY "Allow public insert colleges" ON colleges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update colleges" ON colleges FOR UPDATE USING (true);
CREATE POLICY "Allow public delete colleges" ON colleges FOR DELETE USING (true);

CREATE POLICY "Allow public insert departments" ON departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update departments" ON departments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete departments" ON departments FOR DELETE USING (true);

CREATE POLICY "Allow public insert committees" ON committees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update committees" ON committees FOR UPDATE USING (true);
CREATE POLICY "Allow public delete committees" ON committees FOR DELETE USING (true);

CREATE POLICY "Allow public insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update events" ON events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete events" ON events FOR DELETE USING (true);

CREATE POLICY "Allow public insert criteria" ON criteria FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update criteria" ON criteria FOR UPDATE USING (true);
CREATE POLICY "Allow public delete criteria" ON criteria FOR DELETE USING (true);

CREATE POLICY "Allow public insert judges" ON judges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update judges" ON judges FOR UPDATE USING (true);
CREATE POLICY "Allow public delete judges" ON judges FOR DELETE USING (true);

CREATE POLICY "Allow public insert participants" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update participants" ON participants FOR UPDATE USING (true);
CREATE POLICY "Allow public delete participants" ON participants FOR DELETE USING (true);

CREATE POLICY "Allow public insert scores" ON scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update scores" ON scores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete scores" ON scores FOR DELETE USING (true);

CREATE POLICY "Allow public insert chat" ON chat_messages FOR INSERT WITH CHECK (true);
