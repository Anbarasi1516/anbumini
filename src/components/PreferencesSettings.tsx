import { useState, useEffect } from 'react';
import { Settings, Save, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Preferences {
  preferred_study_start_time: string;
  preferred_study_end_time: string;
  max_daily_hours: number;
  break_duration_minutes: number;
  study_session_duration_minutes: number;
  preferred_study_days: string[];
}

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function PreferencesSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [preferences, setPreferences] = useState<Preferences>({
    preferred_study_start_time: '09:00',
    preferred_study_end_time: '18:00',
    max_daily_hours: 8,
    break_duration_minutes: 15,
    study_session_duration_minutes: 50,
    preferred_study_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  });

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPreferences({
        preferred_study_start_time: data.preferred_study_start_time.slice(0, 5),
        preferred_study_end_time: data.preferred_study_end_time.slice(0, 5),
        max_daily_hours: data.max_daily_hours,
        break_duration_minutes: data.break_duration_minutes,
        study_session_duration_minutes: data.study_session_duration_minutes,
        preferred_study_days: data.preferred_study_days || [],
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    const dataToSave = {
      user_id: user.id,
      preferred_study_start_time: `${preferences.preferred_study_start_time}:00`,
      preferred_study_end_time: `${preferences.preferred_study_end_time}:00`,
      max_daily_hours: preferences.max_daily_hours,
      break_duration_minutes: preferences.break_duration_minutes,
      study_session_duration_minutes: preferences.study_session_duration_minutes,
      preferred_study_days: preferences.preferred_study_days,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('user_preferences')
        .update(dataToSave)
        .eq('user_id', user.id));
    } else {
      ({ error } = await supabase.from('user_preferences').insert([dataToSave]));
    }

    if (error) {
      setMessage('Error saving preferences');
    } else {
      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    }

    setSaving(false);
  };

  const toggleDay = (day: string) => {
    if (preferences.preferred_study_days.includes(day)) {
      setPreferences({
        ...preferences,
        preferred_study_days: preferences.preferred_study_days.filter((d) => d !== day),
      });
    } else {
      setPreferences({
        ...preferences,
        preferred_study_days: [...preferences.preferred_study_days, day],
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-8 h-8 text-gray-600" />
          Study Preferences
        </h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          How These Settings Work
        </h3>
        <p className="text-sm text-gray-700">
          These preferences are used by the AI scheduler to generate your personalized timetable.
          The algorithm considers your preferred study times, session lengths, and break durations
          to create an optimized schedule that matches your learning style and availability.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Daily Study Window</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={preferences.preferred_study_start_time}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    preferred_study_start_time: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={preferences.preferred_study_end_time}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    preferred_study_end_time: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Session Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Daily Hours
              </label>
              <input
                type="number"
                min="1"
                max="16"
                step="0.5"
                value={preferences.max_daily_hours}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    max_daily_hours: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum study hours per day</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Length (min)
              </label>
              <input
                type="number"
                min="15"
                max="120"
                step="5"
                value={preferences.study_session_duration_minutes}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    study_session_duration_minutes: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Duration of each study session</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Break Length (min)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                step="5"
                value={preferences.break_duration_minutes}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    break_duration_minutes: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Break between sessions</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Preferred Study Days</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {daysOfWeek.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  preferences.preferred_study_days.includes(day.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Select the days when you want to study. The AI will only schedule sessions on these
            days.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
          {message && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                message.includes('Error')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              {message}
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Quick Tips</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Shorter sessions (25-50 min) with regular breaks improve focus and retention</li>
            <li>• Schedule complex subjects during your peak energy hours</li>
            <li>• Include rest days to prevent burnout and consolidate learning</li>
            <li>• The AI adapts your schedule based on task priorities and deadlines</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
