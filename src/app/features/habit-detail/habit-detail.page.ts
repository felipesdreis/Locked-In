import { Component, OnInit, computed, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, AlertController } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { HabitService } from '../../core/services/habit.service';
import { HabitWithStreak, Completion } from '../../core/models/habit.model';
import { toDateString, subtractDays } from '../../core/utils/date.util';
import { SharePreviewModalComponent } from '../../shared/components/share-preview-modal/share-preview-modal.component';
import { ShareDay } from '../../core/services/share.service';
import { ScreenHeaderComponent } from '../../shared/components/screen-header/screen-header.component';
import { CourtMarkComponent } from '../../shared/components/court-mark/court-mark.component';
import { StreakComponent } from '../../shared/components/streak/streak.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-habit-detail',
  standalone: true,
  imports: [
    RouterLink,
    NgFor,
    NgIf,
    IonContent,
    ScreenHeaderComponent,
    CourtMarkComponent,
    StreakComponent,
    IconComponent,
    SharePreviewModalComponent,
  ],
  templateUrl: './habit-detail.page.html',
  styleUrl: './habit-detail.page.scss',
})
export class HabitDetailPage implements OnInit, OnDestroy {
  private activeAlert?: HTMLIonAlertElement;
  habitId = signal<string>('');
  readonly showShareModal = signal(false);

  habit = computed<HabitWithStreak | undefined>(() =>
    this.habitService.habitsWithStreak().find(h => h.id === this.habitId()),
  );

  completedDates = computed<Set<string>>(() => {
    const completions: Completion[] = this.habitService.getCompletionsFor(this.habitId());
    return new Set(completions.map(c => c.completedAt));
  });

  // Calendar month navigation
  currentMonth = signal(new Date());

  readonly calendarDays = computed(() => {
    const date = this.currentMonth();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Prefix days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    // Fill remaining cells to complete 6 rows (42 cells)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }

    return days;
  });

  readonly monthLabel = computed(() => {
    const date = this.currentMonth();
    const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
                    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  });

  readonly todayString = computed(() => toDateString(new Date()));

  // Period navigation for the rolling 30-day view (kept from original)
  periodOffset = signal(0);

  readonly periodDays = computed<Date[]>(() => {
    const offset = this.periodOffset();
    const endDaysBack = offset * 30;
    return Array.from({ length: 30 }, (_, i) =>
      subtractDays(new Date(), endDaysBack + 29 - i),
    );
  });

  readonly periodLabel = computed(() => {
    const days = this.periodDays();
    if (!days.length) return '';
    const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `${fmt(days[0])} – ${fmt(days[days.length - 1])}`;
  });

  readonly canGoForward = computed(() => this.periodOffset() > 0);

  readonly completionRate = computed(() => {
    const h = this.habit();
    if (!h) return 0;
    const days = this.periodDays();
    const scheduled = days.filter(d => this.isScheduledDay(h, d)).length;
    if (!scheduled) return 0;
    const completedSet = this.completedDates();
    const completed = days.filter(d => completedSet.has(toDateString(d))).length;
    return Math.round((completed / scheduled) * 100);
  });

  readonly canShare = computed(() => !!this.habit());

  // PT-BR single-letter day labels: Sun=D, Mon=S, Tue=T, Wed=Q, Thu=Q, Fri=S, Sat=S
  private readonly DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  readonly last7Days = computed<ShareDay[]>(() => {
    const completedSet = this.completedDates();
    return Array.from({ length: 7 }, (_, i) => {
      const date = subtractDays(new Date(), 6 - i);
      return {
        label: this.DAY_LABELS[date.getDay()],
        completed: completedSet.has(toDateString(date)),
      };
    });
  });

  readonly habitTitle = computed(() => this.habit()?.name ?? 'DETALHE');

  readonly weekDayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private habitService: HabitService,
    private alert: AlertController,
  ) {}

  async ngOnInit(): Promise<void> {
    this.habitId.set(this.route.snapshot.paramMap.get('id') ?? '');
    await this.habitService.load();
  }

  ngOnDestroy(): void {
    this.activeAlert?.dismiss();
  }

  isCompleted(date: Date): boolean {
    return this.completedDates().has(toDateString(date));
  }

  isToday(date: Date): boolean {
    return toDateString(date) === this.todayString();
  }

  isFuture(date: Date): boolean {
    return date > new Date();
  }

  async toggleToday(): Promise<void> {
    await this.habitService.toggleToday(this.habitId());
  }

  previousMonth(): void {
    const d = this.currentMonth();
    this.currentMonth.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.currentMonth();
    this.currentMonth.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  shiftPeriod(direction: number): void {
    this.periodOffset.update(o => Math.max(0, o + direction));
  }

  async confirmArchive(): Promise<void> {
    this.activeAlert = await this.alert.create({
      header: 'Arquivar hábito',
      message: 'Tem certeza? O histórico será mantido.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Arquivar', role: 'destructive', handler: () => this.archive() },
      ],
    });
    await this.activeAlert.present();
  }

  openShareModal(): void {
    this.showShareModal.set(true);
  }

  onShareClosed(): void {
    this.showShareModal.set(false);
  }

  private isScheduledDay(habit: { frequencyType: string; frequencyDays: number[] }, date: Date): boolean {
    const dow = date.getDay();
    switch (habit.frequencyType) {
      case 'daily': return true;
      case 'weekdays': return dow >= 1 && dow <= 5;
      case 'weekends': return dow === 0 || dow === 6;
      case 'custom': return habit.frequencyDays.includes(dow);
      case 'x_per_week': return true;
      default: return false;
    }
  }

  private async archive(): Promise<void> {
    await this.habitService.archive(this.habitId());
    await this.router.navigateByUrl('/home');
  }
}
