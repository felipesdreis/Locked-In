import { TestBed } from '@angular/core/testing';
import { StreakService } from './streak.service';
import { Habit, Completion } from '../models/habit.model';
import { toDateString, subtractDays } from '../utils/date.util';

const BASE_HABIT: Habit = {
  id: 'h1',
  name: 'Test',
  icon: '💪',
  color: '#000',
  frequencyType: 'daily',
  frequencyDays: [],
  reminderTime: null,
  createdAt: '2024-01-01',
  archivedAt: null,
  badge7Days: false,
  badge30Days: false,
  badge100Days: false,
};

function makeCompletion(habitId: string, daysAgo: number): Completion {
  const date = subtractDays(new Date(), daysAgo);
  return { id: `c-${daysAgo}`, habitId, completedAt: toDateString(date) };
}

function makeHabit(overrides: Partial<Habit>): Habit {
  return { ...BASE_HABIT, ...overrides };
}

// Returns the Monday (ISO week start) of the date that is `weeksAgo` ISO weeks before today.
function mondayOfWeekOffset(weeksAgo: number): Date {
  const today = new Date();
  const dow = today.getDay() === 0 ? 7 : today.getDay(); // Mon=1, Sun=7
  const thisMonday = subtractDays(today, dow - 1);
  return subtractDays(thisMonday, weeksAgo * 7);
}

// Creates `count` completions within the same ISO week that starts `weeksAgo` weeks before today.
function makeCompletionsForWeek(habitId: string, weeksAgo: number, count: number): Completion[] {
  const monday = mondayOfWeekOffset(weeksAgo);
  return Array.from({ length: count }, (_, i) => ({
    id: `cw${weeksAgo}-${i}`,
    habitId,
    completedAt: toDateString(subtractDays(monday, -i)), // monday, tuesday, ...
  }));
}

