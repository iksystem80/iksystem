<template>
    <div class="report-page irfan-operation-employeesession-sessions irfan-ui-page">
        <div class="page-header">
            <div class="header-left">
                <el-button class="back-button" circle aria-label="Back" @click="router.back()">
                    <el-icon>
                        <ArrowLeft />
                    </el-icon>
                </el-button>
                <div>
                    <h1>{{ employee?.name || 'Employee Sessions' }}</h1>
                    <p>{{ employee?.jobTitle || 'Session history' }}</p>
                </div>
            </div>
            <!--<el-button :loading="loading" @click="loadSessions">
                <el-icon>
                    <Refresh />
                </el-icon>
                Refresh
            </el-button>-->
        </div>
        <el-card shadow="never" class="employee-banner irfan-session-banner">
            <div class="irfan-session-banner-layout">
                <el-avatar :size="54" :src="employee?.avatar">
                    {{ initials(employee?.name) }}
                </el-avatar>
                <div class="irfan-session-banner-profile">
                    <strong>{{ employee?.name || 'Employee' }}</strong>
                    <span>{{ sessions.length }} sessions · {{ periodLabel }}</span>
                </div>
                <div class="irfan-session-banner-totals">
                    <div class="irfan-session-banner-total">
                        <span>Match Points</span>
                        <strong>{{ totalPoints }}</strong>
                    </div>
                    <div class="irfan-session-banner-total">
                        <span>Cash Expenses</span>
                        <strong>{{ hasCashExpenseData ? formatMoney(totalExpenses) : '—' }}</strong>
                    </div>
                </div>
            </div>
        </el-card>
        <div v-loading="loading" element-loading-text="Loading employee sessions..." class="sessions-content">
            <el-empty v-if="!loading && sessions.length === 0" description="No sessions found" class="small-empty" />
            <div v-else class="session-list">
                <el-card v-for="session in sessions" :key="session.id" shadow="never" class="session-card" :class="{ 'session-included': session.readingSessionId != null }" :title="session.readingSessionId != null ? `Included in machine reading #${session.readingSessionId}` : undefined" @click="openSession(session)">
                    <el-tag :type="session.status === 'IN_PROGRESS' ? 'success' : 'info'" size="small" effect="light" round class="session-status-tag">
                        {{ session.status === 'IN_PROGRESS' ? 'In Progress' : 'Closed' }}
                    </el-tag>
                    <button class="photo-audit-compact" type="button" :disabled="!Number(session.photoCount || 0)" :title="'Open photo audit · ' + Number(session.photoCount || 0) + ' photos'" @click.stop="openAudit(session)">
                        <span class="photo-audit-heading">
                            <el-icon><Picture /></el-icon>
                            Photos {{ Number(session.photoCount || 0) }}
                            <!--<el-icon class="photo-audit-go"><ArrowRight /></el-icon>-->
                        </span>
                        <span class="photo-audit-counts">
                            <span class="audit-approved" title="Approved">✓ {{ Number(session.approvedCount || 0) }}</span>
                            <span class="audit-rejected" title="Rejected">✕ {{ Number(session.rejectedCount || 0) }}</span>
                            <span class="audit-remaining" title="Remaining">◷ {{ Number(session.remainingReview || 0) }}</span>
                        </span>
                    </button>
                    <div class="session-row-content">
                        <div class="session-icon">
                            <el-icon>
                                <Clock />
                            </el-icon>
                        </div>
                        <div class="session-main">
                            <div class="session-title-row">
                                <strong>
                                    Session # {{ session.id }}
                                </strong>
                            </div>
                            <span class="session-date">
                                {{ formatSessionDate(session.clockIn) }}
                            </span>
                            <div class="session-meta">
                                <span>
                                    {{ formatTimeRange(session.clockIn, session.clockOut) }}
                                </span>
                                <span>
                                    {{ formatDuration(session) }}
                                </span>
                                <span>
                                    {{ session.entries }} point entries
                                </span>
                                <span>
                                    {{ Number(session.points || 0).toLocaleString() }} points
                                </span>
                            </div>
                        </div>
                        <el-icon class="arrow-icon">
                            <ArrowRight />
                        </el-icon>
                    </div>
                </el-card>
            </div>
        </div>
        <SessionPhotoAuditDrawer v-model="auditDrawerOpen" :session-id="auditSessionId" :location-id="userStore.locationId" @review-saved="loadSessions" />
    </div>
</template>

