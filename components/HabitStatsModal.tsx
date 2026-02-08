import React, { useMemo } from 'react';
import { Habit } from '../types';
import { X, Calendar, Trophy, Flame } from 'lucide-react';
import { parseLocalDate, getMonday, addDays, formatDate } from '../services/dateUtils';

interface HabitStatsModalProps {
  habit: Habit;
  onClose: () => void;
}

export const HabitStatsModal: React.FC<HabitStatsModalProps> = ({ habit, onClose }) => {
  
  // Calculate Stats
  const stats = useMemo(() => {
    const dates = habit.completedDates.map(d => parseLocalDate(d).getTime()).sort((a, b) => a - b);
    const total = dates.length;
    
    // Streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    if (dates.length > 0) {
      // Basic daily streak calc
      const today = new Date();
      today.setHours(0,0,0,0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check current streak validity
      const lastDate = new Date(dates[dates.length - 1]);
      if (lastDate.getTime() === today.getTime() || lastDate.getTime() === yesterday.getTime()) {
         // Count backwards
         let checkDate = new Date(lastDate);
         for (let i = dates.length - 1; i >= 0; i--) {
            if (dates[i] === checkDate.getTime()) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
         }
      }

      // Best streak
      tempStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i-1]);
        const curr = new Date(dates[i]);
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
            tempStreak++;
        } else {
            bestStreak = Math.max(bestStreak, tempStreak);
            tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    // Weekly Data for Graph
    const created = habit.createdAt ? new Date(habit.createdAt) : new Date();
    // Start from the Monday of the creation week
    let startWeek = getMonday(created);
    const endWeek = getMonday(new Date()); // This week's monday
    
    // Ensure we show at least 4 weeks
    const minWeeks = 4;
    const diffTime = Math.abs(endWeek.getTime() - startWeek.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)); 
    
    if (diffWeeks < minWeeks) {
        startWeek = addDays(endWeek, -(minWeeks * 7));
    }

    const weeklyData = [];
    let iter = new Date(startWeek);
    
    while (iter <= endWeek) {
        const weekStartStr = formatDate(iter);
        const weekEnd = addDays(iter, 6);
        
        // Count completions in this week range
        let count = 0;
        habit.completedDates.forEach(dStr => {
            const d = parseLocalDate(dStr);
            if (d >= iter && d <= weekEnd) {
                count++;
            }
        });
        
        weeklyData.push({
            weekStart: weekStartStr,
            label: iter.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count
        });
        
        iter = addDays(iter, 7);
    }

    return { total, currentStreak, bestStreak, weeklyData };
  }, [habit]);

  const maxCount = 7; // Max days in a week
  const barHeight = 150;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
       <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/30">
             <div>
                <div className="flex items-center gap-3 mb-1">
                   <div className={`w-3 h-3 rounded-full ${habit.color}`}></div>
                   <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{habit.title}</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                   <Calendar size={14} /> 
                   Started {new Date(habit.createdAt || Date.now()).toLocaleDateString()}
                </p>
             </div>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X size={24} />
             </button>
          </div>

          <div className="p-6 overflow-y-auto">
             {/* Key Stats Grid */}
             <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/50 flex flex-col items-center justify-center text-center">
                   <div className="bg-white dark:bg-slate-800 p-2 rounded-full mb-2 shadow-sm text-indigo-600 dark:text-indigo-400">
                      <Trophy size={20} />
                   </div>
                   <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{stats.total}</span>
                   <span className="text-xs text-indigo-600 dark:text-indigo-300 font-medium uppercase tracking-wide">Total Completions</span>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800/50 flex flex-col items-center justify-center text-center">
                   <div className="bg-white dark:bg-slate-800 p-2 rounded-full mb-2 shadow-sm text-orange-600 dark:text-orange-400">
                      <Flame size={20} />
                   </div>
                   <span className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.currentStreak}</span>
                   <span className="text-xs text-orange-600 dark:text-orange-300 font-medium uppercase tracking-wide">Current Streak</span>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/50 flex flex-col items-center justify-center text-center">
                   <div className="bg-white dark:bg-slate-800 p-2 rounded-full mb-2 shadow-sm text-emerald-600 dark:text-emerald-400">
                      <Trophy size={20} />
                   </div>
                   <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.bestStreak}</span>
                   <span className="text-xs text-emerald-600 dark:text-emerald-300 font-medium uppercase tracking-wide">Best Streak</span>
                </div>
             </div>

             {/* Graph Section */}
             <div className="mb-2">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-6">Weekly Performance History</h3>
                
                <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                    <div className="min-w-[500px] h-[220px] flex items-end justify-between gap-2 px-2">
                        {stats.weeklyData.map((week, i) => {
                            const heightPercentage = (week.count / maxCount) * 100;
                            // Dynamic color logic: faded if 0, solid if high
                            const opacity = week.count === 0 ? 0.2 : 0.5 + (week.count / 14); 
                            
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group relative">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-700 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                        {week.count} / 7 days
                                    </div>
                                    
                                    {/* Bar */}
                                    <div 
                                        className={`w-full min-w-[12px] rounded-t-sm transition-all duration-500 ease-out hover:brightness-110 ${habit.color}`}
                                        style={{ 
                                            height: `${Math.max(heightPercentage, 2)}%`, // Minimum height for 0
                                            opacity: week.count === 0 ? 0.1 : 1
                                        }}
                                    ></div>
                                    
                                    {/* X-Axis Label */}
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 rotate-0 truncate w-full text-center">
                                        {week.label.split(',')[0]}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    {/* Baseline */}
                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700 min-w-[500px]"></div>
                </div>
             </div>
          </div>

       </div>
    </div>
  );
};