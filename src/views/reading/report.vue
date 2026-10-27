<template>
  <div class="app-container">
    <div class="page-header reading-report-header">
      <div class="reading-report-heading">
        <h2 class="page-title">Reading Reports</h2>
        <p>Reconcile reading sessions, review completed sessions etc.</p>
      </div>

      <div class="filter-card reading-report-header-filter">
        <div class="filter-layout mobile-select-refresh-row reading-session-row">
          <div class="filter-session">
            <label>Reading Session</label>
            <el-select class="reading-session-select" v-model="selectedSessionId" placeholder="Select a reconcile or completed session" clearable style="width: 100%" @change="handleSessionChange">
              <el-option v-for="session in completedSessions" :key="session.id" :label="`Session # ${session.sessionNumber ?? session.id} - ${formatDateTime(session.endedat)}`" :value="session.id">
                <div class="session-option">
                  <strong>Session # {{ session.sessionNumber ?? session.id }} </strong>
                  <span>
                    - {{ formatDateTime(session.endedat) }}
                    · {{ Number(session.status) === 2 ? 'Reconcile' : 'Completed' }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </div>
          <div class="filter-refresh">
            <el-button
                       :loading="loadingReport"
                       class="mobile-icon-button reading-report-refresh"
                       aria-label="Refresh"
                       @click="refreshReport">
              <el-icon><Refresh /></el-icon>
              <span class="button-label">Refresh</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="reading-report-page">

      <el-empty v-if="!selectedSessionId"
                description="Select a reconcile or completed reading session to view its report."
                class="report-empty" />

      <template v-else>
        <el-tabs v-model="activeReportTab" class="reading-report-tabs report-tabs-container">
          <el-tab-pane label="Overview" name="overview">
            <!-- ====================================================== -->
            <!-- READING SESSION SUMMARY -->
            <!-- ====================================================== -->

            <el-card v-if="selectedSession"
                     shadow="never"
                     class="reading-summary-card">
              <div style="position: relative;top: -10px;font-size: 10px;color: var(--el-text-color-secondary);">
                <strong class="reading-summary-date">{{ formatDateTime(selectedSession.startedat) }}</strong>
                -
                <strong class="reading-summary-date">{{ formatDateTime(selectedSession.endedat) }}</strong>
              </div>
              <div class="reading-summary-strip">
                <div class="reading-summary-item">
                  <strong>{{ selectedSession.sessionNumber ?? selectedSession.id }}</strong>
                  <span>Session #</span>
                </div>

                <!--<div class="reading-summary-item reading-summary-time">
                  <div class="reading-summary-time-values">
                    <div class="reading-summary-time-row">
                      <small>Started</small>
                      <strong class="reading-summary-date">{{ formatDateTime(selectedSession.startedat) }}</strong>
                    </div>
                    <div class="reading-summary-time-row">
                      <small>{{ Number(selectedSession.status) === 2 ? 'Reading Finished' : 'Completed' }}</small>
                      <strong class="reading-summary-date">{{ formatDateTime(selectedSession.endedat) }}</strong>
                    </div>
                  </div>
                  <span>Reading Time</span>
                </div>-->

                <div class="reading-summary-item">
                  <strong>{{ reportRows.length }}</strong>
                  <span>Machines</span>
                </div>

                <div class="reading-summary-item">
                  <strong>{{ formatNumber(sessionMachinePoints) }}</strong>
                  <span>Points</span>
                </div>

                <div class="reading-summary-item">
                  <strong :class="differenceTextClass(sessionProfit)">${{ formatNumber(sessionProfit) }}</strong>
                  <span>Profit</span>
                </div>

                <div class="reading-summary-item">
                  <strong>${{ formatNumber(totalPull) }}</strong>
                  <span>Total PULL</span>
                </div>

                <div class="reading-summary-item reading-summary-item-remaining">
                  <strong :class="differenceTextClass(expectedRemainingAmount)">
                    ${{ formatNumber(expectedRemainingAmount) }}
                  </strong>
                  <span>Expected Remaining Amount</span>
                </div>
              </div>
            </el-card>

            <el-alert v-if="selectedSession && Number(selectedSession.status) === 2"
                      title="This reading session is in reconciliation mode."
                      type="warning"
                      :closable="false"
                      show-icon
                      style="margin-bottom: 16px;">
              <template #default>
                Review Profit, Total PULL, and Expected Remaining Amount. When confirmed, complete reconciliation to lock the session as completed.
              </template>
            </el-alert>

            <div v-if="selectedSession && Number(selectedSession.status) === 2"
                 style="display:flex; justify-content:flex-end; margin-bottom:16px;">
              <el-button type="primary"
                         :loading="completingReconciliation"
                         @click="completeReconciliation">
                Complete Reconciliation
              </el-button>
            </div>

            <!-- ====================================================== -->
            <!-- TICKET OUT RECONCILIATION -->
            <!-- ====================================================== -->

            <div v-if="selectedSession"
                 class="ticket-reconcile-overview employee-banner-theme"
                 role="button"
                 tabindex="0"
                 @click="ticketReconcileDialogVisible = true"
                 @keydown.enter="ticketReconcileDialogVisible = true"
                 @keydown.space.prevent="ticketReconcileDialogVisible = true">
              <div class="ticket-reconcile-top">
                <div>
                  <span class="ticket-reconcile-eyebrow">TICKET RECONCILIATION</span>
                  <strong class="ticket-reconcile-net"
                          :class="ticketVariance > 0 ? 'is-short' : ticketVariance < 0 ? 'is-over' : 'is-even'">
                    {{ signedMoney(ticketVariance) }}
                  </strong>
                  <p>
                    {{
                    ticketVariance > 0
                      ? 'Machine OUT is higher than Ticket Out — short-paid tickets remain.'
                      : ticketVariance < 0
                        ? 'Ticket Out is higher than machine OUT — tickets were overpaid.'
                        : 'Machine OUT and Ticket Out match exactly.'
                    }}
                  </p>
                </div>

                <div class="ticket-reconcile-badges">
                  <div class="ticket-reconcile-badge short">
                    <span>SHORT PAID</span>
                    <strong>${{ formatMoney(ticketShortPayTotal) }}</strong>
                  </div>

                  <div class="ticket-reconcile-badge over">
                    <span>OVER PAID</span>
                    <strong>${{ formatMoney(ticketOverPaidTotal) }}</strong>
                  </div>
                </div>
              </div>

              <div class="ticket-reconcile-bottom">
                <div>
                  <span>READING OUT</span>
                  <strong>${{ formatMoney(totalMachineOut) }}</strong>
                  <small>{{ reportRows.length }} machines</small>
                </div>

                <div>
                  <span>TICKET OUT</span>
                  <strong>${{ formatMoney(totalTicketOut) }}</strong>
                  <small>{{ totalTicketCount }} tickets</small>
                </div>
              </div>

              <div class="ticket-reconcile-open-hint">
                Click to view machine reconciliation
              </div>
            </div>


            <!-- ====================================================== -->
            <!-- FINANCIAL POSTING -->
            <!-- ====================================================== -->

            <el-card v-if="selectedSession && isAdmin && Number(selectedSession.status) === 3"
                     shadow="never"
                     class="posting-card">
              <div class="posting-layout">
                <div class="posting-content">
                  <span class="posting-eyebrow">FINANCIAL RECONCILIATION</span>

                  <strong class="posting-total">
                    ${{ formatNumber(machineCollectionAmount) }}
                  </strong>

                  <p class="posting-summary-line">
                    Remaining Amount
                    <strong>${{ formatNumber(expectedRemainingAmount) }}</strong>
                    +
                    Ticket Out
                    <strong>${{ formatNumber(totalTicketOut) }}</strong>
                  </p>

                  <div v-if="!profitPosting" style="margin-top: 12px; max-width: 250px;">
                    <label style="display:block; margin-bottom:6px; font-size:11px; font-weight:600;">Actual Cash Collected</label>
                    <el-input-number v-model="actualPostingAmount" :min="0" :precision="2" :step="1" controls-position="right" style="width:100%" />
                    <div class="small-text" style="margin-top:6px;">
                      Finance Short / Over:
                      <strong :class="differenceTextClass(postingVariance)">${{ formatNumber(postingVariance) }}</strong>
                    </div>
                  </div>
                  <p v-else class="small-text" style="margin-top:8px;">
                    Actual: <strong>${{ formatNumber(profitPosting.amount) }}</strong>
                    <span v-if="profitPosting.calculatedAmount != null">
                      · Calculated: ${{ formatNumber(profitPosting.calculatedAmount) }}
                      · Short / Over:
                      <strong :class="differenceTextClass(Number(profitPosting.amount) - Number(profitPosting.calculatedAmount))">
                        ${{ formatNumber(Number(profitPosting.amount) - Number(profitPosting.calculatedAmount)) }}
                      </strong>
                    </span>
                  </p>
                  <p v-if="profitPosting"
                     class="small-text posting-meta">
                    Posted by
                    {{
                    profitPosting.postedByName ||
                      `User #${profitPosting.postedBy}`
                    }}
                    · {{ formatDateTime(profitPosting.postedAt) }}
                    · Entry #{{ profitPosting.id }}
                  </p>
                </div>

                <div class="posting-action">
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
                    Post Remaining to Finance
                  </el-button>
                </div>
              </div>

              <el-alert v-if="postingError"
                        type="error"
                        :title="postingError"
                        :closable="false"
                        class="posting-error" />
            </el-card>


            <TicketReconciliationDialog v-model="ticketReconcileDialogVisible"
                                        :session-id="selectedSession?.id"
                                        :ended-at="formatDateTime(selectedSession?.endedat)"
                                        :rows="reportRows" />

            <!-- ====================================================== -->
            <!-- COVERED EMPLOYEE SESSIONS -->
            <!-- ====================================================== -->

            <el-card v-if="selectedSession"
                     shadow="never"
                     class="covered-sessions-card app-table-card">
              <template #header>
                <div class="covered-sessions-header">
                  <div class="app-table-card-header">
                    <el-icon><User /></el-icon>
                    <div class="app-table-card-title">
                      <strong>Covered Employee Sessions</strong>
                      <div class="small-text">
                        {{ coveredEmployeeSessions.length }} employee
                        {{ coveredEmployeeSessions.length === 1 ? 'session' : 'sessions' }}
                        included in this reading session
                      </div>
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

              <div v-else class="app-table-wrap covered-employee-table-wrap">
                <el-table :data="coveredEmployeeSessions"
                          style="width: 100%"
                          class="app-data-table is-compact covered-employee-table"
                          row-key="id"
                          :row-style="() => ({ cursor: 'pointer' })"
                          @row-click="openEmployeeShiftReport">
                  <el-table-column prop="employeeName"
                                   label="Employee"
                                   min-width="120">
                    <template #default="{ row }">
                      <strong>{{ row.employeeName || 'Employee' }}</strong>
                    </template>
                  </el-table-column>

                  <el-table-column prop="id"
                                   label="Session"
                                   width="82">
                    <template #default="{ row }">
                      <strong>#{{ row.id }}</strong>
                    </template>
                  </el-table-column>

                  <el-table-column label="Working Hours"
                                   min-width="112">
                    <template #default="{ row }">
                      {{ formatHours(employeeSessionHours(row)) }}
                    </template>
                  </el-table-column>

                  <el-table-column prop="sessionPoints"
                                   label="Session Points"
                                   min-width="105">
                    <template #default="{ row }">
                      <strong class="session-points-value">
                        {{ formatNumber(row.sessionPoints ?? 0) }}
                      </strong>
                    </template>
                  </el-table-column>

                  <el-table-column label="Covered Points"
                                   min-width="112">
                    <template #default="{ row }">
                      <strong class="covered-points-value">
                        {{ formatNumber(row.coveredPoints ?? 0) }}
                        ({{ formatNumber(row.extraMatchPoints ?? 0) }})
                      </strong>
                    </template>
                  </el-table-column>

                  <el-table-column prop="totalTicketOut"
                                   label="Ticket Out"
                                   min-width="92">
                    <template #default="{ row }">
                      <strong>${{ formatMoney(row.totalTicketOut ?? 0) }}</strong>
                    </template>
                  </el-table-column>

                  <el-table-column prop="shortOver"
                                   label="Short / Over"
                                   min-width="100">
                    <template #default="{ row }">
                      <strong>{{ signedMoney(row.shortOver ?? 0) }}</strong>
                    </template>
                  </el-table-column>

                  <el-table-column prop="totalPull"
                                   label="PULL"
                                   min-width="82">
                    <template #default="{ row }">
                      <strong>${{ formatMoney(row.totalPull ?? 0) }}</strong>
                    </template>
                  </el-table-column>

                  <el-table-column label="Session Time"
                                   min-width="285">
                    <template #default="{ row }">
                      <span class="covered-session-time-value">
                        {{ formatDateTime(row.clockIn) }} - {{ formatDateTime(row.clockOut) }}
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>

            <el-dialog v-model="employeeShiftDialogVisible"
                       class="employee-shift-report-dialog"
                       width="92%"
                       top="3vh"
                       destroy-on-close
                       append-to-body
                       :fullscreen="device === 'mobile'"
                       @closed="handleEmployeeShiftDialogClosed">
              <ShiftReport v-if="selectedEmployeeShiftSessionId"
                           :session-id="selectedEmployeeShiftSessionId"
                           embedded />
            </el-dialog>

          </el-tab-pane>
          <el-tab-pane label="Machine Wise" name="machine">
            <!-- ====================================================== -->
            <!-- DESKTOP MACHINE REPORT -->
            <!-- ====================================================== -->

            <el-card shadow="never"
                     class="report-card app-table-card reading-report-table-card"
                     v-loading="loadingReport">
              <template #header>
                <div class="report-card-header">
                  <div class="app-table-card-header">
                    <el-icon><Monitor /></el-icon>
                    <div class="app-table-card-title">
                      <strong>Machine Reading Report</strong>
                      <div class="hint">{{ filteredRows.length }} machine {{filteredRows.length === 1? 'reading': 'readings'}}
                      </div>
                    </div>
                  </div>

                  <div class="covered-sessions-totals">
                    <el-tag effect="light" type="info">
                      Machine OUT: {{ formatNumber(totalMachineOut) }}
                    </el-tag>
                    <el-tag effect="light" type="primary">
                      Ticket Out: {{ formatNumber(totalTicketOut) }}
                    </el-tag>
                    <el-tag effect="light"
                            :type="ticketOutTotalsMatch ? 'success' : 'danger'">
                      {{ ticketOutTotalsMatch ? 'OUT Match' : 'OUT Mismatch' }}
                    </el-tag>
                  </div>
                </div>
              </template>

              <el-empty v-if="
                        !loadingReport &&
                          filteredRows.length === 0
                      "
                        description="No machine readings found." />

              <div v-else class="app-table-wrap reading-report-table-wrap reading-machine-table-wrap">
                <el-table :data="filteredRows"
                          show-summary
                          :summary-method="getSummaries"
                          style="width: 100%"
                          class="report-table app-data-table reading-machine-wise-table">
                  <el-table-column prop="machinenumber"
                                   label="MCH #"
                                   min-width="60"
                                   fixed="left">
                    <template #default="{ row }">
                      <span class="weekly-machine-number-badge">
                        {{ row.machinenumber }}
                      </span>
                    </template>
                  </el-table-column>

                  <el-table-column label="Prev. IN"
                                   min-width="90"
                                   align="right">
                    <template #default="{ row }">
                      {{ displayValue(row.previousin) }}
                    </template>
                  </el-table-column>

                  <el-table-column label="Prev. OUT"
                                   min-width="90"
                                   align="right">
                    <template #default="{ row }">
                      {{ displayValue(row.previousout) }}
                    </template>
                  </el-table-column>

                  <el-table-column label="Curr. IN"
                                   min-width="90"
                                   align="right">
                    <template #default="{ row }">
                      {{ displayValue(row.currentin) }}
                    </template>
                  </el-table-column>

                  <el-table-column label="Curr. OUT"
                                   min-width="90"
                                   align="right">
                    <template #default="{ row }">
                      {{ displayValue(row.currentout) }}
                    </template>
                  </el-table-column>

                  <el-table-column label="Daily IN"
                                   min-width="90"
                                   align="right">
                    <template #default="{ row }">
                      {{ displayValue(row.dailyin) }}
                    </template>
                  </el-table-column>

                  <el-table-column label="Daily OUT"
                                   min-width="90"
                                   align="right">
                    <template #default="{ row }">
                      {{ displayValue(row.dailyout) }}
                    </template>
                  </el-table-column>

                  <el-table-column label="Ticket Out"
                                   min-width="95"
                                   align="right">
                    <template #default="{ row }">
                      {{ formatNumber(row.ticketout ?? 0) }}
                    </template>
                  </el-table-column>

                  <el-table-column label="OUT Check"
                                   min-width="100"
                                   align="center">
                    <template #default="{ row }">
                      <el-tag :type="
                              ticketReconcileType(row) === 'short'
                                ? 'success'
                                : ticketReconcileType(row) === 'over'
                                  ? 'danger'
                                  : 'info'
                            "
                              effect="light"
                              round>
                        {{
                        ticketReconcileType(row) === 'short'
                          ? 'Short Paid'
                          : ticketReconcileType(row) === 'over'
                            ? 'Over Paid'
                            : 'Even'
                        }}
                      </el-tag>
                    </template>
                  </el-table-column>

                  <el-table-column label="Difference"
                                   min-width="90"
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
                                   label="Points"
                                   min-width="90"
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
                                   min-width="90"
                                   align="right">
                    <template #default="{ row }">
                      {{ lifePayPercent(row) }}
                    </template>
                  </el-table-column>

                  <el-table-column label="Life Hold %"
                                   min-width="90"
                                   align="right">
                    <template #default="{ row }">
                      {{ lifeHoldPercent(row) }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>

          </el-tab-pane>
          <el-tab-pane label="Machine Type Wise" name="type">
            <el-card shadow="never" class="report-card app-table-card reading-report-table-card" v-loading="loadingReport">
              <template #header>
                <div class="report-card-header">
                  <div class="app-table-card-header">
                    <el-icon><TrendCharts /></el-icon>
                    <div class="app-table-card-title">
                      <strong>Totals by Machine Type</strong>
                      <div class="hint">
                        {{ machineTypeRows.length }} machine types
                      </div>
                    </div>
                    <div class="small-text" v-if="search.trim()">Based on filtered machines</div>
                  </div>
                  </div>
              </template>
              <el-empty v-if="!loadingReport && !machineTypeRows.length"
                        description="No machine type readings found." />
              <div v-else class="app-table-wrap reading-report-table-wrap reading-machine-type-table-wrap">
                <el-table :data="machineTypeRows" show-summary
                          :summary-method="getTypeSummaries"
                          class="report-table app-data-table reading-machine-type-table"
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
              </div>

            </el-card>
          </el-tab-pane>
        </el-tabs>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
            computed,
            onMounted,
            ref,
            watch
} from 'vue';


import {
            ElMessage,
            ElMessageBox
} from 'element-plus';

import { useUserStore } from '@/store/modules/user';
import { useAppStore } from '@/store/modules/app';

import {
            getCompletedSessions,
            getSessionReport,
            endsession
} from '@/api/reading';

import {
            getReadingProfitPosting,
            postReadingProfit
} from '@/api/employeefinance';

import ShiftReport from '@/views/operation/employeesession/shiftreport.vue';
import TicketReconciliationDialog from '@/views/components/ticket_reconciliation_dialog.vue';

const userStore =
                  useUserStore();

const appStore =
                  useAppStore();


const locationid =
                  computed(
                    () =>
                      userStore.locationId
                  );

const device =
                  computed(
                    () =>
                      appStore.device
                  );

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
                  );

