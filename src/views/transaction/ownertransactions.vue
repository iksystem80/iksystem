<template>
  <div class="app-container finance-page irfan-transaction-ownertransactions irfan-ui-page">
    <div class="page-header"><div><h2 class="page-title">Owner Transactions</h2><p>Review business cash balances and fund Admins.</p></div></div>
    <el-alert v-if="!isOwner" type="error" title="Owner access required" show-icon :closable="false" />
    <el-tabs v-else v-model="tab" class="admin-tabs">
      <el-tab-pane label="Overview" name="overview">
        <el-card shadow="never" class="tab-content">
          <template #header>
            <div class="section-heading report-card-header"><div><strong>Your Owner Cash Overview</strong><div class="small-text">Current Owner custody, business bank and Admin cash balances.</div></div></div>
          </template>
          <div v-if="adminCustodians.length || activeEmployeeBalances.length" class="custody-balance-groups">
            <div v-if="adminCustodians.length" class="custody-balance-group">
              <div class="custody-group-label">Admin Balances</div>
              <div class="custody-holder-list">
                <div v-for="account in adminCustodians" :key="`admin-${account.id || account.userId}`" class="custody-holder">
                  <span>{{ account.name || 'Admin' }}</span><strong>{{ cash(account.balance) }}</strong>
                </div>
              </div>
            </div>
            <div v-if="activeEmployeeBalances.length" class="custody-balance-group">
              <div class="custody-group-label">Employees · Open Sessions</div>
              <div class="custody-holder-list">
                <div v-for="employee in activeEmployeeBalances" :key="`session-${employee.sessionId}`" class="custody-holder">
                  <span>{{ employee.name }}</span><strong>{{ cash(employee.currentCash) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </el-card>
        <el-card shadow="never" class="tab-content">
          <template #header>
            <div class="section-heading report-card-header">
              <div><strong>Admin Withdrawals · Last 7 Days</strong><div class="small-text">Cash withdrawn from business custody by Admins during the last seven calendar days.</div></div>
            </div>
          </template>
          <div class="table-wrap">
            <el-table :data="adminWithdrawals" v-loading="loading" size="small" style="width:100%" empty-text="No Admin withdrawals in the last 7 days">
              <el-table-column label="Date" min-width="160"><template #default="{row}">{{ dateTime(row.createdAt) }}</template></el-table-column>
              <el-table-column prop="adminName" label="Admin" min-width="120" />
              <el-table-column label="Withdrawal" min-width="130"><template #default="{row}"><span class="withdrawal-amount">−{{ cash(Math.abs(Number(row.amount))) }}</span></template></el-table-column>
              <el-table-column prop="notes" label="Notes" min-width="200" show-overflow-tooltip />
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="Fund Admin" name="fund">
        <el-card shadow="never" class="tab-content">
          <template #header>
            <div class="section-heading report-card-header"><div><strong>Initial Owner Capital</strong><div class="small-text">New Owner investment added to the business.</div></div></div>
          </template>
          <el-form label-position="top" class="form-grid" @submit.prevent="submitCapital">
            <el-form-item label="Receiving Admin"><el-select v-model="capital.touserid" filterable placeholder="Select Admin" style="width:100%"><el-option v-for="p in admins" :key="p.id" :label="p.name" :value="p.id" /></el-select></el-form-item>
            <el-form-item label="Amount">
              <el-input v-model="capital.amount" inputmode="decimal" placeholder="0.00">
                <template #prefix>
                  $
                </template>
              </el-input>
            </el-form-item>
            <el-form-item class="form-wide" label="Notes (optional)"><el-input v-model="capital.notes" maxlength="500" /></el-form-item>
            <div class="form-wide"><el-button type="primary" native-type="submit" :loading="busy"><el-icon><MessageBox /></el-icon><span>Send initial capital</span></el-button></div>
          </el-form>
        </el-card>
        <el-card shadow="never" class="tab-content">
          <template #header>
            <div class="section-heading report-card-header"><div><strong>Reinvest Cash from Your Custody</strong><div class="small-text">An internal Owner → Admin transfer using cash already held by the Owner.</div></div></div>
          </template>
          <p class="funding-available">Available to transfer: <strong>{{ cash(ownerAvailable) }}</strong></p>
          <el-form label-position="top" class="form-grid" @submit.prevent="submitTransfer">
            <el-form-item label="Receiving Admin"><el-select v-model="transfer.touserid" filterable placeholder="Select Admin" style="width:100%"><el-option v-for="p in admins" :key="p.id" :label="p.name" :value="p.id" /></el-select></el-form-item>
            <el-form-item :label="`Amount · Available ${cash(ownerAvailable)}`">
              <el-input v-model="transfer.amount" inputmode="decimal" placeholder="0.00">
                <template #prefix>
                  $
                </template>
              </el-input>
            </el-form-item>
            <el-form-item class="form-wide" label="Notes (optional)"><el-input v-model="transfer.notes" maxlength="500" /></el-form-item>
            <div class="form-wide"><el-button type="primary" native-type="submit" :loading="busy" :disabled="ownerAvailable<=0"><el-icon><Money /></el-icon><span>Transfer to Admin</span></el-button></div>
          </el-form>
        </el-card>
        <el-card shadow="never" class="tab-content">
          <template #header>
            <div class="section-heading report-card-header"><div><strong>Initial Capital History</strong><div class="small-text">Review capital transfers and cancel eligible pending records.</div></div></div>
          </template>
          <div class="table-wrap">
            <el-table :data="data.capital || []" size="small" style="width:100%">
              <el-table-column label="Date" min-width="155">
                <template #default="{row}">
                  {{ dateTime(row.createdAt) }}
                </template>
              </el-table-column><el-table-column prop="toName" label="Admin" min-width="120" /><el-table-column label="Amount" min-width="110">
                <template #default="{row}">
                  {{ cash(row.amount) }}
                </template>
              </el-table-column><el-table-column prop="status" label="Status" min-width="95" /><el-table-column label="Actions" min-width="120">
                <template #default="{row}">
                  <el-button v-if="row.status==='Pending' && Number(row.createdBy)===Number(data.viewerId)" link type="danger" :disabled="busy" @click="cancelCapital(row)"><el-icon><Delete /></el-icon><span>Cancel</span></el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import request from '@/utils/request';
import { getLocationCash, getAdminFinanceOverview, addInitialCapital, cancelInitialCapital, sendCustodyTransfer } from '@/api/employeefinance';
const store = useUserStore(); const locationId = computed(() => store.locationId);
const isOwner = computed(() => ['owner', 'system admin'].includes(String(store.roleName || '').trim().toLowerCase()));
const data = ref({ viewerId: null, accounts: [], people: [], capital: [], transfers: [], entries: [] }); const adminWithdrawals = ref([]); const openSessions = ref([]); const tab = ref('overview'); const loading = ref(false); const busy = ref(false);
const capital = ref({ touserid: null, amount: '', notes: '' }); const transfer = ref({ touserid: null, amount: '', notes: '' });
const admins = computed(() => (data.value.people || []).filter(p => ['admin', 'system admin'].includes(p.role)));
const myOwner = computed(() => (data.value.accounts || []).find(a => a.kind === 'OWNER' && Number(a.userId) === Number(data.value.viewerId)));
const ownerBalance = computed(() => Number(myOwner.value?.balance || 0)); const ownerAvailable = computed(() => Math.max(0, ownerBalance.value - Number(myOwner.value?.reserved || 0)));
const adminCustodians = computed(() => (data.value.accounts || []).filter(a => a.kind === 'ADMIN'));
const activeEmployeeBalances = computed(() => (openSessions.value || [])
  .filter(session => Number(session.currentCash || 0) > 0)
  .map(session => ({ ...session, name: session.name || session.employeeName || 'Employee' })));

const cash = v => Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const dateTime = v => v ? new Date(v).toLocaleString() : '—';
const errorText = e => e?.response?.data?.message || e?.message || 'Request failed.';
const validAmount = v => /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(String(v ?? '').trim()) && Number(v) > 0;
let requestId = 0;
async function load() {
  if (!isOwner.value || !locationId.value) return;
  const id = ++requestId;
  loading.value = true;
  try {
    const [cashResult, sessionsResult, withdrawalsResult] = await Promise.allSettled([
      getLocationCash(locationId.value),
      getAdminFinanceOverview(locationId.value),
      request({ url: '/employeefinance/owner/admin-withdrawals', method: 'get', params: { locationid: locationId.value } })
    ]);
    if (id !== requestId) return;
    if (cashResult.status === 'fulfilled') data.value = cashResult.value.data || data.value;
    else ElMessage.error(errorText(cashResult.reason));
    // Employee balances come from the existing read-only open-session overview.
    // No new balance formula or transaction is introduced by this page.
    openSessions.value = sessionsResult.status === 'fulfilled'
      ? (sessionsResult.value.data?.cashHolders || []) : [];
    if (sessionsResult.status === 'rejected') ElMessage.error('Unable to load open employee session balances.');
    adminWithdrawals.value = withdrawalsResult.status === 'fulfilled' ? (withdrawalsResult.value.data || []) : [];
    if (withdrawalsResult.status === 'rejected') ElMessage.error(errorText(withdrawalsResult.reason));
  } finally {
    if (id === requestId) loading.value = false;
  }
}
async function execute(fn, success) { if (busy.value) return; busy.value = true; try { await fn(); ElMessage.success(success); await load(); return true; } catch (e) { ElMessage.error(errorText(e)); return false; } finally { busy.value = false; } }
async function submitCapital() { if (!capital.value.touserid || !validAmount(capital.value.amount)) return ElMessage.warning('Select Admin and enter a valid amount.'); if (await execute(() => addInitialCapital({ locationid: locationId.value, ...capital.value }), 'Capital sent for Admin confirmation.')) capital.value = { touserid: null, amount: '', notes: '' }; }
async function submitTransfer() { if (!transfer.value.touserid || !validAmount(transfer.value.amount)) return ElMessage.warning('Select Admin and enter a valid amount.'); if (Number(transfer.value.amount) > ownerAvailable.value) return ElMessage.warning('Amount exceeds your available cash.'); if (await execute(() => sendCustodyTransfer({ locationid: locationId.value, fromkind: 'OWNER', tokind: 'ADMIN', ...transfer.value }), 'Transfer sent for Admin confirmation.')) transfer.value = { touserid: null, amount: '', notes: '' }; }
async function cancelCapital(row) { await execute(() => cancelInitialCapital(row.id, { locationid: locationId.value }), 'Pending capital cancelled.'); }
watch(locationId, () => { data.value = { viewerId: null, accounts: [], people: [], capital: [], transfers: [], entries: [] }; openSessions.value = []; adminWithdrawals.value = []; load(); }); onMounted(load);
</script>

<style scoped>
/* Consistent separation between Overview and Fund Admin sections. */
.tab-content + .tab-content { margin-top: 16px; }
.withdrawal-amount { color: var(--el-color-danger); font-weight: 600; }
.custody-balance-groups { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; }
.custody-balance-group { flex: 1 1 260px; min-width: 0; }
.custody-group-label { font-size: 11px; font-weight: 600; color: var(--el-text-color-secondary); margin-bottom: 8px; }
.custody-holder-list { border: 1px solid var(--el-border-color-lighter); border-radius: 8px; overflow: hidden; }
.custody-holder { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 12px; font-size: 12px; }
.custody-holder + .custody-holder { border-top: 1px solid var(--el-border-color-lighter); }
.custody-holder strong { white-space: nowrap; font-size: 13px; }
@media (max-width: 600px) { .custody-balance-groups { flex-direction: column; } .custody-balance-group { flex: auto; width: 100%; } }
    :deep(.el-button > span), :deep(.el-button .el-icon) {
        color: inherit !important;
    }
</style>
