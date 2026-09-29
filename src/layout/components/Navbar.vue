<template>
    <div class="navbar">

        <Hamburger id="hamburger-container"
                   :is-active="sidebar.opened"
                   class="hamburger-container"
                   @toggleClick="toggleSidebar" />

        <Breadcrumb id="breadcrumb-container"
                    class="breadcrumb-container" />

        <!-- LOCATION -->
        <div v-if="device !== 'mobile'"
             class="location-container">
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

            <template v-if="device !== 'mobile'">

                <!--<Search id="header-search"
                        class="right-menu-item" />-->

                <span class="right-menu-item clock-menu-item"
                      style="cursor: pointer; height: 50px; align-items: center; justify-content: center; "
                      @click="openClockPage">
                    <el-icon v-if="userStore.isClockedIn" size="24" style="color:forestgreen;margin-top:13px;"><Clock /></el-icon>
                    <el-icon v-else size="24" style="color:indianred;margin-top:13px;"><Clock /></el-icon>
                </span>

                <ErrorLog v-if="userStore.isSystemAdmin"
                          class="errLog-container right-menu-item hover-effect" />

                <Screenfull id="screenfull"
                            class="right-menu-item hover-effect" />

            </template>

            <el-dropdown class="avatar-container right-menu-item hover-effect"
                         trigger="click">
                <div class="avatar-wrapper">

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
                        <template v-if="
                userStore.isOwner &&
                locations?.length
              ">

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
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import {
      CaretBottom,
      Location,
      Check,
      User,
      SwitchButton
} from '@element-plus/icons-vue'

import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'
import ErrorLog from '@/components/ErrorLog'
import Screenfull from '@/components/Screenfull'
import Search from '@/components/HeaderSearch'

import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'

defineOptions({
      name: 'Navbar'
})

interface LocationItem {
      id?: string | number
      ID?: string | number
      name: string
}

const appStore = useAppStore()
const userStore = useUserStore()

const router = useRouter()
const route = useRoute()

const {
      sidebar,
      device
} = storeToRefs(appStore)

const {
      avatar,
      locations,
      location
} = storeToRefs(userStore)

function openClockPage() {
    router.push({
        name: 'EmployeeClock'
    })
}

const avatarLoadFailed = ref(false)

watch(
      avatar,
      () => {
        avatarLoadFailed.value = false
      }
)

/**
     * Toggle sidebar.
     */
function toggleSidebar() {
      appStore.toggleSidebar()
}

/**
     * Logout user.
     */
async function logout() {
      await userStore.logout()
      await router.push('/login')
}

/**
     * Change current location.
     */
async function selectedLocation(item: LocationItem) {
      const locationId = item.ID ?? item.id

      if (locationId === undefined || locationId === null) {
        return
      }

      await userStore.changeLocation(
        String(locationId),
        item.name
      )

      await router.replace({
        path: '/redirect' + route.fullPath
      })
}
</script>

