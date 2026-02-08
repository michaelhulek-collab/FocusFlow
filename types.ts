export interface Habit {
  id: string;
  title: string;
  // Array of ISO date strings (YYYY-MM-DD) for completion
  completedDates: string[]; 
  color: string;
  createdAt: string; // ISO Date string of creation
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high' | 'google';
  isCalendarEvent?: boolean;
  time?: string; // Optional time string (e.g., "10:00 AM")
  order: number; // For drag and drop sorting
}

export interface WeeklyArchive {
  id: string; // Usually the startDate string
  startDate: string;
  endDate: string;
  habits: Habit[]; // Snapshot of habits state at archive time
  tasks: Task[];
  summary?: string; // AI Summary if generated
}

export interface AppData {
  currentWeekStartDate: string; // ISO Date of the Monday
  habits: Habit[];
  tasks: Task[];
  archives: WeeklyArchive[];
}

export type ViewMode = 'dashboard' | 'archive';