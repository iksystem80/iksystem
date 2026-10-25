<template>
  <div class="app-container admin-transactions-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Admin Transactions</h2>
        <p>Manage admin transaction</p>
      </div>
    </div>
    <el-alert v-if="!isAdmin" type="error" title="Admin access required" show-icon :closable="false" />
    <el-tabs v-else v-model="adminTab">
      <el-tab-pane label="Overview" name="overview">
        <div class="employee-finance-summary">
          <el-row class="summary-row employee-finance-main-summary">
            <el-col :span="24" class="summary-column">
              <el-card shadow="never" class="summary-card summary-green">
                <div class="summary-card-content">
                  <div class="summary-icon"><el-icon><CircleCheckFilled /></el-icon></div>
                  <el-statistic title="Available Balance" :value="Number(myCustodyAvailable || 0)" :precision="2" prefix="$" />
                  <div class="admin-withdraw-overview-actions">
                    <el-button class="admin-withdraw-history-btn" title="Withdrawal History" aria-label="Withdrawal History" @click="openAdminWithdrawalHistory">
                      <LcHistory class="admin-withdraw-action-icon" />
                      <span class="admin-withdraw-action-label">Withdrawal History</span>
                    </el-button>
                    <el-button class="admin-withdraw-overview-btn" type="primary" title="Withdraw Cash" aria-label="Withdraw Cash" :disabled="!custodyLoaded || !!custodyError || myCustodyAvailable <= 0"
                             @click="adminWithdrawalDialogOpen = true">
                      <LcBanknoteArrowDown class="admin-withdraw-action-icon" />
                      <span class="admin-withdraw-action-label">Withdraw Cash</span>
                    </el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <el-dialog v-model="adminWithdrawalHistoryOpen" title="Admin Withdrawal History" width="min(650px, 94vw)" append-to-body destroy-on-close>
          <div v-loading="adminWithdrawalHistoryLoading">
            <el-alert v-if="adminWithdrawalHistoryError" type="error" :title="adminWithdrawalHistoryError" :closable="false" show-icon class="withdraw-history-alert" />
            <el-empty v-else-if="!adminWithdrawalHistoryLoading && !adminWithdrawalHistory.length" description="No withdrawals recorded" :image-size="70" />
            <el-table v-else :data="adminWithdrawalHistory" size="small" max-height="420" style="width:100%">
              <el-table-column label="Date" min-width="165">
                <template #default="{ row }">{{ dateTime(row.createdAt) }}</template>
              </el-table-column>
              <el-table-column label="Notes" min-width="180">
                <template #default="{ row }">{{ row.notes || '—' }}</template>
              </el-table-column>
              <el-table-column label="Withdrawn" width="125" align="right">
                <template #default="{ row }"><strong class="debit">−{{ money(Math.abs(Number(row.amount || 0))) }}</strong></template>
              </el-table-column>
            </el-table>
          </div>
        </el-dialog>

        <el-alert v-if="custodyError" type="error" :title="custodyError" :closable="false" show-icon />

        <!-- Owner capital is credited to the Admin ledger only after recipient acceptance. -->
        <el-card v-if="myPendingCapital.length" shadow="never" class="panel" style="margin-bottom: 16px">
          <template #header>
            <strong>Initial Capital Awaiting Confirmation</strong>
          </template>
          <div v-for="capital in myPendingCapital" :key="capital.id"
               style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px">
            <div>
              <strong>{{ money(capital.amount) }}</strong>
              <div class="hint">From Owner · {{ dateTime(capital.createdAt) }} · Pending receipt</div>
              <div v-if="capital.notes" class="hint">{{ capital.notes }}</div>
            </div>
            <el-button type="primary" :loading="acceptingCapitalId === capital.id"
                       :disabled="acceptingCapitalId !== null" @click="confirmInitialCapital(capital)">
              Confirm Receipt
            </el-button>
          </div>
        </el-card>

        <div class="work-grid cash-activity-section">
          <el-card shadow="never" class="panel cash-entry-card">
            <template #header>
              <div class="cash-header-actions">
                <el-segmented v-model="adminTransactionMode"
                              :options="adminTransactionOptions"
                              class="cash-type-toggle cash-type-toggle-header">
                  <template #default="{ item }">
                    <span class="cash-segment-option">
                      <el-icon>
                        <component :is="item.icon" />
                      </el-icon>
                      <span>{{ item.label }}</span>
                    </span>
                  </template>
                </el-segmented>
              </div>
            </template>

            <el-form class="cash-activity-form" @submit.prevent="saveAdminCashTransaction">
              <div class="cash-activity-row">
                <el-select v-if="adminTransactionMode === 'CASH_RECEIVED'"
                           v-model="adminCashTransaction.credittypeid"
                           class="cash-type-select"
                           placeholder="Credit type"
                           :loading="transactionTypesLoading"
                           @visible-change="visible => visible && refreshAdminCreditTypes()">
                  <el-option v-for="type in transactionCreditTypes"
                             :key="type.id"
                             :label="type.name"
                             :value="type.id" />
                </el-select>

                <el-select v-else
                           v-model="adminCashTransaction.expensetypeid"
                           class="cash-type-select"
                           placeholder="Expense type"
                           :loading="transactionTypesLoading"
                           @visible-change="visible => visible && refreshAdminExpenseTypes()">
                  <el-option v-for="type in transactionExpenseTypes"
                             :key="type.id"
                             :label="type.name"
                             :value="type.id" />
                </el-select>

                <el-input v-model="adminCashTransaction.amount"
                          class="cash-amount-input"
                          inputmode="decimal"
                          placeholder="0.00">
                  <template #prefix>
                    <strong>{{ adminTransactionMode === 'CASH_RECEIVED' ? '+ $' : '− $' }}</strong>
                  </template>
                </el-input>

                <el-button :type="adminTransactionMode === 'CASH_RECEIVED' ? 'success' : 'danger'"
                           class="cash-record-btn"
                           native-type="submit"
                           :loading="adminBusy"
                           :disabled="adminBusy || !custodyLoaded">
                  {{ adminTransactionMode === 'CASH_RECEIVED' ? 'Record credit' : 'Record expense' }}
                </el-button>
              </div>
            </el-form>
          </el-card>
        </div>

        <div class="session-ledger-grid space-top">
          <el-card shadow="never" class="ledger-card credit-ledger">
            <template #header>
              <div class="weekly-analytics-card-title">
                <!--<el-icon><Wallet /></el-icon>-->
                <strong style="font-size:14px;font-weight:700">Credits</strong>
              </div>
            </template>

            <el-empty v-if="!adminCreditTransactions.length"
                      description="No credits yet"
                      :image-size="70" />

            <div v-else class="ledger-list">
              <div v-for="item in adminCreditTransactions"
                   :key="item.id"
                   class="ledger-item">
                <div>
                  <strong>{{ adminLedgerLabel(item) }}</strong>
                  <p>
                    {{ dateTime(item.createdAt) }}
                    <template v-if="item.notes">
                      · {{ item.notes }}
                    </template>
                  </p>
                </div>
                <strong class="credit">+{{ money(Math.abs(Number(item.amount || 0))) }}</strong>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="ledger-card expense-ledger">
            <template #header>
              <strong style="font-size:14px;font-weight:700">Expenses</strong>
            </template>

            <el-empty v-if="!adminExpenseTransactions.length"
                      description="No expenses yet"
                      :image-size="70" />

            <div v-else class="ledger-list">
              <div v-for="item in adminExpenseTransactions"
                   :key="item.id"
                   class="ledger-item">
                <div>
                  <strong>{{ adminLedgerLabel(item) }}</strong>
                  <p>
                    {{ dateTime(item.createdAt) }}
                    <template v-if="item.notes">
                      · {{ item.notes }}
                    </template>
                  </p>
                </div>
                <strong class="debit">−{{ money(Math.abs(Number(item.amount || 0))) }}</strong>
              </div>
            </div>
          </el-card>
        </div>

        <el-card shadow="never" class="panel space-top app-table-card">
          <template #header>
            <div class="app-table-card-header">
              <el-icon><WalletFilled /></el-icon>
              <div class="app-table-card-title">
                <strong>Current Employee Money Trail</strong>
                <div class="hint">Employee cash flow not yet included in a Reading Session.</div>
              </div>
            </div>
          </template>

          <div v-loading="moneyTrailLoading">
            <el-empty v-if="!moneyTrailLoading && !currentMoneyTrail.length"
                      class="app-table-empty"
                      description="No current employee sessions awaiting Reading Session coverage"
                      :image-size="70" />

            <div v-else class="weekly-report-table-wrap">
              <el-table :data="currentMoneyTrail"
                        size="small"
                        class="app-data-table is-compact"
                        style="width:100%">
                <el-table-column label="Employee / Session" min-width="230">
                  <template #default="{ row }">
                    <div class="money-trail-employee-wrap">
                      <span class="money-trail-status-bar"
                            :class="row.status === 'ACTIVE' ? 'is-active' : 'is-closed'"
                            :title="row.status === 'ACTIVE' ? 'Active' : 'Closed'"></span>

                      <div class="money-trail-employee">
                        <div class="money-trail-employee-line">
                          <strong>{{ row.employeeName }}</strong>
                          <span>Session # {{ row.sessionNumber ?? row.id }}</span>
                        </div>

                        <span class="money-trail-date">
                          {{ moneyTrailDate(row.clockIn) }}
                          · {{ moneyTrailTime(row.clockIn) }}
                          <template v-if="row.clockOut"> - {{ moneyTrailTime(row.clockOut) }}</template>
                        </span>
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="Opening Bank" width="130" align="right">
                  <template #default="{ row }">
                    {{ money(row.opening) }}
                  </template>
                </el-table-column>

                <el-table-column label="Credits" width="120" align="right">
                  <template #default="{ row }">
                    <strong class="credit">+{{ money(row.received) }}</strong>
                  </template>
                </el-table-column>

                <el-table-column label="Expense" width="120" align="right">
                  <template #default="{ row }">
                    <strong class="debit">-{{ money(row.expenses) }}</strong>
                  </template>
                </el-table-column>

                <el-table-column label="Calculated" width="130" align="right">
                  <template #default="{ row }">
                    <strong>{{ money(row.calculatedBalance) }}</strong>
                  </template>
                </el-table-column>

                <el-table-column label="Actual" width="120" align="right">
                  <template #default="{ row }">
                    <strong>{{ row.actualCash == null ? '—' : money(row.actualCash) }}</strong>
                  </template>
                </el-table-column>

                <el-table-column label="Short / Over" width="125" align="center">
                  <template #default="{ row }">
                    <strong v-if="row.variance != null"
                            :class="Number(row.variance) < 0 ? 'debit' : Number(row.variance) > 0 ? 'credit' : ''">
                      {{ signedMoney(row.variance) }}
                    </strong>
                    <span v-else>—</span>
                  </template>
                </el-table-column>

                <el-table-column label="Cash Destination" min-width="180">
                  <template #default="{ row }">
                    <el-tag v-if="row.destinationType === 'EMPLOYEE_PENDING'"
                            type="warning"
                            effect="plain"
                            round>
                      {{ row.destination }}
                    </el-tag>
                    <el-tag v-else-if="row.destinationType === 'EMPLOYEE_ACCEPTED'"
                            type="success"
                            effect="plain"
                            round>
                      {{ row.destination }}
                    </el-tag>
                    <el-tag v-else-if="row.destinationType === 'ADMIN_CUSTODY'"
                            type="primary"
                            effect="plain"
                            round>
                      {{ row.destination }}
                    </el-tag>
                    <span v-else>{{ row.destination }}</span>
                  </template>
                </el-table-column>

              </el-table>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="Session Funding" name="funding">
        <el-card shadow="never" class="panel">
          <template #header>
            <div class="app-table-card-header">
              <el-icon><Money /></el-icon>
              <div class="app-table-card-title">
                <strong>Admin → Employee Cash Funding</strong>
                <div class="hint">Send opening cash for new session from your Admin custody. The employee confirms receipt before their session is credited.</div>
              </div>
            </div>
          </template>
          <el-alert v-if="custodyError" type="error" :title="custodyError" :closable="false" show-icon />
          <el-form label-position="top" class="cash-activity-form" @submit.prevent="sendAdminFunding">
            <el-form-item label="Receiving employee">
              <el-select v-model="adminFunding.touserid" filterable placeholder="Select employee" style="width:100%">
                <el-option v-for="person in adminEmployees" :key="person.id" :value="person.id" :label="`${person.name}${person.clockedIn ? ' · Clocked in' : ''}`" />
              </el-select>
            </el-form-item>
            <el-form-item label="Funding type">
              <el-select v-model="adminFunding.fundingtype" style="width:100%">
                <el-option label="Session Opening Bank" value="INITIAL_OPENING" />
                <el-option label="Additional Cash" value="BUSINESS_SUPPORT" />
              </el-select>
            </el-form-item>
            <el-form-item :label="`Amount · Available ${custodyLoaded && !custodyError ? money(myCustodyAvailable) : '—'}`">
              <el-input v-model="adminFunding.amount" inputmode="decimal" placeholder="0.00" :disabled="!custodyLoaded || !!custodyError || myCustodyAvailable <= 0">
                <template #prefix>
                  $
                </template>
              </el-input>
              <div v-if="validAmount(adminFunding.amount) && Number(adminFunding.amount) > myCustodyAvailable" class="hint">Amount exceeds available cash.</div>
            </el-form-item>
            <el-form-item label="Notes (optional)"><el-input v-model="adminFunding.notes" maxlength="500" /></el-form-item>
            <div v-if="adminFunding.fundingtype === 'INITIAL_OPENING'" class="hint">Initial Opening is for an employee’s first cash activity in their active session. Otherwise, choose Business Support.</div>
            <div><el-button type="primary" native-type="submit" :loading="adminBusy" :disabled="adminBusy || !custodyLoaded || !!custodyError || myCustodyAvailable <= 0 || (validAmount(adminFunding.amount) && Number(adminFunding.amount) > myCustodyAvailable)"><el-icon><Money /></el-icon><span>Send cash for confirmation</span></el-button></div>
          </el-form>

        </el-card>

        <el-dialog v-model="adminWithdrawalDialogOpen" title="Admin Cash Withdrawal" width="min(480px, 94vw)" append-to-body destroy-on-close class="admin-withdraw-dialog">
          <p class="withdraw-dialog-hint">Withdraw cash from the business. This reduces Admin custody only; it is not a business expense.</p>
          <el-form label-position="top" class="cash-activity-form" @submit.prevent="withdrawAdminCash">
            <el-form-item :label="`Withdrawal Amount · Available ${custodyLoaded && !custodyError ? money(myCustodyAvailable) : '—'}`">
              <el-input v-model="adminWithdrawal.amount" inputmode="decimal" placeholder="0.00"
                        :disabled="adminWithdrawalBusy || !custodyLoaded || !!custodyError || myCustodyAvailable <= 0">
                <template #prefix>$</template>
              </el-input>
            </el-form-item>
            <el-form-item label="Notes (optional)">
              <el-input v-model="adminWithdrawal.notes" maxlength="500" />
            </el-form-item>
            <div class="hint">The withdrawal date is recorded automatically when you confirm.</div>
            <div class="withdraw-dialog-actions">
              <el-button :disabled="adminWithdrawalBusy" @click="adminWithdrawalDialogOpen = false">Cancel</el-button>
              <el-button type="primary" native-type="submit" :loading="adminWithdrawalBusy"
                         :disabled="adminWithdrawalBusy || !custodyLoaded || !!custodyError || myCustodyAvailable <= 0 || !validAmount(adminWithdrawal.amount) || Number(adminWithdrawal.amount) > myCustodyAvailable">
                <el-icon><Money /></el-icon><span>Withdraw Cash</span>
              </el-button>
            </div>
          </el-form>
        </el-dialog>

        <el-card shadow="never" class="panel admin-custody-history-card">
          <template #header>
            <div class="app-table-card-header">
              <el-icon><Money /></el-icon>
              <div class="app-table-card-title">
                <strong>Admin Custody History</strong>
                <div class="hint">One chronological list of capital, funding, shift closings and actual machine collections. Other custody adjustments appear separately when needed.</div>
              </div>
            </div>
          </template>
          <div class="admin-custody-history-filters">
            <el-radio-group v-model="custodyHistoryRange" size="small" @change="onCustodyHistoryRangeChange">
              <el-radio-button value="7d">Last 7 Days</el-radio-button>
              <el-radio-button value="custom">Custom Range</el-radio-button>
            </el-radio-group>
            <div v-if="custodyHistoryRange === 'custom'" class="admin-custody-custom-range">
              <el-date-picker v-model="custodyHistoryDates" type="daterange" value-format="YYYY-MM-DD"
                              start-placeholder="Start date" end-placeholder="End date"
                              unlink-panels :clearable="false" size="small" />
              <el-button type="primary" size="small" :loading="custodyHistoryLoading"
                         :disabled="!custodyHistoryDates || custodyHistoryDates.length !== 2"
                         @click="loadCustodyHistory">Apply</el-button>
            </div>
          </div>
          <el-empty v-if="!adminCustodyHistory.length && !custodyHistoryLoading" description="No Admin custody transactions for this range" :image-size="60" />
          <el-table v-else v-loading="custodyHistoryLoading" :data="adminCustodyHistory" size="small" style="width:100%" row-key="id">
            <el-table-column label="Date" min-width="112">
              <template #default="{ row }">{{ row.date }}</template>
            </el-table-column>
            <el-table-column prop="fromName" label="From" min-width="100" />
            <el-table-column prop="toName" label="To" min-width="100" />
            <el-table-column label="Type" min-width="165">
              <template #default="{ row }">
                <span>{{ row.type }}</span>
                <el-tag v-if="row.status === 'Pending'" size="small" type="warning" effect="plain" style="margin-left: 5px">Pending</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Opening" min-width="115" align="right">
              <template #default="{ row }">{{ money(row.opening) }}</template>
            </el-table-column>
            <el-table-column label="Collection" min-width="125" align="right">
              <template #default="{ row }">
                <span v-if="Number(row.collection)" style="color: var(--el-color-success)">+{{ money(row.collection) }}</span>
                <span v-else>{{ money(0) }}</span>
                <div v-if="Number(row.calculatedCollection)" class="hint">Calculated {{ money(row.calculatedCollection) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="Funding" min-width="130" align="right">
              <template #default="{ row }">
                <span v-if="row.status === 'Pending'" class="hint">Pending {{ money(row.pendingAmount) }}</span>
                <span v-else-if="row.type === 'Admin Withdrawal'" style="color: var(--el-color-danger)">{{ money(row.otherMovement) }}</span>
                <span v-else :style="Number(row.funding) < 0 ? 'color: var(--el-color-danger)' : ''">{{ money(row.funding) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Closing" min-width="120" align="right">
              <template #default="{ row }"><strong>{{ money(row.closing) }}</strong></template>
            </el-table-column>
            <el-table-column label="Actions" min-width="135" align="right">
              <template #default="{ row }">
                <template v-if="row.status === 'Pending'">
                  <el-button v-if="!row.custodySourceAccountId" link type="primary" :disabled="adminBusy" @click="openEditFunding(row)"><el-icon><Edit /></el-icon>Edit</el-button>
                  <el-button link type="danger" :loading="adminBusy" @click="cancelFunding(row)"><el-icon><Close /></el-icon>Cancel</el-button>
                </template>
                <el-tooltip v-else-if="Number(row.otherMovement)" :content="`Other custody movement: ${money(row.otherMovement)} · ${row.notes || row.type}`" placement="top">
                  <span class="hint">Details</span>
                </el-tooltip>
                <span v-else class="hint">—</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="Expense Type" name="expenses">

        <el-card shadow="never" class="panel">
          <template #header>
            <div class="app-table-card-header">
              <el-icon><WalletFilled /></el-icon>
              <div class="app-table-card-title">
                <strong>Manage Expense Types</strong>
                <div class="hint">Maintain the same expense categories used by employees and Admin.</div>
              </div>
            </div>
          </template>
          <div class="cash-activity-row"><el-input v-model="newExpenseType" maxlength="100" placeholder="New expense type, e.g. Supplies" @keyup.enter="addType" /><el-button type="primary" :loading="busy" @click="addType"><el-icon><Plus /></el-icon><span>Add type</span></el-button></div>
          <div class="ledger-list"><div v-for="item in expenseTypes" :key="item.id" class="ledger-item"><span>{{ item.name }}</span><el-switch :model-value="item.isActive" :loading="busy" @change="value => changeType(item, value)" /></div></div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="Credit Type" name="credits">
        <el-card shadow="never" class="panel">
          <template #header>
            <div class="app-table-card-header">
              <el-icon><CircleCheckFilled /></el-icon>
              <div class="app-table-card-title">
                <strong>Manage Credit Types</strong>
                <div class="hint">Global defaults are available to every location and are locked. Add location-specific credit types here.</div>
              </div>
            </div>
          </template>

          <div class="cash-activity-row">
            <el-input v-model="newCreditType"
                      maxlength="100"
                      placeholder="New credit type, e.g. Cash Adjustment"
                      @keyup.enter="addCreditType" />
            <el-button type="primary"
                       :loading="creditTypeBusy"
                       @click="addCreditType">
              <el-icon><Plus /></el-icon>
              <span>Add type</span>
            </el-button>
          </div>

          <div class="weekly-report-table-wrap space-top" v-loading="creditTypeLoading">
            <el-table :data="creditTypes" size="small" style="width:100%">
              <el-table-column prop="name" label="Credit Type" min-width="220" />

              <el-table-column label="Source" width="120">
                <template #default="{ row }">
                  <el-tag v-if="row.isGlobal" type="info" effect="plain" round>Global</el-tag>
                  <el-tag v-else type="primary" effect="plain" round>Location</el-tag>
                </template>
              </el-table-column>

              <el-table-column label="Status" width="120">
                <template #default="{ row }">
                  <el-switch :model-value="row.isActive"
                             :disabled="row.isGlobal"
                             :loading="creditTypeBusy"
                             @change="value => changeCreditTypeStatus(row, value)" />
                </template>
              </el-table-column>

              <el-table-column label="Actions" min-width="160" align="right">
                <template #default="{ row }">
                  <span v-if="row.isGlobal" class="hint">System managed</span>
                  <template v-else>
                    <el-button link type="primary" :disabled="creditTypeBusy" @click="openCreditTypeEdit(row)">
                      <el-icon><Edit /></el-icon><span>Edit</span>
                    </el-button>
                    <el-button link type="danger" :disabled="creditTypeBusy" @click="deleteCreditType(row)">
                      <el-icon><Delete /></el-icon><span>Delete</span>
                    </el-button>
                  </template>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="editCreditTypeOpen"
               title="Edit Credit Type"
               width="460px"
               :close-on-click-modal="false"
               destroy-on-close>
      <el-form label-position="top" @submit.prevent="saveCreditTypeEdit">
        <el-form-item label="Credit type name">
          <el-input v-model="editCreditType.name" maxlength="100" @keyup.enter="saveCreditTypeEdit" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editCreditTypeOpen = false">Cancel</el-button>
        <el-button type="primary" :loading="creditTypeBusy" @click="saveCreditTypeEdit">Save changes</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editFundingOpen" title="Edit Pending Funding" width="520px" :close-on-click-modal="false" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="Receiving employee"><el-select v-model="editFunding.touserid" filterable style="width:100%"><el-option v-for="person in adminEmployees" :key="person.id" :value="person.id" :label="`${person.name}${person.clockedIn ? ' · Clocked in' : ''}`" /></el-select></el-form-item>
        <el-form-item label="Funding type"><el-select v-model="editFunding.fundingtype" style="width:100%"><el-option label="Session Opening Bank" value="INITIAL_OPENING" /><el-option label="Additional Cash" value="BUSINESS_SUPPORT" /></el-select></el-form-item>
        <el-form-item label="Amount">
          <el-input v-model="editFunding.amount" inputmode="decimal">
            <template #prefix>
              $
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="Notes (optional)"><el-input v-model="editFunding.notes" maxlength="500" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editFundingOpen = false"><el-icon><Close /></el-icon><span>Cancel</span></el-button>
        <el-button type="primary" :loading="adminBusy" @click="saveFundingEdit"><el-icon><Check /></el-icon><span>Save changes</span></el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useRefreshStore } from '@/store/modules/refresh';
import request from '@/utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
  import { History as LcHistory, BanknoteArrowDown as LcBanknoteArrowDown } from '@lucide/vue';
//
import {
      getEmployeeFinance,
      getExpenseTypes,
      getCreditTypes,
      createExpenseType,
      setExpenseTypeStatus,
      getAdminFinanceOverview,
      updateAdminFunding,
      cancelAdminFunding,
      sendCustodyEmployeeSupport,
      getLocationCash,
      addCustodyExpense
} from '@/api/employeefinance';

const userStore = useUserStore();
const refreshStore = useRefreshStore();
const locationId = computed(() => userStore.locationId);
const isAdmin = computed(() => String(userStore.roleName || '').trim().toLowerCase() === 'admin');
const isAdminRole = computed(() => String(userStore.roleName || '').trim().toLowerCase() === 'admin');
const loading = ref(false); const busy = ref(false);
const adminLoading = ref(false); const adminBusy = ref(false);
const session = ref(null); const summary = ref({}); const transactions = ref([]); const pending = ref([]); const pendingAdminFunding = ref([]);
const recipients = ref([]); const expenseTypes = ref([]);
const creditTypes = ref([]);
const creditTypeLoading = ref(false);
const creditTypeBusy = ref(false);
const newCreditType = ref('');
const editCreditTypeOpen = ref(false);
const editCreditType = ref({ id: null, name: '' });
const adminEmployees = ref([]); const adminFundingHistory = ref([]); const adminCustodyHistory = ref([]); const adminSummary = ref({});
const adminWithdrawal = ref({ amount: '', notes: '' });
const adminWithdrawalBusy = ref(false);
const adminWithdrawalDialogOpen = ref(false);
const adminWithdrawalHistoryOpen = ref(false);
const adminWithdrawalHistory = ref([]);
const adminWithdrawalHistoryLoading = ref(false);
const adminWithdrawalHistoryError = ref('');
const custodyHistoryRange = ref('7d');
const custodyHistoryDates = ref([]);
const custodyHistoryLoading = ref(false);
let custodyHistoryRequestId = 0;

const pendingOwnerCapital = ref([]);
const acceptingCapitalId = ref(null);
const myPendingCapital = computed(() => pendingOwnerCapital.value.filter(item =>
      String(item.status).toLowerCase() === 'pending' &&
      Number(item.toUserId) === Number(custodyViewerId.value)
));
const custodyAccounts = ref([]);
const custodyViewerId = ref(null);
const custodyLoaded = ref(false);
const custodyLoading = ref(false);
const custodyError = ref('');
let custodyRequestId = 0;
const myCustodyAccount = computed(() => custodyAccounts.value.find(a =>
      String(a.kind).toUpperCase() === (isAdminRole.value ? 'ADMIN' : 'OWNER') &&
            Number(a.userId) === Number(custodyViewerId.value)
) || null);
const myCustodyBalance = computed(() => Number(myCustodyAccount.value?.balance || 0));
const myCustodyReserved = computed(() => Number(myCustodyAccount.value?.reserved || 0));
const myCustodyAvailable = computed(() => Math.max(0, Math.round((myCustodyBalance.value - myCustodyReserved.value) * 100) / 100));
const adminTransactionMode = ref('CASH_RECEIVED');
const adminTransactionOptions = [
      { label: 'Add Bank', value: 'CASH_RECEIVED', icon: 'WalletFilled' },
      { label: 'Expense', value: 'EXPENSE', icon: 'Money' }
];
const adminCashTransaction = ref({ amount: '', credittypeid: null, expensetypeid: null, notes: '' });
const transactionCreditTypes = ref([]);
const transactionExpenseTypes = ref([]);
const transactionTypesLoading = ref(false);
const adminLedger = ref([]);
const currentMoneyTrail = ref([]);
const moneyTrailLoading = ref(false);
const adminFunding = ref({ touserid: null, fundingtype: 'BUSINESS_SUPPORT', amount: '', notes: '' });
const editFundingOpen = ref(false);
const editFunding = ref({ id: null, touserid: null, fundingtype: 'INITIAL_OPENING', amount: '', notes: '' });
const newExpenseType = ref('');
const adminTab = ref('overview');
const activeTypes = computed(() => expenseTypes.value.filter(x => x.isActive));
const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const dateTime = value => value ? new Date(value).toLocaleString() : '—';
const moneyTrailDate = value => {
      if (!value) return '—';
      return new Date(value).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
};
const moneyTrailTime = value => {
      if (!value) return '—';
      return new Date(value).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
};
const signedMoney = value => {
      const amount = Number(value || 0);
      if (amount === 0) return money(0);
      return `${amount > 0 ? '+' : '−'}${money(Math.abs(amount))}`;
};
const errorText = e => e?.response?.data?.message || e?.message || 'Request failed.';
const validAmount = (v, allowZero = false) => /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(String(v).trim()) && (Number(v) > 0 || (allowZero && Number(v) === 0));

const adminCreditTransactions = computed(() =>
      adminLedger.value
        .filter(item => Number(item.amount || 0) > 0)
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
);

const adminExpenseTransactions = computed(() =>
      adminLedger.value
        .filter(item => Number(item.amount || 0) < 0 && item.kind !== 'OWNER_DISTRIBUTION')
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
);

const adminLedgerLabel = item => {
      if (item?.label) return item.label;

      return {
        BANK_DEPOSIT: 'Add Bank',
        MACHINE_COLLECTION: 'Machine Collection',
        EMPLOYEE_CASH_TAKEN: 'Employee Session Close',
        INITIAL_CAPITAL: 'Initial Owner Capital',
        REINVEST: 'Reinvest',
        CUTOVER_OPENING: 'Opening Bank',
        TRANSFER: Number(item?.amount || 0) >= 0 ? 'Transfer In' : 'Transfer Out',
        EMPLOYEE_SUPPORT: 'Employee Funding',
        DIRECT_EXPENSE: item?.expenseTypeName || 'Expense',
        BANK_WITHDRAWAL: 'Bank Withdrawal',
        OWNER_DISTRIBUTION: 'Admin Withdrawal'
      }[item?.kind] || (Number(item?.amount || 0) >= 0 ? 'Credit' : 'Expense');
};


async function loadCustody() {
      if (!isAdmin.value || !locationId.value) return;
      const targetLocation = Number(locationId.value);
      const requestId = ++custodyRequestId;
      // Retain previously loaded figures while refreshing; never unmount the balance/form.
      try {
        custodyLoading.value = true;
        custodyError.value = '';
        const response = await getLocationCash(targetLocation);
        if (Number(locationId.value) !== targetLocation || requestId !== custodyRequestId) return;
        const d = response.data || {};
        custodyAccounts.value = d.accounts || [];
        pendingOwnerCapital.value = d.capital || [];
        custodyViewerId.value = d.viewerId;
        custodyLoaded.value = true;
      } catch (e) {
        if (Number(locationId.value) !== targetLocation || requestId !== custodyRequestId) return;
        // Preserve the previous figures for display, but block transfers until a fresh check succeeds.
        custodyError.value = errorText(e);
      } finally {
        if (Number(locationId.value) === targetLocation && requestId === custodyRequestId) custodyLoading.value = false;
      }
}
async function confirmInitialCapital(capital) {
      if (!locationId.value || !capital?.id || acceptingCapitalId.value !== null) return;
      const targetLocation = Number(locationId.value);
      try {
        await ElMessageBox.confirm(
          `Confirm that you received ${money(capital.amount)} in initial Owner capital?`,
          'Confirm Capital Receipt',
          { type: 'warning', confirmButtonText: 'Confirm Receipt', cancelButtonText: 'Cancel' }
        );
      } catch { return; }
      try {
        acceptingCapitalId.value = capital.id;
        await request({
          url: `/locationcash/capital/${capital.id}/accept`,
          method: 'post',
          data: { locationid: targetLocation }
        });
        ElMessage.success('Initial capital confirmed and credited to your Admin balance.');
        if (Number(locationId.value) === targetLocation) await refreshBalances();
      } catch (e) {
        ElMessage.error(errorText(e));
        if (Number(locationId.value) === targetLocation) await loadCustody();
      } finally {
        acceptingCapitalId.value = null;
      }
}
async function loadAdminLedger() {
      if (!isAdmin.value || !locationId.value) return;

      try {
        const response = await request({
          url: '/employeefinance/admin/cash-ledger',
          method: 'get',
          params: { locationid: locationId.value }
        });

        adminLedger.value = response?.data || [];
      } catch (e) {
        adminLedger.value = [];
        ElMessage.error(errorText(e));
      }
}

async function openAdminWithdrawalHistory() {
      adminWithdrawalHistoryOpen.value = true;
      adminWithdrawalHistoryLoading.value = true;
      adminWithdrawalHistoryError.value = '';
      adminWithdrawalHistory.value = [];
      const targetLocation = Number(locationId.value);
      try {
        const response = await request({
          url: '/employeefinance/admin/custody-withdrawals',
          method: 'get',
          params: { locationid: targetLocation }
        });
        if (Number(locationId.value) !== targetLocation) return;
        adminWithdrawalHistory.value = response?.data || [];
      } catch (e) {
        if (Number(locationId.value) === targetLocation) adminWithdrawalHistoryError.value = errorText(e);
      } finally {
        adminWithdrawalHistoryLoading.value = false;
      }
}

async function loadCurrentMoneyTrail() {
      if (!isAdmin.value || !locationId.value) {
        currentMoneyTrail.value = [];
        return;
      }

      try {
        moneyTrailLoading.value = true;

        const response = await request({
          url: '/employeefinance/admin/current-money-trail',
          method: 'get',
          params: { locationid: locationId.value }
        });

        currentMoneyTrail.value = response?.data || [];
      } catch (e) {
        currentMoneyTrail.value = [];
        ElMessage.error(errorText(e));
      } finally {
        moneyTrailLoading.value = false;
      }
}

async function refreshAdminCreditTypes() {
      if (!locationId.value) return;

      try {
        transactionTypesLoading.value = true;
        const response = await getCreditTypes(locationId.value);
        transactionCreditTypes.value = response?.data || response || [];
      } catch (e) {
        ElMessage.error(errorText(e));
      } finally {
        transactionTypesLoading.value = false;
      }
}

async function refreshAdminExpenseTypes() {
      if (!locationId.value) return;

      try {
        transactionTypesLoading.value = true;
        const response = await getExpenseTypes(locationId.value);
        transactionExpenseTypes.value = response?.data || response || [];
      } catch (e) {
        ElMessage.error(errorText(e));
      } finally {
        transactionTypesLoading.value = false;
      }
}

async function saveAdminCashTransaction() {
      if (!validAmount(adminCashTransaction.value.amount)) {
        return ElMessage.warning('Enter a positive amount (up to 2 decimals).');
      }

      if (
        adminTransactionMode.value === 'CASH_RECEIVED' &&
        !adminCashTransaction.value.credittypeid
      ) {
        return ElMessage.warning('Select a credit type.');
      }

      if (
        adminTransactionMode.value === 'EXPENSE' &&
        !adminCashTransaction.value.expensetypeid
      ) {
        return ElMessage.warning('Select an expense type.');
      }

      if (adminTransactionMode.value === 'EXPENSE') {
        await loadCustody();

        if (!custodyLoaded.value || custodyError.value) {
          return ElMessage.error('Unable to verify your current Admin cash balance.');
        }

        if (Number(adminCashTransaction.value.amount) > myCustodyAvailable.value) {
          return ElMessage.warning(
            `Expense cannot exceed ${money(myCustodyAvailable.value)} available Admin cash.`
          );
        }
      }

      try {
        adminBusy.value = true;

        if (adminTransactionMode.value === 'CASH_RECEIVED') {
          const response = await request({
            url: '/employeefinance/admin/add-bank',
            method: 'post',
            data: {
              locationid: locationId.value,
              credittypeid: adminCashTransaction.value.credittypeid,
              amount: adminCashTransaction.value.amount,
              notes: adminCashTransaction.value.notes
            }
          });

          ElMessage.success(response?.message || 'Admin bank credited.');
        } else {
          await addCustodyExpense({
            locationid: locationId.value,
            source: 'ADMIN',
            expensetypeid: adminCashTransaction.value.expensetypeid,
            amount: adminCashTransaction.value.amount,
            notes: adminCashTransaction.value.notes
          });

          ElMessage.success('Admin expense recorded.');
        }

        adminCashTransaction.value = {
          amount: '',
          credittypeid: null,
          expensetypeid: null,
          notes: ''
        };

        await Promise.all([loadCustody(), loadAdminLedger(), loadCurrentMoneyTrail()]);
      } catch (e) {
        ElMessage.error(errorText(e));
      } finally {
        adminBusy.value = false;
      }
}

async function refreshBalances() {
      await Promise.all([loadAdminOverview(), loadCustody(), loadAdminLedger(), loadCurrentMoneyTrail()]);
}

let realtimeRefreshRunning = false;
let realtimeRefreshPending = false;

async function refreshAdminTransactionsRealtime() {
      if (!isAdmin.value || !locationId.value) return;

      if (realtimeRefreshRunning) {
        realtimeRefreshPending = true;
        return;
      }

      realtimeRefreshRunning = true;

      try {
        do {
          realtimeRefreshPending = false;
          await refreshBalances();
        } while (realtimeRefreshPending);
      } finally {
        realtimeRefreshRunning = false;
      }
}
async function load() {
      if (!locationId.value) return;
      // Reload data in place. Clear custody only when the selected location actually changes.
      try {
        loading.value = true;
        const response = await getEmployeeFinance(locationId.value);
        const d = response.data || {};
        session.value = d.session || null; summary.value = d.summary || {};
        transactions.value = d.transactions || []; pending.value = d.pending || [];
        pendingAdminFunding.value = d.pendingAdminFunding || [];
        recipients.value = d.recipients || [];
        expenseTypes.value = d.expenseTypes || [];
        transactionExpenseTypes.value = (d.expenseTypes || []).filter(x => x.isActive);
        transactionCreditTypes.value = (d.creditTypes || []).filter(x => x.isActive);
        if (isAdmin.value) await refreshBalances();
      } catch (e) { ElMessage.error(errorText(e)); } finally { loading.value = false; }
}

async function loadAdminOverview() {
      if (!isAdmin.value || !locationId.value) return;
      try {
        adminLoading.value = true;
        const d = (await getAdminFinanceOverview(locationId.value)).data || {};
        adminEmployees.value = d.employees || [];
        adminFundingHistory.value = d.funding || [];
        await loadCustodyHistory();
        adminSummary.value = d.summary || {};
      } catch (e) {
        ElMessage.error(errorText(e));
      } finally {
        adminLoading.value = false;
      }
}

function onCustodyHistoryRangeChange(value) {
      if (value === '7d') loadCustodyHistory();
      else adminCustodyHistory.value = [];
}

async function loadCustodyHistory() {
      if (!isAdmin.value || !locationId.value) return;
      const params = { locationid: locationId.value };
      if (custodyHistoryRange.value === 'custom') {
        if (!custodyHistoryDates.value || custodyHistoryDates.value.length !== 2) return;
        params.startdate = custodyHistoryDates.value[0];
        params.enddate = custodyHistoryDates.value[1];
      } else {
        params.range = '7d';
      }
      const requestId = ++custodyHistoryRequestId;
      custodyHistoryLoading.value = true;
      try {
        const result = await request({ url: '/employeefinance/admin/custody-history', method: 'get', params });
        if (requestId === custodyHistoryRequestId) adminCustodyHistory.value = result?.data || [];
      } catch (e) {
        if (requestId === custodyHistoryRequestId) {
          adminCustodyHistory.value = [];
          ElMessage.error(errorText(e));
        }
      } finally {
        if (requestId === custodyHistoryRequestId) custodyHistoryLoading.value = false;
      }
}

async function withdrawAdminCash() {
      if (!validAmount(adminWithdrawal.value.amount)) return ElMessage.warning('Enter a valid withdrawal amount.');
      adminWithdrawalBusy.value = true;
      try {
        // Verify after acquiring a fresh balance; server checks again under a lock.
        await loadCustody();
        if (!custodyLoaded.value || custodyError.value) throw new Error('Unable to verify Admin custody.');
        if (Number(adminWithdrawal.value.amount) > myCustodyAvailable.value) {
          return ElMessage.warning(`Available cash is ${money(myCustodyAvailable.value)}.`);
        }
        await ElMessageBox.confirm(
          `Withdraw ${money(Number(adminWithdrawal.value.amount))} from Admin custody? This cash will leave the business.`,
          'Confirm Cash Withdrawal', { type: 'warning', confirmButtonText: 'Withdraw Cash' }
        );
        const response = await request({
          url: '/employeefinance/admin/custody-withdraw',
          method: 'post',
          data: { locationid: locationId.value, amount: adminWithdrawal.value.amount, notes: adminWithdrawal.value.notes }
        });
        adminWithdrawal.value = { amount: '', notes: '' };
        adminWithdrawalDialogOpen.value = false;
        ElMessage.success(response?.message || 'Cash withdrawal recorded.');
        await refreshBalances();
      } catch (e) {
        if (e !== 'cancel' && e !== 'close') ElMessage.error(errorText(e));
      } finally {
        adminWithdrawalBusy.value = false;
      }
}

async function sendAdminFunding() {
      // Recheck the server-authoritative custody balance immediately before sending.
      await loadCustody();
      if (!custodyLoaded.value || custodyError.value) return ElMessage.error('Unable to verify your current Admin cash balance.');
      if (!adminFunding.value.touserid) return ElMessage.warning('Select the receiving employee.');
      if (!validAmount(adminFunding.value.amount)) return ElMessage.warning('Enter a positive amount (up to 2 decimals).');
      if (Number(adminFunding.value.amount) > myCustodyAvailable.value) { return ElMessage.warning(`You can transfer up to ${money(myCustodyAvailable.value)} of unreserved cash.`); }
      try {
        adminBusy.value = true;
        await sendCustodyEmployeeSupport({ locationid: locationId.value, ...adminFunding.value });
        ElMessage.success(adminFunding.value.fundingtype === 'INITIAL_OPENING'
          ? 'Opening balance sent for employee confirmation.'
          : 'Business support sent for employee confirmation.');
        adminFunding.value = { touserid: null, fundingtype: 'BUSINESS_SUPPORT', amount: '', notes: '' };
        await refreshBalances();
      } catch (e) {
        ElMessage.error(errorText(e));
      } finally {
        adminBusy.value = false;
      }
}

function openEditFunding(item) {
      if (item.status !== 'Pending') return ElMessage.warning('Only pending funding can be edited.');

      const employee = adminEmployees.value.find(person => Number(person.id) === Number(item.toUserId)) || adminEmployees.value.find(person => person.name === item.toName);

      editFunding.value = {
        id: item.fundingId || item.id,
        touserid: employee?.id ?? null,
        fundingtype: item.fundingType || 'INITIAL_OPENING',
        amount: String(item.amount ?? ''),
        notes: item.notes || ''
      };

      editFundingOpen.value = true;
}

async function saveFundingEdit() {
      if (!editFunding.value.id) return;
      if (!editFunding.value.touserid) return ElMessage.warning('Select the receiving employee.');
      if (!validAmount(editFunding.value.amount)) { return ElMessage.warning('Enter a positive amount (up to 2 decimals).'); }

      try {
        adminBusy.value = true;

        await updateAdminFunding(editFunding.value.id, {
          locationid: locationId.value,
          touserid: editFunding.value.touserid,
          fundingtype: editFunding.value.fundingtype,
          amount: editFunding.value.amount,
          notes: editFunding.value.notes
        });

        editFundingOpen.value = false;
        ElMessage.success('Pending funding updated.');

        await refreshBalances();
      } catch (e) {
        ElMessage.error(errorText(e));
      } finally {
        adminBusy.value = false;
      }
}

async function cancelFunding(item) {
      try {
        await ElMessageBox.confirm(`Cancel pending funding of ${money(item.amount)} to ${item.toName}?`,
          'Cancel funding', { type: 'warning', confirmButtonText: 'Cancel funding' });
      } catch { return; }
      try {
        adminBusy.value = true;
        await cancelAdminFunding(item.fundingId || item.id, { locationid: locationId.value });
        ElMessage.success('Pending funding cancelled.');
        await refreshBalances();
      } catch (e) {
        ElMessage.error(errorText(e));
      } finally {
        adminBusy.value = false;
      }
}

async function run(action, success) {
      try { busy.value = true; await action(); ElMessage.success(success); await load(); return true; } catch (e) { ElMessage.error(errorText(e)); return false; } finally { busy.value = false; }
}
async function addType() {
      if (!newExpenseType.value.trim()) return ElMessage.warning('Enter an expense type name.');
      await run(() => createExpenseType({ locationid: locationId.value, name: newExpenseType.value.trim() }), 'Expense type added.');
      newExpenseType.value = '';
}
async function changeType(item, value) {
      await run(() => setExpenseTypeStatus(item.id, { locationid: locationId.value, isactive: value }), 'Expense type updated.');
}
async function loadCreditTypesManage() {
      if (!isAdmin.value || !locationId.value) {
        creditTypes.value = [];
        return;
      }

      try {
        creditTypeLoading.value = true;
        const response = await request({
          url: '/employeefinance/credit-types/manage',
          method: 'get',
          params: { locationid: locationId.value }
        });
        creditTypes.value = response?.data || [];
      } catch (e) {
        creditTypes.value = [];
        ElMessage.error(errorText(e));
      } finally {
        creditTypeLoading.value = false;
      }
}

async function addCreditType() {
      const name = newCreditType.value.trim();
      if (!name) return ElMessage.warning('Enter a credit type name.');

      try {
        creditTypeBusy.value = true;
        await request({
          url: '/employeefinance/credit-types',
          method: 'post',
          data: { locationid: locationId.value, name }
        });
        newCreditType.value = '';
        ElMessage.success('Credit type added.');
        await Promise.all([loadCreditTypesManage(), refreshAdminCreditTypes(), load()]);
      } catch (e) {
        ElMessage.error(errorText(e));
      } finally {
        creditTypeBusy.value = false;
      }
}

function openCreditTypeEdit(item) {
      if (item.isGlobal) return;
      editCreditType.value = { id: item.id, name: item.name || '' };
      editCreditTypeOpen.value = true;
}

async function saveCreditTypeEdit() {
      const name = String(editCreditType.value.name || '').trim();
      if (!editCreditType.value.id || !name) return ElMessage.warning('Enter a credit type name.');

      try {
        creditTypeBusy.value = true;
        await request({
          url: `/employeefinance/credit-types/${editCreditType.value.id}`,
          method: 'patch',
          data: { locationid: locationId.value, name }
        });
        editCreditTypeOpen.value = false;
        ElMessage.success('Credit type updated.');
        await Promise.all([loadCreditTypesManage(), refreshAdminCreditTypes(), load()]);
      } catch (e) {
        ElMessage.error(errorText(e));
      } finally {
        creditTypeBusy.value = false;
      }
}

async function changeCreditTypeStatus(item, value) {
      if (item.isGlobal) return;
      try {
        creditTypeBusy.value = true;
        await request({
          url: `/employeefinance/credit-types/${item.id}`,
          method: 'patch',
          data: { locationid: locationId.value, isactive: value }
        });
        ElMessage.success(value ? 'Credit type activated.' : 'Credit type deactivated.');
        await Promise.all([loadCreditTypesManage(), refreshAdminCreditTypes(), load()]);
      } catch (e) {
        ElMessage.error(errorText(e));
        await loadCreditTypesManage();
      } finally {
        creditTypeBusy.value = false;
      }
}

async function deleteCreditType(item) {
      if (item.isGlobal) return;
      try {
        await ElMessageBox.confirm(
          `Delete credit type “${item.name}”?`,
          'Delete Credit Type',
          { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning' }
        );
      } catch {
        return;
      }

      try {
        creditTypeBusy.value = true;
        await request({
          url: `/employeefinance/credit-types/${item.id}`,
          method: 'delete',
          params: { locationid: locationId.value }
        });
        ElMessage.success('Credit type deleted.');
        await Promise.all([loadCreditTypesManage(), refreshAdminCreditTypes(), load()]);
      } catch (e) {
        ElMessage.error(errorText(e));
      } finally {
        creditTypeBusy.value = false;
      }
}

watch(
      () => refreshStore.key('adminTransactions'),
      (current, previous) => {
        if (current !== previous) refreshAdminTransactionsRealtime();
      }
);

watch(adminTransactionMode, mode => {
      adminCashTransaction.value.amount = '';
      adminCashTransaction.value.notes = '';

      if (mode === 'CASH_RECEIVED') {
        adminCashTransaction.value.expensetypeid = null;
      } else {
        adminCashTransaction.value.credittypeid = null;
      }
});

watch(adminTab, value => {
      if (!['overview', 'funding', 'expenses', 'credits'].includes(value)) {
        adminTab.value = 'overview';
        return;
      }
      if (value === 'credits') loadCreditTypesManage();
});
watch(locationId, () => { ++custodyRequestId; custodyLoaded.value = false; custodyLoading.value = false; custodyError.value = ''; custodyAccounts.value = []; pendingOwnerCapital.value = []; custodyViewerId.value = null; adminLedger.value = []; currentMoneyTrail.value = []; creditTypes.value = []; load(); if (adminTab.value === 'credits') loadCreditTypesManage(); });
onMounted(load);
</script>



<style scoped>
.withdraw-history-alert { margin-bottom: 12px; }
.withdraw-dialog-hint {
  margin: 0 0 18px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.withdraw-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
.admin-custody-history-card {
  margin-top: 16px;
}
.admin-custody-history-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.admin-custody-custom-range {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
@media (max-width: 767px) {
  .admin-custody-history-filters,
  .admin-custody-custom-range {
    align-items: stretch;
    flex-direction: column;
    gap: 16px;
  }
  .admin-custody-custom-range :deep(.el-date-editor) {
    max-width: 100%;
    width: 100%;
  }
}

.money-trail-employee-wrap {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.money-trail-employee {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  line-height: 1.35;
}

.money-trail-employee-line {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.money-trail-employee-line > strong {
  font-weight: 600;
}

.money-trail-employee-line > span,
.money-trail-employee > span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.money-trail-date {
  margin-top: 1px;
}

.money-trail-status-bar {
  display: inline-block;
  flex: 0 0 3px;
  width: 3px;
  align-self: stretch;
  min-height: 38px;
  border-radius: 3px;
  background: var(--el-border-color);
}

.money-trail-status-bar.is-active {
  background: var(--el-color-success);
}

.money-trail-status-bar.is-closed {
  background: var(--el-border-color-darker);
}
</style>
