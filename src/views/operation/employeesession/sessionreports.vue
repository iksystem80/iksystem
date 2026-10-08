<template>
  <div class="app-container">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <div>
          <h2 class="page-title">Session # {{ session?.id || route.params.sessionId }}</h2>
          <div class="page-subtitle" v-if="session">
            {{ session.employeeName }}
          </div>
        </div>
      </div>
    </div>

    <el-skeleton v-if="loading"
                 :rows="7"
                 animated />

    <template v-else-if="session">
      <!-- EMPLOYEE / SESSION BANNER -->
      <el-card shadow="never"
               class="employee-banner employee-session-banner">
        <div class="employee-header">
          <div class="employee-profile">
            <el-avatar :size="54"
                       :src="session.employeeAvatar">
              {{ initials(session.employeeName) }}
            </el-avatar>

            <div class="employee-profile-text">
              <h2>
                {{ session.employeeName || 'Employee' }}
              </h2>

              <div class="employee-period">
                Session # {{ session.id }}
              </div>
            </div>
          </div>

          <div class="session-grid">
            <div>
              <span>Clock In</span>
              <strong>{{ formatDateTime(session.clockIn) }}</strong>
            </div>

            <div>
              <span>Clock Out</span>
              <strong>
                {{ session.clockOut ? formatDateTime(session.clockOut) : 'In Progress' }}
              </strong>
            </div>

            <div>
              <span>Duration</span>
              <strong>{{ formatDuration(session) }}</strong>
            </div>
          </div>
        </div>
      </el-card>

      <!-- REPORTS -->
      <div class="section-heading">
        <div>
          <h3>Session Reports</h3>
          <span class="section-description">
            Select a report to view session activity.
          </span>
        </div>
      </div>

      <div class="report-grid">
        <button class="report-option active"
                type="button"
                @click="openPointsReport">
          <div class="report-icon points">
            <el-icon>
              <Coin />
            </el-icon>
          </div>

          <div class="report-copy">
            <strong>Points Report</strong>

            <span>
              Review points assigned to customers during this session.
            </span>

            <div class="mini-stats">
              <span>
                {{ session.pointEntries }} entries
              </span>

              <span>
                {{ Number(session.totalPoints || 0).toLocaleString() }}
                points
              </span>
            </div>
          </div>

          <el-icon class="arrow">
            <ArrowRight />
          </el-icon>
        </button>

        <button class="report-option active"
                type="button"
                @click="openShiftReport">
          <div class="report-icon shift">
            <el-icon>
              <Wallet />
            </el-icon>
          </div>

          <div class="report-copy">
            <strong>Shift Report</strong>

            <span>
              Opening cash, points, expenses, additional cash,
              withdrawals, closing and handover.
            </span>

            <div class="mini-stats">
              <span>
                {{
                  session.clockOut
                    ? 'Closed shift'
                    : 'Shift in progress'
                }}
              </span>

              <span>
                {{ session.pointEntries }} point entries
              </span>
            </div>
          </div>

          <el-icon class="arrow">
            <ArrowRight />
          </el-icon>
        </button>

        <button class="report-option active"
                type="button"
                @click="openTicketOutReport">
          <div class="report-icon ticket-out">
            <el-icon>
              <Tickets />
            </el-icon>
          </div>

          <div class="report-copy">
            <strong>Ticket Out Report</strong>

            <span>
              Review Ticket Out amounts, machines, customers and photo entries from this session.
            </span>

            <div class="mini-stats">
              <span>{{ Number(session.ticketOutEntries || 0).toLocaleString() }} tickets</span>
              <span>{{ money(session.ticketOutTotal) }}</span>
            </div>
          </div>

          <el-icon class="arrow">
            <ArrowRight />
          </el-icon>
        </button>

        <button class="report-option active"
                type="button"
                @click="openRaffleReport">
          <div class="report-icon shift">
            <el-icon>
              <Trophy />
            </el-icon>
          </div>

          <div class="report-copy">
            <strong>Raffle Report</strong>

            <span>
              Review raffle winners, machines, payouts and winner photos from this session.
            </span>

            <div class="mini-stats">
              <span>{{ Number(session.raffleEntries || 0).toLocaleString() }} winners</span>
              <span>{{ money(session.raffleTotal) }}</span>
            </div>
          </div>

          <el-icon class="arrow">
            <ArrowRight />
          </el-icon>
        </button>

        <button class="report-option active"
                type="button"
                @click="openBonusReport">
          <div class="report-icon">
            <el-icon>
              <Present />
            </el-icon>
          </div>

          <div class="report-copy">
            <strong>Bonus Report</strong>

            <span>
              Review bonus payouts, machines, customers and photo entries from this session.
            </span>

            <div class="mini-stats">
              <span>{{ Number(session.bonusEntries || 0).toLocaleString() }} bonuses</span>
              <span>{{ money(session.bonusTotal) }}</span>
            </div>
          </div>

          <el-icon class="arrow">
            <ArrowRight />
          </el-icon>
        </button>

        <button class="report-option active"
                type="button"
                @click="openLuckyBirdReport">
          <div class="report-icon">
            <el-icon>
              <Trophy />
            </el-icon>
          </div>

          <div class="report-copy">
            <strong>Lucky Bird Report</strong>

            <span>
              Review Lucky Bird payouts, machines, customers and photo entries from this session.
            </span>

            <div class="mini-stats">
              <span>{{ Number(session.luckyBirdEntries || 0).toLocaleString() }} Lucky Birds</span>
              <span>{{ money(session.luckyBirdTotal) }}</span>
            </div>
          </div>

          <el-icon class="arrow">
            <ArrowRight />
          </el-icon>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

import { useUserStore } from '@/store/modules/user';
import { getEmployeeSessionReport } from '@/api/employeesession';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const session = ref(null);

function initials(name) {
    return String(name || 'E')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
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

function money(value) {
    return Number(value || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
}

function openPointsReport() {
    router.push({
      name: 'EmployeeSessionPointsReport',
      params: {
        employeeId: route.params.employeeId,
        sessionId: route.params.sessionId
      }
    });
}

function openShiftReport() {
    router.push({
      name: 'EmployeeSessionShiftReport',
      params: {
        employeeId: route.params.employeeId,
        sessionId: route.params.sessionId
      }
    });
}

function openTicketOutReport() {
    router.push({
      name: 'EmployeeSessionTicketOutReport',
      params: {
        employeeId: route.params.employeeId,
        sessionId: route.params.sessionId
      }
    });
}

function openRaffleReport() {
    router.push({
      name: 'EmployeeSessionRaffleReport',
      params: {
        employeeId: route.params.employeeId,
        sessionId: route.params.sessionId
      }
    });
}

function openBonusReport() {
    router.push({
      name: 'EmployeeSessionBonusReport',
      params: {
        employeeId: route.params.employeeId,
        sessionId: route.params.sessionId
      }
    });
}

function openLuckyBirdReport() {
    router.push({
      name: 'EmployeeSessionLuckyBirdReport',
      params: {
        employeeId: route.params.employeeId,
        sessionId: route.params.sessionId
      }
    });
}

async function loadSession() {
    try {
      loading.value = true;

      const response = await getEmployeeSessionReport(
        Number(route.params.sessionId),
        userStore.locationId
      );

      session.value = response?.data || null;
    } catch (error) {
      console.error(error);

      ElMessage.error(
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load session reports.'
      );
    } finally {
      loading.value = false;
    }
}

onMounted(loadSession);
</script>
