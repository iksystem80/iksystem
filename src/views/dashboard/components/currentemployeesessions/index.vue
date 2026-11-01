<template>
  <section v-if="employees.length" class="current-sessions-section">
    <div class="current-employee-heading">
      <h3>Current Employee Sessions</h3>
      <!--<el-tag v-if="employees.length" type="success" effect="light" round size="small">
        {{ employees.length }} Clocked In
      </el-tag>-->
    </div>

    <el-skeleton v-if="loading && !loaded" :rows="2" animated />
    <!--<el-empty v-else-if="!employees.length"
              :image-size="54"
              description="No employees are currently clocked in."
              class="current-employee-empty" />-->

    <el-row v-else :gutter="18" class="panel-group current-employee-grid"
            :class="{ 'current-employee-grid-multiple': employees.length > 1 }">
      <el-col v-for="employee in employees"
              :key="employee.sessionId"
              :xs="12" :sm="12" :md="12" :lg="6"
              class="card-panel-col current-employee-col">
        <div class="stat-card stat-current current-employee-card"
             role="button"
             tabindex="0"
             @click="openSession(employee)"
             @keydown.enter="openSession(employee)">
          <div class="current-employee-card-content">
            <div class="current-employee-top">
              <div class="current-employee-avatar">
                <el-avatar :size="34" :src="employee.avatar">
                  {{ initials(employee.name) }}
                </el-avatar>
                <span class="current-employee-online"></span>
              </div>
              <div class="stat-content current-employee-info">
                <div class="current-employee-name" :title="employee.name">{{ employee.name }}</div>
                <div class="stat-label current-employee-role">{{ employee.jobTitle || 'Employee' }}</div>
              </div>
              <div class="current-employee-balance">
                <span class="stat-label"><span class="current-balance-prefix">Current </span>Balance</span>
                <strong class="current-employee-balance-value">{{ money(employee.balance) }}</strong>
              </div>
            </div>

            <div class="current-employee-meta">
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
          </div>
          <div class="stat-decoration" />
        </div>
      </el-col>
    </el-row>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
/* Keep the existing desktop grid and card design untouched. */
.current-employee-role,
.current-balance-prefix {
  display: none;
}

@media (max-width: 767px) {
  .current-employee-grid {
    display: flex;
    flex-wrap: nowrap;
    width: 100%;
    margin: 0 !important;
    overflow-x: hidden;
  }

  .current-employee-grid.current-employee-grid-multiple {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .current-employee-grid-multiple::-webkit-scrollbar {
    display: none;
  }

  .current-employee-grid > .current-employee-col {
    flex: 0 0 100%;
    max-width: 100%;
    width: 100%;
    padding: 0 !important;
    scroll-snap-align: start;
  }

  .current-employee-grid-multiple > .current-employee-col {
    flex-basis: 90%;
    max-width: 90%;
    width: 90%;
    margin-right: 10px;
  }

  .current-employee-grid .current-employee-card {
    width: 100%;
    min-height: 0;
    padding: 12px 14px;
  }

  .current-employee-card-content {
    width: 100%;
    min-width: 0;
  }

  .current-employee-top {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .current-employee-info {
    flex: 1 1 auto;
    min-width: 0;
  }

  .current-employee-role,
  .current-balance-prefix {
    display: inline;
  }

  .current-employee-role {
    display: block;
  }

  .current-employee-balance {
    flex: 0 0 auto;
    text-align: right;
  }

  .current-employee-meta {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 11px;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .current-employee-meta > div {
    min-width: 0;
  }

  .current-employee-meta span,
  .current-employee-meta strong {
    display: block;
  }
}
</style>
