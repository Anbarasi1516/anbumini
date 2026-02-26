/*
  # Intelligent Learning Time Optimization Schema

  ## Overview
  This migration creates the complete database schema for an AI-based timetable generator
  that tracks user progress and provides adaptive study plan adjustments.

  ## New Tables
  
  ### 1. `subjects`
  Stores user's study subjects/courses
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text) - subject name
  - `color` (text) - color code for UI
  - `difficulty_level` (integer) - 1-5 scale
  - `target_hours_per_week` (numeric) - desired study hours
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `tasks`
  Stores study tasks and assignments
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `subject_id` (uuid, references subjects)
  - `title` (text) - task title
  - `description` (text) - task details
  - `priority` (text) - 'high', 'medium', 'low'
  - `difficulty` (integer) - 1-5 scale
  - `estimated_hours` (numeric) - estimated time needed
  - `actual_hours` (numeric) - actual time spent
  - `due_date` (timestamptz) - deadline
  - `status` (text) - 'pending', 'in_progress', 'completed'
  - `completion_percentage` (integer) - 0-100
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `timetable_slots`
  Stores scheduled study sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `task_id` (uuid, references tasks, nullable)
  - `subject_id` (uuid, references subjects)
  - `title` (text) - session title
  - `start_time` (timestamptz) - session start
  - `end_time` (timestamptz) - session end
  - `duration_minutes` (integer) - session length
  - `is_completed` (boolean) - completion status
  - `focus_score` (integer) - user-rated focus (1-5)
  - `notes` (text) - session notes
  - `created_at` (timestamptz)

  ### 4. `progress_tracking`
  Tracks learning progress and performance metrics
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `subject_id` (uuid, references subjects)
  - `date` (date) - tracking date
  - `hours_studied` (numeric) - total hours
  - `tasks_completed` (integer) - completed tasks count
  - `average_focus_score` (numeric) - average focus rating
  - `productivity_score` (numeric) - calculated productivity
  - `created_at` (timestamptz)

  ### 5. `user_preferences`
  Stores user study preferences and settings
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, unique)
  - `preferred_study_start_time` (time) - daily start time
  - `preferred_study_end_time` (time) - daily end time
  - `max_daily_hours` (numeric) - max hours per day
  - `break_duration_minutes` (integer) - break length
  - `study_session_duration_minutes` (integer) - session length
  - `preferred_study_days` (jsonb) - array of preferred days
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies ensure users can only access their own data
  - Separate policies for SELECT, INSERT, UPDATE, DELETE operations
*/

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  difficulty_level integer DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  target_hours_per_week numeric DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  difficulty integer DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  estimated_hours numeric DEFAULT 1,
  actual_hours numeric DEFAULT 0,
  due_date timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create timetable_slots table
CREATE TABLE IF NOT EXISTS timetable_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  is_completed boolean DEFAULT false,
  focus_score integer CHECK (focus_score >= 1 AND focus_score <= 5),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create progress_tracking table
CREATE TABLE IF NOT EXISTS progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  hours_studied numeric DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  average_focus_score numeric DEFAULT 0,
  productivity_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subject_id, date)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_study_start_time time DEFAULT '09:00:00',
  preferred_study_end_time time DEFAULT '18:00:00',
  max_daily_hours numeric DEFAULT 8,
  break_duration_minutes integer DEFAULT 15,
  study_session_duration_minutes integer DEFAULT 50,
  preferred_study_days jsonb DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_subject_id ON tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_user_id ON timetable_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_start_time ON timetable_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_id ON progress_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_date ON progress_tracking(date);

-- Enable Row Level Security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects table
CREATE POLICY "Users can view own subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for tasks table
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for timetable_slots table
CREATE POLICY "Users can view own timetable slots"
  ON timetable_slots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own timetable slots"
  ON timetable_slots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timetable slots"
  ON timetable_slots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own timetable slots"
  ON timetable_slots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for progress_tracking table
CREATE POLICY "Users can view own progress"
  ON progress_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
  ON progress_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON progress_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON progress_tracking FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_preferences table
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);