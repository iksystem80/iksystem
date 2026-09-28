<template>
    <div class="report-page irfan-operation-employeesession-index irfan-ui-page">
        <!-- HEADER -->
        <div class="page-header">
            <div>
                <h1>Employee Sessions</h1>
                <p>View session activity and reports by employee.</p>
            </div>
            <div class="header-actions">
                <el-button class="action-button" @click="openFilterDrawer">
                    <el-icon><Filter /></el-icon><span>Filter</span>
                </el-button>
            </div>
        </div>

        <!-- INDIVIDUAL SUMMARY CARDS -->
        <el-row :gutter="16" class="summary-row employee-summary-row">
            <el-col :xs="12" :sm="12" :md="6" class="summary-column">
                <el-card shadow="never" class="employee-summary-card summary-teal">
                    <div class="summary-card-content">
                        <div class="summary-icon"><el-icon><UserFilled /></el-icon></div>
                        <el-statistic title="Employees" :value="filteredEmployees.length" />
                    </div>
                </el-card>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" class="summary-column">
                <el-card shadow="never" class="employee-summary-card summary-blue">
                    <div class="summary-card-content">
                        <div class="summary-icon"><el-icon><Calendar /></el-icon></div>
                        <el-statistic title="Total Sessions" :value="totalSessions" />
                    </div>
                </el-card>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" class="summary-column">
                <el-card shadow="never" class="employee-summary-card summary-green">
                    <div class="summary-card-content">
                        <div class="summary-icon"><el-icon><Coin /></el-icon></div>
                        <el-statistic title="Total Points" :value="totalPoints" group-separator="," />
                    </div>
                </el-card>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" class="summary-column">
                <el-card shadow="never" class="employee-summary-card summary-orange">
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
                    <div><div class="drawer-title">Filter Sessions</div><div class="drawer-subtitle">Choose a reporting period.</div></div>
                </div>
            </template>
            <div class="filter-section">
                <div class="filter-label">Period</div>
                <el-select v-model="draftPeriod" style="width: 100%">
                    <el-option label="All sessions" value="all" />
                    <el-option label="Today" value="today" />
                    <el-option label="Last 7 days" value="7" />
                    <el-option label="Last 30 days" value="30" />
                    <el-option label="Custom date range" value="custom" />
                </el-select>
            </div>
            <div v-if="draftPeriod === 'custom'" class="filter-section">
                <div class="filter-label">Date Range</div>
                <el-date-picker v-model="draftDateRange" type="daterange" unlink-panels
                                start-placeholder="Start date" end-placeholder="End date"
                                value-format="YYYY-MM-DD" style="width: 100%" />
            </div>
            <template #footer>
                <div class="drawer-footer">
                    <el-button @click="clearFilters">Clear</el-button>
                    <el-button type="primary" :loading="loading" @click="applyFilters">Apply Filter</el-button>
                </div>
            </template>
        </el-drawer>

        <!-- DESKTOP -->
        <el-card shadow="never"
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

                <el-table-column label="Sessions"
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

                <el-table-column label="Points" width="115" align="right">
                    <template #default="{ row }">
                        {{ Number(row.totalPoints || 0).toLocaleString() }}
                    </template>
                </el-table-column>
                <el-table-column label="Expenses" width="130" align="right">
                    <template #default="{ row }">
                        {{ formatMoney(row.cashExpenses) }}
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
        <div v-loading="loading"
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
                        <span>Included / Total Sessions</span>
                        <strong>{{ Number(employee.readingIncludedCount || 0) }}/{{ Number(employee.sessionCount || 0) }}</strong>
                    </div>
                </div>
            </el-card>
        </div>

    </div>
</template>

