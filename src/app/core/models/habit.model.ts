export type FrequencyType = 'daily' | 'weekdays' | 'weekends' | 'custom' | 'x_per_week';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequencyType: FrequencyType;
  frequencyDays: number[];   // 0=Sun..6=Sat for custom; count for x_per_week
  reminderTime: string | null; // HH:MM or null
  createdAt: string;         // ISO date
  archivedAt: string | null;
  badge7Days: boolean;   // milestone 7-day streak reached
  badge30Days: boolean;  // milestone 30-day streak reached
  badge100Days: boolean; // milestone 100-day streak reached
}

export interface Completion {
  id: string;
  habitId: string;
  completedAt: string; // ISO date YYYY-MM-DD
}

export interface WeeklyProgress {
  done: number;
  target: number;
}

export interface HabitWithStreak extends Habit {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  totalCompletions: number;
  weeklyProgress?: WeeklyProgress;
}
