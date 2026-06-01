import { Component, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { NgIf } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { DbService } from '../../core/services/db.service';
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

  constructor(private db: DbService) {}

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
        this.downloadBrowser(blob, fileName);
      }
    } catch (e) {
      console.error('[SettingsPage] exportData failed', e);
    } finally {
      this.exporting.set(false);
    }
  }

  private async shareNativeJson(blob: Blob, fileName: string): Promise<void> {
    const base64 = await this.blobToBase64(blob);
    await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await Share.share({ title: 'Backup Locked In', text: 'Seus dados de hábitos', files: [uri] });
    await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {/* ignore */});
  }

  private downloadBrowser(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  openLink(url: string): void {
    window.open(url, '_blank', 'noopener');
  }

  openFeedback(): void {
    window.open('mailto:felipereis755@gmail.com?subject=Feedback%20Locked%20In', '_system');
  }
}
