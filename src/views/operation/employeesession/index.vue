<template>
  <div class="app-container">
    <!-- HEADER -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Employee Sessions</h2>
        <p>
          View session activity and reports by employee.
        </p>
      </div>
      <div class="header-actions">
        <el-button class="action-button" @click="openFilterDrawer">
          <el-icon><Filter /></el-icon><span>Filter</span>
        </el-button>
      </div>
    </div>

    <!-- INDIVIDUAL SUMMARY CARDS -->
    <el-row :gutter="16" class="summary-row">
      <el-col :xs="12" :sm="12" :md="6" class="summary-column">
        <el-card shadow="never" class="summary-card summary-teal">
          <div class="summary-card-content">
            <div class="summary-icon"><el-icon><UserFilled /></el-icon></div>
            <el-statistic title="Employees" :value="filteredEmployees.length" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" class="summary-column">
        <el-card shadow="never" class="summary-card summary-blue">
          <div class="summary-card-content">
            <div class="summary-icon"><el-icon><Calendar /></el-icon></div>
            <el-statistic title="Total Sessions" :value="totalSessions" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" class="summary-column">
        <el-card shadow="never" class="summary-card summary-green">
          <div class="summary-card-content">
            <div class="summary-icon"><el-icon><Coin /></el-icon></div>
            <el-statistic title="Total Points" :value="totalPoints" group-separator="," />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" class="summary-column">
        <el-card shadow="never" class="summary-card summary-orange">
          <div class="summary-card-content">
            <div class="summary-icon"><el-icon><Money /></el-icon></div>
            <el-statistic title="Expenses" :value="totalExpenses" :precision="2" prefix="$" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- DATE FILTER DRAWER -->
    <el-drawer v-model="filterDrawer" direction="rtl" :size="drawerSize" class="filter-drawer">
      <template #header>
        <div class="drawer-header">
          <div class="drawer-icon"><el-icon><Filter /></el-icon></div>
          <div><div class="drawer-title">Filter Sessions</div><div class="drawer-subtitle">Choose a reporting period and reconciliation status.</div></div>
        </div>
      </template>
      <div class="filter-section">
        <div class="filter-label">Period</div>
        <el-select v-model="draftPeriod" style="width: 100%" @change="onPeriodChange">
          <el-option label="All sessions" value="all" />
          <el-option label="Today" value="today" />
          <el-option label="Last 7 days" value="7" />
          <el-option label="Last 30 days" value="30" />
          <el-option label="Custom date range" value="custom" />
        </el-select>
      </div>
      <div class="filter-section">
        <div class="filter-label">Reconciliation</div>
        <el-select v-model="draftReconciliation" style="width: 100%" @change="onReconciliationChange">
          <el-option label="Unreconciled" value="unreconciled" />
          <el-option label="Reconciled" value="reconciled" />
          <el-option label="All Sessions" value="all" />
        </el-select>
      </div>
      <div v-if="draftPeriod === 'custom'" class="filter-section">
        <div class="filter-label">Date Range</div>
        <el-date-picker v-model="draftDateRange" type="daterange" unlink-panels
                        start-placeholder="Start date" end-placeholder="End date"
                        value-format="YYYY-MM-DD" style="width: 100%" @change="onDateRangeChange" />
      </div>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="clearFilters">Clear</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- DESKTOP -->
    <el-card shadow="never"
             class="table-card app-table-card employee-session-desktop-list"
             v-loading="loading"
             element-loading-text="Loading employee sessions...">
      <el-empty v-if="!loading && filteredEmployees.length === 0"
                description="No employees found"
                class="small-empty app-table-empty" />

      <el-table v-else
                :data="filteredEmployees"
                row-key="userId"
                class="clickable-table app-data-table is-compact"
                @row-click="openEmployee">
        <el-table-column label="Employee"
                         min-width="160">
          <template #default="{ row }">
            <div class="table-cell">
              <el-avatar :size="42"
                         :src="row.avatar">
                {{ initials(row.name) }}
              </el-avatar>

              <div class="table-meta">
                <strong>{{ row.name }}</strong>
                <span>
                  {{ row.jobTitle || row.roleName || 'Employee' }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Sessions"
                         width="90"
                         align="center">
          <template #default="{ row }">
            <el-tag type="primary"
                    effect="light"
                    round>
              {{ Number(row.sessionCount || 0) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Points" min-width="70" align="center">
          <template #default="{ row }">
            {{ Number(row.totalPoints || 0).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="Expenses" min-width="80" align="center">
          <template #default="{ row }">
            {{ formatMoney(row.cashExpenses) }}
          </template>
        </el-table-column>

        <el-table-column label="Ticket Out" min-width="90" align="center">
          <template #default="{ row }">
            {{ formatMoney(row.ticketOutExpenses) }}
          </template>
        </el-table-column>

        <el-table-column label="Last Session" align="center"
                         min-width="90">
          <template #default="{ row }">
            {{ formatDateTime(row.lastSession) }}
          </template>
        </el-table-column>

        <el-table-column label="Hours"
                         min-width="80"
                         align="center">
          <template #default="{ row }">
            {{ formatHours(row.totalWorkingHours) }}
          </template>
        </el-table-column>

        <el-table-column label="Status"
                         width="100"
                         align="center">
          <template #default="{ row }">
            <el-tag v-if="row.activeSessionCount > 0"
                    type="success"
                    effect="light"
                    round>
              Online
            </el-tag>

            <el-tag v-else
                    type="info"
                    effect="plain"
                    round>
              Offline
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column width="64"
                         align="center">
          <template #default>
            <el-button circle
                       text
                       aria-label="View employee sessions">
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- MOBILE -->
    <div v-loading="loading"
         element-loading-text="Loading employee sessions..."
         class="mobile-list employee-session-mobile-list">
      <el-empty v-if="!loading && filteredEmployees.length === 0"
                description="No employees found"
                class="small-empty" />

      <el-card v-for="employee in filteredEmployees"
               :key="employee.userId"
               shadow="never"
               class="employee-card"
               @click="openEmployee(employee)">
        <div class="employee-card-top">
          <el-avatar :size="44"
                     :src="employee.avatar">
            {{ initials(employee.name) }}
          </el-avatar>

          <div class="employee-card-name">
            <strong>{{ employee.name }}</strong>

            <span>
              {{ employee.jobTitle || employee.roleName || 'Employee' }}
            </span>
          </div>

          <el-tag v-if="employee.activeSessionCount > 0"
                  type="success"
                  effect="light"
                  size="small"
                  round
                  class="employee-status-tag">
            Online
          </el-tag>

          <el-tag v-else
                  type="info"
                  effect="plain"
                  size="small"
                  round
                  class="employee-status-tag">
            Offline
          </el-tag>
        </div>

        <div class="mobile-card-details">
          <div class="mobile-primary-stats">
            <div class="mobile-stat mobile-points">
              <span>Points</span>
              <strong>{{ Number(employee.totalPoints || 0).toLocaleString() }}</strong>
            </div>
            <div class="mobile-stat mobile-expenses">
              <span>Cash Expenses</span>
              <strong>{{ formatMoney(employee.cashExpenses) }}</strong>
            </div>
          </div>
          <div class="mobile-session-count">
            <span>Ticket Out</span>
            <strong>{{ formatMoney(employee.ticketOutExpenses) }}</strong>
          </div>
          <div class="mobile-session-count">
            <span>Sessions</span>
            <strong>{{ Number(employee.sessionCount || 0) }}</strong>
          </div>
        </div>
      </el-card>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';


import { useUserStore } from '@/store/modules/user';
import { useRefreshStore } from '@/store/modules/refresh';
import { getEmployeeSessionSummary } from '@/api/employeesession';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const refreshStore = useRefreshStore();

const loading = ref(false);
const filterDrawer = ref(false);
const draftPeriod = ref('all');
const draftReconciliation = ref('unreconciled');
const draftDateRange = ref([]);
const drawerSize = 'min(360px, 100%)';
const employees = ref([]);
const period = ref('all');
const reconciliation = ref('unreconciled');
const dateRange = ref([]);
const chicagoDate = (date) => new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(date);
const selectedDates = computed(() => {
      if (period.value === 'all') return {};
      if (period.value === 'custom') {
        if (!dateRange.value || dateRange.value.length !== 2) return null;
        return { startDate: dateRange.value[0], endDate: dateRange.value[1] };
      }
      const today = chicagoDate(new Date());
      if (period.value === 'today') return { startDate: today, endDate: today };
      const start = new Date(`${today}T12:00:00Z`);
      start.setUTCDate(start.getUTCDate() - (Number(period.value) - 1));
      return { startDate: start.toISOString().slice(0, 10), endDate: today };
});
function openFilterDrawer() {
      draftPeriod.value = period.value;
      draftReconciliation.value = reconciliation.value;
      draftDateRange.value = Array.isArray(dateRange.value) ? [...dateRange.value] : [];
      filterDrawer.value = true;
}
function onPeriodChange(value) {
      // A custom period takes effect once both dates have been selected.
      if (value === 'custom') {
        if (Array.isArray(draftDateRange.value) && draftDateRange.value.length === 2) {
          onDateRangeChange(draftDateRange.value);
        }
        return;
      }
      period.value = value;
      dateRange.value = [];
      draftDateRange.value = [];
      loadEmployees();
}
function onReconciliationChange(value) {
      reconciliation.value = value;
      loadEmployees();
}
function onDateRangeChange(value) {
      if (draftPeriod.value !== 'custom') return;
      if (!Array.isArray(value) || value.length !== 2) return;
      period.value = 'custom';
      dateRange.value = [...value];
      loadEmployees();
}
function clearFilters() {
      draftPeriod.value = 'all';
      draftReconciliation.value = 'unreconciled';
      draftDateRange.value = [];
      period.value = 'all';
      reconciliation.value = 'unreconciled';
      dateRange.value = [];
      loadEmployees();
}
const formatMoney = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const filteredEmployees = computed(() => employees.value);

const totalPoints = computed(() => filteredEmployees.value.reduce((sum, item) => sum + Number(item.totalPoints || 0), 0));
const totalExpenses = computed(() => filteredEmployees.value.reduce((sum, item) => sum + Number(item.cashExpenses || 0), 0));

const totalSessions = computed(() => {
      return filteredEmployees.value.reduce(
        (total, item) =>
          total +
                    Number(item.sessionCount || 0),
        0
      );
});

function initials(name) {
      return String(name || 'E')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function formatDateTime(value) {
      if (!value) {
        return '—';
      }

      return new Date(value)
        .toLocaleString(
          [],
          {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          }
        );
}

function formatHours(value) {
      const hours = Number(value || 0);

      if (!Number.isFinite(hours)) {
        return '0h';
      }

      const whole = Math.floor(hours);
      const minutes =
                Math.round(
                  (hours - whole) * 60
                );

      return minutes
        ? `${whole}h ${minutes}m`
        : `${whole}h`;
}

async function openEmployee(employee) {
      // Preserve the current list entry in browser history. The employee page
      // opens as a new entry, so browser/app Back restores these exact filters.
      const filters = {
        period: period.value,
        reconciliation: reconciliation.value,
        ...(selectedDates.value || {})
      };
      await router.replace({
        path: route.path,
        query: { ...route.query, ...filters }
      });
      await router.push({
        name: 'EmployeeSessionList',
        params: {
          employeeId:
                        employee.userId
        },
        query: filters
      });
}

function restoreListFilters() {
      const savedPeriod = String(route.query.period || '');
      const savedReconciliation = String(route.query.reconciliation || '');
      const permittedPeriods = ['all', 'today', '7', '30', 'custom'];
      const permittedReconciliations = ['all', 'reconciled', 'unreconciled'];

      if (permittedPeriods.includes(savedPeriod)) {
        period.value = savedPeriod;
      }
      if (permittedReconciliations.includes(savedReconciliation)) {
        reconciliation.value = savedReconciliation;
      }

      const start = String(route.query.startDate || '');
      const end = String(route.query.endDate || '');
      if (period.value === 'custom') {
        const valid = /^\d{4}-\d{2}-\d{2}$/;
        if (valid.test(start) && valid.test(end) && start <= end) {
          dateRange.value = [start, end];
        } else {
          // Never restore a half-selected custom range.
          period.value = 'all';
          dateRange.value = [];
        }
      }

      draftPeriod.value = period.value;
      draftReconciliation.value = reconciliation.value;
      draftDateRange.value = [...dateRange.value];
}

async function loadEmployees() {
      if (selectedDates.value === null) {
        employees.value = [];
        return;
      }
      try {
        loading.value = true;

        const response =
                    await getEmployeeSessionSummary(
                      userStore.locationId,
                      { ...selectedDates.value, reconciliation: reconciliation.value }
                    );

        employees.value =
                    response?.data || [];
      } catch (error) {
        console.error(error);

        ElMessage.error(
          error?.response?.data?.message ||
                    error?.message ||
                    'Unable to load employee sessions.'
        );
      } finally {
        loading.value = false;
      }
}

watch(
    () => refreshStore.key('employeeSessions'),
    () => loadEmployees()
);

onMounted(() => {
      restoreListFilters();
      loadEmployees();
});
</script>


