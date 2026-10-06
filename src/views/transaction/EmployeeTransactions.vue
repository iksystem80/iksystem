<template>
  <div class="app-container">
    <div class="page-header">
      <div><h2 class="page-title">Employee Session Transaction</h2><p>Opening Bank, match activity, payouts, expenses and handovers.</p></div>
      <div v-if="!hasPendingAcceptance && hasActivity" class="header-actions">
        <ExportPdfButton :loading="pdfExporting"
                         :disabled="!session"
                         @click="handleExportPdf" />

        <el-button class="action-button" @click="openCloseSession">
          <el-icon><SwitchButton /></el-icon>
          <span>Close Session</span>
        </el-button>
      </div>
    </div>

    <el-alert v-if="!session" title="Clock in to start recording cash transactions." type="info" show-icon :closable="false" />

    <el-card v-if="session" shadow="never" class="employee-banner">
      <div class="employee-header">
        <div class="employee-profile">
          <el-avatar :size="54" :src="employee?.avatar">
            {{ initials(employeeName) }}
          </el-avatar>
          <div class="employee-profile-text">
            <h2>{{ employeeName || 'Employee' }}</h2>
            <div class="employee-period">
              Session # {{ session.id }} <!--· Started {{ dateTime(session.clockIn) }}-->
            </div>
          </div>
        </div>
        <div class="employee-right">
          <div>
            <span>Duration</span>
            <strong>{{ liveSessionDuration }}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>Online</strong>
          </div>
        </div>
      </div>
    </el-card>

    <section v-if="pending.length" class="cash-acceptance-section">
      <div class="cash-acceptance-heading">
        <div class="cash-acceptance-heading-icon">
          <el-icon><WalletFilled /></el-icon>
        </div>
        <div>
          <strong>Cash handover received</strong>
          <span>Count the physical cash before confirming. Once accepted, it will be added to your Opening Bank.</span>
        </div>
      </div>

      <div class="cash-acceptance-list">
        <el-card v-for="item in pending" :key="item.id" shadow="never" class="cash-acceptance-card">
          <div class="cash-acceptance-card-body">
            <div class="cash-acceptance-main">
              <span class="cash-acceptance-label">Amount to receive</span>
              <strong class="cash-acceptance-amount">{{ money(item.amount) }}</strong>
              <div class="cash-acceptance-source">
                <span>From</span>
                <strong>{{ item.fromEmployee }}</strong>
                <span>· Session #{{ item.fromSessionId }}</span>
              </div>
              <div class="cash-acceptance-meta">
                <span>{{ dateTime(item.createdAt) }}</span>
                <span v-if="item.notes">{{ item.notes }}</span>
              </div>
            </div>

            <div class="cash-acceptance-action">
              <span>Please count the cash first</span>
              <el-button type="primary" size="large" :disabled="!session" :loading="busy" @click="confirmTransfer(item)">
                Confirm received
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </section>

    <section v-if="pendingAdminFunding.length" class="cash-acceptance-section">
      <div class="cash-acceptance-heading">
        <div class="cash-acceptance-heading-icon">
          <el-icon><WalletFilled /></el-icon>
        </div>
        <div>
          <strong>Admin cash received</strong>
          <span>Count the physical cash before confirming. Once accepted, it will be credited to your active session.</span>
        </div>
      </div>

      <div class="cash-acceptance-list">
        <el-card v-for="item in pendingAdminFunding" :key="`admin-${item.id}`" shadow="never" class="cash-acceptance-card">
          <div class="cash-acceptance-card-body">
            <div class="cash-acceptance-main">
              <span class="cash-acceptance-label">Amount to receive</span>
              <strong class="cash-acceptance-amount">{{ money(item.amount) }}</strong>
              <div class="cash-acceptance-source">
                <span>From</span>
                <strong>{{ item.fromAdmin }}</strong>
                <span>· {{ item.fundingType === 'INITIAL_OPENING' ? 'Initial Opening Bank' : 'Business Support' }}</span>
              </div>
              <div class="cash-acceptance-meta">
                <span>{{ dateTime(item.createdAt) }}</span>
                <span v-if="item.notes">{{ item.notes }}</span>
              </div>
            </div>

            <div class="cash-acceptance-action">
              <span>Please count the cash first</span>
              <el-button type="primary" size="large" :disabled="!session" :loading="busy" @click="confirmAdminFunding(item)">
                Confirm received
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </section>

    <template v-if="!hasPendingAcceptance">
      <!-- No incoming cash: Opening Bank becomes the only action until saved. -->
      <div v-if="session && !hasActivity" class="work-grid cash-activity-section">
        <el-card shadow="never" class="panel">
          <template #header>
            <strong>Set Opening Bank</strong>
          </template>

          <el-form label-position="top" @submit.prevent="saveOpening">
            <el-form-item label="Opening Bank">
              <el-input v-model="opening.amount" inputmode="decimal" placeholder="0.00">
                <template #prefix>
                  $
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="Notes (optional)">
              <el-input v-model="opening.notes" maxlength="500" />
            </el-form-item>

            <el-button type="primary" native-type="submit" :loading="busy" :disabled="busy">
              <el-icon><Money /></el-icon>
              <span>Save Opening Bank</span>
            </el-button>
          </el-form>
        </el-card>
      </div>

      <!-- Once cash is accepted OR Opening Bank is saved, show the working screen. -->
      <template v-if="hasActivity">
        <div v-if="session" class="employee-finance-summary">
          <el-row :gutter="16" class="summary-row employee-finance-main-summary">
            <el-col :xs="24" :sm="8" class="summary-column">
              <el-card shadow="never" class="summary-card summary-teal">
                <div class="summary-card-content">
                  <div class="summary-icon"><el-icon><WalletFilled /></el-icon></div>
                  <el-statistic title="Total Credit" :value="Number(summary.openingBank || 0)" :precision="2" prefix="$" />
                </div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="8" class="summary-column">
              <el-card shadow="never" class="summary-card summary-orange">
                <div class="summary-card-content">
                  <div class="summary-icon"><el-icon><Money /></el-icon></div>
                  <el-statistic title="Total Expense" :value="Number(summary.expenses || 0)" :precision="2" prefix="$" />
                </div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="8" class="summary-column">
              <el-card shadow="never" class="summary-card summary-green">
                <div class="summary-card-content">
                  <div class="summary-icon"><el-icon><CircleCheckFilled /></el-icon></div>
                  <el-statistic title="Total Balance" :value="Number(summary.balance || 0)" :precision="2" prefix="$" />
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-card shadow="never" class="employee-finance-breakdown-card">
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
            </div>
          </el-card>
        </div>

        <div v-if="session" class="work-grid cash-activity-section">
          <el-card shadow="never" class="panel cash-entry-card">
            <template #header>
              <div class="cash-header-actions">
                <el-segmented v-model="transactionMode"
                              :options="transactionOptions"
                              class="cash-type-toggle cash-type-toggle-header">
                  <template #default="{ item }">
                    <span class="cash-segment-option">
                      <el-icon>
                        <component :is="item.icon" />
                      </el-icon>
                      <span>{{ item.label }}</span>
                    </span>
                  </template>
                </el-segmented>
              </div>
            </template>

            <el-form v-if="transactionMode === 'CASH_RECEIVED' || transactionMode === 'EXPENSE'"
                     class="cash-activity-form"
                     :class="transactionMode === 'CASH_RECEIVED' ? 'is-credit' : 'is-expense'"
                     @submit.prevent="saveTransaction">
              <div class="cash-activity-row">
                <el-select v-if="transactionMode === 'CASH_RECEIVED'"
                           v-model="transaction.credittypeid"
                           class="cash-type-select"
                           placeholder="Credit type"
                           :loading="transactionTypesLoading"
                           @visible-change="visible => visible && refreshCreditTypes()">
                  <el-option v-for="type in transactionCreditTypes" :key="type.id" :label="type.name" :value="type.id" />
                </el-select>

                <el-select v-else
                           v-model="transaction.expensetypeid"
                           class="cash-type-select"
                           placeholder="Expense type"
                           :loading="transactionTypesLoading"
                           @visible-change="visible => visible && refreshExpenseTypes()">
                  <el-option v-for="type in transactionExpenseTypes" :key="type.id" :label="type.name" :value="type.id" />
                </el-select>

                <el-input v-model="transaction.amount" class="cash-amount-input" inputmode="decimal" placeholder="0.00">
                  <template #prefix>
                    <strong>{{ transactionMode === 'CASH_RECEIVED' ? '+ $' : '− $' }}</strong>
                  </template>
                </el-input>

                <el-button :type="transactionMode === 'CASH_RECEIVED' ? 'success' : 'danger'"
                           class="cash-record-btn"
                           native-type="submit"
                           :loading="busy"
                           :disabled="busy">
                  {{ transactionMode === 'CASH_RECEIVED' ? 'Record credit' : 'Record expense' }}
                </el-button>
              </div>
            </el-form>

            <div v-else-if="transactionMode === 'TRANSFER_TO_EMPLOYEE'" class="cash-activity-row">
              <el-select v-model="employeeTransfer.touserid"
                         filterable
                         class="cash-type-select"
                         placeholder="Select clocked-in employee"
                         :loading="transactionTypesLoading"
                         @visible-change="visible => visible && refreshTransferRecipients()">
                <el-option v-for="person in recipients"
                           :key="person.id"
                           :value="person.id"
                           :label="person.name" />
              </el-select>

              <el-input v-model="employeeTransfer.amount"
                        class="cash-amount-input"
                        inputmode="decimal"
                        placeholder="0.00">
                <template #prefix>
                  <strong>− $</strong>
                </template>
              </el-input>

              <el-button type="primary"
                         class="cash-record-btn"
                         :loading="busy"
                         :disabled="busy"
                         @click="transferToEmployee">
                Transfer
              </el-button>
            </div>

            <div v-else class="cash-activity-row extra-match-inline">
              <el-select v-model="extraMatch.customerid"
                         filterable
                         class="cash-type-select"
                         placeholder="Select customer"
                         :loading="extraMatchCustomersLoading"
                         @visible-change="visible => visible && loadExtraMatchCustomers()">
                <el-option v-for="customer in extraMatchCustomers"
                           :key="customer.id"
                           :value="customer.id"
                           :label="customer.fullname || [customer.firstname, customer.lastname].filter(Boolean).join(' ') || customer.name || `Customer #${customer.id}`" />
              </el-select>

              <el-input v-model="extraMatch.points" class="cash-amount-input" inputmode="decimal" placeholder="0.00">
                <template #prefix>
                  <strong>+ $</strong>
                </template>
              </el-input>

              <el-button v-if="!extraMatchPhoto"
                         type="warning"
                         class="cash-record-btn"
                         @click="openExtraMatchCamera">
                Take Photo
              </el-button>

              <div v-else class="extra-match-save-actions">
                <el-button :disabled="extraMatchSaving"
                           @click="cancelExtraMatchEntry">
                  Cancel
                </el-button>

                <el-button type="primary"
                           class="cash-record-btn"
                           :loading="extraMatchSaving"
                           :disabled="extraMatchSaving"
                           @click="saveExtraMatchEntry">
                  Save Extra Match
                </el-button>
              </div>
            </div>
          </el-card>
        </div>

        <el-dialog v-model="extraMatchDialogOpen"
                   title="Take Extra Match Photo"
                   width="560px"
                   class="extra-match-dialog"
                   destroy-on-close
                   @closed="closeExtraMatchCamera">
          <div class="extra-match-photo-box">
            <CameraApp v-if="extraMatchCameraOpen"
                       ref="extraMatchCameraRef"
                       shape="rectangle"
                       @captured="handleExtraMatchCaptured" />
          </div>

          <div class="extra-match-dialog-actions">
            <el-button @click="extraMatchDialogOpen = false">Cancel</el-button>
          </div>
        </el-dialog>

        <el-dialog v-model="handoverDialogOpen"
                   title="Close Session"
                   width="500px"
                   class="handover-dialog close-session-dialog"
                   destroy-on-close
                   @closed="resetCloseSession">
          <div class="close-session-balance">
            <span>Closing Balance</span>
            <strong>{{ money(summary.balance) }}</strong>
          </div>

          <el-form label-position="top" class="close-session-form" @submit.prevent="closeSession">
            <el-form-item label="Transfer to">
              <el-radio-group v-model="closeSessionForm.mode" class="close-session-mode">
                <el-radio-button value="employee">Employee</el-radio-button>
                <el-radio-button value="admin">Admin</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="closeSessionForm.mode === 'employee'" label="Employee">
              <el-select v-model="closeSessionForm.touserid" filterable placeholder="Select employee" style="width:100%">
                <el-option v-for="person in recipients" :key="person.id" :value="person.id" :label="person.name" />
              </el-select>
              <div v-if="!recipients.length" class="hint">No other employee is clocked in.</div>
            </el-form-item>

            <el-form-item v-else label="Admin">
              <el-select v-model="closeSessionForm.toadminid" filterable placeholder="Select Admin" style="width:100%">
                <el-option v-for="person in adminRecipients" :key="person.id" :value="person.id" :label="person.name" />
              </el-select>
              <div v-if="!adminRecipients.length" class="hint">No Admin is available.</div>
            </el-form-item>

            <el-form-item label="Cash Counted (optional)">
              <el-input v-model="closeSessionForm.actualcash" inputmode="decimal" :placeholder="String(summary.balance ?? '0.00')">
                <template #prefix>
                  $
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="Notes (optional)">
              <el-input v-model="closeSessionForm.notes" maxlength="500" />
            </el-form-item>

            <div class="handover-dialog-actions">
              <el-button @click="handoverDialogOpen = false">Cancel</el-button>
              <el-button type="primary" :loading="busy" :disabled="busy || !hasActivity || !canCloseSession" native-type="submit">
                <el-icon><SwitchButton /></el-icon>
                <span>{{ closeSessionForm.mode === 'employee' ? 'Close & Hand Over' : 'Close to Admin' }}</span>
              </el-button>
            </div>
          </el-form>
        </el-dialog>

        <div class="session-ledger-grid space-top">
          <el-card shadow="never" class="ledger-card credit-ledger">
            <template #header>
              <strong>Credits</strong>
            </template>
            <el-empty v-if="!creditTransactions.length" description="No credits yet" :image-size="70" />
            <div v-else class="ledger-list">
              <div v-for="item in creditTransactions" :key="item.id" class="ledger-item">
                <div>
                  <strong>{{ typeLabel(item.type, item.expenseTypeName, item.creditTypeName) }}</strong>
                  <p>
                    {{ dateTime(item.createdAt) }}
                    <template v-if="item.notes">
                      · {{ item.notes }}
                    </template>
                  </p>
                </div>
                <strong class="credit">+{{ money(item.amount) }}</strong>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="ledger-card expense-ledger">
            <template #header>
              <strong>Expenses</strong>
            </template>
            <el-empty v-if="!expenseTransactions.length" description="No expenses yet" :image-size="70" />
            <div v-else class="ledger-list">
              <div v-for="item in expenseTransactions" :key="item.id" class="ledger-item">
                <div>
                  <strong>{{ typeLabel(item.type, item.expenseTypeName, item.creditTypeName) }}</strong>
                  <p>
                    {{ dateTime(item.createdAt) }}
                    <template v-if="item.takenBy">
                      · Taken by {{ item.takenBy }}
                    </template>
                    <template v-if="item.notes">
                      · {{ item.notes }}
                    </template>
                  </p>
                </div>
                <strong class="debit">−{{ money(item.amount) }}</strong>
              </div>
            </div>
          </el-card>
        </div>

      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import CameraApp from '@/components/MyCamera';
