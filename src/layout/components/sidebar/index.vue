<template>
  <div :class="{ 'has-logo': showLogo }">
    <Logo v-if="showLogo" :collapse="isCollapse" />

    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu class="left-menu"
               :default-active="activeMenu"
               :collapse="isCollapse"
               :background-color="variables.menuBg"
               :text-color="variables.menuText"
               :unique-opened="false"
               :active-text-color="variables.menuActiveText"
               :collapse-transition="false"
               mode="vertical">
        <SidebarItem v-for="route in sidebarRoutes"
                     :key="route.path"
                     :item="route"
                     :base-path="route.path"
                     :is-top-route="true" />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

import Logo from './logo.vue';
import SidebarItem from './sidebaritem.vue';

import { useAppStore } from '@/store/modules/app';
import { usePermissionStore } from '@/store/modules/permission';
import { useSettingsStore } from '@/store/modules/settings';
import { useUserStore } from '@/store/modules/user';

defineOptions({
  name: 'Sidebar'
});

const route = useRoute();
const appStore = useAppStore();
const permissionStore = usePermissionStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const { sidebar } = storeToRefs(appStore);
const { routes: permissionRoutes } = storeToRefs(permissionStore);
const { secondMenuPopup, sidebarLogo } = storeToRefs(settingsStore);

const variables = {
  menuBg: '#304156',
  menuText: '#fff',
  menuActiveText: '#409EFF'
};

// ============================================================
// EMPLOYEE ACCESS STATE
// ============================================================

async function refreshEmployeeAccess() {
  if (!userStore.isEmployee) {
    return;
  }

  await userStore.loadClockStatus();
}

onMounted(() => {
  void refreshEmployeeAccess();
});

watch(
  () => userStore.locationId,
  () => {
    if (userStore.isEmployee) {
      void refreshEmployeeAccess();
    }
  }
);

// ============================================================
// SIDEBAR ROUTES
// ============================================================

const sidebarRoutes = computed(() => {
  // Clocked-out employees cannot access the normal application menu.
  if (
    userStore.isEmployee &&
    !userStore.isClockedIn
  ) {
    return [];
  }

  // A clocked-in employee with no current bank balance can use only
  // Transaction so they can receive/enter an Opening Bank or Add Bank.
  //
  // While the balance is still loading we also expose Transaction only.
  // This prevents the rest of the menu briefly appearing before finance
  // has been verified.
  if (
    userStore.isEmployee &&
    (
      !userStore.employeeBalanceLoaded ||
      Number(userStore.employeeBalance || 0) <= 0
    )
  ) {
    return permissionRoutes.value.filter(
      route => route.path === '/transaction'
    );
  }

  // System Admin only sees the System section.
  if (userStore.isSystemAdmin) {
    return permissionRoutes.value.filter(
      route => route.path === '/system'
    );
  }

  return permissionRoutes.value;
});

// ============================================================
// ACTIVE MENU
// ============================================================

const activeMenu = computed(() => {
  const { meta, path } = route;

  if (meta?.activeMenu) {
    return meta.activeMenu as string;
  }

  return path;
});

// ============================================================
// SHOW LOGO
// ============================================================

const showLogo = computed(() => {
  return sidebarLogo.value;
});

// ============================================================
// SIDEBAR COLLAPSE
// ============================================================

const isCollapse = computed(() => {
  if (secondMenuPopup.value) {
    return true;
  }

  return !sidebar.value.opened;
});
</script>
