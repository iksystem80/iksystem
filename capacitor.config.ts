import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.iksystem.app',
    appName: 'IK System',
    webDir: 'dist',

    // server: {
    //     cleartext: true
    // }

    server: {
        androidScheme: 'http',
        cleartext: true
    }
};
export default config;
