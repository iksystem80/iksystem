<template>
  <div class="page-container raffle-settings-page">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="router.push('/raffle')"><el-icon><ArrowLeft /></el-icon></el-button>
        <div><h1 class="page-title">Raffle Settings</h1><div class="page-subtitle">Configure the wheel and review raffle winner history.</div></div>
      </div>
    </div>

    <div class="settings-layout">
      <div class="settings-left">
        <div class="machine-summary">
          <div><small>TOTAL MACHINES</small><strong>{{ machines.length }}</strong></div>
          <div><small>IN RAFFLE</small><strong>{{ machinesInPlay }}</strong></div>
          <div><small>EXCLUDED</small><strong>{{ form.excludedMachineIds.length }}</strong></div>
        </div>

        <el-card shadow="never" class="section-card">
          <template #header>
            <div><strong>Wheel Configuration</strong><small>Control which machines can be selected by the raffle wheel.</small></div>
          </template>
          <el-form label-position="top">
            <el-form-item label="Machines to Exclude">
              <el-select v-model="form.excludedMachineIds" multiple collapse-tags collapse-tags-tooltip style="width:100%" placeholder="All machines are in play">
                <el-option v-for="machine in machines" :key="machine.id" :label="`Machine ${machine.machineNumber}`" :value="machine.id" />
              </el-select>
            </el-form-item>
            <div class="helper-text">Excluded machines will never be selected by the wheel.</div>
          </el-form>
        </el-card>

        <div class="section-label">REPEAT RULE</div>
        <el-card shadow="never" class="section-card">
          <div class="switch-row">
            <div><strong>No repeated winning number</strong><p>A number that already came out in this raffle can't come out again, not even on a re-draw. The next raffle starts with the full pool.</p></div>
            <el-switch v-model="noRepeatedWinningNumber" size="large" />
          </div>
        </el-card>

        <div class="section-label">DRAW ANIMATION</div>
        <el-card shadow="never" class="section-card">
          <div class="animation-heading"><el-icon><Timer /></el-icon><div><strong>How long the wheel spins</strong><p>Longer spin builds more suspense on the floor.</p></div></div>
          <div class="duration-options">
            <button v-for="duration in [5,8,12]" :key="duration" type="button" :class="{active:form.spinDurationSeconds===duration}" @click="form.spinDurationSeconds=duration">{{ duration }} sec</button>
          </div>
        </el-card>

        <div class="save-row"><el-button type="primary" :loading="saving" @click="save">Save Settings</el-button></div>
      </div>

      <div class="settings-right">
        <div class="winner-head"><h2>Winners Control</h2><p>Raffle winner history. Select a customer to view all previous wins.</p></div>
        <el-card shadow="never" class="winners-card">
          <div class="winner-list-caption">Tap a customer to see every win</div>
          <div v-loading="loadingWinners">
            <button v-for="winner in winners" :key="winner.customerId" type="button" class="winner-row" @click="openHistory(winner)">
              <el-avatar :size="46" :src="customerImage(winner)">{{ customerInitials(winner) }}</el-avatar>
              <div class="winner-main"><strong>{{ winner.firstname }} {{ winner.lastname }}</strong><small>${{ Number(winner.totalWon).toLocaleString() }} won</small></div>
              <div class="wins-badge">{{ winner.wins }} {{ Number(winner.wins)===1?'win':'wins' }}</div>
              <el-icon class="winner-arrow"><ArrowRight /></el-icon>
            </button>
            <el-empty v-if="!loadingWinners && !winners.length" description="No raffle winners yet" />
          </div>
        </el-card>
      </div>
    </div>

    <el-dialog v-model="historyDialog" :title="selectedCustomer ? `${selectedCustomer.firstname} ${selectedCustomer.lastname} · Winning History` : 'Winning History'" width="650px">
      <div v-if="selectedCustomer" class="customer-history-profile">
        <el-avatar :size="82" :src="customerImage(selectedCustomer)">{{ customerInitials(selectedCustomer) }}</el-avatar>
        <div class="history-customer-name"><strong>{{ selectedCustomer.firstname }} {{ selectedCustomer.lastname }}</strong><small>Raffle winner history</small></div>
      </div>
      <div v-if="selectedCustomer" class="history-summary">
        <div><small>TOTAL WINS</small><strong>{{ selectedCustomer.wins }}</strong></div>
        <div><small>TOTAL WON</small><strong>${{ Number(selectedCustomer.totalWon).toFixed(2) }}</strong></div>
      </div>
      <div v-loading="historyLoading">
        <div v-for="group in groupedHistory" :key="group.label" class="history-group">
          <h4>{{ group.label }}</h4>
          <div v-for="win in group.items" :key="win.id" class="history-item">
            <div><strong>Machine #{{ win.machineNumber }}</strong><small>{{ formatDateTime(win.wonAt) }} · {{ win.employee || 'Employee' }} · Session #{{ win.sessionId }}</small></div>
            <div class="history-win-actions">
              <strong class="amount">${{ Number(win.amount).toFixed(2) }}</strong>
              <el-image v-if="win.imageUrl"
                        src="/src/assets/viewphoto.png"
                        class="view-photo"
                        :preview-src-list="[win.imageUrl]"
                        fit="cover"
                        preview-teleported />
            </div>
          </div>
        </div>
        <el-empty v-if="!historyLoading && !history.length" description="No raffle wins found" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight, Timer } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import { getRaffleSettings, getRaffleWinnerHistory, getRaffleWinners, saveRaffleSettings } from '@/api/raffle';

