<template>
  <el-card shadow="never">
    <div class="activity-tab" v-loading="loading" element-loading-text="Loading customer activity...">
      <el-empty v-if="!loading && activities.length === 0 && recentMatchImages.length === 0" description="No customer activity found." class="small-empty" />
      <template v-else>
        <!-- ACTIVITY HISTORY -->
        <div v-if="activities.length" class="activity-section">
          <!--<div class="section-heading">
            <div>
              <h3>Activity History</h3>
              <p>
                Check-ins, check-outs and match points for this customer.
              </p>
            </div>
            <el-button text :loading="loading" @click="loadActivity">
              <el-icon>
                <Refresh />
              </el-icon>
              Refresh
            </el-button>
          </div>-->
          <el-timeline class="activity-timeline">
            <el-timeline-item v-for="item in activities" :key="item.id" :timestamp="formatDateTime(item.date)" placement="top" :type="timelineType(item.type)">
              <div class="activity-entry">
                <div class="activity-row">
                  <div class="activity-icon" :class="activityIconClass(item.type)">
                    <el-icon>
                      <component :is="activityIcon(item.type)" />
                    </el-icon>
                  </div>
                  <div class="activity-main">
                    <div class="activity-heading">
                      <div class="activity-title">
                        <h4>
                          {{ item.title }}
                        </h4>
                        <el-tag :type="tagType(item.type)" size="small" effect="light" round>
                          {{ tagLabel(item.type) }}
                        </el-tag>
                      </div>
                    </div>
                    <p class="activity-description">
                      {{ item.description }}
                    </p>
                    <div v-if="item.type === 'MATCH_POINTS'" class="match-meta">
                      <div class="meta-item">
                        <el-icon>
                          <Coin />
                        </el-icon>
                        <span>
                          <strong>
                            {{ Number(item.points || 0).toLocaleString() }}
                          </strong>
                          points
                        </span>
                      </div>
                      <div v-if="item.machineNumber" class="meta-item">
                        <el-icon>
                          <Monitor />
                        </el-icon>
                        <span>
                          Machine {{ item.machineNumber }}
                        </span>
                      </div>
                      <div v-if="item.assignedBy" class="meta-item">
                        <el-icon>
                          <User />
                        </el-icon>
                        <span>
                          {{ item.assignedBy }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
        <!-- LAST 7 MATCH IMAGES -->
        <div v-if="recentMatchImages.length" class="recent-matches">
          <el-divider />
          <div class="section-heading match-section-heading">
            <div>
              <h3>Recent Match Images</h3>
              <p>
                Last {{ recentMatchImages.length }} match point
                {{ recentMatchImages.length === 1 ? 'image' : 'images' }}.
              </p>
            </div>
            <el-tag type="primary" effect="light" round>
              Last 7
            </el-tag>
          </div>
          <el-carousel :interval="5000" :type="carouselType" :height="carouselHeight" indicator-position="outside" arrow="always" class="match-carousel">
            <el-carousel-item v-for="(item, index) in recentMatchImages" :key="item.id">
              <div class="match-slide">
                <el-image :src="item.imageUrl" fit="cover" class="match-image" :preview-src-list="previewImages" :initial-index="index" preview-teleported>
                  <template #error>
                    <div class="image-error">
                      <el-icon>
                        <Picture />
                      </el-icon>
                      <span>
                        Image unavailable
                      </span>
                    </div>
                  </template>
                </el-image>

                <div class="match-info">

                  <div class="match-points">
                    <strong>
                      {{ Number(item.points || 0).toLocaleString() }}
                    </strong>

                    <span>
                      points
                    </span>
                  </div>

                  <div class="match-details">

                    <span>
                      {{ formatDateTime(item.date) }}
                    </span>

                    <span v-if="item.machineNumber">
                      Machine {{ item.machineNumber }}
                    </span>

                    <span v-if="item.assignedBy">
                      Assigned by {{ item.assignedBy }}
                    </span>

                  </div>

                </div>

              </div>
            </el-carousel-item>
          </el-carousel>
        </div>

      </template>
    </div>
    </el-card>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref,
  watch
} from 'vue';

import { ElMessage } from 'element-plus';

import {
  Clock,
  Coin,
  Monitor,
  Picture,
  Refresh,
  SwitchButton,
  User
} from '@element-plus/icons-vue';

import { getcustomeractivity } from '@/api/customer';
import { useUserStore } from '@/store/modules/user';
import { useAppStore } from '@/store/modules/app';

const props = defineProps({
  customer: {
    type: Object,
    required: true
  }
});

const userStore = useUserStore();
const appStore = useAppStore();

const loading = ref(false);
const activities = ref([]);
const recentMatchImages = ref([]);

const isMobile = computed(
  () => appStore.device === 'mobile'
);

const carouselType = computed(
  () => isMobile.value
    ? ''
    : 'card'
);

const carouselHeight = computed(
  () => isMobile.value
    ? '330px'
    : '360px'
);

const previewImages = computed(
  () =>
    recentMatchImages.value
      .map(item => item.imageUrl)
      .filter(Boolean)
);

const activityIcon = type => {
  if (type === 'MATCH_POINTS') {
    return Coin;
  }

  if (type === 'CHECK_OUT') {
    return SwitchButton;
  }

  return Clock;
};

const activityIconClass = type => {
  if (type === 'CHECK_IN') {
    return 'checkin';
  }

  if (type === 'CHECK_OUT') {
    return 'checkout';
  }

  return 'points';
};

