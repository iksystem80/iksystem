<template>
  <section v-loading="loading" class="match-audit">
    <el-card shadow="never" class="weekly-report-section-card weekly-percentage-card">
      <template #header>
        <div class="weekly-analytics-card-title">
          <el-icon><DataAnalysis /></el-icon>
          <div>
            <strong>Match Points <span v-if="sessionLabel">— Session # {{ sessionLabel }}</span></strong>
            <div class="small-text">Machine-wise matches across all completed employee shifts in this reading session.</div>
          </div>
        </div>
      </template>
      <div class="match-audit-legend">
        <div><strong>Minimum in machine</strong><span>Match Given + Customer Money (2× match).</span></div>
        <div><strong>Play target</strong><span>5× for $10/$20 matches; 8× for matches $30 and above.</span></div>
        <div><strong>Red names</strong><span>Customers who received more than one match on this machine from the same employee.</span></div>
      </div>
    </el-card>

    <div class="match-audit-toolbar">
      <el-radio-group v-model="filter" size="default">
        <el-radio-button label="all">
          <span class="match-audit-filter-label">
            <el-icon><Grid /></el-icon>
            <span>All Machines ({{ machines.length }})</span>
          </span>
        </el-radio-button>
        <el-radio-button label="flagged">
          <span class="match-audit-filter-label">
            <el-icon><WarningFilled /></el-icon>
            <span>Flagged ({{ flaggedCount }})</span>
          </span>
        </el-radio-button>
        <el-radio-button label="low">
          <span class="match-audit-filter-label">
            <el-icon><Bottom /></el-icon>
            <span>Low Play ({{ lowPlayCount }})</span>
          </span>
        </el-radio-button>
        <el-radio-button label="target">
          <span class="match-audit-filter-label">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>On Target ({{ onTargetCount }})</span>
          </span>
        </el-radio-button>
      </el-radio-group>
    </div>

    <el-empty v-if="!loading && !displayMachines.length"
              :description="
        filter === 'flagged'
          ? 'No flagged machines.'
          : filter === 'low'
            ? 'No low play machines.'
            : filter === 'target'
              ? 'No machines on target.'
              : 'No machine readings or matches found.'
      " />

    <article v-for="machine in displayMachines" :key="machine.id" class="match-audit-machine" :class="{ 'is-flagged': machine.flagged }">
      <div class="match-audit-machine-heading">
        <div class="match-audit-machine-title">
          <strong class="machine-number-badge">{{ machine.machineNumber ?? machine.id }}</strong>
          <div>
            <small>{{ machine.machineType }}</small>
            <div class="match-audit-breakdown">
              <span v-for="(item, index) in machine.breakdown" :key="item.amount" class="match-audit-breakdown-badge" :class="index % 2 ? 'is-teal' : 'is-purple'">
                {{ amountNumber(item.amount) }} × {{ item.count }}
              </span>
              <span v-if="!machine.breakdown.length" class="match-audit-muted">No matches</span>
            </div>
          </div>
        </div>
        <span v-if="machine.flagged" class="match-audit-status is-red">⚠ BELOW MINIMUM</span>
        <span v-else-if="machine.hasReading && machine.matches.length" class="match-audit-status">{{ machine.shortTarget ? 'LOW PLAY' : 'ON TARGET' }}</span>
        <span v-else-if="!machine.hasReading" class="match-audit-status is-red">NO READING</span>
      </div>

      <div class="match-audit-metrics">
        <div><small>Match given</small><strong>{{ money(machine.matchGiven) }}</strong></div>
        <div><small>Customer money</small><strong>{{ money(machine.matchGiven) }}</strong></div>
        <div class="is-subtle"><small>Minimum in machine</small><strong>{{ money(machine.minimum) }}</strong></div>
        <div class="is-subtle"><small>Actual IN</small><strong>{{ machine.hasReading ? money(machine.actualIn) : '—' }}</strong></div>
        <div><small>{{ machine.extra >= 0 ? 'Extra over minimum' : 'Missing' }}</small><strong :class="machine.extra < 0 ? 'is-negative' : 'is-positive'">{{ machine.hasReading ? signedMoney(machine.extra) : '—' }}</strong></div>
        <div><small>Total matches</small><strong>{{ machine.matches.length }}</strong></div>
      </div>

      <div class="match-audit-target" :class="{ 'is-low': machine.shortTarget > 0 }">
        <div><small>Play target</small><strong>{{ money(machine.playTarget) }}</strong></div>
        <div class="match-audit-target-right"><small>{{ machine.shortTarget ? 'Short of target' : 'Over target' }}</small><strong>{{ money(machine.shortTarget || machine.overTarget) }}</strong></div>
      </div>

      <div class="match-audit-detail">
        <div class="match-audit-detail-head"><span>Employee</span><span>Customer</span><span>Time</span><span>Match</span></div>
        <div v-for="row in machine.customerRows" :key="row.key" class="match-audit-detail-row">
          <span class="match-audit-employee"><i :class="employeeColorClass(row.employeeId)"></i>{{ row.employeeName }}</span>
          <span :class="{ 'is-repeat': row.count > 1 }">{{ row.customerName }} <b v-if="row.count > 1" class="match-audit-repeat">{{ row.count }}×</b></span>
          <span class="match-audit-time">{{ displayTime(row.assignedAt) }}</span>
          <strong>{{ money(row.amount) }}</strong>
        </div>
        <div v-if="!machine.customerRows.length" class="match-audit-no-rows">No customer matches in this reading session.</div>
        <div class="match-audit-detail-footer"><strong>Total match</strong><strong>{{ money(machine.matchGiven) }}</strong></div>
      </div>
    </article>

    <div v-if="machines.length" class="match-audit-grand">
      <strong>All Machines — Grand Total</strong>
      <div class="match-audit-grand-grid">
        <div><small>Machines</small><strong>{{ machines.length }}</strong></div>
        <div><small>Flagged</small><strong>{{ flaggedCount }}</strong></div>
        <div><small>Matches</small><strong>{{ totals.count }}</strong></div>
        <div><small>Match given / Customer money</small><strong>{{ money(totals.matches) }} each</strong></div>
        <div><small>Minimum IN</small><strong>{{ money(totals.minimum) }}</strong></div>
        <div><small>Actual IN</small><strong>{{ money(totals.actualIn) }}</strong></div>
        <div><small>Extra / Missing</small><strong :class="totals.extra < 0 ? 'is-negative' : 'is-positive'">{{ signedMoney(totals.extra) }}</strong></div>
        <div><small>Play target</small><strong>{{ money(totals.target) }}</strong></div>
        <div><small>Short of target</small><strong>{{ money(totals.shortTarget) }}</strong></div>
        <div><small>Over target</small><strong>{{ money(totals.overTarget) }}</strong></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Grid, WarningFilled, Bottom, CircleCheckFilled } from '@element-plus/icons-vue'
