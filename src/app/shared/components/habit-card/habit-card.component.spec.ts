import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HabitCardComponent } from './habit-card.component';
import { HabitWithStreak } from '../../../core/models/habit.model';

const BASE_HABIT: HabitWithStreak = {
  id: 'h1',
  name: 'Run',
  icon: '🏃',
  color: '#43b89c',
  frequencyType: 'daily',
  frequencyDays: [],
  reminderTime: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  archivedAt: null,
  badge7Days: false,
  badge30Days: false,
  badge100Days: false,
  currentStreak: 5,
  longestStreak: 10,
  completedToday: false,
  totalCompletions: 20,
  weeklyProgress: undefined,
};

describe('HabitCardComponent', () => {
  let component: HabitCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HabitCardComponent, RouterModule.forRoot([])],
      providers: [provideAnimations()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    const fixture = TestBed.createComponent(HabitCardComponent);
    component = fixture.componentInstance;
    component.habit = { ...BASE_HABIT };
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // ── isXPerWeek ─────────────────────────────────────────────────────────────

  describe('isXPerWeek', () => {
    it('returns true for x_per_week frequency', () => {
      component.habit = { ...BASE_HABIT, frequencyType: 'x_per_week' };
      expect(component.isXPerWeek).toBeTrue();
    });

    it('returns false for daily frequency', () => {
      expect(component.isXPerWeek).toBeFalse();
    });

    it('returns false for weekdays frequency', () => {
      component.habit = { ...BASE_HABIT, frequencyType: 'weekdays' };
      expect(component.isXPerWeek).toBeFalse();
    });
  });

  // ── weeklyProgressRatio ────────────────────────────────────────────────────

  describe('weeklyProgressRatio', () => {
    it('returns 0 when weeklyProgress is undefined', () => {
      expect(component.weeklyProgressRatio).toBe(0);
    });

    it('returns 0 when target is 0', () => {
      component.habit = { ...BASE_HABIT, weeklyProgress: { done: 2, target: 0 } };
      expect(component.weeklyProgressRatio).toBe(0);
    });

    it('returns correct ratio for partial progress', () => {
      component.habit = { ...BASE_HABIT, weeklyProgress: { done: 2, target: 4 } };
      expect(component.weeklyProgressRatio).toBe(0.5);
    });

    it('clamps ratio to 1 when done exceeds target', () => {
      component.habit = { ...BASE_HABIT, weeklyProgress: { done: 5, target: 3 } };
      expect(component.weeklyProgressRatio).toBe(1);
    });
  });

  // ── weeklyGoalReached ──────────────────────────────────────────────────────

  describe('weeklyGoalReached', () => {
    it('returns false when weeklyProgress is undefined', () => {
      expect(component.weeklyGoalReached).toBeFalse();
    });

    it('returns true when done equals target', () => {
      component.habit = { ...BASE_HABIT, weeklyProgress: { done: 3, target: 3 } };
      expect(component.weeklyGoalReached).toBeTrue();
    });

    it('returns true when done exceeds target', () => {
      component.habit = { ...BASE_HABIT, weeklyProgress: { done: 4, target: 3 } };
      expect(component.weeklyGoalReached).toBeTrue();
    });

    it('returns false when done is less than target', () => {
      component.habit = { ...BASE_HABIT, weeklyProgress: { done: 2, target: 3 } };
      expect(component.weeklyGoalReached).toBeFalse();
    });
  });

  // ── weeklyProgressLabel ────────────────────────────────────────────────────

  describe('weeklyProgressLabel', () => {
    it('returns empty string when weeklyProgress is undefined', () => {
      expect(component.weeklyProgressLabel).toBe('');
    });

    it('returns "X/N esta semana" format', () => {
      component.habit = { ...BASE_HABIT, weeklyProgress: { done: 2, target: 3 } };
      expect(component.weeklyProgressLabel).toContain('2/3');
    });
  });

  // ── streakLabel ────────────────────────────────────────────────────────────

  describe('streakLabel', () => {
    it('includes the currentStreak value', () => {
      expect(component.streakLabel).toContain('5');
    });
  });

  // ── onToggle ───────────────────────────────────────────────────────────────

  describe('onToggle()', () => {
    it('stops event propagation', async () => {
      const event = new MouseEvent('click');
      const stopSpy = spyOn(event, 'stopPropagation');
      await component.onToggle(event);
      expect(stopSpy).toHaveBeenCalled();
    });

    it('emits toggle event', async () => {
      const emitted = jasmine.createSpy('toggle');
      component.toggle.subscribe(emitted);
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');
      await component.onToggle(event);
      expect(emitted).toHaveBeenCalled();
    });

    it('sets isFlashing to true immediately and resets after 500ms', fakeAsync(() => {
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');

      component.onToggle(event);
      // flashCard() is now synchronous so isFlashing is true immediately

      expect(component.isFlashing()).toBeTrue();
      tick(500);
      expect(component.isFlashing()).toBeFalse();
    }));

    it('does not throw even when Haptics is unavailable', async () => {
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');
      await expectAsync(component.onToggle(event)).toBeResolved();
    });
  });
});