const timelineType = type => {
  if (type === 'CHECK_IN') {
    return 'success';
  }

  if (type === 'CHECK_OUT') {
    return 'danger';
  }

  return 'primary';
};

const tagType = type => {
  if (type === 'CHECK_IN') {
    return 'success';
  }

  if (type === 'CHECK_OUT') {
    return 'danger';
  }

  return 'primary';
};

const tagLabel = type => {
  if (type === 'CHECK_IN') {
    return 'Check In';
  }

  if (type === 'CHECK_OUT') {
    return 'Check Out';
  }

  return 'Points';
};

const formatDateTime = value => {
  if (!value) {
    return '—';
  }

  return new Date(value)
    .toLocaleString(
      [],
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }
    );
};

const loadActivity = async () => {
  if (
    !props.customer?.id ||
            !userStore.locationId
  ) {
    return;
  }

  try {
    loading.value = true;

    const response =
                await getcustomeractivity(
                  props.customer.id,
                  userStore.locationId
                );

    activities.value =
                response?.data?.activities || [];

    recentMatchImages.value =
                response?.data?.recentMatchImages || [];
  } catch (error) {
    console.error(error);

    ElMessage.error(
      error?.response?.data?.message ||
                error?.message ||
                'Unable to load customer activity.'
    );
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.customer?.id,
  () => {
    loadActivity();
  }
);

watch(
  () => userStore.locationId,
  () => {
    loadActivity();
  }
);

onMounted(loadActivity);
</script>

<style scoped lang="scss">
        .activity-tab {
            min-height: 220px;
            padding: 10px;
        }

        .section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
        }

            .section-heading h3 {
                margin: 0 0 5px;
                color: var(--el-text-color-primary);
                font-size: 17px;
                font-weight: 600;
            }

            .section-heading p {
                margin: 0;
                color: var(--el-text-color-secondary);
                font-size: 12px;
                line-height: 1.5;
            }

        /* =========================
       TIMELINE
    ========================= */

        .activity-timeline {
            padding-left: 0;
        }

            .activity-timeline :deep(.el-timeline-item__tail) {
                border-left-color: var(--el-border-color-lighter);
            }

        .activity-entry {
            padding: 14px;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 12px;
            background: #fff;
        }

        .activity-row {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }

        .activity-icon {
            width: 40px;
            height: 40px;
            flex: 0 0 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            background: var(--el-fill-color-light);
            color: var(--el-color-primary);
            font-size: 18px;
        }

            .activity-icon.checkin {
                color: var(--el-color-success);
                background: var(--el-color-success-light-9);
            }

            .activity-icon.checkout {
                color: var(--el-color-danger);
                background: var(--el-color-danger-light-9);
            }

        .activity-main {
            flex: 1;
            min-width: 0;
        }

        .activity-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
        }

        .activity-title {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
        }

            .activity-title h4 {
                margin: 0;
                color: var(--el-text-color-primary);
                font-size: 14px;
                font-weight: 600;
            }

        .activity-description {
            margin: 7px 0 0;
            color: var(--el-text-color-regular);
            font-size: 12px;
            line-height: 1.55;
        }

        .match-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px 18px;
            margin-top: 10px;
        }

        .meta-item {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            color: var(--el-text-color-secondary);
            font-size: 11px;
        }

            .meta-item .el-icon {
                color: var(--el-color-primary);
            }

            .meta-item strong {
                color: var(--el-text-color-primary);
            }

        /* =========================
       MATCH CAROUSEL
    ========================= */

        .recent-matches {
            margin-top: 6px;
        }

        .match-section-heading {
            margin-top: 4px;
        }

        .match-carousel {
            width: 100%;
        }

        .match-slide {
            height: 100%;
            overflow: hidden;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 14px;
            background: #fff;
        }

        .match-image {
            width: 100%;
            height: 270px;
            display: block;
        }

        .image-error {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: var(--el-fill-color-light);
            color: var(--el-text-color-secondary);
            font-size: 12px;
        }

            .image-error .el-icon {
                color: var(--el-color-primary);
                font-size: 28px;
            }

        .match-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 14px;
        }

        .match-points {
            flex-shrink: 0;
        }

            .match-points strong,
            .match-points span {
                display: block;
            }

            .match-points strong {
                color: var(--el-color-primary);
                font-size: 18px;
                line-height: 1;
            }

            .match-points span {
                margin-top: 3px;
                color: var(--el-text-color-secondary);
                font-size: 10px;
            }

        .match-details {
            min-width: 0;
            text-align: right;
        }

            .match-details span {
                display: block;
                overflow: hidden;
                color: var(--el-text-color-secondary);
                font-size: 10px;
                line-height: 1.45;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

        /* =========================
       EMPTY
    ========================= */

        .small-empty {
            padding: 14px 0;
        }

            .small-empty :deep(.el-empty__image) {
                width: 60px;
            }

        /* =========================
       MOBILE
    ========================= */

        @media (max-width: 700px) {

            .activity-tab {
                padding: 6px 0;
            }

            .section-heading {
                align-items: flex-start;
            }

            .activity-entry {
                padding: 12px;
            }

            .activity-icon {
                width: 36px;
                height: 36px;
                flex-basis: 36px;
            }

            .match-image {
                height: 240px;
            }

            .match-info {
                align-items: flex-start;
            }

            .match-details {
                text-align: right;
            }

            .match-carousel :deep(.el-carousel__arrow) {
                width: 32px;
                height: 32px;
            }
        }
</style>
