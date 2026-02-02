import React, { useState } from 'react';
import { WeeklyArchive } from '../types';
import { Calendar, ChevronRight, ChevronDown } from 'lucide-react';

interface ArchiveViewerProps {
  archives: WeeklyArchive[];
  onBack: () => void;
}

export const ArchiveViewer: React.FC<ArchiveViewerProps> = ({ archives, onBack }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline underline-offset-4"
        >
          &larr; Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Weekly Archives</h2>
      </div>

      {archives.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
          <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium">No archives yet</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Past weeks will automatically appear here when a new week starts (Monday 12:00 AM).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {archives.map((archive) => {
            const isExpanded = expandedId === archive.id;
            const completedTasks = archive.tasks.filter(t => t.completed).length;
            const completionRate = archive.tasks.length > 0 
                ? Math.round((completedTasks / archive.tasks.length) * 100) 
                : 0;

            return (
              <div key={archive.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : archive.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Calendar size={20} />
                     </div>
                     <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">Week of {new Date(archive.startDate).toLocaleDateString()}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                           {archive.tasks.length} tasks • {completionRate}% complete
                        </p>
                     </div>
                  </div>
                  {isExpanded ? <ChevronDown size={20} className="text-slate-400 dark:text-slate-500" /> : <ChevronRight size={20} className="text-slate-400 dark:text-slate-500" />}
                </div>

                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                          <h5 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-3 tracking-wider">Habit Performance</h5>
                          <ul className="space-y-2">
                             {archive.habits.map(h => (
                               <li key={h.id} className="flex justify-between text-sm">
                                  <span className="text-slate-700 dark:text-slate-300">{h.title}</span>
                                  <span className="font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    {h.completedDates.length} days
                                  </span>
                               </li>
                             ))}
                          </ul>
                       </div>
                       <div>
                          <h5 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-3 tracking-wider">Task Summary</h5>
                          <ul className="space-y-2">
                             {archive.tasks.map(t => (
                               <li key={t.id} className="flex items-start gap-2 text-sm">
                                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${t.completed ? 'bg-green-500' : 'bg-red-300 dark:bg-red-800/50'}`}></span>
                                  <span className={t.completed ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500 line-through'}>
                                     {t.title}
                                  </span>
                               </li>
                             ))}
                          </ul>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};