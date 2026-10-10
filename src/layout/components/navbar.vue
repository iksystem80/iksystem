<template>
  <div class="navbar">

    <Hamburger id="hamburger-container"
               :is-active="sidebar.opened"
               class="hamburger-container"
               @toggleClick="toggleSidebar" />

    <Breadcrumb id="breadcrumb-container" v-if="device !== 'mobile'"
                class="breadcrumb-container" />

    <!-- LOCATION v-if="device !== 'mobile'"-->
    <div class="location-container">
      <div class="location-pill">
        <el-icon class="location-pill-icon">
          <Location />
        </el-icon>

        <span class="location-pill-label">
          {{ location || 'No Location' }}
        </span>
      </div>
    </div>

    <div class="right-menu">

      <div class="right-menu-item hover-effect navbar-circle-control"
           @click="openClockPage">
        <el-icon size="24" class="clock-status-icon" :class="userStore.isClockedIn ? 'is-clocked-in' : 'is-clocked-out'"><Clock /></el-icon>
     </div>

      <template v-if="device !== 'mobile'">

        <ErrorLog v-if="userStore.isSystemAdmin"
                  class="errLog-container right-menu-item hover-effect" />

        <Screenfull id="screenfull"
                    class="right-menu-item hover-effect navbar-circle-control" />

      </template>

      <el-dropdown class="avatar-container right-menu-item hover-effect"
                   trigger="click">
        <div class="avatar-wrapper ">

          <!-- REAL AVATAR -->
          <img v-if="avatar && !avatarLoadFailed"
               :src="avatar"
               class="user-avatar-img"
               @error="avatarLoadFailed = true" />

          <!-- FALLBACK AVATAR -->
          <img v-else
               src="https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif"
               class="user-avatar-img" />

          <el-icon class="el-icon-caret-bottom"
                   size="small">
            <CaretBottom />
          </el-icon>

        </div>

        <template #dropdown>

          <el-dropdown-menu class="user-dropdown-menu">

            <!-- USER INFO -->
            <el-dropdown-item disabled
                              class="user-info-item">
              <div class="user-info">

                <div class="dropdown-avatar-wrapper">

                  <img v-if="avatar && !avatarLoadFailed"
                       :src="avatar"
                       class="dropdown-avatar-img"
                       @error="avatarLoadFailed = true" />

                  <img v-else
                       src="https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif"
                       class="dropdown-avatar-img" />

                </div>

                <div class="user-details">

                  <div class="user-name">
                    {{ userStore.name }}
                  </div>

                  <div class="user-role">
                    {{ userStore.roleName }}
                  </div>

                </div>
              </div>
            </el-dropdown-item>

            <!-- PROFILE -->
            <router-link to="/profile/userprofile">

              <el-dropdown-item divided>

                <el-icon class="dropdown-icon">
                  <User />
                </el-icon>

                <span style="font-size:12px;">
                  My Profile
                </span>

              </el-dropdown-item>

            </router-link>

            <!-- LOCATIONS -->
            <template v-if="userStore.isOwner && locations?.length">

              <el-dropdown-item disabled class="section-title">
                Locations
              </el-dropdown-item>

              <el-dropdown-item v-for="item in locations"
                                :key="item.id ?? item.ID"
                                @click="selectedLocation(item)">

                <el-icon class="dropdown-icon">
                  <Location />
                </el-icon>

                <span class="location-name">
                  {{ item.name }}
                </span>

                <el-icon v-if="
                           String(userStore.locationId) ===
                             String(item.id ?? item.ID)
                         "
                         class="selected-location-icon">
                  <Check />
                </el-icon>

              </el-dropdown-item>

            </template>

            <!-- THEME -->
            <el-dropdown-item disabled class="section-title">
              Theme
            </el-dropdown-item>

            <el-dropdown-item v-for="item in themeOptions"
                              :key="item.value"
                              @click="changeTheme(item.value)">

              <span class="theme-dot" :style="{ backgroundColor: item.color }" />

              <span style="font-size:12px;">
                {{ item.label }}
              </span>

              <el-icon v-if="settingsStore.theme === item.value"
                       class="selected-location-icon">
                <Check />
              </el-icon>

            </el-dropdown-item>

            <!-- LOGOUT -->
            <el-dropdown-item divided
                              @click="logout">

              <el-icon class="dropdown-icon logout-icon">
                <SwitchButton />
              </el-icon>

              <span class="logout-text">
                Log out
              </span>

            </el-dropdown-item>

          </el-dropdown-menu>

        </template>
      </el-dropdown>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';

import {
  CaretBottom,
  Location,
  Check,
  User,
  SwitchButton
} from '@element-plus/icons-vue';

import Breadcrumb from '@/components/breadcrumb';
import Hamburger from '@/components/hamburger';
import ErrorLog from '@/components/errorlog';
import Screenfull from '@/components/screenfull';
import { useAppStore } from '@/store/modules/app';
import { useUserStore } from '@/store/modules/user';
import { useSettingsStore } from '@/store/modules/settings';
import type { AppTheme } from '@/utils/theme';

defineOptions({
  name: 'Navbar'
});

interface LocationItem {
      id?: string | number
      ID?: string | number
      name: string
}

const appStore = useAppStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

const router = useRouter();
const route = useRoute();

const {
  sidebar,
  device
} = storeToRefs(appStore);

const {
  avatar,
  locations,
  location
} = storeToRefs(userStore);

const themeOptions: Array<{ label: string; value: AppTheme; color: string }> = [
  { label: 'Light', value: 'light', color: '#887baf' },
  { label: 'Dark', value: 'dark', color: '#181b20' },
  { label: 'Coffee', value: 'coffee', color: '#6f4e37' },
  { label: 'Blue', value: 'blue', color: '#2563eb' },
  { label: 'Orange', value: 'orange', color: '#ea580c' }
];

function changeTheme(theme: AppTheme) {
  settingsStore.changeSetting({
    key: 'theme',
    value: theme
  });
}

function openClockPage() {
  router.push({
    name: 'EmployeeClock'
  });
}

const avatarLoadFailed = ref(false);

watch(
  avatar,
  () => {
    avatarLoadFailed.value = false;
  }
);

/**
     * Toggle sidebar.
     */
function toggleSidebar() {
  appStore.toggleSidebar();
}

/**
     * Logout user.
     */
async function logout() {
  await userStore.logout();
  await router.push('/login');
}

/**
     * Change current location.
     */
async function selectedLocation(item: LocationItem) {
  const locationId = item.ID ?? item.id;

  if (locationId === undefined || locationId === null) {
    return;
  }

  await userStore.changeLocation(
    String(locationId),
    item.name
  );

  await router.replace({
    path: '/redirect' + route.fullPath
  });
}
</script>

<style scoped lang="scss">
.theme-dot {
  width: 10px;
  height: 10px;
  margin-right: 10px;
  border-radius: 50%;
  border: 1px solid var(--el-border-color);
  flex: 0 0 auto;
}


</style>
