import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      subjects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          difficulty_level: number;
          target_hours_per_week: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          title: string;
          description: string;
          priority: 'high' | 'medium' | 'low';
          difficulty: number;
          estimated_hours: number;
          actual_hours: number;
          due_date: string | null;
          status: 'pending' | 'in_progress' | 'completed';
          completion_percentage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      timetable_slots: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          subject_id: string;
          title: string;
          start_time: string;
          end_time: string;
          duration_minutes: number;
          is_completed: boolean;
          focus_score: number | null;
          notes: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['timetable_slots']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['timetable_slots']['Insert']>;
      };
      progress_tracking: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          date: string;
          hours_studied: number;
          tasks_completed: number;
          average_focus_score: number;
          productivity_score: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['progress_tracking']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['progress_tracking']['Insert']>;
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          preferred_study_start_time: string;
          preferred_study_end_time: string;
          max_daily_hours: number;
          break_duration_minutes: number;
          study_session_duration_minutes: number;
          preferred_study_days: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_preferences']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>;
      };
    };
  };
};