const completedSessions =
                  ref<any[]>([]);

const reportRows =
                  ref<any[]>([]);

const coveredEmployeeSessions =
                  ref<any[]>([]);

const selectedSession =
                  ref<any>(null);

const selectedSessionId =
                  ref<number | null>(null);

const search =
                  ref('');

const activeReportTab = ref<'overview' | 'machine' | 'type'>('overview');

const loadingSessions =
                  ref(false);

const loadingReport =
                  ref(false);

const checkingProfitPosting =
                  ref(false);

const postingProfit =
                  ref(false);

const profitPosting =
                  ref<any>(null);

const actualPostingAmount = ref<number | undefined>(undefined);
const postingVariance = computed(() => Number(actualPostingAmount.value ?? 0) - machineCollectionAmount.value);

const postingError =
                  ref('');

const totalPull =
                  ref(0);

const completingReconciliation =
                  ref(false);

const ticketReconcileDialogVisible =
                  ref(false);

const ticketReconcileFilter =
                  ref<'all' | 'even' | 'short' | 'over'>('all');


const employeeShiftDialogVisible = ref(false);
const selectedEmployeeShiftSessionId = ref<number | null>(null);

// Backend authenticates and authorizes every posting.
// The browser never supplies actor or amount.

const filteredRows =
                  computed(
                    () => {
                      const term =
                              search.value
                                .trim()
                                .toLowerCase();

                      if (!term) {
                        return reportRows.value;
                      }

                      return reportRows.value.filter(
                        row =>
                          String(
                            row.machinenumber ?? ''
                          )
                            .toLowerCase()
                            .includes(term)
                      );
                    }
                  );

