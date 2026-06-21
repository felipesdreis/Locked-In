import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, AlertController } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { HabitService, BadgeMilestone } from '../../core/services/habit.service';
import { NotificationService } from '../../core/services/notification.service';
import { HabitWithStreak } from '../../core/models/habit.model';
import { toDateString, subtractDays } from '../../core/utils/date.util';
import { OnboardingTutorialComponent, ONBOARDING_DONE_KEY } from '../onboarding/onboarding-tutorial.component';
import { BadgeCelebrationModalComponent } from '../../shared/components/badge-celebration-modal/badge-celebration-modal.component';
import { DailyCelebrationModalComponent } from '../../shared/components/daily-celebration-modal/daily-celebration-modal.component';
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
    DailyCelebrationModalComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit, OnDestroy {
  readonly showOnboarding = signal(false);
  readonly activeBadge = signal<BadgeMilestone | null>(null);
  readonly showCelebration = signal(false);
  readonly viewingYesterday = signal(false);
  private activeAlert?: HTMLIonAlertElement;

  // Incomplete habits first, then sorted by streak descending within each group
  readonly habits = computed(() =>
    [...this.habitService.habitsWithStreak()].sort((a, b) => {
      if (a.completedToday !== b.completedToday) return a.completedToday ? 1 : -1;
      return b.currentStreak - a.currentStreak;
    })
  );

  // Only habits scheduled for today count toward the daily completion rate.
  // Habits set to "specific days" (custom) that don't include today are excluded.
  private readonly habitsScheduledToday = computed(() => {
    const today = new Date();
    return this.habits().filter(h => this.habitService.isScheduledForDay(h, today));
  });

  readonly completedToday = computed(() =>
    this.habitsScheduledToday().filter(h => h.completedToday).length
  );

  readonly totalHabits = computed(() => this.habitsScheduledToday().length);

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

  private readonly yesterday = computed(() => subtractDays(new Date(), 1));
  private readonly yesterdayStr = computed(() => toDateString(this.yesterday()));

  readonly yesterdayFormatted = computed(() => {
    const d = this.yesterday();
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;
  });

  // Yesterday's habits with completedToday reflecting yesterday's status (reuses HabitWithStreak shape).
  private readonly habitsForYesterday = computed<HabitWithStreak[]>(() => {
    const allCompletions = this.habitService.allCompletions();
    const yStr = this.yesterdayStr();
    return this.habitService.habitsWithStreak()
      .filter(h => this.habitService.isScheduledForDay(h, this.yesterday()))
      .map(h => ({ ...h, completedToday: allCompletions.some(c => c.habitId === h.id && c.completedAt === yStr) }))
      .sort((a, b) => {
        if (a.completedToday !== b.completedToday) return a.completedToday ? 1 : -1;
        return b.currentStreak - a.currentStreak;
      });
  });

  private readonly completedYesterday = computed(() =>
    this.habitsForYesterday().filter(h => h.completedToday).length
  );
  private readonly totalYesterday = computed(() => this.habitsForYesterday().length);

  readonly displayHabits = computed(() =>
    this.viewingYesterday() ? this.habitsForYesterday() : this.habits()
  );
  readonly displayCompleted = computed(() =>
    this.viewingYesterday() ? this.completedYesterday() : this.completedToday()
  );
  readonly displayTotal = computed(() =>
    this.viewingYesterday() ? this.totalYesterday() : this.totalHabits()
  );
  readonly displayPercentage = computed(() => {
    const total = this.displayTotal();
    return total > 0 ? Math.round((this.displayCompleted() / total) * 100) : 0;
  });
  readonly displayDateLabel = computed(() =>
    this.viewingYesterday() ? this.yesterdayFormatted() : this.todayFormatted()
  );
  readonly displayLockedLabel = computed(() =>
    this.viewingYesterday() ? 'LOCKED IN ONTEM' : 'LOCKED IN HOJE'
  );

  constructor(
    private habitService: HabitService,
    private alertCtrl: AlertController,
    private notificationService: NotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.habitService.load();
    this.checkOnboarding();
    // Listen for help button from topbar
    window.addEventListener('app:open-help', this.onHelpEvent);
  }

  // Reset yesterday mode when user navigates back to this page
  ionViewWillEnter(): void {
    this.viewingYesterday.set(false);
  }

  ngOnDestroy(): void {
    window.removeEventListener('app:open-help', this.onHelpEvent);
    this.activeAlert?.dismiss();
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

  async onToggle(habitId: string): Promise<void> {
    if (this.viewingYesterday()) {
      await this.habitService.toggleDay(habitId, this.yesterday());
    } else {
      await this.toggleHabit(habitId);
    }
  }

  private async toggleHabit(id: string): Promise<void> {
    const milestone = await this.habitService.toggleToday(id);
    if (milestone) {
      this.activeBadge.set(milestone);
    }
    const total = this.totalHabits();
    if (total > 0 && this.completedToday() === total) {
      this.showCelebration.set(true);
      if (localStorage.getItem('daily_reminder_enabled') === 'true') {
        localStorage.setItem('daily_reminder_suppressed_date', toDateString(new Date()));
        await this.notificationService.cancelDailyReminder();
      }
    }
  }

  async enterYesterdayMode(): Promise<void> {
    this.activeAlert = await this.alertCtrl.create({
      header: 'Marcar hábitos de ontem',
      message: 'Você está corrigindo hábitos do dia anterior. Certifique-se de que não há erros na contagem.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Continuar', handler: () => this.viewingYesterday.set(true) },
      ],
    });
    await this.activeAlert.present();
  }

  exitYesterdayMode(): void {
    this.viewingYesterday.set(false);
  }

  onBadgeClosed(): void {
    this.activeBadge.set(null);
  }

  onCelebrationClosed(): void {
    this.showCelebration.set(false);
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