import ExportPdfButton from '@/components/ExportPdfButton.vue';
import { exportEmployeeTransactionPdf } from '@/utils/exportEmployeeTransactionPdf';
import request from '@/utils/request';
import { getcustomers } from '@/api/customer';
import {
                  getEmployeeFinance,
                  getExpenseTypes,
                  getCreditTypes,
                  setOpeningCash,
                  addCashTransaction,
                  handoverAndClockOut,
                  acceptCashHandover,
                  getCashHistory,
                  acceptAdminFunding
} from '@/api/employeeFinance';

const userStore = useUserStore();
const locationId = computed(() => userStore.locationId);
const loading = ref(false); const busy = ref(false); const pdfExporting = ref(false); const historyLoading = ref(false); const history = ref([]);
const historyRange = ref('today'); const session = ref(null); const employee = ref(null); const summary = ref({}); const transactions = ref([]); const pending = ref([]); const pendingAdminFunding = ref([]);
const liveNow = ref(Date.now());
let liveClockTimer = null;
let financeWatchTimer = null;
let financeWatchRunning = false;
const recipients = ref([]); const adminRecipients = ref([]); const expenseTypes = ref([]); const creditTypes = ref([]);
const transactionExpenseTypes = ref([]); const transactionCreditTypes = ref([]); const transactionTypesLoading = ref(false);
const opening = ref({ amount: '', notes: '' });
const transaction = ref({ type: 'CASH_RECEIVED', amount: '', expensetypeid: null, credittypeid: null, notes: '' });
const transactionMode = ref('CASH_RECEIVED');
const employeeTransfer = ref({ touserid: null, amount: '' });
const closeSessionForm = ref({ mode: 'employee', touserid: null, toadminid: null, actualcash: '', notes: '' });
const handoverDialogOpen = ref(false);
const extraMatchDialogOpen = ref(false); const extraMatchCustomersLoading = ref(false); const extraMatchSaving = ref(false);
const extraMatchCustomers = ref([]); const extraMatchCameraOpen = ref(false); const extraMatchCameraRef = ref(null);
const extraMatchPhoto = ref(null); const extraMatchPreview = ref('');
const extraMatch = ref({ customerid: null, points: '' });
const transactionOptions = [
              { label: 'Add Bank', value: 'CASH_RECEIVED', icon: 'WalletFilled' },
              { label: 'Expense', value: 'EXPENSE', icon: 'Money' },
              { label: 'Extra Match', value: 'EXTRA_MATCH', icon: 'CirclePlusFilled' },
              { label: 'Transfer to Employee', value: 'TRANSFER_TO_EMPLOYEE', icon: 'ScaleToOriginal' }
];
const expenseTransactionTypes = ['EXPENSE', 'MATCH_POINT', 'EXTRA_MATCH', 'RAFFLE', 'TICKET_OUT', 'BONUS', 'OWNER_WITHDRAWAL', 'TRANSFER_OUT'];
const creditTransactions = computed(() => transactions.value.filter(item => !expenseTransactionTypes.includes(item.type)).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
const expenseTransactions = computed(() => transactions.value.filter(item => expenseTransactionTypes.includes(item.type)).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))); const employeeName = computed(() => employee.value?.name || userStore.userInfo?.name || userStore.name || userStore.user?.name || session.value?.employeeName || 'Employee');
const initials = name => String(name || 'E').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const hasActivity = computed(() => Number(summary.value.entry_count || 0) > 0);
const hasManualOpening = computed(() => Number(summary.value.opening_count || 0) > 0);
const hasPendingAcceptance = computed(() =>
                  pending.value.length > 0 || pendingAdminFunding.value.length > 0
);
const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const dateTime = value => value ? new Date(value).toLocaleString() : '—';
const liveSessionDuration = computed(() => {
                  if (!session.value?.clockIn) return '0h 0m';
                  const started = new Date(session.value.clockIn).getTime();
                  if (!Number.isFinite(started)) return '0h 0m';

                  const totalSeconds = Math.max(0, Math.floor((liveNow.value - started) / 1000));
                  const hours = Math.floor(totalSeconds / 3600);
                  const minutes = Math.floor((totalSeconds % 3600) / 60);
                  const seconds = totalSeconds % 60;

                  return `${hours}h ${minutes}m ${seconds}s`;
});
const typeLabel = (type, expense, creditType) => ({
                  OPENING: 'Opening Bank', OPENING_TRANSFER: 'Opening Bank',
                  TRANSFER_IN: 'Opening Bank', TRANSFER_OUT: 'Transfer to Employee',
                  CASH_RECEIVED: creditType ? `Add Bank · ${creditType}` : 'Add Bank',
                  EXPENSE: expense || 'Expense', MATCH_POINT: 'Match Point', EXTRA_MATCH: 'Extra Match', RAFFLE: 'Raffle', TICKET_OUT: 'Ticket Out', BONUS: 'Bonus'
}[type] || type);
const errorText = e => e?.response?.data?.message || e?.message || 'Request failed.';
const validAmount = (v, allowZero = false) => /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(String(v).trim()) && (Number(v) > 0 || (allowZero && Number(v) === 0));
async function loadHistory() {
                  if (!locationId.value || historyRange.value === 'full') return;
                  try {
                    historyLoading.value = true;
                    history.value = (await getCashHistory(locationId.value, historyRange.value)).data || [];
                  } catch (e) {
                    ElMessage.error(errorText(e));
                  } finally {
                    historyLoading.value = false;
                  }
}

