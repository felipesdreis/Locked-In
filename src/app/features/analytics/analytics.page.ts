import { Component, OnInit, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel,
  IonGrid, IonRow, IonCol,
} from '@ionic/angular/standalone';
import { HabitService } from '../../core/services/habit.service';
import {
  toDateString, subtractDays, parseDateString,
  currentIsoWeekDates, getLast,
} from '../../core/utils/date.util';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    NgClass,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel,
    IonGrid, IonRow, IonCol,
  ],
  templateUrl: './analytics.page.html',
  styleUrl: './analytics.page.scss',
})
export class AnalyticsPage implements OnInit {
  readonly habits = this.habitService.habitsWithStreak;
  private readonly completions = this.habitService.allCompletions;

  readonly completedTodayCount = computed(() =>
    this.habits().filter(h => h.completedToday).length,
  );

  readonly todayRate = computed(() => {
    const all = this.habits();
    if (!all.length) return 0;
    return Math.round((this.completedTodayCount() / all.length) * 100);
  });

  readonly topStreaks = computed(() =>
    [...this.habits()].sort((a, b) => b.currentStreak - a.currentStreak).slice(0, 5),
  );

  readonly totalHabits = computed(() => this.habits().length);
  readonly totalCompletions = computed(() => this.completions().length);

  // ISSUE 001 — ISO weekly completion rate: completions this week / (elapsed days × active habits)
  readonly weeklyRateDetails = computed(() => {
    const today = new Date();
    const todayStr = toDateString(today);
    const weekDates = currentIsoWeekDates(today);
    // Days from Monday up to and including today (min 1 so we never divide by zero)
    const elapsedDays = Math.max(weekDates.indexOf(todayStr) + 1, 1);
    const habitsCount = this.habits().length;
    const expected = elapsedDays * habitsCount;

    const thisWeekDates = new Set(weekDates.slice(0, elapsedDays));
    const done = this.completions().filter(c => thisWeekDates.has(c.completedAt)).length;
    const rate = expected === 0 ? 0 : Math.round((done / expected) * 100);

    return { rate, done, expected };
  });

  readonly weeklyRate = computed(() => this.weeklyRateDetails().rate);

  // ISSUE 010 — Habits at risk: streak < 3, sorted ascending so lowest streak comes first
  readonly habitsAtRisk = computed(() =>
    [...this.habits()]
      .filter(h => h.currentStreak < 3)
      .sort((a, b) => a.currentStreak - b.currentStreak),
  );

