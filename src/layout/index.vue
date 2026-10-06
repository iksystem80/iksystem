<template>
  <div :class="classObj" class="app-wrapper">
    <div v-if="device === 'mobile' && sidebar.opened"
         class="drawer-bg"
         @click="handleClickOutside" />

    <Sidebar class="sidebar-container" />

    <div :class="{
           hasTagsView: needTagsView,
           hasFixedHeader: fixedHeader
         }"
         class="main-container">
      <div :class="{ 'fixed-header': fixedHeader }">
        <Navbar />

        <TagsView v-if="needTagsView" />
      </div>

      <!-- Only this area scrolls -->
      <div class="app-main-scroll">
        <AppMain />
      </div>

      <!--<RightPanel v-if="showSettings">
                <Settings />
            </RightPanel>-->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AppMain, Navbar, Sidebar, TagsView } from './components';

import { useAppStore } from '@/store/modules/app';
import { useUserStore } from '@/store/modules/user';
import { useSettingsStore } from '@/store/modules/settings';

// Vue 3 replacement for ResizeMixin
import { useResizeHandler } from './composables/useresizehandler';
import { initializeSocketListeners } from '@/services/socketlisteners';

const appStore = useAppStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

// Initialize resize handling
useResizeHandler();

initializeSocketListeners(userStore.locationId);

const sidebar = computed(() => appStore.sidebar);
const device = computed(() => appStore.device); const needTagsView = computed(() => settingsStore.tagsView);
const fixedHeader = computed(() => settingsStore.fixedHeader);

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

