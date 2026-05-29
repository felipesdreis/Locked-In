import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app.routes';
import { DbService } from './core/services/db.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideIonicAngular({ mode: 'md' }),
    {
      provide: APP_INITIALIZER,
      useFactory: (db: DbService) => () => db.initialize(),
      deps: [DbService],
      multi: true,
    },
  ]
};
