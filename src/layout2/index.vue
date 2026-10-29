<template>
  <div :class="classObj" class="app-wrapper layout-two">
    <div
      v-if="device === 'mobile' && sidebar.opened"
      class="drawer-bg"
      @click="handleClickOutside"
    />

    <div class="layout-two-header">
      <Navbar />
    </div>

    <Sidebar class="sidebar-container layout-two-sidebar" />

    <div
      :class="{ hasTagsView: needTagsView }"
      class="main-container layout-two-main"
    >
      <div v-if="needTagsView" class="layout-two-tags">
        <TagsView />
      </div>

      <div class="app-main-scroll layout-two-scroll">
        <AppMain />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AppMain, Navbar, Sidebar, TagsView } from './components';
import { useAppStore } from '@/store/modules/app';
import { useUserStore } from '@/store/modules/user';
import { useSettingsStore } from '@/store/modules/settings';
import { useResizeHandler } from './composables/useresizehandler';
import { initializeSocketListeners } from '@/services/socketlisteners';

const appStore = useAppStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

useResizeHandler();
initializeSocketListeners(userStore.locationId, userStore.companyId);

const sidebar = computed(() => appStore.sidebar);
const device = computed(() => appStore.device);
const needTagsView = computed(() => settingsStore.tagsView);

const classObj = computed(() => ({
  hideSidebar: !sidebar.value.opened,
  openSidebar: sidebar.value.opened,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile'
}));

function handleClickOutside() {
  appStore.closeSidebar(false);
}
</script>

<style scoped lang="scss">
.layout-two {
  --layout-two-header-height: 50px;
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.layout-two-header {
  position: fixed;
  inset: 0 0 auto 0;
  height: var(--layout-two-header-height);
  z-index: 2002;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.layout-two :deep(.navbar) {
  height: var(--layout-two-header-height);
  min-height: var(--layout-two-header-height);
}

.layout-two :deep(.sidebar-container) {
  top: var(--layout-two-header-height) !important;
  height: calc(100vh - var(--layout-two-header-height)) !important;
}

.layout-two-main {
  height: calc(100vh - var(--layout-two-header-height));
  margin-top: var(--layout-two-header-height);
  min-height: 0;
  overflow: hidden;
}

.layout-two-tags {
  flex: 0 0 auto;
}

.layout-two-scroll {
  margin-top: 0 !important;
}

@media (max-width: 768px) {
  .layout-two-main {
    margin-left: 0 !important;
    width: 100%;
  }
}
</style>
