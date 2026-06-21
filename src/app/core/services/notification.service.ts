import { inject, Injectable, InjectionToken } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FrequencyType } from '../models/habit.model';

interface ScheduleOptions {
  id: string;
  name: string;
  reminderTime: string; // HH:MM
  frequencyType: FrequencyType;
  frequencyDays: number[]; // 0=Sun..6=Sat for custom; irrelevant for non-custom
}

// Injection token so tests can substitute a mock without touching native bridge
export const LOCAL_NOTIFICATIONS = new InjectionToken('LocalNotifications', {
  providedIn: 'root',
  factory: () => LocalNotifications,
});

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly plugin = inject(LOCAL_NOTIFICATIONS);
  private _permissionGranted: boolean | null = null;

  async requestPermission(): Promise<boolean> {
    const { display } = await this.plugin.checkPermissions();
    if (display === 'granted') {
      this._permissionGranted = true;
      return true;
    }
    if (display === 'denied') {
      this._permissionGranted = false;
      return false;
    }
    // 'prompt' or 'prompt-with-rationale' — show the system dialog once
    const result = await this.plugin.requestPermissions();
    this._permissionGranted = result.display === 'granted';
    return this._permissionGranted;
  }

  async schedule({ id, name, reminderTime, frequencyType, frequencyDays }: ScheduleOptions): Promise<void> {
    const granted = await this.requestPermission();
    if (!granted) return;

    const [hours, minutes] = reminderTime.split(':').map(Number);
    const baseId = this.toNumericId(id);
    const jsDays = this.resolveJsDays(frequencyType, frequencyDays);

    if (jsDays === null) {
      // daily or x_per_week — one notification, no weekday restriction
      await this.plugin.schedule({
        notifications: [{
          id: baseId,
          title: 'Locked In',
          body: `Hora de completar: ${name}`,
          schedule: { on: { hour: hours, minute: minutes }, allowWhileIdle: true },
          channelId: 'reminders',
        }],
      });
    } else {
      // One notification per selected weekday with a stable derived ID.
      // Plugin weekday: 1=Sun, 2=Mon, ..., 7=Sat (JS getDay() is 0=Sun..6=Sat).
      const notifications = jsDays.map(jsDay => ({
        id: this.weekdayId(baseId, jsDay),
        title: 'Locked In',
        body: `Hora de completar: ${name}`,
        schedule: {
          on: { hour: hours, minute: minutes, weekday: jsDay === 0 ? 1 : jsDay + 1 },
          allowWhileIdle: true,
        },
        channelId: 'reminders',
      }));
      await this.plugin.schedule({ notifications });
    }
  }

  // Cancels the base ID plus all 7 possible weekday-derived IDs.
  // Canceling non-existent IDs is a no-op in the plugin.
  async cancel(habitId: string): Promise<void> {
    const baseId = this.toNumericId(habitId);
    const ids = [
      { id: baseId },
      ...Array.from({ length: 7 }, (_, jsDay) => ({ id: this.weekdayId(baseId, jsDay) })),
    ];
    await this.plugin.cancel({ notifications: ids });
  }

  // Fixed ID for the global daily check-in reminder.
  // -1 is used because Math.abs(djb2) always returns ≥ 0, so -1 can never collide with habit IDs.
  private readonly DAILY_ID = -1;

  // Returns true if the notification was successfully scheduled, false if permission was denied.
  async scheduleDailyReminder(time: string): Promise<boolean> {
    const granted = await this.requestPermission();
    if (!granted) return false;
    const [hours, minutes] = time.split(':').map(Number);
    await this.plugin.cancel({ notifications: [{ id: this.DAILY_ID }] });
    await this.plugin.schedule({
      notifications: [{
        id: this.DAILY_ID,
        title: 'Locked In',
        body: 'Já completou os hábitos de Hoje?',
        schedule: { on: { hour: hours, minute: minutes }, allowWhileIdle: true },
        channelId: 'reminders',
      }],
    });
    return true;
  }

  async cancelDailyReminder(): Promise<void> {
    await this.plugin.cancel({ notifications: [{ id: this.DAILY_ID }] });
  }

  async createChannel(): Promise<void> {
    await this.plugin.createChannel({
      id: 'reminders',
      name: 'Lembretes de hábitos',
      importance: 4,
      sound: 'default',
      vibration: true,
    });
  }

  // Returns null for frequencies with no weekday restriction (fire every day).
  // Returns JS day numbers (0=Sun..6=Sat) for frequencies with specific days.
  private resolveJsDays(frequencyType: FrequencyType, frequencyDays: number[]): number[] | null {
    switch (frequencyType) {
      case 'daily':      return null;
      case 'x_per_week': return null;
      case 'weekdays':   return [1, 2, 3, 4, 5];
      case 'weekends':   return [0, 6];
      case 'custom':     return frequencyDays;
      default:           return null;
    }
  }

  // Stable weekday-scoped ID: base + 10 + jsDay (0–6).
  private weekdayId(baseId: number, jsDay: number): number {
    return (baseId + 10 + jsDay) | 0;
  }

  // UUID → stable 32-bit int for LocalNotifications integer ID requirement (djb2 hash)
  private toNumericId(uuid: string): number {
    return Math.abs(uuid.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0));
  }
}