// Aggregate the SAME session rows used by the machine-wise report.
// IN/OUT here are daily deltas, not lifetime meter readings.
// No bonus field exists in the supplied reading data, so bonus is 0.
const machineTypeRows = computed(() => {
            const groups = new Map<string, any>();
            for (const row of filteredRows.value) {
              const typeKey = row.machinetypeid == null ? 'unassigned' : String(row.machinetypeid);
              if (!groups.has(typeKey)) {
                groups.set(typeKey, {
                  typeKey,
                  typeName: row.machinetypename || 'Unassigned',
                  machineCount: 0, dailyin: 0, dailyout: 0,
                  difference: 0, machinepoints: 0, bonus: 0, net: 0
                });
              }
              const group = groups.get(typeKey);
              group.machineCount++;
              for (const field of ['dailyin', 'dailyout', 'difference', 'machinepoints']) {
                const value = Number(row[field]);
                if (Number.isFinite(value)) group[field] += value;
              }
            }
            return Array.from(groups.values())
              .map(group => ({ ...group, net: group.difference - group.machinepoints - group.bonus }))
              .sort((a, b) => a.typeName.localeCompare(b.typeName));
});

function getTypeSummaries({ columns, data }: { columns: any[], data: any[] }) {
            const fields = ['typeName', 'machineCount', 'dailyin', 'dailyout',
              'difference', 'machinepoints', 'bonus', 'net'];
            return columns.map((_column, index) => {
              if (index === 0) return 'Total';
              const field = fields[index];
              if (!field) return '';
              return formatNumber(data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0));
            });
}

