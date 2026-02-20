-- =========================================
-- CCS Event Tabulation System - FINAL VERSION
-- =========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================
-- TABLES
-- ===============================

CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  color TEXT DEFAULT '#1e3a8a',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Archived')),
  base_bearing NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Individual' CHECK (type IN ('Individual', 'Group')),
  judge_count INTEGER DEFAULT 3,
  status TEXT DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed')),
  scheduled_at TIMESTAMP,
  venue TEXT,
  bearing NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, judge_id)
);

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL DEFAULT 0,
  encoded_by UUID REFERENCES auth.users(id),
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, judge_id, participant_id, criterion_id)
);

-- Final computed rankings per event
CREATE TABLE IF NOT EXISTS final_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  total_score NUMERIC,
  rank INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, participant_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  role TEXT DEFAULT 'Representative' CHECK (role IN ('Admin', 'Representative')),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- INDEXES
-- ===============================

CREATE INDEX IF NOT EXISTS idx_departments_college ON departments(college_id);
CREATE INDEX IF NOT EXISTS idx_events_committee ON events(committee_id);
CREATE INDEX IF NOT EXISTS idx_criteria_event ON criteria(event_id);
CREATE INDEX IF NOT EXISTS idx_event_judges_event ON event_judges(event_id);
CREATE INDEX IF NOT EXISTS idx_event_judges_judge ON event_judges(judge_id);
CREATE INDEX IF NOT EXISTS idx_participants_department ON participants(department_id);
CREATE INDEX IF NOT EXISTS idx_participants_event ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_event ON scores(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge ON scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_participant ON scores(participant_id);
CREATE INDEX IF NOT EXISTS idx_scores_criterion ON scores(criterion_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- ===============================
-- ROW LEVEL SECURITY
-- ===============================

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ===============================
-- DROP OLD POLICIES SAFELY
-- ===============================

DROP POLICY IF EXISTS "Public read colleges" ON colleges;
DROP POLICY IF EXISTS "Public read departments" ON departments;
DROP POLICY IF EXISTS "Public read committees" ON committees;
DROP POLICY IF EXISTS "Public read events" ON events;
DROP POLICY IF EXISTS "Public read criteria" ON criteria;
DROP POLICY IF EXISTS "Public read judges" ON judges;
DROP POLICY IF EXISTS "Public read participants" ON participants;
DROP POLICY IF EXISTS "Public read scores" ON scores;
DROP POLICY IF EXISTS "Public read final_results" ON final_results;
DROP POLICY IF EXISTS "Public read chat" ON chat_messages;

-- ===============================
-- PUBLIC READ (Scoreboard Viewing)
-- ===============================

CREATE POLICY "Public read colleges" ON colleges FOR SELECT USING (true);
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Public read committees" ON committees FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read criteria" ON criteria FOR SELECT USING (true);
CREATE POLICY "Public read judges" ON judges FOR SELECT USING (true);
CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Public read scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Public read final_results" ON final_results FOR SELECT USING (true);
CREATE POLICY "Public read chat" ON chat_messages FOR SELECT USING (true);