<template>
    <div class="app-container">
        <el-row justify="center" :gutter="20">
            <el-col :xs="24" :sm="20" :md="14" :lg="10">
                <!-- MAIN CLOCK CARD -->
                <el-card shadow="never" class="clock-card">
                    <!-- EMPLOYEE -->
                    <div class="employee-info">
                        <el-avatar :size="64" :src="userStore.avatar">
                            {{ userInitial }}
                        </el-avatar>
                        <div>
                            <h2>
                                {{ userStore.name }}
                            </h2>
                            <div class="employee-subtitle">
                                Employee Time Clock
                            </div>
                        </div>
                    </div>
                    <el-divider />
                    <!-- CURRENT TIME -->
                    <div class="time-section">
                        <div class="current-time">
                            {{ currentTime }}
                        </div>
                        <div class="current-date">
                            {{ currentDate }}
                        </div>
                    </div>
                    <!-- CLOCKED OUT -->
                    <div v-if="!clockedIn" class="status-section">
                        <el-tag type="info" size="large" round>
                            Currently Clocked Out
                        </el-tag>
                        <p>
                            Start your work session by clocking in.
                        </p>
                        <el-button type="success" size="large" class="clock-button" :loading="loading" @click="handleClockIn">
                            <el-icon>
                                <VideoPlay />
                            </el-icon>
                            <span>
                                Clock In
                            </span>
                        </el-button>
                    </div>
                    <!-- CLOCKED IN -->
                    <div v-else class="status-section">
                        <el-tag type="success" size="large" effect="dark" round>
                            In Progress
                        </el-tag>
                        <div class="session-info">
                            <el-row :gutter="10">
                                <el-col :span="12">
                                    <el-statistic title="Clocked In" :value="
                      formatTime(
                        session?.clockIn
                      )
                    " />
                                </el-col>
                                <el-col :span="12">
                                    <el-statistic title="Working Time" :value="elapsedDisplay" />
                                </el-col>
                            </el-row>
                        </div>
                        <el-alert v-if="cashCloseRequired" class="cash-close-alert" type="warning" :closable="false" show-icon>
                            <template #title>
                                Cash handover required before clock-out
                            </template>
                            Your current session has recorded cash activity. Complete the handover and clock out from Employee Transactions.
                        </el-alert>

                        <el-button v-if="cashCloseRequired"
                                   type="primary"
                                   size="large"
                                   class="clock-button"
                                   @click="goToEmployeeFinance">
                            Go to Employee Transactions
                        </el-button>

                        <el-button v-else type="danger"
                                   size="large"
                                   class="clock-button"
                                   :loading="loading || cashChecking"
                                   :disabled="cashChecking"
                                   @click="handleClockOut">
                            <el-icon>
                                <SwitchButton />
                            </el-icon>
                            <span>
                                Clock Out
                            </span>
                        </el-button>

                    </div>

                </el-card>


                <!-- SESSION HISTORY -->
                <el-card shadow="never"
                         class="history-card">

                    <template #header>

                        <div class="history-header">
                            <strong>
                                Recent Sessions
                            </strong>

                            <el-button text
                                       :icon="Refresh"
                                       @click="loadSessions">
                                Refresh
                            </el-button>
                        </div>

                    </template>


                    <el-empty v-if="
              !historyLoading &&
              sessions.length === 0
            "
                              description="No work sessions found." />


                    <el-table v-else
                              v-loading="historyLoading"
                              :data="sessions"
                              style="width: 100%">

                        <el-table-column label="Date"
                                         min-width="120">
                            <template #default="{ row }">

                                {{
                  formatDate(
                    row.clockIn
                  )
                                }}

                            </template>
                        </el-table-column>


                        <el-table-column label="Clock In"
                                         min-width="100">
                            <template #default="{ row }">

                                {{
                  formatTime(
                    row.clockIn
                  )
                                }}

                            </template>
                        </el-table-column>


                        <el-table-column label="Clock Out"
                                         min-width="100">
                            <template #default="{ row }">

                                <span v-if="row.clockOut">
                                    {{
                    formatTime(
                      row.clockOut
                    )
                                    }}
                                </span>

                                <el-tag v-else
                                        type="success"
                                        size="small">
                                    In Progress
                                </el-tag>

                            </template>
                        </el-table-column>


                        <el-table-column label="Hours"
                                         width="90">
                            <template #default="{ row }">

                                <span v-if="row.clockOut">

                                    {{
                    Number(
                      row.totalWorkingHours
                    ).toFixed(2)
                                    }}

                                </span>

                                <span v-else>
                                    —
                                </span>

                            </template>
                        </el-table-column>


                        <el-table-column label="Paid"
                                         width="90">
                            <template #default="{ row }">

                                <el-tag v-if="row.isPaid"
                                        type="success"
                                        size="small">
                                    Paid
                                </el-tag>

                                <el-tag v-else
                                        type="info"
                                        size="small">
                                    Unpaid
                                </el-tag>

                            </template>
                        </el-table-column>

                    </el-table>

                </el-card>

            </el-col>

        </el-row>

    </div>