function formatDateTime(
            value:
                      string |
                      Date |
                      null |
                      undefined
) {
            if (!value) {
              return '--';
            }

            const date =
                      new Date(value);

            if (
              Number.isNaN(
                date.getTime()
              )
            ) {
              return '--';
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
            ).format(date);
}

function formatNumber(
            value: any
) {
            if (
              value === null ||
                      value === undefined ||
                      value === ''
            ) {
              return '--';
            }

            const number =
                      Number(value);

            if (
              Number.isNaN(number)
            ) {
              return '--';
            }

            return new Intl.NumberFormat(
              'en-US'
            ).format(number);
}

function displayValue(
            value: any
) {
            return formatNumber(value);
}

const totalCoveredSessionPoints = computed(() =>
            coveredEmployeeSessions.value.reduce((sum, employeeSession) => {
              const points = Number(employeeSession.sessionPoints ?? 0);
              return sum + (Number.isFinite(points) ? points : 0);
            }, 0)
);

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
              return 0;
            }

            const start =
                      new Date(
                        employeeSession.clockIn
                      ).getTime();

            const end =
                      new Date(
                        employeeSession.clockOut
                      ).getTime();

            if (
              !Number.isFinite(start) ||
                      !Number.isFinite(end) ||
                      end < start
            ) {
              return 0;
            }

            return (
              end -
                      start
            ) / 3600000;
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
                  );