async function load() {
                  if (!locationId.value) return;
                  try {
                    loading.value = true;
                    const response = await getEmployeeFinance(locationId.value);
                    const d = response.data || {};
                    session.value = d.session || null; employee.value = d.employee || null; summary.value = d.summary || {};
                    transactions.value = d.transactions || []; pending.value = d.pending || [];
                    pendingAdminFunding.value = d.pendingAdminFunding || [];
                    recipients.value = d.recipients || []; adminRecipients.value = d.adminRecipients || []; expenseTypes.value = d.expenseTypes || []; creditTypes.value = d.creditTypes || [];
                    if (!recipients.value.length && adminRecipients.value.length) closeSessionForm.value.mode = 'admin';
                    if (!closeSessionForm.value.toadminid && adminRecipients.value.length === 1) closeSessionForm.value.toadminid = adminRecipients.value[0].id;
                    transactionExpenseTypes.value = expenseTypes.value.filter(x => x.isActive);
                    transactionCreditTypes.value = creditTypes.value.filter(x => x.isActive);
                    await loadHistory();
                  } catch (e) { ElMessage.error(errorText(e)); } finally { loading.value = false; }
}

async function refreshFinanceLive() {
                  if (!locationId.value || financeWatchRunning || busy.value || document.hidden) return;

                  try {
                    financeWatchRunning = true;

                    const response = await getEmployeeFinance(locationId.value);
                    const d = response.data || {};

                    session.value = d.session || null;
                    employee.value = d.employee || employee.value;
                    summary.value = d.summary || {};
                    transactions.value = d.transactions || [];
                    pending.value = d.pending || [];
                    pendingAdminFunding.value = d.pendingAdminFunding || [];
                    recipients.value = d.recipients || [];
                    adminRecipients.value = d.adminRecipients || [];

                    if (Array.isArray(d.expenseTypes)) {
                      expenseTypes.value = d.expenseTypes;
                      transactionExpenseTypes.value = d.expenseTypes.filter(x => x.isActive);
                    }

                    if (Array.isArray(d.creditTypes)) {
                      creditTypes.value = d.creditTypes;
                      transactionCreditTypes.value = d.creditTypes.filter(x => x.isActive);
                    }

                    if (
                      employeeTransfer.value.touserid &&
                      !recipients.value.some(person => Number(person.id) === Number(employeeTransfer.value.touserid))
                    ) {
                      employeeTransfer.value.touserid = null;
                    }
                  } catch {
                    // Silent watcher: normal page actions still show request errors.
                  } finally {
                    financeWatchRunning = false;
                  }
}

