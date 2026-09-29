<template>
    <div class="app-container">
        <div class="page-header">
            <div class="header-left">
                <el-button class="back-button" circle aria-label="Back" @click="router.back()"><el-icon><ArrowLeft /></el-icon></el-button>
                <div><h1>Shift Report</h1><p v-if="report?.session">Session #{{ report.session.id }} · {{ report.session.employeeName }}</p></div>
            </div>
            <el-button :icon="Refresh" :loading="loading" @click="loadReport">Refresh</el-button>
        </div>
        <el-skeleton v-if="loading && !report" :rows="8" animated />
        <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" class="notice" />
        <template v-if="report">
            <el-card shadow="never" class="session-card" v-loading="loading">
                <div class="session-grid">
                    <div><span>Employee</span><strong>{{ report.session.employeeName }}</strong></div>
                    <div><span>Clock In</span><strong>{{ dateTime(report.session.clockIn) }}</strong></div>
                    <div><span>Clock Out</span><strong>{{ report.session.clockOut ? dateTime(report.session.clockOut) : 'In Progress' }}</strong></div>
                    <div><span>Duration</span><strong>{{ duration(report.session) }}</strong></div>
                </div>
            </el-card>
            <div class="metric-grid" v-loading="loading">
                <el-card v-for="item in metrics" :key="item.label" shadow="never" class="metric-card">
                    <span>{{ item.label }}</span><strong :class="item.tone || ''">{{ money(item.value) }}</strong>
                    <small v-if="item.detail">{{ item.detail }}</small>
                </el-card>
            </div>
            <div class="panel-grid">
                <el-card shadow="never" class="panel">
                    <template #header>
                        <div class="panel-heading"><strong>Cash reconciliation</strong><span>Same components as Employee Session Cash</span></div>
                    </template>
                    <div class="reconcile-row"><span>Opening cash</span><strong>{{ money(summary.opening) }}</strong></div>
                    <div class="reconcile-row"><span>More cash received</span><strong>{{ money(summary.received) }}</strong></div>
                    <div class="reconcile-row"><span>Cash expenses</span><strong class="debit">−{{ money(summary.cashExpenses) }}</strong></div>
                    <div class="reconcile-row"><span>Cash points expense</span><strong class="debit">−{{ money(summary.pointsExpense) }}</strong></div>
                    <div class="reconcile-row"><span>Owner/Admin cash taken</span><strong class="debit">−{{ money(summary.ownerWithdrawals) }}</strong></div>
                    <div class="reconcile-row final"><span>Calculated cash balance</span><strong>{{ money(summary.balance) }}</strong></div>
                </el-card>
                <el-card shadow="never" class="panel">
                    <template #header>
                        <div class="panel-heading"><strong>Session closing & handover</strong><span>Recorded at clock-out, if available</span></div>
                    </template>
                    <template v-if="report.closing">
                        <div class="reconcile-row"><span>Expected closing</span><strong>{{ money(report.closing.closingBalance) }}</strong></div>
                        <div class="reconcile-row"><span>Physical cash counted</span><strong>{{ money(report.closing.actualCash) }}</strong></div>
                        <div class="reconcile-row"><span>Short / over</span><strong :class="Number(report.closing.variance) < 0 ? 'debit' : Number(report.closing.variance) > 0 ? 'credit' : ''">{{ signedMoney(report.closing.variance) }}</strong></div>
                        <div class="reconcile-row"><span>Handed to</span><strong>{{ report.closing.recipientName || '—' }}</strong></div>
                        <div class="reconcile-row"><span>Handover amount</span><strong>{{ money(report.closing.handoverAmount) }}</strong></div>
                        <div class="reconcile-row"><span>Handover status</span><el-tag :type="report.closing.handoverStatus === 'Accepted' ? 'success' : 'warning'" effect="light">{{ report.closing.handoverStatus || '—' }}</el-tag></div>
                        <div class="reconcile-row"><span>Closed at</span><strong>{{ dateTime(report.closing.closedAt) }}</strong></div>
                        <div v-if="report.closing.handoverAcceptedAt" class="reconcile-row"><span>Accepted at</span><strong>{{ dateTime(report.closing.handoverAcceptedAt) }}</strong></div>
                        <p v-if="report.closing.handoverNotes" class="closing-notes">{{ report.closing.handoverNotes }}</p>
                    </template>
                    <el-empty v-else :image-size="60" description="No recorded cash closing or handover for this session." />
                </el-card>
            </div>

            <el-card shadow="never" class="panel ledger-panel" v-loading="loading">
                <template #header>
                    <div class="ledger-header">
                        <div class="panel-heading"><strong>Complete shift activity</strong><span>{{ transactions.length }} recorded movements · oldest first</span></div>
                        <el-input v-model="search" clearable placeholder="Search activity" class="search-input" :prefix-icon="Search" />
                    </div>
                </template>
                <el-alert type="info" :closable="false" show-icon class="notice" title="Read-only historical report" description="Point assignments are shown once from CustomerMatch; they are not duplicated as cash transactions. Pending funding is not credited until accepted." />
                <el-empty v-if="!filteredTransactions.length" :image-size="70" description="No matching shift activity" />
                <template v-else>
                    <div class="desktop-table">
                        <el-table :data="filteredTransactions" row-key="key" stripe>
                            <el-table-column label="Time" min-width="165">
                            <template #default="{row}">
                                {{ dateTime(row.eventAt) }}
                            </template></el-table-column>
                            <el-table-column label="Activity" min-width="220">
                            <template #default="{row}">
                                <strong>{{ typeLabel(row) }}</strong>
                                <div class="row-subtitle">{{ rowDescription(row) }}</div>
                            </template></el-table-column>
                            <el-table-column label="Details" min-width="200">
                            <template #default="{row}">
                                {{ row.notes || '—' }}
                            </template></el-table-column>
                            <el-table-column label="Amount" width="140" align="right">
                            <template #default="{row}">
                                <strong :class="row.signedAmount < 0 ? 'debit' : 'credit'">{{ signedMoney(row.signedAmount) }}</strong>
                            </template></el-table-column>
                            <el-table-column label="Balance after" width="145" align="right">
                            <template #default="{row}">
                                <strong>{{ money(row.runningBalance) }}</strong>
                            </template></el-table-column>
                        </el-table>
                    </div>
                    <div class="mobile-list">
                        <div v-for="row in filteredTransactions" :key="row.key" class="mobile-entry">
                            <div class="entry-top"><strong>{{ typeLabel(row) }}</strong><strong :class="row.signedAmount < 0 ? 'debit' : 'credit'">{{ signedMoney(row.signedAmount) }}</strong></div>
                            <span class="entry-subtitle">{{ dateTime(row.eventAt) }}</span><p>{{ rowDescription(row) }}</p><p v-if="row.notes">{{ row.notes }}</p><div class="entry-balance">Balance after <strong>{{ money(row.runningBalance) }}</strong></div>
                        </div>
                    </div>
                </template>
            </el-card>
        </template>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh, Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { getEmployeeSessionShiftReport } from '@/api/employeesession'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const error = ref('')
