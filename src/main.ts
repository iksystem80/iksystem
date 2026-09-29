import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { setupStore } from './store';
import SvgIcon from './icons';
import './permission';
import vPermission from './directive/permission/index';
import { checkEnableLogs } from './utils/error-log';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import '@/styles/index.scss';
import '@/styles/my.scss';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { Capacitor } from '@capacitor/core';

const app = createApp(App);

setupStore(app);

app.component('svg-icon', SvgIcon);
app.directive('permission', vPermission);

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

app.mount('#app');
