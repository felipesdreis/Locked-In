import { Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-streak',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="streak" [class.hot]="days >= 5">
      <app-icon
        name="fire"
        [size]="size"
        [stroke]="2.2"
      ></app-icon>
      <span class="number" [style.fontSize.px]="size + 3">{{ days }}</span>
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .streak {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--muted);
      font-family: var(--display);
      font-weight: 700;

      &.hot {
        color: var(--accent);
        filter: drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 55%, transparent));
      }
    }

    .number {
      line-height: 1;
    }
  `]
})
export class StreakComponent {
  @Input() days: number = 0;
  @Input() size: number = 18;
}