async function refreshExpenseTypes() {
                  if (!locationId.value) return;
                  try {
                    transactionTypesLoading.value = true;
                    const response = await getExpenseTypes(locationId.value);
                    transactionExpenseTypes.value = response?.data || response || [];
                  } catch (e) { ElMessage.error(errorText(e)); } finally { transactionTypesLoading.value = false; }
}

async function refreshCreditTypes() {
                  if (!locationId.value) return;
                  try {
                    transactionTypesLoading.value = true;
                    const response = await getCreditTypes(locationId.value);
                    transactionCreditTypes.value = response?.data || response || [];
                  } catch (e) { ElMessage.error(errorText(e)); } finally { transactionTypesLoading.value = false; }
}

async function confirmAdminFunding(item) {
                  if (!session.value) return ElMessage.warning('Clock in before confirming cash.');
                  try {
                    await ElMessageBox.confirm(
                      `I physically received ${money(item.amount)} from ${item.fromAdmin}. Credit this session?`,
                      'Confirm Owner/Admin cash',
                      { type: 'warning', confirmButtonText: 'Confirm received' }
                    );
                  } catch { return; }
                  await run(() => acceptAdminFunding(item.id, { sessionid: session.value.id }),
                    item.fundingType === 'INITIAL_OPENING' ? 'Opening Bank confirmed.' : 'Business support confirmed.');
}

