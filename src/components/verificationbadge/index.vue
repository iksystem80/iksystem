<template>
  <span
    class="verification-badge"
    :class="[
      `verification-badge--${normalizedStatus}`,
      {
        'is-clickable': clickable,
        'is-icon-only': iconOnly
      }
    ]"
    role="status"
    @click="handleClick"
  >
    <el-icon class="verification-badge__icon">
      <CircleCheckFilled v-if="normalizedStatus === 'verified'" />
      <Unlock v-else-if="normalizedStatus === 'bypass'" />
      <WarningFilled v-else />
    </el-icon>
    <span v-if="!iconOnly" class="verification-badge__label">{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import {
  CircleCheckFilled,
  Unlock,
  WarningFilled
} from '@element-plus/icons-vue';

const props = defineProps({
  status: {
    type: String,
    default: 'Unverified'
  },
  clickable: {
    type: Boolean,
    default: false
  },
  iconOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const normalizedStatus = computed(() => {
  const value = String(props.status || '').trim().toLowerCase();
  if (value === 'verified') return 'verified';
  if (value === 'bypass') return 'bypass';
  return 'unverified';
});

const label = computed(() => {
  if (normalizedStatus.value === 'verified') return 'Verified';
  if (normalizedStatus.value === 'bypass') return 'Bypass';
  return 'Unverified';
});

function handleClick(event) {
  if (props.clickable) emit('click', event);
}
</script>

<style scoped>
.verification-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 26px;
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  user-select: none;
}

.verification-badge__icon {
  font-size: 14px;
}

.verification-badge--verified {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-7);
}

.verification-badge--unverified {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger-light-7);
}

.verification-badge--bypass {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-7);
}

.verification-badge.is-clickable {
  cursor: pointer;
  transition: filter 0.2s ease, transform 0.2s ease;
}

.verification-badge.is-clickable:hover {
  filter: brightness(0.96);
  transform: translateY(-1px);
}
</style>

<style scoped>
.verification-badge.is-icon-only {
  width: 26px;
  height: 26px;
  min-height: 0;
  padding: 0;
  border: 0 !important;
  background: transparent !important;
  border-radius: 0;
  box-shadow: none !important;
}

.verification-badge.is-icon-only .verification-badge__icon {
  font-size: 20px;
}

.verification-badge.is-icon-only.is-clickable:hover {
  filter: none;
  transform: none;
  opacity: 0.82;
}
</style>