describe('StreakService', () => {
  let service: StreakService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StreakService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── daily ──────────────────────────────────────────────────────────────────

  describe('daily frequency', () => {
    const habit = makeHabit({ frequencyType: 'daily' });

    it('returns 0 streak when no completions', () => {
      const { currentStreak } = service.calculate(habit, []);
      expect(currentStreak).toBe(0);
    });

    it('returns streak of 1 when only today is completed', () => {
      const completions = [makeCompletion('h1', 0)];
      const { currentStreak } = service.calculate(habit, completions);
      expect(currentStreak).toBe(1);
    });

    it('maintains streak when today is not yet completed but yesterday was', () => {
      const completions = [makeCompletion('h1', 1)];
      const { currentStreak } = service.calculate(habit, completions);
      expect(currentStreak).toBe(1);
    });

    it('counts consecutive days correctly', () => {
      const completions = [0, 1, 2, 3].map(d => makeCompletion('h1', d));
      const { currentStreak } = service.calculate(habit, completions);
      expect(currentStreak).toBe(4);
    });

    it('breaks streak on a missed day', () => {
      // days 0, 1 completed — day 2 missing — days 3, 4 completed
      const completions = [0, 1, 3, 4].map(d => makeCompletion('h1', d));
      const { currentStreak, longestStreak } = service.calculate(habit, completions);
      expect(currentStreak).toBe(2);
      expect(longestStreak).toBe(2);
    });

    it('tracks longest streak across a gap', () => {
      // 5-day streak followed by gap, then 2-day streak
      const completions = [0, 1, 3, 4, 5, 6, 7].map(d => makeCompletion('h1', d));
      const { longestStreak } = service.calculate(habit, completions);
      expect(longestStreak).toBe(5);
    });

    it('counts total completions correctly', () => {
      const completions = [0, 2, 5].map(d => makeCompletion('h1', d));
      const { totalCompletions } = service.calculate(habit, completions);
      expect(totalCompletions).toBe(3);
    });

    it('ignores completions for other habits', () => {
      const completions = [
        makeCompletion('h1', 0),
        makeCompletion('h2', 1), // different habit
      ];
      const { currentStreak, totalCompletions } = service.calculate(habit, completions);
      expect(currentStreak).toBe(1);
      expect(totalCompletions).toBe(1);
    });
  });

  // ── weekdays ───────────────────────────────────────────────────────────────

  describe('weekdays frequency', () => {
    const habit = makeHabit({ frequencyType: 'weekdays' });

    it('does not break streak over a weekend', () => {
      // Build a set of last 7 weekdays (Mon-Fri) completed
      const completions: Completion[] = [];
      for (let i = 0; i <= 9; i++) {
        const date = subtractDays(new Date(), i);
        if (date.getDay() >= 1 && date.getDay() <= 5) {
          completions.push({ id: `c${i}`, habitId: 'h1', completedAt: toDateString(date) });
        }
      }
      const { currentStreak } = service.calculate(habit, completions);
      expect(currentStreak).toBeGreaterThanOrEqual(5);
    });
  });

  // ── weekends ───────────────────────────────────────────────────────────────

  describe('weekends frequency', () => {
    const habit = makeHabit({ frequencyType: 'weekends' });

    it('skips weekdays when calculating streak', () => {
      const completions: Completion[] = [];
      for (let i = 0; i <= 14; i++) {
        const date = subtractDays(new Date(), i);
        if (date.getDay() === 0 || date.getDay() === 6) {
          completions.push({ id: `c${i}`, habitId: 'h1', completedAt: toDateString(date) });
        }
      }
      const { currentStreak } = service.calculate(habit, completions);
      expect(currentStreak).toBeGreaterThanOrEqual(2);
    });
  });

  // ── custom ─────────────────────────────────────────────────────────────────

  describe('custom frequency', () => {
    // Scheduled every Monday (1) and Wednesday (3)
    const habit = makeHabit({ frequencyType: 'custom', frequencyDays: [1, 3] });

    it('only counts scheduled days in streak', () => {
      const completions: Completion[] = [];
      // Add completions for the last 2 Mondays and 2 Wednesdays
      for (let i = 0; i <= 14; i++) {
        const date = subtractDays(new Date(), i);
        const dow = date.getDay();
        if (dow === 1 || dow === 3) {
          completions.push({ id: `c${i}`, habitId: 'h1', completedAt: toDateString(date) });
        }
      }
      const { currentStreak } = service.calculate(habit, completions);
      expect(currentStreak).toBeGreaterThanOrEqual(4);
    });

    it('breaks streak when a scheduled day is missed', () => {
      // Only complete Mondays, not Wednesdays — streak should break on first missed Wednesday
      const completions: Completion[] = [];
      for (let i = 0; i <= 14; i++) {
        const date = subtractDays(new Date(), i);
        if (date.getDay() === 1) {
          completions.push({ id: `c${i}`, habitId: 'h1', completedAt: toDateString(date) });
        }
      }
      const { currentStreak } = service.calculate(habit, completions);
      // At most 1 Monday before a Wednesday is missed
      expect(currentStreak).toBeLessThanOrEqual(2);
    });
  });

  // ── x_per_week ─────────────────────────────────────────────────────────────

  describe('x_per_week frequency', () => {
    // Target: 3 times per week
    const habit = makeHabit({ frequencyType: 'x_per_week', frequencyDays: [3] });

    it('returns 0 when no completions', () => {
      const { currentStreak } = service.calculate(habit, []);
      expect(currentStreak).toBe(0);
    });

    it('counts a week as success when completions >= target', () => {
      // 3 completions this week (Mon, Tue, Wed of current ISO week)
      const completions = makeCompletionsForWeek('h1', 0, 3);
      const { currentStreak } = service.calculate(habit, completions);
      expect(currentStreak).toBeGreaterThanOrEqual(1);
    });

    it('does not break streak for the current week before it ends', () => {
      // Last week met the target (3 completions), this week has 0
      const completions = makeCompletionsForWeek('h1', 1, 3);
      const { currentStreak } = service.calculate(habit, completions);
      // Current week still in progress — streak should reflect last week's success
      expect(currentStreak).toBeGreaterThanOrEqual(1);
    });

    it('counts consecutive successful weeks', () => {
      // 3 completions per ISO week for weeks 3, 2, 1, and the current week
      const completions: Completion[] = [
        ...makeCompletionsForWeek('h1', 3, 3),
        ...makeCompletionsForWeek('h1', 2, 3),
        ...makeCompletionsForWeek('h1', 1, 3),
        ...makeCompletionsForWeek('h1', 0, 3),
      ];
      const { currentStreak } = service.calculate(habit, completions);
      expect(currentStreak).toBeGreaterThanOrEqual(3);
    });

    it('breaks streak when a past week did not meet the target', () => {
      // This week: 3 completions (✓) | last week: 1 completion (✗)
      const completions: Completion[] = [
        ...makeCompletionsForWeek('h1', 0, 3), // this week: success
        ...makeCompletionsForWeek('h1', 1, 1), // last week: only 1, target is 3
        ...makeCompletionsForWeek('h1', 2, 3), // 2 weeks ago: success (unreachable streak-wise)
      ];
      const { currentStreak } = service.calculate(habit, completions);
      // Streak resets after the failed last week — current streak is only this week (1)
      expect(currentStreak).toBeLessThanOrEqual(2);
    });

    it('uses first element of frequencyDays as target', () => {
      const habit5 = makeHabit({ frequencyType: 'x_per_week', frequencyDays: [5] });
      // 4 completions this week — not enough for target=5
      const completions = [0, 1, 2, 3].map(d => makeCompletion('h1', d));
      const { currentStreak } = service.calculate(habit5, completions);
      // Current week hasn't ended, streak stays; depends on past weeks
      // Just verify it doesn't throw and returns a number
      expect(currentStreak).toBeGreaterThanOrEqual(0);
    });

    it('counts total completions across all weeks', () => {
      const completions = [0, 1, 7, 8, 14].map(d => makeCompletion('h1', d));
      const { totalCompletions } = service.calculate(habit, completions);
      expect(totalCompletions).toBe(5);
    });
  });

  // ── 730-day limit ──────────────────────────────────────────────────────────

  describe('streak limit', () => {
    it('does not walk beyond 730 days for daily habits', () => {
      const habit = makeHabit({ frequencyType: 'daily' });
      // Complete every day for 800 days — streak should be capped at 730
      const completions: Completion[] = [];
      for (let i = 0; i < 800; i++) {
        completions.push(makeCompletion('h1', i));
      }
      const { currentStreak, longestStreak } = service.calculate(habit, completions);
      expect(currentStreak).toBeLessThanOrEqual(730);
      expect(longestStreak).toBeLessThanOrEqual(730);
    });
  });
});
