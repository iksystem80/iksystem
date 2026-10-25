<template>
  <div class="app-container loan-report">
    <div class="page-header">
      <div>
        <h2 class="page-title">Loan Report</h2>
        <p>View open and closed employee loans with complete transaction history.</p>
      </div>
      <div class="header-actions">
        <el-button class="action-button" @click="filterDrawer = true"><el-icon><Filter /></el-icon><span>Filter</span></el-button>
        <el-button circle @click="loadLoans" :loading="loading" aria-label="Refresh loans">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="summary-row">
      <el-col :xs="12" :sm="12" :md="6" class="summary-column">
        <el-card shadow="never" class="summary-card summary-teal"><div class="summary-card-content">
          <div class="summary-icon"><el-icon><Wallet /></el-icon></div>
          <el-statistic title="Loan Accounts" :value="filteredLoans.length" />
        </div></el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" class="summary-column">
        <el-card shadow="never" class="summary-card summary-blue"><div class="summary-card-content">
          <div class="summary-icon"><el-icon><Money /></el-icon></div>
          <el-statistic title="Total Loaned" :value="summary.loaned" :precision="2" prefix="$" />
        </div></el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" class="summary-column">
        <el-card shadow="never" class="summary-card summary-green"><div class="summary-card-content">
          <div class="summary-icon"><el-icon><CircleCheck /></el-icon></div>
          <el-statistic title="Total Returned" :value="summary.returned" :precision="2" prefix="$" />
        </div></el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" class="summary-column">
        <el-card shadow="never" class="summary-card summary-orange"><div class="summary-card-content">
          <div class="summary-icon"><el-icon><Coin /></el-icon></div>
          <el-statistic title="Remaining Balance" :value="summary.remaining" :precision="2" prefix="$" />
        </div></el-card>
      </el-col>
    </el-row>

    <el-drawer v-model="filterDrawer" direction="rtl" size="min(360px, 100%)" class="filter-drawer">
      <template #header><div class="drawer-header"><div class="drawer-icon"><el-icon><Filter /></el-icon></div>
        <div><div class="drawer-title">Filter Loans</div><div class="drawer-subtitle">Filter by repayment status or account.</div></div></div>
      </template>
      <div class="filter-section"><div class="filter-label">Loan status</div>
        <el-select v-model="status" style="width: 100%">
          <el-option label="Open" value="open" /><el-option label="Closed" value="closed" /><el-option label="All Loans" value="all" />
        </el-select>
      </div>
      <div class="filter-section"><div class="filter-label">Employee or lender</div>
        <el-input v-model="search" clearable placeholder="Search name" />
      </div>
      <template #footer><div class="drawer-footer"><el-button @click="resetFilters">Clear</el-button></div></template>
    </el-drawer>

    <el-card shadow="never" class="table-card app-table-card loan-desktop" v-loading="loading">
      <template #header>
        <div class="loan-table-header">
          <div class="loan-table-title">
            <!--<el-icon><Wallet /></el-icon>-->
            <LcHandCoins :size="24" :stroke-width="1.3" />
            <div class="loan-table-heading-text">
              <strong>{{ statusLabel }} Loans</strong>
              <div class="loan-table-subtitle">Employee loan accounts and repayment details</div>
            </div>
          </div>
          <span class="loan-table-count">{{ filteredLoans.length }} account(s) · Click a row for transaction details</span>
        </div>
      </template>
      <el-empty v-if="!loading && !filteredLoans.length" class="app-table-empty" description="No loans found" />
      <el-table v-else :data="filteredLoans" row-key="accountKey" class="app-data-table is-compact"
                :expand-row-keys="expandedRows" @expand-change="onExpand">
        <el-table-column type="expand" width="46">
          <template #default="{ row }"><div class="entry-container">
            <!--<div class="entry-heading">Complete Transaction History</div>-->
            <el-table :data="row.entries" size="small" class="app-data-table">
              <el-table-column label="Date / Time" min-width="160"><template #default="{ row: entry }">{{ formatDate(entry.createdAt) }}</template></el-table-column>
              <el-table-column label="Transaction" min-width="145"><template #default="{ row: entry }">{{ entry.type === 'LOAN' ? 'Loan to Bank' : 'Loan Return' }}</template></el-table-column>
              <el-table-column label="Amount" min-width="115" align="right"><template #default="{ row: entry }"><strong :class="entry.type === 'LOAN' ? 'amount-plus' : 'amount-minus'">{{ entry.type === 'LOAN' ? '+' : '−' }}{{ money(entry.amount) }}</strong></template></el-table-column>
              <el-table-column label="Employee Session" width="135"><template #default="{ row: entry }">#{{ entry.employeeSessionId }}</template></el-table-column>
              <el-table-column label="Reading Session" width="130"><template #default="{ row: entry }">{{ entry.readingSessionId ? `#${entry.readingSessionId}` : 'Unreconciled' }}</template></el-table-column>
              <el-table-column prop="notes" label="Notes" min-width="160"><template #default="{ row: entry }">{{ entry.notes || '—' }}</template></el-table-column>
            </el-table>
          </div></template>
        </el-table-column>
        <el-table-column label="Employee" min-width="165"><template #default="{ row }"><div class="table-cell"><el-avatar :size="38">{{ initials(row.employeeName) }}</el-avatar><div class="table-meta"><strong>{{ row.employeeName }}</strong><span>Employee</span></div></div></template></el-table-column>
        <el-table-column label="Lender" min-width="145" prop="lenderName" />
        <el-table-column label="Loan Amount" min-width="130" align="right"><template #default="{ row }">{{ money(row.loanAmount) }}</template></el-table-column>
        <el-table-column label="Returned" min-width="125" align="right"><template #default="{ row }">{{ money(row.returnAmount) }}</template></el-table-column>
        <el-table-column label="Remaining" min-width="130" align="right"><template #default="{ row }"><strong :class="row.status === 'open' ? 'balance-open' : 'balance-closed'">{{ money(row.remainingBalance) }}</strong></template></el-table-column>
        <el-table-column label="Status" width="95" align="center"><template #default="{ row }"><el-tag round :type="row.status === 'open' ? 'warning' : 'success'" effect="light">{{ row.status === 'open' ? 'Open' : 'Closed' }}</el-tag></template></el-table-column>
      </el-table>
    </el-card>

    <div class="loan-mobile" v-loading="loading">
      <el-empty v-if="!loading && !filteredLoans.length" description="No loans found" />
      <el-card v-for="loan in filteredLoans" :key="loan.accountKey" shadow="never" class="loan-mobile-card">
        <div class="loan-mobile-head"><div><strong>{{ loan.employeeName }}</strong><span>Lender: {{ loan.lenderName }}</span></div><el-tag round :type="loan.status === 'open' ? 'warning' : 'success'">{{ loan.status === 'open' ? 'Open' : 'Closed' }}</el-tag></div>
        <div class="loan-mobile-stats"><div><span>Loaned</span><strong>{{ money(loan.loanAmount) }}</strong></div><div><span>Returned</span><strong>{{ money(loan.returnAmount) }}</strong></div><div><span>Remaining</span><strong :class="loan.status === 'open' ? 'balance-open' : 'balance-closed'">{{ money(loan.remainingBalance) }}</strong></div></div>
        <el-button text type="primary" class="details-toggle" @click="toggleMobile(loan.accountKey)">{{ mobileExpanded.includes(loan.accountKey) ? 'Hide' : 'Show' }} transactions <el-icon><ArrowDown /></el-icon></el-button>
        <div v-if="mobileExpanded.includes(loan.accountKey)" class="mobile-entries">
          <div v-for="entry in loan.entries" :key="entry.id" class="mobile-entry"><div><strong>{{ entry.type === 'LOAN' ? 'Loan to Bank' : 'Loan Return' }}</strong><span>{{ formatDate(entry.createdAt) }} · Employee #{{ entry.employeeSessionId }}</span><span>Reading: {{ entry.readingSessionId ? `#${entry.readingSessionId}` : 'Unreconciled' }}</span><span v-if="entry.notes">{{ entry.notes }}</span></div><strong :class="entry.type === 'LOAN' ? 'amount-plus' : 'amount-minus'">{{ entry.type === 'LOAN' ? '+' : '−' }}{{ money(entry.amount) }}</strong></div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { useRefreshStore } from '@/store/modules/refresh'
