import router from './router'
import { useUserStore } from './store/modules/user'
import { usePermissionStore } from './store/modules/permission'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import getPageTitle from '@/utils/get-page-title'
import { ElMessage } from 'element-plus'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/auth-redirect']

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  document.title = getPageTitle(to.meta.title)

  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      NProgress.done()
      next({ path: '/' })
      return
    }

    if (userStore.infoLoaded) {
      next()
      return
    }

    try {
      const info = await userStore.getInfo()
      const permissions = info?.permissions || []
      const roleName = info?.rolename || ''

      const accessRoutes = permissionStore.generateRoutes(permissions, roleName)
      accessRoutes.forEach(route => router.addRoute(route))

      next({ ...to, replace: true })
    } catch (error: any) {
      userStore.resetToken()
      ElMessage.error(error?.message || 'Unable to load your account permissions.')
      NProgress.done()
      next(`/login?redirect=${to.path}`)
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      NProgress.done()
      next(`/login?redirect=${to.path}`)
    }
  }
})

router.afterEach(() => NProgress.done())
