import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { HabitWithStreak } from '../models/habit.model';

const W = 1080;
const H = 1920;
const BG = '#121212';
const ASPHALT = '#1E1E1E';
const ACCENT = '#D84315';
const WHITE = '#F5F5F5';
const MUTED = 'rgba(245,245,245,0.55)';
const FAINT = 'rgba(245,245,245,0.22)';
const COURT_COLOR = 'rgba(255,255,255,0.045)';
const BAR_OFF = '#3D1206';

const ICON_PATHS: Record<string, string> = {
  fire: 'M12 3c.8 2.8-.6 4.4-2 6-1.3 1.5-2.5 3-2.5 5.2A6.5 6.5 0 0 0 18.5 14c0-2.2-1-3.6-2-5-.4 1-1 1.6-2 2 .8-2.6 0-5.6-2.5-8z',
  dumbbell: 'M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12',
  book: 'M12 6c-1.6-1.2-4-1.8-6.5-1.8C4.6 4.2 4 4.8 4 5.6v11.6c0 .8.7 1.2 1.5 1C7.8 17.7 10.4 18 12 19c1.6-1 4.2-1.3 6.5-.8.8.2 1.5-.2 1.5-1V5.6c0-.8-.6-1.4-1.5-1.4C16 4.2 13.6 4.8 12 6zM12 6v13',
  run: 'M13 9l-3 2 2 3-1 5M12 11l4 1 2 3M10 12l-3 1-1 3',
  water: 'M12 3s6 6.4 6 10.5A6 6 0 1 1 6 13.5C6 9.4 12 3 12 3z',
  music: 'M9 18V6l10-2v12',
  target: 'M12 4a8 8 0 1 0 0 16A8 8 0 0 0 12 4zM12 7.5a4.5 4.5 0 1 0 0 9A4.5 4.5 0 0 0 12 7.5z',
  write: 'M4 20l4-1L19 8a2 2 0 0 0-3-3L5 16l-1 4z',
  meditate: 'M12 8.5c-1.5 2.2-3 3.5-5.5 4.2M12 8.5c1.5 2.2 3 3.5 5.5 4.2M5 18.5c2-2.2 4.4-3.2 7-3.2s5 1 7 3.2',
  sleep: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  pill: 'M3.5 12l5-8.7a3.5 3.5 0 1 1 6.1 3.4L9.8 15M14 12l5 8.7',
  hoop: 'M5 6h14M6 6l1.5 5h9L18 6M8 11l-1 5M16 11l1 5M7 16h10',
};

