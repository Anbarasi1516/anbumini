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

interface Subject {
  id: string;
  name: string;
  color: string;
  difficulty_level: number;
  target_hours_per_week: number;
}

interface UserPreferences {
  preferred_study_start_time: string;
  preferred_study_end_time: string;
  max_daily_hours: number;
  break_duration_minutes: number;
  study_session_duration_minutes: number;
  preferred_study_days: string[];
}

interface TimetableSlot {
  subject_id: string;
  task_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

const priorityWeights = {
  high: 3,
  medium: 2,
  low: 1,
};

export function generateSmartTimetable(
  tasks: Task[],
  subjects: Subject[],
  preferences: UserPreferences,
  startDate: Date,
  daysToGenerate: number = 7
): TimetableSlot[] {
  const schedule: TimetableSlot[] = [];

  const pendingTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.completion_percentage < 100
  );

  const scoredTasks = pendingTasks
    .map((task) => {
      let score = 0;

      score += priorityWeights[task.priority] * 10;

      if (task.due_date) {
        const daysUntilDue = Math.ceil(
          (new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue <= 3) score += 30;
        else if (daysUntilDue <= 7) score += 20;
        else if (daysUntilDue <= 14) score += 10;
      }

      score += task.difficulty * 3;

      const remainingHours = task.estimated_hours - task.actual_hours;
      score += remainingHours * 2;

      score -= task.completion_percentage * 0.2;

      return { task, score, remainingHours };
    })
    .sort((a, b) => b.score - a.score);

  const subjectHoursPerWeek = new Map<string, number>();
  subjects.forEach((s) => {
    subjectHoursPerWeek.set(s.id, s.target_hours_per_week);
  });

  const subjectAllocatedHours = new Map<string, number>();
  subjects.forEach((s) => subjectAllocatedHours.set(s.id, 0));

  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
    const dayDate = new Date(currentDate);
    dayDate.setDate(dayDate.getDate() + dayOffset);

    const dayName = dayDate
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    if (!preferences.preferred_study_days.includes(dayName)) {
      continue;
    }

    const [startHour, startMinute] = preferences.preferred_study_start_time
      .split(':')
      .map(Number);
    const [endHour, endMinute] = preferences.preferred_study_end_time.split(':').map(Number);

    let currentTime = new Date(dayDate);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(dayDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    let dailyHours = 0;
    const maxDailyMinutes = preferences.max_daily_hours * 60;

    for (const { task, remainingHours } of scoredTasks) {
      if (dailyHours >= preferences.max_daily_hours) break;
      if (currentTime >= endTime) break;

      const subject = subjects.find((s) => s.id === task.subject_id);
      if (!subject) continue;

      const allocatedForSubject = subjectAllocatedHours.get(task.subject_id) || 0;
      const targetForSubject = subjectHoursPerWeek.get(task.subject_id) || 0;

      if (allocatedForSubject >= targetForSubject && targetForSubject > 0) {
        continue;
      }

      const sessionMinutes = preferences.study_session_duration_minutes;
      const hoursToSchedule = Math.min(
        remainingHours,
        sessionMinutes / 60,
        preferences.max_daily_hours - dailyHours,
        (endTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60)
      );

      if (hoursToSchedule < 0.25) continue;

      const actualMinutes = Math.floor(hoursToSchedule * 60);

      const slotStartTime = new Date(currentTime);
      const slotEndTime = new Date(currentTime.getTime() + actualMinutes * 60 * 1000);

      schedule.push({
        subject_id: task.subject_id,
        task_id: task.id,
        title: task.title,
        start_time: slotStartTime.toISOString(),
        end_time: slotEndTime.toISOString(),
        duration_minutes: actualMinutes,
      });

      currentTime = new Date(slotEndTime.getTime() + preferences.break_duration_minutes * 60 * 1000);
      dailyHours += hoursToSchedule;
      subjectAllocatedHours.set(
        task.subject_id,
        (subjectAllocatedHours.get(task.subject_id) || 0) + hoursToSchedule
      );

      task.actual_hours += hoursToSchedule;
    }
  }

  return schedule;
}

export function calculateProductivityScore(
  focusScores: number[],
  completionRate: number,
  adherenceRate: number
): number {
  const avgFocus = focusScores.length > 0
    ? focusScores.reduce((a, b) => a + b, 0) / focusScores.length
    : 0;

  const focusWeight = 0.4;
  const completionWeight = 0.35;
  const adherenceWeight = 0.25;

  const score =
    (avgFocus / 5) * focusWeight * 100 +
    completionRate * completionWeight +
    adherenceRate * adherenceWeight;

  return Math.min(100, Math.max(0, score));
}