import { getLoanReport } from '@/api/weeklyreport'
import { HandCoins as LcHandCoins } from '@lucide/vue';

const userStore = useUserStore()
const refreshStore = useRefreshStore()
const loading = ref(false)
const filterDrawer = ref(false)
const status = ref('open')
const search = ref('')
const loans = ref([])
const expandedRows = ref([])
const mobileExpanded = ref([])
const statusLabel = computed(() => ({ open: 'Open', closed: 'Closed', all: 'All' })[status.value])
const filteredLoans = computed(() => loans.value.filter(row =>
  (status.value === 'all' || row.status === status.value) &&
  (!search.value.trim() || `${row.employeeName} ${row.lenderName}`.toLowerCase().includes(search.value.trim().toLowerCase()))
))
const summary = computed(() => filteredLoans.value.reduce((acc, row) => {
  acc.loaned += Number(row.loanAmount || 0)
  acc.returned += Number(row.returnAmount || 0)
  acc.remaining += Number(row.remainingBalance || 0)
  return acc
}, { loaned: 0, returned: 0, remaining: 0 }))
const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const formatDate = value => value ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago' }) : '—'
const initials = name => String(name || 'E').split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase()
function resetFilters() { status.value = 'open'; search.value = '' }
function onExpand(row, expanded) { expandedRows.value = expanded.map(item => item.accountKey) }
function toggleMobile(key) { mobileExpanded.value = mobileExpanded.value.includes(key) ? mobileExpanded.value.filter(id => id !== key) : [...mobileExpanded.value, key] }
async function loadLoans() {
  if (!userStore.locationId) { loans.value = []; return }
  loading.value = true
  try {
    const response = await getLoanReport({ locationid: userStore.locationId })
    loans.value = (response?.data?.rows || []).map(row => ({
      ...row,
      accountKey: `${row.employeeId}-${row.lenderId}`,
      // Oldest first, so the latest loan or repayment appears at the bottom.
      entries: [...(row.entries || [])].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
        Number(a.id) - Number(b.id)
      )
    }))
  } catch (e) { console.error(e); ElMessage.error(e?.response?.data?.message || 'Unable to load Loan Report.') }
  finally { loading.value = false }
}
watch(() => userStore.locationId, loadLoans)
watch(() => refreshStore.key('adminTransactions'), loadLoans)
onMounted(loadLoans)
</script>

