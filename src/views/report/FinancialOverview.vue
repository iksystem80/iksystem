<template>
  <div class="app-container finance-page irfan-report-financialoverview irfan-ui-page">
    <div class="page-header">
      <div><h2 class="page-title">Financial Overview</h2><p>Current position, financial activity, and complete money trail.</p></div>
      <!--<div class="page-actions">
                <el-button @click="router.push('/finance/owner-admin-transactions')">Owner/Admin Transactions</el-button>
                <el-button :icon="Refresh" :loading="loading" @click="load">Refresh</el-button>
            </div>-->
    </div>
    <el-alert v-if="!isAdmin" type="error" title="Owner/Admin access required" show-icon :closable="false" />
    <template v-else>
      <el-tabs v-model="activeFinanceTab" class="finance-tabs">
        <el-tab-pane label="Overview" name="overview">
          <el-card shadow="never" class="space-top current-position-card">
            <template #header>
              <strong>Current Position</strong>
            </template>
            <div class="current-position">
              <div><span>Active Employee Cash Balance</span><strong>{{ money(adminCurrentBalance) }}</strong><small>Cash in active employee sessions (after recorded withdrawals and expenses)</small></div>
              <el-tag type="info" effect="plain">{{ adminCashHolders.length }} active session{{ adminCashHolders.length === 1 ? '' : 's' }}</el-tag>
            </div>
            <div class="custody-summary space-top">
              <el-card shadow="never" class="finance-stat-card" style="--accent:#409eff;--accent-soft:color-mix(in srgb, #409eff 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><Wallet /></el-icon></div><div class="finance-stat-content"><span>Owner Cash</span><strong>{{ money(custodyTotal('OWNER')) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#40c9c6;--accent-soft:color-mix(in srgb, #40c9c6 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><UserFilled /></el-icon></div><div class="finance-stat-content"><span>Admin Cash</span><strong>{{ money(custodyTotal('ADMIN')) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#67c23a;--accent-soft:color-mix(in srgb, #67c23a 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><CreditCard /></el-icon></div><div class="finance-stat-content"><span>Business Bank</span><strong>{{ money(custodyTotal('BANK')) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#e6a23c;--accent-soft:color-mix(in srgb, #e6a23c 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><Money /></el-icon></div><div class="finance-stat-content"><span>Owner Distributions · All Time</span><strong>{{ money(custody.lifetime?.ownerDistributions) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#909399;--accent-soft:color-mix(in srgb, #909399 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><Switch /></el-icon></div><div class="finance-stat-content"><span>Pending Employee Handovers</span><strong>{{ money(custody.pendingEmployeeHandovers) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#8e6ccf;--accent-soft:color-mix(in srgb, #8e6ccf 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><Coin /></el-icon></div><div class="finance-stat-content"><span>Tracked Business Funds</span><strong>{{ money(custodyTotal('OWNER')+custodyTotal('ADMIN')+custodyTotal('BANK')+adminCurrentBalance+Number(custody.pendingEmployeeHandovers||0)) }}</strong></div></div></el-card>
            </div>
            <el-alert v-if="Number(custody.unlinkedProfit?.count)" class="space-top" :closable="false" type="warning" show-icon :title="`${custody.unlinkedProfit.count} older profit postings need custody reconciliation`" description="Do not credit historical machine profit again until physical holdings have been verified." />
            <div class="reading-profit-position">
              <span>Posted Reading Profit · All Time</span>
              <strong class="credit">{{ money(adminSummary.readingProfitBalance) }}</strong>
              <small>Tracked separately from physical cash held in employee sessions.</small>
            </div>
            <el-alert type="info" :closable="false" show-icon class="space-top" title="Machine collections are tracked in Admin custody" description="New positive reading-profit postings credit the posting Admin's physical cash ledger. Earlier postings require a one-time reconciliation; employee handovers remain separate." /><el-button class="space-top" type="primary" plain @click="router.push('location-cash')">View Owner, Admin & Bank Balances</el-button>
            <el-table v-if="adminCashHolders.length" :data="adminCashHolders" size="small" class="cash-holders-table">
              <el-table-column prop="name" label="Employee" min-width="160" />
              <el-table-column label="Session" min-width="90">
                <template #default="{ row }">
                  #{{ row.sessionId }}
                </template>
              </el-table-column>
              <el-table-column label="Available Cash" min-width="130" align="right">
                <template #default="{ row }">
                  {{ money(row.currentCash) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>
        <el-tab-pane label="Financial Activity" name="activity">
          <el-card shadow="never" class="financial-activity-card">
            <div class="financial-activity-header">
              <div class="activity-header-info">
                <strong>Financial Activity · Selected Dates</strong>
                <p class="activity-period">
                  {{ activityDateLabel }} · America/Chicago business dates
                </p>
              </div>

              <el-button class="action-button" @click="openActivityFilter">
                <el-icon><Filter /></el-icon>
                <span>Filter</span>
              </el-button>
            </div>
            <el-drawer v-model="activityFilterDrawer" title="Financial Activity Date Filter" direction="rtl" size="min(420px, 100%)" append-to-body>
              <div class="activity-filter-drawer">
                <el-radio-group v-model="draftActivityRange" size="large" class="view-mode-switch activity-range-switch">
                  <el-radio-button label="today"><el-icon><Calendar /></el-icon> Today</el-radio-button>
                  <el-radio-button label="week"><el-icon><Clock /></el-icon> This Week</el-radio-button>
                  <el-radio-button label="month"><el-icon><Tickets /></el-icon> This Month</el-radio-button>
                  <el-radio-button label="custom"><el-icon><Edit /></el-icon> Custom</el-radio-button>
                </el-radio-group>
                <el-date-picker v-if="draftActivityRange === 'custom'" v-model="draftActivityDates" type="daterange" value-format="YYYY-MM-DD" format="MM/DD/YYYY" range-separator="to" start-placeholder="Start" end-placeholder="End" :clearable="false" style="width:100%" />
              </div>
              <template #footer>
                <el-button @click="activityFilterDrawer = false">Cancel</el-button>
                <el-button type="primary" :disabled="draftActivityRange === 'custom' && (!Array.isArray(draftActivityDates) || draftActivityDates.length !== 2)" @click="applyActivityFilter">Apply Filter</el-button>
              </template>
            </el-drawer>
            <!--<p class="activity-period">{{ activityDateLabel }} · America/Chicago business dates</p>-->
            <el-alert class="cash-workflow-alert" style="margin-top:10px;"
                      type="warning"
                      show-icon
                      :closable="false"
                      title="Separate cash workflows"
                      description="Employee expenses and customer points reduce employee session cash and handovers. Machine reading results are posted separately to the location and positive collections credit Admin custody. These figures are not combined into an operating-result calculation." />
            <div class="admin-stats-grid">
              <el-card shadow="never" class="finance-stat-card" style="--accent:#409eff;--accent-soft:color-mix(in srgb, #409eff 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><Wallet /></el-icon></div><div class="finance-stat-content"><span>Owner/Admin funded</span><strong>{{ money(activitySummary.fundedAccepted) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#e6a23c;--accent-soft:color-mix(in srgb, #e6a23c 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><Clock /></el-icon></div><div class="finance-stat-content"><span>Funding pending</span><strong>{{ money(activitySummary.fundedPending) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#f56c6c;--accent-soft:color-mix(in srgb, #f56c6c 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><ShoppingCart /></el-icon></div><div class="finance-stat-content"><span>Employee session cash expenses</span><strong>{{ money(activitySummary.employeeCashExpenses) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#8e6ccf;--accent-soft:color-mix(in srgb, #8e6ccf 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><Coin /></el-icon></div><div class="finance-stat-content"><span>Customer points assigned</span><strong>{{ money(activitySummary.pointsExpense) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#909399;--accent-soft:color-mix(in srgb, #909399 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><CreditCard /></el-icon></div><div class="finance-stat-content"><span>Direct business expenses</span><strong>{{ money(activitySummary.directBusinessExpenses) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#40c9c6;--accent-soft:color-mix(in srgb, #40c9c6 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><Money /></el-icon></div><div class="finance-stat-content"><span>Owner/Admin cash taken</span><strong>{{ money(activitySummary.ownerWithdrawals) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#67c23a;--accent-soft:color-mix(in srgb, #67c23a 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><TrendCharts /></el-icon></div><div class="finance-stat-content"><span>Machine reading result posted</span><strong>{{ money(activitySummary.readingProfit) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#67c23a;--accent-soft:color-mix(in srgb, #67c23a 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><CircleCheck /></el-icon></div><div class="finance-stat-content"><span>Employee handover over</span><strong>{{ money(activitySummary.over) }}</strong></div></div></el-card>
              <el-card shadow="never" class="finance-stat-card" style="--accent:#f56c6c;--accent-soft:color-mix(in srgb, #f56c6c 11%, transparent)"><div class="finance-stat-layout"><div class="finance-stat-icon"><el-icon><Warning /></el-icon></div><div class="finance-stat-content"><span>Employee handover short</span><strong>{{ money(activitySummary.short) }}</strong></div></div></el-card>
            </div>
          </el-card>

          <el-card shadow="never" class="space-top">
            <template #header>
              <div class="report-filter-header">
                <strong>Session cash history · {{ activityDateLabel }}</strong><el-button link type="primary" @click="router.push('/finance/session-cash-report')">Full Report</el-button>
              </div>
            </template>
            <el-empty v-if="!history.length" description="No historical cash sessions" :image-size="70" />
            <div v-else class="history-wrap">
              <el-table :data="history" size="small" style="width:100%">
                <el-table-column prop="id" label="Session" width="90" />
                <el-table-column prop="employeeName" label="Employee" min-width="135" />
                <el-table-column label="Clock in" min-width="165">
                  <template #default="{ row }">
                    {{ dateTime(row.clockIn) }}
                  </template>
                </el-table-column>
                <el-table-column label="Opening" min-width="110">
                  <template #default="{ row }">
                    {{ money(row.opening) }}
                  </template>
                </el-table-column>
                <el-table-column label="Received" min-width="110">
                  <template #default="{ row }">
                    {{ money(row.received) }}
                  </template>
                </el-table-column>
                <el-table-column label="Cash expenses" min-width="120">
                  <template #default="{ row }">
                    {{ money(row.cashExpenses) }}
                  </template>
                </el-table-column>
                <el-table-column label="Cash Points Expense" min-width="155">
                  <template #default="{ row }">
                    {{ money(row.pointsExpense) }}
                  </template>
                </el-table-column>
                <el-table-column label="Owner/Admin Taken" min-width="145">
                  <template #default="{ row }">
                    {{ money(row.ownerWithdrawals) }}
                  </template>
                </el-table-column>
                <el-table-column label="Total expenses" min-width="120">
                  <template #default="{ row }">
                    {{ money(row.expenses) }}
                  </template>
                </el-table-column>
                <el-table-column label="Expected closing" min-width="130">
                  <template #default="{ row }">
                    {{ row.closingBalance == null ? 'Open' : money(row.closingBalance) }}
                  </template>
                </el-table-column>
                <el-table-column label="Actual cash" min-width="110">
                  <template #default="{ row }">
                    {{ row.actualCash == null ? '—' : money(row.actualCash) }}
                  </template>
                </el-table-column>
                <el-table-column label="Short / Over" min-width="115">
                  <template #default="{ row }">
                    <span v-if="row.variance != null" :class="Number(row.variance) < 0 ? 'debit' : Number(row.variance) > 0 ? 'credit' : ''">
                      {{ Number(row.variance) > 0 ? '+' : '' }}{{ money(row.variance) }}
                    </span>
                    <span v-else>—</span>
                  </template>
                </el-table-column>
                <el-table-column label="Handover" min-width="170">
                  <template #default="{ row }">
                    {{ row.handoverStatus ? `${row.handoverStatus} · ${row.recipientName}` : '—' }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>

          <el-card v-if="isAdmin" shadow="never" class="space-top">
            <template #header>
              <div class="report-filter-header">
                <strong>Complete Money Trail · {{ activityDateLabel }}</strong><el-button link type="primary" @click="router.push('/finance/money-trail-report')">Full Report</el-button>
              </div>
            </template>
            <el-empty v-if="!adminTrail.length" description="No financial events" :image-size="60" />
            <div v-else class="history-wrap">
              <el-table :data="adminTrail" size="small" style="width:100%">
                <el-table-column label="Date" min-width="165">
                  <template #default="{ row }">
                    {{ dateTime(row.eventAt) }}
                  </template>
                </el-table-column>
                <el-table-column prop="employee" label="Employee" min-width="130" />
                <el-table-column label="Event" min-width="150">
                  <template #default="{ row }">
                    {{ trailTypeLabel(row.type) }}
                  </template>
                </el-table-column>
                <el-table-column label="Amount" min-width="110">
                  <template #default="{ row }">
                    {{ money(row.amount) }}
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="Details" min-width="220" show-overflow-tooltip />
                <el-table-column prop="status" label="Status" min-width="100" />
                <el-table-column label="Short / Over" min-width="115">
                  <template #default="{ row }">
                    <span v-if="row.variance != null" :class="Number(row.variance) < 0 ? 'debit' : Number(row.variance) > 0 ? 'credit' : ''">
                      {{ Number(row.variance) > 0 ? '+' : '' }}{{ money(row.variance) }}
                    </span>
                    <span v-else>—</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Filter, Calendar, Tickets, Edit, Wallet, UserFilled, CreditCard, Money, Switch, Coin, Clock, ShoppingCart, TrendCharts, CircleCheck, Warning } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';
import {
  getAdminFinanceActivity,
  getAdminFinanceOverview,
  getAdminMoneyTrailReport,
  getSessionCashHistoryReport,
  getLocationCash
} from '@/api/employeeFinance';

const activeFinanceTab = ref('overview');
const activityRange = ref('today');
const activityFilterDrawer = ref(false);
const draftActivityRange = ref('today');
const draftActivityDates = ref([]); function openActivityFilter() { draftActivityRange.value = activityRange.value; draftActivityDates.value = [...activityDates.value]; activityFilterDrawer.value = true; }
function applyActivityFilter() { activityRange.value = draftActivityRange.value; activityDates.value = [...draftActivityDates.value]; activityFilterDrawer.value = false; loadFinancialActivity(); }
const activityDates = ref([]);
const activityLoading = ref(false);
const activitySummary = ref({});
function dateISO(d) { return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); }
function activityBounds() {
  if (activityRange.value === 'custom') {
    if (!Array.isArray(activityDates.value) || activityDates.value.length !== 2) return null;
    return { startdate: activityDates.value[0], enddate: activityDates.value[1] };
  }
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (activityRange.value === 'week') start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  else if (activityRange.value === 'month') start.setDate(1);
  return { startdate: dateISO(start), enddate: dateISO(now) };
}
const activityDateLabel = computed(() => { const d = activityBounds(); return d ? `${d.startdate} — ${d.enddate}` : 'Choose both dates'; });
// Quick endpoints return arrays; full report endpoints return { rows, summary, ... }.
const reportRows = response => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.rows)) return data.data.rows;
  return [];
};

