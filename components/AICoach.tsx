import React, { useState } from 'react';
import { generateWeeklyInsight } from '../services/geminiService';
import { Habit, Task } from '../types';
import { Sparkles, Loader2 } from 'lucide-react';

interface AICoachProps {
    habits: Habit[];
    tasks: Task[];
    weekStart: string;
}

export const AICoach: React.FC<AICoachProps> = ({ habits, tasks, weekStart }) => {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const result = await generateWeeklyInsight(habits, tasks, weekStart);
        setInsight(result);
        setLoading(false);
    };

    if (!process.env.API_KEY) return null; // Don't show if no API key

    return (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-yellow-300" size={20} />
                    <h3 className="font-semibold text-lg">Smart Insight Coach</h3>
                </div>
                
                {!insight ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="text-indigo-100 text-sm max-w-xl">
                            Get personalized advice based on your current week's habits and tasks. 
                            Our AI analyzes your progress to help you stay on track.
                        </p>
                        <button 
                            onClick={handleGenerate}
                            disabled={loading}
                            className="whitespace-nowrap px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-70 flex items-center gap-2"
                        >
                            {loading && <Loader2 size={14} className="animate-spin" />}
                            {loading ? 'Analyzing...' : 'Analyze My Week'}
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-white/90 text-sm leading-relaxed bg-white/10 p-4 rounded-lg border border-white/10">
                            "{insight}"
                        </p>
                        <button 
                            onClick={() => setInsight(null)}
                            className="mt-3 text-xs text-indigo-200 hover:text-white underline underline-offset-2"
                        >
                            Close Insight
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
