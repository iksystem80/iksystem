<template>
  <span class="menu-item">
    <el-icon v-if="icon && icon.includes('el-icon')"
             class="sub-el-icon">
      <component :is="iconComponent" />
    </el-icon>

    <svg-icon v-else-if="icon"
              :icon-class="icon" />

    <span v-if="title" class="menu-item-title">
      {{ title }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

    interface Props {
        icon?: string
        title?: string
    }

const props = withDefaults(
  defineProps<Props>(),
  {
    icon: '',
    title: ''
  }
);

const iconComponent = computed(() => {
  if (!props.icon) {
    return null;
  }

  /*
         * Convert:
         *   el-icon-user
         *
         * to the corresponding Element Plus icon component.
         *
         * This assumes the icon has been globally registered
         * in main.ts.
         */
  return props.icon;
});
</script>

<style scoped>
    .sub-el-icon {
        color: currentColor;
        width: 1em;
        height: 1em;
    }

    .menu-item {
        display: inline-flex;
        align-items: center;
    }

    .menu-item-title {
        margin-left: 4px;
    }
</style>
