import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { BadgeMilestone } from '../../../core/services/habit.service';

interface BadgeConfig {
  emoji: string;
  title: string;
  message: string;
}

const BADGE_CONFIG: Record<BadgeMilestone, BadgeConfig> = {
  7: {
    emoji: '🌟',
    title: '7 dias!',
    message: 'Parabéns! Você manteve o hábito por uma semana inteira.',
  },
  30: {
    emoji: '🏆',
    title: 'Mês completo!',
    message: 'Incrível! 30 dias consecutivos. Você está Locked In.',
  },
  100: {
    emoji: '💎',
    title: 'Século completo!',
    message: 'Lendário. 100 dias consecutivos. Você é uma máquina.',
  },
};

const AUTO_CLOSE_MS = 3000;

@Component({
  selector: 'app-badge-celebration-modal',
  standalone: true,
  imports: [IonButton],
  templateUrl: './badge-celebration-modal.component.html',
  styleUrl: './badge-celebration-modal.component.scss',
})
export class BadgeCelebrationModalComponent implements OnInit {
  @Input({ required: true }) milestone!: BadgeMilestone;
  @Output() closed = new EventEmitter<void>();

  private timer?: ReturnType<typeof setTimeout>;

  get config(): BadgeConfig {
    return BADGE_CONFIG[this.milestone];
  }

  ngOnInit(): void {
    this.timer = setTimeout(() => this.close(), AUTO_CLOSE_MS);
  }

  close(): void {
    clearTimeout(this.timer);
    this.closed.emit();
  }
}
