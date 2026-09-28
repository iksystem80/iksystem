<template>
    <div class="report-page">
        <div class="page-header">
            <div class="header-left">
                <el-button class="back-button"
                           circle
                           aria-label="Back"
                           @click="router.back()">
                    <el-icon>
                        <ArrowLeft />
                    </el-icon>
                </el-button>

                <div>
                    <h1>{{ employee?.name || 'Employee Sessions' }}</h1>
                    <p>{{ employee?.jobTitle || 'Session history' }}</p>
                </div>
            </div>

            <el-button :loading="loading"
                       @click="loadSessions">
                <el-icon>
                    <Refresh />
                </el-icon>
                Refresh
            </el-button>
        </div>

        <el-card shadow="never"
                 class="employee-summary-card">
            <div class="employee-summary">
                <el-avatar :size="54"
                           :src="employee?.avatar">
                    {{ initials(employee?.name) }}
                </el-avatar>

                <div class="employee-summary-main">
                    <strong>{{ employee?.name || 'Employee' }}</strong>
                    <span>{{ sessions.length }} total sessions</span>
                </div>

                <div class="employee-summary-stat">
                    <span>Total Points</span>
                    <strong>{{ totalPoints }}</strong>
                </div>
            </div>
        </el-card>

        <div v-loading="loading"
             element-loading-text="Loading employee sessions..."
             class="sessions-content">
            <el-empty v-if="!loading && sessions.length === 0"
                      description="No sessions found"
                      class="small-empty" />

            <div v-else
                 class="session-list">
                <el-card v-for="session in sessions"
                         :key="session.id"
                         shadow="never"
                         class="session-card"
                         :class="{ 'session-included': session.readingSessionId != null }"
                         :title="session.readingSessionId != null ? `Included in machine reading #${session.readingSessionId}` : undefined"
                         @click="openSession(session)">
                    <el-tag :type="session.status === 'IN_PROGRESS' ? 'success' : 'info'"
                            size="small"
                            effect="light"
                            round
                            class="session-status-tag">
                        {{ session.status === 'IN_PROGRESS' ? 'In Progress' : 'Closed' }}
                    </el-tag>

                    <button class="photo-audit-compact"
                            type="button"
                            :disabled="!Number(session.photoCount || 0)"
                            :title="'Open photo audit · ' + Number(session.photoCount || 0) + ' photos'"
                            @click.stop="openAudit(session)">
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

        <SessionPhotoAuditDrawer v-model="auditDrawerOpen"
                                 :session-id="auditSessionId"
                                 :location-id="userStore.locationId"
                                 @review-saved="loadSessions" />
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
                    userStore.locationId
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

    .back-button {
        flex: 0 0 auto;
        width: 38px;
        height: 38px;
        padding: 0;
        border-radius: 50%;
        font-size: 18px;
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

    .employee-summary-card,
    .session-card {
        border-radius: 14px;
    }

    .employee-summary-card {
        margin-bottom: 16px;
    }

    .employee-summary {
        display: flex;
        align-items: center;
        gap: 13px;
    }

    .employee-summary-main {
        flex: 1;
        min-width: 0;
    }

        .employee-summary-main strong,
        .employee-summary-main span,
        .employee-summary-stat span,
        .employee-summary-stat strong {
            display: block;
        }

        .employee-summary-main span,
        .employee-summary-stat span {
            margin-top: 4px;
            color: var(--el-text-color-secondary);
            font-size: 12px;
        }

    .employee-summary-stat {
        text-align: right;
    }

        .employee-summary-stat strong {
            margin-top: 3px;
            font-size: 22px;
        }

    .sessions-content {
        min-height: 120px;
    }

    .session-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .session-card {
        position: relative;
        width: 100%;
        cursor: pointer;
        transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
    }

        /* A linked employee session has a 3px green left edge. */
        .session-card.session-included {
            border-left: 3px solid var(--el-color-success);
        }

        .session-card:hover {
            border-color: var(--el-color-primary-light-5);
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        }

        .session-card:active {
            transform: scale(0.995);
        }

        .session-card :deep(.el-card__body) {
            padding: 15px;
        }

    .session-status-tag {
        position: absolute;
        top: 50%;
        right: 42px;
        transform: translateY(-50%);
        z-index: 2;
    }

    .session-row-content {
        display: flex;
        align-items: center;
        gap: 13px;
    }

    .session-icon {
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 11px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        font-size: 19px;
    }

    .session-main {
        flex: 1;
        min-width: 0;
        padding-right: 90px;
    }

    .session-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .session-date {
        display: block;
        margin-top: 4px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
    }

    .session-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 16px;
        margin-top: 8px;
        color: var(--el-text-color-regular);
        font-size: 12px;
    }

    .arrow-icon {
        flex: 0 0 auto;
        color: var(--el-text-color-secondary);
    }

    /* Compact audit lives in the existing right-hand card space. */
    .session-status-tag {
        top: 12px;
        transform: none;
    }

    .photo-audit-compact {
        position: absolute;
        right: 42px;
        bottom: 11px;
        z-index: 3;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 3px;
        border: 0;
        padding: 3px 0;
        background: transparent;
        cursor: pointer;
        font: inherit;
        white-space: nowrap;
    }

        .photo-audit-compact:disabled {
            cursor: default;
            opacity: .6;
        }

    .photo-audit-heading {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--el-color-primary);
        font-size: 11px;
        font-weight: 700;
    }

    .photo-audit-compact:not(:disabled):hover .photo-audit-heading {
        text-decoration: underline;
    }

    .photo-audit-go {
        font-size: 10px;
    }

    .photo-audit-counts {
        display: flex;
        gap: 9px;
        font-size: 10px;
        font-weight: 650;
    }

    .audit-approved {
        color: var(--el-color-success);
    }

    .audit-rejected {
        color: var(--el-color-danger);
    }

    .audit-remaining {
        color: var(--el-color-warning);
    }

    @media (min-width: 701px) {
        .session-main {
            padding-right: 186px;
        }
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

    @media (max-width: 700px) {
        .session-status-tag {
            top: 12px;
            right: 32px;
            transform: none;
        }

        .report-page {
            padding: 12px;
        }

        .page-header {
            align-items: flex-start;
        }

        .employee-summary-stat {
            display: none;
        }

        .session-card :deep(.el-card__body) {
            padding: 13px;
        }

        .session-row-content {
            align-items: flex-start;
        }

        .session-icon {
            width: 38px;
            height: 38px;
            flex-basis: 38px;
        }

        .session-main {
            padding-right: 135px;
        }

        .session-meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 5px 8px;
        }

        .photo-audit-compact {
            right: 32px;
            bottom: 13px;
        }

        .photo-audit-counts {
            gap: 6px;
        }
    }

    @media (max-width: 440px) {
        .session-main {
            padding-right: 113px;
        }

        .photo-audit-heading {
            font-size: 10px;
        }

        .photo-audit-counts {
            font-size: 9px;
            gap: 5px;
        }
    }
</style>
