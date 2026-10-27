<template>
  <div>
    <!-- FILTERS -->
    <el-card shadow="never" class="toolbar-card">
      <el-row :gutter="15">
        <el-col :xs="24" :sm="8" :md="6">
          <div class="filter-label">Date</div>
          <el-date-picker v-model="selectedDate" type="date" value-format="YYYY-MM-DD" format="MMM DD, YYYY" placeholder="Select date" style="width: 100%" />
        </el-col>
        <el-col :xs="24" :sm="16" :md="18">
          <div class="filter-label">Search</div>
          <el-input v-model="search"
                    clearable
                    placeholder="Customer or machine...">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </el-card>

    <!-- Employee selector / selected employee banner -->
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
                Point activity for {{ displayDate }}
              </div>
            </div>

            <span v-else class="pointwatch-employee-name">
              {{ item.name }}
            </span>
          </button>
        </TransitionGroup>

        <el-button v-if="selectedEmployeeDetails"
                   class="pointwatch-view-all"
                   link
                   @click="clearEmployee">
          view all
        </el-button>

        <div v-if="!loading && !selectedEmployeeDetails && !displayedEmployees.length"
             class="employee-period">
          No employees with point entries for this date.
        </div>
      </div>
    </el-card>

    <!-- SUMMARY -->
    <el-row :gutter="15" class="summary-row">
      <el-col :xs="8" :sm="8" class="summary-col pointwatch-summary-col">
        <el-card shadow="never"
                 class="summary-stat-card summary-teal"
                 :body-style="{ padding: '10px 8px' }">
          <div class="summary-stat-layout" style="gap:8px;align-items:center;">
            <div class="summary-stat-icon"
                 style="width:42px;height:42px;min-width:42px;font-size:22px;">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="summary-stat-content" style="min-width:0;">
              <el-statistic :value="filteredEntries.length"
                            :value-style="{ fontSize: '20px', fontWeight: '700', lineHeight: '1.1' }">
                <template #title>
                  <span style="display:block;font-size:11px;line-height:1.2;white-space:nowrap;">
                    Match Entries
                  </span>
                </template>
              </el-statistic>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="8" :sm="8" class="summary-col pointwatch-summary-col">
        <el-card shadow="never"
                 class="summary-stat-card summary-blue"
                 :body-style="{ padding: '10px 8px' }">
          <div class="summary-stat-layout" style="gap:8px;align-items:center;">
            <div class="summary-stat-icon"
                 style="width:42px;height:42px;min-width:42px;font-size:22px;">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="summary-stat-content" style="min-width:0;">
              <el-statistic :value="totalPoints"
                            :value-style="{ fontSize: '20px', fontWeight: '700', lineHeight: '1.1' }">
                <template #title>
                  <span style="display:block;font-size:11px;line-height:1.2;white-space:nowrap;">
                    Match Points
                  </span>
                </template>
              </el-statistic>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="8" :sm="8" class="summary-col pointwatch-summary-col">
        <el-card shadow="never"
                 class="summary-stat-card summary-green"
                 :body-style="{ padding: '10px 8px' }">
          <div class="summary-stat-layout" style="gap:8px;align-items:center;">
            <div class="summary-stat-icon"
                 style="width:42px;height:42px;min-width:42px;font-size:22px;">
              <el-icon><User /></el-icon>
            </div>
            <div class="summary-stat-content" style="min-width:0;">
              <el-statistic :value="employeeCount"
                            :value-style="{ fontSize: '20px', fontWeight: '700', lineHeight: '1.1' }">
                <template #title>
                  <span style="display:block;font-size:11px;line-height:1.2;white-space:nowrap;">
                    Employees
                  </span>
                </template>
              </el-statistic>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- DATE TITLE -->
    <div class="section-heading">
      <div>
        <strong>
          Point Entries
        </strong>
        <div class="small-text">
          {{ displayDate }}
        </div>

      </div>
      <el-button :loading="loading" @click="loadEntries">
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>

    <!-- LOADING -->
    <el-skeleton v-if="loading"
                 :rows="8"
                 animated />

    <!-- EMPTY -->
    <el-empty v-else-if="filteredEntries.length === 0"
              description="No point entries found." />

    <!-- ENTRIES -->
    <el-row v-else
            :gutter="15">
      <el-col v-for="item in filteredEntries"
              :key="item.id"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="6"
              :xl="6"
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
  </div>
</template>

<script setup>
import {
          ref,
          computed,
          watch
} from 'vue';


import { ElMessage } from 'element-plus';

import {
          getPointWatchingEmployees,
          getPointsByEmployee,
          getPointsByDate
} from '@/api/pointwatching';

const props = defineProps({
          locationId: {
            type: [Number, String],
            required: true
          }
});

const today = () => {
          const date = new Date();

          const year = date.getFullYear();
          const month = String(
            date.getMonth() + 1
          ).padStart(2, '0');

          const day = String(
            date.getDate()
          ).padStart(2, '0');

          return `${year}-${month}-${day}`;
};