async function run(action, success) {
                  try { busy.value = true; await action(); ElMessage.success(success); await load(); return true; } catch (e) { ElMessage.error(errorText(e)); return false; } finally { busy.value = false; }
}
async function saveOpening() {
                  if (!validAmount(opening.value.amount, true)) return ElMessage.warning('Enter a nonnegative amount (up to 2 decimals).');
                  if (await run(() => setOpeningCash({ sessionid: session.value.id, ...opening.value }), 'Opening Bank saved.')) { opening.value = { amount: '', notes: '' }; }
}
async function saveTransaction() {
                  if (!validAmount(transaction.value.amount)) return ElMessage.warning('Enter a positive amount (up to 2 decimals).');
                  if (transaction.value.type === 'CASH_RECEIVED' && !transaction.value.credittypeid) return ElMessage.warning('Select a credit type.');
                  if (transaction.value.type === 'EXPENSE' && !transaction.value.expensetypeid) return ElMessage.warning('Select an expense type.');
                  if (await run(() => addCashTransaction({ sessionid: session.value.id, ...transaction.value }), 'Transaction saved.')) { transaction.value = { type: transaction.value.type, amount: '', expensetypeid: null, credittypeid: null, notes: '' }; }
}
async function refreshTransferRecipients() {
                  if (!locationId.value) return;

                  try {
                    transactionTypesLoading.value = true;
                    const response = await getEmployeeFinance(locationId.value);
                    const d = response.data || {};
                    recipients.value = d.recipients || [];

                    if (
                      employeeTransfer.value.touserid &&
                      !recipients.value.some(person => Number(person.id) === Number(employeeTransfer.value.touserid))
                    ) {
                      employeeTransfer.value.touserid = null;
                    }
                  } catch (e) {
                    ElMessage.error(errorText(e));
                  } finally {
                    transactionTypesLoading.value = false;
                  }
}

