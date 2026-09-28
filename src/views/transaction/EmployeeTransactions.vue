<template>
    <div class="finance-page irfan-transaction-employeetransactions irfan-ui-page">
        <header class="page-heading">
            <div><h2>Employee Session Transaction</h2><p>Opening cash, received cash, expenses and handovers.</p></div>
            <!--<el-button :icon="Refresh" :loading="loading" @click="load">Refresh</el-button>-->
        </header>
        <el-alert v-if="!session" title="Clock in to start recording cash transactions." type="info" show-icon :closable="false" />

        <el-card shadow="never" class="employee-banner irfan-session-banner">
            <div class="irfan-session-banner-layout">
                <el-avatar :size="54" :src="employee?.avatar">
                    {{ initials(employeeName) }}
                </el-avatar>
                <div class="irfan-session-banner-profile">
                    <strong>{{ employeeName }}</strong>
                    <span>Active session #{{ session.id }} · Started {{ dateTime(session.clockIn) }}</span>
                </div>
                <div class="irfan-session-banner-totals">
                    <el-tag type="success" effect="light" round class="irfan-session-status">Clocked in</el-tag>
                    <!--<div class="irfan-session-banner-total">
                        <span>Match Points</span>
                        <strong>{{ totalPoints }}</strong>
                    </div>
                    <div class="irfan-session-banner-total">
                        <span>Cash Expenses</span>
                        <strong>{{ hasCashExpenseData ? formatMoney(totalExpenses) : '—' }}</strong>
                    </div>-->
                </div>
            </div>
        </el-card>

        <!--<el-card v-else shadow="never" class="session-banner irfan-session-banner">
            <div class="irfan-session-banner-layout">
                <el-avatar :size="54">{{ initials(employeeName) }}</el-avatar>
                <div class="irfan-session-banner-profile">
                    <strong>{{ employeeName }}</strong>
                    <span>Active session #{{ session.id }} · Started {{ dateTime(session.clockIn) }}</span>
                </div>
                <el-tag type="success" effect="light" round class="irfan-session-status">Clocked in</el-tag>
            </div>
        </el-card>-->
        <el-alert v-if="pending.length" type="warning" show-icon :closable="false" class="space-top" title="Cash handover awaiting your confirmation" description="Confirm the received amount after counting the cash. It will be credited only once, to your active session." />
        <div v-if="pending.length" class="pending-list">
            <el-card v-for="item in pending" :key="item.id" shadow="never">
                <div class="flex-row pending-row">
                    <div>
                        <strong>{{ money(item.amount) }}</strong><p>From {{ item.fromEmployee }} · Session #{{ item.fromSessionId }}</p><small>
                            {{ dateTime(item.createdAt) }}
                            <template v-if="item.notes">
                                · {{ item.notes }}
                            </template>
                        </small>
                    </div>
                    <el-button type="primary" :disabled="!session" :loading="busy" @click="confirmTransfer(item)">Confirm received</el-button>
                </div>
            </el-card>
        </div>

        <el-alert v-if="pendingAdminFunding.length" type="warning" show-icon :closable="false" class="space-top"
                  title="Owner/Admin cash waiting for your confirmation"
                  description="Count the physical cash, then confirm it. Initial Opening becomes your session opening balance; Business Support becomes additional cash." />
        <div v-if="pendingAdminFunding.length" class="pending-list">
            <el-card v-for="item in pendingAdminFunding" :key="`admin-${item.id}`" shadow="never">
                <div class="flex-row pending-row">
                    <div>
                        <strong>{{ money(item.amount) }}</strong>
                        <p>{{ item.fundingType === 'INITIAL_OPENING' ? 'Initial Opening Balance' : 'Business Support' }} · From {{ item.fromAdmin }}</p>
                        <small>
                            {{ dateTime(item.createdAt) }}
                            <template v-if="item.notes">
                                · {{ item.notes }}
                            </template>
                        </small>
                    </div>
                    <el-button type="primary" :disabled="!session" :loading="busy" @click="confirmAdminFunding(item)">Confirm received</el-button>
                </div>
            </el-card>
        </div>

        <div class="stats-grid">
            <el-card shadow="never" class="stat"><span>Opening balance</span><strong>{{ money(summary.opening) }}</strong></el-card>
            <el-card shadow="never" class="stat"><span>More cash received</span><strong>{{ money(summary.received) }}</strong></el-card>
            <el-card shadow="never" class="stat"><span>Cash expenses</span><strong>{{ money(summary.cashExpenses) }}</strong></el-card>
            <el-card shadow="never" class="stat"><span>Cash Points Expense</span><strong>{{ money(summary.pointsExpense) }}</strong><small>{{ Number(summary.pointsCount || 0) }} assignments</small></el-card>
            <el-card shadow="never" class="stat"><span>Owner/Admin Cash Taken</span><strong>{{ money(summary.ownerWithdrawals) }}</strong></el-card>
            <el-card shadow="never" class="stat balance"><span>Current cash / closing balance</span><strong>{{ money(summary.balance) }}</strong></el-card>
        </div>

        <div v-if="session" class="work-grid">
            <el-card shadow="never" class="panel">
                <template #header>
                    <strong>{{ hasActivity ? 'Record cash activity' : 'Start session cash' }}</strong>
                </template>
                <template v-if="!hasActivity">
                    <p v-if="pending.length" class="hint">Please confirm the pending handover before entering opening cash.</p>
                    <el-form v-else label-position="top" @submit.prevent="saveOpening">
                        <el-form-item label="Opening cash">
                            <el-input v-model="opening.amount" inputmode="decimal" placeholder="0.00">
                                <template #prefix>
                                    $
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="Notes (optional)"><el-input v-model="opening.notes" maxlength="500" /></el-form-item>
                        <el-button type="primary" native-type="submit" :loading="busy" :disabled="busy"><el-icon><Money/></el-icon><span>Save opening balance</span></el-button>
                    </el-form>
                </template>
                <el-form v-else label-position="top" @submit.prevent="saveTransaction">
                    <el-form-item label="Transaction type"><el-segmented v-model="transaction.type" :options="transactionOptions" /></el-form-item>
                    <el-form-item label="Amount">
                        <el-input v-model="transaction.amount" inputmode="decimal" placeholder="0.00">
                            <template #prefix>
                                $
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item v-if="transaction.type === 'EXPENSE'" label="Expense type">
                        <el-select v-model="transaction.expensetypeid" placeholder="Choose expense type" style="width:100%">
                            <el-option v-for="type in activeTypes" :key="type.id" :label="type.name" :value="type.id" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Notes (optional)"><el-input v-model="transaction.notes" maxlength="500" /></el-form-item>
                    <el-button type="primary" native-type="submit" :loading="busy" :disabled="busy">Record transaction</el-button>
                </el-form>
            </el-card>

            <el-card shadow="never" class="panel">
                <template #header>
                    <strong>Close session & hand over cash</strong>
                </template>
                <p class="hint">Closing balance includes customer points assigned during this session as cash expenses. Cash is assigned to your selected colleague but is not credited until they confirm receipt after clocking in.</p>
                <div class="handover-amount">{{ money(summary.balance) }}</div>
                <el-form label-position="top" @submit.prevent="closeAndHandover">
                    <el-form-item label="Receiving employee">
                        <el-select v-model="handover.touserid" filterable placeholder="Select employee" style="width:100%">
                            <el-option v-for="person in recipients" :key="person.id" :value="person.id" :label="person.name" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Physical cash counted">
                        <el-input v-model="handover.actualcash" inputmode="decimal" :placeholder="String(summary.balance ?? '0.00')">
                            <template #prefix>
                                $
                            </template>
                        </el-input>
                        <div class="hint">Leave blank to use the calculated closing balance. Any difference is recorded as short / over for Owner/Admin.</div>
                    </el-form-item>
                    <el-form-item label="Handover notes (optional)"><el-input v-model="handover.notes" maxlength="500" /></el-form-item>
                    <el-button type="primary" :loading="busy" :disabled="busy || !hasActivity || !recipients.length" native-type="submit">
                    <el-icon><Handbag /></el-icon><span>Clock out & hand over</span></el-button>
                </el-form>
            </el-card>
        </div>

        <el-card shadow="never" class="ledger-card space-top">
            <template #header>
                <strong>Session cash ledger</strong>
            </template>
            <el-empty v-if="!transactions.length" description="No cash transactions yet" :image-size="70" />
            <div v-else class="ledger-list">
                <div v-for="item in transactions" :key="item.id" class="ledger-item">
                    <div>
                        <strong>{{ typeLabel(item.type, item.expenseTypeName) }}</strong>
                        <p>
                            {{ dateTime(item.createdAt) }}
                            <template v-if="item.takenBy">
                                · Taken by {{ item.takenBy }}
                            </template>
                            <template v-if="item.notes">
                                · {{ item.notes }}
                            </template>
                        </p>
                    </div>
                    <strong :class="['EXPENSE', 'POINTS_EXPENSE', 'OWNER_WITHDRAWAL'].includes(item.type) ? 'debit' : 'credit'">{{ ['EXPENSE', 'POINTS_EXPENSE', 'OWNER_WITHDRAWAL'].includes(item.type) ? '−' : '+' }}{{ money(item.amount) }}</strong>
                </div>
            </div>
        </el-card>

        <el-card shadow="never" class="space-top">
            <template #header>
                <div class="report-filter-header">
                    <strong>Session cash history · {{ quickRangeLabel(historyRange) }}</strong>
                    <div class="report-filter-actions">
                        <el-segmented v-model="historyRange" :options="quickRangeOptions" size="small" @change="handleHistoryRange" />
                        <el-button link type="primary" :loading="historyLoading" @click="loadHistory">Refresh</el-button>
                    </div>
                </div>
            </template>
            <el-empty v-if="!history.length" description="No historical cash sessions" :image-size="70" />
            <div v-else class="history-wrap">
                <el-table :data="history" size="small" style="width:100%">
                    <el-table-column prop="id" label="Session" width="90" />
                    <el-table-column prop="employeeName" label="Employee" min-width="135" />
                    <el-table-column label="Clock in" min-width="165">
                        <template #default="{ row }">
                            {{ dateTime(row.clockIn) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="Opening" min-width="110">
                        <template #default="{ row }">
                            {{ money(row.opening) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="Received" min-width="110">
                        <template #default="{ row }">
                            {{ money(row.received) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="Cash expenses" min-width="120">
                        <template #default="{ row }">
                            {{ money(row.cashExpenses) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="Cash Points Expense" min-width="155">
                        <template #default="{ row }">
                            {{ money(row.pointsExpense) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="Owner/Admin Taken" min-width="145">
                        <template #default="{ row }">
                            {{ money(row.ownerWithdrawals) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="Total expenses" min-width="120">
                        <template #default="{ row }">
                            {{ money(row.expenses) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="Expected closing" min-width="130">
                        <template #default="{ row }">
                            {{ row.closingBalance == null ? 'Open' : money(row.closingBalance) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="Actual cash" min-width="110">
                        <template #default="{ row }">
                            {{ row.actualCash == null ? '—' : money(row.actualCash) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="Short / Over" min-width="115">
                        <template #default="{ row }">
                            <span v-if="row.variance != null" :class="Number(row.variance) < 0 ? 'debit' : Number(row.variance) > 0 ? 'credit' : ''">
                                {{ Number(row.variance) > 0 ? '+' : '' }}{{ money(row.variance) }}
                            </span>
                            <span v-else>—</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="Handover" min-width="170">
                        <template #default="{ row }">
                            {{ row.handoverStatus ? `${row.handoverStatus} · ${row.recipientName}` : '—' }}
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-card>

        <el-card v-if="isAdmin" shadow="never" class="space-top">
            <template #header>
                <strong>Expense types · Admin</strong>
            </template>
            <div class="flex-row expense-admin">
                <el-input v-model="newExpenseType" maxlength="100" placeholder="New expense type, e.g. Supplies" />
                <el-button type="primary" :loading="busy" @click="addType">Add</el-button>
            </div>
            <div v-for="item in expenseTypes" :key="item.id" class="type-row">
                <span>{{ item.name }}</span><el-switch :model-value="item.isActive" :loading="busy" @change="value => changeType(item, value)" />
            </div>
        </el-card>

    </div>
</template>

<script setup>
    import { computed, onMounted, ref, watch } from 'vue'
    import { useRouter } from 'vue-router'
    import { ElMessage, ElMessageBox } from 'element-plus'
    import { Refresh } from '@element-plus/icons-vue'
    import { useUserStore } from '@/store/modules/user'
    import {
        getEmployeeFinance, setOpeningCash, addCashTransaction, handoverAndClockOut,
        acceptCashHandover, createExpenseType, setExpenseTypeStatus, getCashHistory,
        getAdminFinanceOverview, createAdminFunding, updateAdminFunding, cancelAdminFunding, acceptAdminFunding,
        getAdminMoneyTrail, createAdminWithdrawal
    } from '@/api/employeeFinance'

    const userStore = useUserStore()
    const router = useRouter()
    const locationId = computed(() => userStore.locationId)
    const isAdmin = computed(() => ['admin', 'owner', 'system admin'].includes(String(userStore.roleName || '').toLowerCase()))
    const loading = ref(false), busy = ref(false), historyLoading = ref(false), history = ref([])
    const historyRange = ref('today'), trailRange = ref('today'), adminTrailLoading = ref(false)
    const quickRangeOptions = [{ label: 'Today', value: 'today' }, { label: 'Current Week', value: 'week' }, { label: 'Full Report', value: 'full' }]
    const adminLoading = ref(false), adminBusy = ref(false)
    const session = ref(null), employee = ref(null), summary = ref({}), transactions = ref([]), pending = ref([]), pendingAdminFunding = ref([])
    const recipients = ref([]), expenseTypes = ref([])
    const adminEmployees = ref([]), adminFundingHistory = ref([]), adminTrail = ref([]), adminSummary = ref({})
    const adminCashHolders = ref([])
    const adminWithdrawalHistory = ref([])
    const opening = ref({ amount: '', notes: '' })
    const transaction = ref({ type: 'CASH_RECEIVED', amount: '', expensetypeid: null, notes: '' })
    const handover = ref({ touserid: null, actualcash: '', notes: '' })
    const adminFunding = ref({ touserid: null, fundingtype: 'INITIAL_OPENING', amount: '', notes: '' })
    const adminWithdrawal = ref({ sessionid: null, amount: '', notes: '' })
    const editFundingOpen = ref(false)
    const editFunding = ref({ id: null, touserid: null, fundingtype: 'INITIAL_OPENING', amount: '', notes: '' })
    const newExpenseType = ref('')
    const transactionOptions = [{ label: 'More cash received', value: 'CASH_RECEIVED' }, { label: 'Expense', value: 'EXPENSE' }]
    const activeTypes = computed(() => expenseTypes.value.filter(x => x.isActive))
    const positiveCashHolders = computed(() => adminCashHolders.value.filter(x => Number(x.currentCash || 0) > 0))
    const selectedCashHolder = computed(() => adminCashHolders.value.find(x => Number(x.sessionId) === Number(adminWithdrawal.value.sessionid)) || null)
    const employeeName = computed(() => employee.value?.name || userStore.userInfo?.name || userStore.name || userStore.user?.name || session.value?.employeeName || 'Employee')
    const initials = name => String(name || 'E').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
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

    async function load() {
        if (!locationId.value) return
        try {
            loading.value = true
            const response = await getEmployeeFinance(locationId.value)
            const d = response.data || {}
            session.value = d.session || null; employee.value = d.employee || null; summary.value = d.summary || {}
            transactions.value = d.transactions || []; pending.value = d.pending || []
            pendingAdminFunding.value = d.pendingAdminFunding || []
            recipients.value = d.recipients || []; expenseTypes.value = d.expenseTypes || []
            await loadHistory()

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

            await loadAdminOverview()
            await loadAdminTrail()
            await loadHistory()
            if (session.value) await load()
        } catch (e) {
            ElMessage.error(errorText(e))
        } finally {
            adminBusy.value = false
        }
    }

    async function sendAdminFunding() {
        if (!adminFunding.value.touserid) return ElMessage.warning('Select the receiving employee.')
        if (!validAmount(adminFunding.value.amount)) return ElMessage.warning('Enter a positive amount (up to 2 decimals).')
        try {
            adminBusy.value = true
            await createAdminFunding({ locationid: locationId.value, ...adminFunding.value })
            ElMessage.success(adminFunding.value.fundingtype === 'INITIAL_OPENING'
                ? 'Opening balance sent for employee confirmation.'
                : 'Business support sent for employee confirmation.')
            adminFunding.value = { touserid: null, fundingtype: 'INITIAL_OPENING', amount: '', notes: '' }
            await loadAdminOverview()
        } catch (e) {
            ElMessage.error(errorText(e))
        } finally {
            adminBusy.value = false
        }
    }

    function openEditFunding(item) {
        if (item.status !== 'Pending') return ElMessage.warning('Only pending funding can be edited.')

        const employee = adminEmployees.value.find(person => person.name === item.toName)

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

            await loadAdminOverview()
            await load()
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
            await loadAdminOverview()
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
        await run(async () => {
            const response = await handoverAndClockOut({ sessionid: session.value.id, ...handover.value })
            // Update the shared navbar state immediately after successful clock-out.
            userStore.setClockedIn(false)
            return response
        }, 'Session closed; handover is pending confirmation.')
    }
    async function addType() {
        if (!newExpenseType.value.trim()) return ElMessage.warning('Enter an expense type name.')
        await run(() => createExpenseType({ locationid: locationId.value, name: newExpenseType.value.trim() }), 'Expense type added.')
        newExpenseType.value = ''
    }
    async function changeType(item, value) {
        await run(() => setExpenseTypeStatus(item.id, { locationid: locationId.value, isactive: value }), 'Expense type updated.')
    }
    watch(locationId, load)
    onMounted(load)
</script>



<style scoped>
    .irfan-session-banner {
        background: linear-gradient(135deg, #1e2447, #11162f);
        color: #fff;
        border-color: transparent;
        border-radius: 14px;
        margin-bottom: 16px;
    }

        .irfan-session-banner :deep(.el-card__body) {
            padding: 18px 20px;
        }

    .irfan-session-banner-layout {
        display: grid;
        grid-template-columns: 54px minmax(0, 1fr) auto;
        align-items: center;
        gap: 16px;
    }

    .irfan-session-banner-profile {
        min-width: 0;
    }

        .irfan-session-banner-profile strong, .irfan-session-banner-profile span {
            display: block;
        }

        .irfan-session-banner-profile strong {
            color: #fff;
            font-size: 18px;
        }

        .irfan-session-banner-profile span {
            color: #c7cbea;
            font-size: 12px;
            margin-top: 4px;
        }

    .irfan-session-status {
        justify-self: end;
    }

    @media (max-width: 600px) {
        .irfan-session-banner :deep(.el-card__body) {
            padding: 16px;
        }

        .irfan-session-banner-layout {
            grid-template-columns: 54px minmax(0, 1fr);
            gap: 12px;
        }

        .irfan-session-status {
            grid-column: 2;
            justify-self: start;
        }
    }
</style>
