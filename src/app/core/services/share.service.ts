import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Habit } from '../models/habit.model';
import { formatDateBR } from '../utils/date.util';

const IMAGE_SIZE = 1080;

@Injectable({ providedIn: 'root' })
export class ShareService {
  async generateStreakImage(habit: Habit, streakDays: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_SIZE;
    canvas.height = IMAGE_SIZE;
    const ctx = canvas.getContext('2d')!;

    this.drawBackground(ctx, habit.color);
    this.drawContent(ctx, habit, streakDays);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      }, 'image/png');
    });
  }

  async share(blob: Blob, habitId: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.shareNative(blob, habitId);
    } else {
      this.downloadBrowser(blob, habitId);
    }
  }

  private async shareNative(blob: Blob, habitId: string): Promise<void> {
    const base64 = await this.blobToBase64(blob);
    const fileName = `locked-in-${habitId}.png`;

    await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });

    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });

    await Share.share({
      title: 'Minha sequência no Locked In 🔥',
      files: [uri],
    });

    await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {/* ignore */});
  }

  private downloadBrowser(blob: Blob, habitId: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `locked-in-${habitId}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip "data:image/png;base64," prefix
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private drawBackground(ctx: CanvasRenderingContext2D, habitColor: string): void {
    // Gradient from habit color to a darker shade
    const gradient = ctx.createLinearGradient(0, 0, 0, IMAGE_SIZE);
    gradient.addColorStop(0, habitColor);
    gradient.addColorStop(1, this.darkenColor(habitColor, 0.3));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);

    // Subtle diagonal texture overlay
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < IMAGE_SIZE; y += 40) {
      ctx.fillRect(0, y, IMAGE_SIZE, 1);
    }
  }

  private drawContent(ctx: CanvasRenderingContext2D, habit: Habit, streakDays: number): void {
    const cx = IMAGE_SIZE / 2;

    // Habit icon (large)
    ctx.font = '150px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(habit.icon, cx, 280);

    // Habit name
    const name = habit.name.length > 20 ? habit.name.slice(0, 20) + '…' : habit.name;
    ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(name, cx, 460);

    // Streak count (highlight)
    ctx.font = 'bold 110px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${streakDays} dias de streak 🔥`, cx, 620);

    // Today's date in PT-BR
    ctx.font = '48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(formatDateBR(new Date()), cx, 760);

    // App signature
    ctx.font = '36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Locked In — 100% privado, sem conta', cx, 950);
  }

  private darkenColor(hex: string, amount: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const factor = 1 - amount;
    const dr = Math.round(r * factor);
    const dg = Math.round(g * factor);
    const db = Math.round(b * factor);
    return `rgb(${dr},${dg},${db})`;
  }
}