// Commit the three datasets together; ignore responses from superseded date selections.
let financialRequestId = 0;
async function loadFinancialActivity() {
  if (!isAdmin.value || !locationId.value) return;
  const bounds = activityBounds();
  if (!bounds) return;
  const requestId = ++financialRequestId;
  const currentLocation = locationId.value;
  activityLoading.value = true;
  try {
    const [activityResult, historyResult, trailResult] = await Promise.all([
      getAdminFinanceActivity({ locationid: currentLocation, ...bounds }),
      getSessionCashHistoryReport({ locationid: currentLocation, ...bounds }),
      getAdminMoneyTrailReport({ locationid: currentLocation, ...bounds })
    ]);
    if (requestId !== financialRequestId) return;
    activitySummary.value = activityResult.data?.summary || {};
    history.value = reportRows(historyResult);
    adminTrail.value = reportRows(trailResult);
  } catch (e) {
    if (requestId === financialRequestId) ElMessage.error(errorText(e));
  } finally {
    if (requestId === financialRequestId) activityLoading.value = false;
  }
}

const userStore = useUserStore();
const router = useRouter();
const locationId = computed(() => userStore.locationId);
const isAdmin = computed(() => ['admin', 'owner', 'system admin'].includes(String(userStore.roleName || '').toLowerCase()));
const loading = ref(false); const busy = ref(false); const historyLoading = ref(false); const history = ref([]); const adminTrailLoading = ref(false); const adminLoading = ref(false); const session = ref(null); const summary = ref({}); const adminEmployees = ref([]); const adminFundingHistory = ref([]); const adminTrail = ref([]); const adminSummary = ref({});
const adminCashHolders = ref([]);
const custody = ref({ accounts: [], pendingEmployeeHandovers: 0, unlinkedProfit: {}});
const custodyTotal = kind => (custody.value.accounts || []).filter(x => x.kind === kind).reduce((sum, x) => sum + Number(x.balance || 0), 0);
const adminWithdrawalHistory = ref([]);
const opening = ref({ amount: '', notes: '' }); const handover = ref({ touserid: null, actualcash: '', notes: '' }); const adminCurrentBalance = computed(() => adminCashHolders.value.reduce((sum, holder) => sum + Number(holder.currentCash || 0), 0)); const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const dateTime = value => value ? new Date(value).toLocaleString() : '—'; const errorText = e => e?.response?.data?.message || e?.message || 'Request failed.'; async function loadHistory() {
  if (!locationId.value || !activityBounds()) return;
  try {
    historyLoading.value = true;
    history.value = reportRows(await getSessionCashHistoryReport({ locationid: locationId.value, ...activityBounds() }));
  } catch (e) {
    ElMessage.error(errorText(e));
  } finally {
    historyLoading.value = false;
  }
}

