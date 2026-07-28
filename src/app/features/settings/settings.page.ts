import { Component, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { NgIf } from '@angular/common';
import { IonContent, IonToggle, AlertController } from '@ionic/angular/standalone';
import { DbService } from '../../core/services/db.service';
import { NotificationService, REMINDER_ENABLED_KEY, REMINDER_TIME_KEY, REMINDER_SUPPRESSED_KEY } from '../../core/services/notification.service';
import { blobToBase64, downloadBrowser } from '../../core/services/share.service';
import { ScreenHeaderComponent } from '../../shared/components/screen-header/screen-header.component';
import { CourtMarkComponent } from '../../shared/components/court-mark/court-mark.component';
import { WordmarkComponent } from '../../shared/components/wordmark/wordmark.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    NgIf,
    IonContent,
    IonToggle,
    ScreenHeaderComponent,
    CourtMarkComponent,
    WordmarkComponent,
    IconComponent,
  ],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  readonly exporting = signal(false);
  readonly appVersion = '3.0.0';
  readonly dailyReminderEnabled = signal(false);
  readonly dailyReminderTime = signal('21:00');

  constructor(
    private db: DbService,
    private notifications: NotificationService,
    private alert: AlertController,
  ) {
    this.dailyReminderEnabled.set(localStorage.getItem(REMINDER_ENABLED_KEY) === 'true');
    this.dailyReminderTime.set(localStorage.getItem(REMINDER_TIME_KEY) ?? '21:00');
  }

  async onReminderToggle(event: Event): Promise<void> {
    const enabled = (event as CustomEvent).detail.checked as boolean;
    if (enabled) {
      const ok = await this.notifications.scheduleDailyReminder(this.dailyReminderTime());
      if (!ok) {
        // Revert toggle — permission was denied
        this.dailyReminderEnabled.set(false);
        localStorage.setItem(REMINDER_ENABLED_KEY, 'false');
        const dialog = await this.alert.create({
          header: 'Permissão necessária',
          message: 'Ative as notificações do Locked In nas configurações do dispositivo para usar lembretes.',
          buttons: [{ text: 'OK', role: 'cancel' }],
        });
        await dialog.present();
        return;
      }
      this.dailyReminderEnabled.set(true);
      localStorage.setItem(REMINDER_ENABLED_KEY, 'true');
    } else {
      this.dailyReminderEnabled.set(false);
      localStorage.setItem(REMINDER_ENABLED_KEY, 'false');
      localStorage.removeItem(REMINDER_SUPPRESSED_KEY);
      await this.notifications.cancelDailyReminder();
    }
  }

  async onReminderTimeChange(event: Event): Promise<void> {
    const time = (event.target as HTMLInputElement).value;
    if (!time) return;
    this.dailyReminderTime.set(time);
    localStorage.setItem(REMINDER_TIME_KEY, time);
    localStorage.removeItem(REMINDER_SUPPRESSED_KEY);
    if (this.dailyReminderEnabled()) {
      await this.notifications.scheduleDailyReminder(time);
    }
  }

  async exportData(): Promise<void> {
    if (this.exporting()) return;
    this.exporting.set(true);
    try {
      const blob = await this.db.exportAsJSON();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `locked-in-backup-${timestamp}.json`;

      if (Capacitor.isNativePlatform()) {
        await this.shareNativeJson(blob, fileName);
      } else {
        downloadBrowser(blob, fileName);
      }
    } catch (e) {
      console.error('[SettingsPage] exportData failed', e);
    } finally {
      this.exporting.set(false);
    }
  }

  private async shareNativeJson(blob: Blob, fileName: string): Promise<void> {
    const base64 = await blobToBase64(blob);
    await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await Share.share({ title: 'Backup Locked In', text: 'Seus dados de hábitos', files: [uri] });
    await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {/* ignore */});
  }

  openLink(url: string): void {
    window.open(url, '_blank', 'noopener');
  }
}