  // Completions per day of week (Mon–Sun), normalized to bar heights
  readonly weekdayBars = computed(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // index 0=Sun..6=Sat
    for (const c of this.completions()) {
      counts[parseDateString(c.completedAt).getDay()]++;
    }
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const monToSun = [1, 2, 3, 4, 5, 6, 0].map(i => counts[i]);
    const max = Math.max(...monToSun, 1);
    return monToSun.map((count, i) => ({
      label: labels[i],
      count,
      heightPx: Math.round((count / max) * 80),
    }));
  });

  // Last 30 days heatmap: total completions per day across all habits
  // Intensity uses absolute thresholds: 0=none, 1-2=low, 3-4=mid, 5+=high
  readonly heatmapDays = computed(() => {
    const map = new Map<string, number>();
    for (const c of this.completions()) {
      map.set(c.completedAt, (map.get(c.completedAt) ?? 0) + 1);
    }
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = subtractDays(today, 29 - i);
      const ds = toDateString(d);
      const count = map.get(ds) ?? 0;
      const intensity = count === 0 ? '' : count <= 2 ? 'low' : count <= 4 ? 'mid' : 'high';
      return { date: ds, count, day: d.getDate(), intensity };
    });
  });

  // ISSUE 005 — Per-habit table with frequency-aware weekly rate + overall completion rate
  readonly habitsTable = computed(() => {
    const completions = this.completions();
    const today = new Date();
    const last7Dates = Array.from({ length: 7 }, (_, i) => toDateString(subtractDays(today, i)));
    const last7Set = new Set(last7Dates);
    const isoWeekDates = currentIsoWeekDates(today);
    const todayStr = toDateString(today);
    const elapsedIsoWeekDates = isoWeekDates.slice(0, isoWeekDates.indexOf(todayStr) + 1);
    const isoWeekSet = new Set(elapsedIsoWeekDates);

    return [...this.habits()]
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .map(h => {
        const habitCompletions = completions.filter(c => c.habitId === h.id);
        const actualWeeklyRate = this.computeWeeklyRate(
          h, habitCompletions, last7Dates, last7Set, isoWeekSet,
        );
        const overallRate = this.computeOverallRate(h, habitCompletions, today);
        return { ...h, actualWeeklyRate, overallRate };
      });
  });

  // Overall completion rate: total completions / total scheduled days since creation
  private computeOverallRate(
    habit: { createdAt: string; frequencyType: string; frequencyDays: number[] },
    habitCompletions: { completedAt: string }[],
    today: Date,
  ): number {
    const createdDate = parseDateString(habit.createdAt.substring(0, 10));
    const msPerDay = 86_400_000;
    const daysSinceCreation = Math.max(Math.floor((today.getTime() - createdDate.getTime()) / msPerDay) + 1, 1);

    let scheduledDays: number;
    switch (habit.frequencyType) {
      case 'daily':
        scheduledDays = daysSinceCreation;
        break;
      case 'weekdays':
        scheduledDays = getLast(daysSinceCreation, 'days')
          .filter(d => { const dow = d.getDay(); return dow >= 1 && dow <= 5; }).length;
        break;
      case 'weekends':
        scheduledDays = getLast(daysSinceCreation, 'days')
          .filter(d => { const dow = d.getDay(); return dow === 0 || dow === 6; }).length;
        break;
      case 'custom': {
        const scheduled = new Set(habit.frequencyDays);
        scheduledDays = getLast(daysSinceCreation, 'days')
          .filter(d => scheduled.has(d.getDay())).length;
        break;
      }
      case 'x_per_week': {
        const weeksElapsed = Math.ceil(daysSinceCreation / 7);
        scheduledDays = weeksElapsed * (habit.frequencyDays[0] ?? 1);
        break;
      }
      default:
        scheduledDays = daysSinceCreation;
    }

    if (scheduledDays === 0) return 0;
    return Math.min(Math.round((habitCompletions.length / scheduledDays) * 100), 100);
  }

  // Computes done/denominator fraction and percent for a single habit based on its frequency type
  private computeWeeklyRate(
    habit: { frequencyType: string; frequencyDays: number[] },
    habitCompletions: { completedAt: string }[],
    last7Dates: string[],
    last7Set: Set<string>,
    isoWeekSet: Set<string>,
  ): { done: number; denominator: number; percent: number } {
    const completedInLast7 = habitCompletions.filter(c => last7Set.has(c.completedAt)).length;
    const completedThisIsoWeek = habitCompletions.filter(c => isoWeekSet.has(c.completedAt)).length;

    let done: number;
    let denominator: number;

    switch (habit.frequencyType) {
      case 'daily':
        done = completedThisIsoWeek;
        denominator = isoWeekSet.size;
        break;

      case 'weekdays':
        // Count how many of the last 7 days were Mon–Fri (getDay 1–5)
        done = habitCompletions.filter(c => {
          const day = parseDateString(c.completedAt).getDay();
          return last7Set.has(c.completedAt) && day >= 1 && day <= 5;
        }).length;
        denominator = 5;
        break;

      case 'weekends':
        // Count how many of the last 7 days were Sat–Sun (getDay 0 or 6)
        done = habitCompletions.filter(c => {
          const day = parseDateString(c.completedAt).getDay();
          return last7Set.has(c.completedAt) && (day === 0 || day === 6);
        }).length;
        denominator = 2;
        break;

      case 'custom': {
        // frequencyDays uses 0=Sun..6=Sat; count scheduled days in last 7
        const scheduledDays = new Set(habit.frequencyDays);
        const scheduledInLast7 = last7Dates.filter(
          ds => scheduledDays.has(parseDateString(ds).getDay()),
        ).length;
        done = habitCompletions.filter(c => {
          const day = parseDateString(c.completedAt).getDay();
          return last7Set.has(c.completedAt) && scheduledDays.has(day);
        }).length;
        denominator = Math.max(scheduledInLast7, 1);
        break;
      }

      case 'x_per_week':
        // Target is frequencyDays[0]; measure against current ISO week
        done = completedThisIsoWeek;
        denominator = habit.frequencyDays[0] ?? 1;
        break;

      default:
        done = completedInLast7;
        denominator = 7;
    }

    const percent = Math.min(Math.round((done / denominator) * 100), 100);
    return { done, denominator, percent };
  }

  constructor(private habitService: HabitService) {}

  async ngOnInit(): Promise<void> {
    await this.habitService.load();
  }
}
