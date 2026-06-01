import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-court-mark',
  standalone: true,
  imports: [],
  template: `
    <svg
      viewBox="0 0 240 380"
      class="court-mark"
      [style.opacity]="opacityValue"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <!-- Outer court rectangle -->
      <rect x="10" y="10" width="220" height="360" fill="none" stroke="currentColor" stroke-width="1.25" />
      <!-- Key / paint area -->
      <rect x="80" y="10" width="80" height="140" fill="none" stroke="currentColor" stroke-width="1.25" />
      <!-- Free throw circle -->
      <circle cx="120" cy="150" r="45" fill="none" stroke="currentColor" stroke-width="1.25" />
      <!-- Basket / hoop circle -->
      <circle cx="120" cy="10" r="18" fill="none" stroke="currentColor" stroke-width="1.25" />
      <!-- Three-point arc -->
      <path d="M 40 10 Q 40 237.5 120 237.5 Q 200 237.5 200 10"
            fill="none" stroke="currentColor" stroke-width="1.25" />
    </svg>
  `,
  styles: [`
    :host {
      display: block;
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .court-mark {
      width: 100%;
      height: 100%;
      color: var(--white);
    }
  `]
})
export class CourtMarkComponent {
  /** CSS opacity value or expression. Defaults to var(--court-strength). */
  @Input() opacity?: string;

  get opacityValue(): string {
    return this.opacity ?? 'var(--court-strength)';
  }
}
