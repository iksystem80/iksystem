<template>
    <div class="app-container">
        <div class="page-header"><div class="header-left"><el-button class="back-button" circle aria-label="Back" @click="router.back()"><el-icon><ArrowLeft /></el-icon></el-button><div><h1>Session # {{ session?.id || route.params.sessionId }}</h1><p v-if="session">{{ session.employeeName }}</p></div></div></div>
        <el-skeleton v-if="loading" :rows="7" animated />
        <template v-else-if="session">
            <el-card shadow="never" class="session-card session-banner irfan-report-banner">
                <div class="irfan-report-profile">
                    <el-avatar :size="54" :src="session.employeeAvatar">{{ initials(session.employeeName) }}</el-avatar>
                    <div class="irfan-report-profile-text"><strong>{{ session.employeeName || 'Employee' }}</strong><span>Session # {{ session.id }}</span></div>
                </div>
                <div class="session-grid">
                    <div><span>Clock In</span><strong>{{ formatDateTime(session.clockIn) }}</strong></div>
                    <div><span>Clock Out</span><strong>{{ session.clockOut ? formatDateTime(session.clockOut) : 'In Progress' }}</strong></div>
                    <div><span>Duration</span><strong>{{ formatDuration(session) }}</strong></div>
                </div>
            </el-card>
            <div class="section-title"><h2>Session Reports</h2><p>Select a report to view session activity.</p></div>
            <div class="report-grid">
                <button class="report-option active" type="button" @click="openPointsReport"><div class="report-icon points"><el-icon><Coin /></el-icon></div><div class="report-copy"><strong>Points Report</strong><span>Review points assigned to customers during this session.</span><div class="mini-stats"><span>{{ session.pointEntries }} entries</span><span>{{ Number(session.totalPoints || 0).toLocaleString() }} points</span></div></div><el-icon class="arrow"><ArrowRight /></el-icon></button>
                <button class="report-option active" type="button" @click="openShiftReport"><div class="report-icon shift"><el-icon><Wallet /></el-icon></div><div class="report-copy"><strong>Shift Report</strong><span>Opening cash, points, expenses, additional cash, withdrawals, closing and handover.</span><div class="mini-stats"><span>{{ session.clockOut ? 'Closed shift' : 'Shift in progress' }}</span><span>{{ session.pointEntries }} point entries</span></div></div><el-icon class="arrow"><ArrowRight /></el-icon></button>
                <button v-for="name in ['Bonus Reports', 'Ticket Out Reports', 'Raffle Reports']" :key="name" class="report-option disabled" type="button" disabled><div class="report-icon"><el-icon><Document /></el-icon></div><div class="report-copy"><strong>{{ name }}</strong><span>More session reports can be added later.</span></div><el-tag type="info" effect="plain" size="small">Coming Later</el-tag></button>
            </div>
        </template>
    </div>
