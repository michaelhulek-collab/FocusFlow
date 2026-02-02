import { GoogleGenAI } from "@google/genai";
import { AppData, Habit, Task } from "../types";

const getAIClient = () => {
    if (!process.env.API_KEY) return null;
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateWeeklyInsight = async (habits: Habit[], tasks: Task[], weekStart: string): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "Please configure your API Key to use AI insights.";

    const completedHabitsCount = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;

    const prompt = `
    You are a productivity coach. 
    Here is my data for the current week starting ${weekStart}:
    
    Habits:
    ${habits.map(h => `- ${h.title} (Completed ${h.completedDates.length} times all-time)`).join('\n')}
    
    Tasks:
    Total Tasks: ${totalTasks}
    Completed Tasks: ${completedTasks}
    
    Please provide a concise, motivating paragraph (approx 50-80 words) analyzing my progress and suggesting one specific way to improve next week. Keep the tone professional but encouraging.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "Could not generate insight.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Unable to connect to AI coach at the moment.";
    }
};
