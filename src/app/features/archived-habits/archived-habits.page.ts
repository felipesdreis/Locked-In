import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonButtons, IonBackButton, IonButton, IonIcon, IonNote, IonText,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { archiveOutline, refreshOutline, trashOutline } from 'ionicons/icons';
import { HabitService } from '../../core/services/habit.service';
import { Habit } from '../../core/models/habit.model';
import { parseDateString } from '../../core/utils/date.util';

@Component({
  selector: 'app-archived-habits',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonButtons, IonBackButton, IonButton, IonIcon, IonNote, IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Arquivados</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        @for (habit of archivedHabits(); track habit.id) {
          <ion-item>
            <div class="habit-icon" slot="start" [style.background]="habit.color">
              {{ habit.icon }}
            </div>
            <ion-label>
              <h2>{{ habit.name }}</h2>
              <ion-note>Arquivado em {{ formatDate(habit.archivedAt) }}</ion-note>
            </ion-label>
            <ion-button fill="clear" slot="end" aria-label="Restaurar hábito" (click)="restore(habit.id)">
              <ion-icon slot="icon-only" name="refresh-outline" color="primary"></ion-icon>
            </ion-button>
            <ion-button fill="clear" slot="end" aria-label="Deletar hábito permanentemente" (click)="confirmDelete(habit)">
              <ion-icon slot="icon-only" name="trash-outline" color="danger"></ion-icon>
            </ion-button>
          </ion-item>
        } @empty {
          <div class="empty-state">
            <ion-icon name="archive-outline" class="empty-icon"></ion-icon>
            <ion-text color="medium">
              <p>Nenhum hábito arquivado.</p>
            </ion-text>
          </div>
        }
      </ion-list>
    </ion-content>
  `,
  styles: [`
    .habit-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;
      gap: 12px;
    }

    .empty-icon {
      font-size: 48px;
      color: var(--ion-color-medium);
    }
  `],
})
export class ArchivedHabitsPage implements OnInit, OnDestroy {
  private activeAlert?: HTMLIonAlertElement;
  readonly archivedHabits = signal<Habit[]>([]);

  constructor(
    private habitService: HabitService,
    private alert: AlertController,
  ) {
    addIcons({ archiveOutline, refreshOutline, trashOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.refreshList();
  }

  ngOnDestroy(): void {
    this.activeAlert?.dismiss();
  }

  formatDate(isoDate: string | null): string {
    if (!isoDate) return '';
    return parseDateString(isoDate.substring(0, 10)).toLocaleDateString('pt-BR');
  }

  async restore(id: string): Promise<void> {
    await this.habitService.restore(id);
    await this.refreshList();
  }

  async confirmDelete(habit: Habit): Promise<void> {
    this.activeAlert = await this.alert.create({
      header: 'Deletar hábito',
      message: `Deseja deletar "${habit.name}" permanentemente? Todo o histórico será perdido.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Deletar',
          role: 'destructive',
          handler: () => {
            this.deleteHabit(habit.id).catch(err =>
              console.error('[ArchivedHabits] delete failed', err),
            );
          },
        },
      ],
    });
    await this.activeAlert.present();
  }

  private async deleteHabit(id: string): Promise<void> {
    await this.habitService.delete(id);
    await this.refreshList();
  }

  private async refreshList(): Promise<void> {
    const habits = await this.habitService.loadArchived();
    this.archivedHabits.set(habits);
  }
}
