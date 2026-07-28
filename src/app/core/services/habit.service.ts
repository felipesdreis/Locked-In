import { Injectable, signal, computed } from '@angular/core';
import { DbService } from './db.service';
import { Habit, Completion, HabitWithStreak } from '../models/habit.model';
import { StreakService } from './streak.service';
import { NotificationService } from './notification.service';
import { toDateString, currentIsoWeekDates } from '../utils/date.util';
import { WidgetService } from './widget.service';

export type BadgeMilestone = 7 | 30 | 100;

@Injectable({ providedIn: 'root' })
export class HabitService {
  private _habits = signal<Habit[]>([]);
  private _completions = signal<Completion[]>([]);

  readonly allCompletions = this._completions.asReadonly();

  readonly habits = this._habits.asReadonly();

  readonly habitsWithStreak = computed<HabitWithStreak[]>(() => {
    const today = new Date();
    const todayStr = toDateString(today);
    const weekDates = currentIsoWeekDates(today);
    const completions = this._completions();
    return this._habits().map(habit => {
      const weeklyProgress = habit.frequencyType === 'x_per_week'
        ? this.calcWeeklyProgress(habit.id, habit.frequencyDays[0], completions, weekDates)
        : undefined;
      return {
        ...habit,
        ...this.streak.calculate(habit, completions),
        completedToday: completions.some(c => c.habitId === habit.id && c.completedAt === todayStr),
        weeklyProgress,
      };
    });
  });

  private calcWeeklyProgress(
    habitId: string,
    target: number | undefined,
    completions: import('../models/habit.model').Completion[],
    weekDates: string[],
  ): import('../models/habit.model').WeeklyProgress {
    if (!target || target < 1) {
      console.error(`[HabitService] x_per_week habit ${habitId} has invalid target: ${target}`);
      return { done: 0, target: 0 };
    }
    const done = completions.filter(c => c.habitId === habitId && weekDates.includes(c.completedAt)).length;
    return { done, target };
  }

  constructor(
    private db: DbService,
    private streak: StreakService,
    private notifications: NotificationService,
    private widget: WidgetService,
  ) {}

  async load(): Promise<void> {
    const rows = await this.db.query<Record<string, string>>(`SELECT * FROM habits WHERE archived_at IS NULL ORDER BY created_at ASC`);
    this._habits.set(rows.map(this.mapHabit));

    const completions = await this.db.query<Record<string, string>>(`SELECT * FROM completions`);
    this._completions.set(completions.map(this.mapCompletion));
  }