<script setup>
    import { computed, onMounted, ref } from 'vue'
    import { useRouter } from 'vue-router'
    import { ElMessage } from 'element-plus'
    import { ArrowRight, Filter, UserFilled, Calendar, Coin, Money } from '@element-plus/icons-vue'

    import { useUserStore } from '@/store/modules/user'
    import { getEmployeeSessionSummary } from '@/api/employeeSession'

    const router = useRouter()
    const userStore = useUserStore()

    const loading = ref(false)
    const filterDrawer = ref(false)
    const draftPeriod = ref('all')
    const draftDateRange = ref([])
    const drawerSize = 'min(360px, 100%)'
    const employees = ref([])
    const period = ref('all')
    const dateRange = ref([])
    const chicagoDate = (date) => new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(date)
    const selectedDates = computed(() => {
        if (period.value === 'all') return {}
        if (period.value === 'custom') {
            if (!dateRange.value || dateRange.value.length !== 2) return null
            return { startDate: dateRange.value[0], endDate: dateRange.value[1] }
        }
        const today = chicagoDate(new Date())
        if (period.value === 'today') return { startDate: today, endDate: today }
        const start = new Date(`${today}T12:00:00Z`)
        start.setUTCDate(start.getUTCDate() - (Number(period.value) - 1))
        return { startDate: start.toISOString().slice(0, 10), endDate: today }
    })
    function openFilterDrawer() {
        draftPeriod.value = period.value
        draftDateRange.value = Array.isArray(dateRange.value) ? [...dateRange.value] : []
        filterDrawer.value = true
    }
    function applyFilters() {
        if (draftPeriod.value === 'custom' && (!draftDateRange.value || draftDateRange.value.length !== 2)) {
            ElMessage.warning('Please select a start and end date.')
            return
        }
        period.value = draftPeriod.value
        dateRange.value = draftPeriod.value === 'custom' ? [...draftDateRange.value] : []
        filterDrawer.value = false
        loadEmployees()
    }
    function clearFilters() {
        draftPeriod.value = 'all'
        draftDateRange.value = []
        period.value = 'all'
        dateRange.value = []
        filterDrawer.value = false
        loadEmployees()
    }
    const formatMoney = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })


    const filteredEmployees = computed(() => employees.value)

    const totalPoints = computed(() => filteredEmployees.value.reduce((sum, item) => sum + Number(item.totalPoints || 0), 0))
    const totalExpenses = computed(() => filteredEmployees.value.reduce((sum, item) => sum + Number(item.cashExpenses || 0), 0))

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
            },
            query: { ...selectedDates.value, period: period.value }
        })
    }

    async function loadEmployees() {
        if (selectedDates.value === null) {
            employees.value = []
            return
        }
        try {
            loading.value = true

            const response =
                await getEmployeeSessionSummary(
                    userStore.locationId,
                    selectedDates.value
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
    /* Compact summary cards: match the height of the Points by Employee tiles. */
    .employee-summary-row {
        row-gap: 15px;
        margin-bottom: 16px;
    }

    .summary-column {
        min-width: 0;
        margin-bottom: 0;
    }

    .employee-summary-card {
        --summary-accent: #409eff;
        --summary-soft: rgba(64, 158, 255, .11);
        border-radius: 14px;
        overflow: hidden;
        background: var(--el-bg-color, #fff);
        border: 1px solid var(--el-border-color-lighter);
        transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
    }

        .employee-summary-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 28px rgba(0, 0, 0, .08);
            border-color: color-mix(in srgb, var(--summary-accent) 25%, transparent);
        }

        .employee-summary-card :deep(.el-card__body) {
            padding: 16px 12px !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: hidden;
        }

    .summary-card-content {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
    }

    .summary-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
        border-radius: 12px;
        color: var(--summary-accent);
        background: var(--summary-soft);
        transition: transform .25s ease;
    }

    .employee-summary-card:hover .summary-icon {
        transform: scale(1.05);
    }

    .summary-icon .el-icon {
        font-size: 23px;
        width: 24px;
        height: 24px;
    }

    .summary-card-content :deep(.el-statistic) {
        min-width: 0;
        flex: 1;
    }

    .employee-summary-card :deep(.el-statistic__head) {
        font-size: 12px !important;
        line-height: 1.3;
        font-weight: 500;
        color: var(--el-text-color-secondary);
        margin-bottom: 5px;
    }

    .employee-summary-card :deep(.el-statistic__content) {
        font-size: 24px !important;
        line-height: 1.1;
        font-weight: 700;
        color: var(--el-text-color-primary);
    }

    .summary-teal {
        --summary-accent: #40c9c6;
        --summary-soft: rgba(64, 201, 198, .11);
    }

    .summary-blue {
        --summary-accent: #409eff;
        --summary-soft: rgba(64, 158, 255, .11);
    }

    .summary-green {
        --summary-accent: #67c23a;
        --summary-soft: rgba(103, 194, 58, .11);
    }

    .summary-orange {
        --summary-accent: #e6a23c;
        --summary-soft: rgba(230, 162, 60, .11);
    }

    @media (max-width: 550px) {
        .employee-summary-card :deep(.el-card__body) {
            padding: 12px 9px !important;
        }

        .summary-card-content {
            gap: 8px;
        }

        .summary-icon {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
            border-radius: 10px;
        }

            .summary-icon .el-icon {
                width: 20px;
                height: 20px;
                font-size: 20px;
            }

        .employee-summary-card :deep(.el-statistic__head) {
            font-size: 11px !important;
        }

        .employee-summary-card :deep(.el-statistic__content) {
            font-size: 21px !important;
        }
    }

    .drawer-header {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .drawer-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: var(--el-fill-color-light);
        font-size: 18px;
    }

    .drawer-title {
        font-size: 17px;
        font-weight: 700;
        color: var(--el-text-color-primary);
    }

    .drawer-subtitle {
        font-size: 12px;
        margin-top: 3px;
        color: var(--el-text-color-secondary);
    }

    .filter-section {
        margin-bottom: 22px;
    }

        .filter-section .filter-label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 600;
        }

    .drawer-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
    }
    /* Use the card layout on phones and tablets, regardless of appStore.device. */
    .table-card {
        display: block;
    }

    .mobile-list {
        display: none;
    }

    @media (max-width: 1024px) {
        .table-card {
            display: none;
        }

        .mobile-list {
            display: flex;
        }

        .mobile-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .employee-card {
            border-radius: 14px;
            cursor: pointer;
        }

            .employee-card :deep(.el-card__body) {
                padding: 16px;
            }

        .employee-card-top {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
        }

            .employee-card-top :deep(.el-avatar) {
                flex-shrink: 0;
            }

        .employee-card-name {
            flex: 1;
            min-width: 0;
        }

            .employee-card-name strong, .employee-card-name span {
                display: block;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .employee-card-name strong {
                font-size: 15px;
                color: var(--el-text-color-primary);
            }

            .employee-card-name span {
                margin-top: 3px;
                font-size: 12px;
                color: var(--el-text-color-secondary);
            }

        .employee-status-tag {
            flex-shrink: 0;
            margin-left: auto;
        }

        .mobile-card-details {
            margin-top: 15px;
            padding-top: 14px;
            border-top: 1px solid var(--el-border-color-lighter);
        }

        .mobile-primary-stats {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
        }

        .mobile-stat {
            min-width: 0;
            padding: 11px 12px;
            border-radius: 10px;
            background: var(--el-fill-color-light);
            text-align: left;
        }

            .mobile-stat span, .mobile-stat strong {
                display: block;
            }

            .mobile-stat span {
                font-size: 12px;
                color: var(--el-text-color-secondary);
            }

            .mobile-stat strong {
                margin-top: 5px;
                font-size: 18px;
                color: var(--el-text-color-primary);
                overflow-wrap: anywhere;
            }

        .mobile-session-count {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-top: 13px;
            font-size: 12px;
            color: var(--el-text-color-secondary);
        }

            .mobile-session-count strong {
                font-size: 14px;
                color: var(--el-text-color-primary);
                white-space: nowrap;
            }
    }
</style>
