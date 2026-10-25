<template>
  <el-config-provider :size="size" :z-index="zIndex">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '@/store/modules/app';
import { onMounted, onBeforeUnmount } from 'vue'

const appStore = useAppStore();

const { size } = storeToRefs(appStore); const zIndex = ref(3000);

function handleImagePreviewClick(event) {
  const target = event.target

  // Close only when clicking the dark background,
  // not the image or preview controls.
  if (target instanceof Element && target.classList.contains('el-image-viewer__mask')) {
    document.querySelector('.el-image-viewer__close')?.click()
  }
}

onMounted(() => {
  document.addEventListener('click', handleImagePreviewClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleImagePreviewClick)
})

</script>