<style lang="scss" scoped>

    .clock-menu-item {
    }

        .clock-menu-item:hover {
            background: var(--el-fill-color-light);
        }

     .navbar {
         height: 50px;
         overflow: hidden;
         position: relative;
         background: rgba(255, 255, 255, 0.96);
         box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
         backdrop-filter: blur(8px);

         .hamburger-container {
             line-height: 46px;
             height: 100%;
             float: left;
             cursor: pointer;
             transition: background 0.3s;
             -webkit-tap-highlight-color: transparent;

             &:hover {
                 background: rgba(0, 0, 0, 0.025);
             }
         }

         .breadcrumb-container {
             float: left;
         }

         .errLog-container {
             display: inline-block;
             vertical-align: top;
         }

         .right-menu {
             float: right;
             height: 100%;
             line-height: 50px;

             &:focus {
                 outline: none;
             }

             .right-menu-item {
                 display: inline-block;
                 padding: 0 8px;
                 height: 100%;
                 line-height: 50px;
                 font-size: 18px;
                 color: #5a5e66;
                 vertical-align: text-bottom;

                 &.hover-effect {
                     cursor: pointer;
                     transition: background 0.3s;

                     &:hover {
                         background: rgba(0, 0, 0, 0.025);
                     }
                 }
             }
         }
     }

     /* ==========================================================
    LOCATION
    ========================================================== */

     .location-container {
         position: absolute;
         left: 50%;
         top: 50%;
         transform: translate(-50%, -50%);
         z-index: 2;
     }

     .location-pill {
         display: inline-flex;
         align-items: center;
         gap: 7px;
         max-width: 300px;
         padding: 6px 13px;
         border-radius: 999px;
         background: linear-gradient( 135deg, rgba(64, 158, 255, 0.10), rgba(103, 194, 58, 0.08) );
         border: 1px solid rgba(64, 158, 255, 0.15);
         box-shadow: 0 2px 8px rgba(0, 0, 0, 0.035);
         color: var(--el-text-color-primary);
         transition: background 0.2s ease, border-color 0.2s ease;
     }

         .location-pill:hover {
             background: rgba(64, 158, 255, 0.12);
             border-color: rgba(64, 158, 255, 0.25);
         }

     .location-pill-icon {
         flex-shrink: 0;
         font-size: 15px;
         color: var(--el-color-primary);
     }

     .location-pill-label {
         overflow: hidden;
         white-space: nowrap;
         text-overflow: ellipsis;
         font-size: 13px;
         font-weight: 650;
         letter-spacing: 0.1px;
     }

     /* ==========================================================
    AVATAR
    ========================================================== */

     .avatar-container {
         margin-right: 10px;
     }

     .avatar-wrapper {
         position: relative;
         display: flex;
         align-items: center;
         height: 50px;
         padding-right: 12px;
     }

     .user-avatar-img {
         width: 38px;
         height: 38px;
         border-radius: 50%;
         cursor: pointer;
         object-fit: cover;
         background: var(--el-fill-color-light);
         border: 2px solid var(--el-border-color-lighter);
         box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
     }

     .el-icon-caret-bottom {
         position: absolute;
         right: -6px;
         bottom: 7px;
         cursor: pointer;
         font-size: 11px;
         color: var(--el-text-color-secondary);
     }

     /* ==========================================================
    DROPDOWN
    ========================================================== */

     .user-dropdown-menu {
         min-width: 240px;
         padding: 8px;
     }

     .user-info-item {
         cursor: default !important;
         padding: 12px 14px !important;
     }

     .user-info {
         display: flex;
         align-items: center;
         gap: 12px;
         width: 100%;
     }

     .dropdown-avatar-wrapper {
         width: 40px;
         height: 40px;
         flex-shrink: 0;
     }

     .dropdown-avatar-img {
         width: 40px;
         height: 40px;
         border-radius: 50%;
         object-fit: cover;
         background: var(--el-fill-color-light);
         border: 1px solid var(--el-border-color-lighter);
     }

     .user-details {
         min-width: 0;
     }

     .user-name {
         font-size: 14px;
         font-weight: 600;
         color: var(--el-text-color-primary);
         white-space: nowrap;
         overflow: hidden;
         text-overflow: ellipsis;
     }

     .user-role {
         margin-top: 2px;
         font-size: 12px;
         color: var(--el-text-color-secondary);
     }

     .dropdown-icon {
         margin-right: 8px;
         font-size: 16px;
     }

     .section-title {
         font-size: 11px;
         font-weight: 600;
         text-transform: uppercase;
         letter-spacing: 0.6px;
         color: var(--el-text-color-secondary) !important;
         cursor: default !important;
     }

    .location-name {
        flex: 1;
        font-size: 12px;
        font-weight: 600;
    }

     .selected-location-icon {
         margin-left: auto;
         color: var(--el-color-success);
     }

     .logout-icon,
     .logout-text {
         color: var(--el-color-danger);
     }
</style>