async function transferToEmployee() {
                  if (!session.value) return ElMessage.warning('No active session was found.');
                  if (!employeeTransfer.value.touserid) return ElMessage.warning('Select the receiving employee.');
                  if (!validAmount(employeeTransfer.value.amount)) return ElMessage.warning('Enter a positive transfer amount.');

                  const recipient = recipients.value.find(
                    person => Number(person.id) === Number(employeeTransfer.value.touserid)
                  );

                  try {
                    await ElMessageBox.confirm(
                      `Transfer ${money(employeeTransfer.value.amount)} to ${recipient?.name || 'this employee'}?`,
                      'Confirm employee transfer',
                      { type: 'warning', confirmButtonText: 'Transfer' }
                    );
                  } catch {
                    return;
                  }

                  const response = await run(
                    () => request({
                      url: '/employeefinance/transfer-to-employee',
                      method: 'post',
                      data: {
                        sessionid: session.value.id,
                        touserid: employeeTransfer.value.touserid,
                        amount: employeeTransfer.value.amount
                      }
                    }),
                    'Money transferred successfully.'
                  );

                  if (response) {
                    employeeTransfer.value = { touserid: null, amount: '' };
                  }
}

async function confirmTransfer(item) {
                  if (!session.value) return ElMessage.warning('Clock in before confirming cash.');
                  try { await ElMessageBox.confirm(`I physically received ${money(item.amount)} from ${item.fromEmployee}. Credit this session?`, 'Confirm cash received', { type: 'warning', confirmButtonText: 'Confirm received' }); } catch { return; }
                  await run(() => acceptCashHandover(item.id, { sessionid: session.value.id }), 'Handover confirmed.');
}
async function loadExtraMatchCustomers() {
                  if (!locationId.value) return;
                  try {
                    extraMatchCustomersLoading.value = true;
                    const response = await getcustomers(locationId.value);
                    extraMatchCustomers.value = (Array.isArray(response?.data) ? response.data : []).filter(customer => customer.isactive !== false);
                  } catch (e) {
                    extraMatchCustomers.value = [];
                    ElMessage.error(errorText(e));
                  } finally { extraMatchCustomersLoading.value = false; }
}
async function openExtraMatchCamera() {
                  if (!extraMatch.value.customerid) return ElMessage.warning('Select a customer first.');
                  if (!validAmount(extraMatch.value.points)) return ElMessage.warning('Enter a positive amount / points value first.');

                  extraMatchDialogOpen.value = true;
                  extraMatchCameraOpen.value = true;

                  await nextTick();
                  extraMatchCameraRef.value?.startCamera();
}

