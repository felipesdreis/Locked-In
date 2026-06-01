import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { HabitWithStreak } from '../../../core/models/habit.model';
import { ShareService, ShareDay } from '../../../core/services/share.service';

@Component({
  selector: 'app-share-preview-modal',
  standalone: true,
  imports: [IonButton, IonSpinner],
  templateUrl: './share-preview-modal.component.html',
  styleUrl: './share-preview-modal.component.scss',
})
export class SharePreviewModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) habit!: HabitWithStreak;
  @Input({ required: true }) completionRate!: number;
  @Input({ required: true }) last7Days!: ShareDay[];
  @Output() closed = new EventEmitter<void>();

  readonly imageUrl = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly isSharing = signal(false);

  private blob: Blob | null = null;
  private objectUrl: string | null = null;

  constructor(private shareService: ShareService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.blob = await this.shareService.generateShareImage(
        this.habit,
        this.completionRate,
        this.last7Days,
      );
      this.objectUrl = URL.createObjectURL(this.blob);
      this.imageUrl.set(this.objectUrl);
    } catch (err) {
      console.error('[SharePreviewModal] Image generation failed:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.revokeUrl();
  }

  async shareImage(): Promise<void> {
    if (!this.blob) return;
    this.isSharing.set(true);
    try {
      await this.shareService.share(this.blob, this.habit.id);
    } catch (err) {
      console.error('[SharePreviewModal] Share failed:', err);
    } finally {
      this.isSharing.set(false);
      this.close();
    }
  }

  close(): void {
    this.revokeUrl();
    this.closed.emit();
  }

  private revokeUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
