<template>
    <div class="app-container">
        <div class="page-header">
            <div class="header-left">
                <el-button class="back-button" circle aria-label="Back" @click="router.back()">
                    <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <div>
                    <h1>Points Report</h1>
                    <p v-if="report?.session">
                        Session # {{ report.session.id }} · {{ report.session.employeeName }}
                    </p>
                </div>
            </div>
            <!--<el-button :loading="loading" @click="loadReport">
            <el-icon><Refresh /></el-icon>
            Refresh
        </el-button>-->
        </div>
        <el-skeleton v-if="loading" :rows="8" animated />
        <template v-else-if="report">
            <el-card shadow="never" class="session-card session-banner irfan-report-banner">
                <div class="irfan-report-profile">
                    <el-avatar :size="54" :src="report.session.employeeAvatar">{{ initials(report.session.employeeName) }}</el-avatar>
                    <div class="irfan-report-profile-text">
                        <strong>{{ report.session.employeeName || 'Employee' }}</strong>
                        <span>Session # {{ report.session.id }}</span>
                    </div>
                </div>
                <div class="session-grid">
                    <div><span>Clock In</span><strong>{{ formatDateTime(report.session.clockIn) }}</strong></div>
                    <div><span>Clock Out</span><strong>{{ report.session.clockOut ? formatDateTime(report.session.clockOut) : 'In Progress' }}</strong></div>
                    <div><span>Duration</span><strong>{{ formatDuration(report.session) }}</strong></div>
                </div>
            </el-card>
            <div class="metric-grid">
                <el-card shadow="never" class="metric-card metric-points"><div class="metric-layout"><div class="metric-icon"><el-icon><Coin /></el-icon></div><div class="metric-copy"><span>Total Points</span><strong>{{ number(report.summary.totalPoints) }}</strong></div></div></el-card>
                <el-card shadow="never" class="metric-card metric-matches"><div class="metric-layout"><div class="metric-icon"><el-icon><DataAnalysis /></el-icon></div><div class="metric-copy"><span>Matches</span><strong>{{ number(report.summary.assignmentCount) }}</strong></div></div></el-card>
                <el-card shadow="never" class="metric-card metric-approved"><div class="metric-layout"><div class="metric-icon"><el-icon><CircleCheckFilled /></el-icon></div><div class="metric-copy"><span>Approved</span><strong>{{ number(report.summary.approvedCount) }}</strong></div></div></el-card>
                <el-card shadow="never" class="metric-card metric-pending"><div class="metric-layout"><div class="metric-icon"><el-icon><Clock /></el-icon></div><div class="metric-copy"><span>Pending Review</span><strong>{{ number(report.summary.pendingReview) }}</strong></div></div></el-card>
            </div>
            <div class="report-grid">
                <el-card shadow="never" class="panel breakdown-panel">
                    <template #header>
                        <div class="panel-header">
                            <div>
                                <strong>Points Breakdown</strong>
                                <span>Match grouped by point amount</span>
                            </div>
                        </div>
                    </template>

                    <el-empty v-if="report.breakdown.length === 0"
                              description="No point entries"
                              :image-size="70" />

                    <div v-else class="breakdown-list">
                        <div v-for="item in report.breakdown" :key="item.points" class="breakdown-row">
                            <div>
                                <strong>{{ number(item.points) }} pts</strong>
                                <span>{{ item.count }} match{{ item.count === 1 ? '' : 's' }}</span>
                            </div>
                            <strong>{{ number(item.total) }}</strong>
                        </div>
                    </div>
                </el-card>

                <el-card shadow="never" class="panel review-panel">
                    <template #header>
                        <div class="panel-header">
                            <div>
                                <strong>Photo Review</strong>
                                <span>{{ report.summary.reviewedCount }} of {{ report.summary.assignmentCount }} reviewed</span>
                            </div>
                        </div>
                    </template>

                    <el-progress :percentage="reviewProgress"
                                 :stroke-width="8"
                                 :show-text="false" />

                    <div class="review-stats">
                        <div class="review-stat approved">
                            <strong>{{ report.summary.approvedCount }}</strong>
                            <span>Approved</span>
                        </div>
                        <div class="review-stat rejected">
                            <strong>{{ report.summary.rejectedCount }}</strong>
                            <span>Rejected</span>
                        </div>
                        <div class="review-stat pending">
                            <strong>{{ report.summary.pendingReview }}</strong>
                            <span>Remaining</span>
                        </div>
                    </div>

                    <el-button type="primary"
                               class="start-review-button"
                               :disabled="!nextPendingEntry"
                               @click="startAudit">
                        {{ nextPendingEntry ? 'Start / Continue Audit' : 'Review Complete' }}
                        <el-icon><ArrowRight /></el-icon>
                    </el-button>
                </el-card>
            </div>

            <el-card shadow="never" class="panel entries-panel">
                <template #header>
                    <div class="panel-header entries-header">
                        <div>
                            <strong>Point Entries</strong>
                            <span>{{ report.entries.length }} assignments in this session</span>
                        </div>
                    </div>
                </template>

                <el-empty v-if="report.entries.length === 0"
                          description="No points were assigned during this session" />

                <template v-else>
                    <div class="desktop-table">
                        <el-table :data="report.entries"
                                  row-key="id"
                                  class="clickable-table"
                                  @row-click="openReview">
                            <el-table-column label="Time" width="120">
                                <template #default="scope">
                                    {{ formatTime(scope.row.dateAssign) }}
                                </template>
                            </el-table-column>

                            <el-table-column label="Customer" min-width="220">
                                <template #default="scope">
                                    <div class="customer-cell">
                                        <strong>{{ scope.row.customerName }}</strong>
                                        <span>{{ scope.row.customerPhone || `Customer #${scope.row.customerId}` }}</span>
                                    </div>
                                </template>
                            </el-table-column>

                            <el-table-column label="Machine" width="130" align="center">
                                <template #default="scope">
                                    {{ machineLabel(scope.row) }}
                                </template>
                            </el-table-column>

                            <el-table-column label="Points" width="100" align="center">
                                <template #default="scope">
                                    <el-tag type="success" effect="light">
                                        {{ number(scope.row.points) }}
                                    </el-tag>
                                </template>
                            </el-table-column>

                            <el-table-column label="Photo" width="90" align="center">
                                <template #default="scope">
                                    <el-image v-if="scope.row.imageUrl"
                                              class="proof-image"
                                              :src="scope.row.imageUrl"
                                              fit="cover"
                                              @click.stop="openReview(scope.row)" />
                                    <span v-else class="muted">None</span>
                                </template>
                            </el-table-column>

                            <el-table-column label="Review" width="130" align="center">
                                <template #default="scope">
                                    <el-tag :type="reviewTagType(scope.row.reviewStatus)" effect="light">
                                        {{ scope.row.reviewStatus || 'Pending' }}
                                    </el-tag>
                                </template>
                            </el-table-column>

                            <el-table-column width="90" align="center">
                                <template #default="scope">
                                    <el-button link type="primary" @click.stop="openReview(scope.row)">
                                        Review
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>

                    <div class="mobile-list">
                        <div v-for="entry in report.entries"
                             :key="entry.id"
                             class="entry-card"
                             @click="openReview(entry)">
                            <div class="entry-top">
                                <div>
                                    <strong>{{ entry.customerName }}</strong>
                                    <span>{{ formatTime(entry.dateAssign) }}</span>
                                </div>
                                <el-tag :type="reviewTagType(entry.reviewStatus)" effect="light">
                                    {{ entry.reviewStatus || 'Pending' }}
                                </el-tag>
                            </div>

                            <div class="entry-meta">
                                <span>{{ machineLabel(entry) }}</span>
                                <span>{{ number(entry.points) }} pts</span>
                                <span>{{ entry.checkinId ? `Check-in #${entry.checkinId}` : 'No check-in ID' }}</span>
                            </div>

                            <el-image v-if="entry.imageUrl"
                                      class="mobile-proof-image"
                                      :src="entry.imageUrl"
                                      fit="cover"
                                      @click.stop="openReview(entry)" />

                            <div v-else class="mobile-no-photo">
                                <el-icon><Picture /></el-icon>
                                <span>No photo attached</span>
                            </div>
                        </div>
                    </div>
                </template>
            </el-card>
        </template>

        <el-drawer v-model="reviewDrawerOpen"
                   :size="drawerSize"
                   :with-header="false"
                   destroy-on-close
                   class="review-drawer">
            <div v-if="selectedEntry" class="audit-shell">
                <div class="audit-header">
                    <div>
                        <span class="audit-kicker">POINTS AUDIT</span>
                        <strong>{{ selectedIndex + 1 }} of {{ report?.entries?.length || 0 }}</strong>
                    </div>

                    <div class="audit-header-actions">
                        <span>{{ report?.summary?.reviewedCount || 0 }}/{{ report?.summary?.assignmentCount || 0 }} reviewed</span>
                        <el-button text circle @click="reviewDrawerOpen = false">
                            <el-icon><Close /></el-icon>
                        </el-button>
                    </div>
                </div>

                <div class="audit-content">
                    <div class="audit-photo-pane">
                        <div v-if="selectedEntry.imageUrl" class="audit-photo-frame">
                            <span class="photo-sequence">#{{ selectedIndex + 1 }}</span>
                            <el-image class="audit-image"
                                      :src="selectedEntry.imageUrl"
                                      :preview-src-list="[selectedEntry.imageUrl]"
                                      fit="contain"
                                      preview-teleported />
                        </div>

                        <div v-else class="audit-photo-missing">
                            <el-icon><Picture /></el-icon>
                            <strong>No photo attached</strong>
                            <span>This entry cannot be approved or rejected until photo evidence exists.</span>
                        </div>
                    </div>

                    <div class="audit-detail-pane">
                        <div class="audit-customer">
                            <span>CUSTOMER</span>
                            <h2>{{ selectedEntry.customerName }}</h2>
                            <el-tag :type="reviewTagType(selectedEntry.reviewStatus)" effect="light" class="review-status-tag">
                                {{ selectedEntry.reviewStatus || 'Pending' }}
                            </el-tag>
                        </div>

                        <div class="points-box">
                            <span>POINTS</span>
                            <strong>{{ number(selectedEntry.points) }}</strong>
                        </div>

                        <div class="audit-meta-grid">
                            <div>
                                <span>MACHINE</span>
                                <strong>{{ selectedEntry.machineNumber ?? selectedEntry.machineId ?? '—' }}</strong>
                            </div>
                            <div>
                                <span>TIME</span>
                                <strong>{{ formatTime(selectedEntry.dateAssign) }}</strong>
                            </div>
                        </div>

                        <div v-if="selectedEntry.reviewedAt" class="reviewed-meta">
                            <el-icon><CircleCheckFilled /></el-icon>
                            <div>
                                <strong>Reviewed by {{ selectedEntry.reviewedByName || `User #${selectedEntry.reviewedBy}` }}</strong>
                                <span>{{ formatDateTime(selectedEntry.reviewedAt) }}</span>
                            </div>
                        </div>

                        <div class="audit-actions">
                            <el-button size="large"
                                       type="danger"
                                       plain
                                       :loading="reviewSaving === 'Rejected'"
                                       :disabled="!selectedEntry.imageUrl || reviewSaving !== ''"
                                       @click="saveReview('Rejected')">
                                <el-icon><CloseBold /></el-icon>
                                Reject
                            </el-button>

                            <el-button size="large"
                                       type="success"
                                       :loading="reviewSaving === 'Approved'"
                                       :disabled="!selectedEntry.imageUrl || reviewSaving !== ''"
                                       @click="saveReview('Approved')">
                                Approve
                                <el-icon><Check /></el-icon>
                            </el-button>
                        </div>

                        <div class="audit-navigation">
                            <el-button :disabled="selectedIndex <= 0" @click="moveReview(-1)">
                                <el-icon><ArrowLeft /></el-icon>
                                Previous
                            </el-button>
                            <el-button :disabled="selectedIndex >= (report?.entries?.length || 0) - 1"
                                       @click="moveReview(1)">
                                Next
                                <el-icon><ArrowRight /></el-icon>
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </el-drawer>
    </div>
