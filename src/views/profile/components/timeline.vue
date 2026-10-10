<template>
  <el-card shadow="never">
    <div class="timeline-container">
      <div v-if="loading" class="timeline-loading">
        Loading history...
      </div>
      <el-empty v-else-if="groupedTimeline.length === 0" description="No customer activity found." />
      <el-timeline v-else>
        <el-timeline-item v-for="group in groupedTimeline" :key="group.key" :timestamp="group.displayDateTime" placement="top" type="primary">
          <el-card class="timeline-card" shadow="hover">
            <div v-for="(item, index) in group.items" :key="item.id" class="timeline-log">
              <div class="timeline-header">
                <h4>
                  {{ getTitle(item) }}
                </h4>
                <el-tag :type="getTagType(item.logtype)" size="small" effect="light">
                  {{ getTagLabel(item.logtype) }}
                </el-tag>
              </div>
              <p class="timeline-description">
                {{ item.description }}
              </p>
              <div v-if="item.oldvalue !== null && item.newvalue !== null" class="change-values">
                <span class="old-value">
                  {{ formatValue(item.logtype, item.oldvalue) }}
                </span>
                <span class="arrow">
                  →
                </span>
                <span class="new-value">
                  {{ formatValue(item.logtype, item.newvalue) }}
                </span>
              </div>
              <el-divider v-if="index < group.items.length - 1" class="log-divider" />
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
    </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getcustomerlogs } from '@/api/customer';

const props = defineProps({
  customer: {
    type: Object,
    required: true
  }
});

const timeline = ref([]);
const loading = ref(false);

const loadTimeline = async () => {
  try {
    loading.value = true;

    const response = await getcustomerlogs(props.customer.id);

    timeline.value = response.data ?? [];
  } catch (error) {
    ElMessage.error(
      error.response?.data?.message ||
          'Unable to load customer history.'
    );
  } finally {
    loading.value = false;
  }
};

defineExpose({
  reloadTimeline: loadTimeline
});

const groupedTimeline = computed(() => {
  const groups = {};

  timeline.value.forEach(item => {
    const date = new Date(item.datecreated);

    // Group by date + hour + minute
    const key = [
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes()
    ].join('-');

    if (!groups[key]) {
      groups[key] = {
        key,

        displayDateTime: date.toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        }),

        items: []
      };
    }

    groups[key].items.push(item);
  });

  return Object.values(groups);
});

const getTitle = item => {
  if (item.logtype === 'POINTS') {
    return 'Customer Points Updated';
  }

  if (item.logtype === 'PRIVILEGED_MATCH_RULE') {
    return 'Privileged Match Rule Updated';
  }

  if (item.logtype === 'ACCOUNT_STATUS') {
    return 'Customer Active Status Updated';
  }

  if (item.logtype === 'VIP_STATUS') {
    return 'VIP Status Updated';
  }

  if (item.logtype === 'BLACKLIST_STATUS') {
    return 'Blacklist Status Updated';
  }

  return 'Customer Updated';
};

const getTagLabel = type => {
  if (type === 'POINTS') {
    return 'Points';
  }

  if (type === 'PRIVILEGED_MATCH_RULE') {
    return 'Match Rule';
  }

  if (type === 'ACCOUNT_STATUS') {
    return 'Active';
  }

  if (type === 'VIP_STATUS') {
    return 'VIP';
  }

  if (type === 'BLACKLIST_STATUS') {
    return 'Blacklist';
  }

  return 'Update';
};

const getTagType = type => {
  if (type === 'POINTS') {
    return 'primary';
  }

  if (type === 'PRIVILEGED_MATCH_RULE') {
    return 'warning';
  }

  return 'info';
};

const formatValue = (type, value) => {
  if (
    type === 'PRIVILEGED_MATCH_RULE' ||
    type === 'ACCOUNT_STATUS' ||
    type === 'VIP_STATUS' ||
    type === 'BLACKLIST_STATUS'
  ) {
    return String(value) === 'true'
      ? 'Enabled'
      : 'Disabled';
  }

  if (type === 'POINTS') {
    return `${value} pts`;
  }

  return value;
};

onMounted(() => {
  loadTimeline();
});
</script>

<style scoped lang="scss">
    :deep(.el-timeline.is-start) {
        padding-left: 0 !important;
    }

    .timeline-container {
        padding: 10px;
    }

    .timeline-loading {
        padding: 30px;
        text-align: center;
        color: var(--el-text-color-secondary);
    }

    .timeline-card {
        border-radius: 12px;
        border: 1px solid var(--el-border-color-lighter);
    }

    .timeline-log {
        padding: 4px 2px;
    }

    .timeline-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
    }

        .timeline-header h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            color: var(--el-text-color-primary);
        }

    .timeline-description {
        margin: 10px 0 0;
        color: var(--el-text-color-regular);
        font-size: 14px;
        line-height: 1.5;
    }

    .change-values {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 12px;
        padding: 9px 12px;
        background: var(--el-fill-color-extra-light);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
        font-size: 13px;
    }

    .old-value {
        color: var(--el-text-color-secondary);
        text-decoration: line-through;
    }

    .arrow {
        color: var(--el-text-color-placeholder);
    }

    .new-value {
        color: var(--el-color-primary);
        font-weight: 600;
    }

    .log-divider {
        margin: 20px 0;
    }

    /* Timeline node uses your primary theme */
    :deep(.el-timeline-item__node--primary) {
        background-color: var(--el-color-primary);
    }

    /* Primary tag follows your theme */
    :deep(.el-tag--primary) {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary-light-7);
        background: var(--el-color-primary-light-9);
    }
</style>
