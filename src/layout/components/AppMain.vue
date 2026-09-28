<template>
    <section class="app-main">
        <router-view v-slot="{ Component, route }">
            <transition name="fade-transform" mode="out-in">
                <keep-alive :include="cachedViews">
                    <component :is="Component"
                               :key="route.fullPath" />
                </keep-alive>
            </transition>
        </router-view>
    </section>
</template>

<script setup lang="ts">
    import { storeToRefs } from 'pinia'
    import { useTagsViewStore } from '@/store/modules/tagsView'

    defineOptions({
        name: 'AppMain'
    })

    const tagsViewStore = useTagsViewStore()

    const { cachedViews } = storeToRefs(tagsViewStore)
</script>

<style lang="scss" scoped>
    .app-main {
        /* 50 = navbar */
        min-height: calc(100vh - 50px);
        width: 100%;
        position: relative;
        overflow: hidden;
    }

    .fixed-header + .app-main {
        padding-top: 50px;
    }

    .hasTagsView {
        .app-main {
            /* 84 = navbar + tags-view = 50 + 34 */
            min-height: calc(100vh - 84px);
        }

        .fixed-header + .app-main {
            padding-top: 84px;
        }
    }
</style>

<style lang="scss">
    /* Fix CSS style bug when opening el-dialog */
    .el-popup-parent--hidden {
        .fixed-header {
            padding-right: 15px;
        }
    }
</style>