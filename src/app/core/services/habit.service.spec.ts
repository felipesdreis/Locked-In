import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HabitService } from './habit.service';
import { DbService } from './db.service';
import { StreakService } from './streak.service';
import { NotificationService } from './notification.service';
import { Habit, Completion } from '../models/habit.model';
import { toDateString } from '../utils/date.util';

const SAMPLE_HABIT_ROW: Record<string, string> = {
  id: 'h1',
  name: 'Run',
  icon: '🏃',
  color: '#43b89c',
  frequency_type: 'daily',
  frequency_days: '[]',
  reminder_time: '',
  created_at: '2024-01-01T00:00:00.000Z',
  archived_at: '',
};

const SAMPLE_COMPLETION_ROW: Record<string, string> = {
  id: 'c1',
  habit_id: 'h1',
  completed_at: toDateString(new Date()),
};

function buildDbMock(habitRows: Record<string, string>[], completionRows: Record<string, string>[]): jasmine.SpyObj<DbService> {
  const mock = jasmine.createSpyObj<DbService>('DbService', ['query', 'run']);
  mock.query.and.callFake((sql: string) => {
    if (sql.includes('FROM habits')) return Promise.resolve(habitRows as never[]);
    if (sql.includes('FROM completions')) return Promise.resolve(completionRows as never[]);
    return Promise.resolve([]);
  });
  mock.run.and.resolveTo(undefined);
  return mock;
}

function buildNotificationMock(): jasmine.SpyObj<NotificationService> {
  return jasmine.createSpyObj<NotificationService>('NotificationService', ['schedule', 'cancel']);
}

