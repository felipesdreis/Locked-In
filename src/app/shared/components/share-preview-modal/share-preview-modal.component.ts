import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { Habit } from '../../../core/models/habit.model';
import { ShareService } from '../../../core/services/share.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-share-preview-modal',
  standalone: true,
  imports: [IonButton, IonSpinner],
  templateUrl: './share-preview-modal.component.html',
  styleUrl: './share-preview-modal.component.scss',
})
export class SharePreviewModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) habit!: Habit;
  @Input({ required: true }) streakDays!: number;
  @Output() closed = new EventEmitter<void>();

  readonly imageUrl = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly isSharing = signal(false);

  private blob: Blob | null = null;
  private objectUrl: string | null = null;

  constructor(private shareService: ShareService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.blob = await this.shareService.generateStreakImage(this.habit, this.streakDays);
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
