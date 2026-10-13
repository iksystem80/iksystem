<template>
  <div class="app-container nfc-machine-page">
    <div class="nfc-shell">
      <div class="machine-heading">
        <div class="machine-icon">
          <el-icon><Connection /></el-icon>
        </div>

        <div>
          <span class="eyebrow">NFC MACHINE</span>
          <h1>Machine #{{ machineNumber }}</h1>
          <p>Location {{ nfcLocationId }} · Select what you want to record for this machine.</p>
        </div>
      </div>

      <el-alert
        v-if="!validNfcLink"
        title="Invalid machine NFC link."
        type="error"
        :closable="false"
        show-icon
      />

      <el-alert
        v-else-if="!currentLocationId"
        title="Checking your current location..."
        type="info"
        :closable="false"
        show-icon
      />

      <el-alert
        v-else-if="!locationMatches"
        title="Wrong Location"
        :description="`This NFC tag belongs to Location ${nfcLocationId}. Your current location is ${currentLocationId}.`"
        type="error"
        :closable="false"
        show-icon
      />

      <div v-else class="action-grid">
        <button
          class="action-card"
          :class="{ disabled: !canTicketOut }"
          :disabled="!canTicketOut"
          type="button"
          @click="openAction('ticket')"
        >
          <span class="action-icon"><el-icon><Tickets /></el-icon></span>
          <span class="action-copy">
            <strong>Ticket Out</strong>
            <small>Record a ticket payout for this machine.</small>
          </span>
          <el-icon class="action-arrow"><ArrowRight /></el-icon>
        </button>

        <button
          class="action-card"
          :class="{ disabled: !canBonus }"
          :disabled="!canBonus"
          type="button"
          @click="openAction('bonus')"
        >
          <span class="action-icon"><el-icon><Present /></el-icon></span>
          <span class="action-copy">
            <strong>Bonus</strong>
            <small>Give an available bonus for this machine.</small>
          </span>
          <el-icon class="action-arrow"><ArrowRight /></el-icon>
        </button>

        <button
          class="action-card"
          :class="{ disabled: !canLuckyBird }"
          :disabled="!canLuckyBird"
          type="button"
          @click="openAction('luckybird')"
        >
          <span class="action-icon"><el-icon><Star /></el-icon></span>
          <span class="action-copy">
            <strong>Lucky Bird</strong>
            <small>Record a Lucky Bird payout for this machine.</small>
          </span>
          <el-icon class="action-arrow"><ArrowRight /></el-icon>
        </button>
      </div>

      <div v-if="validNfcLink && locationMatches && !hasAnyAction" class="no-access">
        You do not have access to Ticket Out, Bonus, or Lucky Bird.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowRight, Connection, Present, Star, Tickets } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const nfcLocationId = computed(() =>
  String(route.params.locationId || '').trim()
);

const machineNumber = computed(() =>
  String(route.params.machineNumber || '').trim()
);

const currentLocationId = computed(() =>
  String(userStore.locationId || '').trim()
);

const validNfcLink = computed(() =>
  /^\d+$/.test(nfcLocationId.value) &&
  /^\d+$/.test(machineNumber.value)
);

const locationMatches = computed(() =>
  Boolean(currentLocationId.value) &&
  currentLocationId.value === nfcLocationId.value
);

const permissions = computed(() =>
  new Set(
    (Array.isArray(userStore.permissions) ? userStore.permissions : [])
      .map(code => String(code || '').trim().toLowerCase())
  )
);

const isSystemAdmin = computed(() =>
  String(userStore.roleName || '').trim().toLowerCase() === 'system admin'
);

function hasPermission(code) {
  return isSystemAdmin.value || permissions.value.has(code);
}

const canTicketOut = computed(() => hasPermission('ticketout'));
const canBonus = computed(() => hasPermission('bonus'));
const canLuckyBird = computed(() => hasPermission('luckybird'));
const hasAnyAction = computed(() =>
  canTicketOut.value || canBonus.value || canLuckyBird.value
);

function openAction(action) {
  if (!validNfcLink.value || !locationMatches.value) return;

  const routes = {
    ticket: 'TicketOut',
    bonus: 'BonusGive',
    luckybird: 'LuckyBird'
  };

  const name = routes[action];
  if (!name) return;

  router.push({
    name,
    query: {
      locationId: nfcLocationId.value,
      machine: machineNumber.value,
      source: 'nfc'
    }
  });
}
</script>

<style scoped>
.nfc-machine-page {
  min-height: calc(100vh - 50px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 36px;
}

.nfc-shell {
  width: min(760px, 100%);
}

.machine-heading {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 28px;
}

.machine-icon {
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: rgba(136, 123, 175, .12);
  color: var(--el-color-primary);
  font-size: 26px;
}

.eyebrow {
  display: block;
  margin-bottom: 5px;
  color: var(--el-color-primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.machine-heading h1 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 28px;
  line-height: 1.15;
}

.machine-heading p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.action-grid {
  display: grid;
  gap: 14px;
}

.action-card {
  width: 100%;
  display: grid;
  grid-template-columns: 50px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  text-align: left;
  cursor: pointer;
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
}

.action-card:hover:not(.disabled) {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, var(--el-border-color));
  box-shadow: 0 12px 28px rgba(0, 0, 0, .07);
}

.action-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: rgba(136, 123, 175, .10);
  color: var(--el-color-primary);
  font-size: 22px;
}

.action-copy {
  min-width: 0;
}

.action-copy strong {
  display: block;
  margin-bottom: 4px;
  font-size: 15px;
}

.action-copy small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.action-arrow {
  color: var(--el-text-color-secondary);
  font-size: 18px;
}

.action-card.disabled {
  opacity: .45;
  cursor: not-allowed;
}

.no-access {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (max-width: 600px) {
  .nfc-machine-page {
    padding-top: 20px;
  }

  .machine-heading {
    align-items: flex-start;
    gap: 14px;
  }

  .machine-heading h1 {
    font-size: 24px;
  }

  .action-card {
    grid-template-columns: 46px 1fr auto;
    gap: 12px;
    padding: 16px;
  }
}
</style>
