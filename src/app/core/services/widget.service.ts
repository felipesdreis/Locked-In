import { Injectable } from '@angular/core';
import { registerPlugin } from '@capacitor/core';

interface WidgetPluginInterface {
  requestUpdate(): Promise<void>;
}

// No-op na web; só executa de verdade no Android nativo.
const WidgetNative = registerPlugin<WidgetPluginInterface>('WidgetPlugin', {
  web: () => ({ requestUpdate: async () => {} }),
});

@Injectable({ providedIn: 'root' })
export class WidgetService {
  /** Fire-and-forget: notifica os widgets para releitura do SQLite. */
  requestUpdate(): void {
    WidgetNative.requestUpdate().catch(() => {});
  }
}
