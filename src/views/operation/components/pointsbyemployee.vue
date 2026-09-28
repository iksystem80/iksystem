<template>
    <div class="irfan-operation-components-pointsbyemployee">
        <!-- ===================================================== -->
        <!-- FILTERS -->
        <!-- ===================================================== -->
        <el-card shadow="never" class="filter-card">
            <el-row :gutter="15" align="middle" justify="start" class="filter-row">
                <el-col :xs="24" :sm="12" :md="8">
                    <div class="filter-label">
                        Employee
                    </div>
                    <el-select v-model="selectedEmployee" placeholder="Select employee" style="width: 100%">
                        <el-option v-for="item in employees" :key="item.id" :label="item.name" :value="item.id">
                            <div class="employee-option">
                                <el-avatar :size="26" :src="item.avatar">
                                    {{ getInitial(item.name) }}
                                </el-avatar>
                                <span>
                                    {{ item.name }}
                                </span>
                            </div>
                        </el-option>
                    </el-select>
                </el-col>
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
        <!-- REPORT CONTENT -->
        <!-- ===================================================== -->
        <div v-loading="loading" element-loading-text="Loading employee activity..." class="report-content">
            <el-empty v-if="!report.employee" description="Select an employee to view point activity." />
            <template v-else>
                <!-- =================================================== -->
                <!-- EMPLOYEE HEADER -->
                <!-- =================================================== -->
                <el-card shadow="never" class="employee-banner">
                    <div class="employee-header">
                        <div class="employee-profile">
                            <el-avatar :size="56" :src="report.employee.avatar">
                                {{ getInitial(report.employee.name) }}
                            </el-avatar>
                            <div>
                                <!--<div class="header-label">
                                    SELECTED EMPLOYEE
                                </div>-->
                                <h2 style="color:white">
                                    {{ report.employee.name }}
                                </h2>
                                <div class="employee-period">
                                    Activity from the last {{ days }} days
                                </div>
                            </div>
                        </div>
                        <el-tag v-if="report.summary.activeSessions > 0" type="success" effect="dark" size="large" round class="working-tag">
                            <el-icon>
                                <VideoPlay />
                            </el-icon>
                            <span>Working</span>
                        </el-tag>
                        <el-tag v-else type="info" size="large" round>
                            Clocked Out
                        </el-tag>
                    </div>
                </el-card>
                <!-- =================================================== -->
                <!-- SUMMARY -->
                <!-- =================================================== -->
                <el-row :gutter="15" class="summary-row">
                    <el-col :xs="12" :sm="8" :md="4" class="summary-col">
                        <el-card shadow="never" class="summary-stat-card stat-teal">
                            <div class="summary-stat-layout">
                                <div class="summary-stat-icon"><el-icon><Calendar /></el-icon></div>
                                <div class="summary-stat-content">
                                    <div class="summary-stat-label">Days Worked</div>
                                    <div class="summary-stat-value">{{ report.summary.daysWorked }}</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :xs="12" :sm="8" :md="4" class="summary-col">
                        <el-card shadow="never" class="summary-stat-card stat-blue">
                            <div class="summary-stat-layout">
                                <div class="summary-stat-icon"><el-icon><Tickets /></el-icon></div>
                                <div class="summary-stat-content">
                                    <div class="summary-stat-label">Sessions</div>
                                    <div class="summary-stat-value">{{ report.summary.totalSessions }}</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :xs="12" :sm="8" :md="4" class="summary-col">
                        <el-card shadow="never" class="summary-stat-card stat-green">
                            <div class="summary-stat-layout">
                                <div class="summary-stat-icon"><el-icon><Coin /></el-icon></div>
                                <div class="summary-stat-content">
                                    <div class="summary-stat-label">Points Given</div>
                                    <div class="summary-stat-value">{{ report.summary.pointsGiven }}</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :xs="12" :sm="8" :md="4" class="summary-col">
                        <el-card shadow="never" class="summary-stat-card stat-orange">
                            <div class="summary-stat-layout">
                                <div class="summary-stat-icon"><el-icon><Document /></el-icon></div>
                                <div class="summary-stat-content">
                                    <div class="summary-stat-label">Point Entries</div>
                                    <div class="summary-stat-value">{{ report.summary.totalEntries }}</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :xs="12" :sm="8" :md="4" class="summary-col">
                        <el-card shadow="never" class="summary-stat-card stat-purple">
                            <div class="summary-stat-layout">
                                <div class="summary-stat-icon"><el-icon><Timer /></el-icon></div>
                                <div class="summary-stat-content">
                                    <div class="summary-stat-label">Working Hours</div>
                                    <div class="summary-stat-value">{{ Number(report.summary.totalWorkingHours || 0).toFixed(2) }}</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :xs="12" :sm="8" :md="4" class="summary-col">
                        <el-card shadow="never" class="summary-stat-card stat-red">
                            <div class="summary-stat-layout">
                                <div class="summary-stat-icon"><el-icon><VideoPlay /></el-icon></div>
                                <div class="summary-stat-content">
                                    <div class="summary-stat-label">Active Session</div>
                                    <div class="summary-stat-value">{{ report.summary.activeSessions }}</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
                <!-- =================================================== -->
                <!-- SESSIONS -->
                <!-- =================================================== -->
                <el-card shadow="never" class="sessions-card">
                    <template #header>
                        <div class="section-header">
                            <div>
                                <strong>
                                    Employee Sessions
                                </strong>
                                <div class="small-text">
                                    Click a session to view customers and points assigned during that session.
                                </div>
                            </div>
                        </div>
                    </template>

                    <el-empty v-if="report.sessions.length === 0"
                              description="No employee sessions found." class="small-empty" />

                    <!-- ================================================= -->
                    <!-- DESKTOP -->
                    <!-- ================================================= -->

                    <el-table v-else-if="device !== 'mobile'"
                              :data="report.sessions"
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
                                <el-button circle
                                           text
                                           :icon="ArrowRight" />
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
                                           :icon="ArrowRight"
                                           class="session-view-button" />
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
                   :size="device === 'mobile' ? '100%' : '72%'"
                   destroy-on-close>
            <template #header>
                <div v-if="selectedSession">
                    <strong>
                        Session Details
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

            <el-descriptions v-if="selectedSession"
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
            </el-descriptions>

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
                        :lg="8"
                        class="entry-column">
                    <el-card shadow="hover">
                        <div class="customer-heading">
                            <div>
                                <strong>
                                    {{ item.fullName }}
                                </strong>

                                <div class="small-text">
                                    {{ formatTime(item.dateAssign) }}

                                    <span v-if="item.machineNumber">
                                        · Machine {{ item.machineNumber }}
                                    </span>
                                </div>
                            </div>

                            <el-tag type="warning"
                                    effect="dark"
                                    round>
                                +{{ item.points }}
                            </el-tag>
                        </div>

                        <el-row :gutter="8"
                                class="photo-row">
                            <el-col :span="12">
                                <div class="small-text photo-label">
                                    Point Photo
                                </div>

                                <el-image :src="item.pointPhoto"
                                          fit="cover"
                                          class="customer-photo"
                                          :preview-src-list="item.pointPhoto? [item.pointPhoto]: []"
                                          preview-teleported>
                                    <template #error>
                                        <div class="image-empty">
                                            No photo
                                        </div>
                                    </template>
                                </el-image>
                            </el-col>

                            <el-col :span="12">
                                <div class="small-text photo-label">
                                    Check-In
                                </div>

                                <el-image :src="item.checkinPhoto ? item.checkinPhoto : item.avatar"
                                          fit="cover"
                                          class="customer-photo"
                                          :preview-src-list="item.checkinPhoto? [item.checkinPhoto]: []"
                                          preview-teleported>
                                    <template #error>
                                        <div class="image-empty">
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
    } from 'vue'

    import {
        Refresh,
        ArrowRight,
        VideoPlay,
        Calendar,
        Tickets,
        Coin,
        Document,
        Timer
    } from '@element-plus/icons-vue'

    import {
        ElMessage
    } from 'element-plus'

    import {
        getPointWatchingEmployees,
        getPointsByEmployee,
        getPointSessionEntries
    } from '@/api/pointwatching'

    import {
        useAppStore
    } from '@/store/modules/app'

    // ============================================================
    // PROPS
    // ============================================================

    const props = defineProps({
        locationId: {
            type: [Number, String],
            required: true
        }
    })

    // ============================================================
    // DEVICE
    // ============================================================

    const appStore = useAppStore()

    const device = computed(
        () => appStore.device
    )

    // ============================================================
    // STATE
    // ============================================================

    const employees = ref([])
    const selectedEmployee = ref(null)
    const days = ref(14)
    const loading = ref(false)

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
    })

    const sessionDrawer = ref(false)
    const selectedSession = ref(null)
    const sessionEntries = ref([])
    const sessionLoading = ref(false)

    // ============================================================
    // EMPLOYEES
    // ============================================================

    const loadEmployees = async () => {
        if (!props.locationId) {
            return
        }

        try {
            const response =
                await getPointWatchingEmployees(
                    props.locationId
                )

            employees.value =
                response.data ?? []

            if (
                !selectedEmployee.value &&
                employees.value.length
            ) {
                selectedEmployee.value =
                    employees.value[0].id
            }

        } catch (error) {
            ElMessage.error(
                error.response?.data?.message ||
                'Unable to load employees.'
            )
        }
    }

    // ============================================================
    // REPORT
    // ============================================================

    const loadReport = async () => {
        if (
            !selectedEmployee.value ||
            !props.locationId
        ) {
            return
        }

        try {
            loading.value = true

            const response =
                await getPointsByEmployee(
                    selectedEmployee.value,
                    props.locationId,
                    days.value
                )

            report.value =
                response.data

        } catch (error) {
            ElMessage.error(
                error.response?.data?.message ||
                'Unable to load employee report.'
            )

        } finally {
            loading.value = false
        }
    }

    // ============================================================
    // SESSION DETAILS
    // ============================================================

    const openSession = async row => {
        selectedSession.value = row
        sessionDrawer.value = true
        sessionEntries.value = []

        try {
            sessionLoading.value = true

            const response =
                await getPointSessionEntries(
                    row.id
                )

            sessionEntries.value =
                response.data ?? []

        } catch (error) {
            ElMessage.error(
                error.response?.data?.message ||
                'Unable to load session details.'
            )

        } finally {
            sessionLoading.value = false
        }
    }

    // ============================================================
    // FORMATTERS
    // ============================================================

    const getInitial = value => {
        if (!value) {
            return '?'
        }

        return value
            .charAt(0)
            .toUpperCase()
    }

    const formatDate = value => {
        if (!value) {
            return '-'
        }

        return new Date(value)
            .toLocaleDateString(
                'en-US',
                {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }
            )
    }

    const formatTime = value => {
        if (!value) {
            return '-'
        }

        return new Date(value)
            .toLocaleTimeString(
                'en-US',
                {
                    hour: 'numeric',
                    minute: '2-digit'
                }
            )
    }

    const getRunningHours = clockIn => {
        if (!clockIn) {
            return '0.00'
        }

        const start =
            new Date(clockIn).getTime()

        const now =
            Date.now()

        const hours =
            (now - start) /
            1000 /
            60 /
            60

        return Math.max(
            0,
            hours
        ).toFixed(2)
    }

    // ============================================================
    // WATCHERS
    // ============================================================

    watch(
        () => props.locationId,
        async value => {
            if (!value) {
                return
            }

            await loadEmployees()
        },
        {
            immediate: true
        }
    )

    watch(
        [
            selectedEmployee,
            days
        ],
        () => {
            if (
                selectedEmployee.value
            ) {
                loadReport()
            }
        }
    )
