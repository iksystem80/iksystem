import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iklogy.app',
  appName: 'IKlogy',
  webDir: 'dist',

  server: {
    hostname: 'localhost',
    androidScheme: 'https',
    cleartext: false
  }
};

export default config;