describe('HabitService', () => {
  let service: HabitService;
  let dbMock: jasmine.SpyObj<DbService>;
  let notifMock: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    dbMock = buildDbMock([SAMPLE_HABIT_ROW], [SAMPLE_COMPLETION_ROW]);
    notifMock = buildNotificationMock();
    notifMock.schedule.and.resolveTo(undefined);
    notifMock.cancel.and.resolveTo(undefined);

    TestBed.configureTestingModule({
      providers: [
        HabitService,
        StreakService,
        { provide: DbService, useValue: dbMock },
        { provide: NotificationService, useValue: notifMock },
      ],
    });
    service = TestBed.inject(HabitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── load ───────────────────────────────────────────────────────────────────

  describe('load()', () => {
    it('populates habits and completions signals', async () => {
      await service.load();

      expect(service.habits().length).toBe(1);
      expect(service.habits()[0].id).toBe('h1');
    });

    it('filters completions by habit when computing habitsWithStreak', async () => {
      await service.load();

      const withStreak = service.habitsWithStreak();
      expect(withStreak.length).toBe(1);
      expect(withStreak[0].completedToday).toBeTrue();
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('inserts a new habit row and reloads signals', async () => {
      await service.create({
        name: 'Meditate',
        icon: '🧘',
        color: '#6c63ff',
        frequencyType: 'daily',
        frequencyDays: [],
        reminderTime: null,
      });

      expect(dbMock.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT INTO habits'),
        jasmine.any(Array),
      );
      // load() is called after insert — query should have been called
      expect(dbMock.query).toHaveBeenCalled();
    });

    it('schedules a notification when reminderTime is provided', async () => {
      await service.create({
        name: 'Wake up',
        icon: '☀️',
        color: '#f9a825',
        frequencyType: 'daily',
        frequencyDays: [],
        reminderTime: '07:00',
      });

      expect(notifMock.schedule).toHaveBeenCalledWith(
        jasmine.objectContaining({ reminderTime: '07:00' }),
      );
    });

    it('does not schedule a notification when reminderTime is null', async () => {
      await service.create({
        name: 'Read',
        icon: '📚',
        color: '#42a5f5',
        frequencyType: 'daily',
        frequencyDays: [],
        reminderTime: null,
      });

      expect(notifMock.schedule).not.toHaveBeenCalled();
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('updates the habit row and reloads signals', async () => {
      await service.load();
      await service.update('h1', { name: 'Run fast' });

      expect(dbMock.run).toHaveBeenCalledWith(
        jasmine.stringContaining('UPDATE habits'),
        jasmine.any(Array),
      );
    });

    it('cancels the old notification before rescheduling', async () => {
      await service.load();
      await service.update('h1', { reminderTime: '08:00' });

      expect(notifMock.cancel).toHaveBeenCalledWith('h1');
      expect(notifMock.schedule).toHaveBeenCalledWith(
        jasmine.objectContaining({ reminderTime: '08:00' }),
      );
    });

    it('does nothing when the habit id does not exist', async () => {
      await service.load();
      await service.update('nonexistent', { name: 'Ghost' });

      expect(dbMock.run).not.toHaveBeenCalled();
    });
  });

  // ── archive ────────────────────────────────────────────────────────────────

  describe('archive()', () => {
    it('sets archived_at and cancels notification', async () => {
      await service.archive('h1');

      expect(dbMock.run).toHaveBeenCalledWith(
        jasmine.stringContaining('UPDATE habits SET archived_at'),
        jasmine.any(Array),
      );
      expect(notifMock.cancel).toHaveBeenCalledWith('h1');
    });

    it('reloads signals after archiving', async () => {
      const queryCalls = dbMock.query.calls.count();
      await service.archive('h1');
      expect(dbMock.query.calls.count()).toBeGreaterThan(queryCalls);
    });
  });

  // ── toggleToday ────────────────────────────────────────────────────────────

  describe('toggleToday()', () => {
    it('inserts a completion when habit is not completed today', async () => {
      // Load with no completions for today
      dbMock = buildDbMock([SAMPLE_HABIT_ROW], []);
      notifMock = buildNotificationMock();
      notifMock.schedule.and.resolveTo(undefined);
      notifMock.cancel.and.resolveTo(undefined);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          HabitService,
          StreakService,
          { provide: DbService, useValue: dbMock },
          { provide: NotificationService, useValue: notifMock },
        ],
      });
      service = TestBed.inject(HabitService);
      await service.load();

      await service.toggleToday('h1');

      expect(dbMock.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT INTO completions'),
        jasmine.any(Array),
      );
    });

    it('deletes the completion when habit is already completed today', async () => {
      await service.load();

      await service.toggleToday('h1');

      expect(dbMock.run).toHaveBeenCalledWith(
        jasmine.stringContaining('DELETE FROM completions'),
        jasmine.any(Array),
      );
    });

    it('reloads signals after toggling', async () => {
      await service.load();
      const queryCalls = dbMock.query.calls.count();
      await service.toggleToday('h1');
      expect(dbMock.query.calls.count()).toBeGreaterThan(queryCalls);
    });

    it('does not touch notifications when the habit has no reminderTime', async () => {
      // Default SAMPLE_HABIT_ROW has reminder_time: '' and is completed today
      await service.load();
      await service.toggleToday('h1');
      expect(notifMock.cancel).not.toHaveBeenCalled();
      expect(notifMock.schedule).not.toHaveBeenCalled();
    });

    it('cancels the notification when marking a reminder-enabled habit complete', async () => {
      const habitWithReminder = { ...SAMPLE_HABIT_ROW, reminder_time: '10:00' };
      dbMock = buildDbMock([habitWithReminder], []); // not completed today
      notifMock = buildNotificationMock();
      notifMock.schedule.and.resolveTo(undefined);
      notifMock.cancel.and.resolveTo(undefined);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          HabitService,
          StreakService,
          { provide: DbService, useValue: dbMock },
          { provide: NotificationService, useValue: notifMock },
        ],
      });
      service = TestBed.inject(HabitService);
      await service.load();

      await service.toggleToday('h1');

      expect(notifMock.cancel).toHaveBeenCalledWith('h1');
      expect(notifMock.schedule).not.toHaveBeenCalled();
    });

    it('reschedules the notification when undoing completion of a reminder-enabled habit', async () => {
      const habitWithReminder = { ...SAMPLE_HABIT_ROW, reminder_time: '10:00' };
      dbMock = buildDbMock([habitWithReminder], [SAMPLE_COMPLETION_ROW]); // completed today
      notifMock = buildNotificationMock();
      notifMock.schedule.and.resolveTo(undefined);
      notifMock.cancel.and.resolveTo(undefined);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          HabitService,
          StreakService,
          { provide: DbService, useValue: dbMock },
          { provide: NotificationService, useValue: notifMock },
        ],
      });
      service = TestBed.inject(HabitService);
      await service.load();

      await service.toggleToday('h1');

      expect(notifMock.schedule).toHaveBeenCalledWith(
        jasmine.objectContaining({ id: 'h1', reminderTime: '10:00' }),
      );
      expect(notifMock.cancel).not.toHaveBeenCalled();
    });
  });

  // ── syncNotifications ────────────────────────────────────────────────────────

  describe('syncNotifications()', () => {
    it('cancels reminders for habits already completed today', async () => {
      const habitWithReminder = { ...SAMPLE_HABIT_ROW, reminder_time: '10:00' };
      dbMock = buildDbMock([habitWithReminder], [SAMPLE_COMPLETION_ROW]); // completed today
      notifMock = buildNotificationMock();
      notifMock.schedule.and.resolveTo(undefined);
      notifMock.cancel.and.resolveTo(undefined);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          HabitService,
          StreakService,
          { provide: DbService, useValue: dbMock },
          { provide: NotificationService, useValue: notifMock },
        ],
      });
      service = TestBed.inject(HabitService);
      await service.load();

      await service.syncNotifications();

      expect(notifMock.cancel).toHaveBeenCalledWith('h1');
      expect(notifMock.schedule).not.toHaveBeenCalled();
    });

    it('reschedules reminders for habits not yet completed today', async () => {
      const habitWithReminder = { ...SAMPLE_HABIT_ROW, reminder_time: '10:00' };
      dbMock = buildDbMock([habitWithReminder], []); // not completed today
      notifMock = buildNotificationMock();
      notifMock.schedule.and.resolveTo(undefined);
      notifMock.cancel.and.resolveTo(undefined);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          HabitService,
          StreakService,
          { provide: DbService, useValue: dbMock },
          { provide: NotificationService, useValue: notifMock },
        ],
      });
      service = TestBed.inject(HabitService);
      await service.load();

      await service.syncNotifications();

      expect(notifMock.schedule).toHaveBeenCalledWith(
        jasmine.objectContaining({ id: 'h1', reminderTime: '10:00' }),
      );
      expect(notifMock.cancel).not.toHaveBeenCalled();
    });

    it('ignores habits without a reminderTime', async () => {
      // Default SAMPLE_HABIT_ROW has reminder_time: ''
      await service.load();
      await service.syncNotifications();
      expect(notifMock.cancel).not.toHaveBeenCalled();
      expect(notifMock.schedule).not.toHaveBeenCalled();
    });
  });

  // ── loadArchived ───────────────────────────────────────────────────────────

  describe('loadArchived()', () => {
    it('queries habits WHERE archived_at IS NOT NULL', async () => {
      await service.loadArchived();
      expect(dbMock.query).toHaveBeenCalledWith(
        jasmine.stringContaining('WHERE archived_at IS NOT NULL'),
      );
    });

    it('returns mapped Habit array from archived rows', async () => {
      const archivedRow: Record<string, string> = {
        ...SAMPLE_HABIT_ROW,
        id: 'h-archived',
        archived_at: '2024-06-01T00:00:00.000Z',
      };
      dbMock.query.and.callFake((sql: string) => {
        if (sql.includes('WHERE archived_at IS NOT NULL')) return Promise.resolve([archivedRow] as never[]);
        if (sql.includes('FROM habits')) return Promise.resolve([SAMPLE_HABIT_ROW] as never[]);
        if (sql.includes('FROM completions')) return Promise.resolve([SAMPLE_COMPLETION_ROW] as never[]);
        return Promise.resolve([]);
      });
      const habits = await service.loadArchived();
      expect(habits.length).toBe(1);
      expect(habits[0].id).toBe('h-archived');
    });

    it('returns empty array when no archived habits exist', async () => {
      dbMock.query.and.callFake((sql: string) => {
        if (sql.includes('WHERE archived_at IS NOT NULL')) return Promise.resolve([] as never[]);
        if (sql.includes('FROM habits')) return Promise.resolve([SAMPLE_HABIT_ROW] as never[]);
        if (sql.includes('FROM completions')) return Promise.resolve([SAMPLE_COMPLETION_ROW] as never[]);
        return Promise.resolve([]);
      });
      const habits = await service.loadArchived();
      expect(habits.length).toBe(0);
    });
  });

  // ── restore ────────────────────────────────────────────────────────────────

  describe('restore()', () => {
    it('sets archived_at = NULL for the given id', async () => {
      await service.restore('h1');
      expect(dbMock.run).toHaveBeenCalledWith(
        jasmine.stringContaining('archived_at=NULL'),
        ['h1'],
      );
    });

    it('calls load() after restoring', async () => {
      const queryCalls = dbMock.query.calls.count();
      await service.restore('h1');
      expect(dbMock.query.calls.count()).toBeGreaterThan(queryCalls);
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('deletes the habit row (ON DELETE CASCADE removes completions)', async () => {
      await service.delete('h1');
      expect(dbMock.run).toHaveBeenCalledWith(
        jasmine.stringContaining('DELETE FROM habits WHERE id'),
        ['h1'],
      );
      expect(dbMock.run).not.toHaveBeenCalledWith(
        jasmine.stringContaining('DELETE FROM completions'),
        jasmine.any(Array),
      );
    });

    it('cancels the habit notification on delete', async () => {
      await service.delete('h1');
      expect(notifMock.cancel).toHaveBeenCalledWith('h1');
    });

    it('calls load() after deletion', async () => {
      const queryCalls = dbMock.query.calls.count();
      await service.delete('h1');
      expect(dbMock.query.calls.count()).toBeGreaterThan(queryCalls);
    });
  });

  // ── getCompletionsFor ──────────────────────────────────────────────────────

  describe('getCompletionsFor()', () => {
    it('returns only completions for the specified habit', async () => {
      const otherCompletion: Record<string, string> = {
        id: 'c2',
        habit_id: 'h2',
        completed_at: toDateString(new Date()),
      };
      dbMock.query.and.callFake((sql: string) => {
        if (sql.includes('FROM habits')) return Promise.resolve([SAMPLE_HABIT_ROW] as never[]);
        if (sql.includes('FROM completions')) return Promise.resolve([SAMPLE_COMPLETION_ROW, otherCompletion] as never[]);
        return Promise.resolve([]);
      });

      await service.load();
      const completions = service.getCompletionsFor('h1');
      expect(completions.length).toBe(1);
      expect(completions[0].habitId).toBe('h1');
    });
  });
});