</script>


<style scoped>
    /* Compact Employee / Period filter card without changing the controls. */
    .filter-card :deep(.el-card__body) {
        padding: 12px 18px !important;
    }

    .filter-card .filter-row {
        min-height: 0 !important;
    }

    .filter-card .filter-label {
        margin-bottom: 0px !important;
    }
    /* Keep the Employee and Period controls at the start of the filter card. */
    .filter-row {
        justify-content: flex-start !important;
        margin-bottom: 5px;
    }
    /* Give the employee profile banner and summary tiles distinct spacing. */
    .employee-banner {
        margin-bottom: 16px !important;
    }

    /* Panel Group-inspired summary: white cards, colored icon tiles, no decoration. */
    .summary-row {
        row-gap: 15px;
        margin-bottom: 16px;
    }

    .summary-col {
        min-width: 0;
    }

    .summary-stat-card {
        --stat-accent: #409eff;
        --stat-soft: rgba(64, 158, 255, .11);
        height: 100%;
        border-radius: 14px;
        overflow: hidden;
        background: #fff;
        border: 1px solid var(--el-border-color-lighter);
        transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
    }

        .summary-stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 28px rgba(0,0,0,.08);
            border-color: color-mix(in srgb, var(--stat-accent) 25%, transparent);
        }

        .summary-stat-card :deep(.el-card__body) {
            padding: 16px 12px !important;
            overflow: hidden;
        }

    .summary-stat-layout {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
    }

    .summary-stat-icon {
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        color: var(--stat-accent);
        background: var(--stat-soft);
        transition: transform .25s ease;
    }

    .summary-stat-card:hover .summary-stat-icon {
        transform: scale(1.05);
    }

    .summary-stat-icon .el-icon {
        font-size: 23px;
        width: 24px;
        height: 24px;
    }

    .summary-stat-content {
        min-width: 0;
        flex: 1;
    }

    .summary-stat-label {
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 1.3;
        margin-bottom: 5px;
    }

    .summary-stat-value {
        color: var(--el-text-color-primary);
        font-size: 24px;
        line-height: 1.1;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
    }

    .stat-teal {
        --stat-accent: #40c9c6;
        --stat-soft: rgba(64,201,198,.11);
    }

    .stat-blue {
        --stat-accent: #409eff;
        --stat-soft: rgba(64,158,255,.11);
    }

    .stat-green {
        --stat-accent: #67c23a;
        --stat-soft: rgba(103,194,58,.11);
    }

    .stat-orange {
        --stat-accent: #e6a23c;
        --stat-soft: rgba(230,162,60,.11);
    }

    .stat-purple {
        --stat-accent: #9065c9;
        --stat-soft: rgba(144,101,201,.11);
    }

    .stat-red {
        --stat-accent: #f56c6c;
        --stat-soft: rgba(245,108,108,.11);
    }

    @media (max-width: 550px) {
        .summary-stat-card :deep(.el-card__body) {
            padding: 12px 9px !important;
        }

        .summary-stat-layout {
            gap: 8px;
        }

        .summary-stat-icon {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
            border-radius: 10px;
        }

            .summary-stat-icon .el-icon {
                font-size: 20px;
                width: 20px;
                height: 20px;
            }

        .summary-stat-label {
            font-size: 11px;
        }

        .summary-stat-value {
            font-size: 21px;
        }
    }
</style>
