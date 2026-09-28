import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { setupStore } from './store';

import SvgIcon from './icons'; // icon
import './permission'; // permission control
import vPermission from './directive/permission/index'; // permission control
import { checkEnableLogs } from './utils/error-log'; // error log
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'
import '@/styles/index.scss';
import '@/styles/my.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

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

app.mount('#app');

