import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WordmarkComponent } from '../wordmark/wordmark.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, WordmarkComponent, IconComponent],
  template: `
    <header class="topbar">
      <div class="left">
        <app-wordmark [size]="22"></app-wordmark>
      </div>
      <nav class="right" aria-label="Navegação principal">
        <button
          class="icon-btn"
          (click)="openHelp()"
          title="Como funciona?"
          aria-label="Como funciona?"
        >
          <app-icon name="help" [size]="24"></app-icon>
        </button>
        <button
          class="icon-btn"
          routerLink="/archived"
          title="Hábitos arquivados"
          aria-label="Hábitos arquivados"
        >
          <app-icon name="archive" [size]="24"></app-icon>
        </button>
        <button
          class="icon-btn"
          routerLink="/analytics"
          title="Analytics"
          aria-label="Analytics"
        >
          <app-icon name="chart" [size]="24"></app-icon>
        </button>
        <button
          class="icon-btn"
          routerLink="/settings"
          title="Configurações"
          aria-label="Configurações"
        >
          <app-icon name="gear" [size]="24"></app-icon>
        </button>
      </nav>
    </header>
  `,
  styles: [`
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 18px 12px;
      padding-top: calc(10px + env(safe-area-inset-top, 0px));
      background: var(--bg);
      border-bottom: 1px solid var(--line);
    }

    .left {
      flex: 1;
      display: flex;
      align-items: center;
    }

    .right {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
    }

    .icon-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: transparent;
      border: none;
      color: var(--muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease, color 0.2s ease;

      &:hover {
        background: var(--asphalt);
        color: var(--white);
      }

      &:active {
        background: color-mix(in srgb, var(--accent) 20%, var(--asphalt));
      }
    }
  `]
})
export class TopbarComponent {
  openHelp(): void {
    // Help opens the onboarding flow — event handled by parent via (click) binding
    // Emitting is not needed here as the parent home.page listens on its own method
    // This button calls the parent's openHowItWorks() via a different pattern.
    // Since topbar has no access to parent, we dispatch a custom event on the window.
    window.dispatchEvent(new CustomEvent('app:open-help'));
  }
}
