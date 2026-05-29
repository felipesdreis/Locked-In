import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonButtons, IonBackButton, IonSelect, IonSelectOption,
  IonChip, IonText, IonNote,
} from '@ionic/angular/standalone';
import { HabitService } from '../../core/services/habit.service';
import { FrequencyType } from '../../core/models/habit.model';

const FREQUENCY_HINTS: Record<string, string> = {
  daily: 'Executado todos os dias sem exceção.',
  weekdays: 'Executado de segunda a sexta-feira.',
  weekends: 'Executado aos sábados e domingos.',
  custom: 'Escolha os dias específicos da semana.',
  x_per_week: 'Complete o número de vezes definido em qualquer dia da semana.',
};

const WEEK_DAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];

function atLeastOneDaySelected(control: AbstractControl): ValidationErrors | null {
  const days: number[] = control.value ?? [];
  return days.length > 0 ? null : { noDaySelected: true };
}

@Component({
  selector: 'app-habit-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonButtons, IonBackButton, IonSelect, IonSelectOption,
    IonChip, IonText, IonNote,
  ],
  templateUrl: './habit-form.page.html',
  styleUrl: './habit-form.page.scss',
})
export class HabitFormPage implements OnInit {
  form!: FormGroup;
  editId: string | null = null;

  readonly weekDays = WEEK_DAYS;
  readonly icons = ['💪', '📚', '🏃', '🧘', '💧', '🥗', '😴', '✍️', '🎯', '🎵'];
  readonly colors = ['#6c63ff', '#ff6584', '#43b89c', '#f9a825', '#e57373', '#42a5f5'];
  readonly frequencyOptions: { label: string; value: FrequencyType }[] = [
    { label: 'Todo dia', value: 'daily' },
    { label: 'Dias de semana', value: 'weekdays' },
    { label: 'Fins de semana', value: 'weekends' },
    { label: 'Dias específicos', value: 'custom' },
    { label: 'X vezes por semana', value: 'x_per_week' },
  ];

  constructor(
    private fb: FormBuilder,
    private habitService: HabitService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.editId = this.route.snapshot.paramMap.get('id');
    // Garante que os signals estão atualizados — necessário na edição via navegação direta
    await this.habitService.load();
    this.buildForm();
  }

  private buildForm(): void {
    const existing = this.editId
      ? this.habitService.habits().find(h => h.id === this.editId)
      : null;

    const initialType = existing?.frequencyType ?? 'daily';
    const initialXPerWeekCount = initialType === 'x_per_week'
      ? (existing?.frequencyDays[0] ?? 3)
      : 3;

    this.form = this.fb.group({
      name: [existing?.name ?? '', [Validators.required, Validators.maxLength(50)]],
      icon: [existing?.icon ?? '💪'],
      color: [existing?.color ?? '#6c63ff'],
      frequencyType: [initialType],
      frequencyDays: [existing?.frequencyDays ?? [], initialType === 'custom' ? atLeastOneDaySelected : []],
      xPerWeekCount: [initialXPerWeekCount, [Validators.min(1), Validators.max(7)]],
      reminderTime: [existing?.reminderTime ?? null],
    });

    this.form.get('frequencyType')!.valueChanges.subscribe(type => {
      const ctrl = this.form.get('frequencyDays')!;
      if (type === 'custom') {
        ctrl.setValidators(atLeastOneDaySelected);
      } else {
        ctrl.clearValidators();
      }
      ctrl.updateValueAndValidity();
    });
  }

  get isCustomFrequency(): boolean {
    return this.form.get('frequencyType')?.value === 'custom';
  }

  get isXPerWeek(): boolean {
    return this.form.get('frequencyType')?.value === 'x_per_week';
  }

  get frequencyHint(): string {
    const type: string = this.form.get('frequencyType')?.value ?? 'daily';
    return FREQUENCY_HINTS[type] ?? '';
  }

  get nameControl() {
    return this.form.get('name')!;
  }

  isDaySelected(day: number): boolean {
    const days: number[] = this.form.get('frequencyDays')?.value ?? [];
    return days.includes(day);
  }

  toggleDay(day: number): void {
    const current: number[] = this.form.get('frequencyDays')?.value ?? [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b);
    this.form.patchValue({ frequencyDays: updated });
    this.form.get('frequencyDays')?.markAsTouched();
  }

  onFrequencyChange(event: CustomEvent): void {
    this.form.patchValue({ frequencyType: event.detail.value });
  }

  get isFormValid(): boolean {
    if (this.form.get('name')?.invalid) return false;
    if (this.isCustomFrequency && this.form.get('frequencyDays')?.invalid) return false;
    return true;
  }

  async save(): Promise<void> {
    if (!this.isFormValid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    const frequencyDays = this.isCustomFrequency
      ? (value.frequencyDays as number[])
      : this.isXPerWeek
        ? [value.xPerWeekCount as number]
        : [];
    const payload = {
      name: value.name,
      icon: value.icon,
      color: value.color,
      frequencyType: value.frequencyType as FrequencyType,
      frequencyDays,
      reminderTime: value.reminderTime || null,
    };

    if (this.editId) {
      await this.habitService.update(this.editId, payload);
    } else {
      await this.habitService.create(payload);
    }
    await this.router.navigateByUrl('/home');
  }
}
