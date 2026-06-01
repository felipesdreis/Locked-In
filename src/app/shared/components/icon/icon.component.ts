import { Component, Input } from '@angular/core';
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgSwitch, NgSwitchCase, NgSwitchDefault],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      [attr.stroke]="color || 'currentColor'"
      [attr.stroke-width]="stroke"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon"
      aria-hidden="true"
    >
      <ng-container [ngSwitch]="name">
        <ng-container *ngSwitchCase="'dumbbell'">
          <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" />
        </ng-container>
        <ng-container *ngSwitchCase="'book'">
          <path d="M12 6c-1.6-1.2-4-1.8-6.5-1.8C4.6 4.2 4 4.8 4 5.6v11.6c0 .8.7 1.2 1.5 1C7.8 17.7 10.4 18 12 19c1.6-1 4.2-1.3 6.5-.8.8.2 1.5-.2 1.5-1V5.6c0-.8-.6-1.4-1.5-1.4C16 4.2 13.6 4.8 12 6zM12 6v13" />
        </ng-container>
        <ng-container *ngSwitchCase="'water'">
          <path d="M12 3s6 6.4 6 10.5A6 6 0 1 1 6 13.5C6 9.4 12 3 12 3z" />
          <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" style="opacity:0.55" />
        </ng-container>
        <ng-container *ngSwitchCase="'meditate'">
          <circle cx="12" cy="5.5" r="2" />
          <path d="M12 8.5c-1.5 2.2-3 3.5-5.5 4.2M12 8.5c1.5 2.2 3 3.5 5.5 4.2M5 18.5c2-2.2 4.4-3.2 7-3.2s5 1 7 3.2" />
        </ng-container>
        <ng-container *ngSwitchCase="'pill'">
          <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-30 12 12)" />
          <path d="M9.8 6.5l4.4 7.6" />
        </ng-container>
        <ng-container *ngSwitchCase="'sleep'">
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
          <path d="M15 4h3l-3 3.2h3" style="opacity:0.6" />
        </ng-container>
        <ng-container *ngSwitchCase="'run'">
          <circle cx="14" cy="5" r="1.8" />
          <path d="M13 9l-3 2 2 3-1 5M12 11l4 1 2 3M10 12l-3 1-1 3" />
        </ng-container>
        <ng-container *ngSwitchCase="'music'">
          <path d="M9 18V6l10-2v12" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
        </ng-container>
        <ng-container *ngSwitchCase="'target'">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </ng-container>
        <ng-container *ngSwitchCase="'write'">
          <path d="M4 20l4-1L19 8a2 2 0 0 0-3-3L5 16l-1 4zM14.5 6.5l3 3" />
        </ng-container>
        <ng-container *ngSwitchCase="'fire'">
          <path d="M12 3c.8 2.8-.6 4.4-2 6-1.3 1.5-2.5 3-2.5 5.2A6.5 6.5 0 0 0 18.5 14c0-2.2-1-3.6-2-5-.4 1-1 1.6-2 2 .8-2.6 0-5.6-2.5-8z" />
        </ng-container>
        <ng-container *ngSwitchCase="'check'">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </ng-container>
        <ng-container *ngSwitchCase="'plus'">
          <path d="M12 5v14M5 12h14" />
        </ng-container>
        <ng-container *ngSwitchCase="'archive'">
          <rect x="4" y="4" width="16" height="4" rx="1" />
          <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
        </ng-container>
        <ng-container *ngSwitchCase="'chart'">
          <path d="M5 19V5M19 19H5M9 19v-6M13 19V8M17 19v-9" />
        </ng-container>
        <ng-container *ngSwitchCase="'gear'">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.5v2.5M12 19v2.5M4.2 7l2.2 1.3M17.6 15.7l2.2 1.3M4.2 17l2.2-1.3M17.6 8.3l2.2-1.3" />
        </ng-container>
        <ng-container *ngSwitchCase="'help'">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.7.3-1.2.9-1.2 1.6v.5" />
          <circle cx="11.5" cy="17" r="0.6" fill="currentColor" />
        </ng-container>
        <ng-container *ngSwitchCase="'back'">
          <path d="M15 5l-7 7 7 7" />
        </ng-container>
        <ng-container *ngSwitchCase="'edit'">
          <path d="M4 20l4-1L19 8a2 2 0 0 0-3-3L5 16l-1 4z" />
        </ng-container>
        <ng-container *ngSwitchCase="'trash'">
          <path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13" />
        </ng-container>
        <ng-container *ngSwitchCase="'clock'">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </ng-container>
        <ng-container *ngSwitchCase="'chevL'">
          <path d="M14 6l-6 6 6 6" />
        </ng-container>
        <ng-container *ngSwitchCase="'chevR'">
          <path d="M10 6l6 6-6 6" />
        </ng-container>
        <ng-container *ngSwitchCase="'chevD'">
          <path d="M6 10l6 6 6-6" />
        </ng-container>
        <ng-container *ngSwitchCase="'hoop'">
          <path d="M5 6h14M6 6l1.5 5h9L18 6M8 11l-1 5M16 11l1 5M7 16h10" />
        </ng-container>
        <ng-container *ngSwitchDefault>
          <!-- fallback: circle placeholder for unknown icon names -->
          <circle cx="12" cy="12" r="8" />
        </ng-container>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .icon {
      display: block;
      flex-shrink: 0;
    }
  `]
})
export class IconComponent {
  @Input() name: string = '';
  @Input() size: number = 24;
  @Input() stroke: number = 2;
  @Input() color?: string;
}