export interface ShareDay {
  label: string;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class ShareService {
  async generateShareImage(
    habit: HabitWithStreak,
    completionRate: number,
    last7Days: ShareDay[],
  ): Promise<Blob> {
    await document.fonts.load('500px "Bebas Neue"').catch(() => {});

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    this.drawBg(ctx);
    this.drawCourt(ctx);
    this.drawLogo(ctx);
    this.drawHabitPill(ctx, habit);
    this.drawLockedInLabel(ctx);
    this.drawPercentage(ctx, completionRate);
    this.drawConsistencyLabel(ctx);
    this.drawStats(ctx, habit.currentStreak, habit.totalCompletions);
    this.drawBarChart(ctx, last7Days);
    this.drawFooter(ctx);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob null'))), 'image/png');
    });
  }

  async share(blob: Blob, habitId: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.shareNative(blob, habitId);
    } else {
      this.downloadBrowser(blob, habitId);
    }
  }

  private drawBg(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
  }

  private drawCourt(ctx: CanvasRenderingContext2D): void {
    const cx = W / 2;
    const cy = 640;
    ctx.save();
    ctx.strokeStyle = COURT_COLOR;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 62, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy + 90, 400, Math.PI, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(cx - 170, cy - 60, 340, 360);
    ctx.stroke();

    ctx.restore();
  }

  private drawLogo(ctx: CanvasRenderingContext2D): void {
    const fontSize = 54;
    const spacing = 5;
    ctx.font = `${fontSize}px "Bebas Neue", sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    const text = 'LOCKED IN';
    let totalW = 0;
    for (const ch of text) totalW += ctx.measureText(ch).width + spacing;
    totalW -= spacing;

    let x = (W - totalW) / 2;
    const y = 104;

    for (const ch of text) {
      ctx.fillStyle = ch === 'O' ? ACCENT : WHITE;
      ctx.fillText(ch, x, y);
      x += ctx.measureText(ch).width + spacing;
    }
  }

  private drawHabitPill(ctx: CanvasRenderingContext2D, habit: HabitWithStreak): void {
    const pillW = 480;
    const pillH = 72;
    const pillX = (W - pillW) / 2;
    const pillY = 162;
    const r = pillH / 2;

    ctx.save();
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, pillX, pillY, pillW, pillH, r);
    ctx.stroke();
    ctx.restore();

    const iconSize = 28;
    const iconPad = 38;
    const iconCY = pillY + pillH / 2;
    this.drawStrokeIcon(ctx, habit.icon, pillX + iconPad, iconCY - iconSize / 2, iconSize, ACCENT);

    const displayName =
      habit.name.length > 22 ? habit.name.slice(0, 22) + '…' : habit.name;
    ctx.font = '600 30px "Inter", system-ui, sans-serif';
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayName, pillX + pillW / 2 + 12, pillY + pillH / 2);
  }

  private drawLockedInLabel(ctx: CanvasRenderingContext2D): void {
    ctx.font = '500 22px "Inter", system-ui, sans-serif';
    ctx.fillStyle = MUTED;
    ctx.textBaseline = 'alphabetic';
    this.fillTextSpaced(ctx, '— LOCKED IN —', W / 2, 332, 6);
  }

  private drawPercentage(ctx: CanvasRenderingContext2D, rate: number): void {
    const numStr = String(rate);
    const mainSize = numStr.length >= 3 ? 400 : 520;
    const pctSize = Math.round(mainSize * 0.34);

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    ctx.font = `${mainSize}px "Bebas Neue", sans-serif`;
    const numW = ctx.measureText(numStr).width;
    ctx.font = `${pctSize}px "Bebas Neue", sans-serif`;
    const pctW = ctx.measureText('%').width;

    const gap = 14;
    const totalW = numW + gap + pctW;
    const startX = (W - totalW) / 2;
    const baseline = 900;
    const pctBaseline = baseline - (mainSize - pctSize) * 0.78;

    // Radial glow behind the number
    ctx.save();
    const glow = ctx.createRadialGradient(W / 2, 680, 60, W / 2, 680, 430);
    glow.addColorStop(0, 'rgba(216,67,21,0.18)');
    glow.addColorStop(1, 'rgba(216,67,21,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 350, W, 620);
    ctx.restore();

    ctx.font = `${mainSize}px "Bebas Neue", sans-serif`;
    ctx.fillStyle = ACCENT;
    ctx.textAlign = 'left';
    ctx.fillText(numStr, startX, baseline);

    ctx.font = `${pctSize}px "Bebas Neue", sans-serif`;
    ctx.fillStyle = ACCENT;
    ctx.fillText('%', startX + numW + gap, pctBaseline);
  }

  private drawConsistencyLabel(ctx: CanvasRenderingContext2D): void {
    ctx.font = '500 24px "Inter", system-ui, sans-serif';
    ctx.fillStyle = MUTED;
    ctx.textBaseline = 'alphabetic';
    this.fillTextSpaced(ctx, 'CONSISTÊNCIA · 30 DIAS', W / 2, 976, 5);
  }

  private drawStats(ctx: CanvasRenderingContext2D, streak: number, totalDays: number): void {
    const boxH = 218;
    const boxY = 1028;
    const margin = 70;
    const gap = 20;
    const boxW = (W - 2 * margin - gap) / 2;

    this.drawStatBox(ctx, margin, boxY, boxW, boxH, true, streak, 'STREAK ATUAL');
    this.drawStatBox(ctx, margin + boxW + gap, boxY, boxW, boxH, false, totalDays, 'DIAS FOCADO');
  }

  private drawStatBox(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    showFire: boolean, value: number, label: string,
  ): void {
    ctx.save();
    ctx.fillStyle = ASPHALT;
    this.roundRect(ctx, x, y, w, h, 20);
    ctx.fill();
    ctx.restore();

    const cx = x + w / 2;
    const numStr = String(value);
    const numSize = 158;

    if (showFire) {
      ctx.font = `${numSize}px "Bebas Neue", sans-serif`;
      const numW = ctx.measureText(numStr).width;
      const iconSize = 42;
      const innerGap = 10;
      const rowW = iconSize + innerGap + numW;
      const rowX = cx - rowW / 2;

      this.drawStrokeIcon(ctx, 'fire', rowX, y + h / 2 - iconSize / 2 - 20, iconSize, ACCENT);

      ctx.fillStyle = ACCENT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(numStr, rowX + iconSize + innerGap, y + h / 2 + 58);
    } else {
      ctx.font = `${numSize}px "Bebas Neue", sans-serif`;
      ctx.fillStyle = WHITE;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(numStr, cx, y + h / 2 + 58);
    }

    ctx.font = '500 23px "Inter", system-ui, sans-serif';
    ctx.fillStyle = MUTED;
    ctx.textBaseline = 'alphabetic';
    this.fillTextSpaced(ctx, label, cx, y + h - 22, 3);
  }

  private drawBarChart(ctx: CanvasRenderingContext2D, days: ShareDay[]): void {
    const barW = 88;
    const gap = 40;
    const maxH = 210;
    const shortH = 90;
    const chartW = 7 * barW + 6 * gap;
    const startX = (W - chartW) / 2;
    const baseY = 1528;
    const r = 10;

    days.forEach(({ label, completed }, i) => {
      const bx = startX + i * (barW + gap);
      const bh = completed ? maxH : shortH;
      const by = baseY - bh;

      ctx.save();
      ctx.fillStyle = completed ? ACCENT : BAR_OFF;
      this.roundRect(ctx, bx, by, barW, bh, r);
      ctx.fill();
      ctx.restore();

      ctx.font = '500 28px "Inter", system-ui, sans-serif';
      ctx.fillStyle = MUTED;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, bx + barW / 2, baseY + 16);
    });
  }

  private drawFooter(ctx: CanvasRenderingContext2D): void {
    ctx.font = 'italic 500 34px "Inter", system-ui, sans-serif';
    ctx.fillStyle = FAINT;
    ctx.textBaseline = 'alphabetic';
    this.fillTextSpaced(ctx, 'Enter the zone.', W / 2, 1690, 0.5);

    const fontSize = 76;
    ctx.font = `${fontSize}px "Bebas Neue", sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    const stayW = ctx.measureText('STAY ').width;
    const lockW = ctx.measureText('LOCKED IN').width;
    const startX = (W - stayW - lockW) / 2;
    const y = 1812;

    ctx.fillStyle = WHITE;
    ctx.fillText('STAY ', startX, y);
    ctx.fillStyle = ACCENT;
    ctx.fillText('LOCKED IN', startX + stayW, y);
  }

  private fillTextSpaced(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    y: number,
    spacing: number,
  ): void {
    const chars = [...text];
    const widths = chars.map(ch => ctx.measureText(ch).width);
    const totalW = widths.reduce((s, w) => s + w, 0) + spacing * (chars.length - 1);
    let x = centerX - totalW / 2;
    const saved = ctx.textAlign;
    ctx.textAlign = 'left';
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], x, y);
      x += widths[i] + spacing;
    }
    ctx.textAlign = saved;
  }

  private drawStrokeIcon(
    ctx: CanvasRenderingContext2D,
    iconName: string,
    x: number, y: number,
    size: number,
    color: string,
  ): void {
    const pathData = ICON_PATHS[iconName] ?? 'M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0';
    const scale = size / 24;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const p = new Path2D(pathData);
    ctx.stroke(p);
    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  private async shareNative(blob: Blob, habitId: string): Promise<void> {
    const base64 = await this.blobToBase64(blob);
    const fileName = `locked-in-${habitId}.png`;
    await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await Share.share({ title: 'Minha consistência no Locked In 🔥', files: [uri] });
    await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
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
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
