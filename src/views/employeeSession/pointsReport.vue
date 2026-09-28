<template>
  <div class="report-page">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <div>
          <h1>Points Report</h1>
          <p v-if="report?.session">
            Session # {{ report.session.id }} · {{ report.session.employeeName }}
          </p>
        </div>
      </div>

      <el-button :loading="loading" @click="loadReport">
        <el-icon><Refresh /></el-icon>
        Refresh
      </el-button>
    </div>

    <el-skeleton v-if="loading" :rows="8" animated />

    <template v-else-if="report">
      <el-card shadow="never" class="session-card">
        <div class="session-header-grid">
          <div>
            <span>Employee</span>
            <strong>{{ report.session.employeeName }}</strong>
          </div>
          <div>
            <span>Clock In</span>
            <strong>{{ formatDateTime(report.session.clockIn) }}</strong>
          </div>
          <div>
            <span>Clock Out</span>
            <strong>{{ report.session.clockOut ? formatDateTime(report.session.clockOut) : 'In Progress' }}</strong>
          </div>
          <div>
            <span>Duration</span>
            <strong>{{ formatDuration(report.session) }}</strong>
          </div>
        </div>
      </el-card>

      <div class="metric-grid">
        <el-card shadow="never" class="metric-card">
          <div class="metric-icon primary"><el-icon><Coin /></el-icon></div>
          <div>
            <span>Total Points</span>
            <strong>{{ number(report.summary.totalPoints) }}</strong>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card">
          <div class="metric-icon"><el-icon><DataAnalysis /></el-icon></div>
          <div>
            <span>Match(s)</span>
            <strong>{{ number(report.summary.assignmentCount) }}</strong>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card">
          <div class="metric-icon success"><el-icon><CircleCheckFilled /></el-icon></div>
          <div>
            <span>Approved</span>
            <strong>{{ number(report.summary.approvedCount) }}</strong>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card">
          <div class="metric-icon warning"><el-icon><Clock /></el-icon></div>
          <div>
            <span>Pending Review</span>
            <strong>{{ number(report.summary.pendingReview) }}</strong>
          </div>
        </el-card>
      </div>

      <div class="report-grid">
        <el-card shadow="never" class="panel breakdown-panel">
          <template #header>
            <div class="panel-header">
              <div>
                <strong>Points Breakdown</strong>
                <span>Match grouped by point amount</span>
              </div>
            </div>
          </template>

          <el-empty
            v-if="report.breakdown.length === 0"
            description="No point entries"
            :image-size="70"
          />

          <div v-else class="breakdown-list">
            <div v-for="item in report.breakdown" :key="item.points" class="breakdown-row">
              <div>
                <strong>{{ number(item.points) }} pts</strong>
                <span>{{ item.count }} match{{ item.count === 1 ? '' : 's' }}</span>
              </div>
              <strong>{{ number(item.total) }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="panel review-panel">
          <template #header>
            <div class="panel-header">
              <div>
                <strong>Photo Review</strong>
                <span>{{ report.summary.reviewedCount }} of {{ report.summary.assignmentCount }} reviewed</span>
              </div>
            </div>
          </template>

          <el-progress
            :percentage="reviewProgress"
            :stroke-width="8"
            :show-text="false"
          />

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

          <el-button
            type="primary"
            class="start-review-button"
            :disabled="!nextPendingEntry"
            @click="startAudit"
          >
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

        <el-empty
          v-if="report.entries.length === 0"
          description="No points were assigned during this session"
        />

        <template v-else>
          <div class="desktop-table">
            <el-table
              :data="report.entries"
              row-key="id"
              class="clickable-table"
              @row-click="openReview"
            >
              <el-table-column label="Time" width="120">
                <template #default="scope">
                  {{ formatTime(scope.row.dateAssign) }}
                </template>
              </el-table-column>

              <el-table-column label="Customer" min-width="220">
                <template #default="scope">
                  <div class="customer-cell">
                    <strong>{{ scope.row.customerName }}</strong>
                    <span>{{ scope.row.customerPhone || `Customer #${scope.row.customerId}` }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="Machine" width="130" align="center">
                <template #default="scope">
                  {{ machineLabel(scope.row) }}
                </template>
              </el-table-column>

              <el-table-column label="Points" width="100" align="center">
                <template #default="scope">
                  <el-tag type="success" effect="light">
                    {{ number(scope.row.points) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column label="Photo" width="90" align="center">
                <template #default="scope">
                  <el-image
                    v-if="scope.row.imageUrl"
                    class="proof-image"
                    :src="scope.row.imageUrl"
                    fit="cover"
                    @click.stop="openReview(scope.row)"
                  />
                  <span v-else class="muted">None</span>
                </template>
              </el-table-column>

              <el-table-column label="Review" width="130" align="center">
                <template #default="scope">
                  <el-tag :type="reviewTagType(scope.row.reviewStatus)" effect="light">
                    {{ scope.row.reviewStatus || 'Pending' }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column width="90" align="center">
                <template #default="scope">
                  <el-button link type="primary" @click.stop="openReview(scope.row)">
                    Review
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="mobile-list">
            <div
              v-for="entry in report.entries"
              :key="entry.id"
              class="entry-card"
              @click="openReview(entry)"
            >
              <div class="entry-top">
                <div>
                  <strong>{{ entry.customerName }}</strong>
                  <span>{{ formatTime(entry.dateAssign) }}</span>
                </div>
                <el-tag :type="reviewTagType(entry.reviewStatus)" effect="light">
                  {{ entry.reviewStatus || 'Pending' }}
                </el-tag>
              </div>

              <div class="entry-meta">
                <span>{{ machineLabel(entry) }}</span>
                <span>{{ number(entry.points) }} pts</span>
                <span>{{ entry.checkinId ? `Check-in #${entry.checkinId}` : 'No check-in ID' }}</span>
              </div>

              <el-image
                v-if="entry.imageUrl"
                class="mobile-proof-image"
                :src="entry.imageUrl"
                fit="cover"
                @click.stop="openReview(entry)"
              />

              <div v-else class="mobile-no-photo">
                <el-icon><Picture /></el-icon>
                <span>No photo attached</span>
              </div>
            </div>
          </div>
        </template>
      </el-card>
    </template>

    <el-drawer
      v-model="reviewDrawerOpen"
      :size="drawerSize"
      :with-header="false"
      destroy-on-close
      class="review-drawer"
    >
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
              <el-image
                class="audit-image"
                :src="selectedEntry.imageUrl"
                :preview-src-list="[selectedEntry.imageUrl]"
                fit="contain"
                preview-teleported
              />
            </div>

            <div v-else class="audit-photo-missing">
              <el-icon><Picture /></el-icon>
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
              <el-button
                size="large"
                type="danger"
                plain
                :loading="reviewSaving === 'Rejected'"
                :disabled="!selectedEntry.imageUrl || reviewSaving !== ''"
                @click="saveReview('Rejected')"
              >
                <el-icon><CloseBold /></el-icon>
                Reject
              </el-button>

              <el-button
                size="large"
                type="success"
                :loading="reviewSaving === 'Approved'"
                :disabled="!selectedEntry.imageUrl || reviewSaving !== ''"
                @click="saveReview('Approved')"
              >
                Approve
                <el-icon><Check /></el-icon>
              </el-button>
            </div>

            <div class="audit-navigation">
              <el-button :disabled="selectedIndex <= 0" @click="moveReview(-1)">
                <el-icon><ArrowLeft /></el-icon>
                Previous
              </el-button>
              <el-button
                :disabled="selectedIndex >= (report?.entries?.length || 0) - 1"
                @click="moveReview(1)"
              >
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheckFilled,
  Clock,
  Close,
  CloseBold,
  Coin,
  DataAnalysis,
  Picture,
  Refresh
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import {
  getEmployeeSessionPointsReport,
  updateCustomerMatchReview
} from '@/api/employeeSession'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const report = ref(null)
const reviewDrawerOpen = ref(false)
const selectedEntry = ref(null)
const reviewSaving = ref('')
const viewportWidth = ref(window.innerWidth)

const selectedIndex = computed(() => {
  if (!selectedEntry.value || !report.value?.entries) return -1
  return report.value.entries.findIndex((entry) => entry.id === selectedEntry.value.id)
})

const drawerSize = computed(() => {
  if (viewportWidth.value <= 700) return '100%'
  if (viewportWidth.value <= 1100) return '88%'
  return '72%'
})

const reviewProgress = computed(() => {
  const total = Number(report.value?.summary?.assignmentCount || 0)
  const reviewed = Number(report.value?.summary?.reviewedCount || 0)
  if (!total) return 0
  return Math.round((reviewed / total) * 100)
})

const nextPendingEntry = computed(() => {
  return report.value?.entries?.find((entry) => !entry.reviewStatus || entry.reviewStatus === 'Pending') || null
})

function number(value) {
  return Number(value || 0).toLocaleString()
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })
}

function machineLabel(entry) {
  if (entry?.machineNumber !== null && entry?.machineNumber !== undefined) {
    return `Machine #${entry.machineNumber}`
  }

  if (entry?.machineId) {
    return `Machine ID #${entry.machineId}`
  }

  return '—'
}

function formatDuration(item) {
  let hours = Number(item.totalWorkingHours || 0)
  if (!item.clockOut && item.clockIn) {
    hours = Math.max(0, (Date.now() - new Date(item.clockIn).getTime()) / 3600000)
  }
  const whole = Math.floor(hours)
  const minutes = Math.round((hours - whole) * 60)
  return `${whole}h ${minutes}m`
}

function reviewTagType(status) {
  if (status === 'Approved') return 'success'
  if (status === 'Rejected') return 'danger'
  return 'warning'
}

function openReview(entry) {
  selectedEntry.value = entry
  reviewDrawerOpen.value = true
}

function startAudit() {
  if (nextPendingEntry.value) openReview(nextPendingEntry.value)
}

function moveReview(direction) {
  const index = selectedIndex.value + direction
  if (!report.value?.entries?.[index]) return
  selectedEntry.value = report.value.entries[index]
}

function updateSummaryAfterReview(previousStatus, newStatus) {
  if (!report.value?.summary || previousStatus === newStatus) return

  const summary = report.value.summary

  if (previousStatus === 'Approved') summary.approvedCount = Math.max(0, Number(summary.approvedCount || 0) - 1)
  else if (previousStatus === 'Rejected') summary.rejectedCount = Math.max(0, Number(summary.rejectedCount || 0) - 1)
  else summary.pendingReview = Math.max(0, Number(summary.pendingReview || 0) - 1)

  if (newStatus === 'Approved') summary.approvedCount = Number(summary.approvedCount || 0) + 1
  if (newStatus === 'Rejected') summary.rejectedCount = Number(summary.rejectedCount || 0) + 1

  summary.reviewedCount = Number(summary.approvedCount || 0) + Number(summary.rejectedCount || 0)
}

async function saveReview(status) {
  if (!selectedEntry.value?.id || !selectedEntry.value?.imageUrl) return

  try {
    reviewSaving.value = status
    const previousStatus = selectedEntry.value.reviewStatus || 'Pending'

    const response = await updateCustomerMatchReview(selectedEntry.value.id, {
      status,
      locationid: userStore.locationId
    })

    const updated = response?.data
    if (!updated) throw new Error('Review update failed.')

    const entry = report.value.entries.find((item) => item.id === selectedEntry.value.id)
    if (entry) {
      entry.reviewStatus = updated.reviewStatus
      entry.reviewedBy = updated.reviewedBy
      entry.reviewedAt = updated.reviewedAt
      entry.reviewedByName = updated.reviewedByName
      selectedEntry.value = entry
    }

    updateSummaryAfterReview(previousStatus, status)
    ElMessage.success(status === 'Approved' ? 'Photo approved.' : 'Photo rejected.')
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || 'Unable to update photo review.')
  } finally {
    reviewSaving.value = ''
  }
}

async function loadReport() {
  try {
    loading.value = true
    const selectedId = selectedEntry.value?.id

    const response = await getEmployeeSessionPointsReport(
      Number(route.params.sessionId),
      userStore.locationId
    )

    report.value = response?.data || null

    if (selectedId && report.value?.entries) {
      const refreshedEntry = report.value.entries.find((entry) => entry.id === selectedId)
      if (refreshedEntry) selectedEntry.value = refreshedEntry
    }
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || 'Unable to load points report.')
  } finally {
    loading.value = false
  }
}

function handleResize() {
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  loadReport()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.report-page {
  padding: 20px;
}

.page-header,
.header-left {
  display: flex;
  align-items: center;
}

.page-header {
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.header-left {
  gap: 12px;
  min-width: 0;
}

.back-button {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  padding: 0;
  border-radius: 50%;
  font-size: 18px;
}

.page-header h1 {
  margin: 0;
  font-size: 23px;
}

.page-header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.session-card,
.metric-card,
.panel {
  border-radius: 14px;
}

.session-header-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.session-header-grid span,
.session-header-grid strong {
  display: block;
}

.session-header-grid span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.session-header-grid strong {
  margin-top: 5px;
  font-size: 13px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 14px 0;
}

.metric-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.metric-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: var(--el-fill-color-light);
  font-size: 19px;
}

.metric-icon.primary {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.metric-icon.success {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.metric-icon.warning {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.metric-card span,
.metric-card strong {
  display: block;
}

.metric-card span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.metric-card strong {
  margin-top: 4px;
  font-size: 22px;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.panel-header strong,
.panel-header span {
  display: block;
}

.panel-header span {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
}

.breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.breakdown-row:last-child {
  border-bottom: none;
}

.breakdown-row > div strong,
.breakdown-row > div span {
  display: block;
}

.breakdown-row > div span {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.review-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.review-stat {
  padding: 12px 8px;
  text-align: center;
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.review-stat strong,
.review-stat span {
  display: block;
}

.review-stat strong {
  font-size: 18px;
}

.review-stat span {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  text-transform: uppercase;
}

.review-stat.approved strong { color: var(--el-color-success); }
.review-stat.rejected strong { color: var(--el-color-danger); }
.review-stat.pending strong { color: var(--el-color-warning); }

.start-review-button {
  width: 100%;
  margin-top: 14px;
}

    .review-status-tag {
        align-content: center;
    }

.entries-panel {
  margin-bottom: 20px;
}

.customer-cell strong,
.customer-cell span {
  display: block;
}

.customer-cell span {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.clickable-table :deep(.el-table__row) {
  cursor: pointer;
}

.proof-image {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  cursor: pointer;
}

.muted {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.mobile-list {
  display: none;
}

.entry-card {
  padding: 13px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  cursor: pointer;
}

.entry-card + .entry-card {
  margin-top: 10px;
}

.entry-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.entry-top strong,
.entry-top span {
  display: block;
}

.entry-top span {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.entry-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px 12px;
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.mobile-proof-image {
  width: 100%;
  height: 180px;
  margin-top: 12px;
  border-radius: 10px;
}

.mobile-no-photo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 90px;
  margin-top: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  font-size: 12px;
}

.audit-shell {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.audit-header {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.audit-header > div:first-child {
  text-align: center;
}

.audit-kicker,
.audit-header strong {
  display: block;
}

.audit-kicker {
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .6px;
}

.audit-header strong {
  margin-top: 2px;
  font-size: 13px;
}

.audit-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.audit-content {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(330px, .9fr);
}

.audit-photo-pane {
  min-height: 560px;
  padding: 18px;
  background: #111827;
}

.audit-photo-frame {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 520px;
  overflow: hidden;
  border-radius: 12px;
  background: #0f172a;
}

.photo-sequence {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  min-width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  color: #fff;
  background: rgba(0, 0, 0, .55);
  border-radius: 18px;
  font-size: 12px;
  font-weight: 700;
}

.audit-image {
  width: 100%;
  height: 100%;
  min-height: 520px;
  cursor: zoom-in;
}

.audit-photo-missing {
  min-height: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #cbd5e1;
  text-align: center;
}

.audit-photo-missing .el-icon {
  font-size: 42px;
}

.audit-photo-missing span {
  max-width: 320px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}

.audit-detail-pane {
  padding: 28px 24px;
  background: #fff;
}

.audit-customer > span,
.points-box span,
.audit-meta-grid span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .5px;
}

.audit-customer h2 {
  margin: 6px 0 10px;
  font-size: 24px;
}

.points-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.points-box strong {
  color: var(--el-color-primary);
  font-size: 24px;
}

.audit-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.audit-meta-grid > div {
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.audit-meta-grid strong {
  display: block;
  margin-top: 5px;
  font-size: 16px;
}

.reviewed-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 12px;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border-radius: 10px;
}

.reviewed-meta strong,
.reviewed-meta span {
  display: block;
}

.reviewed-meta span {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.audit-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 20px;
}

.audit-actions .el-button {
  width: 100%;
  margin-left: 0;
}

.audit-navigation {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
}

@media (max-width: 980px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .audit-content {
    grid-template-columns: 1fr;
  }

  .audit-photo-pane,
  .audit-photo-frame,
  .audit-image,
  .audit-photo-missing {
    min-height: 420px;
  }
}

@media (max-width: 700px) {
  .report-page {
    padding: 12px;
  }

  .session-header-grid,
  .report-grid,
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .desktop-table {
    display: none;
  }

  .mobile-list {
    display: block;
  }

  .audit-header {
    padding: 10px 12px;
  }

  .audit-header-actions > span {
    display: none;
  }

  .audit-photo-pane {
    min-height: 330px;
    padding: 10px;
  }

  .audit-photo-frame,
  .audit-image,
  .audit-photo-missing {
    min-height: 310px;
  }

  .audit-detail-pane {
    padding: 18px 14px;
  }

  .audit-actions,
  .audit-meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