</template>

<script setup>
import {
      ref,
      computed,
      onMounted,
      onBeforeUnmount
} from 'vue'

import {
      VideoPlay,
      SwitchButton,
      Refresh
} from '@element-plus/icons-vue'

import {
      ElMessage,
      ElMessageBox
} from 'element-plus'

import { useUserStore } from '@/store/modules/user'
import { useRouter } from 'vue-router'
import { getEmployeeFinance } from '@/api/employeeFinance'

import {
      clockIn,
      clockOut,
      getClockStatus,
      getEmployeeSessions
} from '@/api/employeesession'


const userStore =
      useUserStore()

const router = useRouter()
// Match this path to your existing Employee Transactions router entry.
const employeeFinancePath = '/finance/employee'
const cashCloseRequired = ref(false)
const cashChecking = ref(false)
const cashCheckError = ref('')

const goToEmployeeFinance = () => router.push(employeeFinancePath)

async function checkSessionCash() {
      if (!clockedIn.value || !session.value?.id || !userStore.locationId) {
        cashCloseRequired.value = false
        cashCheckError.value = ''
        return { requiresFinance: false }
      }
      cashChecking.value = true
      cashCheckError.value = ''
      try {
        const response = await getEmployeeFinance(userStore.locationId)
        const data = response.data || {}
        // A finance session must never bypass its handover just because its
        // balance happens to be zero at this moment.
        const sameSession = Number(data.session?.id) === Number(session.value.id)
        if (!sameSession) throw new Error('Unable to verify the active cash session.')
        const requiresFinance = Number(data.summary?.entry_count || 0) > 0 ||
          Number(data.summary?.pointsCount || 0) > 0
        cashCloseRequired.value = requiresFinance
        return { requiresFinance, balance: Number(data.summary?.balance || 0) }
      } catch (error) {
        cashCheckError.value = error?.response?.data?.message || error?.message || 'Unable to verify your cash balance.'
        // Fail closed: a network error must not allow bypassing cash handover.
        cashCloseRequired.value = true
        return { requiresFinance: true, checkFailed: true }
      } finally {
        cashChecking.value = false
      }
}


const loading =
      ref(false)

const historyLoading =
      ref(false)

const clockedIn =
      ref(false)

const session =
      ref(null)

const sessions =
      ref([])


const now =
      ref(new Date())

let timer = null


// ============================================================
// USER
// ============================================================

const userInitial =
      computed(() => {

        const value =
          userStore.name || ''

        return value
          ? value.charAt(0).toUpperCase()
          : '?'
      })


// ============================================================
// CURRENT TIME
// ============================================================

const currentTime =
      computed(() => {

        return now.value
          .toLocaleTimeString(
            'en-US',
            {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit'
            }
          )
      })


const currentDate =
      computed(() => {

        return now.value
          .toLocaleDateString(
            'en-US',
            {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }
          )
      })


// ============================================================
// ELAPSED WORK TIME
// ============================================================

const elapsedSeconds =
      computed(() => {

        if (
          !clockedIn.value ||
          !session.value?.clockIn
        ) {
          return 0
        }

        const start =
          new Date(
            session.value.clockIn
          ).getTime()

        const current =
          now.value.getTime()

        return Math.max(
          0,
          Math.floor(
            (current - start) / 1000
          )
        )
      })


