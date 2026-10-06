<template>
  <div class="report-page irfan-report-sessioncashhistoryreport irfan-ui-page">
    <div class="page-header">
      <div class="header-left">
        <el-button circle class="back-button" @click="router.back()"><el-icon><ArrowLeft /></el-icon></el-button>
        <div><h2 class="page-title">Session Cash History Report</h2><div class="page-subtitle">Full session reconciliation report for the selected location.</div></div>
      </div>
      <el-button :loading="loading" @click="loadReport"><el-icon><Refresh /></el-icon>Refresh</el-button>
    </div>
    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <div><label>Date range</label><el-date-picker v-model="dateRange" type="daterange" range-separator="to" start-placeholder="Start date" end-placeholder="End date" value-format="YYYY-MM-DD" clearable style="width:100%" /></div>
        <div v-if="isAdmin"><label>Employee</label><el-select v-model="employeeId" clearable filterable placeholder="All employees" style="width:100%">
          <el-option v-for="item in employees" :key="item.id" :label="item.name" :value="item.id" />
        </el-select></div>
        <div class="filter-actions">
          <el-button @click="clearFilters">All Time</el-button>
          <el-button type="primary" :loading="loading" @click="loadReport">Apply</el-button>
        </div>
      </div>
    </el-card>
    <div class="summary-grid">
      <el-card shadow="never" class="summary"><span>Sessions</span><strong>{{ number(summary.sessionCount) }}</strong></el-card>
      <el-card shadow="never" class="summary"><span>Opening</span><strong>{{ money(summary.opening) }}</strong></el-card>
      <el-card shadow="never" class="summary"><span>Received</span><strong>{{ money(summary.received) }}</strong></el-card>
      <el-card shadow="never" class="summary"><span>Cash Expenses</span><strong>{{ money(summary.cashExpenses) }}</strong></el-card>
      <el-card shadow="never" class="summary"><span>Cash Points Expense</span><strong>{{ money(summary.pointsExpense) }}</strong></el-card>
      <el-card shadow="never" class="summary"><span>Owner/Admin Taken</span><strong>{{ money(summary.ownerWithdrawals) }}</strong></el-card>
      <el-card shadow="never" class="summary short"><span>Short</span><strong>{{ money(summary.short) }}</strong></el-card>
      <el-card shadow="never" class="summary over"><span>Over</span><strong>{{ money(summary.over) }}</strong></el-card>
    </div>
    <el-card shadow="never" class="report-card" v-loading="loading">
      <template #header><div><strong>Session Cash History</strong><div class="small-text">{{ rows.length }} session{{ rows.length === 1 ? '' : 's' }} · {{ rangeLabel }}</div></div></template>
      <el-empty v-if="!loading && !rows.length" description="No session cash records found" />

      <div v-else-if="device !== 'mobile'" class="table-wrap">
        <el-table :data="rows" size="small" style="width:100%">
          <el-table-column prop="id" label="Session" width="90" fixed="left" />
          <el-table-column prop="employeeName" label="Employee" min-width="140" />
          <el-table-column label="Clock In" min-width="165"><template #default="{ row }">{{ dateTime(row.clockIn) }}</template></el-table-column>
          <el-table-column label="Opening" min-width="105"><template #default="{ row }">{{ money(row.opening) }}</template></el-table-column>
          <el-table-column label="Received" min-width="105"><template #default="{ row }">{{ money(row.received) }}</template></el-table-column>
          <el-table-column label="Cash Expenses" min-width="125"><template #default="{ row }">{{ money(row.cashExpenses) }}</template></el-table-column>
          <el-table-column label="Points Expense" min-width="125"><template #default="{ row }">{{ money(row.pointsExpense) }}</template></el-table-column>
          <el-table-column label="Owner/Admin Taken" min-width="145"><template #default="{ row }">{{ money(row.ownerWithdrawals) }}</template></el-table-column>
          <el-table-column label="Total Expenses" min-width="125"><template #default="{ row }">{{ money(row.expenses) }}</template></el-table-column>
          <el-table-column label="Expected Closing" min-width="135"><template #default="{ row }">{{ row.closingBalance == null ? 'Open' : money(row.closingBalance) }}</template></el-table-column>
          <el-table-column label="Actual Cash" min-width="115"><template #default="{ row }">{{ row.actualCash == null ? '—' : money(row.actualCash) }}</template></el-table-column>
          <el-table-column label="Short / Over" min-width="115" fixed="right">
            <template #default="{ row }"><span v-if="row.variance != null" :class="varianceClass(row.variance)">{{ signedMoney(row.variance) }}</span><span v-else>—</span></template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="mobile-list">
        <el-card v-for="row in rows" :key="row.id" shadow="never" class="mobile-card">
          <div class="mobile-head"><div><strong>Session #{{ row.id }}</strong><span>{{ row.employeeName }}</span></div><span :class="varianceClass(row.variance)">{{ row.variance == null ? 'Open' : signedMoney(row.variance) }}</span></div>
          <div class="mobile-date">{{ dateTime(row.clockIn) }}</div>
          <div class="mobile-grid">
            <div><span>Opening</span><strong>{{ money(row.opening) }}</strong></div>
            <div><span>Received</span><strong>{{ money(row.received) }}</strong></div>
            <div><span>Cash Expenses</span><strong>{{ money(row.cashExpenses) }}</strong></div>
            <div><span>Points Expense</span><strong>{{ money(row.pointsExpense) }}</strong></div>
            <div><span>Owner/Admin Taken</span><strong>{{ money(row.ownerWithdrawals) }}</strong></div>
            <div><span>Expected</span><strong>{{ row.closingBalance == null ? 'Open' : money(row.closingBalance) }}</strong></div>
            <div><span>Actual</span><strong>{{ row.actualCash == null ? '—' : money(row.actualCash) }}</strong></div>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import { useAppStore } from '@/store/modules/app';
import { getSessionCashHistoryReport } from '@/api/employeefinance';

const router = useRouter();
const userStore = useUserStore();
const appStore = useAppStore();
const device = computed(() => appStore.device);
const locationId = computed(() => userStore.locationId);
const isAdmin = computed(() => ['owner', 'admin', 'system admin'].includes(String(userStore.roleName || '').toLowerCase()));

const loading = ref(false);
const dateRange = ref([]);
const employeeId = ref(null);
const employees = ref([]);
const rows = ref([]);
const summary = ref({});

const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const number = value => Number(value || 0).toLocaleString();
const dateTime = value => value ? new Date(value).toLocaleString() : '—';
const varianceClass = value => Number(value) < 0 ? 'short-text' : Number(value) > 0 ? 'over-text' : '';
const signedMoney = value => `${Number(value) > 0 ? '+' : ''}${money(value)}`;
const rangeLabel = computed(() => dateRange.value?.length === 2 ? `${dateRange.value[0]} → ${dateRange.value[1]}` : 'All time');

async function loadReport() {
  if (!locationId.value) return;
  try {
    loading.value = true;
    const params = { locationid: locationId.value };
    if (dateRange.value?.length === 2) {
      params.startdate = dateRange.value[0];
      params.enddate = dateRange.value[1];
    }
    if (isAdmin.value && employeeId.value) params.employeeid = employeeId.value;
    const data = (await getSessionCashHistoryReport(params)).data || {};
    rows.value = data.rows || [];
    summary.value = data.summary || {};
    employees.value = data.employees || [];
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e?.message || 'Unable to load session cash report.');
  } finally {
    loading.value = false;
  }
}

async function clearFilters() {
  dateRange.value = [];
  employeeId.value = null;
  await loadReport();
}

onMounted(loadReport);
</script>