const router = useRouter(); const userStore = useUserStore();
const machines = ref([]); const winners = ref([]); const saving = ref(false); const loadingWinners = ref(false); const historyLoading = ref(false); const historyDialog = ref(false); const selectedCustomer = ref(null); const history = ref([]);
const form = reactive({ excludedMachineIds: [], allowRepeatMachine: false, spinDurationSeconds: 8 });
const locationId = computed(() => Number(userStore.locationId));
const machinesInPlay = computed(() => Math.max(0, machines.value.length - form.excludedMachineIds.length));
const noRepeatedWinningNumber = computed({ get: () => !form.allowRepeatMachine, set: v => { form.allowRepeatMachine = !v; } });
const groupedHistory = computed(() => { const g = new Map(); history.value.forEach(w => { const d = Math.floor((Date.now() - new Date(w.wonAt).getTime()) / 86400000); const l = d < 7 ? 'This Week' : d < 14 ? 'Last Week' : d < 21 ? '2 Weeks Ago' : 'Earlier'; if (!g.has(l)) g.set(l, []); g.get(l).push(w); }); return [...g].map(([label, items]) => ({ label, items })); });
const customerInitials = c => `${c?.firstname?.[0] || ''}${c?.lastname?.[0] || ''}`.toUpperCase() || '?';
const customerImage = c => c?.customerImage || '';
const formatDateTime = v => v ? new Date(v).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';

async function load() { const r = await getRaffleSettings(locationId.value); machines.value = r.data?.machines || []; form.excludedMachineIds = (r.data?.excludedMachineIds || []).map(Number); form.allowRepeatMachine = Boolean(r.data?.allowRepeatMachine); form.spinDurationSeconds = Number(r.data?.spinDurationSeconds || 8); await loadWinners(); }
async function loadWinners() { loadingWinners.value = true; try { const r = await getRaffleWinners(locationId.value); winners.value = r.data || []; } finally { loadingWinners.value = false; } }
async function save() { saving.value = true; try { await saveRaffleSettings({ locationid: locationId.value, ...form }); ElMessage.success('Raffle settings saved.'); } finally { saving.value = false; } }
async function openHistory(row) { selectedCustomer.value = row; historyDialog.value = true; historyLoading.value = true; try { const r = await getRaffleWinnerHistory(row.customerId, locationId.value); history.value = r.data || []; } finally { historyLoading.value = false; } }
onMounted(load);
</script>

