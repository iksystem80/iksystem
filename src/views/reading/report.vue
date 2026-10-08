<template>
  <div class="app-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Reading Reports</h2>
        <p>Reconcile reading sessions, review completed sessions etc.</p>
      </div>
    </div>
    <div class="reading-report-page">
      <div class="filter-card">
        <div class="filter-layout mobile-select-refresh-row">
          <div class="filter-session">
            <label>Reading Session</label>
            <el-select v-model="selectedSessionId" placeholder="Select a reconcile or completed session" filterable clearable style="width: 100%" @change="handleSessionChange">
              <el-option v-for="session in completedSessions" :key="session.id" :label="`Session #${session.id} - ${formatDateTime(session.endedat)}`" :value="session.id">
                <div class="session-option">
                  <strong>Session #{{ session.id }}</strong>
                  <span>
                    {{ formatDateTime(session.endedat) }}
                    · {{ Number(session.status) === 2 ? 'Reconcile' : 'Completed' }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </div>
          <div class="filter-refresh">
            <el-button :icon="Refresh"
                       :loading="loadingReport"
                       class="mobile-icon-button"
                       aria-label="Refresh"
                       @click="refreshReport">
              <span class="button-label">Refresh</span>
            </el-button>
          </div>
        </div>
      </div>

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
              <div class="reading-summary-strip">
                <div class="reading-summary-item">
                  <strong>{{ selectedSession.id }}</strong>
                  <span>Session #</span>
                </div>

                <div class="reading-summary-item">
                  <strong class="reading-summary-date">{{ formatDateTime(selectedSession.startedat) }}</strong>
                  <span>Started</span>
                </div>

                <div class="reading-summary-item">
                  <strong class="reading-summary-date">{{ formatDateTime(selectedSession.endedat) }}</strong>
                  <span>{{ Number(selectedSession.status) === 2 ? 'Reading Finished' : 'Completed' }}</span>
                </div>

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
                    <span>SHORT PAY</span>
                    <strong>${{ formatMoney(ticketShortPayTotal) }}</strong>
                  </div>

                  <div class="ticket-reconcile-badge over">
                    <span>OVER TICKET PAID</span>
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


            <el-dialog v-model="ticketReconcileDialogVisible"
                       title="Match Tickets"
                       width="92%"
                       class="ticket-reconcile-dialog"
                       destroy-on-close>
              <div class="ticket-dialog-heading">
                <div>
                  <strong>Reading Session #{{ selectedSession?.id }}</strong>
                  <span>{{ formatDateTime(selectedSession?.endedat) }}</span>
                </div>
              </div>

              <div class="ticket-dialog-summary">
                <div>
                  <span class="ticket-reconcile-eyebrow">TICKET RECONCILIATION</span>
                  <strong class="ticket-reconcile-net"
                          :class="ticketVariance > 0 ? 'is-short' : ticketVariance < 0 ? 'is-over' : 'is-even'">
                    {{ signedMoney(ticketVariance) }}
                  </strong>
                  <p>
                    {{
                    ticketVariance > 0
                      ? 'Money still available — tickets were paid below machine OUT.'
                      : ticketVariance < 0
                        ? 'Tickets were paid above machine OUT.'
                        : 'Machine OUT and Ticket Out match exactly.'
                    }}
                  </p>
                </div>

                <div class="ticket-reconcile-badges">
                  <div class="ticket-reconcile-badge short">
                    <span>SHORT PAY</span>
                    <strong>${{ formatMoney(ticketShortPayTotal) }}</strong>
                  </div>
                  <div class="ticket-reconcile-badge over">
                    <span>OVER TICKET PAID</span>
                    <strong>${{ formatMoney(ticketOverPaidTotal) }}</strong>
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
              </div>

              <div class="ticket-dialog-filters">
                <el-button :type="ticketReconcileFilter === 'all' ? 'primary' : 'default'"
                           round
                           @click="ticketReconcileFilter = 'all'">
                  All · {{ ticketReconcileCounts.all }}
                </el-button>
                <el-button :type="ticketReconcileFilter === 'even' ? 'primary' : 'default'"
                           round
                           @click="ticketReconcileFilter = 'even'">
                  Even · {{ ticketReconcileCounts.even }}
                </el-button>
                <el-button :type="ticketReconcileFilter === 'short' ? 'success' : 'default'"
                           round
                           @click="ticketReconcileFilter = 'short'">
                  Short Pay · {{ ticketReconcileCounts.short }}
                </el-button>
                <el-button :type="ticketReconcileFilter === 'over' ? 'danger' : 'default'"
                           round
                           @click="ticketReconcileFilter = 'over'">
                  Over Ticket Paid · {{ ticketReconcileCounts.over }}
                </el-button>
              </div>

              <div class="ticket-machine-list">
                <div v-for="row in filteredTicketReconcileRows"
                     :key="row.id"
                     class="ticket-machine-row">
                  <div class="ticket-machine-number">
                    <span>MCH</span>
                    <strong>{{ row.machinenumber }}</strong>
                  </div>

                  <div class="ticket-machine-amount">
                    <span>READING OUT</span>
                    <strong>${{ formatMoney(row.dailyout) }}</strong>
                  </div>

                  <div class="ticket-machine-arrow">→</div>

                  <div class="ticket-machine-amount">
                    <span>TICKET OUT</span>
                    <strong>${{ formatMoney(row.ticketout) }}</strong>
                  </div>

                  <div class="ticket-machine-meta">
                    <span>{{ Number(row.ticketcount || 0) }} {{ Number(row.ticketcount || 0) === 1 ? 'ticket' : 'tickets' }}</span>
                    <small v-if="row.ticketemployees">{{ row.ticketemployees }}</small>
                  </div>

                  <div class="ticket-machine-status">
                    <el-tag :type="ticketReconcileType(row) === 'short' ? 'success' : ticketReconcileType(row) === 'over' ? 'danger' : 'info'"
                            effect="light"
                            round>
                      {{
                      ticketReconcileType(row) === 'short'
                        ? `+${formatMoney(ticketMachineVariance(row))}`
                        : ticketReconcileType(row) === 'over'
                          ? `-${formatMoney(Math.abs(ticketMachineVariance(row)))}`
                          : 'Even'
                      }}
                    </el-tag>
                    <small>
                      {{
                      ticketReconcileType(row) === 'short'
                        ? 'Short Pay'
                        : ticketReconcileType(row) === 'over'
                          ? 'Over Ticket Paid'
                          : 'Matched'
                      }}
                    </small>
                  </div>
                </div>

                <el-empty v-if="filteredTicketReconcileRows.length === 0"
                          description="No machines match this filter." />
              </div>
            </el-dialog>

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
                    </div>

                    <div>
                      <span class="covered-session-label">
                        Covered Points
                      </span>
                      <strong class="covered-points-value">
                        {{ formatNumber(employeeSession.coveredPoints ?? 0) }}
                      </strong>
                    </div>

                    <div>
                      <span class="covered-session-label">
                        PULL
                      </span>
                      <strong>
                        ${{ formatNumber(employeeSession.totalPull ?? 0) }}
                      </strong>
                    </div>

                    <div class="covered-session-time">
                      <span class="covered-session-label">Session Time</span>
                      <strong class="covered-session-time-value">
                        {{ formatDateTime(employeeSession.clockIn) }} - {{ formatDateTime(employeeSession.clockOut) }}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
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

                <el-table-column label="Ticket Out"
                                 min-width="105"
                                 align="right">
                  <template #default="{ row }">
                    {{ formatNumber(row.ticketout ?? 0) }}
                  </template>
                </el-table-column>

                <el-table-column label="OUT Check"
                                 min-width="105"
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

                    <div>
                      <span>Ticket Out</span>
                      <strong>
                        {{ formatNumber(row.ticketout ?? 0) }}
                      </strong>
                    </div>

                    <div>
                      <span>OUT Check</span>
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
                    </div>
                  </div>
                </el-card>
              </div>
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="Machine Type Wise" name="type">
            <el-card shadow="never" class="report-card mobile-report-container" v-loading="loadingReport">
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
        Refresh,
        Search, Tickets, Clock, CircleCheck, Monitor, Coin, TrendCharts, Download, Wallet
} from '@element-plus/icons-vue';

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
          if (index === 0) return 'TOTAL';
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
              return 'TOTAL';
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
          await ElMessageBox.confirm(
            `Post machine collection of ${formatNumber(machineCollectionAmount.value)} for reading session #${sessionId} to Admin cash custody? Remaining is ${formatNumber(expectedRemainingAmount.value)} plus Machine Daily OUT ${formatNumber(totalMachineOut.value)}. Profit is ${formatNumber(sessionProfit.value)} and PULL is ${formatNumber(totalPull.value)}. This financial entry is recorded once and cannot be posted twice.`,
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
                                  locationid.value
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
            'Expected remaining machine cash posted to finance.'
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
            `Complete reconciliation for reading session #${selectedSessionId.value}? This locks the session as completed.`,
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
            `Reading session #${selectedSessionId.value} reconciliation completed.`
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
