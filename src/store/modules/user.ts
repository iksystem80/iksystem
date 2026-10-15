import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin, getInfo as apiGetInfo } from '@/api/user';
import {
  getToken,
  setToken,
  removeToken,
  getUserId,
  setUserId,
  removeUserId
} from '@/utils/auth';
import router, { resetRouter } from '@/router';
import { useTagsViewStore } from './tagsview';
import { usePermissionStore } from './permission';
import { initializeSocketListeners, cleanupSocket } from '@/services/socketlisteners';
import { getClockStatus } from '@/api/employeesession';
import { getEmployeeFinance } from '@/api/employeefinance';

interface LoginInfo {
  username: string
  password: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken());
  const userId = ref<string>(getUserId());

  const username = ref('');
  const name = ref('');
  const avatar = ref('');

  const roles = ref<string[]>([]);
  const roleId = ref<number | null>(null);
  const roleName = ref('');
  const permissions = ref<string[]>([]);

  const companyId = ref<number | null>(null);
  const companyName = ref('');

  const locationId = ref('');
  const location = ref('');
  const locations = ref<any[]>([]);
  const allowfaceCheckin = ref(false);

  const infoLoaded = ref(false);

  const hasfaceallowed = computed(() => allowfaceCheckin.value);

  const normalizedRole = computed(() =>
    String(roleName.value || '').trim().toLowerCase()
  );

  const isSystemAdmin = computed(
    () => normalizedRole.value === 'system admin'
  );

  const isOwner = computed(
    () => normalizedRole.value === 'owner'
  );

  const isAdmin = computed(
    () => normalizedRole.value === 'admin'
  );

  const isManager = computed(
    () => normalizedRole.value === 'manager'
  );

  // this is new
  const isEmployee = computed(() => normalizedRole.value === 'employee');
  // this is new
  const isCheckIn = computed(() => normalizedRole.value === 'checkin');

  const isOwnerOrAdmin = computed(() => isOwner.value || isAdmin.value);

  const isClocked = ref(false);
  const isClockedIn = computed(() => isClocked.value);
  const activeClockSession = ref(null);

  // Employee menu access is based on the current active-session bank balance.
  const employeeBalance = ref(0);
  const employeeBalanceLoaded = ref(false);
  const employeeBalanceLoading = ref(false);

  function setClockedIn(value) {
    isClocked.value = Boolean(value);

    if (!isClocked.value) {
      employeeBalance.value = 0;
      employeeBalanceLoaded.value = true;
    }
  }

  function setEmployeeBalance(value: unknown) {
    const nextBalance = Number(value || 0);

    employeeBalance.value =
      Number.isFinite(nextBalance)
        ? nextBalance
        : 0;

    employeeBalanceLoaded.value = true;
  }

  async function loadEmployeeBalance() {
    if (!isEmployee.value) {
      employeeBalance.value = 0;
      employeeBalanceLoaded.value = true;
      return;
    }

    if (
      !isClockedIn.value ||
      !locationId.value
    ) {
      employeeBalance.value = 0;
      employeeBalanceLoaded.value = true;
      return;
    }

    try {
      employeeBalanceLoading.value = true;
      employeeBalanceLoaded.value = false;

      const response =
        await getEmployeeFinance(
          locationId.value
        );

      setEmployeeBalance(
        response?.data?.summary?.balance
      );
    } catch (error) {
      console.error(
        'Unable to load employee balance:',
        error
      );

      // Fail closed: until finance can be verified,
      // the sidebar will expose Transaction only.
      employeeBalance.value = 0;
      employeeBalanceLoaded.value = true;
    } finally {
      employeeBalanceLoading.value = false;
    }
  }

  function isSystemAdminPermission(permission: string): boolean {
    return [
      'companies.',
      'locations.',
      'users.'
    ].some(prefix => permission.startsWith(prefix));
  }

  function hasPermission(permission: string): boolean {
    if (isSystemAdmin.value) {
      return isSystemAdminPermission(permission);
    }

    if (isOwner.value) {
      return true;
    }

    return permissions.value.includes(permission);
  }

  async function login(userInfo: LoginInfo): Promise<void> {
    // A new authentication must never reuse routes from the
    // previously logged-in account.
    // This is new
    const permissionStore = usePermissionStore();
    permissionStore.resetRoutes();
    resetRouter();

    let response;

    try {
      response = await apiLogin({
        username: userInfo.username.trim(),
        password: userInfo.password
      });
    } catch (error: any) {
      const accessStatus =
        accessStatusFromError(error);

      if (accessStatus) {
        await forceAccessLogout(accessStatus);
      }

      throw error;
    }

    token.value = response.token || '';
    userId.value = String(response.userid || '');

    companyId.value =
      response.companyid != null
        ? Number(response.companyid)
        : null;

    companyName.value =
      response.companyname || '';

    locationId.value =
      response.locationid != null
        ? String(response.locationid)
        : '';

    location.value =
      response.locationname || '';

    infoLoaded.value = false;

    setToken(token.value);
    setUserId(userId.value);

    if (response.locationid) {
      initializeSocketListeners(response.locationid, response.companyid);
    }
  }

  async function getInfo() {
    //console.log('get info called')
    let response;

    try {
      response = await apiGetInfo(
        token.value,
        userId.value,
        locationId.value
      );
    } catch (error: any) {
      const accessStatus =
        accessStatusFromError(error);

      if (accessStatus) {
        await forceAccessLogout(accessStatus);
      }

      throw error;
    }

    if (!response?.data) {
      throw new Error(
        'Verification failed, please login again.'
      );
    }

    const data = response.data;

    console.log(data);

    roles.value = Array.isArray(data.roles) ? data.roles : [];

    roleId.value = data.roleid != null ? Number(data.roleid) : null;

    roleName.value = data.rolename || '';

    permissions.value = Array.isArray(data.permissions) ? data.permissions : [];

    username.value = data.username || '';
    name.value = data.name || '';
    avatar.value = data.avatar || '';

    companyId.value = data.companyid != null ? Number(data.companyid) : null;

    companyName.value = data.companyname || '';

    locationId.value =
      data.locationid != null
        ? String(data.locationid)
        : '';

    location.value = data.location || '';
    allowfaceCheckin.value = Boolean(data.allowfacecheckin);

    locations.value = Array.isArray(response.locations) ? response.locations : [];

    initializeSocketListeners(
      locationId.value,
      companyId.value
    );

    infoLoaded.value = true;
    return data;
  }

  async function rebuildRoutes() {
    console.log('rebuildRoutes called')
    const permissionStore = usePermissionStore();

    resetRouter();
    // This is new
    permissionStore.resetRoutes();

    const accessRoutes = permissionStore.generateRoutes(permissions.value, roleName.value);

    // console.log(accessRoutes)
    accessRoutes.forEach(route => { router.addRoute(route); });

    //console.log(router.getRoutes())

    // console.log(accessRoutes)
    // This is new
    permissionStore.setRoutesLoaded(true);

    const tagsViewStore = useTagsViewStore();
    tagsViewStore.delAllViews();
  }

  async function changeLocation(
    locid: string,
    locationname: string
  ): Promise<void> {
    locationId.value = String(locid || '');
    location.value = locationname || '';
    infoLoaded.value = false;

    employeeBalance.value = 0;
    employeeBalanceLoaded.value = false;

    cleanupSocket();

    if (locid) {
      initializeSocketListeners(locid, companyId.value);
    }

    await getInfo();
    await rebuildRoutes();

    // Re-resolve navigation using the newly loaded location permissions.
    await router.replace('/');
  }

  function statusRoute(
    scope: string,
    status: string,
    displayName = ''
  ) {
    return {
      path:
        status === 'suspended'
          ? '/suspended'
          : '/deactivated',
      query: {
        scope:
          scope === 'company'
            ? 'company'
            : 'location',
        ...(displayName
          ? { name: displayName }
          : {})
      }
    };
  }

  async function forceAccessLogout({
    scope = 'location',
    status = 'inactive',
    name: displayName = ''
  } = {}): Promise<void> {
    const target = statusRoute(
      String(scope),
      String(status),
      String(displayName || '')
    );

    cleanupSocket();

    removeToken();
    removeUserId();

    const permissionStore = usePermissionStore();
    const tagsViewStore = useTagsViewStore();

    permissionStore.resetRoutes();
    tagsViewStore.delAllViews();

    clearUserState();
    resetRouter();

    await router.replace(target);
  }

  function accessStatusFromError(error: any) {
    const data = error?.response?.data || {};
    const status = String(data.statusType || '').trim().toLowerCase();
    const scope = String(data.statusScope || '').trim().toLowerCase();

    if (
      !['inactive', 'suspended'].includes(status) ||
      !['company', 'location'].includes(scope)
    ) {
      return null;
    }

    return {
      scope,
      status,
      name: String(data.statusName || '').trim()
    };
  }

  async function refreshAvailableLocations(): Promise<void> {
    if (
      !token.value ||
      !userId.value ||
      isSystemAdmin.value
    ) {
      return;
    }

    try {
      const response = await apiGetInfo(
        token.value,
        userId.value,
        locationId.value
      );

      locations.value =
        Array.isArray(response?.locations)
          ? response.locations
          : [];
    } catch (error: any) {
      const accessStatus =
        accessStatusFromError(error);

      if (accessStatus) {
        await forceAccessLogout(accessStatus);
        return;
      }

      console.error(
        'Unable to refresh available locations:',
        error
      );
    }
  }

  function clearUserState(): void {
    token.value = '';
    userId.value = '';

    username.value = '';
    name.value = '';
    avatar.value = '';

    roles.value = [];
    roleId.value = null;
    roleName.value = '';
    permissions.value = [];

    companyId.value = null;
    companyName.value = '';

    locationId.value = '';
    location.value = '';
    locations.value = [];
    allowfaceCheckin.value = false;

    isClocked.value = false;
    activeClockSession.value = null;

    employeeBalance.value = 0;
    employeeBalanceLoaded.value = false;
    employeeBalanceLoading.value = false;

    infoLoaded.value = false;
  }

  async function logout(): Promise<void> {
    cleanupSocket();

    const permissionStore = usePermissionStore();
    const tagsViewStore = useTagsViewStore();

    // Clear auth first so the route guard knows this is a logout.
    removeToken();
    removeUserId();

    // Clear application state.
    clearUserState();

    // Clear permission/sidebar state.
    permissionStore.resetRoutes();
    tagsViewStore.delAllViews();

    // IMPORTANT:
    // Go directly to login BEFORE resetting the router.
    if (router.currentRoute.value.path !== '/login') {
      await router.replace('/login');
    }

    // Now it is safe to remove old dynamic routes.
    resetRouter();
  }

  function resetToken(): void {
    cleanupSocket();

    removeToken();
    removeUserId();

    const permissionStore = usePermissionStore();
    permissionStore.resetRoutes();

    resetRouter();
    clearUserState();
  }

  async function loadClockStatus() {
    try {
      if (!userId.value) {
        isClocked.value = false;
        activeClockSession.value = null;
        return;
      }

      const response =
        await getClockStatus(
          userId.value
        );

      isClocked.value = Boolean(response?.data?.clockedIn);
      activeClockSession.value = response?.data?.session || null;

      if (
        isEmployee.value &&
        isClocked.value
      ) {
        await loadEmployeeBalance();
      } else {
        employeeBalance.value = 0;
        employeeBalanceLoaded.value = true;
      }
    } catch (error) {
      console.error(
        'Unable to load clock status:',
        error
      );

      isClocked.value = false;
      activeClockSession.value = null;

      employeeBalance.value = 0;
      employeeBalanceLoaded.value = true;
    }
  }

  return {
    token,
    userId,

    username,
    name,
    avatar,

    roles,
    roleId,
    roleName,
    permissions,

    companyId,
    companyName,

    locationId,
    location,
    locations,

    infoLoaded,

    normalizedRole,
    isSystemAdmin,
    isOwnerOrAdmin,
    isOwner,
    isAdmin,
    isManager,
    isEmployee,
    isCheckIn,

    hasPermission,
    hasfaceallowed,

    login,
    getInfo,
    logout,
    resetToken,
    changeLocation,
    rebuildRoutes,
    refreshAvailableLocations,
    forceAccessLogout,

    isClockedIn,
    isClocked,
    activeClockSession,
    setClockedIn,
    loadClockStatus,

    employeeBalance,
    employeeBalanceLoaded,
    employeeBalanceLoading,
    setEmployeeBalance,
    loadEmployeeBalance
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(
      useUserStore,
      import.meta.hot
    )
  );
}