async function load() {
  if (!isAdmin.value || !locationId.value) return;
  try {
    loading.value = true;
    await Promise.all([loadAdminOverview(), loadFinancialActivity()]);
  } finally { loading.value = false; }
}

async function loadAdminOverview() {
  if (!isAdmin.value || !locationId.value) return;
  try {
    adminLoading.value = true;
    const [overviewResult, custodyResult] = await Promise.all([getAdminFinanceOverview(locationId.value), getLocationCash(locationId.value)]);
    const d = overviewResult.data || {};
    custody.value = custodyResult.data || { accounts: [], pendingEmployeeHandovers: 0, unlinkedProfit: {}};
    adminEmployees.value = d.employees || [];
    adminCashHolders.value = d.cashHolders || [];
    adminWithdrawalHistory.value = d.withdrawals || [];
    adminFundingHistory.value = d.funding || [];
    adminSummary.value = d.summary || {};
  } catch (e) {
    ElMessage.error(errorText(e));
  } finally {
    adminLoading.value = false;
  }
}

const trailTypeLabel = type => ({
  CUSTODY_INITIAL_CAPITAL: 'Owner Initial Capital',
  CUSTODY_OWNER_TO_ADMIN: 'Owner → Admin Cash Transfer',
  CUSTODY_ADMIN_TO_OWNER: 'Admin → Owner Cash Transfer',
  CUSTODY_CUTOVER_OPENING: 'Verified Historical Opening',
  CUSTODY_BANK_DEPOSIT: 'Business Bank Deposit',
  CUSTODY_BANK_WITHDRAWAL: 'Business Bank → Owner Cash',
  CUSTODY_OWNER_DISTRIBUTION: 'Owner Distribution',
  CUSTODY_DIRECT_EXPENSE: 'Direct Business Expense',
  ADMIN_FUNDING: 'Owner/Admin funding',
  OPENING: 'Opening balance',
  OPENING_TRANSFER: 'Employee opening handover',
  TRANSFER_IN: 'Employee handover received',
  CASH_RECEIVED: 'Additional cash',
  EXPENSE: 'Cash expense',
  POINTS_EXPENSE: 'Cash Points Expense',
  OWNER_WITHDRAWAL: 'Owner/Admin Cash Taken',
  READING_PROFIT: 'Reading Session Profit',
  EMPLOYEE_HANDOVER: 'Employee handover',
  SESSION_CLOSING: 'Session closing'
}[type] || type);
watch(locationId, load);
onMounted(load);
</script>
<style scoped>
    /* Same icon radio-button control as Point Watching; stable width during refresh. */
    .activity-range-switch {
        display: inline-flex;
        flex-wrap: wrap;
    }

        .activity-range-switch :deep(.el-radio-button__inner) {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }

        .activity-range-switch :deep(.el-icon) {
            font-size: 14px;
        }

    .financial-activity-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
    }

        .financial-activity-header .action-button {
            margin-left: auto;
        }

            .financial-activity-header .action-button .el-icon {
                margin-right: 5px;
            }

    .activity-filter-drawer {
        display: flex;
        flex-direction: column;
        gap: 18px;
    }

    .activity-filters {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
    }

    .finance-tabs {
        margin-top: 16px;
    }

        .finance-tabs :deep(.el-tabs__nav-wrap::after) {
            height: 1px;
            background: var(--el-border-color-lighter);
        }

        .finance-tabs :deep(.el-tabs__item) {
            font-weight: 600;
        }

    .custody-summary, .admin-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 15px;
        align-items: stretch;
    }
    /* Let the reference hover shadow extend beyond the compact tiles. */
    .custody-summary, .admin-stats-grid {
        overflow: visible !important;
    }

    .current-position-card, .current-position-card :deep(.el-card__body), .financial-activity-card, .financial-activity-card :deep(.el-card__body) {
        overflow: visible !important;
    }
    /* Exact PointsByDate summary-card hover and sizing, scoped only to the 15 finance tiles. */
    .custody-summary > .finance-stat-card, .admin-stats-grid > .finance-stat-card {
        position: relative;
        overflow: hidden !important;
        border-radius: 14px !important;
        background: var(--el-bg-color, #fff) !important;
        border: 1px solid var(--el-border-color-lighter) !important;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.035) !important;
        height: 78px !important;
        min-height: 0 !important;
        max-height: 78px !important;
        padding: 0 !important;
        margin-bottom: 0 !important;
        box-sizing: border-box !important;
        transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease !important;
    }

        .custody-summary > .finance-stat-card:hover, .admin-stats-grid > .finance-stat-card:hover {
            z-index: 2;
            transform: translateY(-3px) !important;
            box-shadow: 0 10px 28px rgba(0, 0, 0, .08) !important;
            border-color: color-mix(in srgb, var(--accent) 25%, transparent) !important;
        }

        .custody-summary > .finance-stat-card :deep(.el-card__body), .admin-stats-grid > .finance-stat-card :deep(.el-card__body) {
            display: flex !important;
            align-items: center !important;
            padding: 16px 12px !important;
            height: 100% !important;
            min-height: 0 !important;
            max-height: 100% !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
        }

    .finance-stat-layout {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        width: 100%;
        min-height: 44px;
    }

    .finance-stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
        border-radius: 12px;
        color: var(--accent);
        background: var(--accent-soft);
        transition: transform .25s ease;
    }

    .finance-stat-card:hover .finance-stat-icon {
        transform: scale(1.05);
    }

    .finance-stat-icon .el-icon, .finance-stat-icon .el-icon svg {
        width: 24px;
        height: 24px;
        font-size: 23px;
    }

    .finance-stat-content {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
    }

        .finance-stat-content span {
            margin-bottom: 5px;
            color: var(--el-text-color-secondary);
            font-size: 12px !important;
            font-weight: 500;
            line-height: 1.3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .finance-stat-content strong {
            color: var(--el-text-color-primary);
            font-size: 24px !important;
            font-weight: 700;
            line-height: 1.1;
            overflow-wrap: anywhere;
        }

    @media(max-width: 900px) {
        .custody-summary, .admin-stats-grid {
            grid-template-columns: repeat(2, minmax(0,1fr));
        }
    }

    @media(max-width: 550px) {
        .custody-summary, .admin-stats-grid {
            grid-template-columns: minmax(0,1fr);
        }

            .custody-summary > .finance-stat-card, .admin-stats-grid > .finance-stat-card {
                height: 62px !important;
                max-height: 62px !important;
            }

                .custody-summary > .finance-stat-card :deep(.el-card__body), .admin-stats-grid > .finance-stat-card :deep(.el-card__body) {
                    padding: 12px 9px !important;
                }

        .finance-stat-layout {
            gap: 8px;
            min-height: 36px;
        }

        .finance-stat-icon {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
            border-radius: 10px;
        }

            .finance-stat-icon .el-icon, .finance-stat-icon .el-icon svg {
                width: 20px;
                height: 20px;
                font-size: 20px;
            }

        .finance-stat-content span {
            font-size: 11px !important;
        }

        .finance-stat-content strong {
            font-size: 21px !important;
        }
    }
</style>
