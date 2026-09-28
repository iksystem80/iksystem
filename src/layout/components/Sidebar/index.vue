<template>
    <div :class="{ 'has-logo': showLogo }">

        <Logo v-if="showLogo"
              :collapse="isCollapse" />

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
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import Logo from './Logo.vue'
import SidebarItem from './SidebarItem.vue'

import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useSettingsStore } from '@/store/modules/settings'
import { useUserStore } from '@/store/modules/user'

defineOptions({
        name: 'Sidebar'
})

const route =
        useRoute()

const appStore =
        useAppStore()

const permissionStore =
        usePermissionStore()

const settingsStore =
        useSettingsStore()

const userStore =
        useUserStore()

const {
        sidebar
} = storeToRefs(
        appStore
)

const {
        routes: permissionRoutes
} = storeToRefs(
        permissionStore
)

const {
        secondMenuPopup,
        sidebarLogo
} = storeToRefs(
        settingsStore
)

const variables = {
        menuBg: '#304156',
        menuText: '#fff',
        menuActiveText: '#409EFF'
}

// ============================================================
// SIDEBAR ROUTES
//
// SYSTEM ADMIN:
// Only show /system
//
// EVERYONE ELSE:
// Use normal permission-filtered routes
// ============================================================

const sidebarRoutes = computed(() => {

        if (
            userStore.isSystemAdmin
        ) {
            return permissionRoutes.value.filter(
                route =>
                    route.path === '/system'
            )
        }

        return permissionRoutes.value
})

// ============================================================
// ACTIVE MENU
// ============================================================

const activeMenu = computed(() => {

        const {
            meta,
            path
        } = route

        if (
            meta?.activeMenu
        ) {
            return meta.activeMenu as string
        }

        return path
})

// ============================================================
// SHOW LOGO
// ============================================================

const showLogo = computed(() => {
        return sidebarLogo.value
})

// ============================================================
// SIDEBAR COLLAPSE
// ============================================================

const isCollapse = computed(() => {

        if (
            secondMenuPopup.value
        ) {
            return true
        }

        return !sidebar.value.opened
})
</script>