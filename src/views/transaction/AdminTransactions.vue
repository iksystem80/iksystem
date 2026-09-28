<template>
    <div class="finance-page irfan-transaction-admintransactions irfan-ui-page">
        <header class="page-heading">
            <div>
                <h2>Admin Transactions</h2>
                <p>Manage employee funding, cash receipts, Admin expenses and expense types.</p>
            </div>
        </header>
        <el-alert v-if="!isAdmin" type="error" title="Admin access required" show-icon :closable="false" />
        <el-tabs v-else v-model="adminTab" class="admin-tabs">
            <el-tab-pane label="Overview" name="overview">
                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header">
                            <div><strong>Your Admin Cash Overview</strong><div class="small-text">Current custody balances and the machine collections credited to your account.</div></div>
                        </div>
                    </template>
                    <div class="balance-strip">
                        <div><span>Your Admin cash</span><strong>{{ money(myCustodyBalance) }}</strong></div>
                        <div><span>Pending / reserved</span><strong>{{ money(myCustodyReserved) }}</strong></div>
                        <div><span>Available to transfer</span><strong class="available-text">{{ money(myCustodyAvailable) }}</strong></div>
                    </div>
                    <el-alert v-if="custodyError" class="section-alert" type="error" :title="custodyError" :closable="false" show-icon />
                    <p v-else-if="!custodyLoaded" class="hint">Loading your Admin custody balance…</p>
                    <p class="hint">Pending transfers are reserved until accepted or cancelled.</p>

                </el-card>

                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header">
                            <div>
                                <strong>Machine Collections Credited to Your Admin Cash</strong>
                                <div class="small-text">Completed machine-reading postings that actually credited your custody. These collections are already included in Your Admin cash above; they are not added again.</div>
                            </div>
                        </div>
                    </template>
                    <el-alert v-if="collectionsError" class="section-alert" type="error" :title="collectionsError" :closable="false" show-icon />
                    <div class="collections-summary">
                        <div><span>Posted collections · all time</span><strong>{{ money(collectionsTotal) }}</strong></div>
                        <div><span>Credited readings</span><strong>{{ collectionsCount }}</strong></div>
                    </div>
                    <p class="hint collections-note">Only positive postings linked to this Admin’s physical custody ledger are included. Older unlinked postings are excluded until reconciled.</p>
                    <el-empty v-if="!collectionsLoading && !machineCollections.length && !collectionsError" description="No machine collections credited to your custody yet" :image-size="55" />
                    <div v-if="machineCollections.length" class="table-wrap">
                        <el-table :data="machineCollections" size="small" style="width:100%" v-loading="collectionsLoading">
                            <el-table-column label="Credited on" min-width="165">
                                <template #default="{ row }">
                                    {{ dateTime(row.creditedAt) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="Reading session" min-width="140">
                                <template #default="{ row }">
                                    #{{ row.readingSessionId }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="postedByName" label="Posted by" min-width="135" />
                            <el-table-column label="Cash credited" min-width="135" align="right">
                                <template #default="{ row }">
                                    <strong class="available-text">+{{ money(row.amount) }}</strong>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                    <p v-if="collectionsCount > machineCollections.length" class="hint collections-note">Showing the latest {{ machineCollections.length }} of {{ collectionsCount }} credited readings; the all-time total includes every linked collection.</p>

                </el-card>
            </el-tab-pane>

            <el-tab-pane label="Business Funding" name="funding">
                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header">
                            <div><strong>Admin → Employee Cash Funding</strong><div class="small-text">Send opening cash or additional business support from your Admin custody. The employee confirms receipt before their session is credited.</div></div>
                        </div>
                    </template>
                    <p class="funding-available">Available to transfer: <strong>{{ custodyLoaded && !custodyError ? money(myCustodyAvailable) : '—' }}</strong></p>
                    <el-alert v-if="custodyError" class="section-alert" type="error" :title="custodyError" :closable="false" show-icon />
                    <el-form label-position="top" class="form-grid" @submit.prevent="sendAdminFunding">
                        <el-form-item label="Receiving employee">
                            <el-select v-model="adminFunding.touserid" filterable placeholder="Select employee" style="width:100%">
                                <el-option v-for="person in adminEmployees" :key="person.id" :value="person.id" :label="`${person.name}${person.clockedIn ? ' · Clocked in' : ''}`" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="Funding type">
                            <el-select v-model="adminFunding.fundingtype" style="width:100%">
                                <el-option label="Initial Opening Balance" value="INITIAL_OPENING" />
                                <el-option label="Business Support / Additional Cash" value="BUSINESS_SUPPORT" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="`Amount · Available ${custodyLoaded && !custodyError ? money(myCustodyAvailable) : '—'}`">
                            <el-input v-model="adminFunding.amount" inputmode="decimal" placeholder="0.00" :disabled="!custodyLoaded || !!custodyError || myCustodyAvailable <= 0">
                                <template #prefix>
                                    $
                                </template>
                            </el-input>
                            <div v-if="validAmount(adminFunding.amount) && Number(adminFunding.amount) > myCustodyAvailable" class="amount-warning">Amount exceeds available cash.</div>
                        </el-form-item>
                        <el-form-item label="Notes (optional)"><el-input v-model="adminFunding.notes" maxlength="500" /></el-form-item>
                        <div v-if="adminFunding.fundingtype === 'INITIAL_OPENING'" class="form-wide hint">Initial Opening is for an employee’s first cash activity in their active session. Otherwise, choose Business Support.</div>
                        <div class="form-wide"><el-button type="primary" native-type="submit" :loading="adminBusy" :disabled="adminBusy || !custodyLoaded || !!custodyError || myCustodyAvailable <= 0 || (validAmount(adminFunding.amount) && Number(adminFunding.amount) > myCustodyAvailable)"><el-icon><Money /></el-icon><span>Send cash for confirmation</span></el-button></div>
                    </el-form>

                </el-card>

                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header"><div><strong>Admin-to-Employee Funding Status</strong><div class="small-text">Check pending transfers and previously confirmed cash.</div></div></div>
                    </template>
                    <el-empty v-if="!adminFundingHistory.length" description="No funding records yet" :image-size="60" />
                    <div v-else class="table-wrap">
                        <el-table :data="adminFundingHistory" size="small" style="width:100%">
                            <el-table-column label="Created" min-width="160">
                                <template #default="{ row }">
                                    {{ dateTime(row.createdAt) }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="fromName" label="From" min-width="130" />
                            <el-table-column prop="toName" label="Employee" min-width="130" />
                            <el-table-column label="Type" min-width="145">
                                <template #default="{ row }">
                                    {{ row.fundingType === 'INITIAL_OPENING' ? 'Initial Opening' : 'Business Support' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="Amount" min-width="105">
                                <template #default="{ row }">
                                    {{ money(row.amount) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="Status" min-width="100">
                                <template #default="{ row }">
                                    <el-tag :type="row.status === 'Accepted' ? 'success' : row.status === 'Cancelled' ? 'info' : 'warning'" effect="light">{{ row.status }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="Actions" min-width="140" align="right">
                                <template #default="{ row }">
                                    <template v-if="row.status === 'Pending'">
                                        <el-button v-if="!row.custodySourceAccountId" link type="primary" :disabled="adminBusy" @click="openEditFunding(row)"><el-icon><Edit /></el-icon><span>Edit</span></el-button>
                                        <el-button link type="danger" :loading="adminBusy" @click="cancelFunding(row)"><el-icon><X /></el-icon><span>Cancel</span></el-button>
                                    </template>
                                    <span v-else class="hint">Locked</span>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </el-card>
            </el-tab-pane>

            <el-tab-pane label="Cash Withdrawal" name="withdrawal">
                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header">
                            <div><strong>Receive Cash from an Employee</strong><div class="small-text">Cash taken from an active employee session moves into your Admin custody. This is a cash transfer, not an expense or Owner distribution.</div></div>
                        </div>
                    </template>
                    <div class="balance-strip">
                        <div><span>Your Admin cash</span><strong>{{ money(myCustodyBalance) }}</strong></div>
                        <div><span>Pending / reserved</span><strong>{{ money(myCustodyReserved) }}</strong></div>
                        <div><span>Available cash</span><strong class="available-text">{{ money(myCustodyAvailable) }}</strong></div>
                    </div>
                    <el-alert v-if="custodyError" class="section-alert" type="error" :title="custodyError" :closable="false" show-icon />
                    <el-form label-position="top" class="form-grid" @submit.prevent="saveAdminWithdrawal">
                        <el-form-item label="Employee with active session"><el-select v-model="adminWithdrawal.sessionid" filterable placeholder="Select employee" style="width:100%" @change="syncWithdrawalHolder"><el-option v-for="holder in positiveCashHolders" :key="holder.sessionId" :value="holder.sessionId" :label="`${holder.name} · Available ${money(holder.currentCash)}`" /></el-select></el-form-item>
                        <el-form-item label="Available employee session cash"><el-input :model-value="selectedCashHolder ? money(selectedCashHolder.currentCash) : '$0.00'" disabled /></el-form-item>
                        <el-form-item label="Cash received">
                            <el-input v-model="adminWithdrawal.amount" inputmode="decimal" placeholder="0.00">
                                <template #prefix>
                                    $
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="Reason / notes"><el-input v-model="adminWithdrawal.notes" maxlength="500" placeholder="Cash collection, safe deposit…" /></el-form-item>
                        <div class="form-wide"><el-button type="primary" native-type="submit" :loading="adminBusy" :disabled="adminBusy || !positiveCashHolders.length"><el-icon><Suitcase /></el-icon><span>Record cash received</span></el-button></div>
                    </el-form>
                    <el-empty v-if="!positiveCashHolders.length" description="No active employee session currently has available cash" :image-size="55" />
                </el-card>

                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header">
                            <div><strong>Last 7 Cash Withdrawals</strong><div class="small-text">Most recent transfers from employees into Admin custody.</div></div>
                        </div>
                    </template>
                    <el-empty v-if="!adminWithdrawalHistory.length" description="No cash withdrawals recorded yet" :image-size="55" />
                    <div v-else class="table-wrap">
                        <el-table :data="adminWithdrawalHistory" size="small" style="width:100%">
                            <el-table-column label="Date" min-width="165">
                                <template #default="{ row }">
                                    {{ dateTime(row.createdAt) }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="employeeName" label="Employee" min-width="130" />
                            <el-table-column label="Session" min-width="100">
                                <template #default="{ row }">
                                    #{{ row.sessionId }}
                                </template>
                            </el-table-column>
                            <el-table-column label="Amount" min-width="110">
                                <template #default="{ row }">
                                    <strong class="debit">−{{ money(row.amount) }}</strong>
                                </template>
                            </el-table-column>
                            <el-table-column prop="takenBy" label="Taken By" min-width="130" />
                            <el-table-column prop="notes" label="Reason / Notes" min-width="180" show-overflow-tooltip />
                        </el-table>
                    </div>
                </el-card>
            </el-tab-pane>

            <el-tab-pane label="Record Expense" name="expense">

                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header">
                            <div><strong>Record Admin Cash Expense</strong><div class="small-text">Pay a business expense directly from your Admin cash. Employee sessions and machine-reading postings remain unchanged.</div></div>
                        </div>
                    </template>
                    <div class="balance-strip">
                        <div><span>Your Admin cash</span><strong>{{ money(myCustodyBalance) }}</strong></div>
                        <div><span>Pending / reserved</span><strong>{{ money(myCustodyReserved) }}</strong></div>
                        <div><span>Available for expense</span><strong class="available-text">{{ money(myCustodyAvailable) }}</strong></div>
                    </div>
                    <el-alert v-if="custodyError" class="section-alert" type="error" :title="custodyError" :closable="false" show-icon />
                    <p v-else-if="!custodyLoaded" class="hint">Loading your Admin custody balance…</p>
                    <el-form label-position="top" class="form-grid" @submit.prevent="saveAdminExpense">
                        <el-form-item label="Expense type"><el-select v-model="adminExpense.expensetypeid" filterable placeholder="Choose expense type" style="width:100%"><el-option v-for="type in activeTypes" :key="type.id" :label="type.name" :value="type.id" /></el-select></el-form-item>
                        <el-form-item label="Amount">
                            <el-input v-model="adminExpense.amount" inputmode="decimal" placeholder="0.00" :disabled="!custodyLoaded || !!custodyError || myCustodyAvailable <= 0">
                                <template #prefix>
                                    $
                                </template>
                            </el-input><div v-if="validAmount(adminExpense.amount) && Number(adminExpense.amount) > myCustodyAvailable" class="amount-warning">Amount exceeds available cash.</div>
                        </el-form-item>
                        <el-form-item class="form-wide" label="Notes (optional)"><el-input v-model="adminExpense.notes" maxlength="500" placeholder="What was this expense for?" /></el-form-item>
                        <div class="form-wide"><el-button type="primary" native-type="submit" :loading="adminBusy" :disabled="adminBusy || !activeTypes.length || !custodyLoaded || !!custodyError || myCustodyAvailable <= 0 || (validAmount(adminExpense.amount) && Number(adminExpense.amount) > myCustodyAvailable)"><el-icon><Memo /></el-icon><span>Record expense</span></el-button></div>
                    </el-form>
                    <p v-if="!activeTypes.length" class="hint">No active expense types. Add one in the Add Expense Type tab first.</p>
                </el-card>
            </el-tab-pane>

            <el-tab-pane label="Add Expense Type" name="expenses">

                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header"><div><strong>Manage Expense Types</strong><div class="small-text">Maintain the same expense categories used by employees and Admin.</div></div></div>
                    </template>
                    <div class="expense-add-row"><el-input v-model="newExpenseType" maxlength="100" placeholder="New expense type, e.g. Supplies" @keyup.enter="addType" /><el-button type="primary" :loading="busy" @click="addType"><el-icon><Plus /></el-icon><span>Add type</span></el-button></div>
                    <div class="expense-type-list"><div v-for="item in expenseTypes" :key="item.id" class="type-row"><span>{{ item.name }}</span><el-switch :model-value="item.isActive" :loading="busy" @change="value => changeType(item, value)" /></div></div>
                </el-card>
            </el-tab-pane>
        </el-tabs>

        <el-dialog v-model="editFundingOpen" title="Edit Pending Funding" width="520px" :close-on-click-modal="false" destroy-on-close>
            <el-form label-position="top">
                <el-form-item label="Receiving employee"><el-select v-model="editFunding.touserid" filterable style="width:100%"><el-option v-for="person in adminEmployees" :key="person.id" :value="person.id" :label="`${person.name}${person.clockedIn ? ' · Clocked in' : ''}`" /></el-select></el-form-item>
                <el-form-item label="Funding type"><el-select v-model="editFunding.fundingtype" style="width:100%"><el-option label="Initial Opening Balance" value="INITIAL_OPENING" /><el-option label="Business Support / More Cash" value="BUSINESS_SUPPORT" /></el-select></el-form-item>
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
                <el-button @click="editFundingOpen = false"><el-icon><X /></el-icon><span>Cancel</span></el-button>
                <el-button type="primary" :loading="adminBusy" @click="saveFundingEdit"><el-icon><Check /></el-icon><span>Save changes</span></el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
    import { computed, onMounted, ref, watch } from 'vue'
    import { useRouter } from 'vue-router'
    import { ElMessage, ElMessageBox } from 'element-plus'
    // import { Check, Edit, HandCoins, Plus, Receipt, Send, X } from '@element-plus/icons-vue'
    import { useUserStore } from '@/store/modules/user'
    import {
        getEmployeeFinance, setOpeningCash, addCashTransaction, handoverAndClockOut,
        acceptCashHandover, createExpenseType, setExpenseTypeStatus, getCashHistory,
        getAdminFinanceOverview, createAdminFunding, updateAdminFunding, cancelAdminFunding, acceptAdminFunding,
        getAdminMoneyTrail, createAdminWithdrawal, sendCustodyEmployeeSupport, getLocationCash, addCustodyExpense, getAdminMachineCollections
    } from '@/api/employeeFinance'

    const userStore = useUserStore()
    const router = useRouter()
    const locationId = computed(() => userStore.locationId)
    const isAdmin = computed(() => String(userStore.roleName || '').trim().toLowerCase() === 'admin')
    const isAdminRole = computed(() => String(userStore.roleName || '').trim().toLowerCase() === 'admin')
    const loading = ref(false), busy = ref(false), historyLoading = ref(false), history = ref([])
    const historyRange = ref('today'), trailRange = ref('today'), adminTrailLoading = ref(false)
    const quickRangeOptions = [{ label: 'Today', value: 'today' }, { label: 'Current Week', value: 'week' }, { label: 'Full Report', value: 'full' }]
    const adminLoading = ref(false), adminBusy = ref(false)
    const session = ref(null), summary = ref({}), transactions = ref([]), pending = ref([]), pendingAdminFunding = ref([])
    const recipients = ref([]), expenseTypes = ref([])
    const adminEmployees = ref([]), adminFundingHistory = ref([]), adminTrail = ref([]), adminSummary = ref({})
    const adminCashHolders = ref([])
    const custodyAccounts = ref([])
    const custodyViewerId = ref(null)
    const custodyLoaded = ref(false)
    const custodyLoading = ref(false)
    const custodyError = ref('')
    const machineCollections = ref([])
    const collectionsTotal = ref(0)
    const collectionsCount = ref(0)
    const collectionsLoading = ref(false)
    const collectionsError = ref('')
    let collectionsRequestId = 0
    let custodyRequestId = 0
    const myCustodyAccount = computed(() => custodyAccounts.value.find(a =>
        String(a.kind).toUpperCase() === (isAdminRole.value ? 'ADMIN' : 'OWNER') &&
        Number(a.userId) === Number(custodyViewerId.value)
    ) || null)
    const myCustodyBalance = computed(() => Number(myCustodyAccount.value?.balance || 0))
    const myCustodyReserved = computed(() => Number(myCustodyAccount.value?.reserved || 0))
    const myCustodyAvailable = computed(() => Math.max(0, Math.round((myCustodyBalance.value - myCustodyReserved.value) * 100) / 100))
    const adminWithdrawalHistory = ref([])
    const opening = ref({ amount: '', notes: '' })
    const transaction = ref({ type: 'CASH_RECEIVED', amount: '', expensetypeid: null, notes: '' })
    const handover = ref({ touserid: null, actualcash: '', notes: '' })
    const adminFunding = ref({ touserid: null, fundingtype: 'BUSINESS_SUPPORT', amount: '', notes: '' })
    const adminWithdrawal = ref({ sessionid: null, amount: '', notes: '' })
    const editFundingOpen = ref(false)
    const editFunding = ref({ id: null, touserid: null, fundingtype: 'INITIAL_OPENING', amount: '', notes: '' })
    const newExpenseType = ref('')
    const adminTab = ref('overview')
    const adminExpense = ref({ expensetypeid: null, amount: '', notes: '' })
    const transactionOptions = [{ label: 'More cash received', value: 'CASH_RECEIVED' }, { label: 'Expense', value: 'EXPENSE' }]
    const activeTypes = computed(() => expenseTypes.value.filter(x => x.isActive))
    const positiveCashHolders = computed(() => adminCashHolders.value.filter(x => Number(x.currentCash || 0) > 0))
    const adminCurrentBalance = computed(() => adminCashHolders.value.reduce((sum, holder) => sum + Number(holder.currentCash || 0), 0))
    const selectedCashHolder = computed(() => adminCashHolders.value.find(x => Number(x.sessionId) === Number(adminWithdrawal.value.sessionid)) || null)
    const hasActivity = computed(() => Number(summary.value.entry_count || 0) > 0)
    const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    const dateTime = value => value ? new Date(value).toLocaleString() : '—'
    const typeLabel = (type, expense) => ({
        OPENING: 'Opening cash', OPENING_TRANSFER: 'Opening handover',
        TRANSFER_IN: 'Additional handover', CASH_RECEIVED: 'Additional cash', EXPENSE: expense || 'Expense', POINTS_EXPENSE: 'Cash Points Expense'
    }[type] || type)
    const errorText = e => e?.response?.data?.message || e?.message || 'Request failed.'
    const validAmount = (v, allowZero = false) => /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(String(v).trim()) && (Number(v) > 0 || (allowZero && Number(v) === 0))

    const quickRangeLabel = value => value === 'week' ? 'Current Week' : 'Today'

    async function loadHistory() {
        if (!locationId.value || historyRange.value === 'full') return
        try {
            historyLoading.value = true
            history.value = (await getCashHistory(locationId.value, historyRange.value)).data || []
        } catch (e) {
            ElMessage.error(errorText(e))
        } finally {
            historyLoading.value = false
        }
    }

    async function loadAdminTrail() {
        if (!isAdmin.value || !locationId.value || trailRange.value === 'full') return
        try {
            adminTrailLoading.value = true
            adminTrail.value = (await getAdminMoneyTrail(locationId.value, trailRange.value)).data || []
        } catch (e) {
            ElMessage.error(errorText(e))
        } finally {
            adminTrailLoading.value = false
        }
    }

    async function handleHistoryRange(value) {
        if (value === 'full') {
            historyRange.value = 'today'
            return router.push('/finance/session-cash-report')
        }
        await loadHistory()
    }

    async function handleTrailRange(value) {
        if (value === 'full') {
            trailRange.value = 'today'
            return router.push('/finance/money-trail-report')
        }
        await loadAdminTrail()
    }

    async function loadCustody() {
        if (!isAdmin.value || !locationId.value) return
        const targetLocation = Number(locationId.value)
        const requestId = ++custodyRequestId
        // Retain previously loaded figures while refreshing; never unmount the balance/form.
        try {
            custodyLoading.value = true
            custodyError.value = ''
            const response = await getLocationCash(targetLocation)
            if (Number(locationId.value) !== targetLocation || requestId !== custodyRequestId) return
            const d = response.data || {}
            custodyAccounts.value = d.accounts || []
            custodyViewerId.value = d.viewerId
            custodyLoaded.value = true
        } catch (e) {
            if (Number(locationId.value) !== targetLocation || requestId !== custodyRequestId) return
            // Preserve the previous figures for display, but block transfers until a fresh check succeeds.
            custodyError.value = errorText(e)
        } finally {
            if (Number(locationId.value) === targetLocation && requestId === custodyRequestId) custodyLoading.value = false
        }
    }
    async function loadMachineCollections() {
        if (!isAdmin.value || !locationId.value) return
        const targetLocation = Number(locationId.value)
        const requestId = ++collectionsRequestId
        try {
            collectionsLoading.value = true
            collectionsError.value = ''
            const response = await getAdminMachineCollections(targetLocation)
            if (Number(locationId.value) !== targetLocation || requestId !== collectionsRequestId) return
            const data = response.data || {}
            machineCollections.value = data.rows || []
            collectionsTotal.value = Number(data.total || 0)
            collectionsCount.value = Number(data.count || 0)
        } catch (e) {
            if (Number(locationId.value) !== targetLocation || requestId !== collectionsRequestId) return
            collectionsError.value = errorText(e)
        } finally {
            if (Number(locationId.value) === targetLocation && requestId === collectionsRequestId) collectionsLoading.value = false
        }
    }
    async function refreshBalances() {
        await Promise.all([loadAdminOverview(), loadCustody(), loadMachineCollections()])
    }
    async function load() {
        if (!locationId.value) return
        // Reload data in place. Clear custody only when the selected location actually changes.
        try {
            loading.value = true
            const response = await getEmployeeFinance(locationId.value)
            const d = response.data || {}
            session.value = d.session || null; summary.value = d.summary || {}
            transactions.value = d.transactions || []; pending.value = d.pending || []
            pendingAdminFunding.value = d.pendingAdminFunding || []
            recipients.value = d.recipients || []; expenseTypes.value = d.expenseTypes || []
            if (isAdmin.value) await refreshBalances()
        } catch (e) { ElMessage.error(errorText(e)) } finally { loading.value = false }
    }


    async function loadAdminOverview() {
        if (!isAdmin.value || !locationId.value) return
        try {
            adminLoading.value = true
            const d = (await getAdminFinanceOverview(locationId.value)).data || {}
            adminEmployees.value = d.employees || []
            adminCashHolders.value = d.cashHolders || []
            adminWithdrawalHistory.value = d.withdrawals || []
            adminFundingHistory.value = d.funding || []
            adminSummary.value = d.summary || {}
        } catch (e) {
            ElMessage.error(errorText(e))
        } finally {
            adminLoading.value = false
        }
    }

    function syncWithdrawalHolder() {
        const holder = selectedCashHolder.value
        if (holder && Number(adminWithdrawal.value.amount || 0) > Number(holder.currentCash || 0))
            adminWithdrawal.value.amount = ''
    }

    async function saveAdminWithdrawal() {
        const holder = selectedCashHolder.value
        if (!holder) return ElMessage.warning('Select an employee with an active session.')
        if (!validAmount(adminWithdrawal.value.amount))
            return ElMessage.warning('Enter a positive withdrawal amount (up to 2 decimals).')

        if (Number(adminWithdrawal.value.amount) > Number(holder.currentCash || 0))
            return ElMessage.warning(`Withdrawal cannot exceed ${money(holder.currentCash)} available cash.`)

        try {
            await ElMessageBox.confirm(
                `Take ${money(adminWithdrawal.value.amount)} from ${holder.name}'s active session? Available cash is ${money(holder.currentCash)}.`,
                'Confirm cash withdrawal',
                { type: 'warning', confirmButtonText: 'Take cash' }
            )
        } catch { return }

        try {
            adminBusy.value = true
            const response = await createAdminWithdrawal({
                locationid: locationId.value,
                sessionid: holder.sessionId,
                amount: adminWithdrawal.value.amount,
                notes: adminWithdrawal.value.notes
            })

            ElMessage.success(response?.message || 'Cash withdrawal recorded.')
            adminWithdrawal.value = { sessionid: null, amount: '', notes: '' }

            await load()
        } catch (e) {
            ElMessage.error(errorText(e))
        } finally {
            adminBusy.value = false
        }
    }

    async function sendAdminFunding() {
        // Recheck the server-authoritative custody balance immediately before sending.
        await loadCustody()
        if (!custodyLoaded.value || custodyError.value) return ElMessage.error('Unable to verify your current Admin cash balance.')
        if (!adminFunding.value.touserid) return ElMessage.warning('Select the receiving employee.')
        if (!validAmount(adminFunding.value.amount)) return ElMessage.warning('Enter a positive amount (up to 2 decimals).')
        if (Number(adminFunding.value.amount) > myCustodyAvailable.value)
            return ElMessage.warning(`You can transfer up to ${money(myCustodyAvailable.value)} of unreserved cash.`)
        try {
            adminBusy.value = true
            await sendCustodyEmployeeSupport({ locationid: locationId.value, ...adminFunding.value })
            ElMessage.success(adminFunding.value.fundingtype === 'INITIAL_OPENING'
                ? 'Opening balance sent for employee confirmation.'
                : 'Business support sent for employee confirmation.')
            adminFunding.value = { touserid: null, fundingtype: 'BUSINESS_SUPPORT', amount: '', notes: '' }
            await refreshBalances()
        } catch (e) {
            ElMessage.error(errorText(e))
        } finally {
            adminBusy.value = false
        }
    }

    async function saveAdminExpense() {
        if (!adminExpense.value.expensetypeid) return ElMessage.warning('Select an expense type.')
        if (!validAmount(adminExpense.value.amount)) return ElMessage.warning('Enter a positive amount (up to 2 decimals).')
        // Recheck current, server-authoritative custody before initiating the debit.
        await loadCustody()
        if (!custodyLoaded.value || custodyError.value) return ElMessage.error('Unable to verify your current Admin cash balance.')
        if (Number(adminExpense.value.amount) > myCustodyAvailable.value)
            return ElMessage.warning(`Expense cannot exceed ${money(myCustodyAvailable.value)} available Admin cash.`)
        try {
            await ElMessageBox.confirm(
                `Record ${money(adminExpense.value.amount)} as an Admin cash expense? This reduces your own Admin custody, not employee session cash.`,
                'Confirm Admin expense', { type: 'warning', confirmButtonText: 'Record expense' }
            )
        } catch { return }
        try {
            adminBusy.value = true
            await addCustodyExpense({
                locationid: locationId.value,
                source: 'ADMIN',
                expensetypeid: adminExpense.value.expensetypeid,
                amount: adminExpense.value.amount,
                notes: adminExpense.value.notes
            })
            ElMessage.success('Admin cash expense recorded.')
            adminExpense.value = { expensetypeid: null, amount: '', notes: '' }
            await refreshBalances()
        } catch (e) {
            ElMessage.error(errorText(e))
            await loadCustody()
        } finally {
            adminBusy.value = false
        }
    }

    function openEditFunding(item) {
        if (item.status !== 'Pending') return ElMessage.warning('Only pending funding can be edited.')

        const employee = adminEmployees.value.find(person => Number(person.id) === Number(item.toUserId)) || adminEmployees.value.find(person => person.name === item.toName)

        editFunding.value = {
            id: item.id,
            touserid: employee?.id ?? null,
            fundingtype: item.fundingType || 'INITIAL_OPENING',
            amount: String(item.amount ?? ''),
            notes: item.notes || ''
        }

        editFundingOpen.value = true
    }

    async function saveFundingEdit() {
        if (!editFunding.value.id) return
        if (!editFunding.value.touserid) return ElMessage.warning('Select the receiving employee.')
        if (!validAmount(editFunding.value.amount))
            return ElMessage.warning('Enter a positive amount (up to 2 decimals).')

        try {
            adminBusy.value = true

            await updateAdminFunding(editFunding.value.id, {
                locationid: locationId.value,
                touserid: editFunding.value.touserid,
                fundingtype: editFunding.value.fundingtype,
                amount: editFunding.value.amount,
                notes: editFunding.value.notes
            })

            editFundingOpen.value = false
            ElMessage.success('Pending funding updated.')

            await refreshBalances()
        } catch (e) {
            ElMessage.error(errorText(e))
        } finally {
            adminBusy.value = false
        }
    }

    async function cancelFunding(item) {
        try {
            await ElMessageBox.confirm(`Cancel pending funding of ${money(item.amount)} to ${item.toName}?`,
                'Cancel funding', { type: 'warning', confirmButtonText: 'Cancel funding' })
        } catch { return }
        try {
            adminBusy.value = true
            await cancelAdminFunding(item.id, { locationid: locationId.value })
            ElMessage.success('Pending funding cancelled.')
            await refreshBalances()
        } catch (e) {
            ElMessage.error(errorText(e))
        } finally {
            adminBusy.value = false
        }
    }

    async function confirmAdminFunding(item) {
        if (!session.value) return ElMessage.warning('Clock in before confirming cash.')
        try {
            await ElMessageBox.confirm(
                `I physically received ${money(item.amount)} from ${item.fromAdmin}. Credit this session?`,
                'Confirm Owner/Admin cash',
                { type: 'warning', confirmButtonText: 'Confirm received' }
            )
        } catch { return }
        await run(() => acceptAdminFunding(item.id, { sessionid: session.value.id }),
            item.fundingType === 'INITIAL_OPENING' ? 'Opening balance confirmed.' : 'Business support confirmed.')
    }

    const trailTypeLabel = type => ({
        ADMIN_FUNDING: 'Owner/Admin funding',
        OPENING: 'Opening balance',
        OPENING_TRANSFER: 'Employee opening handover',
        TRANSFER_IN: 'Employee handover received',
        CASH_RECEIVED: 'Additional cash',
        EXPENSE: 'Cash expense',
        POINTS_EXPENSE: 'Cash Points Expense',
        OWNER_WITHDRAWAL: 'Owner/Admin Cash Taken',
        EMPLOYEE_HANDOVER: 'Employee handover',
        SESSION_CLOSING: 'Session closing'
    }[type] || type)

    async function run(action, success) {
        try { busy.value = true; await action(); ElMessage.success(success); await load(); return true }
        catch (e) { ElMessage.error(errorText(e)); return false } finally { busy.value = false }
    }
    async function saveOpening() {
        if (!validAmount(opening.value.amount, true)) return ElMessage.warning('Enter a nonnegative amount (up to 2 decimals).')
        if (await run(() => setOpeningCash({ sessionid: session.value.id, ...opening.value }), 'Opening balance saved.'))
            opening.value = { amount: '', notes: '' }
    }
    async function saveTransaction() {
        if (!validAmount(transaction.value.amount)) return ElMessage.warning('Enter a positive amount (up to 2 decimals).')
        if (transaction.value.type === 'EXPENSE' && !transaction.value.expensetypeid) return ElMessage.warning('Select an expense type.')
        if (await run(() => addCashTransaction({ sessionid: session.value.id, ...transaction.value }), 'Transaction saved.'))
            transaction.value = { type: transaction.value.type, amount: '', expensetypeid: null, notes: '' }
    }
    async function confirmTransfer(item) {
        if (!session.value) return ElMessage.warning('Clock in before confirming cash.')
        try { await ElMessageBox.confirm(`I physically received ${money(item.amount)} from ${item.fromEmployee}. Credit this session?`, 'Confirm cash received', { type: 'warning', confirmButtonText: 'Confirm received' }) }
        catch { return }
        await run(() => acceptCashHandover(item.id, { sessionid: session.value.id }), 'Handover confirmed.')
    }
    async function closeAndHandover() {
        if (!handover.value.touserid) return ElMessage.warning('Select the receiving employee.')
        if (handover.value.actualcash !== '' && !validAmount(handover.value.actualcash, true))
            return ElMessage.warning('Physical cash counted must be a nonnegative amount (up to 2 decimals).')
        const actual = handover.value.actualcash === '' ? summary.value.balance : handover.value.actualcash
        try { await ElMessageBox.confirm(`Clock out and hand over ${money(actual)}? Calculated closing is ${money(summary.value.balance)}.`, 'Confirm handover', { type: 'warning', confirmButtonText: 'Clock out & hand over' }) }
        catch { return }
        await run(() => handoverAndClockOut({ sessionid: session.value.id, ...handover.value }), 'Session closed; handover is pending confirmation.')
    }
    async function addType() {
        if (!newExpenseType.value.trim()) return ElMessage.warning('Enter an expense type name.')
        await run(() => createExpenseType({ locationid: locationId.value, name: newExpenseType.value.trim() }), 'Expense type added.')
        newExpenseType.value = ''
    }
    async function changeType(item, value) {
        await run(() => setExpenseTypeStatus(item.id, { locationid: locationId.value, isactive: value }), 'Expense type updated.')
    }
    watch(locationId, () => { ++custodyRequestId; custodyLoaded.value = false; custodyLoading.value = false; custodyError.value = ''; custodyAccounts.value = []; custodyViewerId.value = null; ++collectionsRequestId; machineCollections.value = []; collectionsTotal.value = 0; collectionsCount.value = 0; collectionsLoading.value = false; collectionsError.value = ''; load() })
    onMounted(load)
</script>

<style scoped>
    :deep(.el-button > span), :deep(.el-button .el-icon) {
        color: inherit !important;
    }
</style>