<style scoped>
.loan-report .summary-row { margin-bottom: 20px; }
.loan-report .loan-desktop :deep(.el-card__header) { padding: 16px 20px; border-bottom: 1px solid var(--el-border-color-lighter); }
.loan-report .loan-desktop :deep(.el-card__body) { padding: 0 0 14px; }
.loan-table-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 32px; }
.loan-table-title { display: flex; align-items: center; gap: 12px; min-width: 0; }
.loan-table-title > .el-icon { flex: none; font-size: 17px; color: var(--el-text-color-regular); }
.loan-table-heading-text { display: flex; flex-direction: column; gap: 4px; }
.loan-table-heading-text strong { color: var(--el-text-color-primary); font-size: 14px; font-weight: 650; }
.loan-table-subtitle, .loan-table-count { color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.5; }
.loan-table-count { text-align: right; }
.entry-container { padding: 12px 20px 18px; }
.entry-heading { font-size: 13px; font-weight: 650; margin-bottom: 12px; color: var(--el-text-color-primary); }
.amount-plus, .balance-closed { color: var(--el-color-success); }
.amount-minus { color: var(--el-color-danger); }
.balance-open { color: var(--el-color-warning); }
.loan-mobile { display: none; }
.loan-mobile-card { margin-bottom: 12px; }
.loan-mobile-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
.loan-mobile-head div { display: flex; flex-direction: column; gap: 4px; }
.loan-mobile-head span, .loan-mobile-stats span, .mobile-entry span { font-size: 12px; color: var(--el-text-color-secondary); }
.loan-mobile-stats { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; margin: 16px 0 10px; }
.loan-mobile-stats > div { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.loan-mobile-stats strong { font-size: 14px; }
.details-toggle { padding-left: 0; }
.mobile-entry { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-top: 1px solid var(--el-border-color-lighter); }
.mobile-entry > div { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.mobile-entry > strong { white-space: nowrap; }
@media (max-width: 767px) { .loan-desktop { display: none; } .loan-mobile { display: block; } }
@media (min-width: 768px) { .loan-mobile { display: none; } }
</style>
