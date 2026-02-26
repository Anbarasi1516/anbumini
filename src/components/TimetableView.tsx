import { useState, useEffect } from 'react';
import { Calendar, Sparkles, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateSmartTimetable } from '../utils/scheduleGenerator';

interface TimetableSlot {
  id?: string;
  subject_id: string;
  task_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_completed?: boolean;
  focus_score?: number | null;
}

interface Subject {
  id: string;
  name: string;
  color: string;
  difficulty_level: number;
  target_hours_per_week: number;
}

interface Task {
  id: string;
  subject_id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  difficulty: number;
  estimated_hours: number;
  actual_hours: number;
  due_date: string | null;
  status: string;
  completion_percentage: number;
}

export default function TimetableView() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [user, selectedDate]);

  const loadData = async () => {
    if (!user) return;

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [slotsResult, subjectsResult, tasksResult] = await Promise.all([
      supabase
        .from('timetable_slots')
        .select('*')
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time'),
      supabase.from('subjects').select('*'),
      supabase.from('tasks').select('*').neq('status', 'completed'),
    ]);

    if (slotsResult.data) setTimetable(slotsResult.data);
    if (subjectsResult.data) setSubjects(subjectsResult.data);
    if (tasksResult.data) setTasks(tasksResult.data);
    setLoading(false);
  };

  const generateTimetable = async () => {
    if (!user || subjects.length === 0 || tasks.length === 0) {
      alert('Please add subjects and tasks first!');
      return;
    }

    setGenerating(true);

    const { data: prefsData } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const preferences = prefsData || {
      preferred_study_start_time: '09:00:00',
      preferred_study_end_time: '18:00:00',
      max_daily_hours: 8,
      break_duration_minutes: 15,
      study_session_duration_minutes: 50,
      preferred_study_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    };

    await supabase
      .from('timetable_slots')
      .delete()
      .gte('start_time', new Date().toISOString());

    const slots = generateSmartTimetable(
      tasks,
      subjects,
      preferences,
      new Date(),
      7
    );

    const slotsToInsert = slots.map((slot) => ({
      user_id: user.id,
      subject_id: slot.subject_id,
      task_id: slot.task_id,
      title: slot.title,
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration_minutes: slot.duration_minutes,
      is_completed: false,
    }));

    if (slotsToInsert.length > 0) {
      await supabase.from('timetable_slots').insert(slotsToInsert);
    }

    await loadData();
    setGenerating(false);
  };

  const markComplete = async (slotId: string, focusScore: number) => {
    await supabase
      .from('timetable_slots')
      .update({ is_completed: true, focus_score: focusScore })
      .eq('id', slotId);

    loadData();
  };

  const getSubjectColor = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.color || '#3B82F6';
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || 'Unknown';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const changeDate = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  if (loading) {
    return <div className="text-center py-8">Loading timetable...</div>;
  }

  const todaySlots = timetable.filter((slot) => {
    const slotDate = new Date(slot.start_time);
    return slotDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Study Schedule</h2>
        <button
          onClick={generateTimetable}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate
            </>
          )}
        </button>
      </div>

      {subjects.length === 0 || tasks.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Schedule Yet</h3>
          <p className="text-sm text-gray-600">
            Add subjects and tasks to generate your AI schedule
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => changeDate(-1)}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Previous
              </button>
              <h3 className="text-xl font-semibold">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <button
                onClick={() => changeDate(1)}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Next →
              </button>
            </div>

            {todaySlots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No sessions scheduled for this day. Generate a new schedule to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {todaySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`border-l-4 rounded-lg p-4 ${
                      slot.is_completed ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300'
                    } shadow-sm hover:shadow-md transition-shadow`}
                    style={{
                      borderLeftColor: slot.is_completed
                        ? undefined
                        : getSubjectColor(slot.subject_id),
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getSubjectColor(slot.subject_id) }}
                          />
                          <span className="text-sm font-medium text-gray-600">
                            {getSubjectName(slot.subject_id)}
                          </span>
                          {slot.is_completed && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{slot.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          </div>
                          <span>{slot.duration_minutes} minutes</span>
                          {slot.focus_score && (
                            <span className="text-blue-600 font-medium">
                              Focus: {slot.focus_score}/5
                            </span>
                          )}
                        </div>
                      </div>
                      {!slot.is_completed && slot.id && (
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              onClick={() => markComplete(slot.id!, score)}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              title={`Mark complete with focus score ${score}`}
                            >
                              {score}★
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
