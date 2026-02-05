import React, { useState, useEffect } from 'react';
import { AppData, Habit, Task, ViewMode } from './types';
import { loadAppData, saveAppData, fetchFromCloud, saveToCloud } from './services/storageService';
import { initializeFirebase, getFirebaseAuth } from './services/firebase';
import { onAuthStateChanged, User } from "firebase/auth";
import { HabitTracker } from './components/HabitTracker';
import { TaskPlanner } from './components/TaskPlanner';
import { ArchiveViewer } from './components/ArchiveViewer';
import { AICoach } from './components/AICoach';
import { AuthScreen } from './components/AuthScreen';
import { LayoutDashboard, History, CheckCircle2, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react';

// Simple ID Generator Helper
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        // Check local storage or system preference
        return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply Theme Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Auth Initialization
  useEffect(() => {
    const firebaseReady = initializeFirebase();
    if (firebaseReady) {
        const auth = getFirebaseAuth();
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                setUser(currentUser);
                if (currentUser) {
                    setIsGuest(false);
                    // Fetch cloud data
                    const cloudData = await fetchFromCloud(currentUser.uid);
                    if (cloudData) {
                        setData(cloudData);
                    } else {
                        // If new user, stick with local/initial but sync it up
                        const localData = loadAppData();
                        setData(localData);
                        saveToCloud(currentUser.uid, localData);
                    }
                }
                setAuthInitialized(true);
            });
            return () => unsubscribe();
        }
    } else {
        setAuthInitialized(true); // No firebase config, ready to show auth/guest screen
    }
  }, []);

  // Data Loading for Guest
  useEffect(() => {
      if (isGuest && !data) {
          setData(loadAppData());
      }
  }, [isGuest, data]);

  // Data Saving (Local + Cloud)
  useEffect(() => {
    if (data) {
      // Always save local cache
      saveAppData(data);

      // If user is logged in, sync to cloud
      if (user) {
          saveToCloud(user.uid, data);
      }
    }
  }, [data, user]);

  const toggleTheme = () => setDarkMode(!darkMode);
  
  const handleLogout = () => {
      const auth = getFirebaseAuth();
      if (auth) auth.signOut();
      setUser(null);
      setIsGuest(false);
      setData(null);
  };

  const addHabit = (title: string, color: string) => {
    if (!data) return;
    const newHabit: Habit = {
      id: generateId(),
      title,
      completedDates: [],
      color,
      createdAt: new Date().toISOString()
    };
    setData({ ...data, habits: [...data.habits, newHabit] });
  };

  const toggleHabit = (habitId: string, date: string) => {
    if (!data) return;
    const updatedHabits = data.habits.map(h => {
      if (h.id === habitId) {
        const isCompleted = h.completedDates.includes(date);
        const newDates = isCompleted 
          ? h.completedDates.filter(d => d !== date)
          : [...h.completedDates, date];
        return { ...h, completedDates: newDates };
      }
      return h;
    });
    setData({ ...data, habits: updatedHabits });
  };

  const deleteHabit = (habitId: string) => {
    if (!data) return;
    setData({ ...data, habits: data.habits.filter(h => h.id !== habitId) });
  };

  const addTask = (title: string, date: string, priority: Task['priority']) => {
    if (!data) return;
    
    // Calculate new order: find max order for this date + 1
    const dayTasks = data.tasks.filter(t => t.date === date);
    const maxOrder = dayTasks.reduce((max, t) => Math.max(max, t.order || 0), -1);

    const newTask: Task = {
      id: generateId(),
      title,
      date,
      completed: false,
      priority,
      order: maxOrder + 1
    };
    setData({ ...data, tasks: [...data.tasks, newTask] });
  };

  const importTasks = (newTasks: { title: string; date: string; priority: Task['priority'] }[]) => {
    setData((prev) => {
      if (!prev) return null;
      
      const finalNewTasks: Task[] = [];
      const existingTasks = prev.tasks;
      
      // Group new tasks by date to calculate distinct orders
      const byDate: Record<string, typeof newTasks> = {};
      newTasks.forEach(t => {
          if(!byDate[t.date]) byDate[t.date] = [];
          byDate[t.date].push(t);
      });

      Object.entries(byDate).forEach(([date, tasks]) => {
          const currentDayTasks = existingTasks.filter(t => t.date === date);
          let maxOrder = currentDayTasks.reduce((max, t) => Math.max(max, t.order || 0), -1);
          
          tasks.forEach(t => {
              maxOrder++;
              finalNewTasks.push({
                  id: generateId(),
                  title: t.title,
                  date: t.date,
                  completed: false,
                  priority: t.priority,
                  isCalendarEvent: true,
                  order: maxOrder
              });
          });
      });

      return { ...prev, tasks: [...prev.tasks, ...finalNewTasks] };
    });
  };

  const toggleTask = (taskId: string) => {
    if (!data) return;
    const updatedTasks = data.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setData({ ...data, tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    if (!data) return;
    setData({ ...data, tasks: data.tasks.filter(t => t.id !== taskId) });
  };

  const changeTaskPriority = (taskId: string, priority: Task['priority']) => {
    if (!data) return;
    const updatedTasks = data.tasks.map(t => 
      t.id === taskId ? { ...t, priority } : t
    );
    setData({ ...data, tasks: updatedTasks });
  };

  const updateTasks = (updatedTasks: Task[]) => {
      if (!data) return;
      setData({ ...data, tasks: updatedTasks });
  };

  if (!authInitialized) return <div className="h-screen flex items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950">Loading...</div>;

  // Show Auth Screen if not logged in and not guest
  if (!user && !isGuest) {
      return <AuthScreen onLoginSuccess={() => {}} onGuestAccess={() => setIsGuest(true)} />;
  }

  if (!data) return <div className="h-screen flex items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950">Loading data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="bg-indigo-600 p-1.5 rounded-lg">
                <CheckCircle2 className="text-white" size={20} />
             </div>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500 dark:from-indigo-400 dark:to-indigo-200">
               FocusFlow
             </h1>
           </div>

           <div className="flex items-center gap-3">
             <nav className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
               <button 
                 onClick={() => setView('dashboard')}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all 
                   ${view === 'dashboard' 
                     ? 'bg-white dark:bg-slate-950 shadow-sm text-indigo-700 dark:text-indigo-400' 
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
               >
                 <LayoutDashboard size={16} />
                 <span className="hidden sm:inline">Dashboard</span>
               </button>
               <button 
                 onClick={() => setView('archive')}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all 
                   ${view === 'archive' 
                     ? 'bg-white dark:bg-slate-950 shadow-sm text-indigo-700 dark:text-indigo-400' 
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
               >
                 <History size={16} />
                 <span className="hidden sm:inline">History</span>
               </button>
             </nav>
             
             <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             {user && (
                 <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Log Out"
                 >
                     <LogOut size={20} />
                 </button>
             )}
             {isGuest && (
                 <div className="px-3 py-1 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                     Guest
                 </div>
             )}
           </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <AICoach 
                habits={data.habits}
                tasks={data.tasks}
                weekStart={data.currentWeekStartDate}
            />

            <HabitTracker 
              habits={data.habits} 
              currentWeekStart={data.currentWeekStartDate}
              onAddHabit={addHabit}
              onToggleHabit={toggleHabit}
              onDeleteHabit={deleteHabit}
            />
            
            <TaskPlanner 
              tasks={data.tasks}
              currentWeekStart={data.currentWeekStartDate}
              onAddTask={addTask}
              onImportTasks={importTasks}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onChangeTaskPriority={changeTaskPriority}
              onUpdateTasks={updateTasks}
            />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <ArchiveViewer 
               archives={data.archives} 
               onBack={() => setView('dashboard')}
             />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