function formatHours(
            value: any
) {
            const hours =
                      Number(
                        value || 0
                      );

            if (
              !Number.isFinite(hours) ||
                      hours < 0
            ) {
              return '0h 0m';
            }

            const totalMinutes =
                      Math.round(
                        hours * 60
                      );

            const wholeHours =
                      Math.floor(
                        totalMinutes / 60
                      );

            const minutes =
                      totalMinutes % 60;

            return `${wholeHours}h ${minutes}m`;
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
                                      );

                          return (
                            sum +
                                      (
                                        Number.isFinite(value)
                                          ? value
                                          : 0
                                      )
                          );
                        },
                        0
                      )
                  );

const expectedRemainingAmount =
                  computed(
                    () =>
                      Number(sessionProfit.value || 0) -
                      Number(totalPull.value || 0)
                  );

const machineCollectionAmount =
                  computed(
                    () =>
                      Number(expectedRemainingAmount.value || 0) +
                      Number(totalMachineOut.value || 0)
                  );

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
                                      );

                          return (
                            sum +
                                      (
                                        Number.isFinite(value)
                                          ? value
                                          : 0
                                      )
                          );
                        },
                        0
                      )
                  );

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
                                      );

                          return (
                            sum +
                                      (
                                        Number.isFinite(value)
                                          ? value
                                          : 0
                                      )
                          );
                        },
                        0
                      )
                  );

