<template>
  <div class="app-container weekly-report-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Weekly Report</h2>
        <p>
          {{ weekModeLabel }} · {{ formattedWeekRange }}
        </p>
      </div>

      <div class="header-actions">
        <el-button type="primary" @click="openWeekFilter">
          <el-icon><Filter /></el-icon>
          <span>Filter</span>
        </el-button>
      </div>
    </div>

    <el-drawer v-model="filterDrawerVisible"
               direction="rtl"
               size="360px"
               :with-header="false">
      <div class="drawer-header">
        <div class="drawer-icon">
          <el-icon><Filter /></el-icon>
        </div>

        <div>
          <div class="drawer-title">Filter Weekly Report</div>
          <div class="drawer-subtitle">
            Select the week you want to review.
          </div>
        </div>
      </div>

      <div class="filter-section space-top">
        <div class="filter-label">Week</div>

        <el-radio-group v-model="draftWeekMode">
          <el-radio-button label="current">
            Current Week
          </el-radio-button>

          <el-radio-button label="last">
            Last Week
          </el-radio-button>

          <el-radio-button label="custom">
            Custom Week
          </el-radio-button>
        </el-radio-group>
      </div>

      <div v-if="draftWeekMode === 'custom'"
           class="filter-section space-top">
        <div class="filter-label">Custom Week</div>

        <el-date-picker v-model="draftCustomRange"
                        type="daterange"
                        range-separator="to"
                        start-placeholder="Monday"
                        end-placeholder="Sunday"
                        value-format="YYYY-MM-DD"
                        format="MM/DD/YYYY"
                        :clearable="false"
                        style="width: 100%;" />
      </div>

      <template #footer>
        <el-button @click="clearWeekFilter">
          Clear
        </el-button>

        <el-button type="primary" @click="applyWeekFilter">
          Apply Filter
        </el-button>
      </template>
    </el-drawer>

    <div class="weekly-report-week-navigation">
      <el-button text
                 class="week-nav-arrow"
                 aria-label="Previous week"
                 :disabled="weekLoading"
                 @click="changeWeek(-1)">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>

      <div class="weekly-report-days" v-loading="weekLoading">
        <button v-for="item in weekDays"
                :key="item.date"
                type="button"
                class="weekly-report-day"
                :class="{
            'is-active': item.date === selectedDate,
            'is-disabled': !item.sessions?.length
          }"
                :disabled="!item.sessions?.length"
                @click="selectDay(item)">
          <span>{{ dayName(item.date) }}</span>
          <strong>{{ shortDate(item.date) }}</strong>
          <small v-if="item.sessions?.length">
            {{ item.sessions.length === 1 ? 'Reading available' : `${item.sessions.length} readings` }}
          </small>
          <small v-else>No reading</small>
        </button>
      </div>

      <el-button text
                 class="week-nav-arrow"
                 aria-label="Next week"
                 :disabled="weekLoading || !canGoNextWeek"
                 @click="changeWeek(1)">
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>

    <el-empty v-if="!weekLoading && !availableDays.length"
              description="No completed Reading Sessions exist for this week."
              class="weekly-report-empty" />

    <template v-else-if="selectedDay">
      <el-card shadow="never" class="weekly-report-session-card">
        <div class="weekly-report-session-row">
          <div>
            <span class="weekly-report-eyebrow">Selected Reading Day</span>
            <h3>{{ longDate(selectedDate) }}</h3>
            <p v-if="selectedSession">
              Reading Session #{{ selectedSession.id }} ·
              {{ formatDateTime(selectedSession.startedAt) }} -
              {{ formatDateTime(selectedSession.endedAt) }}
            </p>
          </div>

          <div v-if="selectedDay.sessions.length > 1" class="weekly-report-session-select">
            <label>Reading Session</label>
            <el-select v-model="selectedSessionId" @change="loadDayReport">
              <el-option v-for="session in selectedDay.sessions"
                         :key="session.id"
                         :label="`Session #${session.id}`"
                         :value="Number(session.id)" />
            </el-select>
          </div>
        </div>
      </el-card>

      <el-tabs v-model="activeTab" class="weekly-report-tabs">
        <el-tab-pane label="Cash Flow" name="cashflow">
          <div v-loading="dayLoading" class="weekly-report-tab-body">
            <template v-if="report">
              <div class="session-ledger-grid">
                <el-card shadow="never" class="ledger-card credit-ledger">
                  <template #header>
                    <strong>Money In</strong>
                  </template>
                  <div class="ledger-list">
                    <div class="ledger-item">
                      <div><strong>Opening Balance</strong></div>
                      <strong class="credit">+{{ money(report.cashFlow.openingBalance) }}</strong>
                    </div>
                    <div class="ledger-item">
                      <div><strong>Daily IN</strong></div>
                      <strong class="credit">+{{ money(report.cashFlow.dailyIn ?? report.cashFlow.readingTotalIn) }}</strong>
                    </div>
                    <div class="ledger-item">
                      <div><strong>Employee Short Payment</strong></div>
                      <strong class="credit">+{{ money(report.cashFlow.employeeShortPayment) }}</strong>
                    </div>
                    <div class="ledger-item" v-if="Number(report.cashFlow.adminCredits || 0) !== 0">
                      <div><strong>Admin Reading Credit</strong></div>
                      <strong class="credit">+{{ money(report.cashFlow.adminCredits) }}</strong>
                    </div>
                    <div class="ledger-item">
                      <div><strong>Total IN</strong></div>
                      <strong class="credit">+{{ money(report.cashFlow.totalIn) }}</strong>
                    </div>
                  </div>
                </el-card>

                <el-card shadow="never" class="ledger-card expense-ledger">
                  <template #header>
                    <strong>Money Out</strong>
                  </template>
                  <div class="ledger-list">
                    <div class="ledger-item">
                      <div><strong>Daily OUT</strong></div>
                      <strong class="debit">−{{ money(report.cashFlow.dailyOut ?? report.cashFlow.readingTotalOut) }}</strong>
                    </div>
                    <div class="ledger-item">
                      <div><strong>All Expenses</strong></div>
                      <strong class="debit">−{{ money(report.cashFlow.allExpenses) }}</strong>
                    </div>
                    <div class="ledger-item">
                      <div><strong>Total OUT</strong></div>
                      <strong class="debit">−{{ money(report.cashFlow.totalOut) }}</strong>
                    </div>
                  </div>
                </el-card>
              </div>

              <div class="summary-row-five space-top">
                <el-card shadow="never" class="summary-card summary-blue">
                  <div class="summary-card-content">
                    <div class="summary-icon">
                      <el-icon><TrendCharts /></el-icon>
                    </div>
                    <el-statistic title="Difference"
                                  :value="Number(report.cashFlow.difference || 0)"
                                  :precision="2"
                                  prefix="$" />
                  </div>
                </el-card>

                <el-card shadow="never" class="summary-card summary-teal">
                  <div class="summary-card-content">
                    <div class="summary-icon">
                      <el-icon><WalletFilled /></el-icon>
                    </div>
                    <el-statistic title="Ending Balance"
                                  :value="Number(report.cashFlow.endingBalance || 0)"
                                  :precision="2"
                                  prefix="$" />
                  </div>
                </el-card>

                <el-card shadow="never" class="summary-card summary-orange">
                  <div class="summary-card-content">
                    <div class="summary-icon">
                      <el-icon><Warning /></el-icon>
                    </div>
                    <el-statistic title="Short / Over"
                                  :value="Number(report.cashFlow.shortOver || 0)"
                                  :precision="2"
                                  prefix="$"
                                  :value-style="{ color: Number(report.cashFlow.shortOver || 0) < 0 ? 'var(--el-color-danger)' : undefined }" />
                  </div>
                </el-card>

                <el-card shadow="never" class="summary-card summary-blue">
                  <div class="summary-card-content">
                    <div class="summary-icon">
                      <el-icon><DataAnalysis /></el-icon>
                    </div>
                    <el-statistic title="Calculated Net Profit"
                                  :value="Number(report.cashFlow.calculatedNetProfit ?? report.cashFlow.netProfit ?? 0)"
                                  :precision="2"
                                  prefix="$" />
                  </div>
                </el-card>

                <el-card shadow="never" class="summary-card summary-green">
                  <div class="summary-card-content">
                    <div class="summary-icon">
                      <el-icon><CircleCheckFilled /></el-icon>
                    </div>
                    <el-statistic title="Actual Net Profit"
                                  :value="Number(report.cashFlow.actualNetProfit || 0)"
                                  :precision="2"
                                  prefix="$" />
                  </div>
                </el-card>
              </div>

              <el-card shadow="never" class="weekly-report-section-card space-top">
                <template #header>
                  <div>
                    <strong>Session Cash Flow</strong>
                    <div class="small-text">Employee-session cash flow in order, followed by the Admin closing position.</div>
                  </div>
                </template>

                <div class="weekly-report-table-wrap">
                  <el-table :data="cashFlowSessionRows" size="small" class="report-table">
                    <el-table-column label="Employee / Session" min-width="250">
                      <template #default="{ row }">
                        <div class="weekly-report-shift-main">
                          <strong>{{ row.isAdmin ? `Admin · Reading Session #${row.id}` : row.name }}</strong>
                          <span v-if="row.isAdmin">Machine collection + Admin reading transactions</span>
                          <span v-else>Session #{{ row.id }} · {{ formatDateTime(row.clockIn) }} - {{ formatDateTime(row.clockOut) }}</span>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="Opening Bank" width="135" align="right">
                      <template #default="{ row }">
                        {{ money(row.opening) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="Pull / Credits" width="140" align="right">
                      <template #default="{ row }">
                        <strong class="credit">+{{ money(row.received) }}</strong>
                      </template>
                    </el-table-column>
                    <el-table-column label="Expense" width="125" align="right">
                      <template #default="{ row }">
                        <strong class="debit">-{{ money(row.expenses) }}</strong>
                      </template>
                    </el-table-column>
                    <el-table-column label="Calculated" width="135" align="right">
                      <template #default="{ row }">
                        <strong>{{ money(row.calculated) }}</strong>
                      </template>
                    </el-table-column>
                    <el-table-column label="Actual" width="125" align="right">
                      <template #default="{ row }">
                        <strong>{{ money(row.actual) }}</strong>
                      </template>
                    </el-table-column>
                    <el-table-column label="Short / Over" width="135" align="right">
                      <template #default="{ row }">
                        <strong :class="amountClass(row.shortOver)">{{ signedMoney(row.shortOver) }}</strong>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-card>
            </template>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Reading" name="reading">
          <div v-loading="dayLoading" class="weekly-report-tab-body">
            <template v-if="report">

              <div class="reading-report-page">
                <el-card shadow="never" class="reading-summary-card">
                  <div class="reading-summary-strip">
                    <div class="reading-summary-item">
                      <strong>{{ number(report.reading.totals.totalIn) }}</strong>
                      <span>Total IN</span>
                    </div>
                    <div class="reading-summary-item">
                      <strong>{{ number(report.reading.totals.totalOut) }}</strong>
                      <span>Total OUT</span>
                    </div>
                    <div class="reading-summary-item">
                      <strong>{{ money(report.reading.totals.grossProfit) }}</strong>
                      <span>Gross Profit</span>
                    </div>
                  </div>
                </el-card>
              </div>

              <el-card shadow="never" class="weekly-report-section-card">
                <template #header>
                  <div>
                    <strong>Reading Details</strong>
                    <div class="small-text">Selected Reading Session only.</div>
                  </div>
                </template>

                <el-tabs v-model="readingDetailTab" class="weekly-reading-detail-tabs">
                  <el-tab-pane label="Machine Wise" name="machine">
                    <div class="weekly-report-table-wrap">
                      <el-table :data="report.reading.machines"
                                stripe
                                show-summary
                                :summary-method="machineReadingSummaryMethod"
                                class="report-table">
                        <el-table-column prop="machinenumber" label="Machine #" min-width="90" fixed="left">
                          <template #default="{ row }">
                            <strong>{{ row.machinenumber }}</strong>
                          </template>
                        </el-table-column>
                        <el-table-column prop="previousin" label="Previous IN" min-width="105" align="right">
                          <template #default="{ row }">
                            {{ number(row.previousin) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="previousout" label="Previous OUT" min-width="105" align="right">
                          <template #default="{ row }">
                            {{ number(row.previousout) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="currentin" label="Current IN" min-width="105" align="right">
                          <template #default="{ row }">
                            {{ number(row.currentin) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="currentout" label="Current OUT" min-width="105" align="right">
                          <template #default="{ row }">
                            {{ number(row.currentout) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="dailyin" label="Daily IN" min-width="95" align="right">
                          <template #default="{ row }">
                            {{ number(row.dailyin) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="dailyout" label="Daily OUT" min-width="95" align="right">
                          <template #default="{ row }">
                            {{ number(row.dailyout) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="ticketout" label="Ticket Out" min-width="100" align="right">
                          <template #default="{ row }">
                            {{ number(row.ticketout) }}
                          </template>
                        </el-table-column>
                        <el-table-column label="OUT Check" min-width="105" align="center">
                          <template #default="{ row }">
                            <el-tag :type="machineOutCheckType(row)" effect="light" round>
                              {{ machineOutCheckLabel(row) }}
                            </el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column prop="difference" label="Difference" min-width="105" align="right">
                          <template #default="{ row }">
                            {{ money(row.difference) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="points" label="Points Given" min-width="110" align="right">
                          <template #default="{ row }">
                            {{ money(row.points) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="net" label="Net" min-width="110" align="right">
                          <template #default="{ row }">
                            <strong>{{ money(row.net) }}</strong>
                          </template>
                        </el-table-column>
                        <el-table-column label="Life Pay %" min-width="95" align="right">
                          <template #default="{ row }">
                            {{ machineLifePayPercent(row) }}
                          </template>
                        </el-table-column>
                        <el-table-column label="Life Hold %" min-width="95" align="right">
                          <template #default="{ row }">
                            {{ machineLifeHoldPercent(row) }}
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>

                    <div class="weekly-report-mobile-list">
                      <div v-for="row in report.reading.machines"
                           :key="row.id"
                           class="weekly-report-mobile-card">
                        <strong>Machine #{{ row.machinenumber }}</strong>
                        <div><span>Previous IN</span><b>{{ number(row.previousin) }}</b></div>
                        <div><span>Previous OUT</span><b>{{ number(row.previousout) }}</b></div>
                        <div><span>Current IN</span><b>{{ number(row.currentin) }}</b></div>
                        <div><span>Current OUT</span><b>{{ number(row.currentout) }}</b></div>
                        <div><span>Daily IN</span><b>{{ number(row.dailyin) }}</b></div>
                        <div><span>Daily OUT</span><b>{{ number(row.dailyout) }}</b></div>
                        <div><span>Ticket Out</span><b>{{ number(row.ticketout) }}</b></div>
                        <div><span>OUT Check</span><b>{{ machineOutCheckLabel(row) }}</b></div>
                        <div><span>Difference</span><b>{{ money(row.difference) }}</b></div>
                        <div><span>Points Given</span><b>{{ money(row.points) }}</b></div>
                        <div><span>Net</span><b>{{ money(row.net) }}</b></div>
                        <div><span>Life Pay %</span><b>{{ machineLifePayPercent(row) }}</b></div>
                        <div><span>Life Hold %</span><b>{{ machineLifeHoldPercent(row) }}</b></div>
                      </div>
                    </div>
                  </el-tab-pane>

                  <el-tab-pane label="Machine Type Wise" name="type">
                    <div class="weekly-report-table-wrap">
                      <el-table :data="report.reading.byMachineType"
                                stripe
                                show-summary
                                :summary-method="readingSummaryMethod"
                                class="report-table">
                        <el-table-column prop="machineType" label="Machine Type" min-width="160" fixed="left" />
                        <el-table-column prop="machineCount" label="Machines" min-width="90" align="right" />
                        <el-table-column prop="in" label="IN" min-width="105" align="right">
                          <template #default="{ row }">
                            {{ number(row.in) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="out" label="OUT" min-width="105" align="right">
                          <template #default="{ row }">
                            {{ number(row.out) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="difference" label="Difference" min-width="110" align="right">
                          <template #default="{ row }">
                            {{ money(row.difference) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="points" label="Points" min-width="100" align="right">
                          <template #default="{ row }">
                            {{ money(row.points) }}
                          </template>
                        </el-table-column>
                        <el-table-column label="Bonus" min-width="90" align="right">
                          <template #default>
                            0.00
                          </template>
                        </el-table-column>
                        <el-table-column prop="net" label="Net" min-width="105" align="right">
                          <template #default="{ row }">
                            <strong>{{ money(row.net) }}</strong>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>

                    <div class="weekly-report-mobile-list">
                      <div v-for="row in report.reading.byMachineType"
                           :key="row.machineType"
                           class="weekly-report-mobile-card">
                        <strong>{{ row.machineType }} · {{ row.machineCount }} Machines</strong>
                        <div><span>IN</span><b>{{ number(row.in) }}</b></div>
                        <div><span>OUT</span><b>{{ number(row.out) }}</b></div>
                        <div><span>Difference</span><b>{{ money(row.difference) }}</b></div>
                        <div><span>Points</span><b>{{ money(row.points) }}</b></div>
                        <div><span>Bonus</span><b>0.00</b></div>
                        <div><span>Net</span><b>{{ money(row.net) }}</b></div>
                      </div>

                      <div class="weekly-report-mobile-card">
                        <strong>Total</strong>
                        <div><span>IN</span><b>{{ number(report.reading.totals.totalIn) }}</b></div>
                        <div><span>OUT</span><b>{{ number(report.reading.totals.totalOut) }}</b></div>
                        <div><span>Difference</span><b>{{ money(report.reading.totals.grossProfit) }}</b></div>
                        <div><span>Points</span><b>{{ money(report.reading.totals.points) }}</b></div>
                        <div><span>Bonus</span><b>0.00</b></div>
                        <div><span>Net</span><b>{{ money(report.reading.totals.net) }}</b></div>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </el-card>
            </template>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Credit" name="credit">
          <div v-loading="dayLoading" class="weekly-report-tab-body">
            <template v-if="report">
              <div v-if="isAdminUser" class="weekly-report-expense-actions">
                <el-button type="primary" @click="openAdminCreditDialog">
                  <el-icon><Plus /></el-icon>
                  <span>Add Credit</span>
                </el-button>
              </div>

              <el-card shadow="never" class="weekly-report-section-card">
                <template #header>
                  <div>
                    <strong>Admin Credit</strong>
                    <div class="small-text">Credits added directly to Reading Session #{{ selectedSessionId }}.</div>
                  </div>
                </template>

                <div class="weekly-report-balance-list">
                  <div class="weekly-report-balance-row">
                    <div>
                      <strong>Admin Credit</strong>
                      <span>Reading Session-level credits</span>
                    </div>
                    <el-space :size="6" alignment="center">
                      <b class="credit">+{{ money(adminCreditTotal) }}</b>
                      <el-button link type="primary" title="View Admin credit details" aria-label="View Admin credit details" @click="adminCreditDetailsVisible = true">
                        <el-icon :size="18"><List /></el-icon>
                      </el-button>
                    </el-space>
                  </div>
                </div>
              </el-card>
            </template>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Expenses" name="expenses">
          <div v-loading="dayLoading" class="weekly-report-tab-body">
            <template v-if="report">
              <div v-if="isAdminUser" class="weekly-report-expense-actions">
                <el-button type="primary" @click="openAdminExpenseDialog">
                  <el-icon><Plus /></el-icon>
                  <span>Add Expense</span>
                </el-button>
              </div>

              <div class="reading-report-page">
                <el-card v-if="expenseCategories.length"
                         shadow="never"
                         class="reading-summary-card">
                  <div class="reading-summary-strip">
                    <div v-for="item in expenseCategories"
                         :key="item.category"
                         class="reading-summary-item">
                      <strong>{{ money(item.amount) }}</strong>
                      <el-space :size="5" alignment="center">
                        <span>{{ item.category }}</span>
                        <el-button link
                                   type="primary"
                                   :aria-label="`View ${item.category} details`"
                                   :title="`View ${item.category} details`"
                                   @click="openExpenseTypeDetails(item)">
                          <el-icon :size="16"><Reading /></el-icon>
                        </el-button>
                      </el-space>
                    </div>

                    <div class="reading-summary-item reading-summary-item-expense-total">
                      <strong>{{ money(expenseTotal) }}</strong>
                      <span>Total Expenses</span>
                    </div>
                  </div>
                </el-card>

                <el-empty v-else
                          description="No expenses were recorded for this Reading Session." />
              </div>

              <el-card shadow="never" class="weekly-report-section-card weekly-report-shifts-card">
                <template #header>
                  <div>
                    <strong>Employee Shifts</strong>
                    <div class="small-text">Employee Sessions covered by Reading Session #{{ selectedSessionId }}.</div>
                  </div>
                </template>

                <el-table :data="report.expenses.employeeSessions"
                          size="small">
                  <el-table-column label="Employee / Session" min-width="310">
                    <template #default="{ row: shift }">
                      <div class="weekly-report-shift-main">
                        <strong>{{ shift.name }}</strong>
                        <span>
                          Session #{{ shift.id }} ·
                          {{ formatDateTime(shift.clockIn) }} - {{ formatDateTime(shift.clockOut) }}
                        </span>
                      </div>
                    </template>
                  </el-table-column>

                  <el-table-column label="Expense" width="170" align="right">
                    <template #default="{ row: shift }">
                      <el-space :size="6" alignment="center">
                        <strong>{{ money(shift.expenses) }}</strong>
                        <el-button link type="primary" aria-label="View session expenses" title="View session expenses" @click="openShiftExpenses(shift)">
                          <el-icon :size="18"><List /></el-icon>
                        </el-button>
                      </el-space>
                    </template>
                  </el-table-column>
                </el-table>

                <div class="weekly-report-balance-list space-top">
                  <div class="weekly-report-balance-row">
                    <div>
                      <strong>Admin Expense</strong>
                      <span>Expenses added directly to Reading Session #{{ selectedSessionId }}</span>
                    </div>
                    <el-space :size="6" alignment="center">
                      <b class="debit">-{{ money(adminExpenseTotal) }}</b>
                      <el-button link type="primary" title="View Admin expense details" aria-label="View Admin expense details" @click="adminExpenseDetailsVisible = true">
                        <el-icon :size="18"><List /></el-icon>
                      </el-button>
                    </el-space>
                  </div>
                </div>
              </el-card>
            </template>
          </div>
        </el-tab-pane>



        <el-tab-pane label="Closing Balance" name="closing">
          <div v-loading="dayLoading" class="weekly-report-tab-body">
            <template v-if="report">
              <el-card shadow="never" class="weekly-report-section-card weekly-closing-card">
                <template #header>
                  <div class="weekly-analytics-card-title">
                    <el-icon><Wallet /></el-icon>
                    <div>
                      <strong>Closing Balance</strong>
                      <div class="small-text">Reading Session cash reconciliation.</div>
                    </div>
                  </div>
                </template>

                <div class="weekly-closing-list">
                  <div>
                    <span>Employee Session Close</span>
                    <strong class="credit">+{{ money(report.closingBalance.employeeSessionCloseAmount) }}</strong>
                  </div>
                  <div>
                    <span>Machine Collection Amount</span>
                    <strong class="credit">+{{ money(report.closingBalance.machineCollectionAmount) }}</strong>
                  </div>
                  <div>
                    <span>Admin Credit</span>
                    <strong class="credit">+{{ money(report.closingBalance.adminCredits) }}</strong>
                  </div>
                  <div>
                    <span>Admin Expense</span>
                    <strong class="debit">-{{ money(report.closingBalance.adminExpenses) }}</strong>
                  </div>
                  <div class="is-total">
                    <span>Ending Balance</span>
                    <strong>{{ money(report.closingBalance.ebTotal) }}</strong>
                  </div>
                </div>
              </el-card>
            </template>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Data Analytics" name="analytics">
          <div v-loading="dayLoading" class="weekly-report-tab-body">
            <template v-if="report?.analytics">
              <el-card shadow="never" class="weekly-report-section-card weekly-analytics-activity-card">

                <template #header>
                  <div class="weekly-analytics-card-title">
                    <el-icon><DataAnalysis /></el-icon>
                    <strong>Daily Activity</strong>
                  </div>

                  <div class="weekly-analytics-activity-head">
                    <div class="weekly-analytics-main-metrics">
                      <div>
                        <strong>{{ money(report.analytics.dailyActivity.totalPulls) }}</strong>
                        <span>Total Pulls</span>
                      </div>
                      <div>
                        <strong>{{ number(report.analytics.dailyActivity.customers) }}</strong>
                        <span>Customers</span>
                      </div>
                    </div>

                    <div class="weekly-analytics-average">
                      <strong>{{ money(report.analytics.dailyActivity.averageMatchPerCustomer) }}</strong>
                      <span>Avg / Customer</span>
                    </div>
                  </div>

                  <div class="weekly-analytics-progress-divider" aria-hidden="true">
                    <span class="is-morning"
                          :style="{ width: `${shiftPercent(report.analytics.shifts.morning.pulls, report.analytics.dailyActivity.totalPulls)}%` }"></span>
                    <span class="is-night"
                          :style="{ width: `${shiftPercent(report.analytics.shifts.night.pulls, report.analytics.dailyActivity.totalPulls)}%` }"></span>
                  </div>
                </template>

                <div class="weekly-analytics-shifts">
                  <div class="weekly-analytics-shift">
                    <div class="weekly-analytics-shift-head">
                      <div>
                        <span class="weekly-analytics-dot"></span>
                        <strong>Morning Shift</strong>
                      </div>
                      <small>
                        {{ shiftPercent(report.analytics.shifts.morning.pulls, report.analytics.dailyActivity.totalPulls) }}%
                      </small>
                    </div>
                    <b>{{ money(report.analytics.shifts.morning.pulls) }}</b>
                    <div class="weekly-analytics-shift-meta">
                      <span>{{ number(report.analytics.shifts.morning.customers) }} customers</span>
                      <span>{{ money(report.analytics.shifts.morning.averageMatchPerCustomer) }} avg</span>
                      <span>
                        {{ timeLabel(report.analytics.shifts.morning.start) }} -
                        {{ timeLabel(report.analytics.shifts.morning.end) }}
                      </span>
                    </div>
                  </div>

                  <div class="weekly-analytics-shift">
                    <div class="weekly-analytics-shift-head">
                      <div>
                        <span class="weekly-analytics-dot is-night"></span>
                        <strong>Night Shift</strong>
                      </div>
                      <small>
                        {{ shiftPercent(report.analytics.shifts.night.pulls, report.analytics.dailyActivity.totalPulls) }}%
                      </small>
                    </div>
                    <b>{{ money(report.analytics.shifts.night.pulls) }}</b>
                    <div class="weekly-analytics-shift-meta">
                      <span>{{ number(report.analytics.shifts.night.customers) }} customers</span>
                      <span>{{ money(report.analytics.shifts.night.averageMatchPerCustomer) }} avg</span>
                      <span>
                        {{ timeLabel(report.analytics.shifts.night.start) }} -
                        {{ timeLabel(report.analytics.shifts.night.end) }}
                      </span>
                    </div>
                  </div>
                </div>
              </el-card>

              <el-card shadow="never" class="weekly-report-section-card weekly-analytics-equation-card">
                <template #header>
                  <div class="weekly-analytics-card-title">
                    <el-icon><TrendCharts /></el-icon>
                    <strong>Equation X — Proof</strong>
                  </div>

                  <div class="weekly-analytics-equation-hero">
                    <div>
                      <strong :class="amountClass(report.analytics.reconciliation.equationX)">
                        {{ signedMoney(report.analytics.reconciliation.equationX) }}
                      </strong>
                      <small>Diagnostic Short / Over</small>
                    </div>
                    <el-tag size="small"
                            :type="report.analytics.reconciliation.matched ? 'success' : 'danger'">
                      <span style="color: var(--el-color-danger) !important;">{{ report.analytics.reconciliation.matched ? 'MATCH' : 'MISMATCH' }}</span>
                    </el-tag>
                  </div>
                </template>

                <div class="weekly-analytics-equation-list">
                  <div>
                    <span>Pulls Gap</span>
                    <strong :class="amountClass(report.analytics.reconciliation.pullsGap)">
                      {{ signedMoney(report.analytics.reconciliation.pullsGap) }}
                    </strong>
                  </div>
                  <div>
                    <span>Match Tickets</span>
                    <strong :class="amountClass(report.analytics.reconciliation.matchTickets)">
                      {{ signedMoney(report.analytics.reconciliation.matchTickets) }}
                    </strong>
                  </div>
                  <div>
                    <span>Employee Short / Over</span>
                    <strong :class="amountClass(report.analytics.reconciliation.employeeShortOver)">
                      {{ signedMoney(report.analytics.reconciliation.employeeShortOver) }}
                    </strong>
                  </div>
                  <div class="is-total">
                    <span>Equation X</span>
                    <strong :class="amountClass(report.analytics.reconciliation.equationX)">
                      {{ signedMoney(report.analytics.reconciliation.equationX) }}
                    </strong>
                  </div>
                  <div class="is-weekly">
                    <span>Weekly Report</span>
                    <strong :class="amountClass(report.analytics.reconciliation.weeklyReport)">
                      {{ signedMoney(report.analytics.reconciliation.weeklyReport) }}
                    </strong>
                  </div>
                </div>

                <div class="weekly-analytics-proof"
                     role="button"
                     tabindex="0"
                     :aria-expanded="analyticsBreakdownVisible"
                     style="cursor: pointer;"
                     @click="analyticsBreakdownVisible = !analyticsBreakdownVisible"
                     @keydown.enter.prevent="analyticsBreakdownVisible = !analyticsBreakdownVisible"
                     @keydown.space.prevent="analyticsBreakdownVisible = !analyticsBreakdownVisible">
                  <strong>
                    {{
 report.analytics.reconciliation.matched
                        ? 'Equation X agrees with Weekly Report — click to review the breakdown below.'
                        : 'The totals do not agree — click to review the breakdown below.'
                    }}
                  </strong>
                  <span>
                    Difference:
                    {{ signedMoney(report.analytics.reconciliation.difference) }}
                  </span>
                </div>
              </el-card>

              <div v-show="analyticsBreakdownVisible" class="weekly-analytics-detail-grid">
                <el-card shadow="never" class="weekly-report-section-card weekly-analytics-soft-card">
                  <template #header>
                    <div class="weekly-analytics-detail-title">
                      <el-icon><Coin /></el-icon>
                      <strong>Pulls Comparison</strong>
                    </div>
                  </template>
                  <div class="weekly-analytics-detail-list">
                    <div>
                      <span>Reading Total IN</span>
                      <strong>{{ money(report.analytics.reconciliation.readingTotalIn) }}</strong>
                    </div>
                    <div>
                      <span>Employee Total Pulls</span>
                      <strong>{{ money(report.analytics.reconciliation.employeeTotalPulls) }}</strong>
                    </div>
                    <div>
                      <span>Pulls Gap</span>
                      <strong :class="amountClass(report.analytics.reconciliation.pullsGap)">
                        {{ signedMoney(report.analytics.reconciliation.pullsGap) }}
                      </strong>
                    </div>
                  </div>
                </el-card>

                <el-card shadow="never" class="weekly-report-section-card weekly-analytics-soft-card">
                  <template #header>
                    <div class="weekly-analytics-detail-title">
                      <el-icon><Tickets /></el-icon>
                      <strong>Match Tickets</strong>
                    </div>
                  </template>
                  <div class="weekly-analytics-detail-list">
                    <div>
                      <span>Reading Total OUT</span>
                      <strong>{{ money(report.analytics.reconciliation.readingTotalOut) }}</strong>
                    </div>
                    <div>
                      <span>Ticket Total OUT</span>
                      <strong>{{ money(report.analytics.reconciliation.ticketOutTotal) }}</strong>
                    </div>
                    <div>
                      <span>Difference</span>
                      <strong :class="amountClass(report.analytics.reconciliation.matchTickets)">
                        {{ signedMoney(report.analytics.reconciliation.matchTickets) }}
                      </strong>
                    </div>
                  </div>
                </el-card>
              </div>

              <el-card v-show="analyticsBreakdownVisible"
                       shadow="never"
                       class="weekly-report-section-card weekly-analytics-cashflow-card">
                <template #header>
                  <div>
                    <div class="weekly-analytics-detail-title">
                      <el-icon><UserFilled /></el-icon>
                      <strong>Employee Short / Over</strong>
                    </div>
                    <div class="small-text">Employee-session cash flow in the same format as Session Cash Flow.</div>
                  </div>
                </template>

                <div class="weekly-report-table-wrap">
                  <el-table :data="employeeCashFlowRows" size="small" class="report-table">
                    <el-table-column label="Employee / Session" min-width="250">
                      <template #default="{ row }">
                        <div class="weekly-report-shift-main">
                          <strong>{{ row.name }}</strong>
                          <span>Session #{{ row.id }} · {{ formatDateTime(row.clockIn) }} - {{ formatDateTime(row.clockOut) }}</span>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="Opening Bank" width="135" align="right">
                      <template #default="{ row }">
                        {{ money(row.opening) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="Pull / Credits" width="140" align="right">
                      <template #default="{ row }">
                        <strong class="credit">+{{ money(row.received) }}</strong>
                      </template>
                    </el-table-column>
                    <el-table-column label="Expense" width="125" align="right">
                      <template #default="{ row }">
                        <strong class="debit">-{{ money(row.expenses) }}</strong>
                      </template>
                    </el-table-column>
                    <el-table-column label="Calculated" width="135" align="right">
                      <template #default="{ row }">
                        <strong>{{ money(row.calculated) }}</strong>
                      </template>
                    </el-table-column>
                    <el-table-column label="Actual" width="125" align="right">
                      <template #default="{ row }">
                        <strong>{{ money(row.actual) }}</strong>
                      </template>
                    </el-table-column>
                    <el-table-column label="Short / Over" width="135" align="right">
                      <template #default="{ row }">
                        <strong :class="amountClass(row.shortOver)">{{ signedMoney(row.shortOver) }}</strong>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-card>
            </template>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Percentage" name="percentage">
          <div v-loading="dayLoading" class="weekly-report-tab-body">
            <template v-if="report?.percentages">
              <el-card shadow="never" class="weekly-report-section-card weekly-percentage-card">
                <template #header>
                  <div class="weekly-analytics-card-title">
                    <el-icon><TrendCharts /></el-icon>
                    <div>
                      <strong>Reading Performance</strong>
                      <div class="small-text">Percentage of Reading Total IN ({{ money(report.percentages.baseAmount) }}).</div>
                    </div>
                  </div>
                </template>

                <div class="weekly-percentage-grid">
                  <div class="weekly-percentage-metric">
                    <span>Machine Payout</span>
                    <strong>{{ percentage(report.percentages.machinePayout.percentage) }}</strong>
                    <small>{{ money(report.percentages.machinePayout.amount) }}</small>
                  </div>
                  <div class="weekly-percentage-metric">
                    <span>Machine Hold</span>
                    <strong>{{ percentage(report.percentages.machineHold.percentage) }}</strong>
                    <small>{{ money(report.percentages.machineHold.amount) }}</small>
                  </div>
                  <div class="weekly-percentage-metric">
                    <span>Operating Expense</span>
                    <strong>{{ percentage(report.percentages.operatingExpense.percentage) }}</strong>
                    <small>{{ money(report.percentages.operatingExpense.amount) }}</small>
                  </div>
                  <div class="weekly-percentage-metric is-highlight">
                    <span>Remaining Margin</span>
                    <strong>{{ percentage(report.percentages.remainingMargin.percentage) }}</strong>
                    <small>{{ money(report.percentages.remainingMargin.amount) }}</small>
                  </div>
                </div>
              </el-card>

              <el-card shadow="never" class="weekly-report-section-card weekly-percentage-card">
                <template #header>
                  <div class="weekly-analytics-card-title">
                    <el-icon><DataAnalysis /></el-icon>
                    <div>
                      <strong>Important Percentages</strong>
                      <div class="small-text">Key operating costs measured against Reading Total IN.</div>
                    </div>
                  </div>
                </template>

                <div class="weekly-percentage-list">
                  <div>
                    <span>Match Point Given</span>
                    <small>{{ money(report.percentages.important.matchPointGiven.amount) }}</small>
                    <strong>{{ percentage(report.percentages.important.matchPointGiven.percentage) }}</strong>
                  </div>
                  <div>
                    <span>Raffle Given</span>
                    <small>{{ money(report.percentages.important.raffleGiven.amount) }}</small>
                    <strong>{{ percentage(report.percentages.important.raffleGiven.percentage) }}</strong>
                  </div>
                  <div>
                    <span>Bonus Given</span>
                    <small>{{ money(report.percentages.important.bonusGiven.amount) }}</small>
                    <strong>{{ percentage(report.percentages.important.bonusGiven.percentage) }}</strong>
                  </div>
                  <div>
                    <span>Payroll</span>
                    <small>{{ money(report.percentages.important.payroll.amount) }}</small>
                    <strong>{{ percentage(report.percentages.important.payroll.percentage) }}</strong>
                  </div>
                  <div>
                    <span>All Other Expense</span>
                    <small>{{ money(report.percentages.important.allOtherExpense.amount) }}</small>
                    <strong>{{ percentage(report.percentages.important.allOtherExpense.percentage) }}</strong>
                  </div>
                </div>
              </el-card>
            </template>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <el-dialog v-model="adminCreditDetailsVisible"
               title="Admin Credit Details"
               width="720px"
               class="compact-detail-dialog"
               append-to-body>
      <el-table :data="adminReadingCredits" stripe size="small">
        <el-table-column prop="creditTypeName" label="Credit Type" min-width="170" />
        <el-table-column prop="notes" label="Notes" min-width="250">
          <template #default="{ row }">
            {{ row.notes || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="Amount" width="120" align="right">
          <template #default="{ row }">
            <strong class="credit">+{{ money(row.amount) }}</strong>
          </template>
        </el-table-column>
        <template #empty>
          No Admin credits were recorded for this Reading Session.
        </template>
      </el-table>
      <template #footer>
        <strong>Total: {{ money(adminCreditTotal) }}</strong>
      </template>
    </el-dialog>

    <el-dialog v-model="adminExpenseDetailsVisible"
               title="Admin Expense Details"
               width="720px"
               class="compact-detail-dialog"
               append-to-body>
      <el-table :data="adminReadingExpenses" stripe size="small">
        <el-table-column prop="expenseTypeName" label="Expense Type" min-width="170" />
        <el-table-column prop="notes" label="Notes" min-width="250">
          <template #default="{ row }">
            {{ row.notes || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="Amount" width="120" align="right">
          <template #default="{ row }">
            <strong class="debit">-{{ money(row.amount) }}</strong>
          </template>
        </el-table-column>
        <template #empty>
          No Admin expenses were recorded for this Reading Session.
        </template>
      </el-table>
      <template #footer>
        <strong>Total: {{ money(adminExpenseTotal) }}</strong>
      </template>
    </el-dialog>

    <el-dialog v-model="adminCreditDialogVisible"
               title="Add Credit"
               width="520px"
               class="compact-detail-dialog"
               append-to-body
               :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="Reading Session">
          <el-input :model-value="`#${selectedSessionId || ''}`" disabled />
        </el-form-item>

        <el-form-item label="Credit Type">
          <el-select v-model="adminCreditForm.credittypeid"
                     filterable
                     placeholder="Select credit type"
                     style="width: 100%"
                     :loading="adminCreditTypesLoading">
            <el-option v-for="type in adminCreditTypes"
                       :key="type.id"
                       :label="type.name"
                       :value="Number(type.id)" />
          </el-select>
        </el-form-item>

        <el-form-item label="Amount">
          <el-input v-model="adminCreditForm.amount"
                    inputmode="decimal"
                    placeholder="0.00">
            <template #prefix>
              $
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Notes (optional)">
          <el-input v-model="adminCreditForm.notes"
                    maxlength="500"
                    placeholder="Credit notes" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="adminCreditDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="adminCreditSaving" @click="saveAdminCredit">
          Add Credit
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="adminExpenseDialogVisible"
               title="Add Expense"
               width="520px"
               class="compact-detail-dialog"
               append-to-body
               :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="Reading Session">
          <el-input :model-value="`Reading Session #${selectedSessionId}`" disabled />
        </el-form-item>

        <el-form-item label="Expense Type">
          <el-select v-model="adminExpenseForm.expensetypeid"
                     filterable
                     placeholder="Select expense type"
                     style="width: 100%"
                     :loading="adminExpenseTypesLoading">
            <el-option v-for="type in adminExpenseTypes"
                       :key="type.id"
                       :label="type.name"
                       :value="Number(type.id)" />
          </el-select>
        </el-form-item>

        <el-form-item label="Amount">
          <el-input v-model="adminExpenseForm.amount"
                    inputmode="decimal"
                    placeholder="0.00">
            <template #prefix>
              $
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Notes (optional)">
          <el-input v-model="adminExpenseForm.notes"
                    maxlength="500"
                    placeholder="Expense notes" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="adminExpenseDialogVisible = false">
          Cancel
        </el-button>
        <el-button type="primary"
                   :loading="adminExpenseSaving"
                   @click="saveAdminExpense">
          Add Expense
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="expenseTypeDialogVisible"
               :title="expenseTypeDialogTitle"
               width="760px"
               class="compact-detail-dialog"
               append-to-body>
      <el-table :data="selectedExpenseTypeDetails"
                stripe
                size="small"
                class="compact-detail-table">
        <el-table-column label="Source / Session" min-width="190">
          <template #default="{ row }">
            <strong>{{ row.employeeName }}</strong>
            <div class="small-text">Session #{{ row.sessionId }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="details" label="Details" min-width="300" />

        <el-table-column label="Amount" width="105" align="right">
          <template #default="{ row }">
            {{ money(row.amount) }}
          </template>
        </el-table-column>

        <template #empty>
          No {{ selectedExpenseCategory }} details were recorded for this Reading Session.
        </template>
      </el-table>

      <template #footer>
        <div>
          <strong>Total: {{ money(selectedExpenseTypeTotal) }}</strong>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="expenseDialogVisible"
               :title="expenseDialogTitle"
               width="680px"
               append-to-body>
      <el-table :data="selectedShiftExpenses" stripe>
        <el-table-column prop="category" label="Expense" min-width="150" />
        <el-table-column prop="details" label="Details" min-width="260" />
        <el-table-column label="Amount" width="130" align="right">
          <template #default="{ row }">
            {{ money(row.amount) }}
          </template>
        </el-table-column>
        <template #empty>
          No expenses were recorded for this employee session.
        </template>
      </el-table>

      <template #footer>
        <div>
          <strong>Total: {{ money(selectedShiftExpenseTotal) }}</strong>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { useUserStore } from '@/store/modules/user';
import { getWeeklyReportDay, getWeeklyReportWeek } from '@/api/weeklyreport';
import { getExpenseTypes } from '@/api/employeefinance';

const userStore = useUserStore();

const weekMode = ref<'current' | 'last' | 'custom'>('current');
const customRange = ref<string[]>([]);
const filterDrawerVisible = ref(false);
const draftWeekMode = ref<'current' | 'last' | 'custom'>('current');
const draftCustomRange = ref<string[]>([]);
const weekStart = ref('');
const weekEnd = ref('');
const weekDays = ref<any[]>([]);
const selectedDate = ref('');
const selectedSessionId = ref<number | null>(null);
const activeTab = ref('cashflow');
const weekLoading = ref(false);
const dayLoading = ref(false);
const report = ref<any>(null);
const expenseDialogVisible = ref(false);
const selectedExpenseShift = ref<any>(null);
const expenseTypeDialogVisible = ref(false);
const selectedExpenseCategory = ref('');
const adminCreditDetailsVisible = ref(false);
const adminExpenseDetailsVisible = ref(false);
const analyticsBreakdownVisible = ref(false);
const readingDetailTab = ref('machine');

const adminExpenseDialogVisible = ref(false);
const adminExpenseSaving = ref(false);
const adminExpenseTypesLoading = ref(false);
const adminExpenseTypes = ref<any[]>([]);
const adminExpenseForm = ref({
                expensetypeid: null as number | null,
                amount: '',
                notes: ''
});

const adminCreditDialogVisible = ref(false);
const adminCreditSaving = ref(false);
const adminCreditTypesLoading = ref(false);
const adminCreditTypes = ref<any[]>([]);
const adminCreditForm = ref({
                credittypeid: null as number | null,
                amount: '',
                notes: ''
});

const isAdminUser = computed(() =>
                String(userStore.roleName || '').trim().toLowerCase() === 'admin'
);

const expenseCategories = computed(() =>
            Array.isArray(report.value?.expenses?.categories)
              ? report.value.expenses.categories
              : []
);

const expenseTotal = computed(() => Number(report.value?.expenses?.total || 0));

const adminReadingCredits = computed(() =>
            Array.isArray(report.value?.readingSessionCash?.credits)
              ? report.value.readingSessionCash.credits
              : []
);

const adminReadingExpenses = computed(() =>
            Array.isArray(report.value?.readingSessionCash?.expenses)
              ? report.value.readingSessionCash.expenses
              : []
);

const adminCreditTotal = computed(() => Number(report.value?.readingSessionCash?.creditTotal || 0));
const adminExpenseTotal = computed(() => Number(report.value?.readingSessionCash?.expenseTotal || 0));

const cashFlowSessionRows = computed(() => {
            const employeeRows = Array.isArray(report.value?.cashFlow?.sessionBreakdown)
              ? report.value.cashFlow.sessionBreakdown
              : [];
            const admin = report.value?.cashFlow?.adminBreakdown;

            return admin ? [...employeeRows, admin] : employeeRows;
});

const employeeCashFlowRows = computed(() =>
            Array.isArray(report.value?.cashFlow?.sessionBreakdown)
              ? report.value.cashFlow.sessionBreakdown
              : []
);

const selectedExpenseTypeDetails = computed(() => {
            const category = selectedExpenseCategory.value;
            const sessions = report.value?.expenses?.employeeSessions ?? [];

            const employeeDetails = sessions.flatMap((session: any) =>
              (Array.isArray(session.expenseDetails) ? session.expenseDetails : [])
                .filter((item: any) => String(item.category || '') === category)
                .map((item: any) => ({
                  ...item,
                  employeeName: session.name || 'Employee',
                  sessionId: session.id
                }))
            );

            const adminDetails = (report.value?.expenses?.adminDetails ?? [])
              .filter((item: any) => String(item.category || 'Expense') === category);

            return [...employeeDetails, ...adminDetails];
});
const selectedExpenseTypeTotal = computed(() =>
            selectedExpenseTypeDetails.value.reduce(
              (sum: number, item: any) => sum + Number(item.amount || 0),
              0
            )
);

const expenseTypeDialogTitle = computed(() =>
            selectedExpenseCategory.value
              ? `${selectedExpenseCategory.value} Details`
              : 'Expense Details'
);

function validExpenseAmount(value: any) {
            return /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(String(value ?? '').trim()) &&
              Number(value) > 0;
}

async function loadAdminExpenseTypes() {
            if (!userStore.locationId || adminExpenseTypesLoading.value) return;

            try {
              adminExpenseTypesLoading.value = true;
              const response = await getExpenseTypes(Number(userStore.locationId));
              adminExpenseTypes.value = response?.data || response || [];
            } catch (error: any) {
              ElMessage.error(
                error?.response?.data?.message ||
                error?.message ||
                'Unable to load expense types.'
              );
            } finally {
              adminExpenseTypesLoading.value = false;
            }
}

async function loadAdminCreditTypes() {
            if (!userStore.locationId || adminCreditTypesLoading.value) return;

            try {
              adminCreditTypesLoading.value = true;
              const response = await request({
                url: '/employeefinance/credit-types',
                method: 'get',
                params: { locationid: Number(userStore.locationId) }
              });
              adminCreditTypes.value = response?.data || response || [];
            } catch (error: any) {
              ElMessage.error(
                error?.response?.data?.message ||
                error?.message ||
                'Unable to load credit types.'
              );
            } finally {
              adminCreditTypesLoading.value = false;
            }
}

async function openAdminCreditDialog() {
            if (!isAdminUser.value || !selectedSessionId.value) return;

            adminCreditForm.value = {
              credittypeid: null,
              amount: '',
              notes: ''
            };

            adminCreditDialogVisible.value = true;
            await loadAdminCreditTypes();
}

async function saveAdminCredit() {
            if (!isAdminUser.value || !selectedSessionId.value) return;

            if (!adminCreditForm.value.credittypeid) {
              return ElMessage.warning('Select a credit type.');
            }

            if (!validExpenseAmount(adminCreditForm.value.amount)) {
              return ElMessage.warning('Enter a positive amount with up to two decimals.');
            }

            try {
              adminCreditSaving.value = true;

              await request({
                url: '/employeefinance/admin/reading-session-credit',
                method: 'post',
                data: {
                  locationid: Number(userStore.locationId),
                  readingsessionid: Number(selectedSessionId.value),
                  credittypeid: Number(adminCreditForm.value.credittypeid),
                  amount: adminCreditForm.value.amount,
                  notes: adminCreditForm.value.notes
                }
              });

              ElMessage.success('Admin credit added.');
              adminCreditDialogVisible.value = false;
              await loadDayReport();
            } catch (error: any) {
              ElMessage.error(
                error?.response?.data?.message ||
                error?.message ||
                'Unable to add Admin credit.'
              );
            } finally {
              adminCreditSaving.value = false;
            }
}

async function openAdminExpenseDialog() {
            if (!isAdminUser.value || !selectedSessionId.value) return;

            adminExpenseForm.value = {
              expensetypeid: null,
              amount: '',
              notes: ''
            };

            adminExpenseDialogVisible.value = true;
            await loadAdminExpenseTypes();
}

async function saveAdminExpense() {
            if (!isAdminUser.value || !selectedSessionId.value) return;

            if (!adminExpenseForm.value.expensetypeid) {
              return ElMessage.warning('Select an expense type.');
            }

            if (!validExpenseAmount(adminExpenseForm.value.amount)) {
              return ElMessage.warning('Enter a positive amount with up to two decimals.');
            }

            try {
              adminExpenseSaving.value = true;

              await request({
                url: '/employeefinance/admin/reading-session-expense',
                method: 'post',
                data: {
                  locationid: Number(userStore.locationId),
                  readingsessionid: Number(selectedSessionId.value),
                  expensetypeid: Number(adminExpenseForm.value.expensetypeid),
                  amount: adminExpenseForm.value.amount,
                  notes: adminExpenseForm.value.notes
                }
              });

              ElMessage.success('Admin expense added.');
              adminExpenseDialogVisible.value = false;
              await loadDayReport();
            } catch (error: any) {
              ElMessage.error(
                error?.response?.data?.message ||
                error?.message ||
                'Unable to add Admin expense.'
              );
            } finally {
              adminExpenseSaving.value = false;
            }
}

function openExpenseTypeDetails(item: any) {
            selectedExpenseCategory.value = String(item?.category || '');
            expenseTypeDialogVisible.value = true;
}

const selectedShiftExpenses = computed(() =>
                Array.isArray(selectedExpenseShift.value?.expenseDetails)
                  ? selectedExpenseShift.value.expenseDetails
                  : []
);

const selectedShiftExpenseTotal = computed(() =>
                selectedShiftExpenses.value.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)
);

const expenseDialogTitle = computed(() => {
                const shift = selectedExpenseShift.value;
                if (!shift) return 'Employee Session Expenses';
                return `${shift.name} · Session #${shift.id} Expenses`;
});

function openShiftExpenses(shift: any) {
                selectedExpenseShift.value = shift;
                expenseDialogVisible.value = true;
}

function machineOutVariance(row: any) {
                return Number(row?.dailyout || 0) - Number(row?.ticketout || 0);
}

function machineOutCheckType(row: any) {
                const variance = machineOutVariance(row);
                if (Math.abs(variance) < 0.005) return 'info';
                return variance > 0 ? 'success' : 'danger';
}

function machineOutCheckLabel(row: any) {
                const variance = machineOutVariance(row);
                if (Math.abs(variance) < 0.005) return 'Even';
                return variance > 0 ? 'Short Paid' : 'Over Paid';
}

function machineLifePayPercent(row: any) {
                const currentIn = Number(row?.currentin || 0);
                const currentOut = Number(row?.currentout || 0);
                if (!Number.isFinite(currentIn) || currentIn <= 0 || !Number.isFinite(currentOut)) return '0.00%';
                return `${((currentOut / currentIn) * 100).toFixed(2)}%`;
}

function machineLifeHoldPercent(row: any) {
                const currentIn = Number(row?.currentin || 0);
                const currentOut = Number(row?.currentout || 0);
                if (!Number.isFinite(currentIn) || currentIn <= 0 || !Number.isFinite(currentOut)) return '0.00%';
                return `${(100 - ((currentOut / currentIn) * 100)).toFixed(2)}%`;
}

function machineReadingSummaryMethod({ columns, data }: any) {
                return columns.map((column: any, index: number) => {
                  if (index === 0) return 'Total';

                  switch (column.property) {
                    case 'dailyin':
                      return number(data.reduce((sum: number, row: any) => sum + Number(row.dailyin || 0), 0));
                    case 'dailyout':
                      return number(data.reduce((sum: number, row: any) => sum + Number(row.dailyout || 0), 0));
                    case 'ticketout':
                      return number(data.reduce((sum: number, row: any) => sum + Number(row.ticketout || 0), 0));
                    case 'difference':
                      return money(data.reduce((sum: number, row: any) => sum + Number(row.difference || 0), 0));
                    case 'points':
                      return money(data.reduce((sum: number, row: any) => sum + Number(row.points || 0), 0));
                    case 'net':
                      return money(data.reduce((sum: number, row: any) => sum + Number(row.net || 0), 0));
                    default:
                      return '';
                  }
                });
}

function readingSummaryMethod({ columns }: any) {
              const totals = report.value?.reading?.totals || {};

              return columns.map((column: any, index: number) => {
                if (index === 0) return 'Total';

                switch (column.property) {
                  case 'machineCount':
                    return number((report.value?.reading?.byMachineType || []).reduce(
                      (sum: number, row: any) => sum + Number(row.machineCount || 0), 0
                    ));
                  case 'in':
                    return number(totals.totalIn);
                  case 'out':
                    return number(totals.totalOut);
                  case 'difference':
                    return money(totals.grossProfit);
                  case 'points':
                    return money(totals.points);
                  case 'net':
                    return money(totals.net);
                  default:
                    return '';
                }
              });
}

const availableDays = computed(() =>
                weekDays.value.filter(item => Array.isArray(item.sessions) && item.sessions.length > 0)
);

const selectedDay = computed(() =>
                weekDays.value.find(item => item.date === selectedDate.value) || null
);

const selectedSession = computed(() =>
                selectedDay.value?.sessions?.find((item: any) => Number(item.id) === Number(selectedSessionId.value)) || null
);

const weekModeLabel = computed(() => {
                if (weekMode.value === 'last') return 'Last Week';
                if (weekMode.value === 'custom') return 'Custom Week';
                return 'Current Week';
});

const formattedWeekRange = computed(() => {
                if (!weekStart.value || !weekEnd.value) return '';
                return `${formatDateOnly(weekStart.value)} - ${formatDateOnly(weekEnd.value)}`;
});

const canGoNextWeek = computed(() => {
                if (!weekStart.value) return false;

                const selectedStart = fromDateKey(weekStart.value);
                const currentMonday = mondayOf(new Date());

                if (Number.isNaN(selectedStart.getTime())) {
                  return false;
                }

                return selectedStart.getTime() < currentMonday.getTime();
});

function pad(value: number) {
                return String(value).padStart(2, '0');
}

function dateKey(date: Date) {
                return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normalizeDateKey(value: any) {
                const text = String(value || '').trim();

                const exact = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (exact) {
                  return `${exact[1]}-${exact[2]}-${exact[3]}`;
                }

                const parsed = new Date(text);
                if (Number.isNaN(parsed.getTime())) {
                  return '';
                }

                return dateKey(parsed);
}

function fromDateKey(value: string) {
                const normalized = normalizeDateKey(value);

                if (!normalized) {
                  return new Date(NaN);
                }

                const [year, month, day] =
                  normalized.split('-').map(Number);

                return new Date(year, month - 1, day);
}

function mondayOf(date: Date) {
                const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const weekday = result.getDay();
                const delta = weekday === 0 ? -6 : 1 - weekday;
                result.setDate(result.getDate() + delta);
                return result;
}

function plusDays(date: Date, days: number) {
                const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                result.setDate(result.getDate() + days);
                return result;
}

function setStandardWeek(mode: 'current' | 'last') {
                const currentMonday = mondayOf(new Date());
                const start = mode === 'last' ? plusDays(currentMonday, -7) : currentMonday;
                weekStart.value = dateKey(start);
                weekEnd.value = dateKey(plusDays(start, 6));
}

async function changeWeek(direction: -1 | 1) {
                if (!weekStart.value || weekLoading.value) {
                  return;
                }

                const currentStart = fromDateKey(weekStart.value);

                if (Number.isNaN(currentStart.getTime())) {
                  return;
                }

                const currentMonday = mondayOf(new Date());
                let targetStart = plusDays(currentStart, direction * 7);

                // Never allow week navigation beyond the current week.
                if (targetStart.getTime() > currentMonday.getTime()) {
                  targetStart = currentMonday;
                }

                const targetEnd = plusDays(targetStart, 6);
                const targetStartKey = dateKey(targetStart);
                const targetEndKey = dateKey(targetEnd);
                const lastWeekStartKey = dateKey(plusDays(currentMonday, -7));
                const currentWeekStartKey = dateKey(currentMonday);

                weekStart.value = targetStartKey;
                weekEnd.value = targetEndKey;

                if (targetStartKey === currentWeekStartKey) {
                  weekMode.value = 'current';
                  customRange.value = [];
                } else if (targetStartKey === lastWeekStartKey) {
                  weekMode.value = 'last';
                  customRange.value = [];
                } else {
                  weekMode.value = 'custom';
                  customRange.value = [targetStartKey, targetEndKey];
                }

                draftWeekMode.value = weekMode.value;
                draftCustomRange.value = [...customRange.value];

                await loadWeek();
}

function openWeekFilter() {
                draftWeekMode.value = weekMode.value;
                draftCustomRange.value = [...customRange.value];

                if (
                  draftWeekMode.value === 'custom' &&
                  draftCustomRange.value.length !== 2 &&
                  weekStart.value &&
                  weekEnd.value
                ) {
                  draftCustomRange.value = [
                    weekStart.value,
                    weekEnd.value
                  ];
                }

                filterDrawerVisible.value = true;
}

function validateCustomWeek(value: string[]) {
                if (
                  !Array.isArray(value) ||
                  value.length !== 2
                ) {
                  ElMessage.warning(
                    'Please select a Monday to Sunday date range.'
                  );
                  return false;
                }

                const start = fromDateKey(value[0]);
                const end = fromDateKey(value[1]);

                if (
                  Number.isNaN(start.getTime()) ||
                  Number.isNaN(end.getTime())
                ) {
                  ElMessage.warning(
                    'Please select a valid custom week.'
                  );
                  return false;
                }

                const days = Math.round(
                  (end.getTime() - start.getTime()) /
                    86400000
                );

                if (
                  start.getDay() !== 1 ||
                  end.getDay() !== 0 ||
                  days !== 6
                ) {
                  ElMessage.warning(
                    'Custom Week must start on Monday and end on Sunday.'
                  );
                  return false;
                }

                return true;
}

async function applyWeekFilter() {
                if (draftWeekMode.value === 'custom') {
                  if (!validateCustomWeek(draftCustomRange.value)) {
                    return;
                  }

                  weekMode.value = 'custom';
                  customRange.value = [
                    ...draftCustomRange.value
                  ];
                  weekStart.value =
                    draftCustomRange.value[0];
                  weekEnd.value =
                    draftCustomRange.value[1];
                } else {
                  weekMode.value =
                    draftWeekMode.value;

                  customRange.value = [];
                  setStandardWeek(
                    draftWeekMode.value
                  );
                }

                filterDrawerVisible.value = false;

                await loadWeek();
}

async function clearWeekFilter() {
                weekMode.value = 'current';
                customRange.value = [];
                draftWeekMode.value = 'current';
                draftCustomRange.value = [];

                setStandardWeek('current');

                filterDrawerVisible.value = false;

                await loadWeek();
}

async function loadWeek() {
                if (!userStore.locationId || !weekStart.value || !weekEnd.value) return;

                weekLoading.value = true;
                report.value = null;
                selectedDate.value = '';
                selectedSessionId.value = null;

                try {
                  const response = await getWeeklyReportWeek({
                    locationid: Number(userStore.locationId),
                    startdate: weekStart.value,
                    enddate: weekEnd.value
                  });

                  weekDays.value = (response.data?.days || []).map((item: any) => ({
                    ...item,
                    date: normalizeDateKey(item.date)
                  }));

                  const firstAvailable = weekDays.value.find(item => item.sessions?.length);
                  if (firstAvailable) {
                    await selectDay(firstAvailable);
                  }
                } catch (error) {
                  console.error(error);
                  weekDays.value = [];
                } finally {
                  weekLoading.value = false;
                }
}

async function selectDay(item: any) {
                if (!item?.sessions?.length) return;

                selectedDate.value = item.date;
                selectedSessionId.value = Number(item.sessions[0].id);
                activeTab.value = 'cashflow';
                await loadDayReport();
}

async function loadDayReport() {
                if (!userStore.locationId || !selectedSessionId.value) return;

                analyticsBreakdownVisible.value = false;
                dayLoading.value = true;
                report.value = null;

                try {
                  const response = await getWeeklyReportDay({
                    locationid: Number(userStore.locationId),
                    sessionid: Number(selectedSessionId.value)
                  });
                  report.value = response.data || null;
                } catch (error) {
                  console.error(error);
                } finally {
                  dayLoading.value = false;
                }
}

function money(value: any) {
                const amount = Number(value || 0);
                return amount.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
}

function signedMoney(value: any) {
                const amount = Number(value || 0);
                const formatted = money(Math.abs(amount));
                if (amount > 0) return `+${formatted}`;
                if (amount < 0) return `-${formatted}`;
                return formatted;
}

function percentage(value: any) {
                const amount = Number(value || 0);
                return `${amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}%`;
}

function number(value: any) {
                return Number(value || 0).toLocaleString('en-US', {
                  maximumFractionDigits: 2
                });
}

function shiftPercent(value: any, total: any) {
          const amount = Number(value || 0);
          const totalAmount = Number(total || 0);

          if (!totalAmount) return 0;

          return Math.round((amount / totalAmount) * 100);
}

function timeLabel(value: any) {
          const text = String(value || '').slice(0, 5);
          const [hourText, minute = '00'] = text.split(':');
          const hour = Number(hourText);

          if (!Number.isFinite(hour)) return text || '—';

          const suffix = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;

          return `${displayHour}:${minute} ${suffix}`;
}

function amountClass(value: any) {
                const amount = Number(value || 0);
                if (amount < 0) return 'is-negative';
                if (amount > 0) return 'is-positive';
                return '';
}

function formatDateOnly(value: string) {
                if (!value) return '';
                const date = fromDateKey(value);
                return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}

function shortDate(value: string) {
                if (!value) return '';
                const date = fromDateKey(value);
                return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

function dayName(value: string) {
                if (!value) return '';
                return fromDateKey(value).toLocaleDateString('en-US', { weekday: 'short' });
}

function longDate(value: string) {
                if (!value) return '';
                return fromDateKey(value).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                });
}

function formatDateTime(value: any) {
                if (!value) return '—';
                const date = new Date(value);
                if (Number.isNaN(date.getTime())) return '—';
                return date.toLocaleString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                });
}

watch(
                () => userStore.locationId,
                () => {
                  if (userStore.locationId) loadWeek();
                }
);

onMounted(() => {
                setStandardWeek('current');
                loadWeek();
});
</script>

