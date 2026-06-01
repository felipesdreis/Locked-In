import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { HabitService, BadgeMilestone } from '../../core/services/habit.service';
import { HabitWithStreak } from '../../core/models/habit.model';
import { OnboardingTutorialComponent, ONBOARDING_DONE_KEY } from '../onboarding/onboarding-tutorial.component';
import { BadgeCelebrationModalComponent } from '../../shared/components/badge-celebration-modal/badge-celebration-modal.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourtMarkComponent } from '../../shared/components/court-mark/court-mark.component';
import { RingComponent } from '../../shared/components/ring/ring.component';
import { StreakComponent } from '../../shared/components/streak/streak.component';
import { PillComponent } from '../../shared/components/pill/pill.component';
import { HoopComponent } from '../../shared/components/hoop/hoop.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    NgFor,
    NgIf,
    IonContent,
    TopbarComponent,
    CourtMarkComponent,
    RingComponent,
    StreakComponent,
    PillComponent,
    HoopComponent,
    IconComponent,
    OnboardingTutorialComponent,
    BadgeCelebrationModalComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit, OnDestroy {
  readonly showOnboarding = signal(false);
  readonly activeBadge = signal<BadgeMilestone | null>(null);

  // Incomplete habits first, then sorted by streak descending within each group
  readonly habits = computed(() =>
    [...this.habitService.habitsWithStreak()].sort((a, b) => {
      if (a.completedToday !== b.completedToday) return a.completedToday ? 1 : -1;
      return b.currentStreak - a.currentStreak;
    })
  );

  readonly completedToday = computed(() =>
    this.habits().filter(h => h.completedToday).length
  );

  readonly totalHabits = computed(() => this.habits().length);

  readonly percentageToday = computed(() => {
    const total = this.totalHabits();
    const completed = this.completedToday();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  readonly bestStreak = computed(() => {
    const habits = this.habits();
    if (!habits.length) return 0;
    return Math.max(...habits.map(h => h.longestStreak));
  });

  readonly todayFormatted = computed(() => {
    const now = new Date();
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const day = days[now.getDay()];
    const date = now.getDate().toString().padStart(2, '0');
    const month = months[now.getMonth()];
    return `${day}, ${date} ${month}`;
  });

  constructor(private habitService: HabitService) {}

  async ngOnInit(): Promise<void> {
    await this.habitService.load();
    this.checkOnboarding();
    // Listen for help button from topbar
    window.addEventListener('app:open-help', this.onHelpEvent);
  }

  ngOnDestroy(): void {
    window.removeEventListener('app:open-help', this.onHelpEvent);
  }

  private readonly onHelpEvent = (): void => {
    this.openHowItWorks();
  };

  private checkOnboarding(): void {
    const completed = localStorage.getItem(ONBOARDING_DONE_KEY) === 'true';
    const hasHabits = this.habitService.habits().length > 0;
    if (!completed && !hasHabits) {
      this.showOnboarding.set(true);
    }
  }

  async toggleHabit(id: string): Promise<void> {
    const milestone = await this.habitService.toggleToday(id);
    if (milestone) {
      this.activeBadge.set(milestone);
    }
  }

  onBadgeClosed(): void {
    this.activeBadge.set(null);
  }

  openHowItWorks(): void {
    this.showOnboarding.set(true);
  }

  onOnboardingDismissed(): void {
    this.showOnboarding.set(false);
  }

  // Returns a stable display label for frequency type
  getFrequencyLabel(habit: HabitWithStreak): string {
    switch (habit.frequencyType) {
      case 'daily': return 'Todos os dias';
      case 'weekdays': return 'Seg a Sex';
      case 'weekends': return 'Fim de semana';
      case 'x_per_week': {
        const target = habit.frequencyDays[0] ?? 1;
        return `${target}x por semana`;
      }
      case 'custom': return 'Dias específicos';
      default: return '';
    }
  }
}
