<template>
  <el-button class=""
             circle
             :loading="loading"
             :disabled="disabled || loading"
             aria-label="Export PDF"
             @click="$emit('click')">
    <el-icon v-if="!loading"><Download /></el-icon>
  </el-button>
</template>

<script setup>
defineProps({
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
});

defineEmits(['click']);
</script>
