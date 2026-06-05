import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal, computed } from '@angular/core';
import { AnalyticsPage } from './analytics.page';
import { HabitService } from '../../core/services/habit.service';
import { HabitWithStreak, Completion } from '../../core/models/habit.model';
import { toDateString, subtractDays, currentIsoWeekDates } from '../../core/utils/date.util';

function makeHabit(overrides: Partial<HabitWithStreak> = {}): HabitWithStreak {
  return {
    id: 'h1', name: 'Test', icon: '💪', color: '#6c63ff',
    frequencyType: 'daily', frequencyDays: [],
    reminderTime: null, createdAt: '2024-01-01T00:00:00.000Z', archivedAt: null,
    badge7Days: false, badge30Days: false, badge100Days: false,
    currentStreak: 1, longestStreak: 1, completedToday: false, totalCompletions: 1,
    ...overrides,
  };
}

function buildHabitServiceMock(
  habits: HabitWithStreak[],
  completions: Completion[],
): jasmine.SpyObj<HabitService> {
  const habitsSignal = signal(habits);
  const completionsSignal = signal(completions);
  const habitsWithStreakSignal = computed(() => habitsSignal());

  const spy = jasmine.createSpyObj<HabitService>('HabitService', ['load', 'isScheduledForDay'], {
    habitsWithStreak: habitsWithStreakSignal,
    allCompletions: completionsSignal,
    habits: habitsSignal,
  }) as unknown as jasmine.SpyObj<HabitService>;
  (spy.isScheduledForDay as jasmine.Spy).and.returnValue(true);
  return spy;
}

