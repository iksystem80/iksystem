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

        <div class="compact-entry-list" style="border-top:0;">
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
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import { getEmployeeSessionLuckyBirdReport } from '@/api/employeesession';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const error = ref('');
const report = ref(null);

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

async function loadReport() {
  try {
    loading.value = true;
    error.value = '';

    const response = await getEmployeeSessionLuckyBirdReport(
      Number(route.params.sessionId),
      Number(userStore.locationId)
    );

    report.value = response?.data || null;

    if (!report.value) {
      throw new Error('Lucky Bird report data was not returned.');
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

onMounted(loadReport);
</script>
