<template>
  <span class="points-badge">
    <el-icon class="points-badge__icon"><Coin /></el-icon>
    <span class="points-badge__value">{{ displayPoints }}</span>
    <span class="points-badge__label">PTS</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { Coin } from '@element-plus/icons-vue';

const props = defineProps({
  points: {
    type: [Number, String],
    default: 0
  }
});

const displayPoints = computed(() => {
  const value = Number(props.points);
  return Number.isFinite(value) ? value : 0;
});
</script>

<style scoped lang="scss">
.points-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 26px;
  padding: 4px 10px;
  white-space: nowrap;
  color: color-mix(in srgb, var(--yellow) 68%, var(--el-text-color-primary));
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--yellow) 18%, var(--app-surface)) 0%,
    color-mix(in srgb, var(--yellow) 48%, var(--app-surface)) 100%
  );
  border: 1px solid color-mix(in srgb, var(--yellow) 68%, var(--app-surface));
  border-radius: 999px;
  box-shadow: 0 3px 10px color-mix(in srgb, var(--yellow) 24%, transparent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.points-badge__icon {
  flex: 0 0 auto;
  font-size: 14px;
  color: color-mix(in srgb, var(--yellow) 82%, var(--el-text-color-primary));
}

.points-badge__value {
  font-weight: 800;
}

.points-badge__label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.82;
}
</style>