const totalMachineOut =
                  computed(
                    () =>
                      filteredRows.value.reduce(
                        (sum, row) => {
                          const value = Number(row.dailyout);
                          return sum + (Number.isFinite(value) ? value : 0);
                        },
                        0
                      )
                  );

const totalTicketOut =
                  computed(
                    () =>
                      filteredRows.value.reduce(
                        (sum, row) => {
                          const value = Number(row.ticketout);
                          return sum + (Number.isFinite(value) ? value : 0);
                        },
                        0
                      )
                  );

const ticketOutTotalsMatch =
                  computed(
                    () =>
                      Math.abs(
                        Number(totalMachineOut.value || 0) -
                        Number(totalTicketOut.value || 0)
                      ) < 0.005
                  );

const totalTicketCount =
                  computed(
                    () =>
                      reportRows.value.reduce(
                        (sum, row) => sum + (Number(row.ticketcount) || 0),
                        0
                      )
                  );

function ticketMachineVariance(row: any) {
            return Number(row?.dailyout || 0) - Number(row?.ticketout || 0);
}

function ticketReconcileType(row: any): 'even' | 'short' | 'over' {
            const variance = ticketMachineVariance(row);

            if (Math.abs(variance) < 0.005) return 'even';
            return variance > 0 ? 'short' : 'over';
}

const ticketShortPayTotal =
                  computed(
                    () =>
                      reportRows.value.reduce(
                        (sum, row) => {
                          const variance = ticketMachineVariance(row);
                          return sum + (variance > 0 ? variance : 0);
                        },
                        0
                      )
                  );

const ticketOverPaidTotal =
                  computed(
                    () =>
                      reportRows.value.reduce(
                        (sum, row) => {
                          const variance = ticketMachineVariance(row);
                          return sum + (variance < 0 ? Math.abs(variance) : 0);
                        },
                        0
                      )
                  );

const ticketVariance =
                  computed(
                    () =>
                      Number(totalMachineOut.value || 0) -
                      Number(totalTicketOut.value || 0)
                  );

const ticketReconcileCounts =
                  computed(
                    () => {
                      const counts = {
                        all: reportRows.value.length,
                        even: 0,
                        short: 0,
                        over: 0
                      };

                      for (const row of reportRows.value) {
                        counts[ticketReconcileType(row)]++;
                      }

                      return counts;
                    }
                  );

const filteredTicketReconcileRows =
                  computed(
                    () => {
                      if (ticketReconcileFilter.value === 'all') {
                        return reportRows.value;
                      }

                      return reportRows.value.filter(
                        row => ticketReconcileType(row) === ticketReconcileFilter.value
                      );
                    }
                  );

function formatMoney(value: any) {
            const number = Number(value || 0);

            return new Intl.NumberFormat(
              'en-US',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }
            ).format(Number.isFinite(number) ? number : 0);
}

function signedMoney(value: any) {
            const number = Number(value || 0);
            const absolute = formatMoney(Math.abs(number));

            if (Math.abs(number) < 0.005) return '$0.00';
            return number > 0 ? `+$${absolute}` : `-$${absolute}`;
}

function ticketOutMatches(row: any) {
            const machineOut = Number(row?.dailyout || 0);
            const ticketOut = Number(row?.ticketout || 0);

            if (
              !Number.isFinite(machineOut) ||
              !Number.isFinite(ticketOut)
            ) {
              return false;
            }

            return Math.abs(machineOut - ticketOut) < 0.005;
}

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
                                      );

                          return (
                            sum +
                                      (
                                        Number.isFinite(value)
                                          ? value
                                          : 0
                                      )
                          );
                        },
                        0
                      )
                  );

