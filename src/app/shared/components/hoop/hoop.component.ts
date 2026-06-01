import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-hoop',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      class="hoop"
      [class.checked]="checked"
      (click)="toggle()"
      type="button"
      [attr.aria-pressed]="checked"
      aria-label="Marcar hábito"
    >
      <app-icon name="check" [size]="22" [stroke]="2.4"></app-icon>
      <span class="ripple" [class.animate]="rippleActive"></span>
    </button>
  `,
  styles: [`
    .hoop {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      border: 2px solid var(--line-strong);
      background: transparent;
      color: var(--faint);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
      flex-shrink: 0;
      overflow: visible;
      padding: 0;

      &:hover:not(.checked) {
        border-color: var(--muted);
        color: var(--muted);
      }

      &.checked {
        border-color: var(--accent);
        background: var(--accent);
        color: #0F0F0F;
        box-shadow: 0 0 18px -4px var(--accent);
      }
    }

    .ripple {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid var(--accent);
      opacity: 0;
      pointer-events: none;

      &.animate {
        animation: ripple-burst 460ms ease-out forwards;
      }
    }

    @keyframes ripple-burst {
      0% {
        transform: scale(0);
        opacity: 1;
      }
      100% {
        transform: scale(3);
        opacity: 0;
      }
    }
  `]
})
export class HoopComponent {
  @Input() checked: boolean = false;
  @Output() change = new EventEmitter<boolean>();

  rippleActive = false;

  toggle(): void {
    const newValue = !this.checked;
    this.change.emit(newValue);
    if (newValue) {
      // Reset then re-trigger ripple animation
      this.rippleActive = false;
      // Micro-task to allow DOM to reset the animation
      Promise.resolve().then(() => {
        this.rippleActive = true;
        setTimeout(() => { this.rippleActive = false; }, 460);
      });
    }
  }
}
