import { Injectable } from '@angular/core';
import { Habit, Completion } from '../models/habit.model';
import { toDateString, subtractDays, parseDateString } from '../utils/date.util';

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

// ISO week starts on Monday (day 1). Returns YYYY-Www key.
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayOfWeek = d.getUTCDay() === 0 ? 7 : d.getUTCDay(); // Mon=1, Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

function currentIsoWeekKey(): string {
  return isoWeekKey(new Date());
}

@Injectable({ providedIn: 'root' })
export class StreakService {
  calculate(habit: Habit, allCompletions: Completion[]): StreakStats {
    const habitCompletions = allCompletions.filter(c => c.habitId === habit.id);
    const totalCompletions = habitCompletions.length;

    if (habit.frequencyType === 'x_per_week') {
      return this.calculateWeeklyStreak(habit, habitCompletions, totalCompletions);
    }

    return this.calculateDailyStreak(habit, habitCompletions, totalCompletions);
  }

  // Walks backwards day-by-day; a missed scheduled day breaks the streak.
  // Today is skipped in the break-check so users who haven't completed yet keep their streak.
  private calculateDailyStreak(
    habit: Habit,
    completions: Completion[],
    totalCompletions: number,
  ): StreakStats {
    const completedDates = new Set(completions.map(c => c.completedAt));
    const today = new Date();
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    let currentStreakCaptured = false;
    let cursor = new Date(today);

    for (let i = 0; i < 730; i++) {
      const dateStr = toDateString(cursor);
      if (this.isScheduledDay(habit, cursor)) {
        if (completedDates.has(dateStr)) {
          streak++;
        } else if (i > 0) {
          // Past scheduled day not completed — streak breaks.
          // Capture currentStreak on the first break we encounter (walking backwards).
          if (!currentStreakCaptured) {
            currentStreak = streak;
            currentStreakCaptured = true;
          }
          if (streak > longestStreak) longestStreak = streak;
          streak = 0;
        }
        // i === 0 (today, not yet completed) — skip break so streak stays alive
      }
      cursor = subtractDays(cursor, 1);
    }

    if (streak > longestStreak) longestStreak = streak;
    // If we never hit a break, the running streak is the current streak
    if (!currentStreakCaptured) currentStreak = streak;

    return { currentStreak, longestStreak, totalCompletions };
  }

  // Groups completions by ISO week and counts weeks where completions >= target.
  // The current (ongoing) week does not break the streak if it hasn't ended.
  private calculateWeeklyStreak(
    habit: Habit,
    completions: Completion[],
    totalCompletions: number,
  ): StreakStats {
    const targetPerWeek = habit.frequencyDays[0] ?? 1;
    const completionsByWeek = this.groupCompletionsByWeek(completions);
    const thisWeek = currentIsoWeekKey();

    // Collect all week keys that meet the target, sorted descending
    const successWeeks = new Set(
      Array.from(completionsByWeek.entries())
        .filter(([, count]) => count >= targetPerWeek)
        .map(([week]) => week),
    );

    // Walk backwards week-by-week up to ~104 weeks (2 years)
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    let currentStreakCaptured = false;
    let cursor = new Date();

    for (let i = 0; i < 104; i++) {
      const weekKey = isoWeekKey(cursor);
      const isCurrentWeek = weekKey === thisWeek;

      if (successWeeks.has(weekKey)) {
        streak++;
      } else if (!isCurrentWeek) {
        // Past week that didn't meet target — streak breaks.
        // Capture currentStreak on the first break encountered (walking backwards).
        if (!currentStreakCaptured) {
          currentStreak = streak;
          currentStreakCaptured = true;
        }
        if (streak > longestStreak) longestStreak = streak;
        streak = 0;
      }
      // Current week still in progress — skip break check

      cursor = subtractDays(cursor, 7);
    }

    if (streak > longestStreak) longestStreak = streak;
    if (!currentStreakCaptured) currentStreak = streak;

    return { currentStreak, longestStreak, totalCompletions };
  }

  private groupCompletionsByWeek(completions: Completion[]): Map<string, number> {
    const byWeek = new Map<string, number>();
    for (const completion of completions) {
      // parseDateString avoids UTC offset shifting the day when parsing YYYY-MM-DD
      const week = isoWeekKey(parseDateString(completion.completedAt));
      byWeek.set(week, (byWeek.get(week) ?? 0) + 1);
    }
    return byWeek;
  }

  isScheduledDay(habit: Habit, date: Date): boolean {
    const dow = date.getDay(); // 0=Sun
    switch (habit.frequencyType) {
      case 'daily': return true;
      case 'weekdays': return dow >= 1 && dow <= 5;
      case 'weekends': return dow === 0 || dow === 6;
      case 'custom':     return habit.frequencyDays.includes(dow);
      case 'x_per_week': return true;
      default:           return false;
    }
  }
}
