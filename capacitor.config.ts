import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.fdrapps.lockedin',
  appName: 'Locked In',
  webDir: 'dist/locked-in/browser',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#D84315',
    },
  },
};

export default config;
