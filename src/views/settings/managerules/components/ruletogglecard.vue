<template>
  <el-card
    shadow="never"
    class="toggle-rule-card"
    :class="{ enabled: modelValue }"
    :style="{
      '--rule-accent': accent,
      '--rule-accent-soft': accentSoft
    }"
  >
    <div class="rule-card-header">
      <div class="rule-heading">
        <strong>{{ title }}</strong>
        <small>{{ description }}</small>
      </div>
      <div class="rule-toggle">
        <span class="rule-status">{{ modelValue ? 'Enabled' : 'Disabled' }}</span>
        <el-switch :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" />
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },

  accent: {
    type: String,
    default: 'var(--el-color-primary)'
  },

  accentSoft: {
    type: String,
    default: 'var(--el-color-primary-light-9)'
  }
});

defineEmits(['update:modelValue']);
</script>
