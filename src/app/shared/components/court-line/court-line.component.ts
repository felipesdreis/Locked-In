import { Component } from '@angular/core';

@Component({
  selector: 'app-court-line',
  standalone: true,
  imports: [],
  template: ``,
  styles: [`
    :host {
      display: block;
      height: 1px;
      background: var(--line);
      margin: var(--row-gap) 0;
    }
  `]
})
export class CourtLineComponent {}
