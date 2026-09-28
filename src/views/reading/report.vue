<template>
    <div class="report-page irfan-reading-report irfan-ui-page">
        <div class="page-header">
            <h2>Reading Reports</h2>
            <p>Review completed machine-reading sessions and compare them with previous readings.</p>
        </div>
        <div class="filter-card">
            <div class="filter-layout">
                <div class="filter-session">
                    <label>Completed Session</label>
                    <el-select v-model="selectedSessionId" placeholder="Select a completed session" filterable clearable style="width: 100%" @change="handleSessionChange">
                        <el-option v-for="session in completedSessions" :key="session.id" :label="`Session #${session.id} - ${formatDateTime(session.endedat)}`" :value="session.id">
                            <div class="session-option">
                                <strong>Session #{{ session.id }}</strong>
                                <span>{{ formatDateTime(session.endedat) }}</span>
                            </div>
                        </el-option>
                    </el-select>
                </div>
                <div class="filter-search">
                    <label>Search Machine</label>
                    <el-input v-model="search" placeholder="Machine number" clearable>
                        <template #prefix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                </div>

                <div class="filter-refresh">
                    <el-button :icon="Refresh"
                               :loading="loadingReport"
                               @click="refreshReport">
                        Refresh
                    </el-button>
                </div>
            </div>
        </div>

        <el-empty v-if="!selectedSessionId"
                  description="Select a completed reading session to view its report."
                  class="report-empty" />

        <template v-else>
            <el-tabs v-model="activeReportTab" class="reading-report-tabs report-tabs-container">
                <el-tab-pane label="Overview" name="overview">
                    <!-- ====================================================== -->
                    <!-- READING SESSION SUMMARY -->
                    <!-- ====================================================== -->

                    <div v-if="selectedSession" class="overview-summary-grid">
                        <el-card shadow="never" class="overview-stat-card" style="--accent:#40c9c6">
                            <div class="overview-stat-content"><div class="overview-stat-icon"><el-icon><Tickets /></el-icon></div><div class="overview-stat-text"><span>Session #</span><strong>{{ selectedSession.id }}</strong></div></div>
                        </el-card>
                        <el-card shadow="never" class="overview-stat-card" style="--accent:#409eff">
                            <div class="overview-stat-content"><div class="overview-stat-icon"><el-icon><Clock /></el-icon></div><div class="overview-stat-text"><span>Started</span><strong class="overview-stat-date">{{ formatDateTime(selectedSession.startedat) }}</strong></div></div>
                        </el-card>
                        <el-card shadow="never" class="overview-stat-card" style="--accent:#67c23a">
                            <div class="overview-stat-content"><div class="overview-stat-icon"><el-icon><CircleCheck /></el-icon></div><div class="overview-stat-text"><span>Completed</span><strong class="overview-stat-date">{{ formatDateTime(selectedSession.endedat) }}</strong></div></div>
                        </el-card>
                        <el-card shadow="never" class="overview-stat-card" style="--accent:#e6a23c">
                            <div class="overview-stat-content"><div class="overview-stat-icon"><el-icon><Monitor /></el-icon></div><div class="overview-stat-text"><span>Machines</span><strong>{{ reportRows.length }}</strong></div></div>
                        </el-card>
                        <el-card shadow="never" class="overview-stat-card" style="--accent:#8b5cf6">
                            <div class="overview-stat-content"><div class="overview-stat-icon"><el-icon><Coin /></el-icon></div><div class="overview-stat-text"><span>Points <small v-if="search.trim()">(filtered)</small></span><strong>{{ formatNumber(totalMachinePoints) }}</strong><small v-if="search.trim()" class="small-text">Full session: {{ formatNumber(sessionMachinePoints) }}</small></div></div>
                        </el-card>
                        <el-card shadow="never" class="overview-stat-card" style="--accent:#f56c6c">
                            <div class="overview-stat-content"><div class="overview-stat-icon"><el-icon><TrendCharts /></el-icon></div><div class="overview-stat-text"><span>Profit <small v-if="search.trim()">(filtered)</small></span><strong :class="differenceTextClass(totalProfit)">${{ formatNumber(totalProfit) }}</strong><small v-if="search.trim()" class="small-text">Full session: {{ formatNumber(sessionProfit) }}</small></div></div>
                        </el-card>
                    </div>

                    <!-- ====================================================== -->
                    <!-- COVERED EMPLOYEE SESSIONS -->
                    <!-- ====================================================== -->

                    <el-card v-if="selectedSession"
                             shadow="never"
                             class="covered-sessions-card">
                        <template #header>
                            <div class="covered-sessions-header">
                                <div>
                                    <strong>
                                        Covered Employee Sessions
                                    </strong>

                                    <div class="small-text">
                                        {{ coveredEmployeeSessions.length }}
                                        employee
                                        {{
                                    coveredEmployeeSessions.length === 1
                                        ? 'session'
                                        : 'sessions'
                                        }}
                                        included in this reading session
                                    </div>
                                </div>

                                <div class="covered-sessions-totals">
                                    <el-tag effect="light" type="info">
                                        {{ formatHours(totalCoveredWorkingHours) }} total working hours
                                    </el-tag>
                                    <el-tag effect="light" type="primary">
                                        {{ formatNumber(totalCoveredSessionPoints) }} total session points
                                    </el-tag>
                                </div>
                            </div>
                        </template>

                        <el-empty v-if="coveredEmployeeSessions.length === 0"
                                  :image-size="60"
                                  description="No employee sessions are linked to this reading session." />

                        <div v-else
                             class="covered-session-list">
                            <div v-for="employeeSession in coveredEmployeeSessions"
                                 :key="employeeSession.id"
                                 class="covered-session-item">
                                <div class="covered-session-main">
                                    <div>
                                        <span class="covered-session-label">
                                            Employee
                                        </span>

                                        <strong>
                                            {{
                                        employeeSession.employeeName ||
                                        'Employee'
                                            }}
                                        </strong>
                                    </div>

                                    <div>
                                        <span class="covered-session-label">
                                            Session
                                        </span>

                                        <strong>
                                            #{{ employeeSession.id }}
                                        </strong>
                                    </div>

                                    <div>
                                        <span class="covered-session-label">
                                            Clock In
                                        </span>

                                        <strong>
                                            {{
                                        formatDateTime(
                                            employeeSession.clockIn
                                        )
                                            }}
                                        </strong>
                                    </div>

                                    <div>
                                        <span class="covered-session-label">
                                            Clock Out
                                        </span>

                                        <strong>
                                            {{
                                        formatDateTime(
                                            employeeSession.clockOut
                                        )
                                            }}
                                        </strong>
                                    </div>

                                    <div>
                                        <span class="covered-session-label">
                                            Working Hours
                                        </span>

                                        <strong>
                                            {{
                                        formatHours(
                                            employeeSessionHours(
                                                employeeSession
                                            )
                                        )
                                            }}
                                        </strong>
                                    </div>

                                    <div>
                                        <span class="covered-session-label">
                                            Session Points
                                        </span>
                                        <strong class="session-points-value">
                                            {{ formatNumber(employeeSession.sessionPoints ?? 0) }}
                                        </strong>
                                        <!--<div class="small-text">
                                            {{ formatNumber(employeeSession.assignmentCount ?? 0) }} point assignments
                                        </div>-->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </el-card>

                    <!-- ====================================================== -->
                    <!-- FINANCIAL POSTING -->
                    <!-- ====================================================== -->

                    <el-card v-if="selectedSession && isAdmin"
                             shadow="never"
                             class="posting-card">
                        <div class="posting-layout">
                            <div>
                                <strong>
                                    Financial posting
                                </strong>

                                <p class="small-text">
                                    Post the full session profit
                                    ({{ formatNumber(sessionProfit) }})
                                    to the collecting Admin’s cash custody once.
                                    Search filters do not affect the posted amount.
                                </p>

                                <p v-if="profitPosting"
                                   class="small-text">
                                    Posted by
                                    {{
                                profitPosting.postedByName ||
                                `User #${profitPosting.postedBy}`
                                    }}
                                    on
                                    {{ formatDateTime(profitPosting.postedAt) }}
                                    · Entry #{{ profitPosting.id }}
                                </p>
                            </div>

                            <el-tag v-if="profitPosting"
                                    type="success"
                                    effect="light">
                                Posted to finance
                            </el-tag>

                            <el-button v-else
                                       type="primary"
                                       :loading="
                            postingProfit ||
                            checkingProfitPosting
                        "
                                       :disabled="
                            loadingReport ||
                            checkingProfitPosting ||
                            !reportRows.length ||
                            !!postingError
                        "
                                       @click="postSessionProfit">
                                Add Profit to Finance
                            </el-button>
                        </div>

                        <el-alert v-if="postingError"
                                  type="error"
                                  :title="postingError"
                                  :closable="false"
                                  class="posting-error" />
                    </el-card>

                </el-tab-pane>
                <el-tab-pane label="Machine Wise" name="machine">
                    <!-- ====================================================== -->
                    <!-- DESKTOP MACHINE REPORT -->
                    <!-- ====================================================== -->

                    <el-card v-if="device !== 'mobile'"
                             shadow="never"
                             class="report-card"
                             v-loading="loadingReport">
                        <template #header>
                            <div class="report-card-header">
                                <div>
                                    <strong>
                                        Machine Reading Report
                                    </strong>

                                    <div class="small-text">
                                        {{ filteredRows.length }}
                                        machine
                                        {{
                                    filteredRows.length === 1
                                        ? 'reading'
                                        : 'readings'
                                        }}
                                    </div>
                                </div>
                            </div>
                        </template>

                        <el-empty v-if="
                        !loadingReport &&
                        filteredRows.length === 0
                    "
                                  description="No machine readings found." />

                        <el-table v-else
                                  :data="filteredRows"
                                  stripe
                                  show-summary
                                  :summary-method="getSummaries"
                                  style="width: 100%"
                                  class="report-table">
                            <el-table-column prop="machinenumber"
                                             label="Machine #"
                                             min-width="75"
                                             fixed="left">
                                <template #default="{ row }">
                                    <strong>
                                        {{ row.machinenumber }}
                                    </strong>
                                </template>
                            </el-table-column>

                            <el-table-column label="Previous IN"
                                             min-width="100"
                                             align="right">
                                <template #default="{ row }">
                                    {{ displayValue(row.previousin) }}
                                </template>
                            </el-table-column>

                            <el-table-column label="Previous OUT"
                                             min-width="100"
                                             align="right">
                                <template #default="{ row }">
                                    {{ displayValue(row.previousout) }}
                                </template>
                            </el-table-column>

                            <el-table-column label="Current IN"
                                             min-width="100"
                                             align="right">
                                <template #default="{ row }">
                                    {{ displayValue(row.currentin) }}
                                </template>
                            </el-table-column>

                            <el-table-column label="Current OUT"
                                             min-width="100"
                                             align="right">
                                <template #default="{ row }">
                                    {{ displayValue(row.currentout) }}
                                </template>
                            </el-table-column>

                            <el-table-column label="Daily IN"
                                             min-width="100"
                                             align="right">
                                <template #default="{ row }">
                                    {{ displayValue(row.dailyin) }}
                                </template>
                            </el-table-column>

                            <el-table-column label="Daily OUT"
                                             min-width="100"
                                             align="right">
                                <template #default="{ row }">
                                    {{ displayValue(row.dailyout) }}
                                </template>
                            </el-table-column>

                            <el-table-column label="Difference"
                                             min-width="100"
                                             align="right">
                                <template #default="{ row }">
                                    <el-tag v-if="
                                    row.difference !== null &&
                                    row.difference !== undefined
                                "
                                            :type="
                                    differenceType(
                                        row.difference
                                    )
                                "
                                            effect="light"
                                            round>
                                        {{
                                    formatNumber(
                                        row.difference
                                    )
                                        }}
                                    </el-tag>

                                    <span v-else>
                                        --
                                    </span>
                                </template>
                            </el-table-column>

                            <el-table-column prop="machinepoints"
                                             label="Points Given"
                                             min-width="110"
                                             align="right">
                                <template #default="{ row }">
                                    {{
                                formatNumber(
                                    row.machinepoints
                                )
                                    }}
                                </template>
                            </el-table-column>

                            <el-table-column label="Life Pay %"
                                             min-width="100"
                                             align="right">
                                <template #default="{ row }">
                                    {{ lifePayPercent(row) }}
                                </template>
                            </el-table-column>

                            <el-table-column label="Life Hold %"
                                             min-width="100"
                                             align="right">
                                <template #default="{ row }">
                                    {{ lifeHoldPercent(row) }}
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-card>

                    <!-- ====================================================== -->
                    <!-- MOBILE MACHINE REPORT -->
                    <!-- ====================================================== -->

                    <el-card v-else
                             shadow="never"
                             v-loading="loadingReport"
                             class="report-card mobile-report-container">
                        <div class="
                        report-card-header
                        mobile-report-heading
                    ">
                            <div>
                                <strong>
                                    Machine Reading Report
                                </strong>

                                <div class="small-text">
                                    {{ filteredRows.length }}
                                    machine
                                    {{
                                filteredRows.length === 1
                                    ? 'reading'
                                    : 'readings'
                                    }}
                                </div>
                            </div>
                        </div>

                        <el-empty v-if="
                        !loadingReport &&
                        filteredRows.length === 0
                    "
                                  description="No machine readings found." />

                        <div v-else
                             class="mobile-report-list">
                            <el-card v-for="row in filteredRows"
                                     :key="row.id"
                                     shadow="never"
                                     class="mobile-report-card">
                                <div class="mobile-report-header">
                                    <div>
                                        <span class="machine-label">
                                            MACHINE
                                        </span>

                                        <strong>
                                            #{{ row.machinenumber }}
                                        </strong>
                                    </div>

                                    <el-tag v-if="
                                    row.difference !== null &&
                                    row.difference !== undefined
                                "
                                            :type="
                                    differenceType(
                                        row.difference
                                    )
                                "
                                            effect="light"
                                            round>
                                        Difference:
                                        {{
                                    formatNumber(
                                        row.difference
                                    )
                                        }}
                                    </el-tag>
                                </div>

                                <div class="mobile-points">
                                    <span>
                                        Points given during covered employee sessions
                                    </span>

                                    <strong>
                                        {{
                                    formatNumber(
                                        row.machinepoints
                                    )
                                        }}
                                    </strong>
                                </div>

                                <div class="mobile-section-label">
                                    Previous Reading
                                </div>

                                <div class="mobile-value-grid">
                                    <div>
                                        <span>IN</span>

                                        <strong>
                                            {{
                                        displayValue(
                                            row.previousin
                                        )
                                            }}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>OUT</span>

                                        <strong>
                                            {{
                                        displayValue(
                                            row.previousout
                                        )
                                            }}
                                        </strong>
                                    </div>
                                </div>

                                <div class="mobile-section-label">
                                    Current Reading
                                </div>

                                <div class="mobile-value-grid">
                                    <div>
                                        <span>IN</span>

                                        <strong>
                                            {{
                                        displayValue(
                                            row.currentin
                                        )
                                            }}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>OUT</span>

                                        <strong>
                                            {{
                                        displayValue(
                                            row.currentout
                                        )
                                            }}
                                        </strong>
                                    </div>
                                </div>

                                <div class="mobile-section-label">
                                    Daily
                                </div>

                                <div class="mobile-value-grid daily-grid">
                                    <div>
                                        <span>IN</span>

                                        <strong>
                                            {{
                                        displayValue(
                                            row.dailyin
                                        )
                                            }}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>OUT</span>

                                        <strong>
                                            {{
                                        displayValue(
                                            row.dailyout
                                        )
                                            }}
                                        </strong>
                                    </div>
                                </div>
                            </el-card>
                        </div>
                    </el-card>
                </el-tab-pane>
                <el-tab-pane label="Machine Type Wise" name="type">
                    <el-card shadow="never" class="report-card" v-loading="loadingReport">
                        <template #header>
                            <div class="report-card-header type-report-heading">
                                <div>
                                    <strong>Totals by Machine Type</strong>
                                    <div class="small-text">{{ machineTypeRows.length }} machine types</div>
                                </div>
                                <div class="small-text" v-if="search.trim()">Based on filtered machines</div>
                            </div>
                        </template>
                        <el-empty v-if="!loadingReport && !machineTypeRows.length"
                                  description="No machine type readings found." />
                        <el-table v-else-if="device !== 'mobile'"
                                  :data="machineTypeRows" stripe show-summary
                                  :summary-method="getTypeSummaries" class="report-table"
                                  style="width: 100%">
                            <el-table-column prop="typeName" label="Machine Type" min-width="160" fixed="left" />
                            <el-table-column prop="machineCount" label="Machines" align="right" min-width="90" />
                            <el-table-column label="IN" align="right" min-width="105">
                                <template #default="{ row }">
                                    {{ formatNumber(row.dailyin) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="OUT" align="right" min-width="105">
                                <template #default="{ row }">
                                    {{ formatNumber(row.dailyout) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="Difference" align="right" min-width="110">
                                <template #default="{ row }">
                                    <el-tag :type="differenceType(row.difference)" effect="light" round>
                                        {{ formatNumber(row.difference) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="Points" align="right" min-width="100">
                                <template #default="{ row }">
                                    {{ formatNumber(row.machinepoints) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="Bonus" align="right" min-width="90">
                                <template #default="{ row }">
                                    {{ formatNumber(row.bonus) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="Net" align="right" min-width="100">
                                <template #default="{ row }">
                                    <strong :class="differenceTextClass(row.net)">{{ formatNumber(row.net) }}</strong>
                                </template>
                            </el-table-column>
                        </el-table>
                        <div v-else class="mobile-report-list">
                            <el-card v-for="row in machineTypeRows" :key="row.typeKey"
                                     shadow="never" class="mobile-report-card">
                                <div class="mobile-report-header">
                                    <div>
                                        <span class="machine-label">MACHINE TYPE · {{ row.machineCount }} MACHINES</span>
                                        <strong>{{ row.typeName }}</strong>
                                    </div>
                                    <strong :class="differenceTextClass(row.net)">Net: {{ formatNumber(row.net) }}</strong>
                                </div>
                                <div class="type-mobile-grid">
                                    <div><span>IN</span><strong>{{ formatNumber(row.dailyin) }}</strong></div>
                                    <div><span>OUT</span><strong>{{ formatNumber(row.dailyout) }}</strong></div>
                                    <div><span>Difference</span><strong>{{ formatNumber(row.difference) }}</strong></div>
                                    <div><span>Points</span><strong>{{ formatNumber(row.machinepoints) }}</strong></div>
                                    <div><span>Bonus</span><strong>{{ formatNumber(row.bonus) }}</strong></div>
                                    <div><span>Net</span><strong :class="differenceTextClass(row.net)">{{ formatNumber(row.net) }}</strong></div>
                                </div>
                            </el-card>
                        </div>
                    </el-card>
                </el-tab-pane>
            </el-tabs>
        </template>
    </div>
</template>

<script lang="ts" setup>
    import {
        computed,
        onMounted,
        ref,
        watch
    } from 'vue'

    import {
        Refresh,
        Search, Tickets, Clock, CircleCheck, Monitor, Coin, TrendCharts
    } from '@element-plus/icons-vue'

    import {
        ElMessage,
        ElMessageBox
    } from 'element-plus'

    import { useUserStore } from '@/store/modules/user'
    import { useAppStore } from '@/store/modules/app'

    import {
        getCompletedSessions,
        getSessionReport
    } from '@/api/reading'

    import {
        getReadingProfitPosting,
        postReadingProfit
    } from '@/api/employeeFinance'


    const userStore =
        useUserStore()

    const appStore =
        useAppStore()


    const locationid =
        computed(
            () =>
                userStore.locationId
        )


    const device =
        computed(
            () =>
                appStore.device
        )


    const isAdmin =
        computed(
            () =>
                [
                    'admin',
                    'owner',
                    'system admin'
                ].includes(
                    String(
                        userStore.roleName || ''
                    )
                        .trim()
                        .toLowerCase()
                )
        )


    const completedSessions =
        ref<any[]>([])

    const reportRows =
        ref<any[]>([])

    const coveredEmployeeSessions =
        ref<any[]>([])

    const selectedSession =
        ref<any>(null)

    const selectedSessionId =
        ref<number | null>(null)

    const search =
        ref('')

    const activeReportTab = ref<'overview' | 'machine' | 'type'>('overview')

    const loadingSessions =
        ref(false)

    const loadingReport =
        ref(false)

    const checkingProfitPosting =
        ref(false)

    const postingProfit =
        ref(false)

    const profitPosting =
        ref<any>(null)

    const postingError =
        ref('')


    // Backend authenticates and authorizes every posting.
    // The browser never supplies actor or amount.


    const filteredRows =
        computed(
            () => {
                const term =
                    search.value
                        .trim()
                        .toLowerCase()

                if (!term) {
                    return reportRows.value
                }

                return reportRows.value.filter(
                    row =>
                        String(
                            row.machinenumber ?? ''
                        )
                            .toLowerCase()
                            .includes(term)
                )
            }
        )


    // Aggregate the SAME session rows used by the machine-wise report.
    // IN/OUT here are daily deltas, not lifetime meter readings.
    // No bonus field exists in the supplied reading data, so bonus is 0.
    const machineTypeRows = computed(() => {
        const groups = new Map<string, any>()
        for (const row of filteredRows.value) {
            const typeKey = row.machinetypeid == null ? 'unassigned' : String(row.machinetypeid)
            if (!groups.has(typeKey)) {
                groups.set(typeKey, {
                    typeKey,
                    typeName: row.machinetypename || 'Unassigned',
                    machineCount: 0, dailyin: 0, dailyout: 0,
                    difference: 0, machinepoints: 0, bonus: 0, net: 0
                })
            }
            const group = groups.get(typeKey)
            group.machineCount++
            for (const field of ['dailyin', 'dailyout', 'difference', 'machinepoints']) {
                const value = Number(row[field])
                if (Number.isFinite(value)) group[field] += value
            }
        }
        return Array.from(groups.values())
            .map(group => ({ ...group, net: group.difference - group.machinepoints - group.bonus }))
            .sort((a, b) => a.typeName.localeCompare(b.typeName))
    })

    function getTypeSummaries({ columns, data }: { columns: any[], data: any[] }) {
        const fields = ['typeName', 'machineCount', 'dailyin', 'dailyout',
            'difference', 'machinepoints', 'bonus', 'net']
        return columns.map((_column, index) => {
            if (index === 0) return 'TOTAL'
            const field = fields[index]
            if (!field) return ''
            return formatNumber(data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0))
        })
    }

    function formatDateTime(
        value:
            string |
            Date |
            null |
            undefined
    ) {
        if (!value) {
            return '--'
        }

        const date =
            new Date(value)

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return '--'
        }

        return new Intl.DateTimeFormat(
            'en-US',
            {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }
        ).format(date)
    }


    function formatNumber(
        value: any
    ) {
        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return '--'
        }

        const number =
            Number(value)

        if (
            Number.isNaN(number)
        ) {
            return '--'
        }

        return new Intl.NumberFormat(
            'en-US'
        ).format(number)
    }


    function displayValue(
        value: any
    ) {
        return formatNumber(value)
    }

    const totalCoveredSessionPoints = computed(() =>
        coveredEmployeeSessions.value.reduce((sum, employeeSession) => {
            const points = Number(employeeSession.sessionPoints ?? 0)
            return sum + (Number.isFinite(points) ? points : 0)
        }, 0)
    )


    // ============================================================
    // COVERED EMPLOYEE SESSION WORKING HOURS
    // ============================================================

    function employeeSessionHours(
        employeeSession: any
    ) {
        if (
            !employeeSession?.clockIn ||
            !employeeSession?.clockOut
        ) {
            return 0
        }

        const start =
            new Date(
                employeeSession.clockIn
            ).getTime()

        const end =
            new Date(
                employeeSession.clockOut
            ).getTime()

        if (
            !Number.isFinite(start) ||
            !Number.isFinite(end) ||
            end < start
        ) {
            return 0
        }

        return (
            end -
            start
        ) / 3600000
    }


    const totalCoveredWorkingHours =
        computed(
            () =>
                coveredEmployeeSessions.value.reduce(
                    (
                        sum,
                        employeeSession
                    ) =>
                        sum +
                        employeeSessionHours(
                            employeeSession
                        ),
                    0
                )
        )


    function formatHours(
        value: any
    ) {
        const hours =
            Number(
                value || 0
            )

        if (
            !Number.isFinite(hours) ||
            hours < 0
        ) {
            return '0h 0m'
        }

        const totalMinutes =
            Math.round(
                hours * 60
            )

        const wholeHours =
            Math.floor(
                totalMinutes / 60
            )

        const minutes =
            totalMinutes % 60

        return `${wholeHours}h ${minutes}m`
    }


    // ============================================================
    // REPORT TOTALS
    // ============================================================


    // Full-session amount is used for finance.
    // Filtered amount is display-only.

    const sessionProfit =
        computed(
            () =>
                reportRows.value.reduce(
                    (
                        sum,
                        row
                    ) => {
                        const value =
                            Number(
                                row.difference
                            )

                        return (
                            sum +
                            (
                                Number.isFinite(value)
                                    ? value
                                    : 0
                            )
                        )
                    },
                    0
                )
        )


    // Points come from customer assignments within the employee
    // sessions explicitly linked to this reading session.

    const sessionMachinePoints =
        computed(
            () =>
                reportRows.value.reduce(
                    (
                        sum,
                        row
                    ) => {
                        const value =
                            Number(
                                row.machinepoints
                            )

                        return (
                            sum +
                            (
                                Number.isFinite(value)
                                    ? value
                                    : 0
                            )
                        )
                    },
                    0
                )
        )


    const totalMachinePoints =
        computed(
            () =>
                filteredRows.value.reduce(
                    (
                        sum,
                        row
                    ) => {
                        const value =
                            Number(
                                row.machinepoints
                            )

                        return (
                            sum +
                            (
                                Number.isFinite(value)
                                    ? value
                                    : 0
                            )
                        )
                    },
                    0
                )
        )


    // Profit card and table footer use the same filtered rows.

    const totalProfit =
        computed(
            () =>
                filteredRows.value.reduce(
                    (
                        sum,
                        row
                    ) => {
                        const value =
                            Number(
                                row.difference
                            )

                        return (
                            sum +
                            (
                                Number.isFinite(value)
                                    ? value
                                    : 0
                            )
                        )
                    },
                    0
                )
        )


    function differenceTextClass(
        value: number
    ) {
        if (value > 0) {
            return 'profit-positive'
        }

        if (value < 0) {
            return 'profit-negative'
        }

        return 'profit-neutral'
    }


    // ============================================================
    // TABLE SUMMARY
    // ============================================================

    function getSummaries(
        {
            columns,
            data
        }:
            {
                columns: any[]
                data: any[]
            }
    ) {
        const fields = [
            '',
            'previousin',
            'previousout',
            'currentin',
            'currentout',
            'dailyin',
            'dailyout',
            'difference',
            'machinepoints'
        ]

        return columns.map(
            (
                _column,
                index
            ) => {
                if (
                    index === 0
                ) {
                    return 'TOTAL'
                }

                // Life Pay % and Life Hold % are not summed.

                if (
                    index >=
                    fields.length
                ) {
                    return ''
                }

                const field =
                    fields[index]

                const total =
                    data.reduce(
                        (
                            sum: number,
                            row: any
                        ) => {
                            const value =
                                Number(
                                    row[field]
                                )

                            return (
                                sum +
                                (
                                    Number.isFinite(
                                        value
                                    )
                                        ? value
                                        : 0
                                )
                            )
                        },
                        0
                    )

                return formatNumber(total)
            }
        )
    }


    // ============================================================
    // MACHINE PERCENTAGES
    // ============================================================

    function lifePayPercent(
        row: any
    ) {
        const currentIn =
            Number(
                row.currentin
            )

        const currentOut =
            Number(
                row.currentout
            )

        if (
            !Number.isFinite(
                currentIn
            ) ||
            currentIn <= 0 ||
            !Number.isFinite(
                currentOut
            )
        ) {
            return '0.00%'
        }

        return `${(
                (
                    currentOut /
                    currentIn
                ) *
                100
            ).toFixed(2)
            }%`
    }


    function lifeHoldPercent(
        row: any
    ) {
        const currentIn =
            Number(
                row.currentin
            )

        const currentOut =
            Number(
                row.currentout
            )

        if (
            !Number.isFinite(
                currentIn
            ) ||
            currentIn <= 0 ||
            !Number.isFinite(
                currentOut
            )
        ) {
            return '0.00%'
        }

        return `${(
                100 -
                (
                    currentOut /
                    currentIn
                ) *
                100
            ).toFixed(2)
            }%`
    }


    function differenceType(
        value: any
    ) {
        const number =
            Number(value)

        if (
            number > 0
        ) {
            return 'success'
        }

        if (
            number < 0
        ) {
            return 'danger'
        }

        return 'info'
    }


    // ============================================================
    // LOAD COMPLETED READING SESSIONS
    // ============================================================

    async function loadCompletedSessions() {
        if (
            !locationid.value
        ) {
            completedSessions.value = []

            return
        }

        try {
            loadingSessions.value = true

            const response =
                await getCompletedSessions(
                    locationid.value
                )

            completedSessions.value =
                response.data ?? []

        } catch (error) {
            console.error(error)

            completedSessions.value = []

            ElMessage.error(
                'Unable to load completed reading sessions.'
            )

        } finally {
            loadingSessions.value = false
        }
    }


    // ============================================================
    // SESSION CHANGE
    // ============================================================

    async function handleSessionChange(
        value: number | null
    ) {
        activeReportTab.value = 'overview'
        profitPosting.value = null
        postingError.value = ''
        reportRows.value = []
        coveredEmployeeSessions.value = []
        selectedSession.value = null

        if (!value) {
            return
        }

        selectedSession.value =
            completedSessions.value.find(
                session =>
                    Number(
                        session.id
                    ) ===
                    Number(value)
            ) ?? null

        await loadReport()
    }


    // ============================================================
    // LOAD SESSION REPORT
    // ============================================================

    async function loadReport() {
        if (
            !selectedSessionId.value ||
            !locationid.value
        ) {
            reportRows.value = []
            coveredEmployeeSessions.value = []

            return
        }

        try {
            loadingReport.value = true

            const response =
                await getSessionReport(
                    selectedSessionId.value,
                    locationid.value
                )

            reportRows.value =
                response.data?.readings ?? []

            coveredEmployeeSessions.value =
                response.data?.employeeSessions ?? []

            if (
                response.data?.session
            ) {
                selectedSession.value = {
                    ...selectedSession.value,
                    ...response.data.session
                }
            }

            if (
                isAdmin.value
            ) {
                await loadProfitPosting()
            }

        } catch (error) {
            console.error(error)

            reportRows.value = []
            coveredEmployeeSessions.value = []

            ElMessage.error(
                'Unable to load reading report.'
            )

        } finally {
            loadingReport.value = false
        }
    }


    // ============================================================
    // LOAD PROFIT POSTING STATUS
    // ============================================================

    async function loadProfitPosting() {
        const sessionId =
            selectedSessionId.value

        if (
            !sessionId ||
            !locationid.value
        ) {
            return
        }

        checkingProfitPosting.value = true
        postingError.value = ''

        try {
            const response =
                await getReadingProfitPosting(
                    sessionId,
                    locationid.value
                )

            if (
                Number(
                    selectedSessionId.value
                ) ===
                Number(sessionId)
            ) {
                profitPosting.value =
                    response.data?.posting ??
                    null
            }

        } catch (error: any) {
            postingError.value =
                error?.response?.data?.message ||
                'Unable to verify financial posting status. Posting is disabled until status can be checked.'

            profitPosting.value =
                null

        } finally {
            checkingProfitPosting.value =
                false
        }
    }


    // ============================================================
    // POST PROFIT
    // ============================================================

    async function postSessionProfit() {
        const sessionId =
            selectedSessionId.value

        if (
            !sessionId ||
            !locationid.value ||
            postingProfit.value ||
            profitPosting.value ||
            postingError.value
        ) {
            return
        }

        try {
            await ElMessageBox.confirm(
                `Post the FULL profit of ${formatNumber(sessionProfit.value)} for reading session #${sessionId} to Admin cash custody? This financial entry is recorded once and cannot be posted twice.`,
                'Confirm financial posting',
                {
                    type: 'warning',
                    confirmButtonText:
                        'Post Profit',
                    cancelButtonText:
                        'Cancel'
                }
            )

        } catch {
            return
        }

        postingProfit.value =
            true

        try {
            // No amount/user ID is accepted from the browser.
            // The server recomputes profit and resolves the user.

            const response =
                await postReadingProfit(
                    sessionId,
                    {
                        locationid:
                            locationid.value
                    }
                )

            profitPosting.value =
                response.data?.posting ??
                null

            if (
                !profitPosting.value
            ) {
                await loadProfitPosting()
            }

            ElMessage.success(
                'Session profit posted to finance.'
            )

        } catch (error: any) {
            ElMessage.error(
                error?.response?.data?.message ||
                'Unable to post session profit.'
            )

            if (
                isAdmin.value
            ) {
                await loadProfitPosting()
            }

        } finally {
            postingProfit.value =
                false
        }
    }


    // ============================================================
    // REFRESH
    // ============================================================

    async function refreshReport() {
        await loadCompletedSessions()

        if (
            selectedSessionId.value
        ) {
            await loadReport()
        }
    }


    // ============================================================
    // LOCATION WATCH
    // ============================================================

    watch(
        locationid,
        async newLocation => {
            selectedSessionId.value =
                null

            selectedSession.value =
                null

            reportRows.value =
                []

            coveredEmployeeSessions.value =
                []

            profitPosting.value =
                null

            postingError.value =
                ''

            search.value =
                ''

            if (
                newLocation
            ) {
                await loadCompletedSessions()
            }
        }
    )


    onMounted(
        async () => {
            await loadCompletedSessions()
        }
    )
</script>


<style scoped>
    /* Compact overview cards: same proportions and hover as Points by Date. */
    .overview-summary-grid {
        display: grid;
        grid-template-columns: repeat(3,minmax(0,1fr));
        gap: 15px;
        margin-bottom: 20px
    }

    .overview-stat-card {
        min-width: 0;
        border: 1px solid var(--el-border-color-light);
        border-radius: 14px;
        background: var(--el-bg-color,#fff);
        transition: transform .2s ease,box-shadow .2s ease,border-color .2s ease
    }

        .overview-stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 28px rgba(0,0,0,.08);
            border-color: color-mix(in srgb,var(--accent) 25%,transparent)
        }

        .overview-stat-card :deep(.el-card__body) {
            padding: 16px 12px !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: hidden !important
        }

    .overview-stat-content {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0
    }

    .overview-stat-icon {
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: color-mix(in srgb,var(--accent) 11%,transparent);
        color: var(--accent);
        font-size: 24px
    }

    .overview-stat-text {
        min-width: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start
    }

        .overview-stat-text > span {
            font-size: 12px;
            line-height: 1.3;
            margin-bottom: 5px;
            color: var(--el-text-color-secondary)
        }

        .overview-stat-text > strong {
            font-size: 24px;
            line-height: 1.1;
            font-weight: 700;
            max-width: 100%;
            overflow-wrap: anywhere
        }

            .overview-stat-text > strong.overview-stat-date {
                font-size: 15px;
                line-height: 1.35
            }

        .overview-stat-text > .small-text {
            margin-top: 5px;
            font-size: 11px
        }

    @media(max-width:900px) {
        .overview-summary-grid {
            grid-template-columns: repeat(2,minmax(0,1fr))
        }
    }

    @media(max-width:550px) {
        .overview-summary-grid {
            gap: 12px
        }

        .overview-stat-card :deep(.el-card__body) {
            padding: 12px 9px !important
        }

        .overview-stat-content {
            gap: 8px
        }

        .overview-stat-icon {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
            border-radius: 10px;
            font-size: 20px
        }

        .overview-stat-text > span {
            font-size: 11px
        }

        .overview-stat-text > strong {
            font-size: 21px
        }

            .overview-stat-text > strong.overview-stat-date {
                font-size: 12px
            }
    }
</style>
