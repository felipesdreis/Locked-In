import { inject, Injectable, InjectionToken } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

interface ScheduleOptions {
  id: string;
  name: string;
  reminderTime: string; // HH:MM
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

  async schedule({ id, name, reminderTime }: ScheduleOptions): Promise<void> {
    const granted = await this.requestPermission();
    if (!granted) return;

    const [hours, minutes] = reminderTime.split(':').map(Number);
    const notifId = this.toNumericId(id);
    await this.plugin.schedule({
      notifications: [{
        id: notifId,
        title: 'Locked In',
        body: `Hora de completar: ${name}`,
        schedule: { on: { hour: hours, minute: minutes }, allowWhileIdle: true },
        channelId: 'reminders',
      }],
    });
  }

  async cancel(habitId: string): Promise<void> {
    const id = this.toNumericId(habitId);
    await this.plugin.cancel({ notifications: [{ id }] });
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

  // UUID → stable 32-bit int for LocalNotifications integer ID requirement (djb2 hash)
  private toNumericId(uuid: string): number {
    return Math.abs(uuid.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0));
  }
}
