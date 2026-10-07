<template>
  <span class="photo-preview-trigger"
        :class="{ disabled: !src }"
        :title="src ? title : emptyTitle"
        @click.stop="openPreview">
    <el-icon class="photo-indicator"
             :class="src ? activeClass : emptyClass">
      <PictureFilled />
    </el-icon>

    <el-image ref="previewRef"
              :src="src"
              :preview-src-list="src ? [src] : []"
              preview-teleported
              style="display: none" />
  </span>
</template>

<script setup>
import { nextTick, ref } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'View photo'
  },
  emptyTitle: {
    type: String,
    default: 'No photo'
  },
  activeClass: {
    type: String,
    default: 'approved'
  },
  emptyClass: {
    type: String,
    default: 'pending'
  }
})

const previewRef = ref(null)

async function openPreview() {
  if (!props.src) return

  await nextTick()
  previewRef.value?.showPreview?.()
}
</script>

<style scoped>
  .photo-preview-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    cursor: pointer;
  }

    .photo-preview-trigger:hover {
      opacity: 0.75;
    }

    .photo-preview-trigger.disabled {
      cursor: default;
    }

      .photo-preview-trigger.disabled:hover {
        opacity: 1;
      }
</style>
