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
import { storeToRefs } from 'pinia';
import { useTagsViewStore } from '@/store/modules/tagsview';

defineOptions({
  name: 'AppMain'
});

const tagsViewStore = useTagsViewStore();

const { cachedViews } = storeToRefs(tagsViewStore);
</script>

