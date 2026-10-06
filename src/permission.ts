import router from './router';
import { useUserStore } from './store/modules/user';
import { usePermissionStore } from './store/modules/permission';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { getToken } from '@/utils/auth';
import getPageTitle from '@/utils/get-page-title';
import { ElMessage } from 'element-plus';

NProgress.configure({ showSpinner: false });

const whiteList = ['/login', '/auth-redirect'];
const CHECKIN_PATH = '/customercheckin';

router.beforeEach(async (to, _from, next) => {
  
  NProgress.start();
  document.title = getPageTitle(to.meta.title);

  const userStore = useUserStore();
  const permissionStore = usePermissionStore();
  const hasToken = getToken();


  if (!hasToken) {
    if (whiteList.includes(to.path)) {
      next();
    } else {
      NProgress.done();
      next(`/login?redirect=${to.path}`);
    }
    return;
  }

  if (to.path === '/login') {
    NProgress.done();

    if (userStore.infoLoaded && userStore.isCheckIn) {
      next({ path: CHECKIN_PATH });
    } else {
      next({ path: '/' });
    }

    return;
  }

  try {
    if (!userStore.infoLoaded) {
      await userStore.getInfo();
    }

    if (!permissionStore.routesLoaded) {
      const accessRoutes = permissionStore.generateRoutes(userStore.permissions, userStore.roleName);

      accessRoutes.forEach(route => {
        router.addRoute(route);
      });

      permissionStore.setRoutesLoaded(true);

      if (userStore.isCheckIn && to.path !== CHECKIN_PATH) {
        next({path: CHECKIN_PATH, replace: true });
        return;
      }

      next({
        ...to,
        replace: true
      });
      return;
    }

    if (userStore.isCheckIn && to.path !== CHECKIN_PATH) {
      next({
        path: CHECKIN_PATH,
        replace: true
      });
      return;
    }

    next();

  } catch (error: any) {
    userStore.resetToken();

    ElMessage.error(
      error?.message ||
      'Unable to load your account permissions.'
    );

    NProgress.done();
    next(`/login?redirect=${to.path}`);
  }
});

router.afterEach(() => NProgress.done());
