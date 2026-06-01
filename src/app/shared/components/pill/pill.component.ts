import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pill',
  standalone: true,
  imports: [],
  template: `
    <div class="pill">
      <span class="label">{{ label }}</span>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 20px;
      background: color-mix(in srgb, var(--accent) 16%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
      font-size: 9px;
      letter-spacing: 1.2px;
      font-weight: 600;
      color: var(--white);
      text-transform: uppercase;
    }

    .label {
      color: var(--muted);
    }
  `]
})
export class PillComponent {
  @Input() label: string = '';
}
