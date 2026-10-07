<template>
  <div class="report-page app-container">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <div>
          <h2 class="page-title">Bonus Report</h2>
          <div class="page-subtitle" v-if="report?.session">
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
            <div class="metric-icon">
              <el-icon><Present /></el-icon>
            </div>
            <div class="metric-copy">
              <span>Total Bonus</span>
              <strong>{{ money(report.summary.totalAmount) }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card metric-approved">
          <div class="metric-layout">
            <div class="metric-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="metric-copy">
              <span>Bonus Winners</span>
              <strong>{{ number(report.summary.bonusCount) }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card metric-pending">
          <div class="metric-layout">
            <div class="metric-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="metric-copy">
              <span>Machines</span>
              <strong>{{ number(report.summary.machineCount) }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card">
          <div class="metric-layout">
            <div class="metric-icon">
              <el-icon><Trophy /></el-icon>
            </div>
            <div class="metric-copy">
              <span>Highest Bonus</span>
              <strong>{{ money(report.summary.highestAmount) }}</strong>
            </div>
          </div>
        </el-card>
      </div>

      <div v-if="report.entries.length" class="report-grid">
        <el-card shadow="never" class="panel review-panel">
          <template #header>
            <div class="panel-header">
              <div>
                <strong>Photo Review</strong>
                <span>
                  {{ report.summary.reviewedCount || 0 }} of
                  {{ report.summary.bonusCount || 0 }} reviewed
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

      <el-empty v-if="!report.entries.length"
                description="No bonus winners were recorded during this session" />

      <el-card v-else shadow="never" class="panel entries-panel">
        <template #header>
          <div class="panel-header entries-header">
            <div>
              <strong>Bonus Winners</strong>
              <span>{{ number(report.summary.bonusCount) }} winners in this session</span>
            </div>
          </div>
        </template>

        <div class="compact-entry-list" style="border-top:0;">
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
                    title="Bonus photo review status"
                    style="position:absolute;right:-4px;bottom:-4px;">
                <el-icon><PictureFilled /></el-icon>
              </span>
            </div>

            <div v-else
                 class="photo-indicator pending"
                 style="width:42px;height:42px;display:grid;place-items:center;flex:0 0 42px;"
                 title="No bonus photo">
              <el-icon><PictureFilled /></el-icon>
            </div>

            <div class="compact-entry-person" style="margin-left:2px;">
              <strong>{{ entry.customerName }}</strong>

              <span>
                {{ entry.bonusName || 'Bonus' }}
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
      </el-card>
    </template>

    <el-drawer v-model="reviewDrawerOpen"
               :size="drawerSize"
               :with-header="false"
               destroy-on-close
               class="review-drawer">
      <div v-if="selectedEntry" class="audit-shell">
        <div class="audit-header">
          <div>
            <span class="audit-kicker">BONUS AUDIT</span>
            <strong>
              {{ selectedIndex + 1 }} of {{ report?.entries?.length || 0 }}
            </strong>
          </div>

          <div class="audit-header-actions">
            <span>
              {{ report?.summary?.reviewedCount || 0 }}/
              {{ report?.summary?.bonusCount || 0 }} reviewed
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
                This bonus winner cannot be approved or rejected until photo evidence exists.
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
              <span>BONUS AMOUNT</span>
              <strong>{{ money(selectedEntry.amount) }}</strong>
            </div>

            <div class="audit-meta-grid">
              <div>
                <span>BONUS</span>
                <strong>{{ selectedEntry.bonusName || 'Bonus' }}</strong>
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
      const total = Number(report.value?.summary?.bonusCount || 0);
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
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase();
}

function number(value) {
      return Number(value || 0).toLocaleString();
}

function money(value) {
      return Number(value || 0).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
}

function formatDateTime(value) {
      if (!value) return '—';

      return new Date(value).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
}

function formatTime(value) {
      if (!value) return '—';

      return new Date(value).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      });
}

function formatDuration(item) {
      let hours = Number(item.totalWorkingHours || 0);

      if (!item.clockOut && item.clockIn) {
        hours = Math.max(
          0,
          (Date.now() - new Date(item.clockIn).getTime()) / 3600000
        );
      }

      const minutes = Math.round(hours * 60);

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
      selectedEntry.value = entry;
      reviewDrawerOpen.value = true;
}

function startAudit() {
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
      if (!selectedEntry.value?.id || !selectedEntry.value?.imageUrl) return;

      try {
        reviewSaving.value = status;

        const previousStatus =
          selectedEntry.value.reviewStatus || 'Pending';

        const response = await request({
          url: `/employeesession/reports/bonus/${selectedEntry.value.id}/review`,
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
          'Unable to update bonus photo review.'
        );
      } finally {
        reviewSaving.value = '';
      }
}

function handleResize() {
      viewportWidth.value = window.innerWidth;
}

async function loadReport() {
      const sessionId = Number(route.params.sessionId);
      const locationId = Number(userStore.locationId);

      if (!sessionId || !locationId) return;

      try {
        loading.value = true;
        error.value = '';

        const response = await request({
          url: `/employeesession/reports/session/${sessionId}/bonus`,
          method: 'get',
          params: { locationid: locationId }
        });

        const selectedId = selectedEntry.value?.id;

        report.value = response?.data || null;

        if (selectedId && report.value?.entries) {
          const refreshedEntry = report.value.entries.find(
            entry => Number(entry.id) === Number(selectedId)
          );

          if (refreshedEntry) {
            selectedEntry.value = refreshedEntry;
          }
        }

        if (!report.value) {
          throw new Error('Bonus report data was not returned.');
        }
      } catch (errorValue) {
        console.error(errorValue);

        error.value =
          errorValue?.response?.data?.message ||
          errorValue?.message ||
          'Unable to load Bonus report.';

        report.value = null;
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

<style scoped>

@media (max-width: 767px) {
  .report-summary-two-column {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
  }

  .report-summary-two-column .metric-card {
    width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
  }

  .report-summary-two-column .metric-layout,
  .report-summary-two-column .metric-copy {
    min-width: 0;
  }
}

</style>
