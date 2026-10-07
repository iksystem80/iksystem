<template>
  <div class="report-page app-container">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <div>
          <h2 class="page-title">Ticket Out Report</h2>
          <div class="page-subtitle" v-if="report?.session">
            Session # {{ report.session.id }} · {{ report.session.employeeName }}
          </div>
        </div>
      </div>
    </div>

    <el-skeleton v-if="loading" :rows="8" animated />

    <el-alert v-if="error"
              type="error"
              :title="error"
              show-icon
              :closable="false" />

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
              <strong>{{ formatDateTime(report.session.clockIn) }}</strong>
            </div>

            <div>
              <span>Clock Out</span>
              <strong>
                {{ report.session.clockOut ? formatDateTime(report.session.clockOut) : 'In Progress' }}
              </strong>
            </div>

            <div>
              <span>Duration</span>
              <strong>{{ formatDuration(report.session) }}</strong>
            </div>
          </div>
        </div>
      </el-card>

      <div class="metric-grid mobile-two-column-grid report-summary-two-column">
        <el-card shadow="never" class="metric-card metric-matches">
          <div class="metric-layout">
            <div class="metric-icon">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="metric-copy">
              <span>Total Ticket Out</span>
              <strong>{{ money(report.summary.totalAmount) }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card metric-approved">
          <div class="metric-layout">
            <div class="metric-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="metric-copy">
              <span>Ticket Entries</span>
              <strong>{{ number(report.summary.ticketCount) }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card metric-pending">
          <div class="metric-layout">
            <div class="metric-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="metric-copy">
              <span>Machines</span>
              <strong>{{ number(report.summary.machineCount) }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-card">
          <div class="metric-layout">
            <div class="metric-icon">
              <el-icon><Trophy /></el-icon>
            </div>
            <div class="metric-copy">
              <span>Highest Ticket Out</span>
              <strong>{{ money(report.summary.highestAmount) }}</strong>
            </div>
          </div>
        </el-card>
      </div>

      <el-empty v-if="!filteredMachines.length"
                description="No Ticket Out entries were recorded during this session" />

      <el-card v-else shadow="never" class="panel entries-panel">
        <template #header>
          <div class="panel-header entries-header">
            <div>
              <strong>Machine Ticket Out</strong>
              <span>
                {{ number(filteredTicketCount) }} entries across
                {{ filteredMachines.length }} machines
              </span>
            </div>
          </div>
        </template>

        <div class="entry-breakdown">
          <div class="breakdown-title">BREAKDOWN BY MACHINE TYPE · TAP TO FILTER</div>

          <div class="breakdown-chips">
            <button v-for="(item, index) in report.breakdown"
                    :key="item.game"
                    type="button"
                    class="breakdown-chip"
                    :class="{ active: selectedGame === item.game }"
                    :style="breakdownStyle(index)"
                    @click="toggleGame(item.game)">
              <span style="font-size:11px;">{{ item.game }}</span>
              <div style="margin-top:3px;">
                <strong>{{ money(item.totalAmount) }}</strong>
              </div>
            </button>
          </div>
        </div>


        <div class="compact-entry-list" style="border-top:0;">
          <div v-for="machine in filteredMachines"
               :key="machine.machineId"
               class="compact-entry-row"
               style="justify-content:flex-start;">
            <span class="compact-entry-bar"></span>
            <div style="width:60px; min-width:60px; flex:0 0 60px;">
              <strong>
                {{ machine.machineNumber ?? machine.machineId }}
              </strong>
            </div>
            <div class="compact-entry-person" style="flex:0 1 auto; min-width:0;">
              <div class="cash-header-actions" style="gap:10px;margin-bottom:5px;">
                <!--<strong>
                  Machine # {{ machine.machineNumber ?? machine.machineId }}
                </strong>-->
                <el-tag size="small"
                        effect="plain"
                        :style="gameTagStyle(machine.game)">
                  {{ machine.game || 'Unknown Game' }}
                </el-tag>
              </div>
              <div class="compact-entry-list"
                   style="display:flex; flex-direction:row; flex-wrap:wrap; align-items:center; gap:18px; margin-left:5px; border-top:0;">
                <div v-for="entry in machine.entries"
                     :key="entry.id"
                     class="compact-entry-row"
                     style="width:auto; min-height:0; padding:0; border:0; justify-content:flex-start;">
                  <div class="compact-entry-person">
                    <div class="compact-entry-actions"
                         style="margin-left:0; width:auto; display:inline-flex; align-items:center; justify-content:flex-start; gap:6px;">
                      <strong class="compact-entry-points"
                              style="text-align:left; flex:0 0 auto; min-width:0;">
                        {{ money(entry.amount) }}
                      </strong>

                      <PhotoPreviewIcon :src="entry.imageUrl" style="margin-top:-2px;" />
                    </div>
                    <span>{{ formatTime(entry.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="compact-entry-actions"
                 style="margin-left:auto; gap:10px; align-items:center;">
              <span class="section-description"
                    style="color:var(--el-color-primary); font-weight:600; white-space:nowrap;">
                {{ number(machine.ticketCount) }}
                {{ machine.ticketCount === 1 ? 'ticket' : 'tickets' }}
              </span>

              <span style="color:var(--el-border-color);">|</span>

              <strong class="compact-entry-points"
                      style="min-width:auto; text-align:right; white-space:nowrap;">
                {{ money(machine.totalAmount) }}
              </strong>
            </div>
          </div>
        </div>
      </el-card>

    </template>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import request from '@/utils/request';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const error = ref('');
const report = ref(null);
const selectedGame = ref(null);

const entryPalette = [
        'var(--el-color-primary)',
        'var(--green)',
        'var(--yellow)',
        'var(--red)',
        'var(--pink)',
        'var(--tiffany)',
        'var(--light-blue)',
        'var(--blue)'
];


const filteredMachines = computed(() => {
          const machines = report.value?.machines || [];

          if (!selectedGame.value) {
            return machines;
          }

          return machines.filter(item => item.game === selectedGame.value);
});

const filteredTicketCount = computed(() =>
          filteredMachines.value.reduce(
            (sum, item) => sum + Number(item.ticketCount || 0),
            0
          )
);

function initials(name) {
          return String(name || 'E')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase();
}

function number(value) {
          return Number(value || 0).toLocaleString();
}

function money(value) {
          return Number(value || 0).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
}

function formatDateTime(value) {
          if (!value) return '—';

          return new Date(value).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
}

function formatTime(value) {
          if (!value) return '—';

          return new Date(value).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
          });
}

function formatDuration(item) {
          let hours = Number(item.totalWorkingHours || 0);

          if (!item.clockOut && item.clockIn) {
            hours = Math.max(
              0,
              (Date.now() - new Date(item.clockIn).getTime()) / 3600000
            );
          }

          const minutes = Math.round(hours * 60);

          return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function breakdownStyle(index) {
          const color = entryPalette[index % entryPalette.length];
          return { '--point-color': color };
}

function gameTagStyle(game) {
          const breakdown = report.value?.breakdown || [];
          const index = breakdown.findIndex(item => item.game === game);
          const color = entryPalette[(index < 0 ? 0 : index) % entryPalette.length];

          return {
            '--el-tag-text-color': color,
            '--el-tag-border-color': color,
            '--el-tag-bg-color': `color-mix(in srgb, ${color} 10%, transparent)`
          };
}

function pointColor(amount) {
          const value = Math.round(Number(amount || 0));
          return entryPalette[Math.abs(value) % entryPalette.length];
}

function toggleGame(game) {
          selectedGame.value = selectedGame.value === game ? null : game;
}


async function loadReport() {
          const sessionId = Number(route.params.sessionId);
          const locationId = Number(userStore.locationId);

          if (!sessionId || !locationId) return;

          try {
            loading.value = true;
            error.value = '';

            const response = await request({
              url: `/employeesession/reports/session/${sessionId}/ticket-out`,
              method: 'get',
              params: { locationid: locationId }
            });

            report.value = response?.data || null;

            if (!report.value) {
              throw new Error('Ticket Out report data was not returned.');
            }
          } catch (errorValue) {
            console.error(errorValue);

            error.value =
              errorValue?.response?.data?.message ||
              errorValue?.message ||
              'Unable to load Ticket Out report.';

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

<style scoped>

@media (max-width: 767px) {
  .report-summary-two-column {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
  }

  .report-summary-two-column .metric-card {
    width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
  }

  .report-summary-two-column .metric-layout,
  .report-summary-two-column .metric-copy {
    min-width: 0;
  }
}

</style>
