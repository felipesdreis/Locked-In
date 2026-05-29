import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';
import { ArchivedHabitsPage } from './archived-habits.page';
import { HabitService } from '../../core/services/habit.service';
import { Habit } from '../../core/models/habit.model';

const ARCHIVED_HABIT: Habit = {
  id: 'h1',
  name: 'Run',
  icon: '🏃',
  color: '#43b89c',
  frequencyType: 'daily',
  frequencyDays: [],
  reminderTime: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  archivedAt: '2024-06-01T00:00:00.000Z',
  badge7Days: false,
  badge30Days: false,
  badge100Days: false,
};

describe('ArchivedHabitsPage', () => {
  let component: ArchivedHabitsPage;
  let habitServiceMock: jasmine.SpyObj<HabitService>;
  let alertCtrlMock: jasmine.SpyObj<AlertController>;
  let alertElMock: jasmine.SpyObj<HTMLIonAlertElement>;

  beforeEach(async () => {
    habitServiceMock = jasmine.createSpyObj<HabitService>('HabitService', [
      'loadArchived', 'restore', 'delete', 'load',
    ]);
    habitServiceMock.loadArchived.and.resolveTo([ARCHIVED_HABIT]);
    habitServiceMock.restore.and.resolveTo(undefined);
    habitServiceMock.delete.and.resolveTo(undefined);

    alertElMock = jasmine.createSpyObj<HTMLIonAlertElement>('HTMLIonAlertElement', ['present', 'dismiss']);
    alertElMock.present.and.resolveTo();
    alertElMock.dismiss.and.resolveTo();
    alertCtrlMock = jasmine.createSpyObj<AlertController>('AlertController', ['create']);
    alertCtrlMock.create.and.resolveTo(alertElMock);

    TestBed.configureTestingModule({
      imports: [ArchivedHabitsPage],
      providers: [
        { provide: HabitService, useValue: habitServiceMock },
        { provide: AlertController, useValue: alertCtrlMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    const fixture = TestBed.createComponent(ArchivedHabitsPage);
    component = fixture.componentInstance;
    await component.ngOnInit();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ───────────────────────────────────────────────────────────────

  describe('ngOnInit()', () => {
    it('loads archived habits and populates signal', () => {
      expect(habitServiceMock.loadArchived).toHaveBeenCalled();
      expect(component.archivedHabits().length).toBe(1);
      expect(component.archivedHabits()[0].id).toBe('h1');
    });

    it('shows empty list when no archived habits exist', async () => {
      habitServiceMock.loadArchived.and.resolveTo([]);
      await component.ngOnInit();
      expect(component.archivedHabits().length).toBe(0);
    });
  });

  // ── restore ────────────────────────────────────────────────────────────────

  describe('restore()', () => {
    it('calls habitService.restore() with the habit id', async () => {
      await component.restore('h1');
      expect(habitServiceMock.restore).toHaveBeenCalledWith('h1');
    });

    it('refreshes the archived list after restoring', async () => {
      habitServiceMock.loadArchived.and.resolveTo([]);
      await component.restore('h1');
      expect(component.archivedHabits().length).toBe(0);
    });
  });

  // ── confirmDelete ──────────────────────────────────────────────────────────

  describe('confirmDelete()', () => {
    it('opens an AlertController confirmation dialog', async () => {
      await component.confirmDelete(ARCHIVED_HABIT);
      expect(alertCtrlMock.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ header: jasmine.any(String) }),
      );
      expect(alertElMock.present).toHaveBeenCalled();
    });

    it('alert message contains the habit name', async () => {
      await component.confirmDelete(ARCHIVED_HABIT);
      const createArg = alertCtrlMock.create.calls.mostRecent().args[0]!;
      expect(createArg.message).toContain(ARCHIVED_HABIT.name);
    });

    it('alert has a destructive button alongside cancel', async () => {
      await component.confirmDelete(ARCHIVED_HABIT);
      const createArg = alertCtrlMock.create.calls.mostRecent().args[0]!;
      const roles = (createArg.buttons as Array<{ role: string }>).map(b => b.role);
      expect(roles).toContain('cancel');
      expect(roles).toContain('destructive');
    });
  });

  // ── formatDate ─────────────────────────────────────────────────────────────

  describe('formatDate()', () => {
    it('returns a localised date string for a valid ISO date', () => {
      const result = component.formatDate('2024-06-01T00:00:00.000Z');
      expect(result).toMatch(/\d/);
    });

    it('returns empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });
  });
});
