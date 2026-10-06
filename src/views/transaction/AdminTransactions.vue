<template>
  <div class="app-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Admin Transactions</h2>
        <p>Manage admin transaction</p>
      </div>
    </div>
    <el-alert v-if="!isAdmin" type="error" title="Admin access required" show-icon :closable="false" />
    <el-tabs v-else v-model="adminTab">
      <el-tab-pane label="Overview" name="overview">
        <div class="employee-finance-summary">
          <el-row :gutter="16" class="summary-row employee-finance-main-summary">
            <el-col :xs="24" :sm="8" class="summary-column">
              <el-card shadow="never" class="summary-card summary-teal">
                <div class="summary-card-content">
                  <div class="summary-icon"><el-icon><WalletFilled /></el-icon></div>
                  <el-statistic title="Admin Cash" :value="Number(myCustodyBalance || 0)" :precision="2" prefix="$" />
                </div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="8" class="summary-column">
              <el-card shadow="never" class="summary-card summary-orange">
                <div class="summary-card-content">
                  <div class="summary-icon"><el-icon><Money /></el-icon></div>
                  <el-statistic title="Pending / Reserved" :value="Number(myCustodyReserved || 0)" :precision="2" prefix="$" />
                </div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="8" class="summary-column">
              <el-card shadow="never" class="summary-card summary-green">
                <div class="summary-card-content">
                  <div class="summary-icon"><el-icon><CircleCheckFilled /></el-icon></div>
                  <el-statistic title="Available Balance" :value="Number(myCustodyAvailable || 0)" :precision="2" prefix="$" />
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <el-alert v-if="custodyError" type="error" :title="custodyError" :closable="false" show-icon />

        <div class="work-grid cash-activity-section">
          <el-card shadow="never" class="panel cash-entry-card">
            <template #header>
              <div class="cash-header-actions">
                <el-segmented v-model="adminTransactionMode"
                              :options="adminTransactionOptions"
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

            <el-form class="cash-activity-form" @submit.prevent="saveAdminCashTransaction">
              <div class="cash-activity-row">
                <el-select v-if="adminTransactionMode === 'CASH_RECEIVED'"
                           v-model="adminCashTransaction.credittypeid"
                           class="cash-type-select"
                           placeholder="Credit type"
                           :loading="transactionTypesLoading"
                           @visible-change="visible => visible && refreshAdminCreditTypes()">
                  <el-option v-for="type in transactionCreditTypes"
                             :key="type.id"
                             :label="type.name"
                             :value="type.id" />
                </el-select>

                <el-select v-else
                           v-model="adminCashTransaction.expensetypeid"
                           class="cash-type-select"
                           placeholder="Expense type"
                           :loading="transactionTypesLoading"
                           @visible-change="visible => visible && refreshAdminExpenseTypes()">
                  <el-option v-for="type in transactionExpenseTypes"
                             :key="type.id"
                             :label="type.name"
                             :value="type.id" />
                </el-select>

                <el-input v-model="adminCashTransaction.amount"
                          class="cash-amount-input"
                          inputmode="decimal"
                          placeholder="0.00">
                  <template #prefix>
                    <strong>{{ adminTransactionMode === 'CASH_RECEIVED' ? '+ $' : '− $' }}</strong>
                  </template>
                </el-input>

                <el-button :type="adminTransactionMode === 'CASH_RECEIVED' ? 'success' : 'danger'"
                           class="cash-record-btn"
                           native-type="submit"
                           :loading="adminBusy"
                           :disabled="adminBusy || !custodyLoaded">
                  {{ adminTransactionMode === 'CASH_RECEIVED' ? 'Record credit' : 'Record expense' }}
                </el-button>
              </div>
            </el-form>
          </el-card>
        </div>

        <div class="session-ledger-grid space-top">
          <el-card shadow="never" class="ledger-card credit-ledger">
            <template #header>
              <strong>Credits</strong>
            </template>

            <el-empty v-if="!adminCreditTransactions.length"
                      description="No credits yet"
                      :image-size="70" />

            <div v-else class="ledger-list">
              <div v-for="item in adminCreditTransactions"
                   :key="item.id"
                   class="ledger-item">
                <div>
                  <strong>{{ adminLedgerLabel(item) }}</strong>
                  <p>
                    {{ dateTime(item.createdAt) }}
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

            <el-empty v-if="!adminExpenseTransactions.length"
                      description="No expenses yet"
                      :image-size="70" />

            <div v-else class="ledger-list">
              <div v-for="item in adminExpenseTransactions"
                   :key="item.id"
                   class="ledger-item">
                <div>
                  <strong>{{ adminLedgerLabel(item) }}</strong>
                  <p>
                    {{ dateTime(item.createdAt) }}
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
      </el-tab-pane>

      <el-tab-pane label="Business Funding" name="funding">
        <el-card shadow="never" class="panel">
          <template #header>
            <div class="cash-header-actions">
              <div><strong>Admin → Employee Cash Funding</strong><div class="hint">Send opening cash or additional business support from your Admin custody. The employee confirms receipt before their session is credited.</div></div>
            </div>
          </template>
          <p>Available to transfer: <strong>{{ custodyLoaded && !custodyError ? money(myCustodyAvailable) : '—' }}</strong></p>
          <el-alert v-if="custodyError" type="error" :title="custodyError" :closable="false" show-icon />
          <el-form label-position="top" class="cash-activity-form" @submit.prevent="sendAdminFunding">
            <el-form-item label="Receiving employee">
              <el-select v-model="adminFunding.touserid" filterable placeholder="Select employee" style="width:100%">
                <el-option v-for="person in adminEmployees" :key="person.id" :value="person.id" :label="`${person.name}${person.clockedIn ? ' · Clocked in' : ''}`" />
              </el-select>
            </el-form-item>
            <el-form-item label="Funding type">
              <el-select v-model="adminFunding.fundingtype" style="width:100%">
                <el-option label="Initial Opening Balance" value="INITIAL_OPENING" />
                <el-option label="Business Support / Additional Cash" value="BUSINESS_SUPPORT" />
              </el-select>
            </el-form-item>
            <el-form-item :label="`Amount · Available ${custodyLoaded && !custodyError ? money(myCustodyAvailable) : '—'}`">
              <el-input v-model="adminFunding.amount" inputmode="decimal" placeholder="0.00" :disabled="!custodyLoaded || !!custodyError || myCustodyAvailable <= 0">
                <template #prefix>
                  $
                </template>
              </el-input>
              <div v-if="validAmount(adminFunding.amount) && Number(adminFunding.amount) > myCustodyAvailable" class="hint">Amount exceeds available cash.</div>
            </el-form-item>
            <el-form-item label="Notes (optional)"><el-input v-model="adminFunding.notes" maxlength="500" /></el-form-item>
            <div v-if="adminFunding.fundingtype === 'INITIAL_OPENING'" class="hint">Initial Opening is for an employee’s first cash activity in their active session. Otherwise, choose Business Support.</div>
            <div><el-button type="primary" native-type="submit" :loading="adminBusy" :disabled="adminBusy || !custodyLoaded || !!custodyError || myCustodyAvailable <= 0 || (validAmount(adminFunding.amount) && Number(adminFunding.amount) > myCustodyAvailable)"><el-icon><Money /></el-icon><span>Send cash for confirmation</span></el-button></div>
          </el-form>

        </el-card>

        <el-card shadow="never" class="panel">
          <template #header>
            <div class="cash-header-actions"><div><strong>Admin-to-Employee Funding Status</strong><div class="hint">Check pending transfers and previously confirmed cash.</div></div></div>
          </template>
          <el-empty v-if="!adminFundingHistory.length" description="No funding records yet" :image-size="60" />
          <div v-else>
            <el-table :data="adminFundingHistory" size="small" style="width:100%">
              <el-table-column label="Created" min-width="160">
                <template #default="{ row }">
                  {{ dateTime(row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column prop="fromName" label="From" min-width="130" />
              <el-table-column prop="toName" label="Employee" min-width="130" />
              <el-table-column label="Type" min-width="145">
                <template #default="{ row }">
                  {{ row.fundingType === 'INITIAL_OPENING' ? 'Initial Opening' : 'Business Support' }}
                </template>
              </el-table-column>
              <el-table-column label="Amount" min-width="105">
                <template #default="{ row }">
                  {{ money(row.amount) }}
                </template>
              </el-table-column>
              <el-table-column label="Status" min-width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'Accepted' ? 'success' : row.status === 'Cancelled' ? 'info' : 'warning'" effect="light">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Actions" min-width="140" align="right">
                <template #default="{ row }">
                  <template v-if="row.status === 'Pending'">
                    <el-button v-if="!row.custodySourceAccountId" link type="primary" :disabled="adminBusy" @click="openEditFunding(row)"><el-icon><Edit /></el-icon><span>Edit</span></el-button>
                    <el-button link type="danger" :loading="adminBusy" @click="cancelFunding(row)"><el-icon><Close /></el-icon><span>Cancel</span></el-button>
                  </template>
                  <span v-else class="hint">Locked</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="Add Expense Type" name="expenses">

        <el-card shadow="never" class="panel">
          <template #header>
            <div class="cash-header-actions"><div><strong>Manage Expense Types</strong><div class="hint">Maintain the same expense categories used by employees and Admin.</div></div></div>
          </template>
          <div class="cash-activity-row"><el-input v-model="newExpenseType" maxlength="100" placeholder="New expense type, e.g. Supplies" @keyup.enter="addType" /><el-button type="primary" :loading="busy" @click="addType"><el-icon><Plus /></el-icon><span>Add type</span></el-button></div>
          <div class="ledger-list"><div v-for="item in expenseTypes" :key="item.id" class="ledger-item"><span>{{ item.name }}</span><el-switch :model-value="item.isActive" :loading="busy" @change="value => changeType(item, value)" /></div></div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="editFundingOpen" title="Edit Pending Funding" width="520px" :close-on-click-modal="false" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="Receiving employee"><el-select v-model="editFunding.touserid" filterable style="width:100%"><el-option v-for="person in adminEmployees" :key="person.id" :value="person.id" :label="`${person.name}${person.clockedIn ? ' · Clocked in' : ''}`" /></el-select></el-form-item>
        <el-form-item label="Funding type"><el-select v-model="editFunding.fundingtype" style="width:100%"><el-option label="Initial Opening Balance" value="INITIAL_OPENING" /><el-option label="Business Support / More Cash" value="BUSINESS_SUPPORT" /></el-select></el-form-item>
        <el-form-item label="Amount">
          <el-input v-model="editFunding.amount" inputmode="decimal">
            <template #prefix>
              $
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="Notes (optional)"><el-input v-model="editFunding.notes" maxlength="500" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editFundingOpen = false"><el-icon><Close /></el-icon><span>Cancel</span></el-button>
        <el-button type="primary" :loading="adminBusy" @click="saveFundingEdit"><el-icon><Check /></el-icon><span>Save changes</span></el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useUserStore } from '@/store/modules/user';
import request from '@/utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
//
import {
    getEmployeeFinance,
    getExpenseTypes,
    getCreditTypes,
    createExpenseType,
    setExpenseTypeStatus,
    getAdminFinanceOverview,
    updateAdminFunding,
    cancelAdminFunding,
    sendCustodyEmployeeSupport,
    getLocationCash,
    addCustodyExpense
} from '@/api/employeeFinance';

const userStore = useUserStore();
const locationId = computed(() => userStore.locationId);
const isAdmin = computed(() => String(userStore.roleName || '').trim().toLowerCase() === 'admin');
const isAdminRole = computed(() => String(userStore.roleName || '').trim().toLowerCase() === 'admin');
const loading = ref(false); const busy = ref(false);
const adminLoading = ref(false); const adminBusy = ref(false);
const session = ref(null); const summary = ref({}); const transactions = ref([]); const pending = ref([]); const pendingAdminFunding = ref([]);
const recipients = ref([]); const expenseTypes = ref([]);
const adminEmployees = ref([]); const adminFundingHistory = ref([]); const adminSummary = ref({});
const custodyAccounts = ref([]);
const custodyViewerId = ref(null);
const custodyLoaded = ref(false);
const custodyLoading = ref(false);
const custodyError = ref('');
let custodyRequestId = 0;
const myCustodyAccount = computed(() => custodyAccounts.value.find(a =>
    String(a.kind).toUpperCase() === (isAdminRole.value ? 'ADMIN' : 'OWNER') &&
          Number(a.userId) === Number(custodyViewerId.value)
) || null);
const myCustodyBalance = computed(() => Number(myCustodyAccount.value?.balance || 0));
const myCustodyReserved = computed(() => Number(myCustodyAccount.value?.reserved || 0));
const myCustodyAvailable = computed(() => Math.max(0, Math.round((myCustodyBalance.value - myCustodyReserved.value) * 100) / 100));
const adminTransactionMode = ref('CASH_RECEIVED');
const adminTransactionOptions = [
    { label: 'Add Bank', value: 'CASH_RECEIVED', icon: 'WalletFilled' },
    { label: 'Expense', value: 'EXPENSE', icon: 'Money' }
];
const adminCashTransaction = ref({ amount: '', credittypeid: null, expensetypeid: null, notes: '' });
const transactionCreditTypes = ref([]);
const transactionExpenseTypes = ref([]);
const transactionTypesLoading = ref(false);
const adminLedger = ref([]);
const adminFunding = ref({ touserid: null, fundingtype: 'BUSINESS_SUPPORT', amount: '', notes: '' });
const editFundingOpen = ref(false);
const editFunding = ref({ id: null, touserid: null, fundingtype: 'INITIAL_OPENING', amount: '', notes: '' });
const newExpenseType = ref('');
const adminTab = ref('overview');
const activeTypes = computed(() => expenseTypes.value.filter(x => x.isActive));
const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const dateTime = value => value ? new Date(value).toLocaleString() : '—'; const errorText = e => e?.response?.data?.message || e?.message || 'Request failed.';
const validAmount = (v, allowZero = false) => /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(String(v).trim()) && (Number(v) > 0 || (allowZero && Number(v) === 0));

const adminCreditTransactions = computed(() =>
    adminLedger.value
      .filter(item => Number(item.amount || 0) > 0)
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
);

const adminExpenseTransactions = computed(() =>
    adminLedger.value
      .filter(item => Number(item.amount || 0) < 0)
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
);

const adminLedgerLabel = item => {
    if (item?.label) return item.label;

    return {
      BANK_DEPOSIT: 'Add Bank',
      MACHINE_COLLECTION: 'Machine Collection',
      EMPLOYEE_CASH_TAKEN: 'Employee Session Close',
      INITIAL_CAPITAL: 'Initial Capital',
      CUTOVER_OPENING: 'Opening Bank',
      TRANSFER: Number(item?.amount || 0) >= 0 ? 'Transfer In' : 'Transfer Out',
      EMPLOYEE_SUPPORT: 'Employee Funding',
      DIRECT_EXPENSE: item?.expenseTypeName || 'Expense',
      BANK_WITHDRAWAL: 'Bank Withdrawal',
      OWNER_DISTRIBUTION: 'Owner Distribution'
    }[item?.kind] || (Number(item?.amount || 0) >= 0 ? 'Credit' : 'Expense');
};


async function loadCustody() {
    if (!isAdmin.value || !locationId.value) return;
    const targetLocation = Number(locationId.value);
    const requestId = ++custodyRequestId;
    // Retain previously loaded figures while refreshing; never unmount the balance/form.
    try {
      custodyLoading.value = true;
      custodyError.value = '';
      const response = await getLocationCash(targetLocation);
      if (Number(locationId.value) !== targetLocation || requestId !== custodyRequestId) return;
      const d = response.data || {};
      custodyAccounts.value = d.accounts || [];
      custodyViewerId.value = d.viewerId;
      custodyLoaded.value = true;
    } catch (e) {
      if (Number(locationId.value) !== targetLocation || requestId !== custodyRequestId) return;
      // Preserve the previous figures for display, but block transfers until a fresh check succeeds.
      custodyError.value = errorText(e);
    } finally {
      if (Number(locationId.value) === targetLocation && requestId === custodyRequestId) custodyLoading.value = false;
    }
}
async function loadAdminLedger() {
    if (!isAdmin.value || !locationId.value) return;

    try {
      const response = await request({
        url: '/employeefinance/admin/cash-ledger',
        method: 'get',
        params: { locationid: locationId.value }
      });

      adminLedger.value = response?.data || [];
    } catch (e) {
      adminLedger.value = [];
      ElMessage.error(errorText(e));
    }
}

async function refreshAdminCreditTypes() {
    if (!locationId.value) return;

    try {
      transactionTypesLoading.value = true;
      const response = await getCreditTypes(locationId.value);
      transactionCreditTypes.value = response?.data || response || [];
    } catch (e) {
      ElMessage.error(errorText(e));
    } finally {
      transactionTypesLoading.value = false;
    }
}

async function refreshAdminExpenseTypes() {
    if (!locationId.value) return;

    try {
      transactionTypesLoading.value = true;
      const response = await getExpenseTypes(locationId.value);
      transactionExpenseTypes.value = response?.data || response || [];
    } catch (e) {
      ElMessage.error(errorText(e));
    } finally {
      transactionTypesLoading.value = false;
    }
}

async function saveAdminCashTransaction() {
    if (!validAmount(adminCashTransaction.value.amount)) {
      return ElMessage.warning('Enter a positive amount (up to 2 decimals).');
    }

    if (
      adminTransactionMode.value === 'CASH_RECEIVED' &&
      !adminCashTransaction.value.credittypeid
    ) {
      return ElMessage.warning('Select a credit type.');
    }

    if (
      adminTransactionMode.value === 'EXPENSE' &&
      !adminCashTransaction.value.expensetypeid
    ) {
      return ElMessage.warning('Select an expense type.');
    }

    if (adminTransactionMode.value === 'EXPENSE') {
      await loadCustody();

      if (!custodyLoaded.value || custodyError.value) {
        return ElMessage.error('Unable to verify your current Admin cash balance.');
      }

      if (Number(adminCashTransaction.value.amount) > myCustodyAvailable.value) {
        return ElMessage.warning(
          `Expense cannot exceed ${money(myCustodyAvailable.value)} available Admin cash.`
        );
      }
    }

    try {
      adminBusy.value = true;

      if (adminTransactionMode.value === 'CASH_RECEIVED') {
        await request({
          url: '/employeefinance/admin/add-bank',
          method: 'post',
          data: {
            locationid: locationId.value,
            credittypeid: adminCashTransaction.value.credittypeid,
            amount: adminCashTransaction.value.amount,
            notes: adminCashTransaction.value.notes
          }
        });

        ElMessage.success('Admin bank credited.');
      } else {
        await addCustodyExpense({
          locationid: locationId.value,
          source: 'ADMIN',
          expensetypeid: adminCashTransaction.value.expensetypeid,
          amount: adminCashTransaction.value.amount,
          notes: adminCashTransaction.value.notes
        });

        ElMessage.success('Admin expense recorded.');
      }

      adminCashTransaction.value = {
        amount: '',
        credittypeid: null,
        expensetypeid: null,
        notes: ''
      };

      await Promise.all([loadCustody(), loadAdminLedger()]);
    } catch (e) {
      ElMessage.error(errorText(e));
    } finally {
      adminBusy.value = false;
    }
}

async function refreshBalances() {
    await Promise.all([loadAdminOverview(), loadCustody(), loadAdminLedger()]);
}
async function load() {
    if (!locationId.value) return;
    // Reload data in place. Clear custody only when the selected location actually changes.
    try {
      loading.value = true;
      const response = await getEmployeeFinance(locationId.value);
      const d = response.data || {};
      session.value = d.session || null; summary.value = d.summary || {};
      transactions.value = d.transactions || []; pending.value = d.pending || [];
      pendingAdminFunding.value = d.pendingAdminFunding || [];
      recipients.value = d.recipients || [];
      expenseTypes.value = d.expenseTypes || [];
      transactionExpenseTypes.value = (d.expenseTypes || []).filter(x => x.isActive);
      transactionCreditTypes.value = (d.creditTypes || []).filter(x => x.isActive);
      if (isAdmin.value) await refreshBalances();
    } catch (e) { ElMessage.error(errorText(e)); } finally { loading.value = false; }
}

async function loadAdminOverview() {
    if (!isAdmin.value || !locationId.value) return;
    try {
      adminLoading.value = true;
      const d = (await getAdminFinanceOverview(locationId.value)).data || {};
      adminEmployees.value = d.employees || [];
      adminFundingHistory.value = d.funding || [];
      adminSummary.value = d.summary || {};
    } catch (e) {
      ElMessage.error(errorText(e));
    } finally {
      adminLoading.value = false;
    }
}

async function sendAdminFunding() {
    // Recheck the server-authoritative custody balance immediately before sending.
    await loadCustody();
    if (!custodyLoaded.value || custodyError.value) return ElMessage.error('Unable to verify your current Admin cash balance.');
    if (!adminFunding.value.touserid) return ElMessage.warning('Select the receiving employee.');
    if (!validAmount(adminFunding.value.amount)) return ElMessage.warning('Enter a positive amount (up to 2 decimals).');
    if (Number(adminFunding.value.amount) > myCustodyAvailable.value) { return ElMessage.warning(`You can transfer up to ${money(myCustodyAvailable.value)} of unreserved cash.`); }
    try {
      adminBusy.value = true;
      await sendCustodyEmployeeSupport({ locationid: locationId.value, ...adminFunding.value });
      ElMessage.success(adminFunding.value.fundingtype === 'INITIAL_OPENING'
        ? 'Opening balance sent for employee confirmation.'
        : 'Business support sent for employee confirmation.');
      adminFunding.value = { touserid: null, fundingtype: 'BUSINESS_SUPPORT', amount: '', notes: '' };
      await refreshBalances();
    } catch (e) {
      ElMessage.error(errorText(e));
    } finally {
      adminBusy.value = false;
    }
}

function openEditFunding(item) {
    if (item.status !== 'Pending') return ElMessage.warning('Only pending funding can be edited.');

    const employee = adminEmployees.value.find(person => Number(person.id) === Number(item.toUserId)) || adminEmployees.value.find(person => person.name === item.toName);

    editFunding.value = {
      id: item.id,
      touserid: employee?.id ?? null,
      fundingtype: item.fundingType || 'INITIAL_OPENING',
      amount: String(item.amount ?? ''),
      notes: item.notes || ''
    };

    editFundingOpen.value = true;
}

async function saveFundingEdit() {
    if (!editFunding.value.id) return;
    if (!editFunding.value.touserid) return ElMessage.warning('Select the receiving employee.');
    if (!validAmount(editFunding.value.amount)) { return ElMessage.warning('Enter a positive amount (up to 2 decimals).'); }

    try {
      adminBusy.value = true;

      await updateAdminFunding(editFunding.value.id, {
        locationid: locationId.value,
        touserid: editFunding.value.touserid,
        fundingtype: editFunding.value.fundingtype,
        amount: editFunding.value.amount,
        notes: editFunding.value.notes
      });

      editFundingOpen.value = false;
      ElMessage.success('Pending funding updated.');

      await refreshBalances();
    } catch (e) {
      ElMessage.error(errorText(e));
    } finally {
      adminBusy.value = false;
    }
}

async function cancelFunding(item) {
    try {
      await ElMessageBox.confirm(`Cancel pending funding of ${money(item.amount)} to ${item.toName}?`,
        'Cancel funding', { type: 'warning', confirmButtonText: 'Cancel funding' });
    } catch { return; }
    try {
      adminBusy.value = true;
      await cancelAdminFunding(item.id, { locationid: locationId.value });
      ElMessage.success('Pending funding cancelled.');
      await refreshBalances();
    } catch (e) {
      ElMessage.error(errorText(e));
    } finally {
      adminBusy.value = false;
    }
}

async function run(action, success) {
    try { busy.value = true; await action(); ElMessage.success(success); await load(); return true; } catch (e) { ElMessage.error(errorText(e)); return false; } finally { busy.value = false; }
}
async function addType() {
    if (!newExpenseType.value.trim()) return ElMessage.warning('Enter an expense type name.');
    await run(() => createExpenseType({ locationid: locationId.value, name: newExpenseType.value.trim() }), 'Expense type added.');
    newExpenseType.value = '';
}
async function changeType(item, value) {
    await run(() => setExpenseTypeStatus(item.id, { locationid: locationId.value, isactive: value }), 'Expense type updated.');
}
watch(adminTransactionMode, mode => {
    adminCashTransaction.value.amount = '';
    adminCashTransaction.value.notes = '';

    if (mode === 'CASH_RECEIVED') {
      adminCashTransaction.value.expensetypeid = null;
    } else {
      adminCashTransaction.value.credittypeid = null;
    }
});

watch(adminTab, value => {
    if (!['overview', 'funding', 'expenses'].includes(value)) adminTab.value = 'overview';
});
watch(locationId, () => { ++custodyRequestId; custodyLoaded.value = false; custodyLoading.value = false; custodyError.value = ''; custodyAccounts.value = []; custodyViewerId.value = null; adminLedger.value = []; load(); });
onMounted(load);
</script>

