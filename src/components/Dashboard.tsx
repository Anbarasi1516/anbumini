import { useState, useEffect } from 'react';
import {
  Calendar,
  BookOpen,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  Brain,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TimetableView from './TimetableView';
import SubjectManager from './SubjectManager';
import TaskManager from './TaskManager';
import ProgressTracker from './ProgressTracker';
import PreferencesSettings from './PreferencesSettings';

type View = 'timetable' | 'subjects' | 'tasks' | 'progress' | 'settings';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('timetable');
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { id: 'timetable' as View, icon: Calendar, label: 'Timetable', color: 'text-blue-600' },
    { id: 'subjects' as View, icon: BookOpen, label: 'Subjects', color: 'text-green-600' },
    { id: 'tasks' as View, icon: CheckSquare, label: 'Tasks', color: 'text-orange-600' },
    { id: 'progress' as View, icon: BarChart3, label: 'Progress', color: 'text-purple-600' },
    { id: 'settings' as View, icon: Settings, label: 'Settings', color: 'text-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  INTELLIGENT LEARNING
                </h1>
                <p className="text-xs text-gray-500">AI-Powered Time Optimization</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      currentView === item.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${currentView === item.id ? item.color : ''}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
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
