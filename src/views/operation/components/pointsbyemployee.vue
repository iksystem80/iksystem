<template>
  <div>
    <!-- ===================================================== -->
    <!-- FILTERS -->
    <!-- ===================================================== -->
    <el-card shadow="never" class="toolbar-card">
      <el-row :gutter="15">
        <el-col :xs="24" :sm="8" :md="5">
          <div class="filter-label">
            Period
          </div>
          <el-select v-model="days" style="width: 100%">
            <el-option label="Last 7 days" :value="7" />
            <el-option label="Last 14 days" :value="14" />
            <el-option label="Last 30 days" :value="30" />
            <el-option label="Last 90 days" :value="90" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- ===================================================== -->
    <!-- EMPLOYEE INITIAL / AVATAR SELECTOR -->
    <!-- ===================================================== -->
    <el-card shadow="never" class="employee-banner pointwatch-employee-banner">
      <div class="pointwatch-banner-shell"
           :class="{ 'is-selected': !!selectedEmployeeDetails }">

        <TransitionGroup name="employee-shift"
                         tag="div"
                         class="pointwatch-employee-stage">

          <button v-for="item in displayedEmployees"
                  :key="item.id"
                  type="button"
                  class="pointwatch-employee-choice"
                  :class="{ 'is-selected': !!selectedEmployeeDetails }"
                  :title="item.name"
                  @click="selectedEmployeeDetails ? clearEmployee() : selectEmployee(item)">

            <el-badge :value="employeeEntryCount(item.id)"
                      :hidden="!!selectedEmployeeDetails"
                      class="pointwatch-employee-badge">
              <el-avatar :size="selectedEmployeeDetails ? 56 : 40"
                         :src="item.avatar">
                {{ getInitial(item.name) }}
              </el-avatar>
              <span v-if="employeeIsClockedIn(item.id)"
                    class="pointwatch-online-dot"
                    title="Clocked in"
                    aria-label="Clocked in"></span>
            </el-badge>

            <div v-if="selectedEmployeeDetails"
                 class="pointwatch-selected-text">
              <h2>{{ item.name }}</h2>
              <div class="employee-period">
                Activity from the last {{ days }} days
              </div>
            </div>

            <span v-else class="pointwatch-employee-name">
              {{ item.name }}
            </span>
          </button>
        </TransitionGroup>

        <div v-if="selectedEmployeeDetails"
             class="points-employee-banner-actions">


          <el-button class="pointwatch-view-all"
                     link
                     @click="clearEmployee">
            view all
          </el-button>
        </div>

        <div v-if="!selectedEmployeeDetails && !displayedEmployees.length"
             class="employee-period">
          No employees with point entries for this period.
        </div>
      </div>
    </el-card>
    <!-- ===================================================== -->
    <!-- REPORT CONTENT -->
    <!-- ===================================================== -->
    <div v-loading="loading" element-loading-text="Loading employee activity..." class="report-content">
      <el-empty v-if="!selectedEmployee" description="Select an employee above to view point activity." />
      <template v-else>

        <!-- =================================================== -->
        <!-- SUMMARY -->
        <!-- =================================================== -->
        <el-row :gutter="15" class="summary-row">
          <el-col :xs="12" :sm="8" :md="4" class="summary-col">
            <el-card shadow="never" class="summary-stat-card stat-teal">
              <div class="summary-stat-layout">
                <div class="summary-stat-icon"><el-icon><Calendar /></el-icon></div>
                <div class="summary-stat-content">
                  <el-statistic title="Days Worked" :value="report.summary.daysWorked" />
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="8" :md="4" class="summary-col">
            <el-card shadow="never" class="summary-stat-card stat-blue">
              <div class="summary-stat-layout">
                <div class="summary-stat-icon"><el-icon><Tickets /></el-icon></div>
                <div class="summary-stat-content">
                  <el-statistic title="Total Sessions" :value="report.summary.totalSessions" />

                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="8" :md="4" class="summary-col">
            <el-card shadow="never" class="summary-stat-card stat-green">
              <div class="summary-stat-layout">
                <div class="summary-stat-icon"><el-icon><Coin /></el-icon></div>
                <div class="summary-stat-content">
                  <el-statistic title="Match Points" :value="report.summary.pointsGiven" />

                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="8" :md="4" class="summary-col">
            <el-card shadow="never" class="summary-stat-card stat-orange">
              <div class="summary-stat-layout">
                <div class="summary-stat-icon"><el-icon><Document /></el-icon></div>
                <div class="summary-stat-content">
                  <el-statistic title="Match Entries" :value="report.summary.totalEntries" />

                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="8" :md="4" class="summary-col">
            <el-card shadow="never" class="summary-stat-card stat-purple">
              <div class="summary-stat-layout">
                <div class="summary-stat-icon"><el-icon><Timer /></el-icon></div>
                <div class="summary-stat-content">
                  <el-statistic title="Working Hours" :value="Number(report.summary.totalWorkingHours || 0)" :precision="2" />

                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="8" :md="4" class="summary-col">
            <el-card shadow="never" class="summary-stat-card stat-red">
              <div class="summary-stat-layout">
                <div class="summary-stat-icon"><el-icon><VideoPlay /></el-icon></div>
                <div class="summary-stat-content">
                  <el-statistic title="Acive Session" :value="report.summary.activeSessions" />

                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <!-- =================================================== -->
        <!-- SESSIONS -->
        <!-- =================================================== -->
        <el-card shadow="never" class="table-card session-list-card app-table-card">
          <template #header>
            <div class="app-table-card-header">
              <el-icon><Tickets /></el-icon>
              <div class="app-table-card-title">
                <strong>Employee Sessions</strong>
                <div class="small-text">
                  Click a session to view customers and points assigned during that session.
                </div>
              </div>
            </div>
          </template>

          <el-empty v-if="report.sessions.length === 0"
                    description="No employee sessions found." class="small-empty app-table-empty" />

          <!-- ================================================= -->
          <!-- DESKTOP -->
          <!-- ================================================= -->

          <el-table v-else-if="device !== 'mobile'"
                    :data="report.sessions"
                    class="app-data-table is-compact"
                    style="width: 100%"
                    @row-click="openSession">
            <el-table-column label="Date"
                             min-width="140">
              <template #default="{ row }">
                <strong>
                  {{ formatDate(row.clockIn) }}
                </strong>
              </template>
            </el-table-column>

            <el-table-column label="Clock In"
                             min-width="105">
              <template #default="{ row }">
                {{ formatTime(row.clockIn) }}
              </template>
            </el-table-column>

            <el-table-column label="Clock Out"
                             min-width="115">
              <template #default="{ row }">
                <span v-if="row.clockOut">
                  {{ formatTime(row.clockOut) }}
                </span>

                <el-tag v-else
                        type="success"
                        size="small"
                        effect="dark"
                        round>
                  In Progress
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Hours"
                             min-width="90">
              <template #default="{ row }">
                <span v-if="row.status === 'IN_PROGRESS'">
                  {{ getRunningHours(row.clockIn) }}
                </span>

                <span v-else>
                  {{ Number(row.totalWorkingHours || 0).toFixed(2) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="Points"
                             min-width="100">
              <template #default="{ row }">
                <el-tag type="warning"
                        effect="light"
                        round>
                  {{ row.points }} PTS
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Entries"
                             prop="entries"
                             min-width="80" />

            <el-table-column label="Status"
                             min-width="120">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'IN_PROGRESS'"
                        type="success"
                        effect="dark"
                        round>
                  In Progress
                </el-tag>

                <el-tag v-else
                        type="info"
                        round>
                  Closed
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Payment"
                             min-width="100">
              <template #default="{ row }">
                <el-tag v-if="row.isPaid"
                        type="success"
                        round>
                  Paid
                </el-tag>

                <el-tag v-else
                        type="warning"
                        round>
                  Unpaid
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column width="70"
                             align="right">
              <template #default>
                <el-button circletext class="el-button el-button--default is-circle is-text">
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- ================================================= -->
          <!-- MOBILE -->
          <!-- ================================================= -->

          <div v-else
               class="mobile-session-list">
            <el-card v-for="row in report.sessions"
                     :key="row.id"
                     shadow="never"
                     class="mobile-session-card"
                     @click="openSession(row)">
              <div class="session-card-header">
                <div>
                  <div class="session-date">
                    {{ formatDate(row.clockIn) }}
                  </div>

                  <div class="session-time">
                    {{ formatTime(row.clockIn) }}

                    <span class="time-arrow">
                      →
                    </span>

                    <span v-if="row.clockOut">
                      {{ formatTime(row.clockOut) }}
                    </span>

                    <span v-else
                          class="in-progress-text">
                      In Progress
                    </span>
                  </div>
                </div>

                <el-button circle
                           text
                           class="session-view-button">
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>

              <div class="session-tags">
                <el-tag v-if="row.status === 'IN_PROGRESS'"
                        type="success"
                        effect="dark"
                        size="small"
                        round>
                  In Progress
                </el-tag>

                <el-tag v-else
                        type="info"
                        size="small"
                        round>
                  Closed
                </el-tag>

                <el-tag :type="row.isPaid ? 'success' : 'warning'"
                        size="small"
                        round>
                  {{ row.isPaid ? 'Paid' : 'Unpaid' }}
                </el-tag>
              </div>

              <div class="session-card-grid">
                <div class="session-stat">
                  <div class="session-stat-label">
                    Hours
                  </div>

                  <div class="session-stat-value">
                    <span v-if="row.status === 'IN_PROGRESS'">
                      {{ getRunningHours(row.clockIn) }}
                    </span>

                    <span v-else>
                      {{ Number(row.totalWorkingHours || 0).toFixed(2) }}
                    </span>
                  </div>
                </div>

                <div class="session-stat">
                  <div class="session-stat-label">
                    Points
                  </div>

                  <div class="session-stat-value points-value">
                    {{ row.points }} PTS
                  </div>
                </div>

                <div class="session-stat">
                  <div class="session-stat-label">
                    Entries
                  </div>

                  <div class="session-stat-value">
                    {{ row.entries }}
                  </div>
                </div>
              </div>

              <div class="session-card-footer">
                Tap to view customers and point details
              </div>
            </el-card>
          </div>
        </el-card>
      </template>
    </div>

    <!-- ===================================================== -->
    <!-- SESSION DETAIL DRAWER -->
    <!-- ===================================================== -->

    <el-drawer v-model="sessionDrawer"
               :size="device === 'mobile' ? '100%' : 'min(100%, max(50%, 720px))'"
               destroy-on-close>
      <template #header>
        <div v-if="selectedSession">
          <strong>
            Point Entries
          </strong>

          <div class="small-text">
            {{ formatDate(selectedSession.clockIn) }}
            ·
            {{ formatTime(selectedSession.clockIn) }}
            →
            {{
              selectedSession.clockOut
                ? formatTime(selectedSession.clockOut)
                : 'In Progress'
            }}
          </div>
        </div>
      </template>

      <!--<el-descriptions v-if="selectedSession"
                       :column="4"
                       border
                       class="session-summary">
        <el-descriptions-item label="Status">
          <el-tag :type="
            selectedSession.status === 'IN_PROGRESS'
              ? 'success'
              : 'info'
          ">
            {{
              selectedSession.status === 'IN_PROGRESS'
                ? 'In Progress'
                : 'Closed'
            }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="Points">
          {{ selectedSession.points }}
        </el-descriptions-item>

        <el-descriptions-item label="Entries">
          {{ selectedSession.entries }}
        </el-descriptions-item>

        <el-descriptions-item label="Payment">
          <el-tag :type="
            selectedSession.isPaid
              ? 'success'
              : 'warning'
          ">
            {{
              selectedSession.isPaid
                ? 'Paid'
                : 'Unpaid'
            }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>-->

      <el-skeleton v-if="sessionLoading"
                   :rows="8"
                   animated />

      <el-empty v-else-if="sessionEntries.length === 0"
                description="No customers received points during this session." />

      <el-row v-else
              :gutter="15">
        <el-col v-for="item in sessionEntries"
                :key="item.id"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="8"
                :xl="8"
                class="section-column">
          <el-card shadow="hover" class="toolbar-card">
            <!-- CUSTOMER -->
            <div class="section-heading">
              <div>
                <div class="section-name">
                  {{ item.fullName }}
                </div>

                <div class="section-meta">
                  {{ formatTime(item.dateAssign) }}

                  <span v-if="item.machineNumber">
                    · Machine {{ item.machineNumber }}
                  </span>
                </div>
              </div>

              <el-tag type="warning"
                      effect="dark"
                      round>
                +{{ item.points }} PTS
              </el-tag>

            </div>

            <!-- EMPLOYEE -->
            <div class="section-line">
              Given by

              <el-tag type="success"
                      effect="light"
                      size="small"
                      round>
                {{ item.employeeName || 'Unknown' }}
              </el-tag>
            </div>

            <!-- IMAGES -->
            <el-row :gutter="10">
              <el-col :span="12">
                <div class="section-label">
                  Profile Photo
                </div>
                <el-image :src="item.avatar"
                          fit="cover"
                          class="section-image"
                          :preview-src-list="item.avatar ? [item.avatar] : []"
                          preview-teleported>
                  <template #error>
                    <div class="section-empty">
                      No photo
                    </div>
                  </template>
                </el-image>
              </el-col>
              <el-col :span="12">
                <div class="section-label">
                  Point Photo
                </div>

                <el-image :src="item.pointPhoto"
                          fit="cover"
                          class="section-image"
                          :preview-src-list="item.pointPhoto? [item.pointPhoto]: []"
                          preview-teleported>
                  <template #error>
                    <div class="section-empty">
                      No photo
                    </div>
                  </template>
                </el-image>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </el-drawer>
  </div>
</template>

<script setup>
import {
            ref,
            watch,
            computed
} from 'vue';

import {
            ElMessage
} from 'element-plus';

import {
            getPointWatchingEmployees,
            getPointsByEmployee,
            getPointSessionEntries
} from '@/api/pointwatching';

import {
            useAppStore
} from '@/store/modules/app';

// ============================================================
// PROPS
// ============================================================

const props = defineProps({
            locationId: {
              type: [Number, String],
              required: true
            }
});

// ============================================================
// DEVICE
// ============================================================

const appStore = useAppStore();

const device = computed(
            () => appStore.device
);

// ============================================================
// STATE
// ============================================================

const employees = ref([]);
const selectedEmployee = ref(null);
const days = ref(14);
const loading = ref(false);
const employeeEntryCounts = ref({});
const employeeActiveSessions = ref({});

const report = ref({
            employee: null,

            summary: {
              daysWorked: 0,
              totalSessions: 0,
              pointsGiven: 0,
              totalEntries: 0,
              totalWorkingHours: 0,
              activeSessions: 0
            },

            sessions: []
});

const sessionDrawer = ref(false);
const selectedSession = ref(null);
const sessionEntries = ref([]);
const sessionLoading = ref(false);

const selectedEmployeeDetails = computed(() =>
            selectedEmployee.value == null
              ? null
              : employees.value.find(
                  item =>
                    String(item.id) ===
                    String(selectedEmployee.value)
                ) || null
);

const displayedEmployees = computed(() =>
            selectedEmployeeDetails.value
              ? [selectedEmployeeDetails.value].filter(item => employeeEntryCount(item.id) > 0)
              : employees.value.filter(item => employeeEntryCount(item.id) > 0)
);

const selectEmployee = item => {
            if (selectedEmployeeDetails.value) {
              return;
            }

            selectedEmployee.value = item.id;
};

const clearEmployee = () => {
            selectedEmployee.value = null;

            report.value = {
              employee: null,
              summary: {
                daysWorked: 0,
                totalSessions: 0,
                pointsGiven: 0,
                totalEntries: 0,
                totalWorkingHours: 0,
                activeSessions: 0
              },
              sessions: []
            };
};

const employeeEntryCount = employeeId =>
            employeeEntryCounts.value[String(employeeId)] || 0;

const employeeIsClockedIn = employeeId =>
            (employeeActiveSessions.value[String(employeeId)] || 0) > 0;

const loadEmployeeEntryCounts = async () => {
            if (
              !props.locationId ||
              !employees.value.length
            ) {
              employeeEntryCounts.value = {};
              employeeActiveSessions.value = {};
              return;
            }

            const results = await Promise.allSettled(
              employees.value.map(item =>
                getPointsByEmployee(
                  item.id,
                  props.locationId,
                  days.value
                )
              )
            );

            const counts = {};
            const activeSessions = {};

            results.forEach((result, index) => {
              const employeeId =
                employees.value[index]?.id;

              if (employeeId == null) {
                return;
              }

              counts[String(employeeId)] =
                result.status === 'fulfilled'
                  ? Number(
                      result.value?.data?.summary?.totalEntries || 0
                    )
                  : 0;

              activeSessions[String(employeeId)] =
                result.status === 'fulfilled'
                  ? Number(result.value?.data?.summary?.activeSessions || 0)
                  : 0;
            });

            employeeEntryCounts.value = counts;
            employeeActiveSessions.value = activeSessions;
};

// ============================================================
// EMPLOYEES
// ============================================================

const loadEmployees = async () => {
            if (!props.locationId) {
              return;
            }

            try {
              const response =
                          await getPointWatchingEmployees(
                            props.locationId
                          );

              employees.value = (response.data ?? []).filter(item => {
                const rawRole =
                  item.roleName ??
                  item.role ??
                  item.roles ??
                  '';

                const values = Array.isArray(rawRole)
                  ? rawRole
                  : String(rawRole)
                      .split(',')
                      .map(value => value.trim())
                      .filter(Boolean);

                return values.some(
                  value =>
                    String(value)
                      .trim()
                      .toLowerCase() === 'employee'
                );
              });

              if (
                selectedEmployee.value != null &&
                !employees.value.some(
                  item =>
                    String(item.id) ===
                    String(selectedEmployee.value)
                )
              ) {
                clearEmployee();
              }

              await loadEmployeeEntryCounts();
            } catch (error) {
              ElMessage.error(
                error.response?.data?.message ||
                          'Unable to load employees.'
              );
            }
};

// ============================================================
// REPORT
// ============================================================

const loadReport = async () => {
            if (
              !selectedEmployee.value ||
                      !props.locationId
            ) {
              return;
            }

            try {
              loading.value = true;

              const response =
                          await getPointsByEmployee(
                            selectedEmployee.value,
                            props.locationId,
                            days.value
                          );

              report.value =
                          response.data;
            } catch (error) {
              ElMessage.error(
                error.response?.data?.message ||
                          'Unable to load employee report.'
              );
            } finally {
              loading.value = false;
            }
};

// ============================================================
// SESSION DETAILS
// ============================================================

const openSession = async row => {
            selectedSession.value = row;
            sessionDrawer.value = true;
            sessionEntries.value = [];

            try {
              sessionLoading.value = true;

              const response = await getPointSessionEntries(row.id);

              console.log('here')
              console.log(response.data)

              sessionEntries.value = response.data ?? [];
            } catch (error) {
              ElMessage.error(error.response?.data?.message ||'Unable to load session details.');
            } finally {
              sessionLoading.value = false;
            }
};

// ============================================================
// FORMATTERS
// ============================================================

const getInitial = value => {
            if (!value) {
              return '?';
            }

            return value
              .charAt(0)
              .toUpperCase();
};

const formatDate = value => {
            if (!value) {
              return '-';
            }

            return new Date(value)
              .toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }
              );
};

const formatTime = value => {
            if (!value) {
              return '-';
            }

            return new Date(value)
              .toLocaleTimeString(
                'en-US',
                {
                  hour: 'numeric',
                  minute: '2-digit'
                }
              );
};

const getRunningHours = clockIn => {
            if (!clockIn) {
              return '0.00';
            }

            const start =
                      new Date(clockIn).getTime();

            const now =
                      Date.now();

            const hours =
                      (now - start) /
                      1000 /
                      60 /
                      60;

            return Math.max(
              0,
              hours
            ).toFixed(2);
};

// ============================================================
// WATCHERS
// ============================================================

watch(
            () => props.locationId,
            async value => {
              if (!value) {
                return;
              }

              clearEmployee();
              await loadEmployees();
            },
            {
              immediate: true
            }
);

watch(
            selectedEmployee,
            () => {
              if (
                selectedEmployee.value
              ) {
                loadReport();
              }
            }
);

watch(
            days,
            async () => {
              await loadEmployeeEntryCounts();

              if (
                selectedEmployee.value
              ) {
                await loadReport();
              }
            }
);
</script>