const selectedDate = ref(today());
const selectedEmployee = ref(null);
const search = ref('');

const employees = ref([]);
const entries = ref([]);
const employeeActiveSessions = ref({});

const selectedEmployeeDetails = computed(() => selectedEmployee.value == null ? null : employees.value.find(item => String(item.id) === String(selectedEmployee.value)) || null);

const displayedEmployees = computed(() =>
          selectedEmployeeDetails.value
            ? [selectedEmployeeDetails.value].filter(item => employeeEntryCount(item.id) > 0)
            : employees.value.filter(item => employeeEntryCount(item.id) > 0)
);

const getInitial = value => String(value || '?').trim().charAt(0).toUpperCase();

const employeeIsClockedIn = employeeId =>
          (employeeActiveSessions.value[String(employeeId)] || 0) > 0;

const loadEmployeeActiveSessions = async () => {
          if (!props.locationId || !employees.value.length) {
            employeeActiveSessions.value = {};
            return;
          }

          const results = await Promise.allSettled(
            employees.value.map(item =>
              getPointsByEmployee(item.id, props.locationId, 14)
            )
          );

          const activeSessions = {};
          results.forEach((result, index) => {
            const employeeId = employees.value[index]?.id;
            if (employeeId == null) return;

            activeSessions[String(employeeId)] =
              result.status === 'fulfilled'
                ? Number(result.value?.data?.summary?.activeSessions || 0)
                : 0;
          });

          employeeActiveSessions.value = activeSessions;
};

const selectEmployee = item => {
          if (selectedEmployeeDetails.value) return;
          selectedEmployee.value = item.id;
};

const clearEmployee = () => {
        selectedEmployee.value = null;
};

const loading = ref(false);

const loadEmployees = async () => {
          if (!props.locationId) return;

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

            // Load live status without delaying the date report.
            loadEmployeeActiveSessions();

            if (
              selectedEmployee.value != null &&
              !employees.value.some(
                item =>
                  String(item.id) ===
                  String(selectedEmployee.value)
              )
            ) {
              selectedEmployee.value = null;
            }
          } catch (error) {
            ElMessage.error(
              error.response?.data?.message ||
                        'Unable to load employees.'
            );
          }
};

const loadEntries = async () => {
          if (
            !props.locationId ||
                    !selectedDate.value
          ) {
            return;
          }

          try {
            loading.value = true;

            const response =
                        await getPointsByDate(
                          props.locationId,
                          selectedDate.value
                        );

            entries.value =
                        response.data ?? [];
          } catch (error) {
            ElMessage.error(
              error.response?.data?.message ||
                        'Unable to load point entries.'
            );
          } finally {
            loading.value = false;
          }
};

const employeeEntryCounts = computed(() => {
          const counts = new Map();

          for (const item of entries.value) {
            const key = String(item.employeeId ?? '');
            if (!key) continue;

            counts.set(
              key,
              (counts.get(key) || 0) + 1
            );
          }

          return counts;
});

const employeeEntryCount = employeeId =>
          employeeEntryCounts.value.get(
            String(employeeId)
          ) || 0;

const filteredEntries = computed(() => {
          let data = entries.value;

          if (selectedEmployee.value) {
            data = data.filter(
              item =>
                Number(item.employeeId) ===
                            Number(selectedEmployee.value)
            );
          }

          const value =
                    search.value
                      .trim()
                      .toLowerCase();

          if (value) {
            data = data.filter(item => {
              const customer =
                            item.fullName
                              ?.toLowerCase() ?? '';

              const machine =
                            String(
                              item.machineNumber ?? ''
                            ).toLowerCase();

              return (
                customer.includes(value) ||
                            machine.includes(value)
              );
            });
          }

          return data;
});

const totalPoints = computed(() => {
          return filteredEntries.value.reduce(
            (total, item) =>
              total + Number(item.points || 0),
            0
          );
});

const employeeCount = computed(() => {
          const ids = new Set(
            filteredEntries.value
              .map(item => item.employeeId)
              .filter(Boolean)
          );

          return ids.size;
});

const displayDate = computed(() => {
          if (!selectedDate.value) return '';

          return new Date(
            `${selectedDate.value}T12:00:00`
          ).toLocaleDateString(
            'en-US',
            {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }
          );
});

const formatTime = value => {
          if (!value) return '';

          return new Date(value)
            .toLocaleTimeString(
              'en-US',
              {
                hour: 'numeric',
                minute: '2-digit'
              }
            );
};

watch(
          () => props.locationId,
          async value => {
            if (!value) return;

            selectedEmployee.value = null;
            await loadEmployees();
            await loadEntries();
          },
          {
            immediate: true
          }
);

watch(
          selectedDate,
          () => {
            loadEntries();
          }
);
</script>


