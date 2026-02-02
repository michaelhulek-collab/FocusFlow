import { AppData, WeeklyArchive } from '../types';
import { getMonday, formatDate, addDays, parseLocalDate } from './dateUtils';

const STORAGE_KEY = 'focusflow_data_v1';

const INITIAL_DATA: AppData = {
  currentWeekStartDate: formatDate(getMonday()),
  habits: [],
  tasks: [],
  archives: [],
};

export const loadAppData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  let data: AppData = stored ? JSON.parse(stored) : INITIAL_DATA;

  // Backfill createdAt for legacy data
  data.habits = data.habits.map(h => {
    if (!h.createdAt) {
       // Estimate creation from first completion or default to now if brand new/empty
       const sortedDates = [...h.completedDates].sort();
       const earliest = sortedDates.length > 0 ? sortedDates[0] : new Date().toISOString();
       return { ...h, createdAt: earliest };
    }
    return h;
  });

  // Check for new week logic
  const currentRealMonday = getMonday();
  // Use parseLocalDate to ensure we compare local midnight to local midnight
  const storedMonday = parseLocalDate(data.currentWeekStartDate);
  
  // Normalize time for comparison (just in case)
  currentRealMonday.setHours(0,0,0,0);
  storedMonday.setHours(0,0,0,0);

  // If the stored monday is older than the current real monday, we need to archive and reset
  if (currentRealMonday.getTime() > storedMonday.getTime()) {
    console.log("New week detected. Archiving previous week...");
    
    // Create archive of the PREVIOUS active week
    const archiveEndDate = formatDate(addDays(storedMonday, 6));
    const newArchive: WeeklyArchive = {
      id: data.currentWeekStartDate,
      startDate: data.currentWeekStartDate,
      endDate: archiveEndDate,
      habits: JSON.parse(JSON.stringify(data.habits)), // Deep copy
      tasks: JSON.parse(JSON.stringify(data.tasks)),     // Deep copy
    };

    // Reset logic
    // 1. Keep habits, but they are fresh for the new week
    // 2. Clear tasks as they are weekly planner tasks.
    
    data = {
      ...data,
      currentWeekStartDate: formatDate(currentRealMonday),
      tasks: [], 
      archives: [newArchive, ...data.archives],
    };
    
    saveAppData(data);
  }

  return data;
};

export const saveAppData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};