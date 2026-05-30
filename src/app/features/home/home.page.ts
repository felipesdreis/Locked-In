import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton,
  IonIcon, IonList, IonButton, IonButtons, IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, statsChart, archiveOutline, helpCircleOutline, settingsOutline } from 'ionicons/icons';
import { HabitService, BadgeMilestone } from '../../core/services/habit.service';
import { HabitCardComponent } from '../../shared/components/habit-card/habit-card.component';
import { OnboardingTutorialComponent, ONBOARDING_DONE_KEY } from '../onboarding/onboarding-tutorial.component';
import { BadgeCelebrationModalComponent } from '../../shared/components/badge-celebration-modal/badge-celebration-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton,
    IonIcon, IonList, IonButton, IonButtons, IonText,
    HabitCardComponent,
    OnboardingTutorialComponent,
    BadgeCelebrationModalComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  readonly showOnboarding = signal(false);
  readonly activeBadge = signal<BadgeMilestone | null>(null);

  // Incomplete habits first, then sorted by streak descending within each group
  readonly habits = computed(() =>
    [...this.habitService.habitsWithStreak()].sort((a, b) => {
      if (a.completedToday !== b.completedToday) return a.completedToday ? 1 : -1;
      return b.currentStreak - a.currentStreak;
    })
  );

  constructor(private habitService: HabitService) {
    addIcons({ add, statsChart, archiveOutline, helpCircleOutline, settingsOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.habitService.load();
    this.checkOnboarding();
  }

  private checkOnboarding(): void {
    const completed = localStorage.getItem(ONBOARDING_DONE_KEY) === 'true';
    const hasHabits = this.habitService.habits().length > 0;
    // Show tutorial for new users: no habits AND onboarding not completed
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
}
