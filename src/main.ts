import { createApp } from 'vue';
import App from './app.vue';
import router from './router';
import { setupStore } from './store';
import SvgIcon from './icons';
import './permission';
import { checkEnableLogs } from './utils/error-log';
import ElementPlus from 'element-plus';
// import 'element-plus/dist/index.css';
import '@/styles/index.scss';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { Capacitor } from '@capacitor/core';
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

app.mount('#app');
