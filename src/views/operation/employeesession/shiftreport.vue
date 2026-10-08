<template>
  <div class="app-container">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <div>
          <h2 class="page-title">Shift Report</h2>
          <div class="page-subtitle" v-if="report?.session">
            Session # {{ report.session.id }} · {{ report.session.employeeName }}
          </div>
        </div>
      </div>

      <div class="header-actions">
        <ExportPdfButton :loading="pdfExporting"
                         :disabled="!report?.session"
                         @click="handleExportPdf" />
      </div>
    </div>

    <el-skeleton v-if="loading && !report" :rows="8" animated />

    <el-alert v-if="error"
              type="error"
              :title="error"
              show-icon
              :closable="false"
              class="notice" />

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
              <strong>{{ dateTime(report.session.clockIn) }}</strong>
            </div>

            <div>
              <span>Clock Out</span>
              <strong>{{ report.session.clockOut ? dateTime(report.session.clockOut) : 'In Progress' }}</strong>
            </div>

            <div>
              <span>Duration</span>
              <strong>{{ duration(report.session) }}</strong>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Same finance summary / breakdown used on Employee Transactions -->
      <div v-loading="loading" class="employee-finance-summary">
        <el-row :gutter="16" class="summary-row employee-finance-main-summary">
          <el-col :xs="12" :sm="12" :md="6" class="summary-column">
            <el-card shadow="never" class="summary-card summary-teal">
              <div class="summary-card-content">
                <div class="summary-icon"><el-icon><WalletFilled /></el-icon></div>
                <el-statistic title="Total Credit" :value="Number(summary.openingBank || 0)" :precision="2" prefix="$" />
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="12" :md="6" class="summary-column">
            <el-card shadow="never" class="summary-card summary-orange">
              <div class="summary-card-content">
                <div class="summary-icon"><el-icon><Money /></el-icon></div>
                <el-statistic title="Total Expense" :value="Number(summary.expenses || 0)" :precision="2" prefix="$" />
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="12" :md="6" class="summary-column">
            <el-card shadow="never" class="summary-card summary-green">
              <div class="summary-card-content">
                <div class="summary-icon"><el-icon><CircleCheckFilled /></el-icon></div>
                <el-statistic title="Total Balance" :value="Number(summary.balance || 0)" :precision="2" prefix="$" />
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="12" :md="6" class="summary-column">
            <el-card shadow="never"
                     class="summary-card"
                     :class="shortOver > 0 ? 'summary-green' : shortOver < 0 ? 'stat-red' : 'summary-blue'">
              <div class="summary-card-content">
                <div class="summary-icon"
                     :style="{ color: shortOver > 0 ? 'var(--el-color-success)' : shortOver < 0 ? 'var(--el-color-danger)' : 'var(--el-text-color-secondary)' }">
                  <el-icon><ScaleToOriginal /></el-icon>
                </div>

                <el-statistic :title="shortOver > 0 ? 'Over' : shortOver < 0 ? 'Short' : 'Short / Over'"
                              :value="Math.abs(Number(shortOver || 0))"
                              :precision="2"
                              :value-style="{ color: shortOver > 0 ? 'var(--el-color-success)' : shortOver < 0 ? 'var(--el-color-danger)' : 'var(--el-text-color-primary)' }">
                  <template #prefix>
                    <span :style="{ color: shortOver > 0 ? 'var(--el-color-success)' : shortOver < 0 ? 'var(--el-color-danger)' : 'var(--el-text-color-primary)' }">
                      {{ shortOver > 0 ? '+$' : shortOver < 0 ? '-$' : '$' }}
                    </span>
                  </template>
                </el-statistic>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="employee-finance-breakdown-card financial-negative-strip">
          <div class="employee-finance-breakdown">
            <div class="employee-finance-breakdown-item">
              <div class="employee-finance-breakdown-icon"><el-icon><Coin /></el-icon></div>
              <div>
                <span>Match Point</span>
                <strong>−{{ money(summary.matchPointExpense) }}</strong>
              </div>
            </div>

            <div class="employee-finance-breakdown-item">
              <div class="employee-finance-breakdown-icon"><el-icon><CirclePlusFilled /></el-icon></div>
              <div>
                <span>Extra Match</span>
                <strong>−{{ money(summary.extraMatchExpense) }}</strong>
              </div>
            </div>

            <div class="employee-finance-breakdown-item">
              <div class="employee-finance-breakdown-icon"><el-icon><Present /></el-icon></div>
              <div>
                <span>Raffle</span>
                <strong>−{{ money(summary.raffleExpense) }}</strong>
              </div>
            </div>

            <div class="employee-finance-breakdown-item">
              <div class="employee-finance-breakdown-icon"><el-icon><Tickets /></el-icon></div>
              <div>
                <span>Ticket Out</span>
                <strong>−{{ money(summary.ticketOutExpense) }}</strong>
              </div>
            </div>

            <div class="employee-finance-breakdown-item">
              <div class="employee-finance-breakdown-icon"><el-icon><Trophy /></el-icon></div>
              <div>
                <span>Bonus</span>
                <strong>−{{ money(summary.bonusExpense) }}</strong>
              </div>
            </div>
            <div class="employee-finance-breakdown-item">
              <div class="employee-finance-breakdown-icon"><el-icon><Present /></el-icon></div>
              <div>
                <span>Lucky Bird</span>
                <strong>−{{ money(summary.luckyBirdExpense) }}</strong>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Same Credits / Expenses ledger style used on Employee Transactions -->
      <div class="session-ledger-grid space-top">
        <el-card shadow="never" class="ledger-card credit-ledger">
          <template #header>
            <strong>Credits</strong>
          </template>

          <el-empty v-if="!creditTransactions.length" description="No credits yet" :image-size="70" />

          <div v-else class="ledger-list">
            <div v-for="item in creditTransactions" :key="ledgerKey(item)" class="ledger-item">
              <div>
                <strong>{{ typeLabel(item.type, item.expenseTypeName, item.creditTypeName) }}</strong>
                <p>
                  {{ dateTime(item.eventAt) }}
                  <template v-if="item.notes">
                    · {{ item.notes }}
                  </template>
                </p>
              </div>
              <strong class="credit">+{{ money(Math.abs(Number(item.amount || 0))) }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="ledger-card expense-ledger">
          <template #header>
            <strong>Expenses</strong>
          </template>

          <el-empty v-if="!expenseTransactions.length" description="No expenses yet" :image-size="70" />

          <div v-else class="ledger-list">
            <div v-for="item in expenseTransactions" :key="ledgerKey(item)" class="ledger-item">
              <div>
                <strong>{{ typeLabel(item.type, item.expenseTypeName, item.creditTypeName) }}</strong>
                <p>
                  {{ dateTime(item.eventAt) }}
                  <template v-if="item.takenBy">
                    · Taken by {{ item.takenBy }}
                  </template>
                  <template v-if="item.notes">
                    · {{ item.notes }}
                  </template>
                </p>
              </div>
              <strong class="debit">−{{ money(Math.abs(Number(item.amount || 0))) }}</strong>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Reconciliation remains last -->
      <div class="panel-grid space-top">
        <el-card shadow="never" class="panel">
          <template #header>
            <div class="panel-heading">
              <strong>Cash Reconciliation</strong>
              <span>Employee transaction calculation</span>
            </div>
          </template>

          <div class="ledger-list">
            <div class="ledger-item">
              <div><strong>Total Credit</strong></div>
              <strong class="credit">+{{ money(summary.openingBank) }}</strong>
            </div>

            <div class="ledger-item">
              <div><strong>Manual Expense</strong></div>
              <strong class="debit">−{{ money(summary.regularExpense) }}</strong>
            </div>

            <div class="ledger-item">
              <div><strong>Match Point</strong></div>
              <strong class="debit">−{{ money(summary.matchPointExpense) }}</strong>
            </div>

            <div class="ledger-item">
              <div><strong>Extra Match</strong></div>
              <strong class="debit">−{{ money(summary.extraMatchExpense) }}</strong>
            </div>

            <div class="ledger-item">
              <div><strong>Raffle</strong></div>
              <strong class="debit">−{{ money(summary.raffleExpense) }}</strong>
            </div>

            <div class="ledger-item">
              <div><strong>Ticket Out</strong></div>
              <strong class="debit">−{{ money(summary.ticketOutExpense) }}</strong>
            </div>

            <div v-if="Number(summary.transferOut || 0)" class="ledger-item">
              <div><strong>Transfer to Employee</strong></div>
              <strong class="debit">−{{ money(summary.transferOut) }}</strong>
            </div>

            <div v-if="Number(summary.ownerWithdrawals || 0)" class="ledger-item">
              <div><strong>Owner / Admin Withdrawal</strong></div>
              <strong class="debit">−{{ money(summary.ownerWithdrawals) }}</strong>
            </div>

            <div class="ledger-item">
              <div><strong>Total Expense</strong></div>
              <strong class="debit">−{{ money(summary.expenses) }}</strong>
            </div>

            <div class="ledger-item">
              <div><strong>Calculated Balance</strong></div>
              <strong>{{ money(summary.balance) }}</strong>
            </div>

            <template v-if="report.closing">
              <div class="ledger-item">
                <div><strong>Cash Counted</strong></div>
                <strong>{{ money(report.closing.actualCash) }}</strong>
              </div>

              <div class="ledger-item">
                <div>
                  <strong>{{ shortOver > 0 ? 'Over' : shortOver < 0 ? 'Short' : 'Short / Over' }}</strong>
                </div>
                <strong :class="shortOverClass">{{ signedMoney(shortOver) }}</strong>
              </div>
            </template>
          </div>
        </el-card>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import ExportPdfButton from '@/components/exportpdfbutton.vue';
import { exportShiftReportPdf } from '@/utils/exportshiftreportpdf';
import { getEmployeeSessionShiftReport } from '@/api/employeesession';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const pdfExporting = ref(false);
const error = ref('');
const report = ref(null);

const summary = computed(() => report.value?.summary || {});
const transactions = computed(() => Array.isArray(report.value?.transactions) ? report.value.transactions : []);

const creditTransactions = computed(() =>
      transactions.value
        .filter(item => Number(item.signedAmount ?? item.amount ?? 0) > 0)
        .slice()
        .sort((a, b) => new Date(a.eventAt) - new Date(b.eventAt))
);

const expenseTransactions = computed(() =>
      transactions.value
        .filter(item => Number(item.signedAmount ?? 0) < 0)
        .slice()
        .sort((a, b) => new Date(a.eventAt) - new Date(b.eventAt))
);

const shortOver = computed(() => Number(report.value?.closing?.variance || 0));

const shortOverClass = computed(() => {
      if (shortOver.value < 0) return 'debit';
      if (shortOver.value > 0) return 'credit';
      return '';
});

const money = value =>
      Number(value || 0).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      });