describe('AnalyticsPage', () => {
  let component: AnalyticsPage;

  async function setup(habits: HabitWithStreak[], completions: Completion[]) {
    const mock = buildHabitServiceMock(habits, completions);
    (mock.load as jasmine.Spy).and.resolveTo(undefined);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AnalyticsPage],
      providers: [{ provide: HabitService, useValue: mock }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    const fixture = TestBed.createComponent(AnalyticsPage);
    component = fixture.componentInstance;
    await component.ngOnInit();
  }

  // ── todayRate ─────────────────────────────────────────────────────────────────

  describe('todayRate', () => {
    it('returns 0 when no habits exist', async () => {
      await setup([], []);
      expect(component.todayRate()).toBe(0);
    });

    it('returns 100 when all habits completed today', async () => {
      const h1 = makeHabit({ id: 'h1', completedToday: true });
      const h2 = makeHabit({ id: 'h2', completedToday: true });
      await setup([h1, h2], []);
      expect(component.todayRate()).toBe(100);
    });

    it('returns 50 when half the habits are completed', async () => {
      const h1 = makeHabit({ id: 'h1', completedToday: true });
      const h2 = makeHabit({ id: 'h2', completedToday: false });
      await setup([h1, h2], []);
      expect(component.todayRate()).toBe(50);
    });
  });

  // ── topStreaks ────────────────────────────────────────────────────────────────

  describe('topStreaks', () => {
    it('sorts habits by currentStreak descending', async () => {
      const low = makeHabit({ id: 'low', currentStreak: 1 });
      const high = makeHabit({ id: 'high', currentStreak: 10 });
      const mid = makeHabit({ id: 'mid', currentStreak: 5 });
      await setup([low, high, mid], []);
      const streaks = component.topStreaks().map(h => h.currentStreak);
      expect(streaks).toEqual([10, 5, 1]);
    });

    it('returns at most 5 habits', async () => {
      const habits = Array.from({ length: 8 }, (_, i) =>
        makeHabit({ id: `h${i}`, currentStreak: i }),
      );
      await setup(habits, []);
      expect(component.topStreaks().length).toBe(5);
    });
  });

  // ── habitsAtRisk ──────────────────────────────────────────────────────────────

  describe('habitsAtRisk', () => {
    it('includes only habits with streak < 3', async () => {
      const safe = makeHabit({ id: 'safe', currentStreak: 5 });
      const risky = makeHabit({ id: 'risky', currentStreak: 1 });
      await setup([safe, risky], []);
      const riskIds = component.habitsAtRisk().map(h => h.id);
      expect(riskIds).not.toContain('safe');
      expect(riskIds).toContain('risky');
    });
  });

  // ── habitsTable / computeWeeklyRate ───────────────────────────────────────────

  describe('habitsTable computeWeeklyRate', () => {
    it('daily: done = completions in current ISO week, denominator = elapsed ISO week days', async () => {
      const today = new Date();
      const todayStr = toDateString(today);
      const isoWeek = currentIsoWeekDates(today);
      const elapsedDays = isoWeek.indexOf(todayStr) + 1;

      const completionsThisWeek: Completion[] = isoWeek
        .slice(0, elapsedDays)
        .map((date, i) => ({ id: `c${i}`, habitId: 'h1', completedAt: date }));

      const h1 = makeHabit({ id: 'h1', frequencyType: 'daily' });
      await setup([h1], completionsThisWeek);

      const row = component.habitsTable().find(r => r.id === 'h1')!;
      expect(row.actualWeeklyRate.done).toBe(elapsedDays);
      expect(row.actualWeeklyRate.denominator).toBe(elapsedDays);
      expect(row.actualWeeklyRate.percent).toBe(100);
    });

    it('daily: 0 completions this week gives 0%', async () => {
      const h1 = makeHabit({ id: 'h1', frequencyType: 'daily' });
      const oldCompletion: Completion = { id: 'c1', habitId: 'h1', completedAt: toDateString(subtractDays(new Date(), 10)) };
      await setup([h1], [oldCompletion]);

      const row = component.habitsTable().find(r => r.id === 'h1')!;
      expect(row.actualWeeklyRate.done).toBe(0);
      expect(row.actualWeeklyRate.percent).toBe(0);
    });

    it('x_per_week: done = completions in current ISO week, denominator = target', async () => {
      const today = new Date();
      const todayStr = toDateString(today);
      const h1 = makeHabit({ id: 'h1', frequencyType: 'x_per_week', frequencyDays: [3] });
      const comp: Completion = { id: 'c1', habitId: 'h1', completedAt: todayStr };
      await setup([h1], [comp]);

      const row = component.habitsTable().find(r => r.id === 'h1')!;
      expect(row.actualWeeklyRate.done).toBe(1);
      expect(row.actualWeeklyRate.denominator).toBe(3);
    });

    it('weekdays: done = completions on Mon–Fri in last 7 days, denominator = 5', async () => {
      const h1 = makeHabit({ id: 'h1', frequencyType: 'weekdays' });
      // add 3 weekday completions in the last 7 days
      const completions: Completion[] = [];
      let count = 0;
      for (let i = 0; i < 7 && count < 3; i++) {
        const d = subtractDays(new Date(), i);
        const dow = d.getDay();
        if (dow >= 1 && dow <= 5) {
          completions.push({ id: `c${count}`, habitId: 'h1', completedAt: toDateString(d) });
          count++;
        }
      }
      await setup([h1], completions);

      const row = component.habitsTable().find(r => r.id === 'h1')!;
      expect(row.actualWeeklyRate.done).toBe(3);
      expect(row.actualWeeklyRate.denominator).toBe(5);
    });
  });

  // ── weeklyRateDetails ─────────────────────────────────────────────────────────

  describe('weeklyRateDetails', () => {
    it('rate is 0 when no completions this ISO week', async () => {
      const h1 = makeHabit({ id: 'h1' });
      const old: Completion = { id: 'c1', habitId: 'h1', completedAt: toDateString(subtractDays(new Date(), 8)) };
      await setup([h1], [old]);
      expect(component.weeklyRateDetails().rate).toBe(0);
    });

    it('rate is 100 when all elapsed ISO week days for all habits are completed', async () => {
      const today = new Date();
      const todayStr = toDateString(today);
      const isoWeek = currentIsoWeekDates(today);
      const elapsedDays = isoWeek.indexOf(todayStr) + 1;

      const h1 = makeHabit({ id: 'h1' });
      const completions: Completion[] = isoWeek
        .slice(0, elapsedDays)
        .map((date, i) => ({ id: `c${i}`, habitId: 'h1', completedAt: date }));

      await setup([h1], completions);
      expect(component.weeklyRateDetails().rate).toBe(100);
    });
  });

  // ── overallRate in habitsTable ───────────────────────────────────────────────

  describe('habitsTable overallRate', () => {
    it('daily: 100% when completed every day since creation', async () => {
      const today = new Date();
      const todayStr = toDateString(today);
      // Created 7 days ago
      const createdDate = subtractDays(today, 6);
      const createdAt = createdDate.toISOString();
      const h1 = makeHabit({ id: 'h1', frequencyType: 'daily', createdAt });
      // 7 completions, one per day
      const completions: Completion[] = Array.from({ length: 7 }, (_, i) => ({
        id: `c${i}`,
        habitId: 'h1',
        completedAt: toDateString(subtractDays(today, 6 - i)),
      }));
      await setup([h1], completions);
      const row = component.habitsTable().find(r => r.id === 'h1')!;
      expect(row.overallRate).toBe(100);
    });

    it('daily: ~50% when completed half the days since creation', async () => {
      const today = new Date();
      const createdDate = subtractDays(today, 9); // 10 days ago
      const createdAt = createdDate.toISOString();
      const h1 = makeHabit({ id: 'h1', frequencyType: 'daily', createdAt });
      // 5 completions out of 10 days
      const completions: Completion[] = Array.from({ length: 5 }, (_, i) => ({
        id: `c${i}`,
        habitId: 'h1',
        completedAt: toDateString(subtractDays(today, i)),
      }));
      await setup([h1], completions);
      const row = component.habitsTable().find(r => r.id === 'h1')!;
      expect(row.overallRate).toBe(50);
    });

    it('is 0% when habit has no completions', async () => {
      const h1 = makeHabit({ id: 'h1', frequencyType: 'daily', createdAt: subtractDays(new Date(), 5).toISOString() });
      await setup([h1], []);
      const row = component.habitsTable().find(r => r.id === 'h1')!;
      expect(row.overallRate).toBe(0);
    });
  });
});