  async create(habit: Omit<Habit, 'id' | 'createdAt' | 'archivedAt' | 'badge7Days' | 'badge30Days' | 'badge100Days'>): Promise<void> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await this.db.run(
      `INSERT INTO habits (id, name, icon, color, frequency_type, frequency_days, reminder_time, created_at, archived_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [id, habit.name, habit.icon, habit.color, habit.frequencyType, JSON.stringify(habit.frequencyDays), habit.reminderTime, createdAt],
    );
    if (habit.reminderTime) {
      await this.notifications.schedule({ id, name: habit.name, reminderTime: habit.reminderTime, frequencyType: habit.frequencyType, frequencyDays: habit.frequencyDays });
    }
    await this.load();
  }

  async update(id: string, changes: Partial<Omit<Habit, 'id' | 'createdAt'>>): Promise<void> {
    const habit = this._habits().find(h => h.id === id);
    if (!habit) return;
    const updated = { ...habit, ...changes };
    await this.db.run(
      `UPDATE habits SET name=?, icon=?, color=?, frequency_type=?, frequency_days=?, reminder_time=? WHERE id=?`,
      [updated.name, updated.icon, updated.color, updated.frequencyType, JSON.stringify(updated.frequencyDays), updated.reminderTime, id],
    );
    await this.notifications.cancel(id);
    if (updated.reminderTime) {
      await this.notifications.schedule({ id, name: updated.name, reminderTime: updated.reminderTime, frequencyType: updated.frequencyType, frequencyDays: updated.frequencyDays });
    }
    await this.load();
  }

  async archive(id: string): Promise<void> {
    await this.db.run(`UPDATE habits SET archived_at=? WHERE id=?`, [new Date().toISOString(), id]);
    await this.notifications.cancel(id);
    await this.load();
  }

  async loadArchived(): Promise<Habit[]> {
    const rows = await this.db.query<Record<string, string>>(
      `SELECT * FROM habits WHERE archived_at IS NOT NULL ORDER BY archived_at DESC`,
    );
    return rows.map(this.mapHabit);
  }

  async restore(id: string): Promise<void> {
    await this.db.run(`UPDATE habits SET archived_at=NULL WHERE id=?`, [id]);
    await this.load();
  }

  async delete(id: string): Promise<void> {
    await this.db.run(`DELETE FROM habits WHERE id=?`, [id]); // ON DELETE CASCADE removes completions
    await this.notifications.cancel(id);
    await this.load();
  }

  // Toggles a completion for any given date (e.g. yesterday). No badge awarded for past dates.
  async toggleDay(habitId: string, date: Date): Promise<void> {
    const dateStr = toDateString(date);
    const existing = this._completions().find(c => c.habitId === habitId && c.completedAt === dateStr);
    if (existing) {
      await this.db.run(`DELETE FROM completions WHERE id=?`, [existing.id]);
    } else {
      await this.db.run(`INSERT INTO completions (id, habit_id, completed_at) VALUES (?, ?, ?)`, [crypto.randomUUID(), habitId, dateStr]);
    }
    this.widget.requestUpdate();
    await this.load();
  }

  // Returns a milestone (7, 30, 100) if a new badge was earned, or null.
  async toggleToday(habitId: string): Promise<BadgeMilestone | null> {
    const today = toDateString(new Date());
    const existing = this._completions().find(c => c.habitId === habitId && c.completedAt === today);
    const habit = this._habits().find(h => h.id === habitId);
    if (existing) {
      await this.db.run(`DELETE FROM completions WHERE id=?`, [existing.id]);
      this.widget.requestUpdate();
      await this.load();
      if (habit?.reminderTime) {
        await this.notifications.schedule({ id: habitId, name: habit.name, reminderTime: habit.reminderTime, frequencyType: habit.frequencyType, frequencyDays: habit.frequencyDays });
      }
      return null;
    }

    await this.db.run(`INSERT INTO completions (id, habit_id, completed_at) VALUES (?, ?, ?)`, [crypto.randomUUID(), habitId, today]);
    this.widget.requestUpdate();
    await this.load();
    if (habit?.reminderTime) {
      await this.notifications.cancel(habitId);
    }

    // Check for milestone badges after loading updated data
    return this.checkAndAwardBadge(habitId);
  }

  // Re-arms per-habit reminders on a new day: toggleToday() cancels a habit's
  // notification when completed, which removes the whole recurring alarm —
  // this restores it once the habit is no longer completed today.
  async syncNotifications(): Promise<void> {
    const today = toDateString(new Date());
    for (const habit of this._habits()) {
      if (!habit.reminderTime) continue;
      const completedToday = this._completions().some(c => c.habitId === habit.id && c.completedAt === today);
      if (completedToday) {
        await this.notifications.cancel(habit.id);
      } else {
        await this.notifications.schedule({ id: habit.id, name: habit.name, reminderTime: habit.reminderTime, frequencyType: habit.frequencyType, frequencyDays: habit.frequencyDays });
      }
    }
  }

  private async checkAndAwardBadge(habitId: string): Promise<BadgeMilestone | null> {
    const habit = this._habits().find(h => h.id === habitId);
    if (!habit) return null;

    const completions = this._completions();
    const { currentStreak } = this.streak.calculate(habit, completions);

    const milestones: BadgeMilestone[] = [7, 30, 100];
    for (const milestone of milestones) {
      if (currentStreak >= milestone && !this.hasBadge(habit, milestone)) {
        await this.awardBadge(habitId, milestone);
        return milestone;
      }
    }
    return null;
  }

  private hasBadge(habit: Habit, milestone: BadgeMilestone): boolean {
    if (milestone === 7) return habit.badge7Days;
    if (milestone === 30) return habit.badge30Days;
    return habit.badge100Days;
  }

  private async awardBadge(habitId: string, milestone: BadgeMilestone): Promise<void> {
    const col = milestone === 7 ? 'badge_7_days' : milestone === 30 ? 'badge_30_days' : 'badge_100_days';
    await this.db.run(`UPDATE habits SET ${col}=1 WHERE id=?`, [habitId]);
    await this.load();
  }

  isScheduledForDay(habit: Habit, date: Date): boolean {
    return this.streak.isScheduledDay(habit, date);
  }

  getCompletionsFor(habitId: string): Completion[] {
    return this._completions().filter(c => c.habitId === habitId);
  }

  private mapHabit(row: Record<string, string>): Habit {
    return {
      id: row['id'],
      name: row['name'],
      icon: row['icon'],
      color: row['color'],
      frequencyType: row['frequency_type'] as Habit['frequencyType'],
      frequencyDays: JSON.parse(row['frequency_days'] ?? '[]'),
      reminderTime: row['reminder_time'] ?? null,
      createdAt: row['created_at'],
      archivedAt: row['archived_at'] ?? null,
      badge7Days: row['badge_7_days'] === '1',
      badge30Days: row['badge_30_days'] === '1',
      badge100Days: row['badge_100_days'] === '1',
    };
  }

  private mapCompletion(row: Record<string, string>): Completion {
    return {
      id: row['id'],
      habitId: row['habit_id'],
      completedAt: row['completed_at'],
    };
  }
}
