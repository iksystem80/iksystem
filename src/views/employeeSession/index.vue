<template>
    <div class="report-page">

        <!-- HEADER -->
        <div class="page-header">
            <div>
                <h1>Employee Sessions</h1>
                <p>View session activity and reports by employee.</p>
            </div>

            <el-space :size="10" class="header-actions">
                <el-input v-model="search"
                          clearable
                          placeholder="Search employee"
                          class="search-box">
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>

                <el-button :loading="loading"
                           @click="loadEmployees">
                    <el-icon>
                        <Refresh />
                    </el-icon>
                    Refresh
                </el-button>
            </el-space>
        </div>

        <!-- SUMMARY -->
        <el-card shadow="never"
                 class="summary-card">
            <el-row :gutter="16">
                <el-col :xs="12" :sm="8" :md="6">
                    <el-statistic title="Employees"
                                  :value="filteredEmployees.length" />
                </el-col>

                <el-col :xs="12" :sm="8" :md="6">
                    <el-statistic title="Total Sessions"
                                  :value="totalSessions" />
                </el-col>
            </el-row>
        </el-card>

        <!-- DESKTOP -->
        <el-card v-if="device !== 'mobile'"
                 shadow="never"
                 class="table-card"
                 v-loading="loading"
                 element-loading-text="Loading employee sessions...">
            <el-empty v-if="!loading && filteredEmployees.length === 0"
                      description="No employees found"
                      class="small-empty" />

            <el-table v-else
                      :data="filteredEmployees"
                      row-key="userId"
                      class="clickable-table"
                      @row-click="openEmployee">
                <el-table-column label="Employee"
                                 min-width="280">
                    <template #default="{ row }">
                        <div class="employee-cell">
                            <el-avatar :size="42"
                                       :src="row.avatar">
                                {{ initials(row.name) }}
                            </el-avatar>

                            <div class="employee-meta">
                                <strong>{{ row.name }}</strong>
                                <span>
                                    {{ row.jobTitle || row.roleName || 'Employee' }}
                                </span>
                            </div>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="Included / Total"
                                 width="130"
                                 align="center">
                    <template #default="{ row }">
                        <el-tag type="primary"
                                effect="light"
                                round>
                            {{ Number(row.readingIncludedCount || 0) }}/{{ Number(row.sessionCount || 0) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="Last Session"
                                 min-width="190">
                    <template #default="{ row }">
                        {{ formatDateTime(row.lastSession) }}
                    </template>
                </el-table-column>

                <el-table-column label="Hours"
                                 width="120"
                                 align="center">
                    <template #default="{ row }">
                        {{ formatHours(row.totalWorkingHours) }}
                    </template>
                </el-table-column>

                <el-table-column label="Status"
                                 width="130"
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
                                   :icon="ArrowRight"
                                   aria-label="View employee sessions" />
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- MOBILE -->
        <div v-else
             v-loading="loading"
             element-loading-text="Loading employee sessions..."
             class="mobile-list">
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

                <el-divider />

                <el-row :gutter="8">
                    <el-col :span="8">
                        <div class="mobile-stat">
                            <span>Included / Total</span>
                            <strong>{{ Number(employee.readingIncludedCount || 0) }}/{{ Number(employee.sessionCount || 0) }}</strong>
                        </div>
                    </el-col>

                    <el-col :span="8">
                        <div class="mobile-stat">
                            <span>Hours</span>
                            <strong>
                                {{ formatHours(employee.totalWorkingHours) }}
                            </strong>
                        </div>
                    </el-col>

                    <el-col :span="8">
                        <div class="mobile-stat">
                            <span>Last Session</span>
                            <strong>
                                {{ formatDate(employee.lastSession) }}
                            </strong>
                        </div>
                    </el-col>
                </el-row>
            </el-card>
        </div>

    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
          ArrowRight,
          Refresh,
          Search
} from '@element-plus/icons-vue'

import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'
import { getEmployeeSessionSummary } from '@/api/employeeSession'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const loading = ref(false)
const search = ref('')
const employees = ref([])

const device = computed(() => appStore.device)

const filteredEmployees = computed(() => {
          const query = search.value.trim().toLowerCase()

          if (!query) {
            return employees.value
          }

          return employees.value.filter((item) => {
            return [
              item.name,
              item.username,
              item.jobTitle,
              item.roleName
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(query)
              )
          })
})

const totalSessions = computed(() => {
          return filteredEmployees.value.reduce(
            (total, item) =>
              total +
              Number(item.sessionCount || 0),
            0
          )
})

function initials(name) {
          return String(name || 'E')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()
}

function formatDateTime(value) {
          if (!value) {
            return '—'
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
            )
}

function formatDate(value) {
          if (!value) {
            return '—'
          }

          return new Date(value)
            .toLocaleDateString(
              [],
              {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }
            )
}

function formatHours(value) {
          const hours = Number(value || 0)

          if (!Number.isFinite(hours)) {
            return '0h'
          }

          const whole = Math.floor(hours)
          const minutes =
            Math.round(
              (hours - whole) * 60
            )

          return minutes
            ? `${whole}h ${minutes}m`
            : `${whole}h`
}

function openEmployee(employee) {
          router.push({
            name: 'EmployeeSessionList',
            params: {
              employeeId:
                employee.userId
            }
          })
}

async function loadEmployees() {
          try {
            loading.value = true

            const response =
              await getEmployeeSessionSummary(
                userStore.locationId
              )

            employees.value =
              response?.data || []

          } catch (error) {
            console.error(error)

            ElMessage.error(
              error?.response?.data?.message ||
              error?.message ||
              'Unable to load employee sessions.'
            )

          } finally {
            loading.value = false
          }
}

onMounted(loadEmployees)
</script>

<style scoped>
    .report-page {
        padding: 20px;
    }

    .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 16px;
    }

        .page-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: var(--el-text-color-primary);
        }

        .page-header p {
            margin: 6px 0 0;
            color: var(--el-text-color-secondary);
            font-size: 14px;
        }

    .header-actions {
        flex-shrink: 0;
    }

    .search-box {
        width: 260px;
    }

    .summary-card,
    .table-card,
    .employee-card {
        border-radius: 14px;
    }

    .summary-card {
        margin-bottom: 16px;
    }

    .table-card {
        min-height: 120px;
    }

    .clickable-table :deep(.el-table__row) {
        cursor: pointer;
    }

    .employee-cell {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .employee-meta {
        min-width: 0;
    }

        .employee-meta strong,
        .employee-meta span {
            display: block;
        }

        .employee-meta strong {
            font-size: 14px;
            color: var(--el-text-color-primary);
        }

        .employee-meta span {
            margin-top: 3px;
            color: var(--el-text-color-secondary);
            font-size: 12px;
        }

    .mobile-list {
        min-height: 120px;
    }

    .employee-card {
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }

        .employee-card + .employee-card {
            margin-top: 10px;
        }

        .employee-card:active {
            transform: scale(0.99);
        }

        .employee-card:hover {
            border-color: var(--el-color-primary-light-7);
            box-shadow: 0 5px 16px rgba(0, 0, 0, 0.06);
        }

        .employee-card :deep(.el-card__body) {
            padding: 14px;
        }

        .employee-card :deep(.el-divider--horizontal) {
            margin: 12px 0;
        }

    .employee-card-top {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .employee-card-name {
        flex: 1;
        min-width: 0;
    }

        .employee-card-name strong,
        .employee-card-name span {
            display: block;
        }

        .employee-card-name strong {
            color: var(--el-text-color-primary);
            font-size: 14px;
        }

        .employee-card-name span {
            margin-top: 3px;
            color: var(--el-text-color-secondary);
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

    .employee-status-tag {
        flex-shrink: 0;
        margin-left: auto;
    }

    .mobile-stat {
        text-align: center;
    }

        .mobile-stat span,
        .mobile-stat strong {
            display: block;
        }

        .mobile-stat span {
            color: var(--el-text-color-secondary);
            font-size: 10px;
        }

        .mobile-stat strong {
            margin-top: 4px;
            color: var(--el-text-color-primary);
            font-size: 12px;
        }

    .small-empty {
        padding: 10px 0;
    }

        .small-empty :deep(.el-empty__image) {
            width: 54px;
        }

        .small-empty :deep(.el-empty__description) {
            margin-top: 6px;
        }

        .small-empty :deep(.el-empty__description p) {
            font-size: 12px;
        }

    @media (max-width: 760px) {
        .report-page {
            padding: 12px;
        }

        .page-header {
            flex-direction: column;
        }

        .header-actions {
            width: 100%;
        }

            .header-actions :deep(.el-space__item:first-child) {
                flex: 1;
            }

        .search-box {
            width: 100%;
        }
    }
</style>
