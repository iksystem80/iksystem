<template>
  <el-scrollbar ref="scrollContainer"
                :vertical="false"
                class="scroll-container"
                @wheel.prevent="handleScroll">
    <slot />
  </el-scrollbar>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue';

defineOptions({
  name: 'ScrollPane'
});

const tagAndTagSpacing = 4;

/**
     * Element Plus scrollbar ref
     */
const scrollContainer = ref<any>(null);

/**
     * Get the actual scrollable wrapper.
     *
     * Element Plus exposes the wrapper through:
     * scrollbar.$refs.wrapRef
     */
const scrollWrapper = computed<HTMLElement | null>(() => {
  return scrollContainer.value?.$refs?.wrapRef || null;
});

/**
     * Emit scroll event to parent.
     */
const emit = defineEmits<{(e: 'scroll'): void
    }>();

/**
     * Handle mouse wheel.
     *
     * Converts vertical mouse-wheel movement into
     * horizontal scrolling.
     */
function handleScroll(event: WheelEvent) {
  const wrapper = scrollWrapper.value;

  if (!wrapper) {
    return;
  }

  const delta =
            event.deltaY ||
            event.deltaX ||
            0;

  wrapper.scrollLeft += delta;
}

/**
     * Native scroll listener.
     */
function handleNativeScroll() {
  emit('scroll');
}

/**
     * Move the supplied tag into the visible area.
     *
     * currentTag must be an HTMLElement.
     */
async function moveToTarget(
  currentTag: HTMLElement | null
) {
  await nextTick();

  const wrapper = scrollWrapper.value;

  if (!wrapper || !currentTag) {
    return;
  }

  const container =
            scrollContainer.value?.$el as HTMLElement | undefined;

  if (!container) {
    return;
  }

  const containerWidth =
            container.offsetWidth;

  const tagLeft =
            currentTag.offsetLeft;

  const tagRight =
            tagLeft +
            currentTag.offsetWidth;

  const currentScrollLeft =
            wrapper.scrollLeft;

  const visibleLeft =
            currentScrollLeft;

  const visibleRight =
            currentScrollLeft +
            containerWidth;

  /**
         * Tag is outside the right side.
         */
  if (
    tagRight >
            visibleRight
  ) {
    wrapper.scrollLeft =
                tagRight -
                containerWidth +
                tagAndTagSpacing;

    return;
  }

  /**
         * Tag is outside the left side.
         */
  if (
    tagLeft <
            visibleLeft
  ) {
    wrapper.scrollLeft =
                tagLeft -
                tagAndTagSpacing;
  }
}

/**
     * Expose methods to parent component.
     *
     * TagsView uses:
     *
     * scrollPane.value?.moveToTarget(element)
     */
defineExpose({
  moveToTarget
});

onMounted(() => {
  const wrapper = scrollWrapper.value;

  if (wrapper) {
    wrapper.addEventListener(
      'scroll',
      handleNativeScroll,
      true
    );
  }
});

onBeforeUnmount(() => {
  const wrapper = scrollWrapper.value;

  if (wrapper) {
    wrapper.removeEventListener(
      'scroll',
      handleNativeScroll,
      true
    );
  }
});
</script>

<style lang="scss" scoped>
    .scroll-container {
        white-space: nowrap;
        position: relative;
        overflow: hidden;
        width: 100%;

        :deep(.el-scrollbar__bar) {
            bottom: 0;
        }

        :deep(.el-scrollbar__wrap) {
            height: 34px;
        }
    }
</style>