const signedMoney = value =>
      `${Number(value || 0) < 0 ? '−' : Number(value || 0) > 0 ? '+' : ''}${money(
        Math.abs(Number(value || 0))
      )}`;

const dateTime = value =>
      value
        ? new Date(value).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
        : '—';

const typeLabel = (type, expenseType, creditType) => ({
      OPENING: 'Opening Bank',
      OPENING_TRANSFER: 'Opening Bank',
      TRANSFER_IN: 'Opening Bank',
      TRANSFER_OUT: 'Transfer to Employee',
      CASH_RECEIVED: creditType ? `Add Bank · ${creditType}` : 'Add Bank',
      EXPENSE: expenseType || 'Expense',
      MATCH_POINT: 'Match Point',
      EXTRA_MATCH: 'Extra Match',
      RAFFLE: 'Raffle',
      TICKET_OUT: 'Ticket Out',
      OWNER_WITHDRAWAL: 'Owner / Admin Withdrawal'
}[type] || expenseType || creditType || type || 'Transaction');

const ledgerKey = item => `${item.kind || item.type || 'item'}-${item.id}`;

function initials(name) {
      return String(name || 'E')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase();
}

function duration(session) {
      const hours = session.clockOut
        ? Number(session.totalWorkingHours || 0)
        : Math.max(0, (Date.now() - new Date(session.clockIn).getTime()) / 3600000);

      const minutes = Math.round(hours * 60);
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

async function handleExportPdf() {
      if (!report.value?.session) {
        return ElMessage.warning('No shift report to export.');
      }

      try {
        pdfExporting.value = true;

        exportShiftReportPdf({
          session: report.value.session,
          duration: duration(report.value.session),
          summary: summary.value,
          credits: creditTransactions.value,
          expenses: expenseTransactions.value,
          closing: report.value.closing || null
        });

        ElMessage.success('PDF exported.');
      } catch (e) {
        ElMessage.error(e?.message || 'Unable to export PDF.');
      } finally {
        pdfExporting.value = false;
      }
}

async function loadReport() {
      const id = Number(route.params.sessionId);
      const location = Number(userStore.locationId);

      if (!id || !location) return;

      try {
        loading.value = true;
        error.value = '';

        const response = await getEmployeeSessionShiftReport(id, location);
        report.value = response?.data || null;

        if (!report.value) {
          throw new Error('Shift report data was not returned.');
        }
      } catch (e) {
        console.error(e);
        error.value =
          e?.response?.data?.message ||
          e?.message ||
          'Unable to load shift report.';

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

onMounted(loadReport);
</script>