</template>

<script setup>
    import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { ElMessage } from 'element-plus'
    import {
        ArrowLeft,
        ArrowRight,
        Check,
        CircleCheckFilled,
        Clock,
        Close,
        CloseBold,
        Coin,
        DataAnalysis,
        Picture,
        Refresh
    } from '@element-plus/icons-vue'
    import { useUserStore } from '@/store/modules/user'
    import {
        getEmployeeSessionPointsReport,
        updateCustomerMatchReview
    } from '@/api/employeeSession'

    const route = useRoute()
    const router = useRouter()
    const userStore = useUserStore()

    const loading = ref(false)
    const report = ref(null)
    const reviewDrawerOpen = ref(false)
    const selectedEntry = ref(null)
    const reviewSaving = ref('')
    const viewportWidth = ref(window.innerWidth)

    const selectedIndex = computed(() => {
        if (!selectedEntry.value || !report.value?.entries) return -1
        return report.value.entries.findIndex((entry) => entry.id === selectedEntry.value.id)
    })

    const drawerSize = computed(() => {
        if (viewportWidth.value <= 700) return '100%'
        if (viewportWidth.value <= 1100) return '88%'
        return '72%'
    })

    const reviewProgress = computed(() => {
        const total = Number(report.value?.summary?.assignmentCount || 0)
        const reviewed = Number(report.value?.summary?.reviewedCount || 0)
        if (!total) return 0
        return Math.round((reviewed / total) * 100)
    })

    const nextPendingEntry = computed(() => {
        return report.value?.entries?.find((entry) => !entry.reviewStatus || entry.reviewStatus === 'Pending') || null
    })

    function initials(name) { return String(name || 'E').split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() }

    function number(value) {
        return Number(value || 0).toLocaleString()
    }

    function formatDateTime(value) {
        if (!value) return '—'
        return new Date(value).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    }

    function formatTime(value) {
        if (!value) return '—'
        return new Date(value).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
        })
    }

    function machineLabel(entry) {
        if (entry?.machineNumber !== null && entry?.machineNumber !== undefined) {
            return `Machine #${entry.machineNumber}`
        }

        if (entry?.machineId) {
            return `Machine ID #${entry.machineId}`
        }

        return '—'
    }

    function formatDuration(item) {
        let hours = Number(item.totalWorkingHours || 0)
        if (!item.clockOut && item.clockIn) {
            hours = Math.max(0, (Date.now() - new Date(item.clockIn).getTime()) / 3600000)
        }
        const whole = Math.floor(hours)
        const minutes = Math.round((hours - whole) * 60)
        return `${whole}h ${minutes}m`
    }

    function reviewTagType(status) {
        if (status === 'Approved') return 'success'
        if (status === 'Rejected') return 'danger'
        return 'warning'
    }

    function openReview(entry) {
        selectedEntry.value = entry
        reviewDrawerOpen.value = true
    }

    function startAudit() {
        if (nextPendingEntry.value) openReview(nextPendingEntry.value)
    }

    function moveReview(direction) {
        const index = selectedIndex.value + direction
        if (!report.value?.entries?.[index]) return
        selectedEntry.value = report.value.entries[index]
    }

    function updateSummaryAfterReview(previousStatus, newStatus) {
        if (!report.value?.summary || previousStatus === newStatus) return

        const summary = report.value.summary

        if (previousStatus === 'Approved') summary.approvedCount = Math.max(0, Number(summary.approvedCount || 0) - 1)
        else if (previousStatus === 'Rejected') summary.rejectedCount = Math.max(0, Number(summary.rejectedCount || 0) - 1)
        else summary.pendingReview = Math.max(0, Number(summary.pendingReview || 0) - 1)

        if (newStatus === 'Approved') summary.approvedCount = Number(summary.approvedCount || 0) + 1
        if (newStatus === 'Rejected') summary.rejectedCount = Number(summary.rejectedCount || 0) + 1

        summary.reviewedCount = Number(summary.approvedCount || 0) + Number(summary.rejectedCount || 0)
    }

    async function saveReview(status) {
        if (!selectedEntry.value?.id || !selectedEntry.value?.imageUrl) return

        try {
            reviewSaving.value = status
            const previousStatus = selectedEntry.value.reviewStatus || 'Pending'

            const response = await updateCustomerMatchReview(selectedEntry.value.id, {
                status,
                locationid: userStore.locationId
            })

            const updated = response?.data
            if (!updated) throw new Error('Review update failed.')

            const entry = report.value.entries.find((item) => item.id === selectedEntry.value.id)
            if (entry) {
                entry.reviewStatus = updated.reviewStatus
                entry.reviewedBy = updated.reviewedBy
                entry.reviewedAt = updated.reviewedAt
                entry.reviewedByName = updated.reviewedByName
                selectedEntry.value = entry
            }

            updateSummaryAfterReview(previousStatus, status)
            ElMessage.success(status === 'Approved' ? 'Photo approved.' : 'Photo rejected.')
        } catch (error) {
            console.error(error)
            ElMessage.error(error?.message || 'Unable to update photo review.')
        } finally {
            reviewSaving.value = ''
        }
    }

    async function loadReport() {
        try {
            loading.value = true
            const selectedId = selectedEntry.value?.id

            const response = await getEmployeeSessionPointsReport(
                Number(route.params.sessionId),
                userStore.locationId
            )

            report.value = response?.data || null

            if (selectedId && report.value?.entries) {
                const refreshedEntry = report.value.entries.find((entry) => entry.id === selectedId)
                if (refreshedEntry) selectedEntry.value = refreshedEntry
            }
        } catch (error) {
            console.error(error)
            ElMessage.error(error?.message || 'Unable to load points report.')
        } finally {
            loading.value = false
        }
    }

    function handleResize() {
        viewportWidth.value = window.innerWidth
    }

    onMounted(() => {
        window.addEventListener('resize', handleResize)
        loadReport()
    })

    onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize)
    })
