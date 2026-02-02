import React, { useState } from 'react';
import { Task } from '../types';
import { getWeekDays, formatDate, getDayName, isSameDay, getFriendlyDate, parseLocalDate, addDays } from '../services/dateUtils';
import { Plus, X, Target, Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { initializeGoogleApi, handleAuthClick, listUpcomingEvents } from '../services/googleCalendarService';

interface TaskPlannerProps {
  tasks: Task[];
  currentWeekStart: string;
  onAddTask: (title: string, date: string, priority: Task['priority']) => void;
  onImportTasks: (tasks: { title: string; date: string; priority: Task['priority'] }[]) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onChangeTaskPriority: (taskId: string, priority: Task['priority']) => void;
}

export const TaskPlanner: React.FC<TaskPlannerProps> = ({
  tasks,
  currentWeekStart,
  onAddTask,
  onImportTasks,
  onToggleTask,
  onDeleteTask,
  onChangeTaskPriority
}) => {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  
  // Google Calendar State
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gcal_api_key') || '');
  const [clientId, setClientId] = useState(localStorage.getItem('gcal_client_id') || '');

  const monday = parseLocalDate(currentWeekStart);
  const weekDays = getWeekDays(monday);

  // Stats for Today
  const todayStr = formatDate(new Date());
  const todaysTasks = tasks.filter(t => t.date === todayStr);
  const totalToday = todaysTasks.length;
  const completedToday = todaysTasks.filter(t => t.completed).length;
  const progress = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeDate) return;
    onAddTask(newTaskTitle, activeDate, priority);
    setNewTaskTitle('');
  };

  const saveConfig = () => {
    localStorage.setItem('gcal_api_key', apiKey);
    localStorage.setItem('gcal_client_id', clientId);
    setShowConfig(false);
    handleSyncCalendar();
  };

  const handleSyncCalendar = async () => {
    if (!apiKey || !clientId) {
      setShowConfig(true);
      return;
    }

    setIsSyncing(true);
    try {
      await initializeGoogleApi(apiKey, clientId);
      await handleAuthClick();

      // Calculate time range for the current week view
      const startOfWeek = parseLocalDate(currentWeekStart);
      const endOfWeek = addDays(startOfWeek, 7);
      
      const events = await listUpcomingEvents(startOfWeek.toISOString(), endOfWeek.toISOString());
      
      // Collect all tasks to be added
      const tasksToImport: { title: string; date: string; priority: Task['priority'] }[] = [];
      let newCount = 0;

      events.forEach(event => {
        const dateStr = event.start.dateTime 
            ? event.start.dateTime.split('T')[0] 
            : event.start.date || '';
        
        // Simple duplicate check based on title and date
        const exists = tasks.some(t => t.title === event.summary && t.date === dateStr);
        
        // Check if we already staged this task in the current batch
        const staged = tasksToImport.some(t => t.title.includes(event.summary) && t.date === dateStr);

        if (!exists && !staged && dateStr) {
           // We no longer prepend the time string.
           // Priority is set to 'google' by default for imports.
           tasksToImport.push({
             title: event.summary,
             date: dateStr,
             priority: 'google'
           });
           newCount++;
        }
      });
      
      if (newCount > 0) {
        onImportTasks(tasksToImport);
        alert(`Successfully imported ${newCount} events from Google Calendar!`);
      } else {
        alert("No new events found to import for this week.");
      }

    } catch (error) {
      console.error(error);
      alert("Failed to sync Google Calendar. Please check your API Key / Client ID and try again.");
      setShowConfig(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const getPriorityColor = (p: Task['priority']) => {
    switch (p) {
      case 'high': return 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-400';
      case 'google': return 'text-sky-600 bg-sky-50 border-sky-100 dark:bg-sky-900/20 dark:border-sky-900/30 dark:text-sky-400';
    }
  };

  const getPriorityLabel = (p: Task['priority']) => {
      if (p === 'google') return 'Google Calendar';
      return p;
  };

  const cyclePriority = (e: React.MouseEvent, task: Task) => {
      e.stopPropagation();
      const priorities: Task['priority'][] = ['high', 'medium', 'low', 'google'];
      const currentIndex = priorities.indexOf(task.priority);
      const nextIndex = (currentIndex + 1) % priorities.length;
      onChangeTaskPriority(task.id, priorities[nextIndex]);
  };

  // Helper to detect calendar imports based on explicit property or priority
  const isCalendarTask = (task: Task) => task.priority === 'google' || task.isCalendarEvent;

  return (
    <div className="space-y-6">
       {/* Config Modal */}
       {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <CalendarIcon size={20} /> Configure Google Calendar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    To sync, you need a Google Cloud Project with the Calendar API enabled. 
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline ml-1">
                        Get Credentials
                    </a>
                </p>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">API Key</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Client ID</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={clientId}
                            onChange={e => setClientId(e.target.value)}
                            placeholder="12345...apps.googleusercontent.com"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button 
                        onClick={() => setShowConfig(false)} 
                        className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={saveConfig} 
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Save & Sync
                    </button>
                </div>
            </div>
        </div>
       )}

       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Weekly Planner
              {progress === 100 && totalToday > 0 && <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full text-xs border border-green-100 dark:border-green-800">Today Completed!</span>}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
               <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div>
               </div>
               <span>Today: {completedToday}/{totalToday} completed</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={handleSyncCalendar}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
             >
                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {isSyncing ? 'Syncing...' : 'Sync Calendar'}
             </button>

             <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Medium</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Low</span>
             </div>
          </div>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDays.map((date) => {
          const dateStr = formatDate(date);
          const isToday = isSameDay(date, new Date());
          const dayTasks = tasks.filter(t => t.date === dateStr);
          const isAddingToThisDay = activeDate === dateStr;
          
          return (
            <div 
              key={dateStr} 
              className={`flex flex-col min-h-[300px] rounded-xl border transition-all duration-300
                ${isToday 
                  ? 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700 shadow-md ring-1 ring-indigo-50 dark:ring-indigo-900' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'}
              `}
            >
              {/* Header */}
              <div className={`p-3 border-b flex justify-between items-center transition-colors
                ${isToday 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50' 
                  : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'}`}>
                <div>
                  <span className={`text-xs font-bold uppercase block mb-0.5 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {getDayName(dateStr)}
                  </span>
                  <span className={`text-sm font-medium ${isToday ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                    {getFriendlyDate(dateStr)}
                  </span>
                </div>
                <button 
                  onClick={() => setActiveDate(isAddingToThisDay ? null : dateStr)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors
                    ${isAddingToThisDay 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}
                  `}
                >
                  {isAddingToThisDay ? <X size={14} /> : <Plus size={14} />}
                </button>
              </div>

              {/* Task List */}
              <div className="p-2 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[400px]">
                {/* Input Form - Always visible if active for this date */}
                {isAddingToThisDay && (
                  <form onSubmit={handleAddTask} className="mb-1 p-2 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
                    <input 
                      autoFocus
                      className="w-full text-xs bg-transparent border-none focus:outline-none mb-2 placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500 font-medium"
                      placeholder="Task..."
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                    />
                    <div className="flex justify-between items-center">
                      <select 
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-300 text-slate-600 dark:text-slate-300"
                      >
                        <option value="high">High</option>
                        <option value="medium">Med</option>
                        <option value="low">Low</option>
                      </select>
                      <button type="submit" className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded hover:bg-indigo-700 dark:hover:bg-indigo-500">Add</button>
                    </div>
                  </form>
                )}

                {dayTasks.length === 0 && !isAddingToThisDay && (
                   <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-8 text-slate-400 dark:text-slate-500">
                     <Target size={24} />
                     <span className="text-[10px] mt-1">Free Day</span>
                   </div>
                )}

                {dayTasks.map(task => {
                  const isImported = isCalendarTask(task);
                  return (
                    <div 
                      key={task.id} 
                      className={`group flex items-start gap-2 p-2 rounded-lg border text-xs transition-all
                        ${task.completed 
                          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-60' 
                          : isImported 
                             ? 'bg-sky-50/30 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800'
                             : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:shadow-sm hover:border-indigo-100 dark:hover:border-indigo-900'}
                      `}
                    >
                      <button 
                        onClick={() => onToggleTask(task.id)}
                        className={`mt-0.5 min-w-[14px] h-[14px] rounded border flex items-center justify-center transition-colors
                          ${task.completed 
                            ? 'bg-indigo-500 border-indigo-500 text-white' 
                            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 bg-white dark:bg-slate-900'}
                        `}
                      >
                        {task.completed && <Plus size={8} className="rotate-45" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {isImported && <CalendarIcon size={10} className="text-sky-500 flex-shrink-0" />}
                          <p 
                            title={task.title}
                            className={`truncate leading-tight cursor-default ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}
                          >
                            {task.title}
                          </p>
                        </div>
                        <button 
                            onClick={(e) => cyclePriority(e, task)}
                            className={`text-[9px] px-1.5 py-px rounded-full inline-block mt-1 hover:brightness-95 transition-all ${getPriorityColor(task.priority)}`}
                            title="Click to change priority"
                        >
                          {getPriorityLabel(task.priority)}
                        </button>
                      </div>

                      <button 
                        onClick={() => onDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};