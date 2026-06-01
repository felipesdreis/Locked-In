import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-ring',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="ring-container" [style.width.px]="size" [style.height.px]="size">
      <svg
        [attr.width]="size"
        [attr.height]="size"
        [attr.viewBox]="'0 0 ' + size + ' ' + size"
        class="ring-svg"
        aria-hidden="true"
      >
        <!-- Track -->
        <circle
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="radius"
          fill="none"
          stroke="var(--line-strong)"
          [attr.stroke-width]="strokeWidth"
        />
        <!-- Progress -->
        <circle
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="radius"
          fill="none"
          stroke="var(--accent)"
          [attr.stroke-width]="strokeWidth"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="strokeDashOffset"
          class="progress-ring"
        />
      </svg>

      <div class="ring-center">
        <div class="done-count">
          <span class="done-number">{{ done }}</span>
          <span class="total-number" *ngIf="total > 0">/{{ total }}</span>
        </div>
        <div class="label">HOJE</div>
      </div>
    </div>
  `,
  styles: [`
    .ring-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .ring-svg {
      transform: rotate(-90deg);
      display: block;
    }

    .progress-ring {
      transition: stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .ring-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .done-count {
      display: flex;
      align-items: baseline;
      gap: 1px;
    }

    .done-number {
      font-family: var(--display);
      font-size: 30px;
      font-weight: 700;
      color: var(--white);
      line-height: 1;
    }

    .total-number {
      font-family: var(--display);
      font-size: 18px;
      font-weight: 700;
      color: var(--faint);
      line-height: 1;
    }

    .label {
      font-family: var(--ui);
      font-size: 8px;
      letter-spacing: 1.5px;
      font-weight: 600;
      color: var(--muted);
      margin-top: 2px;
      text-transform: uppercase;
    }
  `]
})
export class RingComponent implements OnChanges {
  @Input() done: number = 0;
  @Input() total: number = 0;
  @Input() size: number = 92;
  @Input() strokeWidth: number = 7;

  radius: number = 0;
  circumference: number = 0;
  strokeDashOffset: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['size'] || changes['strokeWidth']) {
      this.radius = (this.size - this.strokeWidth) / 2;
      this.circumference = 2 * Math.PI * this.radius;
    }
    if (changes['done'] || changes['total'] || changes['size'] || changes['strokeWidth']) {
      this.updateProgress();
    }
  }

  private updateProgress(): void {
    // Ensure radius is calculated
    if (this.radius === 0) {
      this.radius = (this.size - this.strokeWidth) / 2;
      this.circumference = 2 * Math.PI * this.radius;
    }
    const percentage = this.total > 0 ? this.done / this.total : 0;
    this.strokeDashOffset = this.circumference * (1 - percentage);
  }
}