import { getReadingMatchAudit } from '@/api/weeklyreport'

const props = defineProps<{
      readingSessionId: number
      locationId: number
      sessionNumber?: number | string | null
}>()

type Match = { id: number; machineId: number; customerId: number; customerName: string; employeeId: number; employeeName: string; amount: number; assignedAt: string }
type Machine = {
      id: number; machineNumber: number; machineType: string; actualIn: number; hasReading: boolean
      matches: Match[]; matchGiven: number; minimum: number; extra: number; flagged: boolean
      playTarget: number; shortTarget: number; overTarget: number
      breakdown: { amount: number; count: number }[]
      customerRows: (Match & { key: string; count: number })[]
}

const loading = ref(false)
const filter = ref('all')
const rawMachines = ref<any[]>([])
const rawMatches = ref<any[]>([])
const loadedSessionNumber = ref<number | string | null>(null)
let requestId = 0

const sessionLabel = computed(() => props.sessionNumber ?? loadedSessionNumber.value ?? props.readingSessionId)
const money = (value: number) => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 })
const signedMoney = (value: number) => `${value >= 0 ? '+' : '−'}${money(Math.abs(value))}`
const amountNumber = (value: number) => Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })
const employeeColorClass = (id: number) => `color-${Math.abs(Number(id) || 0) % 5}`
function displayTime(value: string) {
      if (!value) return '—'
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? value : d.toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const machines = computed<Machine[]>(() => rawMachines.value.map(raw => {
      const matches: Match[] = rawMatches.value.filter(x => Number(x.machineId) === Number(raw.id)).map(x => ({
        ...x, amount: Number(x.amount || 0)
      }))
      const matchGiven = matches.reduce((sum, x) => sum + x.amount, 0)
      const minimum = matchGiven * 2
      const actualIn = Number(raw.actualIn || 0)
      const hasReading = Boolean(raw.hasReading)
      const extra = actualIn - minimum
      const playTarget = matches.reduce((sum, x) => sum + x.amount * (x.amount >= 30 ? 8 : 5), 0)
      const amounts = new Map<number, number>()
      const customerMap = new Map<string, Match & { key: string; count: number }>()
      for (const match of matches) {
        amounts.set(match.amount, (amounts.get(match.amount) || 0) + 1)
        const key = `${match.customerId}:${match.employeeId}`
        const found = customerMap.get(key)
        if (found) {
          found.count += 1
          found.amount += match.amount
          if (match.assignedAt < found.assignedAt) found.assignedAt = match.assignedAt
        } else customerMap.set(key, { ...match, key, count: 1 })
      }
      return {
        id: Number(raw.id), machineNumber: raw.machineNumber, machineType: raw.machineType || 'Unassigned',
        actualIn, hasReading, matches, matchGiven, minimum, extra,
        flagged: minimum > 0 && (!hasReading || actualIn < minimum),
        playTarget, shortTarget: hasReading ? Math.max(0, playTarget - actualIn) : playTarget,
        overTarget: hasReading ? Math.max(0, actualIn - playTarget) : 0,
        breakdown: [...amounts].sort((a,b) => b[0] - a[0]).map(([amount,count]) => ({ amount, count })),
        customerRows: [...customerMap.values()].sort((a,b) => a.assignedAt.localeCompare(b.assignedAt))
      }
}))

const flaggedCount = computed(() => machines.value.filter(m => m.flagged).length)

const lowPlayMachines = computed(() =>
      machines.value.filter(m =>
        !m.flagged &&
        m.hasReading &&
        m.matches.length > 0 &&
        m.shortTarget > 0
      )
)

const onTargetMachines = computed(() =>
      machines.value.filter(m =>
        !m.flagged &&
        m.hasReading &&
        m.matches.length > 0 &&
        m.shortTarget <= 0
      )
)

const lowPlayCount = computed(() => lowPlayMachines.value.length)
const onTargetCount = computed(() => onTargetMachines.value.length)

const displayMachines = computed(() => {
      if (filter.value === 'flagged') return machines.value.filter(m => m.flagged)
      if (filter.value === 'low') return lowPlayMachines.value
      if (filter.value === 'target') return onTargetMachines.value
      return machines.value
})
const totals = computed(() => machines.value.reduce((sum, m) => ({
      count: sum.count + m.matches.length, matches: sum.matches + m.matchGiven,
      minimum: sum.minimum + m.minimum, actualIn: sum.actualIn + m.actualIn,
      extra: sum.extra + m.extra, target: sum.target + m.playTarget,
      shortTarget: sum.shortTarget + m.shortTarget, overTarget: sum.overTarget + m.overTarget
}), { count: 0, matches: 0, minimum: 0, actualIn: 0, extra: 0, target: 0, shortTarget: 0, overTarget: 0 }))

async function loadAudit() {
      const id = ++requestId
      rawMachines.value = []
      rawMatches.value = []
      loadedSessionNumber.value = null
      if (!props.readingSessionId || !props.locationId) return
      loading.value = true
      try {
        const response = await getReadingMatchAudit({ locationid: props.locationId, sessionid: props.readingSessionId })
        if (id !== requestId) return
        const data = response?.data?.machines ? response.data : response?.data?.data ?? {}
        rawMachines.value = Array.isArray(data.machines) ? data.machines : []
        rawMatches.value = Array.isArray(data.matches) ? data.matches : []
        loadedSessionNumber.value = data.session?.sessionNumber ?? null
      } catch (e) {
        if (id === requestId) ElMessage.error('Unable to load Match Points audit.')
      } finally {
        if (id === requestId) loading.value = false
      }
}

watch(() => [props.readingSessionId, props.locationId], loadAudit, { immediate: true })
</script>


<style scoped>
  .match-audit-filter-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    line-height: 1;
    white-space: nowrap;
  }

    .match-audit-filter-label .el-icon {
      flex: 0 0 auto;
      font-size: 13px;
    }

  /* Keep all audit filters reachable with a horizontal swipe on mobile. */
  @media (max-width: 767px) {
    .match-audit-toolbar {
      display: block;
      width: 100%;
      min-width: 0;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .match-audit-toolbar::-webkit-scrollbar {
      display: none;
    }

    .match-audit-toolbar :deep(.el-radio-group) {
      display: inline-flex;
      flex-wrap: nowrap;
      width: max-content;
      min-width: max-content;
    }

    .match-audit-toolbar :deep(.el-radio-button) {
      flex: 0 0 auto;
    }
  }
</style>
