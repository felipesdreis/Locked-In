import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonItem, IonLabel, IonButton, IonIcon, IonNote, IonProgressBar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, ellipseOutline } from 'ionicons/icons';
import { trigger, transition, style, animate } from '@angular/animations';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { HabitWithStreak } from '../../../core/models/habit.model';

const FLASH_DURATION_MS = 500;

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [RouterLink, IonItem, IonLabel, IonButton, IonIcon, IonNote, IonProgressBar],
  templateUrl: './habit-card.component.html',
  styleUrl: './habit-card.component.scss',
  animations: [
    trigger('completionIcon', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class HabitCardComponent {
  @Input({ required: true }) habit!: HabitWithStreak;
  @Output() toggle = new EventEmitter<void>();

  readonly isFlashing = signal(false);

  constructor() {
    addIcons({ checkmarkCircle, ellipseOutline });
  }

  get isXPerWeek(): boolean {
    return this.habit.frequencyType === 'x_per_week';
  }

  get weeklyProgressRatio(): number {
    const p = this.habit.weeklyProgress;
    if (!p || p.target === 0) return 0;
    return Math.min(p.done / p.target, 1);
  }

  get weeklyGoalReached(): boolean {
    const p = this.habit.weeklyProgress;
    return !!p && p.done >= p.target;
  }

  get weeklyProgressLabel(): string {
    const p = this.habit.weeklyProgress;
    if (!p) return '';
    return `${p.done}/${p.target} esta semana`;
  }

  get streakLabel(): string {
    return `${this.habit.currentStreak} 🔥 streak`;
  }

  async onToggle(event: Event): Promise<void> {
    event.stopPropagation();
    this.flashCard();   // immediate visual feedback — before async haptic
    this.toggle.emit();
    await this.triggerHaptic();
  }

  private async triggerHaptic(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics não disponível no browser — silencia sem propagar
    }
  }

  private flashCard(): void {
    this.isFlashing.set(true);
    setTimeout(() => this.isFlashing.set(false), FLASH_DURATION_MS);
  }
}
