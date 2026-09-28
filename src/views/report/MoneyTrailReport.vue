<template>
  <div class="report-page irfan-report-moneytrailreport irfan-ui-page">
    <div class="page-header">
      <div class="header-left">
        <el-button circle class="back-button" @click="router.back()"><el-icon><ArrowLeft /></el-icon></el-button>
        <div><h2>Complete Money Trail Report</h2><p>Owner/Admin audit trail across funding, sessions, expenses, points, handovers, and closings.</p></div>
      </div>
      <el-button :loading="loading" @click="loadReport"><el-icon><Refresh /></el-icon>Refresh</el-button>
    </div>
    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <div><label>Date range</label><el-date-picker v-model="dateRange" type="daterange" range-separator="to" start-placeholder="Start date" end-placeholder="End date" value-format="YYYY-MM-DD" clearable style="width:100%" /></div>
        <div><label>Employee</label><el-select v-model="employeeId" clearable filterable placeholder="All employees" style="width:100%">
          <el-option v-for="item in employees" :key="item.id" :label="item.name" :value="item.id" />
        </el-select></div>
        <div class="filter-actions">
          <el-button @click="clearFilters">All Time</el-button>
          <el-button type="primary" :loading="loading" @click="loadReport">Apply</el-button>
        </div>
      </div>
    </el-card>
    <div class="summary-grid">
      <el-card shadow="never" class="summary"><span>Admin Funded</span><strong>{{ money(summary.fundedAccepted) }}</strong></el-card>
      <el-card shadow="never" class="summary"><span>Funding Pending</span><strong>{{ money(summary.fundedPending) }}</strong></el-card>
      <el-card shadow="never" class="summary"><span>Cash Expenses</span><strong>{{ money(summary.cashExpenses) }}</strong></el-card>
      <el-card shadow="never" class="summary"><span>Cash Points Expense</span><strong>{{ money(summary.pointsExpense) }}</strong></el-card>
      <el-card shadow="never" class="summary"><span>Owner/Admin Cash Taken</span><strong>{{ money(summary.ownerWithdrawals) }}</strong></el-card>
      <el-card shadow="never" class="summary short"><span>Short</span><strong>{{ money(summary.short) }}</strong></el-card>
      <el-card shadow="never" class="summary over"><span>Over</span><strong>{{ money(summary.over) }}</strong></el-card>
    </div>
    <el-card shadow="never" class="report-card" v-loading="loading">
      <template #header><div><strong>Complete Money Trail</strong><div class="small-text">{{ rows.length }} event{{ rows.length === 1 ? '' : 's' }} · {{ rangeLabel }}</div></div></template>
      <el-empty v-if="!loading && !rows.length" description="No financial events found" />

      <div v-else-if="device !== 'mobile'" class="table-wrap">
        <el-table :data="rows" size="small" style="width:100%">
          <el-table-column label="Date" min-width="170" fixed="left"><template #default="{ row }">{{ dateTime(row.eventAt) }}</template></el-table-column>
          <el-table-column prop="employee" label="Employee" min-width="140" />
          <el-table-column label="Event" min-width="160"><template #default="{ row }">{{ typeLabel(row.type) }}</template></el-table-column>
          <el-table-column label="Amount" min-width="115"><template #default="{ row }">{{ money(row.amount) }}</template></el-table-column>
          <el-table-column prop="description" label="Details" min-width="260" show-overflow-tooltip />
          <el-table-column prop="status" label="Status" min-width="105" />
          <el-table-column label="Session" min-width="95"><template #default="{ row }">{{ row.sessionId ? `#${row.sessionId}` : '—' }}</template></el-table-column>
          <el-table-column label="Short / Over" min-width="115" fixed="right">
            <template #default="{ row }"><span v-if="row.variance != null" :class="varianceClass(row.variance)">{{ signedMoney(row.variance) }}</span><span v-else>—</span></template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="mobile-list">
        <el-card v-for="row in rows" :key="row.id" shadow="never" class="mobile-card">
          <div class="mobile-head"><div><strong>{{ typeLabel(row.type) }}</strong><span>{{ row.employee || '—' }}</span></div><strong>{{ money(row.amount) }}</strong></div>
          <div class="mobile-date">{{ dateTime(row.eventAt) }}</div>
          <p>{{ row.description }}</p>
          <div class="mobile-footer"><el-tag effect="light" size="small">{{ row.status }}</el-tag><span v-if="row.variance != null" :class="varianceClass(row.variance)">{{ signedMoney(row.variance) }}</span></div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import { getAdminMoneyTrailReport } from '@/api/employeeFinance'

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const device = computed(() => appStore.device)
const locationId = computed(() => userStore.locationId)

const loading = ref(false)
const dateRange = ref([])
const employeeId = ref(null)
const employees = ref([])
const rows = ref([])
const summary = ref({})

const money = value => Number(value || 0).toLocaleString('en-US',{ style:'currency',currency:'USD' })
const dateTime = value => value ? new Date(value).toLocaleString() : '—'
const varianceClass = value => Number(value) < 0 ? 'short-text' : Number(value) > 0 ? 'over-text' : ''
const signedMoney = value => `${Number(value) > 0 ? '+' : ''}${money(value)}`
const rangeLabel = computed(() => dateRange.value?.length === 2 ? `${dateRange.value[0]} → ${dateRange.value[1]}` : 'All time')
const typeLabel = type => ({
  CUSTODY_INITIAL_CAPITAL: 'Owner Initial Capital',
  CUSTODY_OWNER_TO_ADMIN: 'Owner → Admin Cash Transfer',
  CUSTODY_ADMIN_TO_OWNER: 'Admin → Owner Cash Transfer',
  CUSTODY_CUTOVER_OPENING: 'Verified Historical Opening',
  CUSTODY_BANK_DEPOSIT: 'Business Bank Deposit',
  CUSTODY_BANK_WITHDRAWAL: 'Business Bank → Owner Cash',
  CUSTODY_OWNER_DISTRIBUTION: 'Owner Distribution',
  CUSTODY_DIRECT_EXPENSE: 'Direct Business Expense',
  ADMIN_FUNDING:'Owner/Admin Funding', OPENING:'Opening Balance', OPENING_TRANSFER:'Opening Handover',
  TRANSFER_IN:'Employee Handover Received', CASH_RECEIVED:'Additional Cash', EXPENSE:'Cash Expense',
  POINTS_EXPENSE:'Cash Points Expense', OWNER_WITHDRAWAL:'Owner/Admin Cash Taken', EMPLOYEE_HANDOVER:'Employee Handover', SESSION_CLOSING:'Session Closing'
}[type] || type)

async function loadReport() {
  if (!locationId.value) return
  try {
    loading.value = true
    const params = { locationid: locationId.value }
    if (dateRange.value?.length === 2) {
      params.startdate = dateRange.value[0]
      params.enddate = dateRange.value[1]
    }
    if (employeeId.value) params.employeeid = employeeId.value
    const data = (await getAdminMoneyTrailReport(params)).data || {}
    rows.value = data.rows || []
    summary.value = data.summary || {}
    employees.value = data.employees || []
  } catch(e) {
    ElMessage.error(e?.response?.data?.message || e?.message || 'Unable to load money trail report.')
  } finally {
    loading.value = false
  }
}

async function clearFilters() {
  dateRange.value = []
  employeeId.value = null
  await loadReport()
}

onMounted(loadReport)
</script>


