import { Component, inject, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Platform, NavController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { NotificationService } from './core/services/notification.service';
import { toDateString } from './core/utils/date.util';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet /></ion-app>`,
})
export class AppComponent implements OnInit {
  private readonly notifications = inject(NotificationService);
  private readonly platform = inject(Platform);
  private readonly navController = inject(NavController);
  private readonly location = inject(Location);

  ngOnInit(): void {
    this.initDarkMode();

    // Android 8+ requires a notification channel to exist before scheduling.
    // Safe to call on every init — createChannel is idempotent.
    if (Capacitor.getPlatform() === 'android') {
      this.notifications.createChannel();
    }

    // Platform must be ready before back button events fire on native.
    this.platform.ready().then(() => {
      this.registerBackButton();
      this.rescheduleReminderIfNeeded();
      App.addListener('resume', () => this.rescheduleReminderIfNeeded());
    });
  }

  // Priority 10 is below Ionic overlays (modals, alerts use higher priorities),
  // so this handler only fires when no overlay is consuming the event.
  private registerBackButton(): void {
    this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.location.path() === '/home' || this.location.path() === '') {
        App.exitApp();
      } else {
        this.navController.back();
      }
    });
  }

  private async rescheduleReminderIfNeeded(): Promise<void> {
    try {
      if (localStorage.getItem('daily_reminder_enabled') !== 'true') return;
      const suppressed = localStorage.getItem('daily_reminder_suppressed_date');
      if (suppressed === toDateString(new Date())) return;
      const time = localStorage.getItem('daily_reminder_time') ?? '21:00';
      await this.notifications.scheduleDailyReminder(time);
    } catch (e) {
      console.error('[AppComponent] rescheduleReminderIfNeeded failed', e);
    }
  }

  private initDarkMode(): void {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = stored === 'dark' || (stored === null && prefersDark.matches);
    document.body.classList.toggle('dark', isDark);

    // Follow system changes only when the user hasn't set a manual override.
    prefersDark.addEventListener('change', (e: MediaQueryListEvent) => {
      if (localStorage.getItem('theme') === null) {
        document.body.classList.toggle('dark', e.matches);
      }
    });
  }
}
