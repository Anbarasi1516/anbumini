import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Target, Clock, Brain } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateProductivityScore } from '../utils/scheduleGenerator';

interface Subject {
  id: string;
  name: string;
  color: string;
  target_hours_per_week: number;
}

interface ProgressData {
  subject_id: string;
  total_hours: number;
  tasks_completed: number;
  avg_focus: number;
}

interface CompletedSlot {
  subject_id: string;
  duration_minutes: number;
  focus_score: number | null;
  start_time: string;
}

export default function ProgressTracker() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [completedSlots, setCompletedSlots] = useState<CompletedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadData();
  }, [user, timeRange]);

  const loadData = async () => {
    if (!user) return;

    const daysBack = timeRange === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const [subjectsResult, slotsResult, tasksResult] = await Promise.all([
      supabase.from('subjects').select('*'),
      supabase
        .from('timetable_slots')
        .select('subject_id, duration_minutes, focus_score, start_time, is_completed')
        .eq('is_completed', true)
        .gte('start_time', startDate.toISOString()),
      supabase
        .from('tasks')
        .select('subject_id, status, updated_at')
        .eq('status', 'completed')
        .gte('updated_at', startDate.toISOString()),
    ]);

    if (subjectsResult.data) setSubjects(subjectsResult.data);
    if (slotsResult.data) setCompletedSlots(slotsResult.data as CompletedSlot[]);

    if (subjectsResult.data && slotsResult.data) {
      const progressBySubject = new Map<string, ProgressData>();

      subjectsResult.data.forEach((subject) => {
        progressBySubject.set(subject.id, {
          subject_id: subject.id,
          total_hours: 0,
          tasks_completed: 0,
          avg_focus: 0,
        });
      });

      slotsResult.data.forEach((slot: CompletedSlot) => {
        const data = progressBySubject.get(slot.subject_id);
        if (data) {
          data.total_hours += slot.duration_minutes / 60;
          if (slot.focus_score) {
            data.avg_focus =
              (data.avg_focus * (data.total_hours - slot.duration_minutes / 60) +
                slot.focus_score * (slot.duration_minutes / 60)) /
              data.total_hours;
          }
        }
      });

      if (tasksResult.data) {
        tasksResult.data.forEach((task: { subject_id: string }) => {
          const data = progressBySubject.get(task.subject_id);
          if (data) {
            data.tasks_completed += 1;
          }
        });
      }

      setProgressData(Array.from(progressBySubject.values()));
    }

    setLoading(false);
  };

  const getTotalHours = () => {
    return progressData.reduce((sum, data) => sum + data.total_hours, 0);
  };

  const getTotalTasks = () => {
    return progressData.reduce((sum, data) => sum + data.tasks_completed, 0);
  };

  const getAverageFocus = () => {
    const validScores = completedSlots
      .map((s) => s.focus_score)
      .filter((s) => s !== null) as number[];
    if (validScores.length === 0) return 0;
    return validScores.reduce((a, b) => a + b, 0) / validScores.length;
  };

  const getProductivityScore = () => {
    const focusScores = completedSlots
      .map((s) => s.focus_score)
      .filter((s) => s !== null) as number[];
    return calculateProductivityScore(focusScores, 75, 80);
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || 'Unknown';
  };

  const getSubjectColor = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.color || '#3B82F6';
  };

  const getTargetProgress = (subjectId: string, hours: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return 0;
    const targetHours = timeRange === 'week' ? subject.target_hours_per_week : subject.target_hours_per_week * 4;
    return Math.min(100, (hours / targetHours) * 100);
  };

  if (loading) {
    return <div className="text-center py-8">Loading progress data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          Progress & Analytics
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{getTotalHours().toFixed(1)}h</span>
          </div>
          <p className="text-blue-100">Total Study Time</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{getTotalTasks()}</span>
          </div>
          <p className="text-green-100">Tasks Completed</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Brain className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{getAverageFocus().toFixed(1)}/5</span>
          </div>
          <p className="text-orange-100">Average Focus</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{getProductivityScore().toFixed(0)}%</span>
          </div>
          <p className="text-purple-100">Productivity Score</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Subject Progress
        </h3>

        {progressData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No progress data yet. Complete some study sessions to see your analytics!
          </div>
        ) : (
          <div className="space-y-6">
            {progressData.map((data) => {
              const targetProgress = getTargetProgress(data.subject_id, data.total_hours);
              return (
                <div key={data.subject_id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getSubjectColor(data.subject_id) }}
                      />
                      <span className="font-medium">{getSubjectName(data.subject_id)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        {data.total_hours.toFixed(1)}h studied
                      </span>
                      <span className="text-gray-600">
                        {data.tasks_completed} tasks
                      </span>
                      {data.avg_focus > 0 && (
                        <span className="text-gray-600">
                          Focus: {data.avg_focus.toFixed(1)}/5
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${targetProgress}%`,
                        backgroundColor: getSubjectColor(data.subject_id),
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {targetProgress.toFixed(0)}% of target
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Insights & Recommendations
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          {getAverageFocus() < 3 && (
            <p>⚠️ Your focus scores are below average. Consider shorter study sessions with more breaks.</p>
          )}
          {getAverageFocus() >= 4 && (
            <p>✓ Excellent focus levels! Your current study routine is working well.</p>
          )}
          {getTotalHours() < 10 && timeRange === 'week' && (
            <p>📊 Study time is below recommended levels. Try scheduling more sessions.</p>
          )}
          {getTotalHours() >= 20 && timeRange === 'week' && (
            <p>✓ Great dedication! You're on track to meet your learning goals.</p>
          )}
          {progressData.some((d) => getTargetProgress(d.subject_id, d.total_hours) < 50) && (
            <p>🎯 Some subjects need more attention. The AI scheduler will prioritize these in your next timetable.</p>
          )}
          {getProductivityScore() >= 80 && (
            <p>🏆 Outstanding productivity score! Keep up the excellent work.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}