function differenceTextClass(
            value: number
) {
            if (value > 0) {
              return 'profit-positive';
            }

            if (value < 0) {
              return 'profit-negative';
            }

            return 'profit-neutral';
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
              'ticketout',
              '',
              'difference',
              'machinepoints'
            ];

            return columns.map(
              (
                _column,
                index
              ) => {
                if (
                  index === 0
                ) {
                  return 'Total';
                }

                if (index === 8) {
                  const machineOut = data.reduce(
                    (sum: number, row: any) => sum + (Number(row.dailyout) || 0),
                    0
                  );
                  const ticketOut = data.reduce(
                    (sum: number, row: any) => sum + (Number(row.ticketout) || 0),
                    0
                  );

                  return Math.abs(machineOut - ticketOut) < 0.005
                    ? 'MATCH'
                    : 'MISMATCH';
                }

                // OUT Check, Life Pay % and Life Hold % are not numeric totals.

                if (
                  index >=
                              fields.length
                ) {
                  return '';
                }

                const field =
                              fields[index];

                const total =
                              data.reduce(
                                (
                                  sum: number,
                                  row: any
                                ) => {
                                  const value =
                                          Number(
                                            row[field]
                                          );

                                  return (
                                    sum +
                                          (
                                            Number.isFinite(
                                              value
                                            )
                                              ? value
                                              : 0
                                          )
                                  );
                                },
                                0
                              );

                return formatNumber(total);
              }
            );
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
                      );

            const currentOut =
                      Number(
                        row.currentout
                      );

            if (
              !Number.isFinite(
                currentIn
              ) ||
                      currentIn <= 0 ||
                      !Number.isFinite(
                        currentOut
                      )
            ) {
              return '0.00%';
            }

            return `${(
              (
                currentOut /
                              currentIn
              ) *
                          100
            ).toFixed(2)
            }%`;
}

function lifeHoldPercent(
            row: any
) {
            const currentIn =
                      Number(
                        row.currentin
                      );

            const currentOut =
                      Number(
                        row.currentout
                      );

            if (
              !Number.isFinite(
                currentIn
              ) ||
                      currentIn <= 0 ||
                      !Number.isFinite(
                        currentOut
                      )
            ) {
              return '0.00%';
            }

            return `${(
              100 -
                          (
                            currentOut /
                              currentIn
                          ) *
                          100
            ).toFixed(2)
            }%`;
}

function differenceType(
            value: any
) {
            const number =
                      Number(value);

            if (
              number > 0
            ) {
              return 'success';
            }

            if (
              number < 0
            ) {
              return 'danger';
            }

            return 'info';
}

// ============================================================
// LOAD COMPLETED READING SESSIONS
// ============================================================

async function loadCompletedSessions() {
            if (
              !locationid.value
            ) {
              completedSessions.value = [];

              return;
            }

            try {
              loadingSessions.value = true;

              const response =
                          await getCompletedSessions(
                            locationid.value
                          );

              completedSessions.value =
                          response.data ?? [];
            } catch (error) {
              console.error(error);

              completedSessions.value = [];

              ElMessage.error(
                'Unable to load completed reading sessions.'
              );
            } finally {
              loadingSessions.value = false;
            }
}

// ============================================================
// SESSION CHANGE
// ============================================================

async function handleSessionChange(
            value: number | null
) {
            activeReportTab.value = 'overview';
            profitPosting.value = null;
            actualPostingAmount.value = undefined;
            postingError.value = '';
            reportRows.value = [];
            coveredEmployeeSessions.value = [];
            totalPull.value = 0;
            ticketReconcileDialogVisible.value = false;
            ticketReconcileFilter.value = 'all';
            selectedSession.value = null;

            if (!value) {
              return;
            }

            selectedSession.value =
                      completedSessions.value.find(
                        session =>
                          Number(
                            session.id
                          ) ===
                              Number(value)
                      ) ?? null;

            await loadReport();
}

// ============================================================
// LOAD SESSION REPORT
// ============================================================

async function loadReport() {
            if (
              !selectedSessionId.value ||
                      !locationid.value
            ) {
              reportRows.value = [];
              coveredEmployeeSessions.value = [];

              return;
            }

            try {
              loadingReport.value = true;

              const response =
                          await getSessionReport(
                            selectedSessionId.value,
                            locationid.value
                          );

              reportRows.value =
                          (response.data?.readings ?? []).map(
                            (row: any) => {
                              const previousIn =
                                      Number(row.previousin ?? 0);
                              const previousOut =
                                      Number(row.previousout ?? 0);
                              const currentIn =
                                      Number(row.currentin ?? 0);
                              const currentOut =
                                      Number(row.currentout ?? 0);

                              const dailyIn =
                                      currentIn - previousIn;
                              const dailyOut =
                                      currentOut - previousOut;

                              return {
                                ...row,
                                previousin: previousIn,
                                previousout: previousOut,
                                currentin: currentIn,
                                currentout: currentOut,
                                dailyin: dailyIn,
                                dailyout: dailyOut,
                                difference:
                                        dailyIn - dailyOut
                              };
                            }
                          );

              coveredEmployeeSessions.value =
                          response.data?.employeeSessions ?? [];

              totalPull.value =
                          Number(response.data?.reconciliation?.totalPull || 0);

              if (
                response.data?.session
              ) {
                selectedSession.value = {
                  ...selectedSession.value,
                  ...response.data.session
                };
              }

              if (
                isAdmin.value &&
                Number(selectedSession.value?.status) === 3
              ) {
                await loadProfitPosting();
              }
            } catch (error) {
              console.error(error);

              reportRows.value = [];
              coveredEmployeeSessions.value = [];
              totalPull.value = 0;

              ElMessage.error(
                'Unable to load reading report.'
              );
            } finally {
              loadingReport.value = false;
            }
}

function openEmployeeShiftReport(employeeSession: any) {
            const sessionId = Number(employeeSession?.id);

            if (!sessionId) {
              return;
            }

            selectedEmployeeShiftSessionId.value = sessionId;
            employeeShiftDialogVisible.value = true;
}

