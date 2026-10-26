import type { CapacitorConfig } from '@capacitor/cli';

const isDemo = process.env.IKLOGY_APP_VARIANT === 'demo';

const config: CapacitorConfig = {
  appId: isDemo ? 'com.iklogy.demo' : 'com.iklogy.app',
  appName: isDemo ? 'IKlogy Demo' : 'IK',
  webDir: 'dist',

  server: {
    hostname: 'localhost',
    androidScheme: 'https',
    cleartext: false
  }
};

export default config;