<script setup>
    import { computed, onMounted, ref } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { ElMessage } from 'element-plus'
    import {
        ArrowLeft,
        ArrowRight,
        Clock,
        Picture,
        Refresh
    } from '@element-plus/icons-vue'

    import { useUserStore } from '@/store/modules/user'
    import { getEmployeeReportSessions } from '@/api/employeeSession'
    import SessionPhotoAuditDrawer from './SessionPhotoAuditDrawer.vue'

    const route = useRoute()
    const router = useRouter()
    const userStore = useUserStore()

    const loading = ref(false)
    const employee = ref(null)
    const sessions = ref([])
    const auditDrawerOpen = ref(false)
    const auditSessionId = ref(null)

    const employeeId = computed(() =>
        Number(route.params.employeeId || 0)
    )

    const filterDates = computed(() => ({
        startDate: typeof route.query.startDate === 'string' ? route.query.startDate : undefined,
        endDate: typeof route.query.endDate === 'string' ? route.query.endDate : undefined
    }))
    const periodLabel = computed(() => {
        if (filterDates.value.startDate && filterDates.value.endDate)
            return `${filterDates.value.startDate} to ${filterDates.value.endDate}`
        return 'All sessions'
    })
    const formatMoney = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    // Cash expenses are separate from CustomerMatch points. Never use totalExpenses,
    // which can include point-related expense amounts in finance summaries.
    const hasCashExpenseData = computed(() =>
        sessions.value.length === 0 || sessions.value.every(item => item.cashExpenses != null)
    )
    const totalExpenses = computed(() =>
        sessions.value.reduce((sum, item) => sum + Number(item.cashExpenses || 0), 0)
    )

    const totalPoints = computed(() =>
        sessions.value
            .reduce(
                (sum, item) =>
                    sum + Number(item.points || 0),
                0
            )
            .toLocaleString()
    )

    function initials(name) {
        return String(name || 'E')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()
    }

    function formatSessionDate(value) {
        if (!value) {
            return '—'
        }

        return new Date(value)
            .toLocaleDateString(
                [],
                {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }
            )
    }

    function formatTime(value) {
        if (!value) {
            return 'Now'
        }

        return new Date(value)
            .toLocaleTimeString(
                [],
                {
                    hour: 'numeric',
                    minute: '2-digit'
                }
            )
    }

    function formatTimeRange(
        clockIn,
        clockOut
    ) {
        return `${formatTime(clockIn)} – ${clockOut ? formatTime(clockOut) : 'Now'}`
    }

    function formatDuration(session) {
        let hours =
            Number(
                session.totalWorkingHours || 0
            )

        if (
            !session.clockOut &&
            session.clockIn
        ) {
            hours =
                Math.max(
                    0,
                    (
                        Date.now() -
                        new Date(
                            session.clockIn
                        ).getTime()
                    ) / 3600000
                )
        }

        const whole =
            Math.floor(hours)

        const minutes =
            Math.round(
                (hours - whole) * 60
            )

        return `${whole}h ${minutes}m`
    }

    function openAudit(session) {
        auditSessionId.value = Number(session.id)
        auditDrawerOpen.value = true
    }

    function openSession(session) {
        router.push({
            name: 'EmployeeSessionReportMenu',
            params: {
                employeeId:
                    employeeId.value,
                sessionId:
                    session.id
            }
        })
    }

    async function loadSessions() {
        if (!employeeId.value) {
            return
        }

        try {
            loading.value = true

            const response =
                await getEmployeeReportSessions(
                    employeeId.value,
                    userStore.locationId,
                    filterDates.value
                )

            employee.value =
                response?.data?.employee || null

            sessions.value =
                response?.data?.sessions || []

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

    onMounted(loadSessions)
</script>



<style scoped>
    /* Keep the Back button circular even when shared button styles apply. */
    .back-button.el-button {
        width: 38px !important;
        height: 38px !important;
        min-width: 38px !important;
        padding: 0 !important;
        border-radius: 50% !important;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 38px;
        font-size: 18px;
    }

    /* Isolated names avoid project-wide employee-summary rules stretching this card. */
    .irfan-session-banner {
        background: linear-gradient(135deg, #1e2447, #11162f);
        color: #fff;
        border-color: transparent;
        border-radius: 14px;
        margin-bottom: 16px;
    }

        .irfan-session-banner :deep(.el-card__body) {
            padding: 18px 20px;
        }

    .irfan-session-banner-layout {
        display: grid;
        grid-template-columns: 54px minmax(0, 1fr) auto;
        align-items: center;
        gap: 16px;
        min-height: 0;
    }

        .irfan-session-banner-layout > .el-avatar {
            flex-shrink: 0;
        }

    .irfan-session-banner-profile {
        min-width: 0;
    }

        .irfan-session-banner-profile strong, .irfan-session-banner-profile span, .irfan-session-banner-total span, .irfan-session-banner-total strong {
            display: block;
        }

        .irfan-session-banner-profile strong {
            color: #fff;
            font-size: 18px;
        }

        .irfan-session-banner-profile span, .irfan-session-banner-total span {
            color: #c7cbea;
            font-size: 12px;
            margin-top: 4px;
        }

    .irfan-session-banner-totals {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: center;
        gap: 20px;
        margin: 0;
        padding: 0;
        min-height: 0;
    }

    .irfan-session-banner-total {
        min-width: 0;
        text-align: right;
        margin: 0;
        padding: 0;
    }

        .irfan-session-banner-total strong {
            color: #fff;
            font-size: 20px;
            margin-top: 5px;
        }

    @media (max-width: 1024px) {
        .irfan-session-banner :deep(.el-card__body) {
            padding: 16px;
        }

        .irfan-session-banner-layout {
            grid-template-columns: 54px minmax(0, 1fr);
            gap: 12px;
            align-items: center;
        }

        .irfan-session-banner-totals {
            grid-column: 1 / -1;
            grid-row: 2;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            border-top: 1px solid rgba(255,255,255,.2);
            padding-top: 12px;
            margin-top: 0;
        }

        .irfan-session-banner-total:first-child {
            text-align: left;
        }

        .irfan-session-banner-total:last-child {
            text-align: right;
        }
    }

    @media (max-width: 420px) {
        .irfan-session-banner-totals {
            gap: 8px;
        }

        .irfan-session-banner-total span {
            font-size: 11px;
        }

        .irfan-session-banner-total strong {
            font-size: 18px;
        }
    }
</style>