<style scoped>
  .raffle-settings-page {
    padding: 20px;
    width: 100%;
    box-sizing: border-box
  }





  .settings-layout {
    display: grid;
    grid-template-columns: minmax(0,1fr) minmax(420px,1fr);
    gap: 24px;
    align-items: start
  }

  .settings-left, .settings-right {
    min-width: 0
  }

  .machine-summary {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 10px;
    margin-bottom: 16px
  }

    .machine-summary > div {
      padding: 14px 16px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 12px;
      background: var(--el-bg-color)
    }

    .machine-summary small {
      display: block;
      margin-bottom: 3px;
      color: var(--el-text-color-secondary);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .5px
    }

    .machine-summary strong {
      color: #887baf;
      font-size: 26px
    }

  .section-card, .winners-card {
    margin-bottom: 18px;
    border-radius: 14px
  }

    .section-card :deep(.el-card__header) > div {
      display: flex;
      flex-direction: column;
      gap: 3px
    }

    .section-card :deep(.el-card__header) small, .helper-text {
      color: var(--el-text-color-secondary);
      font-size: 12px
    }

  .helper-text {
    margin-top: -8px
  }

  .section-label {
    margin: 6px 0 10px;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.2px
  }

  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px
  }

    .switch-row strong {
      font-size: 15px
    }

    .switch-row p, .animation-heading p {
      margin: 5px 0 0;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      line-height: 1.55
    }

  .animation-heading {
    display: flex;
    align-items: flex-start;
    gap: 10px
  }

    .animation-heading .el-icon {
      margin-top: 2px;
      color: #887baf;
      font-size: 20px
    }

  .duration-options {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 10px;
    margin-top: 16px
  }

    .duration-options button {
      height: 54px;
      border: 1px solid var(--el-border-color);
      border-radius: 12px;
      background: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
      font: inherit;
      font-weight: 700;
      cursor: pointer
    }

      .duration-options button.active {
        border-color: #0b0b2b;
        background: #0b0b2b;
        color: #fff
      }

  .save-row {
    display: flex;
    justify-content: flex-end
  }

  .winner-head {
    margin-bottom: 12px
  }

    .winner-head h2 {
      margin: 0;
      font-size: 20px
    }

  .winners-card :deep(.el-card__body) {
    padding: 0
  }

  .winner-list-caption {
    padding: 13px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    color: var(--el-text-color-secondary);
    font-size: 12px
  }

  .winner-row {
    width: 100%;
    min-height: 76px;
    padding: 12px 16px;
    border: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: transparent;
    display: flex;
    align-items: center;
    gap: 13px;
    text-align: left;
    cursor: pointer
  }

    .winner-row:hover {
      background: var(--el-fill-color-light)
    }

  .winner-main {
    min-width: 0;
    flex: 1
  }

    .winner-main strong, .winner-main small {
      display: block
    }

    .winner-main small {
      margin-top: 3px;
      color: var(--el-text-color-secondary)
    }

  .wins-badge {
    min-width: 62px;
    padding: 8px 10px;
    border-radius: 10px;
    background: #f8f1df;
    color: #8a6210;
    text-align: center;
    white-space: nowrap
  }

  .winner-arrow {
    color: var(--el-text-color-secondary);
    font-size: 18px
  }

  .customer-history-profile {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px
  }

  .history-customer-name strong, .history-customer-name small {
    display: block
  }

  .history-customer-name strong {
    font-size: 19px
  }

  .history-customer-name small {
    margin-top: 3px;
    color: var(--el-text-color-secondary)
  }

  .history-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 18px
  }

    .history-summary > div {
      padding: 14px;
      border-radius: 10px;
      background: var(--el-fill-color-light)
    }

    .history-summary small {
      display: block;
      color: var(--el-text-color-secondary);
      font-size: 10px;
      font-weight: 700
    }

    .history-summary strong, .history-item .amount {
      color: #887baf
    }

    .history-summary strong {
      font-size: 22px
    }

  .history-group h4 {
    margin: 18px 0 8px
  }

  .history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter)
  }

    .history-item small {
      display: block;
      margin-top: 3px;
      color: var(--el-text-color-secondary)
    }

    .history-item .amount {
      font-size: 18px
    }

  .history-win-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0
  }

  .view-photo {
    width: 28px;
    height: 28px;
    cursor: pointer
  }

  @media(max-width:980px) {
    .settings-layout {
      grid-template-columns: 1fr
    }
  }

  @media(max-width:600px) {
    .raffle-settings-page {
      padding: 12px
    }

    .machine-summary {
      gap: 6px
    }

      .machine-summary > div {
        padding: 12px 9px
      }

      .machine-summary strong {
        font-size: 22px
      }

    .switch-row {
      align-items: flex-start
    }

    .duration-options {
      gap: 6px
    }

    .winner-row {
      padding: 11px 10px
    }
  }
</style>
