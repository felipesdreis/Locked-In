import { Component, OnInit, computed, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline, chevronBackOutline, chevronForwardOutline, shareOutline } from 'ionicons/icons';
import { HabitService } from '../../core/services/habit.service';
import { HabitWithStreak, Completion, Habit } from '../../core/models/habit.model';
import { toDateString, subtractDays } from '../../core/utils/date.util';
import { SharePreviewModalComponent } from '../../shared/components/share-preview-modal/share-preview-modal.component';

const SHARE_MIN_STREAK = 7;

@Component({
  selector: 'app-habit-detail',
  standalone: true,
  imports: [
    RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonGrid, IonRow, IonCol,
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

  // Period navigation: offset 0 = most recent 30 days, 1 = prev 30 days, etc.
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

  readonly canShare = computed(() => {
    const h = this.habit();
    return !!h && h.currentStreak >= SHARE_MIN_STREAK;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private habitService: HabitService,
    private alert: AlertController,
  ) {
    addIcons({ createOutline, trashOutline, chevronBackOutline, chevronForwardOutline, shareOutline });
  }

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

  private isScheduledDay(habit: Habit, date: Date): boolean {
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

  openShareModal(): void {
    this.showShareModal.set(true);
  }

  onShareClosed(): void {
    this.showShareModal.set(false);
  }

  private async archive(): Promise<void> {
    await this.habitService.archive(this.habitId());
    await this.router.navigateByUrl('/home');
  }
}