function handleEmployeeShiftDialogClosed() {
            selectedEmployeeShiftSessionId.value = null;
}

// ============================================================
// LOAD PROFIT POSTING STATUS
// ============================================================

async function loadProfitPosting() {
            const sessionId =
                      selectedSessionId.value;

            if (
              !sessionId ||
                      !locationid.value
            ) {
              return;
            }

            checkingProfitPosting.value = true;
            postingError.value = '';

            try {
              const response =
                          await getReadingProfitPosting(
                            sessionId,
                            locationid.value
                          );

              if (
                Number(
                  selectedSessionId.value
                ) ===
                          Number(sessionId)
              ) {
                profitPosting.value =
                              response.data?.posting ??
                              null;
                if (!profitPosting.value && actualPostingAmount.value === undefined) {
                  actualPostingAmount.value = machineCollectionAmount.value;
                }
              }
            } catch (error: any) {
              postingError.value =
                          error?.response?.data?.message ||
                          'Unable to verify financial posting status. Posting is disabled until status can be checked.';

              profitPosting.value =
                          null;
            } finally {
              checkingProfitPosting.value =
                          false;
            }
}

// ============================================================
// POST PROFIT
// ============================================================

async function postSessionProfit() {
            const sessionId =
                      selectedSessionId.value;

            if (
              !sessionId ||
                      !locationid.value ||
                      postingProfit.value ||
                      profitPosting.value ||
                      postingError.value
            ) {
              return;
            }

            try {
              if (actualPostingAmount.value === undefined || !Number.isFinite(actualPostingAmount.value) || actualPostingAmount.value < 0) {
                ElMessage.warning('Enter the actual cash collected.');
                return;
              }
              await ElMessageBox.confirm(
                `Post actual machine cash $${formatNumber(actualPostingAmount.value)} to Admin custody for Reading Session # ${selectedSession.value?.sessionNumber ?? sessionId}? Calculated collection is $${formatNumber(machineCollectionAmount.value)}; Finance Short/Over is $${formatNumber(postingVariance.value)}. This transaction cannot be posted twice.`,
                'Confirm financial posting',
                {
                  type: 'warning',
                  confirmButtonText:
                                  'Post Profit',
                  cancelButtonText:
                                  'Cancel'
                }
              );
            } catch {
              return;
            }

            postingProfit.value =
                      true;

            try {
              // No amount/user ID is accepted from the browser.
              // The server recomputes profit and resolves the user.

              const response =
                          await postReadingProfit(
                            sessionId,
                            {
                              locationid:
                                      locationid.value,
                              actualamount: actualPostingAmount.value
                            }
                          );

              profitPosting.value =
                          response.data?.posting ??
                          null;

              if (
                !profitPosting.value
              ) {
                await loadProfitPosting();
              }

              ElMessage.success(
                'Actual machine cash posted to finance.'
              );
            } catch (error: any) {
              ElMessage.error(
                error?.response?.data?.message ||
                          'Unable to post session profit.'
              );

              if (
                isAdmin.value
              ) {
                await loadProfitPosting();
              }
            } finally {
              postingProfit.value =
                          false;
            }
}

// ============================================================
// COMPLETE RECONCILIATION
// ============================================================

async function completeReconciliation() {
            if (
              !selectedSessionId.value ||
              !locationid.value ||
              Number(selectedSession.value?.status) !== 2 ||
              completingReconciliation.value
            ) {
              return;
            }

            try {
              await ElMessageBox.confirm(
                `Complete reconciliation for reading session # ${selectedSession.value?.sessionNumber ?? selectedSessionId.value}? This locks the session as completed.`,
                'Complete Reading Reconciliation',
                {
                  type: 'warning',
                  confirmButtonText: 'Complete Reconciliation',
                  cancelButtonText: 'Cancel'
                }
              );
            } catch {
              return;
            }

            try {
              completingReconciliation.value = true;

              await endsession(
                selectedSessionId.value,
                locationid.value
              );

              ElMessage.success(
                `Reading session # ${selectedSessionId.value} reconciliation completed.`
              );

              await loadCompletedSessions();
              await loadReport();
            } catch (error: any) {
              ElMessage.error(
                error?.response?.data?.message ||
                'Unable to complete reading reconciliation.'
              );
            } finally {
              completingReconciliation.value = false;
            }
}

// ============================================================
// REFRESH
// ============================================================

async function refreshReport() {
            await loadCompletedSessions();

            if (
              selectedSessionId.value
            ) {
              await loadReport();
            }
}

// ============================================================
// LOCATION WATCH
// ============================================================

watch(
            locationid,
            async newLocation => {
              selectedSessionId.value =
                          null;

              selectedSession.value =
                          null;

              reportRows.value =
                          [];

              coveredEmployeeSessions.value =
                          [];

              totalPull.value =
                          0;

              profitPosting.value =
                          null;

              postingError.value =
                          '';

              search.value =
                          '';

              if (
                newLocation
              ) {
                await loadCompletedSessions();
              }
            }
);

onMounted(
            async () => {
              await loadCompletedSessions();
            }
);
</script>
