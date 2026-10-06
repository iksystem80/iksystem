<template>
  <div class="app-container">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <div>
          <h2 class="page-title">{{ employee?.name || 'Employee Sessions' }}</h2>
          <div class="page-subtitle">{{ employee?.jobTitle || 'Session history' }}</div>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="employee-banner">
      <div class="employee-header">
        <div class="employee-profile">
          <el-avatar :size="54" :src="employee?.avatar">
            {{ initials(employee?.name) }}
          </el-avatar>

          <div class="employee-profile-text">
            <h2>{{ employee?.name || 'Employee' }}</h2>
            <div class="employee-period">
              {{ sessions.length }} sessions <!--· {{ periodLabel }}-->
            </div>
          </div>
        </div>

        <div class="employee-right">
          <div>
            <span>Match Points</span>
            <strong>{{ totalPoints }}</strong>
          </div>

          <div>
            <span>Cash Expenses</span>
            <strong>{{ hasCashExpenseData ? formatMoney(totalExpenses) : '—' }}</strong>
          </div>
        </div>
      </div>
    </el-card>

    <div v-loading="loading"
         element-loading-text="Loading employee sessions..."
         class="sessions-content">
      <el-empty v-if="!loading && sessions.length === 0"
                description="No sessions found"
                class="small-empty" />

      <div v-else class="session-list">
        <el-card v-for="session in sessions"
                 :key="session.id"
                 shadow="never"
                 class="session-card"
                 :class="{ 'session-included': session.readingSessionId != null }"
                 :title="
            session.readingSessionId != null
              ? `Included in machine reading #${session.readingSessionId}`
              : undefined
          "
                 @click="openSession(session)">
          <el-tag :type="session.status === 'IN_PROGRESS' ? 'success' : 'info'"
                  size="small"
                  effect="light"
                  round
                  class="session-status-tag">
            {{ session.status === 'IN_PROGRESS' ? 'In Progress' : 'Closed' }}
          </el-tag>

          <button class="photo-audit-compact"
                  type="button"
                  :disabled="!Number(session.photoCount || 0)"
                  :title="'Open photo audit · ' + Number(session.photoCount || 0) + ' photos'"
                  @click.stop="openAudit(session)">
            <span class="photo-audit-heading">
              <el-icon><Picture /></el-icon>
              Photos {{ Number(session.photoCount || 0) }}
            </span>

            <span class="photo-audit-counts">
              <span class="audit-approved" title="Approved">
                ✓ {{ Number(session.approvedCount || 0) }}
              </span>
              <span class="audit-rejected" title="Rejected">
                ✕ {{ Number(session.rejectedCount || 0) }}
              </span>
              <span class="audit-remaining" title="Remaining">
                ◷ {{ Number(session.remainingReview || 0) }}
              </span>
            </span>
          </button>

          <div class="session-row-content">
            <div class="session-icon">
              <el-icon><Clock /></el-icon>
            </div>

            <div class="session-main">
              <div class="session-title-row">
                <strong>Session # {{ session.id }}</strong>
              </div>

              <span class="session-date">
                {{ formatSessionDate(session.clockIn) }}
              </span>

              <div class="session-meta">
                <span>{{ formatTimeRange(session.clockIn, session.clockOut) }}</span>
                <span>{{ formatDuration(session) }}</span>
                <span>{{ session.entries }} point entries</span>
                <span>{{ Number(session.points || 0).toLocaleString() }} points</span>
              </div>
            </div>

            <el-icon class="arrow-icon">
              <ArrowRight />
            </el-icon>
          </div>
        </el-card>
      </div>
    </div>

    <SessionPhotoAuditDrawer v-model="auditDrawerOpen"
                             :session-id="auditSessionId"
                             :location-id="userStore.locationId"
                             @review-saved="loadSessions" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, ArrowRight, Clock, Picture } from '@element-plus/icons-vue';

import { useUserStore } from '@/store/modules/user';
import { getEmployeeReportSessions } from '@/api/employeesession';
import SessionPhotoAuditDrawer from './SessionPhotoAuditDrawer.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const employee = ref(null);
const sessions = ref([]);
const auditDrawerOpen = ref(false);
const auditSessionId = ref(null);

const employeeId = computed(() => Number(route.params.employeeId || 0));

const filterDates = computed(() => ({
    startDate:
      typeof route.query.startDate === 'string'
        ? route.query.startDate
        : undefined,
    endDate:
      typeof route.query.endDate === 'string'
        ? route.query.endDate
        : undefined
}));

const periodLabel = computed(() => {
    if (filterDates.value.startDate && filterDates.value.endDate) {
      return `${filterDates.value.startDate} to ${filterDates.value.endDate}`;
    }

    return 'All sessions';
});

const formatMoney = value =>
    Number(value || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });

// Cash expenses are separate from CustomerMatch points. Never use totalExpenses,
// which can include point-related expense amounts in finance summaries.
const hasCashExpenseData = computed(
    () =>
      sessions.value.length === 0 ||
      sessions.value.every(item => item.cashExpenses != null)
);

const totalExpenses = computed(() =>
    sessions.value.reduce(
      (sum, item) => sum + Number(item.cashExpenses || 0),
      0
    )
);

const totalPoints = computed(() =>
    sessions.value
      .reduce((sum, item) => sum + Number(item.points || 0), 0)
      .toLocaleString()
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

function formatSessionDate(value) {
    if (!value) return '—';

    return new Date(value).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
}

function formatTime(value) {
    if (!value) return 'Now';

    return new Date(value).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
}

function formatTimeRange(clockIn, clockOut) {
    return `${formatTime(clockIn)} – ${clockOut ? formatTime(clockOut) : 'Now'}`;
}

function formatDuration(session) {
    let hours = Number(session.totalWorkingHours || 0);

    if (!session.clockOut && session.clockIn) {
      hours = Math.max(
        0,
        (Date.now() - new Date(session.clockIn).getTime()) / 3600000
      );
    }

    const whole = Math.floor(hours);
    const minutes = Math.round((hours - whole) * 60);

    return `${whole}h ${minutes}m`;
}

function openAudit(session) {
    auditSessionId.value = Number(session.id);
    auditDrawerOpen.value = true;
}

function openSession(session) {
    router.push({
      name: 'EmployeeSessionReportMenu',
      params: {
        employeeId: employeeId.value,
        sessionId: session.id
      }
    });
}

async function loadSessions() {
    if (!employeeId.value) return;

    try {
      loading.value = true;

      const response = await getEmployeeReportSessions(
        employeeId.value,
        userStore.locationId,
        filterDates.value
      );

      employee.value = response?.data?.employee || null;
      sessions.value = response?.data?.sessions || [];
    } catch (error) {
      console.error(error);

      ElMessage.error(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to load employee sessions.'
      );
    } finally {
      loading.value = false;
    }
}

onMounted(loadSessions);
</script>