const elapsedDisplay =
      computed(() => {

        const seconds =
          elapsedSeconds.value

        const hours =
          Math.floor(
            seconds / 3600
          )

        const minutes =
          Math.floor(
            (seconds % 3600) / 60
          )

        const remainingSeconds =
          seconds % 60


        return [
          hours,
          minutes,
          remainingSeconds
        ]
          .map(value =>
            String(value)
              .padStart(2, '0')
          )
          .join(':')
      })


// ============================================================
// STATUS
// ============================================================

const loadStatus = async () => {

        try {

          const response =
            await getClockStatus(
              userStore.userId
            )

          clockedIn.value = response.data.clockedIn
          userStore.setClockedIn(response.data.clockedIn)

          session.value = response.data.session
          if (clockedIn.value) await checkSessionCash()
          else cashCloseRequired.value = false

        } catch (error) {

          ElMessage.error(
            error.response?.data?.message ||
            'Unable to load clock status.'
          )
        }
      }


// ============================================================
// CLOCK IN
// ============================================================

const handleClockIn =
      async () => {

        try {

          loading.value = true


          const payload = {
            userid:
              userStore.userId,

            locationid:
              userStore.locationId
          }


          const response =
            await clockIn(payload)


          ElMessage.success(
            response.message
          )


          await loadStatus()
          await loadSessions()

        } catch (error) {

          ElMessage.error(
            error.response?.data?.message ||
            'Unable to clock in.'
          )

        } finally {

          loading.value = false
        }
      }


// ============================================================
// CLOCK OUT
// ============================================================

const handleClockOut = async () => {
      if (loading.value || cashChecking.value) return
      try {
        loading.value = true
        // Recheck immediately before submission; old page state is not trusted.
        const cash = await checkSessionCash()
        if (cash.requiresFinance) {
          if (cash.checkFailed) {
            ElMessage.error(`${cashCheckError.value} Clock-out is blocked until finance can be verified.`)
          } else {
            ElMessage.warning('This session has cash activity. Use Employee Transactions to hand over cash and clock out.')
          }
          await ElMessageBox.confirm(
            'Your session has cash activity. Go to Employee Transactions to complete the cash handover and clock out.',
            'Cash handover required',
            { type: 'warning', confirmButtonText: 'Go to Employee Transactions', cancelButtonText: 'Stay here' }
          ).then(goToEmployeeFinance).catch(() => {})
          return
        }
        try {
          await ElMessageBox.confirm(
            'Are you sure you want to clock out?',
            'Clock Out',
            { confirmButtonText: 'Clock Out', cancelButtonText: 'Cancel', type: 'warning' }
          )
        } catch { return }
        const response = await clockOut({ userid: userStore.userId })
        ElMessage.success(response.message)
        await loadStatus()
        await loadSessions()
      } catch (error) {
        ElMessage.error(error?.response?.data?.message || 'Unable to clock out.')
      } finally {
        loading.value = false
      }
}


// ============================================================
// HISTORY
// ============================================================

const loadSessions =
      async () => {

        try {

          historyLoading.value =
            true


          const response =
            await getEmployeeSessions(
              userStore.userId,
              userStore.locationId,
              14
            )


          sessions.value =
            response.data ?? []

        } catch (error) {

          ElMessage.error(
            error.response?.data?.message ||
            'Unable to load sessions.'
          )

        } finally {

          historyLoading.value =
            false
        }
      }


// ============================================================
// FORMATTERS
// ============================================================

const formatTime =
      value => {

        if (!value) return '-'


        return new Date(value)
          .toLocaleTimeString(
            'en-US',
            {
              hour: 'numeric',
              minute: '2-digit'
            }
          )
      }


const formatDate =
      value => {

        if (!value) return '-'


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


// ============================================================
// LIFECYCLE
// ============================================================

onMounted(async () => {

      await loadStatus()
      await loadSessions()


      timer =
        setInterval(() => {

          now.value =
            new Date()

        }, 1000)
})


onBeforeUnmount(() => {

      if (timer) {
        clearInterval(timer)
      }
})
</script>

