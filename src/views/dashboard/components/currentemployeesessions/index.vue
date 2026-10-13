<template>
  <section class="current-sessions-section">
    <div class="section-heading">
      <div>
        <div class="section-title-row">
          <h3>Current Employee Sessions</h3>
          <el-tag v-if="employees.length" type="success" effect="light" round size="small">
            {{ employees.length }} Clocked In
          </el-tag>
        </div>
        <p>Employees currently clocked in and their live session balances.</p>
      </div>

      <el-button circle
                 :icon="Refresh"
                 :loading="loading"
                 aria-label="Refresh current employee sessions"
                 @click="loadSessions" />
    </div>

    <el-skeleton v-if="loading && !loaded" :rows="2" animated />

    <el-empty v-else-if="!employees.length"
              :image-size="54"
              description="No employees are currently clocked in."
              class="sessions-empty" />

    <div v-else class="session-grid">
      <el-card v-for="employee in employees"
               :key="employee.sessionId"
               shadow="never"
               class="session-card"
               role="button"
               tabindex="0"
               @click="openSession(employee)"
               @keydown.enter="openSession(employee)">
        <div class="session-card-top">
          <div class="employee-main">
            <div class="avatar-wrap">
              <el-avatar :size="42" :src="employee.avatar">
                {{ initials(employee.name) }}
              </el-avatar>
              <span class="online-dot"></span>
            </div>

            <div class="employee-copy">
              <strong>{{ employee.name }}</strong>
              <span v-if="employee.jobTitle">{{ employee.jobTitle }}</span>
              <span v-else>Employee</span>
            </div>
          </div>

          <div class="balance-block">
            <span>Current Balance</span>
            <strong>{{ money(employee.balance) }}</strong>
          </div>
        </div>

        <div class="session-meta">
          <div>
            <span>Clock In</span>
            <strong>{{ formatTime(employee.clockIn) }}</strong>
          </div>

          <div>
            <span>Duration</span>
            <strong>{{ duration(employee.clockIn) }}</strong>
          </div>

          <div>
            <span>Opening Bank</span>
            <strong>{{ money(employee.openingBank) }}</strong>
          </div>
        </div>
      </el-card>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { useRefreshStore } from '@/store/modules/refresh'
import { getActiveEmployeeSessions } from '@/api/dashboard'

const router = useRouter()
const userStore = useUserStore()
const refreshStore = useRefreshStore()
const employees = ref([])
const loading = ref(false)
const loaded = ref(false)
const now = ref(Date.now())

let refreshTimer = null
let clockTimer = null
let stopRefreshAction = null

async function loadSessions() {
    const locationId = Number(userStore.locationId)
    if (!locationId || loading.value) return

    try {
      loading.value = true

      const response = await getActiveEmployeeSessions(locationId)

      employees.value = Array.isArray(response?.data) ? response.data : []
    } catch (error) {
      console.error('Unable to load current employee sessions:', error)
    } finally {
      loading.value = false
      loaded.value = true
    }
}


function openSession(employee) {
    const employeeId = Number(employee?.userId)
    const sessionId = Number(employee?.sessionId)

    if (!employeeId || !sessionId) return

    router.push({
      name: 'EmployeeSessionReportMenu',
      params: {
        employeeId,
        sessionId
      }
    })
}

function initials(name) {
    return String(name || 'E')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase()
}

function money(value) {
    return Number(value || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
}

function formatTime(value) {
    if (!value) return '—'

    return new Date(value).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    })
}

function duration(clockIn) {
    if (!clockIn) return '—'

    const start = new Date(clockIn).getTime()
    if (!Number.isFinite(start)) return '—'

    const totalMinutes = Math.max(0, Math.floor((now.value - start) / 60000))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return `${hours}h ${minutes}m`
}

watch(
    () => userStore.locationId,
    () => {
      employees.value = []
      loaded.value = false
      loadSessions()
    }
)

onMounted(() => {
    loadSessions()

    // Socket handling stays centralized in services/socketlisteners.js.
    // That service forwards app-refresh events to refreshStore.notify().
    // Listen to that existing store action instead of registering another socket listener here.
    stopRefreshAction = refreshStore.$onAction(({ name, args, after }) => {
      if (name !== 'notify') return

      const targets = Array.isArray(args?.[0]) ? args[0] : []

      if (
        !targets.includes('employeeSessions') &&
        !targets.includes('adminTransactions')
      ) {
        return
      }

      after(() => {
        loadSessions()
      })
    })

    refreshTimer = window.setInterval(loadSessions, 15000)
    clockTimer = window.setInterval(() => {
      now.value = Date.now()
    }, 30000)
})

onBeforeUnmount(() => {
    stopRefreshAction?.()

    if (refreshTimer) window.clearInterval(refreshTimer)
    if (clockTimer) window.clearInterval(clockTimer)
})
</script>

<style scoped>
  .current-sessions-section {
    margin-bottom: 18px;
  }

  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 10px;
  }

  .section-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-heading h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .section-heading p {
    margin: 3px 0 0;
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  .session-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .session-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-bg-color);
    cursor: pointer;
    transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
  }

    .session-card:hover {
      border-color: var(--el-color-primary-light-7);
      box-shadow: 0 6px 18px rgba(0, 0, 0, .06);
      transform: translateY(-1px);
    }

    .session-card:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 2px;
    }

    .session-card :deep(.el-card__body) {
      padding: 14px;
    }

  .session-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .employee-main {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .avatar-wrap {
    position: relative;
    flex: 0 0 auto;
  }

  .online-dot {
    position: absolute;
    right: 0;
    bottom: 1px;
    width: 10px;
    height: 10px;
    border: 2px solid var(--el-bg-color);
    border-radius: 50%;
    background: var(--el-color-success);
  }

  .employee-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

    .employee-copy strong {
      overflow: hidden;
      font-size: 13px;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .employee-copy span {
      margin-top: 2px;
      overflow: hidden;
      font-size: 10px;
      color: var(--el-text-color-secondary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

  .balance-block {
    flex: 0 0 auto;
    text-align: right;
  }

    .balance-block span {
      display: block;
      margin-bottom: 2px;
      font-size: 9px;
      font-weight: 600;
      color: var(--el-text-color-secondary);
      text-transform: uppercase;
    }

    .balance-block strong {
      font-size: 16px;
      color: var(--el-color-primary);
    }

  .session-meta {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

    .session-meta > div {
      min-width: 0;
    }

    .session-meta span {
      display: block;
      margin-bottom: 3px;
      font-size: 9px;
      color: var(--el-text-color-secondary);
    }

    .session-meta strong {
      display: block;
      overflow: hidden;
      font-size: 11px;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

  .sessions-empty {
    padding: 8px 0 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-bg-color);
  }

  @media (max-width: 1399px) {
    .session-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 991px) {
    .session-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 767px) {
    .current-sessions-section {
      margin-bottom: 16px;
    }

    .section-heading {
      align-items: flex-start;
    }

    .section-title-row {
      align-items: flex-start;
      flex-direction: column;
      gap: 5px;
    }

    .session-grid {
      grid-template-columns: 1fr;
    }

    .session-card-top {
      align-items: flex-start;
    }
  }
</style>
