import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';
import { asyncRoutes, constantRoutes } from '@/router';
import type { RouteRecordRaw } from 'vue-router';

function normalizeRole(roleName: string): string {
  return String(roleName || '').trim().toLowerCase();
}

function normalizeModules(moduleCodes: string[]): Set<string> {
  return new Set(
    (Array.isArray(moduleCodes) ? moduleCodes : [])
      .map(code => String(code || '').trim().toLowerCase())
      .filter(Boolean)
  );
}

function routeModuleCode(route: RouteRecordRaw): string {
  const meta = route.meta as any;
  return String(meta?.permission || '').trim().toLowerCase();
}

function hasRoleRestriction(route: RouteRecordRaw, roleName: string): boolean {
  const meta = route.meta as any;

  if (!Array.isArray(meta?.roles) || meta.roles.length === 0) {
    return true;
  }

  const role = normalizeRole(roleName);
  return meta.roles
    .map((allowedRole: string) => normalizeRole(allowedRole))
    .includes(role);
}

function hasDirectModuleAccess(
  route: RouteRecordRaw,
  assignedModules: Set<string>,
  roleName: string
): boolean {
  const role = normalizeRole(roleName);

  // System Admin remains the platform-level bypass.
  if (role === 'system admin') {
    return true;
  }

  if (!hasRoleRestriction(route, roleName)) {
    return false;
  }

  const moduleCode = routeModuleCode(route);

  // Routes without a module code are containers/helper routes.
  // Their final visibility is decided after child filtering.
  if (!moduleCode) {
    return true;
  }

  // Owner/Admin intentionally receive NO bypass here.
  // They must have the same assigned module/sub-module access as other roles.
  return assignedModules.has(moduleCode);
}

export function filterAsyncRoutes(
  routes: RouteRecordRaw[],
  moduleCodes: string[],
  roleName: string
): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = [];
  const assignedModules = normalizeModules(moduleCodes);

  routes.forEach(route => {
    const current: RouteRecordRaw = {
      ...route
    };

    const roleAllowed = hasRoleRestriction(current, roleName);

    if (!roleAllowed) {
      return;
    }

    if (current.children?.length) {
      current.children = filterAsyncRoutes(
        current.children,
        moduleCodes,
        roleName
      );
    }

    const directAccess = hasDirectModuleAccess(
      current,
      assignedModules,
      roleName
    );

    const hasAllowedChildren =
      Array.isArray(current.children) &&
      current.children.length > 0;

    const moduleCode = routeModuleCode(current);
    const meta = current.meta as any;

    // A parent module remains visible when:
    // 1. its own module is assigned, or
    // 2. at least one assigned child/sub-module remains.
    //
    // This supports the new parent -> child module hierarchy.
    if (moduleCode && !directAccess && !hasAllowedChildren) {
      return;
    }

    // A pure container with children is useless when all children were filtered out.
    if (
      !moduleCode &&
      Array.isArray(route.children) &&
      route.children.length > 0 &&
      !hasAllowedChildren
    ) {
      return;
    }

    // Preserve hidden helper/detail routes when their module code is assigned.
    // Hidden status affects menu display only, not authorization.
    if (!directAccess && !hasAllowedChildren && meta?.hidden !== true) {
      return;
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
    }

    function generateRoutes(
      moduleCodes: string[],
      roleName: string
    ): RouteRecordRaw[] {
      const accessedRoutes = filterAsyncRoutes(
        asyncRoutes || [],
        moduleCodes || [],
        roleName || ''
      );

      setRoutes(accessedRoutes);
      return accessedRoutes;
    }

    const routesLoaded = ref(false);

    function setRoutesLoaded(value: boolean) {
      routesLoaded.value = Boolean(value);
    }

    function resetRoutes() {
      addRoutes.value = [];
      routes.value = [];
      routesLoaded.value = false;
    }

    return {
      routes,
      addRoutes,
      routesLoaded,
      setRoutes,
      setRoutesLoaded,
      resetRoutes,
      generateRoutes
    };
  });

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(
      usePermissionStore,
      import.meta.hot
    )
  );
}
