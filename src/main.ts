import { createApp } from 'vue';
import App from './app.vue';
import router from './router';
import { setupStore } from './store';
import SvgIcon from './icons';
import './permission';
import { checkEnableLogs } from './utils/error-log';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import '@/styles/index.scss';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { applyTheme, getStoredTheme } from '@/utils/theme';

// Apply the saved theme before Vue mounts to avoid a light-theme flash.
applyTheme(getStoredTheme(), false);

const app = createApp(App);

setupStore(app);

app.component('svg-icon', SvgIcon);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(router);
app.use(ElementPlus);

checkEnableLogs(app);

// Apply native-only safe-area styles for Capacitor iOS / Android.
// Normal desktop and mobile browsers are not affected.
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('capacitor-native');
}

const platform = Capacitor.getPlatform();
document.documentElement.classList.add(`platform-${platform}`);

const NFC_HOST = 'secure.iklogy.com';

interface NfcRouteTarget {
  locationId: string;
  machineNumber: string;
}

function getNfcRouteTarget(urlValue: string): NfcRouteTarget | null {
  try {
    const url = new URL(urlValue);

    if (url.hostname.toLowerCase() !== NFC_HOST) {
      return null;
    }

    const match = url.pathname.match(/^\/nfc\/(\d+)\/(\d+)\/?$/i);

    if (!match) return null;

    return {
      locationId: match[1],
      machineNumber: match[2]
    };
  } catch {
    return null;
  }
}

async function openNfcRoute(urlValue: string) {
  const target = getNfcRouteTarget(urlValue);

  if (!target) return;

  await router.isReady();

  await router.push({
    name: 'NfcMachine',
    params: {
      locationId: target.locationId,
      machineNumber: target.machineNumber
    }
  });
}

async function initializeNfcDeepLinks() {
  // Also support a direct browser request such as:
  // https://secure.iklogy.com/nfc/3/1
  await openNfcRoute(window.location.href);

  if (!Capacitor.isNativePlatform()) return;

  // App already running/backgrounded and opened by a Universal Link.
  CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    void openNfcRoute(url);
  });

  // Cold launch from the NFC Universal Link.
  try {
    const launch = await CapacitorApp.getLaunchUrl();

    if (launch?.url) {
      await openNfcRoute(launch.url);
    }
  } catch {
    // No launch URL is normal when the app was opened directly.
  }
}

void initializeNfcDeepLinks();

app.mount('#app');