</script>

<style scoped>
    .report-page {
        padding: 20px;
    }

    .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 16px;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
    }

    .report-page .page-header .header-left .back-button {
        flex: 0 0 38px !important;
        width: 38px !important;
        height: 38px !important;
        min-width: 38px !important;
        min-height: 38px !important;
        padding: 0 !important;
        border-radius: 50% !important;
        font-size: 18px !important;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1;
    }

        .report-page .page-header .header-left .back-button :deep(.el-icon) {
            font-size: 18px;
            margin: 0;
        }

    .page-header h1 {
        margin: 0;
        font-size: 23px;
    }

    .page-header p {
        margin: 4px 0 0;
        color: var(--el-text-color-secondary);
        font-size: 13px;
    }
    /* Same static, compact employee banner as Session Reports. */
    .irfan-report-banner, .report-page .irfan-report-banner:hover, .report-page .irfan-report-banner:active {
        background: linear-gradient(135deg, #1e2447, #11162f) !important;
        color: #fff;
        border-color: transparent !important;
        border-radius: 14px;
        margin-bottom: 18px;
        transform: none !important;
        transition: none !important;
        box-shadow: none !important;
        cursor: default !important;
    }

        .irfan-report-banner :deep(.el-card__body) {
            padding: 18px 20px !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 28px;
        }

    .irfan-report-profile {
        display: flex;
        align-items: center;
        gap: 14px;
        flex: 1 1 auto;
        min-width: 0;
    }

    .irfan-report-banner .irfan-report-profile > :deep(.el-avatar) {
        width: 54px !important;
        height: 54px !important;
        min-width: 54px !important;
        min-height: 54px !important;
        flex: 0 0 54px !important;
        border-radius: 50% !important;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        line-height: 1;
        font-size: 18px;
        font-weight: 600;
        color: #fff;
        background: #59618d;
    }

    .irfan-report-banner .irfan-report-profile > :deep(.el-avatar img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    }

    .irfan-report-profile-text {
        min-width: 0;
    }

        .irfan-report-profile-text strong, .irfan-report-profile-text span {
            display: block;
        }

        .irfan-report-profile-text strong {
            color: #fff;
            font-size: 18px;
        }

        .irfan-report-profile-text span {
            color: #c7cbea;
            font-size: 12px;
            margin-top: 4px;
        }

    .irfan-report-banner .session-grid {
        display: grid;
        grid-template-columns: max-content max-content max-content;
        gap: 28px;
        flex: 0 0 auto;
        width: auto;
        margin-left: auto !important;
        margin-top: 0;
        padding-top: 0;
        border-top: 0;
        justify-items: end;
        text-align: right;
        min-width: 0;
    }

        .irfan-report-banner .session-grid > div {
            min-width: 0;
        }

        .irfan-report-banner .session-grid span, .irfan-report-banner .session-grid strong {
            display: block;
        }

        .irfan-report-banner .session-grid span {
            color: #c7cbea;
            font-size: 12px;
            margin-bottom: 7px;
        }

        .irfan-report-banner .session-grid strong {
            color: #fff;
            font-size: 15px;
            overflow-wrap: anywhere;
        }
    /* Approved compact Point by Date summary tiles. */
    .metric-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 15px;
        margin-bottom: 20px;
    }

    .metric-card {
        --accent: #409eff;
        --accent-soft: rgba(64,158,255,.11);
        min-width: 0;
        overflow: hidden !important;
        border-radius: 14px;
        background: var(--el-bg-color,#fff);
        border: 1px solid var(--el-border-color-lighter);
        transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
    }

        .metric-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 28px rgba(0,0,0,.08);
            border-color: color-mix(in srgb, var(--accent) 25%, transparent);
        }

        .metric-card :deep(.el-card__body) {
            padding: 16px 12px !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: hidden !important;
        }

    .metric-layout {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
    }

    .metric-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
        border-radius: 12px;
        color: var(--accent);
        background: var(--accent-soft);
        transition: transform .25s ease;
    }

    .metric-card:hover .metric-icon {
        transform: scale(1.05);
    }

    .metric-icon .el-icon, .metric-icon .el-icon svg {
        width: 24px;
        height: 24px;
        font-size: 23px;
    }

    .metric-copy {
        flex: 1;
        min-width: 0;
    }

        .metric-copy span {
            display: block;
            margin-bottom: 5px;
            color: var(--el-text-color-secondary);
            font-size: 12px;
            font-weight: 500;
            line-height: 1.3;
        }

        .metric-copy strong {
            display: block;
            color: var(--el-text-color-primary);
            font-size: 24px;
            font-weight: 700;
            line-height: 1.1;
        }

    .metric-matches {
        --accent: #40c9c6;
        --accent-soft: rgba(64,201,198,.11);
    }

    .metric-approved {
        --accent: #67c23a;
        --accent-soft: rgba(103,194,58,.11);
    }

    .metric-pending {
        --accent: #e6a23c;
        --accent-soft: rgba(230,162,60,.11);
    }

    .report-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 15px;
        margin-bottom: 20px;
    }

    .panel {
        min-width: 0;
        border-radius: 14px;
    }

    .panel-header strong, .panel-header span {
        display: block;
    }

    .panel-header span {
        color: var(--el-text-color-secondary);
        font-size: 12px;
        margin-top: 4px;
    }

    .breakdown-list {
        display: flex;
        flex-direction: column;
    }

    .breakdown-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 11px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

        .breakdown-row:last-child {
            border-bottom: 0;
        }

        .breakdown-row strong, .breakdown-row span {
            display: block;
        }

        .breakdown-row span {
            color: var(--el-text-color-secondary);
            font-size: 12px;
            margin-top: 3px;
        }

    .review-stats {
        display: grid;
        grid-template-columns: repeat(3,minmax(0,1fr));
        gap: 10px;
        margin: 18px 0;
    }

    .review-stat {
        text-align: center;
        padding: 12px 6px;
        border-radius: 10px;
        background: var(--el-fill-color-light);
    }

        .review-stat strong, .review-stat span {
            display: block;
        }

        .review-stat strong {
            font-size: 21px;
        }

        .review-stat span {
            font-size: 12px;
            color: var(--el-text-color-secondary);
        }

        .review-stat.approved strong {
            color: var(--el-color-success);
        }

        .review-stat.rejected strong {
            color: var(--el-color-danger);
        }

        .review-stat.pending strong {
            color: var(--el-color-warning);
        }

    .start-review-button {
        width: 100%;
    }

    .clickable-table :deep(.el-table__row) {
        cursor: pointer;
    }

    .customer-cell strong, .customer-cell span {
        display: block;
    }

    .customer-cell span, .muted {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }

    .proof-image {
        width: 46px;
        height: 42px;
        border-radius: 6px;
        cursor: pointer;
    }

    .mobile-list {
        display: none;
    }
    /* Photo review drawer */
    .audit-shell {
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .audit-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 18px 22px;
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

        .audit-header strong, .audit-kicker {
            display: block;
        }

    .audit-kicker {
        font-size: 11px;
        color: var(--el-text-color-secondary);
        letter-spacing: .08em;
    }

    .audit-header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
    }

    .audit-content {
        display: grid;
        grid-template-columns: minmax(0,1.2fr) minmax(280px,1fr);
        flex: 1;
        min-height: 0;
    }

    .audit-photo-pane {
        display: grid;
        place-items: center;
        min-width: 0;
        min-height: 260px;
        padding: 20px;
        background: var(--el-fill-color-light);
    }

    .audit-photo-frame {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 260px;
        display: grid;
        place-items: center;
    }

    .photo-sequence {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 1;
        background: rgba(0,0,0,.6);
        color: #fff;
        border-radius: 6px;
        padding: 4px 8px;
    }

    .audit-image {
        width: 100%;
        height: 100%;
        max-height: 70vh;
    }

    .audit-photo-missing {
        text-align: center;
        color: var(--el-text-color-secondary);
    }

        .audit-photo-missing .el-icon {
            display: block;
            margin: 0 auto 12px;
            font-size: 34px;
        }

        .audit-photo-missing strong, .audit-photo-missing span {
            display: block;
            margin-top: 8px;
        }

    .audit-detail-pane {
        padding: 24px;
        overflow-y: auto;
        min-width: 0;
    }

    .audit-customer > span, .points-box span, .audit-meta-grid span {
        display: block;
        font-size: 11px;
        color: var(--el-text-color-secondary);
    }

    .audit-customer h2 {
        margin: 6px 0 10px;
    }

    .points-box {
        padding: 16px;
        border-radius: 12px;
        background: var(--el-color-primary-light-9);
        margin: 18px 0;
    }

        .points-box strong {
            display: block;
            font-size: 28px;
            margin-top: 4px;
        }

    .audit-meta-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 14px;
    }

        .audit-meta-grid strong {
            display: block;
            margin-top: 5px;
        }

    .reviewed-meta {
        display: flex;
        gap: 8px;
        margin-top: 18px;
        color: var(--el-color-success);
    }

        .reviewed-meta strong, .reviewed-meta span {
            display: block;
        }

        .reviewed-meta span {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            margin-top: 4px;
        }

    .audit-actions, .audit-navigation {
        display: flex;
        gap: 10px;
        margin-top: 20px;
    }

        .audit-actions .el-button, .audit-navigation .el-button {
            flex: 1;
            min-width: 0;
            margin-left: 0;
        }

    @media (max-width: 1100px) {
        .metric-grid {
            grid-template-columns: repeat(2,minmax(0,1fr));
        }
    }

    @media (max-width: 1024px) {
        .irfan-report-banner :deep(.el-card__body) {
            display: block;
            padding: 16px !important;
        }

        .irfan-report-banner .session-grid {
            width: 100%;
            grid-template-columns: repeat(2,minmax(0,1fr));
            gap: 12px;
            margin: 12px 0 0 !important;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,.2);
        }
    }

    @media (max-width: 700px) {
        .report-page {
            padding: 12px;
        }

        .report-grid {
            grid-template-columns: 1fr;
        }

        .desktop-table {
            display: none;
        }

        .mobile-list {
            display: grid;
            gap: 10px;
        }

        .entry-card {
            padding: 12px;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 10px;
            cursor: pointer;
        }

        .entry-top {
            display: flex;
            justify-content: space-between;
            gap: 8px;
        }

            .entry-top strong, .entry-top span {
                display: block;
            }

            .entry-top span {
                font-size: 12px;
                color: var(--el-text-color-secondary);
                margin-top: 4px;
            }

        .entry-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 6px 12px;
            font-size: 12px;
            margin: 10px 0;
        }

        .mobile-proof-image {
            width: 100%;
            height: 130px;
            border-radius: 8px;
        }

        .mobile-no-photo {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--el-text-color-secondary);
            font-size: 12px;
        }

        .audit-content {
            grid-template-columns: 1fr;
            overflow-y: auto;
        }

        .audit-photo-pane {
            min-height: 240px;
        }

        .audit-photo-frame {
            height: 240px;
            min-height: 240px;
        }

        .audit-detail-pane {
            overflow: visible;
            padding: 16px;
        }
    }

    @media (max-width: 550px) {
        .metric-card :deep(.el-card__body) {
            padding: 12px 9px !important;
        }

        .metric-layout {
            gap: 8px;
        }

        .metric-icon {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
            border-radius: 10px;
        }

            .metric-icon .el-icon, .metric-icon .el-icon svg {
                width: 20px;
                height: 20px;
                font-size: 20px;
            }

        .metric-copy span {
            font-size: 11px;
        }

        .metric-copy strong {
            font-size: 21px;
        }

        .irfan-report-banner .session-grid strong {
            font-size: 13px;
        }
    }
</style>
