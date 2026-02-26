import { useState } from 'react';
import { Calendar, BookOpen, CheckSquare, BarChart3, Settings, LogOut, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TimetableView from './TimetableView';
import SubjectManager from './SubjectManager';
import TaskManager from './TaskManager';
import ProgressTracker from './ProgressTracker';
import PreferencesSettings from './PreferencesSettings';

type View = 'timetable' | 'subjects' | 'tasks' | 'progress' | 'settings';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('timetable');
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { id: 'timetable' as View, icon: Calendar, label: 'Schedule', color: 'from-blue-500 to-blue-600' },
    { id: 'subjects' as View, icon: BookOpen, label: 'Subjects', color: 'from-green-500 to-green-600' },
    { id: 'tasks' as View, icon: CheckSquare, label: 'Tasks', color: 'from-orange-500 to-orange-600' },
    { id: 'progress' as View, icon: BarChart3, label: 'Progress', color: 'from-purple-500 to-purple-600' },
    { id: 'settings' as View, icon: Settings, label: 'Settings', color: 'from-gray-500 to-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-2 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">INTELLIGENT LEARNING</h1>
                <p className="text-xs text-gray-500">AI Study Optimization</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          <aside className="lg:col-span-1">
            <nav className="bg-white rounded-xl shadow-sm p-3 sticky top-20 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                      isActive
                        ? `text-white bg-gradient-to-r ${item.color}`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="lg:col-span-5">
            {currentView === 'timetable' && <TimetableView />}
            {currentView === 'subjects' && <SubjectManager />}
            {currentView === 'tasks' && <TaskManager />}
            {currentView === 'progress' && <ProgressTracker />}
            {currentView === 'settings' && <PreferencesSettings />}
          </main>
        </div>
      </div>
    </div>
  );
}
