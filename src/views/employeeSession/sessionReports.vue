<template>
    <div class="report-page">
        <div class="page-header">
            <div class="header-left">
                <el-button class="back-button" circle aria-label="Back" @click="router.back()"><el-icon><ArrowLeft /></el-icon></el-button>
                <div><h1>Session # {{ session?.id || route.params.sessionId }}</h1><p v-if="session">{{ session.employeeName }}</p></div>
            </div>
        </div>
        <el-skeleton v-if="loading" :rows="7" animated />
        <template v-else-if="session">
            <el-card shadow="never" class="session-card">
                <div class="session-grid">
                    <div><span>Employee</span><strong>{{ session.employeeName }}</strong></div>
                    <div><span>Clock In</span><strong>{{ formatDateTime(session.clockIn) }}</strong></div>
                    <div><span>Clock Out</span><strong>{{ session.clockOut ? formatDateTime(session.clockOut) : 'In Progress' }}</strong></div>
                    <div><span>Duration</span><strong>{{ formatDuration(session) }}</strong></div>
                </div>
            </el-card>
            <div class="section-title"><h2>Session Reports</h2><p>Select a report to view session activity.</p></div>
            <div class="report-grid">
                <button class="report-option active" type="button" @click="openPointsReport">
                    <div class="report-icon points"><el-icon><Coin /></el-icon></div>
                    <div class="report-copy">
                        <strong>Points Report</strong><span>Review points assigned to customers during this session.</span>
                        <div class="mini-stats"><span>{{ session.pointEntries }} entries</span><span>{{ Number(session.totalPoints || 0).toLocaleString() }} points</span></div>
                    </div><el-icon class="arrow"><ArrowRight /></el-icon>
                </button>
                <button class="report-option active" type="button" @click="openShiftReport">
                    <div class="report-icon shift"><el-icon><Wallet /></el-icon></div>
                    <div class="report-copy">
                        <strong>Shift Report</strong><span>Opening cash, points, expenses, additional cash, withdrawals, closing and handover.</span>
                        <div class="mini-stats"><span>{{ session.clockOut ? 'Closed shift' : 'Shift in progress' }}</span><span>{{ session.pointEntries }} point entries</span></div>
                    </div><el-icon class="arrow"><ArrowRight /></el-icon>
                </button>
                <button class="report-option disabled" type="button" disabled><div class="report-icon"><el-icon><Document /></el-icon></div><div class="report-copy"><strong>Bonus Reports</strong><span>More session reports can be added later.</span></div><el-tag type="info" effect="plain" size="small">Coming Later</el-tag></button>
                <button class="report-option disabled" type="button" disabled><div class="report-icon"><el-icon><Document /></el-icon></div><div class="report-copy"><strong>Ticket Out Reports</strong><span>More session reports can be added later.</span></div><el-tag type="info" effect="plain" size="small">Coming Later</el-tag></button>
                <button class="report-option disabled" type="button" disabled><div class="report-icon"><el-icon><Document /></el-icon></div><div class="report-copy"><strong>Raffle Reports</strong><span>More session reports can be added later.</span></div><el-tag type="info" effect="plain" size="small">Coming Later</el-tag></button>
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
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const session = ref(null)
function formatDateTime(value) { if (!value) return '—'; return new Date(value).toLocaleString([], {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) }
function formatDuration(item) {
      let hours = Number(item.totalWorkingHours || 0)
      if (!item.clockOut && item.clockIn) hours = Math.max(0,(Date.now()-new Date(item.clockIn).getTime())/3600000)
      const minutes = Math.round(hours * 60)
      return `${Math.floor(minutes/60)}h ${minutes%60}m`
}
function openPointsReport() { router.push({name:'EmployeeSessionPointsReport',params:{employeeId:route.params.employeeId,sessionId:route.params.sessionId}}) }
function openShiftReport() { router.push({name:'EmployeeSessionShiftReport',params:{employeeId:route.params.employeeId,sessionId:route.params.sessionId}}) }
async function loadSession() {
      try { loading.value = true; const response = await getEmployeeSessionReport(Number(route.params.sessionId),userStore.locationId); session.value = response?.data || null }
      catch(error) { console.error(error); ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to load session reports.') }
      finally { loading.value = false }
}
onMounted(loadSession)
</script>
<style scoped>
    .report-page {
        padding: 20px
    }

    .page-header, .header-left {
        display: flex;
        align-items: center
    }

    .page-header {
        justify-content: space-between;
        margin-bottom: 16px
    }

    .header-left {
        gap: 12px
    }

    .back-button {
        width: 38px;
        height: 38px;
        flex: 0 0 auto;
        padding: 0;
        border-radius: 50%;
        font-size: 18px
    }

    .page-header h1 {
        margin: 0;
        font-size: 23px
    }

    .page-header p {
        margin: 4px 0 0;
        color: var(--el-text-color-secondary);
        font-size: 13px
    }

    .session-card {
        border-radius: 14px
    }

    .session-grid {
        display: grid;
        grid-template-columns: repeat(4,minmax(0,1fr));
        gap: 18px
    }

        .session-grid span, .session-grid strong {
            display: block
        }

        .session-grid span {
            color: var(--el-text-color-secondary);
            font-size: 11px
        }

        .session-grid strong {
            margin-top: 5px;
            font-size: 13px
        }

    .section-title {
        margin: 24px 0 12px
    }

        .section-title h2 {
            margin: 0;
            font-size: 18px
        }

        .section-title p {
            margin: 5px 0 0;
            color: var(--el-text-color-secondary);
            font-size: 13px
        }

    .report-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 14px
    }

    .report-option {
        min-height: 120px;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 15px;
        background: var(--el-bg-color);
        text-align: left
    }

        .report-option.active {
            cursor: pointer;
            transition: border-color .18s ease,transform .18s ease,box-shadow .18s ease
        }

            .report-option.active:hover {
                transform: translateY(-1px);
                border-color: var(--el-color-primary-light-5);
                box-shadow: 0 10px 24px rgba(0,0,0,.05)
            }

        .report-option.disabled {
            opacity: .65;
            cursor: not-allowed
        }

    .report-icon {
        width: 48px;
        height: 48px;
        flex: 0 0 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 13px;
        background: var(--el-fill-color-light);
        font-size: 21px
    }

        .report-icon.points {
            color: var(--el-color-primary);
            background: var(--el-color-primary-light-9)
        }

        .report-icon.shift {
            color: var(--el-color-success);
            background: var(--el-color-success-light-9)
        }

    .report-copy {
        flex: 1;
        min-width: 0
    }

        .report-copy strong, .report-copy > span {
            display: block
        }

        .report-copy > span {
            margin-top: 5px;
            color: var(--el-text-color-secondary);
            font-size: 12px;
            line-height: 1.45
        }

    .mini-stats {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 10px;
        color: var(--el-text-color-regular);
        font-size: 11px
    }

    .arrow {
        color: var(--el-text-color-secondary)
    }

    @media(max-width:760px) {
        .report-page {
            padding: 12px
        }

        .session-grid, .report-grid {
            grid-template-columns: 1fr
        }

        .session-grid {
            gap: 13px
        }
    }
</style>
