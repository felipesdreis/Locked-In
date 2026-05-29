import { Component, EventEmitter, Output, signal } from '@angular/core';
import {
  IonButton, IonIcon, IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, checkmarkCircleOutline, flameOutline, closeOutline } from 'ionicons/icons';

export const ONBOARDING_DONE_KEY = 'locked_in_onboarding_done';

interface Slide {
  icon: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-onboarding-tutorial',
  standalone: true,
  imports: [IonButton, IonIcon, IonButtons],
  templateUrl: './onboarding-tutorial.component.html',
  styleUrl: './onboarding-tutorial.component.scss',
})
export class OnboardingTutorialComponent {
  @Output() dismissed = new EventEmitter<void>();

  readonly slides: Slide[] = [
    {
      icon: 'add-circle-outline',
      title: 'Crie um hábito',
      text: 'Escolha uma atividade que quer manter — exercício, leitura, meditação. Dê um nome e defina a frequência.',
    },
    {
      icon: 'checkmark-circle-outline',
      title: 'Marque cada dia',
      text: 'Todo dia que você completa, marque no app. Simples assim. Um toque e está feito.',
    },
    {
      icon: 'flame-outline',
      title: 'Seu streak cresce',
      text: 'Dias consecutivos formam um streak. Quanto mais você mantém, mais difícil fica de quebrar. Locked In.',
    },
  ];

  readonly currentIndex = signal(0);

  constructor() {
    addIcons({ addCircleOutline, checkmarkCircleOutline, flameOutline, closeOutline });
  }

  get isLastSlide(): boolean {
    return this.currentIndex() === this.slides.length - 1;
  }

  get isFirstSlide(): boolean {
    return this.currentIndex() === 0;
  }

  get currentSlide(): Slide {
    return this.slides[this.currentIndex()];
  }

  next(): void {
    if (!this.isLastSlide) {
      this.currentIndex.update(i => i + 1);
    }
  }

  prev(): void {
    if (!this.isFirstSlide) {
      this.currentIndex.update(i => i - 1);
    }
  }

  complete(): void {
    localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
    this.dismissed.emit();
  }

  skip(): void {
    localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
    this.dismissed.emit();
  }

  static isCompleted(): boolean {
    return localStorage.getItem(ONBOARDING_DONE_KEY) === 'true';
  }
}
