import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';
import { asyncRoutes, constantRoutes } from '@/router';
import type { RouteRecordRaw } from 'vue-router';

function normalizeRole(roleName: string): string {
  return String(roleName || '').trim().toLowerCase();
}

function hasPermission(permissions: string[], roleName: string, route: RouteRecordRaw): boolean {
  const meta = route.meta as any;

  if (!meta) {
    return true;
  }

  const role = normalizeRole(roleName);

  if (Array.isArray(meta.roles) && meta.roles.length > 0) {
    const allowedRoles = meta.roles.map((allowedRole: string) => normalizeRole(allowedRole));
    return allowedRoles.includes(role);
  }

  if (meta.permission) {
    if (role === 'system admin' || role === 'owner') {
      return true;
    }

    return permissions.includes(meta.permission as string);
  }

  if (Array.isArray(meta.permissions) && meta.permissions.length > 0) {
    if (role === 'system admin' || role === 'owner') {
      return true;
    }

    return meta.permissions.some((permission: string) => permissions.includes(permission));
  }

  return true;
}

export function filterAsyncRoutes(routes: RouteRecordRaw[], permissions: string[], roleName: string ): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = [];

  routes.forEach(route => {
    const current: RouteRecordRaw = {
      ...route
    };

    if (!hasPermission(permissions, roleName, current)) {
      return;
    }

    if (current.children) {
      current.children = filterAsyncRoutes(current.children, permissions, roleName.toLowerCase());

      const meta = current.meta as any;
  
      if (current.children.length === 0 && !meta?.permission && !meta?.permissions && !meta?.roles) {
        return;
      }
    }

    result.push(current);
  });

  return result;
}

export const usePermissionStore =
  defineStore('permission', () => {
    const routes = ref<RouteRecordRaw[]>([]);

    const addRoutes = ref<RouteRecordRaw[]>([]);

    function setRoutes(newRoutes: RouteRecordRaw[]) {
      addRoutes.value = newRoutes;
      routes.value = constantRoutes.concat(newRoutes);

      //console.log(routes.value)
    }
    function generateRoutes(permissions: string[], roleName: string): RouteRecordRaw[] {
      const accessedRoutes = filterAsyncRoutes(asyncRoutes || [], permissions || [], roleName.trim().toLowerCase() || '');
      // console.log('role name: ' + roleName.trim().toLowerCase())
      // console.log(accessedRoutes)
      setRoutes(accessedRoutes);

      return accessedRoutes;
    }

    // this is new
    const routesLoaded = ref(false);
    // this is new
    function setRoutesLoaded(value: boolean) {
      routesLoaded.value = Boolean(value);
    }
    // this is new
    function resetRoutes() {
      addRoutes.value = [];
      routes.value = [];
      routesLoaded.value = false;
    }

    return { routes, addRoutes, routesLoaded, setRoutes, setRoutesLoaded, resetRoutes, generateRoutes };
  }
  );

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(
      usePermissionStore,
      import.meta.hot
    )
  );
}
