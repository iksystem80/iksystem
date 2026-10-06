<template>
  <div class="app-container">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div>
          <h2 class="page-title">Points Report</h2>
          <div class="page-subtitle" v-if="report?.session">
            Session # {{ report.session.id }} · {{ report.session.employeeName }}
          </div>
        </div>
      </div>
    </div>

    <el-skeleton v-if="loading" :rows="8" animated />

    <template v-else-if="report">
      <el-card shadow="never" class="employee-banner employee-session-banner">
        <div class="employee-header">
          <div class="employee-profile">
            <el-avatar :size="54" :src="report.session.employeeAvatar">{{ initials(report.session.employeeName) }}</el-avatar>
            <div class="employee-profile-text">
              <h2>{{ report.session.employeeName || 'Employee' }}</h2>
              <div class="employee-period">Session # {{ report.session.id }}</div>
            </div>
          </div>
          <div class="session-grid">
            <div><span>Clock In</span><strong>{{ formatDateTime(report.session.clockIn) }}</strong></div>
            <div><span>Clock Out</span><strong>{{ report.session.clockOut ? formatDateTime(report.session.clockOut) : 'In Progress' }}</strong></div>
            <div><span>Duration</span><strong>{{  formatDuration(report.session) }}</strong></div>
          </div>
        </div>
      </el-card>

      <div class="metric-grid mobile-two-column-grid points-report-summary-grid">
        <el-card shadow="never" class="metric-card metric-points"><div class="metric-layout"><div class="metric-icon"><el-icon><Coin /></el-icon></div><div class="metric-copy"><span>Total Points</span><strong>{{ number(report.summary.totalPoints) }}</strong></div></div></el-card>
        <el-card shadow="never" class="metric-card metric-matches"><div class="metric-layout"><div class="metric-icon"><el-icon><DataAnalysis /></el-icon></div><div class="metric-copy"><span>Matches</span><strong>{{ number(report.summary.assignmentCount) }}</strong></div></div></el-card>
        <el-card shadow="never" class="metric-card metric-approved"><div class="metric-layout"><div class="metric-icon"><el-icon><CircleCheckFilled /></el-icon></div><div class="metric-copy"><span>Approved</span><strong>{{ number(report.summary.approvedCount) }}</strong></div></div></el-card>
        <el-card shadow="never" class="metric-card metric-pending"><div class="metric-layout"><div class="metric-icon"><el-icon><Clock /></el-icon></div><div class="metric-copy"><span>Pending Review</span><strong>{{ number(report.summary.pendingReview) }}</strong></div></div></el-card>
      </div>
      <div class="report-grid">
        <el-card shadow="never" class="panel review-panel">
          <template #header>
            <div class="panel-header">
              <div>
                <strong>Photo Review</strong>
                <span>{{ report.summary.reviewedCount }} of {{ report.summary.assignmentCount }} reviewed</span>
              </div>
            </div>
            <div class="review-progress-divider" aria-hidden="true">
              <div class="review-progress-divider__fill" :style="{ width: `${reviewProgress}%` }"></div>
            </div>
          </template>

          <div class="review-stats">
            <div class="review-stat approved">
              <strong>{{ report.summary.approvedCount }}</strong>
              <span>Approved</span>
            </div>
            <div class="review-stat rejected">
              <strong>{{ report.summary.rejectedCount }}</strong>
              <span>Rejected</span>
            </div>
            <div class="review-stat pending">
              <strong>{{ report.summary.pendingReview }}</strong>
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

      <el-card shadow="never" class="panel entries-panel">
        <template #header>
          <div class="panel-header entries-header">
            <div>
              <strong>Point Entries</strong>
              <span>{{ report.entries.length }} assignments in this session</span>
            </div>
          </div>
        </template>

        <div v-if="report.breakdown.length" class="entry-breakdown">
          <div class="breakdown-title">BREAKDOWN BY AMOUNT · TAP TO FILTER</div>
          <div class="breakdown-chips">
            <button v-for="(item, index) in report.breakdown"
                    :key="item.points"
                    type="button"
                    class="breakdown-chip"
                    :class="{ active: selectedPointFilter === Number(item.points) }"
                    :style="breakdownStyle(index)"
                    @click="togglePointFilter(item.points)">
              <strong>{{ number(item.points) }}</strong>
              <span>× {{ item.count }}</span>
            </button>
          </div>
        </div>

        <el-empty v-if="report.entries.length === 0"
                  description="No points were assigned during this session" />

        <template v-else>
          <div class="compact-entry-list">
            <button v-for="entry in filteredEntries"
                    :key="entry.id"
                    type="button"
                    class="compact-entry-row"
                    :style="entryAccentStyle(entry)"
                    @click="openReview(entry)">
              <span class="compact-entry-bar"></span>

              <div class="compact-entry-person">
                <strong>{{ entry.customerName }}</strong>
                <span>{{ formatTime(entry.dateAssign) }}</span>
              </div>

              <div class="compact-entry-actions">
                <span v-if="entry.machineNumber ?? entry.machineId" class="machine-pill">
                  <el-icon><Monitor /></el-icon>
                  # {{ entry.machineNumber ?? entry.machineId }}
                </span>

                <span class="photo-indicator"
                      :class="reviewCameraClass(entry.reviewStatus)"
                      title="Photo review status">
                  <el-icon><PictureFilled /></el-icon>
                </span>

                <strong class="compact-entry-points">${{ number(entry.points) }}</strong>
              </div>
            </button>
          </div>
        </template>
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
            <span class="audit-kicker">POINTS AUDIT</span>
            <strong>{{ selectedIndex + 1 }} of {{ report?.entries?.length || 0 }}</strong>
          </div>

          <div class="audit-header-actions">
            <span>{{ report?.summary?.reviewedCount || 0 }}/{{ report?.summary?.assignmentCount || 0 }} reviewed</span>
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
              <span>This entry cannot be approved or rejected until photo evidence exists.</span>
            </div>
          </div>

          <div class="audit-detail-pane">
            <div class="audit-customer">
              <span>CUSTOMER</span>
              <h2>{{ selectedEntry.customerName }}</h2>
              <el-tag :type="reviewTagType(selectedEntry.reviewStatus)" effect="light" class="review-status-tag">
                {{ selectedEntry.reviewStatus || 'Pending' }}
              </el-tag>
            </div>

            <div class="points-box">
              <span>POINTS</span>
              <strong>{{ number(selectedEntry.points) }}</strong>
            </div>

            <div class="audit-meta-grid">
              <div>
                <span>MACHINE</span>
                <strong>{{ selectedEntry.machineNumber ?? selectedEntry.machineId ?? '—' }}</strong>
              </div>
              <div>
                <span>TIME</span>
                <strong>{{ formatTime(selectedEntry.dateAssign) }}</strong>
              </div>
            </div>

            <div v-if="selectedEntry.reviewedAt" class="reviewed-meta">
              <el-icon><CircleCheckFilled /></el-icon>
              <div>
                <strong>Reviewed by {{ selectedEntry.reviewedByName || `User #${selectedEntry.reviewedBy}` }}</strong>
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
              <el-button :disabled="selectedIndex <= 0" @click="moveReview(-1)">
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
      import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
      import { useRoute, useRouter } from 'vue-router';
      import { ElMessage } from 'element-plus';
      import { useUserStore } from '@/store/modules/user';
      import {
        getEmployeeSessionPointsReport,
        updateCustomerMatchReview
      } from '@/api/employeeSession';

      const route = useRoute();
      const router = useRouter();
      const userStore = useUserStore();

      const loading = ref(false);
      const report = ref(null);
      const reviewDrawerOpen = ref(false);
      const selectedEntry = ref(null);
      const reviewSaving = ref('');
      const viewportWidth = ref(window.innerWidth);
      const selectedPointFilter = ref(null);

      const selectedIndex = computed(() => {
        if (!selectedEntry.value || !report.value?.entries) return -1;
        return report.value.entries.findIndex((entry) => entry.id === selectedEntry.value.id);
      });

      const drawerSize = computed(() => {
        if (viewportWidth.value <= 700) return '100%';
        return '480px';
      });

      const reviewProgress = computed(() => {
        const total = Number(report.value?.summary?.assignmentCount || 0);
        const reviewed = Number(report.value?.summary?.reviewedCount || 0);
        if (!total) return 0;
        return Math.round((reviewed / total) * 100);
      });

      const nextPendingEntry = computed(() => {
        return report.value?.entries?.find((entry) => !entry.reviewStatus || entry.reviewStatus === 'Pending') || null;
      });

