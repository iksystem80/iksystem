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
        import { computed } from 'vue'
        import RightPanel from '@/components/RightPanel'
        import { AppMain, Navbar, Settings, Sidebar, TagsView } from './components'

        import { useAppStore } from '@/store/modules/app'
        import { useUserStore } from '@/store/modules/user'
        import { useSettingsStore } from '@/store/modules/settings'

        // Vue 3 replacement for ResizeMixin
        import { useResizeHandler } from './composables/useResizeHandler'
        import { initializeSocketListeners } from '@/services/socketListeners'

        const appStore = useAppStore()
        const userStore = useUserStore()
        const settingsStore = useSettingsStore()

        // Initialize resize handling
        useResizeHandler()

        initializeSocketListeners(userStore.locationId)

        const sidebar = computed(() => appStore.sidebar)
        const device = computed(() => appStore.device)
        const showSettings = computed(() => settingsStore.showSettings)
        const needTagsView = computed(() => settingsStore.tagsView)
        const fixedHeader = computed(() => settingsStore.fixedHeader)

        const classObj = computed(() => ({
            hideSidebar: !sidebar.value.opened,
            openSidebar: sidebar.value.opened,
            withoutAnimation: sidebar.value.withoutAnimation,
            mobile: device.value === 'mobile'
        }))

        function handleClickOutside() {
            appStore.closeSidebar(false)
        }
</script>

<style lang="scss" scoped>
    @use "@/styles/mixin.scss";

    /* ============================================================
       PAGE SCROLL
       Keep the browser/body from scrolling.
       Only .app-main-scroll should scroll.
    ============================================================ */

    :global(html),
    :global(body),
    :global(#app) {
        height: 100%;
        overflow: hidden;
    }

    .app-wrapper {
        @include mixin.clearfix;
        position: relative;
        width: 100%;
        height: 100vh;
        overflow: hidden;

        &.mobile.openSidebar {
            position: fixed;
            top: 0;
        }
    }

    .main-container {
        height: 100vh;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .app-main-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        margin-bottom:0px;
    }
    @media (max-width: 700px) {
        .app-main-scroll {
            margin-bottom: 0px;
        }
    }

        /*
       When header is fixed it is removed from the normal document flow,
       so reserve its height above the AppMain scroll area.

       Navbar: 50px
       TagsView: 34px
    */
        .main-container.hasFixedHeader .app-main-scroll {
            margin-top: 50px;
        }

        .main-container.hasFixedHeader.hasTagsView .app-main-scroll {
            margin-top: 77px;
        }


        /* ============================================================
       SIDEBAR
    ============================================================ */

        .sidebar-container {
            position: relative;
            background: linear-gradient( 135deg, #09090b 0%, #18181b 45%, #27272a 100% ) !important;
            overflow: hidden;
        }

            .sidebar-container::before {
                content: "";
                position: absolute;
                width: 260px;
                height: 260px;
                top: -80px;
                left: -80px;
                border-radius: 50%;
                background: radial-gradient( circle, rgba(139, 92, 246, 0.28) 0%, rgba(139, 92, 246, 0.10) 42%, transparent 72% );
                pointer-events: none;
                animation: sidebarGlowOne 8s ease-in-out infinite;
            }

            .sidebar-container::after {
                content: "";
                position: absolute;
                width: 300px;
                height: 300px;
                right: -150px;
                bottom: -130px;
                border-radius: 50%;
                background: radial-gradient( circle, rgba(37, 99, 235, 0.4) 0%, rgba(37, 99, 235, 0.12) 40%, transparent 72% );
                pointer-events: none;
                animation: sidebarGlowTwo 10s ease-in-out infinite;
            }

        @keyframes sidebarGlowOne {
            0%, 100% {
                transform: translate(0, 0);
            }

            50% {
                transform: translate(30px, 25px);
            }
        }

        @keyframes sidebarGlowTwo {
            0%, 100% {
                transform: translate(0, 0);
            }

            50% {
                transform: translate(-25px, -20px);
            }
        }

        :deep(.sidebar-container .el-menu) {
            background: transparent !important;
            border-right: none !important;
        }

        :deep(.sidebar-container .el-menu-item),
        :deep(.sidebar-container .el-sub-menu__title) {
            color: #d4d4d8 !important;
            background: transparent !important;
            transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease !important;
        }

        :deep(.sidebar-container .el-menu-item:hover),
        :deep(.sidebar-container .el-sub-menu__title:hover) {
            color: #ffffff !important;
            background: rgba(167, 139, 250, 0.10) !important;
        }

        :deep(.sidebar-container .el-menu-item.is-active) {
            color: #ffffff !important;
            background: linear-gradient( 90deg, rgba(167, 139, 250, 0.22), rgba(129, 140, 248, 0.12) ) !important;
            border-left: 3px solid #a78bfa;
        }


        /* ============================================================
       DRAWER
    ============================================================ */

        .drawer-bg {
            background: #000;
            opacity: 0.3;
            width: 100%;
            top: 0;
            height: 100%;
            position: absolute;
            z-index: 999;
        }


        /* ============================================================
       FIXED HEADER
    ============================================================ */

        .fixed-header {
            position: fixed;
            top: 0;
            right: 0;
            z-index: 9;
            width: calc(100% - var(--side-bar-width));
            transition: width 0.28s;
        }

        .hideSidebar .fixed-header {
            width: calc(100% - 54px);
        }

        .mobile .fixed-header {
            width: 100%;
        }


        .app-main-scroll {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior: contain;
            scrollbar-gutter: stable;
            scrollbar-width: thin;
            scrollbar-color: var(--el-border-color) transparent;
        }

            /* Chrome / Edge / Safari */
            .app-main-scroll::-webkit-scrollbar {
                width: 8px;
            }

            .app-main-scroll::-webkit-scrollbar-track {
                background: transparent;
            }

            .app-main-scroll::-webkit-scrollbar-thumb {
                background: var(--el-border-color);
                border-radius: 20px;
                border: 1px solid transparent;
                background-clip: padding-box;
            }

                .app-main-scroll::-webkit-scrollbar-thumb:hover {
                    background: var(--el-color-primary-light-5);
                    border: 1px solid transparent;
                    background-clip: padding-box;
                }
</style>
