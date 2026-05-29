import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.page').then(m => m.HomePage),
  },
  {
    path: 'habit/new',
    loadComponent: () => import('./features/habit-form/habit-form.page').then(m => m.HabitFormPage),
  },
  {
    path: 'habit/:id/edit',
    loadComponent: () => import('./features/habit-form/habit-form.page').then(m => m.HabitFormPage),
  },
  {
    path: 'habit/:id',
    loadComponent: () => import('./features/habit-detail/habit-detail.page').then(m => m.HabitDetailPage),
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics.page').then(m => m.AnalyticsPage),
  },
  {
    path: 'archived',
    loadComponent: () => import('./features/archived-habits/archived-habits.page').then(m => m.ArchivedHabitsPage),
  },
  { path: '**', redirectTo: 'home' },
];
