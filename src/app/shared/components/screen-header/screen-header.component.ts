import { Component, Input } from '@angular/core';
import { Location, NgIf } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-screen-header',
  standalone: true,
  imports: [NgIf, IconComponent],
  template: `
    <header class="screen-header">
      <div class="left">
        <button
          *ngIf="showBack"
          class="back-btn"
          (click)="goBack()"
          aria-label="Voltar"
          type="button"
        >
          <app-icon name="back" [size]="24" [stroke]="2.2"></app-icon>
        </button>
        <div *ngIf="!showBack" class="back-placeholder"></div>
      </div>
      <h1 class="title">{{ title }}</h1>
      <div class="right">
        <ng-content select="[slot='actions']"></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .screen-header {
      display: grid;
      grid-template-columns: 48px 1fr 48px;
      align-items: center;
      padding: 6px 10px 14px;
      padding-top: calc(6px + env(safe-area-inset-top, 0px));
      background: var(--bg);
      border-bottom: 1px solid var(--line);
    }

    .left {
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      color: var(--white);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      transition: background 0.2s ease;

      &:hover {
        background: var(--asphalt);
      }

      &:active {
        background: var(--asphalt-2);
      }
    }

    .back-placeholder {
      width: 40px;
    }

    .title {
      font-family: var(--display);
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--white);
      margin: 0;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }
  `]
})
export class ScreenHeaderComponent {
  @Input() title: string = '';
  @Input() showBack: boolean = true;

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