</template>
<script setup>
    import { onMounted, ref } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { ElMessage } from 'element-plus'
    import { ArrowLeft, ArrowRight, Coin, Document, Wallet } from '@element-plus/icons-vue'
    import { useUserStore } from '@/store/modules/user'
    import { getEmployeeSessionReport } from '@/api/employeeSession'
    const route = useRoute(), router = useRouter(), userStore = useUserStore()
    const loading = ref(false), session = ref(null)
    function initials(name) { return String(name || 'E').split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() }
    function formatDateTime(value) { if (!value) return '—'; return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) }
    function formatDuration(item) { let hours = Number(item.totalWorkingHours || 0); if (!item.clockOut && item.clockIn) hours = Math.max(0, (Date.now() - new Date(item.clockIn).getTime()) / 3600000); const minutes = Math.round(hours * 60); return `${Math.floor(minutes / 60)}h ${minutes % 60}m` }
    function openPointsReport() { router.push({ name: 'EmployeeSessionPointsReport', params: { employeeId: route.params.employeeId, sessionId: route.params.sessionId } }) }
    function openShiftReport() { router.push({ name: 'EmployeeSessionShiftReport', params: { employeeId: route.params.employeeId, sessionId: route.params.sessionId } }) }
    async function loadSession() { try { loading.value = true; const response = await getEmployeeSessionReport(Number(route.params.sessionId), userStore.locationId); session.value = response?.data || null } catch (error) { console.error(error); ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to load session reports.') } finally { loading.value = false } }
    onMounted(loadSession)
</script>
<style scoped>
    /* Match the approved Employee Sessions back button exactly. */
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
    /* Keep the dark banner compact and prevent global avatar styles from distorting initials. */
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

    .irfan-report-banner :deep(.el-card__body) {
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
    }
    /* Isolated banner styles avoid shared project CSS stretching the card. */
    .irfan-report-banner {
        background: linear-gradient(135deg, #1e2447, #11162f);
        border-color: transparent;
        border-radius: 14px;
        color: #fff;
        margin-bottom: 18px;
    }

        .irfan-report-banner :deep(.el-card__body) {
            padding: 18px 20px;
            display: flex;
            align-items: center;
            gap: 28px;
            min-height: 0;
        }

    .irfan-report-profile {
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 0;
        flex: 1 1 auto;
        min-width: 0;
    }

        .irfan-report-profile > .el-avatar {
            flex: 0 0 54px;
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
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 24px;
        flex: 0 1 650px;
        margin-left: auto;
        min-width: 0;
        margin-top: 0;
        padding-top: 0;
        border-top: 0;
        min-height: 0;
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

    .report-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }

    .report-option {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        width: 100%;
        text-align: left;
        padding: 16px;
        border: 1px solid var(--el-border-color);
        border-radius: 12px;
        background: var(--el-bg-color);
        color: var(--el-text-color-primary);
        font: inherit;
    }

        .report-option.active {
            cursor: pointer;
        }

            .report-option.active:hover {
                border-color: var(--el-color-primary);
            }

        .report-option.disabled {
            opacity: .65;
            cursor: not-allowed;
        }

    .report-icon {
        display: grid;
        place-items: center;
        flex: 0 0 40px;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: var(--el-fill-color-light);
        font-size: 20px;
    }

        .report-icon.points {
            color: var(--el-color-warning);
        }

        .report-icon.shift {
            color: var(--el-color-primary);
        }

    .report-copy {
        flex: 1;
        min-width: 0;
    }

        .report-copy strong, .report-copy > span {
            display: block;
        }

        .report-copy > span, .mini-stats {
            color: var(--el-text-color-secondary);
            font-size: 12px;
            margin-top: 5px;
        }

    .mini-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 14px;
    }

    .arrow {
        flex-shrink: 0;
    }

    .section-title {
        margin: 18px 0 12px;
    }

        .section-title h2 {
            margin: 0;
        }

        .section-title p {
            margin: 4px 0 0;
            color: var(--el-text-color-secondary);
        }

    @media (max-width: 1024px) {
        .irfan-report-banner :deep(.el-card__body) {
            display: block;
            padding: 16px;
        }

        .irfan-report-profile {
            flex: none;
        }

        .irfan-report-banner .session-grid {
            flex: none;
            margin-left: 0;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,.2);
        }
    }

    @media (max-width: 600px) {
        .report-grid {
            grid-template-columns: 1fr;
        }

        .irfan-report-banner .session-grid {
            gap: 14px 12px;
        }

            .irfan-report-banner .session-grid strong {
                font-size: 13px;
            }

        .report-option {
            padding: 12px;
        }
    }

    /* Static banner: override shared session-card hover lift and shadow. */
    .report-page .irfan-report-banner,
    .report-page .irfan-report-banner:hover,
    .report-page .irfan-report-banner:active {
        transform: none !important;
        transition: none !important;
        box-shadow: none !important;
        border-color: transparent !important;
        cursor: default !important;
    }
    /* Keep the employee on the left and the three session details on the right. */
    .irfan-report-banner :deep(.el-card__body) {
        justify-content: space-between !important;
    }

    .irfan-report-banner .irfan-report-profile {
        flex: 1 1 auto;
    }

    .irfan-report-banner .session-grid {
        flex: 0 0 auto;
        width: auto;
        grid-template-columns: max-content max-content max-content;
        column-gap: 28px;
        margin-left: auto !important;
        justify-items: end;
        text-align: right;
    }

    @media (max-width: 1024px) {
        .irfan-report-banner .session-grid {
            width: 100%;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            margin-left: 0 !important;
            justify-items: end;
            text-align: right;
        }
    }
</style>
