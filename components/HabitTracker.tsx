import React, { useState } from 'react';
import { Habit } from '../types';
import { getWeekDays, formatDate, getDayName, isSameDay, parseLocalDate } from '../services/dateUtils';
import { Plus, Check, Trash2, Trophy, BarChart2 } from 'lucide-react';
import { HabitStatsModal } from './HabitStatsModal';

interface HabitTrackerProps {
  habits: Habit[];
  currentWeekStart: string;
  onAddHabit: (title: string, color: string) => void;
  onToggleHabit: (habitId: string, date: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 
  'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 
  'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

export const HabitTracker: React.FC<HabitTrackerProps> = ({ 
  habits, 
  currentWeekStart, 
  onAddHabit, 
  onToggleHabit,
  onDeleteHabit 
}) => {
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  
  const monday = parseLocalDate(currentWeekStart);
  const weekDays = getWeekDays(monday);
  const todayStr = formatDate(new Date());

  // Calculate Progress
  const habitsToday = habits.length;
  const completedToday = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const progressPercentage = habitsToday > 0 ? (completedToday / habitsToday) * 100 : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    onAddHabit(newHabitTitle, randomColor);
    setNewHabitTitle('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      {/* Modal */}
      {selectedHabit && (
        <HabitStatsModal 
          habit={selectedHabit} 
          onClose={() => setSelectedHabit(null)} 
        />
      )}

      {/* Header & Progress */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Habit Tracker
              {progressPercentage === 100 && habits.length > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                   <Trophy size={12} /> All Done!
                </span>
              )}
            </h2>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              <Plus size={16} /> New Habit
            </button>
         </div>
         
         {/* Progress Bar */}
         <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-1 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-700 ease-out ${progressPercentage === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
         </div>
         <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Daily Progress</span>
            <span>{completedToday} / {habitsToday} completed today</span>
         </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 flex gap-2">
          <input
            type="text"
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            placeholder="e.g., Read 30 mins, Gym, Meditate..."
            className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white dark:bg-slate-800 dark:text-slate-200"
            autoFocus
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-500"
          >
            Add
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
          <thead>
            <tr>
              <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm w-[30%]">Habit</th>
              {weekDays.map((date) => (
                <th key={date.toISOString()} className="p-4 text-center w-[10%]">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">{getDayName(formatDate(date))}</span>
                    <span className={`text-sm font-semibold mt-1 w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(date, new Date()) ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                </th>
              ))}
              <th className="p-4 w-[10%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {habits.length === 0 ? (
               <tr>
                 <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                   No habits tracked yet. Start small!
                 </td>
               </tr>
            ) : (
              habits.map((habit) => (
                <tr key={habit.id} className="border-t border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${habit.color}`}></div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium truncate">{habit.title}</span>
                    </div>
                  </td>
                  {weekDays.map((date) => {
                    const dateStr = formatDate(date);
                    const isCompleted = habit.completedDates.includes(dateStr);
                    const isFuture = date.getTime() > new Date().setHours(23, 59, 59, 999);
                    
                    return (
                      <td key={dateStr} className="p-2">
                         <div className="flex justify-center">
                           <button
                             onClick={() => !isFuture && onToggleHabit(habit.id, dateStr)}
                             disabled={isFuture}
                             className={`
                               w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 relative
                               ${isCompleted 
                                 ? `${habit.color} text-white shadow-md scale-100 ring-2 ring-offset-1 ring-offset-white ring-${habit.color.replace('bg-', '')}` 
                                 : `bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 scale-90`}
                               ${isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                             `}
                           >
                             <Check size={16} className={`transition-transform duration-300 ${isCompleted ? 'scale-100' : 'scale-0'}`} />
                           </button>
                         </div>
                      </td>
                    );
                  })}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                       <button 
                        onClick={() => setSelectedHabit(habit)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                        title="View Analytics"
                       >
                         <BarChart2 size={16} />
                       </button>
                       <button 
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        title="Delete Habit"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};