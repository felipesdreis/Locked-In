import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { IonContent, AlertController } from '@ionic/angular/standalone';
import { HabitService } from '../../core/services/habit.service';
import { Habit } from '../../core/models/habit.model';
import { parseDateString } from '../../core/utils/date.util';
import { ScreenHeaderComponent } from '../../shared/components/screen-header/screen-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-archived-habits',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    IonContent,
    ScreenHeaderComponent,
    IconComponent,
  ],
  templateUrl: './archived-habits.page.html',
  styleUrl: './archived-habits.page.scss',
})
export class ArchivedHabitsPage implements OnInit, OnDestroy {
  private activeAlert?: HTMLIonAlertElement;
  readonly archivedHabits = signal<Habit[]>([]);

  get isEmpty(): boolean {
    return this.archivedHabits().length === 0;
  }

  constructor(
    private habitService: HabitService,
    private alert: AlertController,
  ) {}

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