function closeExtraMatchCamera() {
                  extraMatchCameraRef.value?.stopCamera?.();
                  extraMatchCameraOpen.value = false;
}

function handleExtraMatchCaptured(image) {
                  extraMatchPhoto.value = image;

                  if (extraMatchPreview.value) URL.revokeObjectURL(extraMatchPreview.value);
                  extraMatchPreview.value = URL.createObjectURL(image);

                  closeExtraMatchCamera();
                  extraMatchDialogOpen.value = false;
}

function resetExtraMatch() {
                  closeExtraMatchCamera();
                  extraMatchPhoto.value = null;

                  if (extraMatchPreview.value) URL.revokeObjectURL(extraMatchPreview.value);
                  extraMatchPreview.value = '';

                  extraMatch.value = { customerid: null, points: '' };
}

function cancelExtraMatchEntry() {
                  resetExtraMatch();
                  ElMessage.info('Extra Match cancelled.');
}
async function saveExtraMatchEntry() {
                  if (!extraMatch.value.customerid) return ElMessage.warning('Select a customer.');
                  if (!validAmount(extraMatch.value.points)) return ElMessage.warning('Enter a positive amount / points value.');
                  if (!extraMatchPhoto.value) return ElMessage.warning('Take the customer points photo before saving.');
                  try {
                    extraMatchSaving.value = true;
                    const imageFile = new File([extraMatchPhoto.value], `extra-match-${extraMatch.value.customerid}-${Date.now()}.png`, { type: extraMatchPhoto.value.type || 'image/png' });
                    const formData = new FormData();
                    formData.append('image', imageFile);
                    formData.append('customer', JSON.stringify({
                      customerid: extraMatch.value.customerid,
                      points: Number(extraMatch.value.points),
                      assignedby: userStore.userId,
                      locationid: locationId.value
                    }));
                    await request({ url: '/customer/saveextramatch', method: 'post', data: formData });
                    ElMessage.success('Extra Match saved successfully.');
                    extraMatchDialogOpen.value = false;
                    resetExtraMatch();
                    await load();
                  } catch (e) { ElMessage.error(errorText(e)); } finally { extraMatchSaving.value = false; }
}

async function handleExportPdf() {
              if (!session.value) return ElMessage.warning('No active session to export.');

              try {
                pdfExporting.value = true;

                exportEmployeeTransactionPdf({
                  employeeName: employeeName.value,
                  session: session.value,
                  duration: liveSessionDuration.value,
                  summary: summary.value,
                  credits: creditTransactions.value,
                  expenses: expenseTransactions.value
                });

                ElMessage.success('PDF exported.');
              } catch (e) {
                ElMessage.error(e?.message || 'Unable to export PDF.');
              } finally {
                pdfExporting.value = false;
              }
}

const canCloseSession = computed(() =>
                  closeSessionForm.value.mode === 'employee'
                    ? Boolean(closeSessionForm.value.touserid && recipients.value.length)
                    : Boolean(closeSessionForm.value.toadminid && adminRecipients.value.length)
);