const search = ref('')
const report = ref(null)
const summary = computed(() => report.value?.summary || {})
const transactions = computed(() => (report.value?.transactions || []).map(row => ({ ...row, key: `${row.kind}-${row.id}` })))
const filteredTransactions = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return transactions.value
  return transactions.value.filter(row => [typeLabel(row), rowDescription(row), row.notes, row.createdByName]
    .some(value => String(value || '').toLowerCase().includes(term)))
})
const metrics = computed(() => [
  { label: 'Opening balance', value: summary.value.opening },
  { label: 'Additional cash received', value: summary.value.received },
  { label: 'Match points given', value: summary.value.pointsExpense, detail: `${Number(summary.value.pointsCount || 0)} assignments` },
  { label: 'Cash expenses', value: summary.value.cashExpenses },
  { label: 'Owner/Admin cash taken', value: summary.value.ownerWithdrawals },
  { label: 'Calculated cash balance', value: summary.value.balance, tone: 'balance-value' }
])
const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const signedMoney = value => `${Number(value || 0) < 0 ? '−' : Number(value || 0) > 0 ? '+' : ''}${money(Math.abs(Number(value || 0)))}`
const dateTime = value => value ? new Date(value).toLocaleString([], { month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit' }) : '—'
function duration(session) {
  const hours = session.clockOut ? Number(session.totalWorkingHours || 0) : Math.max(0,(Date.now()-new Date(session.clockIn).getTime())/3600000)
  const minutes = Math.round(hours * 60)
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}
function typeLabel(row) {
  if (row.type === 'POINTS_EXPENSE') return 'Customer match points'
  if (row.type === 'OPENING') return row.fundingId ? 'Owner/Admin opening cash' : 'Opening balance'
  if (row.type === 'OPENING_TRANSFER') return 'Opening handover received'
  if (row.type === 'TRANSFER_IN') return 'Additional employee handover'
  if (row.type === 'CASH_RECEIVED') return row.fundingId ? 'Owner/Admin business support' : 'Additional cash received'
  if (row.type === 'EXPENSE') return row.expenseTypeName || 'Cash expense'
  if (row.type === 'OWNER_WITHDRAWAL') return 'Owner/Admin cash taken'
  return row.type || 'Transaction'
}
function rowDescription(row) {
  if (row.type === 'POINTS_EXPENSE') return `${row.customerName || `Customer #${row.customerId}`} · ${row.machineNumber == null ? `Machine ID #${row.machineId || '—'}` : `Machine #${row.machineNumber}`}`
  if (row.fundingId) return `From ${row.fromAdmin || 'Owner/Admin'} · Funding #${row.fundingId}`
  if (row.transferId) return `From ${row.fromEmployee || 'Employee'} · Session #${row.fromSessionId || '—'}`
  if (row.type === 'OWNER_WITHDRAWAL') return `Taken by ${row.createdByName || 'Owner/Admin'}`
  return row.createdByName ? `Recorded by ${row.createdByName}` : 'Session transaction'
}
async function loadReport() {
  const id = Number(route.params.sessionId)
  const location = Number(userStore.locationId)
  if (!id || !location) return
  try {
    loading.value = true; error.value = ''
    const response = await getEmployeeSessionShiftReport(id, location)
    report.value = response?.data || null
    if (!report.value) throw new Error('Shift report data was not returned.')
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.message || e?.message || 'Unable to load shift report.'
    report.value = null
    ElMessage.error(error.value)
  } finally { loading.value = false }
}
watch(() => [route.params.sessionId, userStore.locationId], loadReport)
onMounted(loadReport)
</script>


