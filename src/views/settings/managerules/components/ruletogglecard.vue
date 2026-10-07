<template>
  <el-card shadow="never" class="toggle-rule-card" :class="{ enabled: modelValue }" :style="{
    '--rule-accent': accent,
    '--rule-accent-soft': accentSoft
  }">
    <el-checkbox :model-value="modelValue" size="large" @update:model-value="$emit('update:modelValue', $event)">
      <div class="rule-title-wrap">
        <strong>{{ title }}</strong>
        <small>{{ description }}</small>
      </div>
    </el-checkbox>
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

