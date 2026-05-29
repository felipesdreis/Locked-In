import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HabitFormPage } from './habit-form.page';
import { HabitService } from '../../core/services/habit.service';
import { Habit } from '../../core/models/habit.model';

const SAMPLE_HABIT: Habit = {
  id: 'h1',
  name: 'Meditar',
  icon: '🧘',
  color: '#43b89c',
  frequencyType: 'daily',
  frequencyDays: [],
  reminderTime: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  archivedAt: null,
  badge7Days: false,
  badge30Days: false,
  badge100Days: false,
};

function buildHabitServiceMock(habits: Habit[] = []): jasmine.SpyObj<HabitService> {
  const mock = jasmine.createSpyObj<HabitService>('HabitService', [
    'load', 'create', 'update',
  ], { habits: signal(habits) as unknown as HabitService['habits'] });
  mock.load.and.resolveTo(undefined);
  mock.create.and.resolveTo(undefined);
  mock.update.and.resolveTo(undefined);
  return mock;
}

describe('HabitFormPage', () => {
  let component: HabitFormPage;
  let habitServiceMock: jasmine.SpyObj<HabitService>;
  let router: Router;

  async function setupComponent(paramId: string | null = null, habits: Habit[] = []) {
    TestBed.resetTestingModule();
    habitServiceMock = buildHabitServiceMock(habits);

    TestBed.configureTestingModule({
      imports: [HabitFormPage, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: HabitService, useValue: habitServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => paramId } } },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    const fixture = TestBed.createComponent(HabitFormPage);
    component = fixture.componentInstance;
    await component.ngOnInit();
  }

  beforeEach(async () => {
    await setupComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // ── isFormValid ──────────────────────────────────────────────────────────────

  describe('isFormValid', () => {
    it('returns false when name is empty', () => {
      component['form'].patchValue({ name: '' });
      expect(component.isFormValid).toBeFalse();
    });

    it('returns true with a valid name and daily frequency', () => {
      component['form'].patchValue({ name: 'Correr', frequencyType: 'daily' });
      expect(component.isFormValid).toBeTrue();
    });

    it('returns false for custom frequency with no days selected', () => {
      component['form'].patchValue({ frequencyType: 'custom', frequencyDays: [] });
      component['form'].get('frequencyDays')!.setValidators(
        (control) => (control.value?.length > 0 ? null : { noDaySelected: true }),
      );
      component['form'].get('frequencyDays')!.updateValueAndValidity();
      expect(component.isFormValid).toBeFalse();
    });

    it('returns true for custom frequency with at least one day', () => {
      component['form'].patchValue({ name: 'Correr', frequencyType: 'custom', frequencyDays: [1] });
      component['form'].get('frequencyDays')!.clearValidators();
      component['form'].get('frequencyDays')!.updateValueAndValidity();
      expect(component.isFormValid).toBeTrue();
    });

    it('returns false when name exceeds 50 characters', () => {
      component['form'].patchValue({ name: 'A'.repeat(51) });
      expect(component.isFormValid).toBeFalse();
    });
  });

  // ── save ─────────────────────────────────────────────────────────────────────

  describe('save()', () => {
    it('calls markAllAsTouched() and does not submit when form is invalid', async () => {
      component['form'].patchValue({ name: '' });
      spyOn(component['form'], 'markAllAsTouched').and.callThrough();
      await component.save();
      expect(component['form'].markAllAsTouched).toHaveBeenCalled();
      expect(habitServiceMock.create).not.toHaveBeenCalled();
    });

    it('calls habitService.create() with correct payload for daily habit', async () => {
      component['form'].patchValue({ name: 'Correr', frequencyType: 'daily', icon: '🏃', color: '#ff6584', reminderTime: null });
      await component.save();
      expect(habitServiceMock.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ name: 'Correr', frequencyType: 'daily', frequencyDays: [] }),
      );
    });

    it('sends frequencyDays=[count] for x_per_week', async () => {
      component['form'].patchValue({ name: 'Correr', frequencyType: 'x_per_week', xPerWeekCount: 4 });
      await component.save();
      expect(habitServiceMock.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ frequencyType: 'x_per_week', frequencyDays: [4] }),
      );
    });

    it('sends selected days for custom frequency', async () => {
      component['form'].patchValue({ name: 'Correr', frequencyType: 'custom', frequencyDays: [1, 3, 5] });
      // clearValidators so isFormValid passes
      component['form'].get('frequencyDays')!.clearValidators();
      component['form'].get('frequencyDays')!.updateValueAndValidity();
      await component.save();
      expect(habitServiceMock.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ frequencyDays: [1, 3, 5] }),
      );
    });

    it('navigates to /home after successful create', async () => {
      component['form'].patchValue({ name: 'Correr', frequencyType: 'daily' });
      await component.save();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
    });

    it('calls habitService.update() when editing an existing habit', async () => {
      await setupComponent('h1', [SAMPLE_HABIT]);
      component['form'].patchValue({ name: 'Meditar editado' });
      await component.save();
      expect(habitServiceMock.update).toHaveBeenCalledWith('h1', jasmine.objectContaining({ name: 'Meditar editado' }));
    });
  });

  // ── toggleDay ─────────────────────────────────────────────────────────────────

  describe('toggleDay()', () => {
    it('adds a day when not selected', () => {
      component['form'].patchValue({ frequencyDays: [] });
      component.toggleDay(1);
      expect(component['form'].get('frequencyDays')!.value).toContain(1);
    });

    it('removes a day when already selected', () => {
      component['form'].patchValue({ frequencyDays: [1, 3] });
      component.toggleDay(1);
      expect(component['form'].get('frequencyDays')!.value).not.toContain(1);
    });

    it('marks frequencyDays as touched', () => {
      component.toggleDay(2);
      expect(component['form'].get('frequencyDays')!.touched).toBeTrue();
    });
  });

  // ── edit mode pre-fill ────────────────────────────────────────────────────────

  describe('edit mode', () => {
    beforeEach(async () => {
      await setupComponent('h1', [SAMPLE_HABIT]);
    });

    it('pre-fills the name field with the existing habit name', () => {
      expect(component['form'].get('name')!.value).toBe(SAMPLE_HABIT.name);
    });

    it('pre-fills the icon', () => {
      expect(component['form'].get('icon')!.value).toBe(SAMPLE_HABIT.icon);
    });

    it('pre-fills the color', () => {
      expect(component['form'].get('color')!.value).toBe(SAMPLE_HABIT.color);
    });

    it('pre-fills the frequencyType', () => {
      expect(component['form'].get('frequencyType')!.value).toBe(SAMPLE_HABIT.frequencyType);
    });
  });
});