const pointPalette = ['var(--el-color-primary)','var(--green)','var(--yellow)','var(--red)','var(--pink)','var(--tiffany)','var(--light-blue)','var(--blue)'];

      const filteredEntries = computed(() => {
        const entries = report.value?.entries || [];
        if (selectedPointFilter.value === null) return entries;
        return entries.filter((entry) => Number(entry.points) === Number(selectedPointFilter.value));
      });

      function pointColor(points) {
        const breakdown = report.value?.breakdown || [];
        const index = breakdown.findIndex((item) => Number(item.points) === Number(points));
        return pointPalette[(index < 0 ? 0 : index) % pointPalette.length];
      }

      function breakdownStyle(index) {
        const color = pointPalette[index % pointPalette.length];
        return { '--point-color': color };
      }

      function entryAccentStyle(entry) {
        return { '--point-color': pointColor(entry?.points) };
      }

      function togglePointFilter(points) {
        const value = Number(points);
        selectedPointFilter.value = selectedPointFilter.value === value ? null : value;
      }

      function initials(name) { return String(name || 'E').split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }

      function number(value) {
        return Number(value || 0).toLocaleString();
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

      function machineLabel(entry) {
        if (entry?.machineNumber !== null && entry?.machineNumber !== undefined) {
          return `Machine #${entry.machineNumber}`;
        }

        if (entry?.machineId) {
          return `Machine ID #${entry.machineId}`;
        }

        return '—';
      }

      function formatDuration(item) {
        let hours = Number(item.totalWorkingHours || 0);
        if (!item.clockOut && item.clockIn) {
          hours = Math.max(0, (Date.now() - new Date(item.clockIn).getTime()) / 3600000);
        }
        const whole = Math.floor(hours);
        const minutes = Math.round((hours - whole) * 60);
        return `${whole}h ${minutes}m`;
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
        if (nextPendingEntry.value) openReview(nextPendingEntry.value);
      }

      function moveReview(direction) {
        const index = selectedIndex.value + direction;
        if (!report.value?.entries?.[index]) return;
        selectedEntry.value = report.value.entries[index];
      }

      function updateSummaryAfterReview(previousStatus, newStatus) {
        if (!report.value?.summary || previousStatus === newStatus) return;

        const summary = report.value.summary;

        if (previousStatus === 'Approved') summary.approvedCount = Math.max(0, Number(summary.approvedCount || 0) - 1);
        else if (previousStatus === 'Rejected') summary.rejectedCount = Math.max(0, Number(summary.rejectedCount || 0) - 1);
        else summary.pendingReview = Math.max(0, Number(summary.pendingReview || 0) - 1);

        if (newStatus === 'Approved') summary.approvedCount = Number(summary.approvedCount || 0) + 1;
        if (newStatus === 'Rejected') summary.rejectedCount = Number(summary.rejectedCount || 0) + 1;

        summary.reviewedCount = Number(summary.approvedCount || 0) + Number(summary.rejectedCount || 0);
      }

      async function saveReview(status) {
        if (!selectedEntry.value?.id || !selectedEntry.value?.imageUrl) return;

        try {
          reviewSaving.value = status;
          const previousStatus = selectedEntry.value.reviewStatus || 'Pending';

          const response = await updateCustomerMatchReview(selectedEntry.value.id, {
            status,
            locationid: userStore.locationId
          });

          const updated = response?.data;
          if (!updated) throw new Error('Review update failed.');

          const entry = report.value.entries.find((item) => item.id === selectedEntry.value.id);
          if (entry) {
            entry.reviewStatus = updated.reviewStatus;
            entry.reviewedBy = updated.reviewedBy;
            entry.reviewedAt = updated.reviewedAt;
            entry.reviewedByName = updated.reviewedByName;
            selectedEntry.value = entry;
          }

          updateSummaryAfterReview(previousStatus, status);
          ElMessage.success(status === 'Approved' ? 'Photo approved.' : 'Photo rejected.');

          const nextPending = report.value?.entries?.find(
            (item) =>
              item.id !== selectedEntry.value?.id &&
              (!item.reviewStatus || item.reviewStatus === 'Pending')
          );

          if (nextPending) {
            selectedEntry.value = nextPending;
          } else {
            reviewDrawerOpen.value = false;
            selectedEntry.value = null;
            ElMessage.success('Review complete.');
          }
        } catch (error) {
          console.error(error);
          ElMessage.error(error?.message || 'Unable to update photo review.');
        } finally {
          reviewSaving.value = '';
        }
      }

      async function loadReport() {
        try {
          loading.value = true;
          const selectedId = selectedEntry.value?.id;

          const response = await getEmployeeSessionPointsReport(
            Number(route.params.sessionId),
            userStore.locationId
          );

          report.value = response?.data || null;

          if (selectedId && report.value?.entries) {
            const refreshedEntry = report.value.entries.find((entry) => entry.id === selectedId);
            if (refreshedEntry) selectedEntry.value = refreshedEntry;
          }
        } catch (error) {
          console.error(error);
          ElMessage.error(error?.message || 'Unable to load points report.');
        } finally {
          loading.value = false;
        }
      }

      function handleResize() {
        viewportWidth.value = window.innerWidth;
      }

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
    .points-report-summary-grid {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 10px !important;
    }

      .points-report-summary-grid .metric-card {
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
      }

      .points-report-summary-grid .metric-layout {
        min-width: 0;
      }

      .points-report-summary-grid .metric-copy {
        min-width: 0;
      }
  }
</style>
