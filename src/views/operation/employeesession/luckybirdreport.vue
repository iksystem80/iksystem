<template>
  <div class="report-page app-container">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <div>
          <h2 class="page-title">Lucky Bird Report</h2>
          <div v-if="report?.session" class="page-subtitle">
            Session # {{ report.session.id }} · {{ report.session.employeeName }}
          </div>
        </div>
      </div>
    </div>

    <el-skeleton v-if="loading" :rows="8" animated />

    <el-alert v-if="error"
              type="error"
              :title="error"
              show-icon
              :closable="false" />

    <template v-if="report">
      <el-card shadow="never" class="employee-banner employee-session-banner">
        <div class="employee-header">
          <div class="employee-profile">
            <el-avatar :size="54" :src="report.session.employeeAvatar">
              {{ initials(report.session.employeeName) }}
            </el-avatar>

            <div class="employee-profile-text">
              <h2>{{ report.session.employeeName || 'Employee' }}</h2>
              <div class="employee-period">Session # {{ report.session.id }}</div>
            </div>
          </div>

          <div class="session-grid">
            <div>
              <span>Clock In</span>
              <strong>{{ formatDateTime(report.session.clockIn) }}</strong>
            </div>

            <div>
              <span>Clock Out</span>
              <strong>
                {{ report.session.clockOut ? formatDateTime(report.session.clockOut) : 'In Progress' }}
              </strong>
            </div>

            <div>
              <span>Duration</span>
              <strong>{{ formatDuration(report.session) }}</strong>
            </div>
          </div>
        </div>
      </el-card>

      <div class="metric-grid mobile-two-column-grid report-summary-two-column">
        <el-card shadow="never" class="metric-card metric-matches">
          <div class="metric-layout">
            <div class="metric-icon"><el-icon><Present /></el-icon></div>
            <div class="metric-copy">
              <span>Total Lucky Bird</span>
              <strong>{{ money(report.summary.totalAmount) }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card metric-approved">
          <div class="metric-layout">
            <div class="metric-icon"><el-icon><Document /></el-icon></div>
            <div class="metric-copy">
              <span>Lucky Bird Entries</span>
              <strong>{{ number(report.summary.luckyBirdCount) }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card metric-pending">
          <div class="metric-layout">
            <div class="metric-icon"><el-icon><Monitor /></el-icon></div>
            <div class="metric-copy">
              <span>Machines</span>
              <strong>{{ number(report.summary.machineCount) }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card">
          <div class="metric-layout">
            <div class="metric-icon"><el-icon><Trophy /></el-icon></div>
            <div class="metric-copy">
              <span>Highest Lucky Bird</span>
              <strong>{{ money(report.summary.highestAmount) }}</strong>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Audit section is controlled by Manage Rules -->
      <div v-if="auditVerificationEnabled && report.entries.length" class="report-grid">
        <el-card shadow="never" class="panel review-panel">
          <template #header>
            <div class="panel-header">
              <div>
                <strong>Photo Review</strong>
                <span>
                  {{ report.summary.reviewedCount || 0 }} of
                  {{ report.summary.luckyBirdCount || 0 }} reviewed
                </span>
              </div>
            </div>

            <div class="review-progress-divider" aria-hidden="true">
              <div class="review-progress-divider__fill"
                   :style="{ width: `${reviewProgress}%` }"></div>
            </div>
          </template>

          <div class="review-stats">
            <div class="review-stat approved">
              <strong>{{ report.summary.approvedCount || 0 }}</strong>
              <span>Approved</span>
            </div>

            <div class="review-stat rejected">
              <strong>{{ report.summary.rejectedCount || 0 }}</strong>
              <span>Rejected</span>
            </div>

            <div class="review-stat pending">
              <strong>{{ report.summary.pendingReview || 0 }}</strong>
              <span>Remaining</span>
            </div>
          </div>

          <el-button type="primary"
                     class="start-review-button"
                     :disabled="!nextPendingEntry"
                     @click="startAudit">
            {{ nextPendingEntry ? 'Start / Continue Audit' : 'Review Complete' }}
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-card>
      </div>

      <el-empty v-if="!report.entries?.length"
                description="No Lucky Bird entries were recorded during this session" />

      <el-card v-else shadow="never" class="panel entries-panel">
        <template #header>
          <div class="panel-header entries-header">
            <div>
              <strong>Lucky Bird Entries</strong>
              <span>{{ number(report.summary.luckyBirdCount) }} entries in this session</span>
            </div>
          </div>
        </template>

        <!-- Audit-enabled entry list -->
        <div v-if="auditVerificationEnabled" class="compact-entry-list" style="border-top:0;">
          <button v-for="entry in report.entries"
                  :key="entry.id"
                  type="button"
                  class="compact-entry-row"
                  style="gap:10px;"
                  @click="openReview(entry)">
            <span class="compact-entry-bar"></span>

            <el-avatar shape="square"
                       :size="42"
                       :src="entry.customerAvatar"
                       style="width:42px;height:42px;border-radius:6px;flex:0 0 42px;">
              {{ initials(entry.customerName) }}
            </el-avatar>

            <div v-if="entry.imageUrl"
                 style="position:relative;width:42px;height:42px;flex:0 0 42px;">
              <el-image :src="entry.imageUrl"
                        fit="cover"
                        style="width:42px;height:42px;border-radius:6px;" />

              <span class="photo-indicator"
                    :class="reviewCameraClass(entry.reviewStatus)"
                    title="Lucky Bird photo review status"
                    style="position:absolute;right:-4px;bottom:-4px;">
                <el-icon><PictureFilled /></el-icon>
              </span>
            </div>

            <div v-else
                 class="photo-indicator pending"
                 style="width:42px;height:42px;display:grid;place-items:center;flex:0 0 42px;"
                 title="No Lucky Bird photo">
              <el-icon><PictureFilled /></el-icon>
            </div>

            <div class="compact-entry-person" style="margin-left:2px;">
              <strong>{{ entry.customerName || `Customer #${entry.customerId}` }}</strong>

              <span>
                {{ entry.luckyBirdName || 'Lucky Bird' }}
                <template v-if="entry.payoutDescription">
                  · {{ entry.payoutDescription }}
                </template>
              </span>

              <span>
                {{ formatTime(entry.createdAt) }}
                <template v-if="entry.machineNumber != null">
                  · Machine # {{ entry.machineNumber }}
                </template>
              </span>
            </div>

            <strong class="compact-entry-points"
                    style="margin-left:auto;min-width:auto;text-align:right;white-space:nowrap;padding-left:14px;">
              {{ money(entry.amount) }}
            </strong>
          </button>
        </div>

        <!-- Normal read-only list when Audit Verification is disabled -->
        <div v-else class="compact-entry-list" style="border-top:0;">
          <div v-for="entry in report.entries"
               :key="entry.id"
               class="compact-entry-row">
            <span class="compact-entry-bar"></span>

            <div class="compact-entry-person">
              <el-avatar :size="38" :src="entry.customerAvatar">
                {{ initials(entry.customerName || 'C') }}
              </el-avatar>

              <div>
                <strong>{{ entry.customerName || `Customer #${entry.customerId}` }}</strong>
                <span>
                  Machine #{{ entry.machineNumber ?? entry.machineId }}
                  · {{ entry.game || 'Unknown Game' }}
                  · {{ formatDateTime(entry.createdAt) }}
                </span>
              </div>
            </div>

            <div class="compact-entry-actions">
              <strong class="compact-entry-points">
                {{ money(entry.amount) }}
              </strong>

              <PhotoPreviewIcon :src="entry.imageUrl" />
            </div>
          </div>
        </div>
      </el-card>
    </template>

    <el-drawer v-if="auditVerificationEnabled"
               v-model="reviewDrawerOpen"
               :size="drawerSize"
               :with-header="false"
               destroy-on-close
               class="review-drawer">
      <div v-if="selectedEntry" class="audit-shell">
        <div class="audit-header">
          <div>
            <span class="audit-kicker">LUCKY BIRD AUDIT</span>
            <strong>
              {{ selectedIndex + 1 }} of {{ report?.entries?.length || 0 }}
            </strong>
          </div>

          <div class="audit-header-actions">
            <span>
              {{ report?.summary?.reviewedCount || 0 }}/
              {{ report?.summary?.luckyBirdCount || 0 }} reviewed
            </span>

            <el-button text circle @click="reviewDrawerOpen = false">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="audit-content">
          <div class="audit-photo-pane">
            <div v-if="selectedEntry.imageUrl" class="audit-photo-frame">
              <span class="photo-sequence">#{{ selectedIndex + 1 }}</span>

              <el-image class="audit-image"
                        :src="selectedEntry.imageUrl"
                        :preview-src-list="[selectedEntry.imageUrl]"
                        fit="contain"
                        preview-teleported />
            </div>

            <div v-else class="audit-photo-missing">
              <el-icon><PictureFilled /></el-icon>
              <strong>No photo attached</strong>
              <span>
                This Lucky Bird entry cannot be approved or rejected until photo evidence exists.
              </span>
            </div>
          </div>

          <div class="audit-detail-pane">
            <div class="audit-customer">
              <span>CUSTOMER</span>
              <h2>{{ selectedEntry.customerName }}</h2>

              <el-tag :type="reviewTagType(selectedEntry.reviewStatus)"
                      effect="light"
                      class="review-status-tag">
                {{ selectedEntry.reviewStatus || 'Pending' }}
              </el-tag>
            </div>

            <div class="points-box">
              <span>LUCKY BIRD AMOUNT</span>
              <strong>{{ money(selectedEntry.amount) }}</strong>
            </div>

            <div class="audit-meta-grid">
              <div>
                <span>LUCKY BIRD</span>
                <strong>{{ selectedEntry.luckyBirdName || 'Lucky Bird' }}</strong>
              </div>

              <div>
                <span>PAYOUT</span>
                <strong>{{ selectedEntry.payoutDescription || '—' }}</strong>
              </div>

              <div>
                <span>MACHINE</span>
                <strong>
                  {{ selectedEntry.machineNumber ?? selectedEntry.machineId ?? '—' }}
                </strong>
              </div>

              <div>
                <span>TIME</span>
                <strong>{{ formatTime(selectedEntry.createdAt) }}</strong>
              </div>
            </div>

            <div v-if="selectedEntry.reviewedAt" class="reviewed-meta">
              <el-icon><CircleCheckFilled /></el-icon>

              <div>
                <strong>
                  Reviewed by
                  {{ selectedEntry.reviewedByName || `User #${selectedEntry.reviewedBy}` }}
                </strong>
                <span>{{ formatDateTime(selectedEntry.reviewedAt) }}</span>
              </div>
            </div>

            <div class="audit-actions">
              <el-button size="large"
                         type="danger"
                         plain
                         :loading="reviewSaving === 'Rejected'"
                         :disabled="!selectedEntry.imageUrl || reviewSaving !== ''"
                         @click="saveReview('Rejected')">
                <el-icon><CloseBold /></el-icon>
                Reject
              </el-button>

              <el-button size="large"
                         type="success"
                         :loading="reviewSaving === 'Approved'"
                         :disabled="!selectedEntry.imageUrl || reviewSaving !== ''"
                         @click="saveReview('Approved')">
                Approve
                <el-icon><Check /></el-icon>
              </el-button>
            </div>

            <div class="audit-navigation">
              <el-button :disabled="selectedIndex <= 0"
                         @click="moveReview(-1)">
                <el-icon><ArrowLeft /></el-icon>
                Previous
              </el-button>

              <el-button :disabled="selectedIndex >= (report?.entries?.length || 0) - 1"
                         @click="moveReview(1)">
                Next
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import { getEmployeeSessionLuckyBirdReport } from '@/api/employeesession';
import request from '@/utils/request';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const error = ref('');
const report = ref(null);
const reviewDrawerOpen = ref(false);
const selectedEntry = ref(null);
const reviewSaving = ref('');
const viewportWidth = ref(window.innerWidth);

const auditVerificationEnabled = computed(
  () => report.value?.auditVerificationEnabled === true
);

const selectedIndex = computed(() => {
  if (!selectedEntry.value || !report.value?.entries) return -1;

  return report.value.entries.findIndex(
    entry => Number(entry.id) === Number(selectedEntry.value.id)
  );
});

const drawerSize = computed(() => {
  if (viewportWidth.value <= 700) return '100%';
  return '480px';
});

const reviewProgress = computed(() => {
  const total = Number(report.value?.summary?.luckyBirdCount || 0);
  const reviewed = Number(report.value?.summary?.reviewedCount || 0);

  if (!total) return 0;

  return Math.round((reviewed / total) * 100);
});

const nextPendingEntry = computed(() =>
  report.value?.entries?.find(
    entry => !entry.reviewStatus || entry.reviewStatus === 'Pending'
  ) || null
);

function initials(name) {
  return String(name || 'E')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

function money(value) {
  return Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

function formatTime(value) {
  if (!value) return '—';

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatDuration(session) {
  if (session?.totalWorkingHours != null) {
    const hours = Number(session.totalWorkingHours || 0);
    if (Number.isFinite(hours) && hours > 0) {
      const whole = Math.floor(hours);
      const minutes = Math.round((hours - whole) * 60);
      return `${whole}h ${minutes}m`;
    }
  }

  if (!session?.clockIn) return '—';

  const start = new Date(session.clockIn).getTime();
  const end = session.clockOut ? new Date(session.clockOut).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((end - start) / 60000));

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function reviewTagType(status) {
  if (status === 'Approved') return 'success';
  if (status === 'Rejected') return 'danger';
  return 'warning';
}

function reviewCameraClass(status) {
  if (status === 'Approved') return 'approved';
  if (status === 'Rejected') return 'rejected';
  return 'pending';
}

function openReview(entry) {
  if (!auditVerificationEnabled.value) return;

  selectedEntry.value = entry;
  reviewDrawerOpen.value = true;
}

function startAudit() {
  if (!auditVerificationEnabled.value) return;

  if (nextPendingEntry.value) {
    openReview(nextPendingEntry.value);
  }
}

function moveReview(direction) {
  const index = selectedIndex.value + direction;

  if (!report.value?.entries?.[index]) return;

  selectedEntry.value = report.value.entries[index];
}

function updateSummaryAfterReview(previousStatus, newStatus) {
  if (!report.value?.summary || previousStatus === newStatus) return;

  const summary = report.value.summary;

  if (previousStatus === 'Approved') {
    summary.approvedCount = Math.max(
      0,
      Number(summary.approvedCount || 0) - 1
    );
  } else if (previousStatus === 'Rejected') {
    summary.rejectedCount = Math.max(
      0,
      Number(summary.rejectedCount || 0) - 1
    );
  } else {
    summary.pendingReview = Math.max(
      0,
      Number(summary.pendingReview || 0) - 1
    );
  }

  if (newStatus === 'Approved') {
    summary.approvedCount = Number(summary.approvedCount || 0) + 1;
  }

  if (newStatus === 'Rejected') {
    summary.rejectedCount = Number(summary.rejectedCount || 0) + 1;
  }

  summary.reviewedCount =
    Number(summary.approvedCount || 0) +
    Number(summary.rejectedCount || 0);
}

async function saveReview(status) {
  if (!auditVerificationEnabled.value ||
      !selectedEntry.value?.id ||
      !selectedEntry.value?.imageUrl) {
    return;
  }

  try {
    reviewSaving.value = status;

    const previousStatus =
      selectedEntry.value.reviewStatus || 'Pending';

    const response = await request({
      url: `/employeesession/reports/lucky-bird/${selectedEntry.value.id}/review`,
      method: 'put',
      data: {
        status,
        locationid: userStore.locationId
      }
    });

    const updated = response?.data;

    if (!updated) {
      throw new Error('Review update failed.');
    }

    const entry = report.value.entries.find(
      item => Number(item.id) === Number(selectedEntry.value.id)
    );

    if (entry) {
      entry.reviewStatus = updated.reviewStatus;
      entry.reviewedBy = updated.reviewedBy;
      entry.reviewedAt = updated.reviewedAt;
      entry.reviewedByName = updated.reviewedByName;
      selectedEntry.value = entry;
    }

    updateSummaryAfterReview(previousStatus, status);

    ElMessage.success(
      status === 'Approved'
        ? 'Photo approved.'
        : 'Photo rejected.'
    );

    const nextPending = report.value?.entries?.find(
      item =>
        Number(item.id) !== Number(selectedEntry.value?.id) &&
        (!item.reviewStatus || item.reviewStatus === 'Pending')
    );

    if (nextPending) {
      selectedEntry.value = nextPending;
    } else {
      reviewDrawerOpen.value = false;
      selectedEntry.value = null;
      ElMessage.success('Review complete.');
    }
  } catch (errorValue) {
    console.error(errorValue);

    ElMessage.error(
      errorValue?.response?.data?.message ||
      errorValue?.message ||
      'Unable to update Lucky Bird photo review.'
    );
  } finally {
    reviewSaving.value = '';
  }
}

function handleResize() {
  viewportWidth.value = window.innerWidth;
}

async function loadReport() {
  try {
    loading.value = true;
    error.value = '';

    const response = await getEmployeeSessionLuckyBirdReport(
      Number(route.params.sessionId),
      Number(userStore.locationId)
    );

    const selectedId = selectedEntry.value?.id;
    report.value = response?.data || null;

    if (!report.value) {
      throw new Error('Lucky Bird report data was not returned.');
    }

    if (!auditVerificationEnabled.value) {
      reviewDrawerOpen.value = false;
      selectedEntry.value = null;
    } else if (selectedId && report.value?.entries) {
      const refreshedEntry = report.value.entries.find(
        entry => Number(entry.id) === Number(selectedId)
      );

      if (refreshedEntry) {
        selectedEntry.value = refreshedEntry;
      }
    }
  } catch (e) {
    report.value = null;
    error.value =
      e?.response?.data?.message ||
      e?.message ||
      'Unable to load Lucky Bird report.';

    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [route.params.sessionId, userStore.locationId],
  loadReport
);

onMounted(() => {
  window.addEventListener('resize', handleResize);
  loadReport();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>