function resetCloseSession() {
                  closeSessionForm.value = {
                    mode: recipients.value.length ? 'employee' : 'admin',
                    touserid: null,
                    toadminid: adminRecipients.value.length === 1 ? adminRecipients.value[0].id : null,
                    actualcash: '',
                    notes: ''
                  };
}

async function openCloseSession() {
                  if (!locationId.value) return;

                  try {
                    busy.value = true;

                    // Refresh current session and eligible recipients at the moment
                    // the employee opens Close Session, so newly clocked-in users appear.
                    const response = await getEmployeeFinance(locationId.value);
                    const d = response.data || {};

                    session.value = d.session || null;
                    summary.value = d.summary || {};
                    recipients.value = d.recipients || [];
                    adminRecipients.value = d.adminRecipients || [];

                    if (!session.value) {
                      ElMessage.warning('No active session was found.');
                      return;
                    }

                    resetCloseSession();
                    handoverDialogOpen.value = true;
                  } catch (e) {
                    ElMessage.error(errorText(e));
                  } finally {
                    busy.value = false;
                  }
}

async function closeSession() {
                  const form = closeSessionForm.value;

                  if (form.mode === 'employee' && !form.touserid) return ElMessage.warning('Select the receiving employee.');
                  if (form.mode === 'admin' && !form.toadminid) return ElMessage.warning('Select the receiving Admin.');
                  if (form.actualcash !== '' && !validAmount(form.actualcash, true)) {
                    return ElMessage.warning('Physical cash counted must be a nonnegative amount (up to 2 decimals).');
                  }

                  const actual = form.actualcash === '' ? summary.value.balance : form.actualcash;
                  const recipient = form.mode === 'employee'
                    ? recipients.value.find(item => Number(item.id) === Number(form.touserid))?.name || 'employee'
                    : adminRecipients.value.find(item => Number(item.id) === Number(form.toadminid))?.name || 'Admin';

                  try {
                    await ElMessageBox.confirm(
                      form.mode === 'employee'
                        ? `Hand over ${money(actual)} to ${recipient} and close this session?`
                        : `Transfer ${money(actual)} to ${recipient} and close this session?`,
                      'Confirm Session Close',
                      { type: 'warning', confirmButtonText: 'Close Session' }
                    );
                  } catch {
                    return;
                  }

                  await run(async () => {
                    let response;

                    if (form.mode === 'employee') {
                      response = await handoverAndClockOut({
                        sessionid: session.value.id,
                        touserid: form.touserid,
                        actualcash: form.actualcash,
                        notes: form.notes
                      });
                    } else {
                      response = await request({
                        url: '/employeefinance/close-to-admin-and-clockout',
                        method: 'post',
                        data: {
                          sessionid: session.value.id,
                          toadminid: form.toadminid,
                          actualcash: form.actualcash,
                          notes: form.notes
                        }
                      });
                    }

                    userStore.setClockedIn(false);
                    handoverDialogOpen.value = false;
                    return response;
                  }, form.mode === 'employee'
                    ? 'Session closed; handover is pending confirmation.'
                    : `Session closed; cash transferred to ${recipient}.`);
}
watch(() => closeSessionForm.value.mode, mode => {
                  if (mode === 'employee') closeSessionForm.value.toadminid = null;
                  else {
                    closeSessionForm.value.touserid = null;
                    if (adminRecipients.value.length === 1) closeSessionForm.value.toadminid = adminRecipients.value[0].id;
                  }
});
watch(transactionMode, async mode => {
                  if (mode === 'EXTRA_MATCH') {
                    if (!extraMatchCustomers.value.length) await loadExtraMatchCustomers();
                    return;
                  }

                  if (mode === 'TRANSFER_TO_EMPLOYEE') {
                    await refreshTransferRecipients();
                    return;
                  }

                  transaction.value.type = mode;

                  if (mode === 'CASH_RECEIVED') transaction.value.expensetypeid = null;
                  else transaction.value.credittypeid = null;
});
watch(locationId, load);

onMounted(() => {
                  load();

                  liveClockTimer = window.setInterval(() => {
                    liveNow.value = Date.now();
                  }, 1000);

                  // Keep this employee's finance screen synchronized with transactions
                  // created from another employee's screen (for example TRANSFER_IN).
                  financeWatchTimer = window.setInterval(() => {
                    refreshFinanceLive();
                  }, 1000);
});

onBeforeUnmount(() => {
                  if (liveClockTimer) window.clearInterval(liveClockTimer);
                  if (financeWatchTimer) window.clearInterval(financeWatchTimer);
});
</script>

