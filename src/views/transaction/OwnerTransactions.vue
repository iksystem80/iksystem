<template>
    <div class="finance-page irfan-transaction-ownertransactions irfan-ui-page">
        <header class="page-heading"><div><h2>Owner Transactions</h2><p>Fund Admins, receive cash, manage the business bank and record Owner distributions.</p></div></header>
        <el-alert v-if="!isOwner" type="error" title="Owner access required" show-icon :closable="false" />
        <el-tabs v-else v-model="tab" class="admin-tabs">
            <el-tab-pane label="Overview" name="overview">
                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header"><div><strong>Your Owner Cash Overview</strong><div class="small-text">Current Owner custody, business bank and Admin cash balances.</div></div></div>
                    </template>
                    <div class="balance-strip">
                        <div><span>Your Owner cash in hand</span><strong>{{ cash(ownerBalance) }}</strong><small>Available {{ cash(ownerAvailable) }} after pending transfers</small></div>
                        <div><span>Business bank</span><strong>{{ cash(bankBalance) }}</strong></div>
                        <div><span>Admin cash (all custodians)</span><strong>{{ cash(kindTotal('ADMIN')) }}</strong></div>
                    </div>
                </el-card>
                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header"><div><strong>Recent Owner / Bank Ledger</strong><div class="small-text">Recent movements in Owner custody and the business bank.</div></div><el-button link type="primary" @click="router.push('/finance/location-cash')"><el-icon><List /></el-icon><span>Full Location Ledger</span></el-button></div>
                    </template>
                    <div class="table-wrap">
                        <el-table :data="ownerEntries" size="small" style="width:100%">
                            <el-table-column label="Date" min-width="155">
                                <template #default="{row}">
                                    {{ dateTime(row.createdAt) }}
                                </template>
                            </el-table-column><el-table-column prop="account" label="Account" min-width="90" /><el-table-column prop="kind" label="Event" min-width="155" /><el-table-column label="Change" min-width="110">
                                <template #default="{row}">
                                    {{ cash(row.amount) }}
                                </template>
                            </el-table-column><el-table-column prop="notes" label="Notes" min-width="220" show-overflow-tooltip />
                        </el-table>
                    </div>
                </el-card>
            </el-tab-pane>
            <el-tab-pane label="Fund Admin" name="fund">
                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header"><div><strong>Initial Owner Capital</strong><div class="small-text">New Owner investment added to the business.</div></div></div>
                    </template>
                    <el-form label-position="top" class="form-grid" @submit.prevent="submitCapital">
                        <el-form-item label="Receiving Admin"><el-select v-model="capital.touserid" filterable placeholder="Select Admin" style="width:100%"><el-option v-for="p in admins" :key="p.id" :label="p.name" :value="p.id" /></el-select></el-form-item>
                        <el-form-item label="Amount">
                            <el-input v-model="capital.amount" inputmode="decimal" placeholder="0.00">
                                <template #prefix>
                                    $
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item class="form-wide" label="Notes (optional)"><el-input v-model="capital.notes" maxlength="500" /></el-form-item>
                        <div class="form-wide"><el-button type="primary" native-type="submit" :loading="busy"><el-icon><MessageBox /></el-icon><span>Send initial capital</span></el-button></div>
                    </el-form>
                </el-card>
                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header"><div><strong>Reinvest Cash from Your Custody</strong><div class="small-text">An internal Owner → Admin transfer using cash already held by the Owner.</div></div></div>
                    </template>
                    <p class="funding-available">Available to transfer: <strong>{{ cash(ownerAvailable) }}</strong></p>
                    <el-form label-position="top" class="form-grid" @submit.prevent="submitTransfer">
                        <el-form-item label="Receiving Admin"><el-select v-model="transfer.touserid" filterable placeholder="Select Admin" style="width:100%"><el-option v-for="p in admins" :key="p.id" :label="p.name" :value="p.id" /></el-select></el-form-item>
                        <el-form-item :label="`Amount · Available ${cash(ownerAvailable)}`">
                            <el-input v-model="transfer.amount" inputmode="decimal" placeholder="0.00">
                                <template #prefix>
                                    $
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item class="form-wide" label="Notes (optional)"><el-input v-model="transfer.notes" maxlength="500" /></el-form-item>
                        <div class="form-wide"><el-button type="primary" native-type="submit" :loading="busy" :disabled="ownerAvailable<=0"><el-icon><Money /></el-icon><span>Transfer to Admin</span></el-button></div>
                    </el-form>
                </el-card>
                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header"><div><strong>Initial Capital History</strong><div class="small-text">Review capital transfers and cancel eligible pending records.</div></div></div>
                    </template>
                    <div class="table-wrap">
                        <el-table :data="data.capital || []" size="small" style="width:100%">
                            <el-table-column label="Date" min-width="155">
                                <template #default="{row}">
                                    {{ dateTime(row.createdAt) }}
                                </template>
                            </el-table-column><el-table-column prop="toName" label="Admin" min-width="120" /><el-table-column label="Amount" min-width="110">
                                <template #default="{row}">
                                    {{ cash(row.amount) }}
                                </template>
                            </el-table-column><el-table-column prop="status" label="Status" min-width="95" /><el-table-column label="Actions" min-width="120">
                                <template #default="{row}">
                                    <el-button v-if="row.status==='Pending' && Number(row.createdBy)===Number(data.viewerId)" link type="danger" :disabled="busy" @click="cancelCapital(row)"><el-icon><X /></el-icon><span>Cancel</span></el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </el-card>
            </el-tab-pane>
            <el-tab-pane label="Receive from Admin" name="receive">
                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header"><div><strong>Cash Transfers from Admin</strong><div class="small-text">Confirm physical receipt before the transfer increases your Owner custody.</div></div></div>
                    </template>
                    <div class="table-wrap">
                        <el-table :data="ownerTransfers" size="small" style="width:100%">
                            <el-table-column label="Created" min-width="155">
                                <template #default="{row}">
                                    {{ dateTime(row.createdAt) }}
                                </template>
                            </el-table-column><el-table-column prop="fromName" label="From" min-width="120" /><el-table-column prop="toName" label="To" min-width="120" /><el-table-column label="Amount" min-width="110">
                                <template #default="{row}">
                                    {{ cash(row.amount) }}
                                </template>
                            </el-table-column><el-table-column prop="status" label="Status" min-width="100" /><el-table-column label="Actions" min-width="175">
                                <template #default="{row}">
                                    <el-button v-if="row.status==='Pending' && Number(row.toUserId)===Number(data.viewerId)" link type="success" :disabled="busy" @click="acceptTransfer(row)"><el-icon><CircleCheck /></el-icon><span>Confirm received</span></el-button>
                                    <el-button v-if="row.status==='Pending' && Number(row.createdBy)===Number(data.viewerId)" link type="danger" :disabled="busy" @click="cancelTransfer(row)"><el-icon><X /></el-icon><span>Cancel</span></el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </el-card>
            </el-tab-pane>
            <el-tab-pane label="Business Bank" name="bank">
                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header"><div><strong>Business Bank Movements</strong><div class="small-text">Move cash between Owner custody and the business bank.</div></div></div>
                    </template>
                    <el-form label-position="top" class="form-grid" @submit.prevent="submitBank">
                        <el-form-item label="Action"><el-select v-model="bank.action" style="width:100%"><el-option label="Deposit Owner cash to bank" value="deposit" /><el-option label="Withdraw bank cash into Owner custody" value="withdraw" /></el-select></el-form-item>
                        <el-form-item :label="`Amount · Available ${cash(bank.action==='deposit'?ownerAvailable:bankBalance)}`">
                            <el-input v-model="bank.amount" inputmode="decimal" placeholder="0.00">
                                <template #prefix>
                                    $
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item class="form-wide" label="Bank reference / notes"><el-input v-model="bank.notes" maxlength="500" /></el-form-item>
                        <div class="form-wide"><el-button type="primary" native-type="submit" :loading="busy"><el-icon><Box /></el-icon><span>Record bank movement</span></el-button></div>
                    </el-form>
                </el-card>
            </el-tab-pane>
            <el-tab-pane label="Owner Distribution" name="distribution">
                <el-card shadow="never" class="tab-content">
                    <template #header>
                        <div class="section-heading report-card-header"><div><strong>Cash Leaving the Business</strong><div class="small-text">A personal Owner distribution is not a business operating expense. It reduces business funds and is recorded in the ledger.</div></div></div>
                    </template>
                    <el-form label-position="top" class="form-grid" @submit.prevent="submitDistribution">
                        <el-form-item label="Source"><el-select v-model="distribution.source" style="width:100%"><el-option label="Owner cash in hand" value="OWNER" /><el-option label="Business bank" value="BANK" /></el-select></el-form-item>
                        <el-form-item :label="`Amount · Available ${cash(distribution.source==='OWNER'?ownerAvailable:bankBalance)}`">
                            <el-input v-model="distribution.amount" inputmode="decimal" placeholder="0.00">
                                <template #prefix>
                                    $
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item class="form-wide" label="Reason / notes"><el-input v-model="distribution.notes" maxlength="500" /></el-form-item>
                        <div class="form-wide"><el-button type="danger" native-type="submit" :loading="busy"><el-icon><Wallet /></el-icon><span>Record Owner distribution</span></el-button></div>
                    </el-form>
                </el-card>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>
<script setup>
    import { computed, onMounted, ref, watch } from 'vue'
    import { useRouter } from 'vue-router'
    import { ElMessage, ElMessageBox } from 'element-plus'
    import { useUserStore } from '@/store/modules/user'
    import { getLocationCash, addInitialCapital, cancelInitialCapital, sendCustodyTransfer, acceptCustodyTransfer, cancelCustodyTransfer, depositBusinessBank, withdrawBusinessBank, distributeOwnerCash } from '@/api/employeeFinance'
    const store = useUserStore(), router = useRouter(), locationId = computed(() => store.locationId)
    const isOwner = computed(() => ['owner', 'system admin'].includes(String(store.roleName || '').trim().toLowerCase()))
    const data = ref({ viewerId: null, accounts: [], people: [], capital: [], transfers: [], entries: [] }), tab = ref('overview'), loading = ref(false), busy = ref(false)
    const capital = ref({ touserid: null, amount: '', notes: '' }), transfer = ref({ touserid: null, amount: '', notes: '' }), bank = ref({ action: 'deposit', amount: '', notes: '' }), distribution = ref({ source: 'OWNER', amount: '', notes: '' })
    const admins = computed(() => (data.value.people || []).filter(p => ['admin', 'system admin'].includes(p.role)))
    const myOwner = computed(() => (data.value.accounts || []).find(a => a.kind === 'OWNER' && Number(a.userId) === Number(data.value.viewerId)))
    const ownerBalance = computed(() => Number(myOwner.value?.balance || 0)), ownerAvailable = computed(() => Math.max(0, ownerBalance.value - Number(myOwner.value?.reserved || 0)))
    const kindTotal = kind => (data.value.accounts || []).filter(a => a.kind === kind).reduce((sum, a) => sum + Number(a.balance || 0), 0)
    const bankBalance = computed(() => kindTotal('BANK'))
    const ownerTransfers = computed(() => (data.value.transfers || []).filter(t => Number(t.toUserId) === Number(data.value.viewerId) || Number(t.fromUserId) === Number(data.value.viewerId)))
    const ownerEntries = computed(() => (data.value.entries || []).filter(e => e.account === 'BANK' || (e.account === 'OWNER' && e.holder === myOwner.value?.name)))
    const cash = v => Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    const dateTime = v => v ? new Date(v).toLocaleString() : '—'
    const errorText = e => e?.response?.data?.message || e?.message || 'Request failed.'
    const validAmount = v => /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(String(v ?? '').trim()) && Number(v) > 0
    let requestId = 0
    async function load() { if (!isOwner.value || !locationId.value) return; const id = ++requestId; loading.value = true; try { const d = (await getLocationCash(locationId.value)).data; if (id === requestId) data.value = d || data.value } catch (e) { if (id === requestId) ElMessage.error(errorText(e)) } finally { if (id === requestId) loading.value = false } }
    async function execute(fn, success) { if (busy.value) return; busy.value = true; try { await fn(); ElMessage.success(success); await load(); return true } catch (e) { ElMessage.error(errorText(e)); return false } finally { busy.value = false } }
    async function submitCapital() { if (!capital.value.touserid || !validAmount(capital.value.amount)) return ElMessage.warning('Select Admin and enter a valid amount.'); if (await execute(() => addInitialCapital({ locationid: locationId.value, ...capital.value }), 'Capital sent for Admin confirmation.')) capital.value = { touserid: null, amount: '', notes: '' } }
    async function submitTransfer() { if (!transfer.value.touserid || !validAmount(transfer.value.amount)) return ElMessage.warning('Select Admin and enter a valid amount.'); if (Number(transfer.value.amount) > ownerAvailable.value) return ElMessage.warning('Amount exceeds your available cash.'); if (await execute(() => sendCustodyTransfer({ locationid: locationId.value, fromkind: 'OWNER', tokind: 'ADMIN', ...transfer.value }), 'Transfer sent for Admin confirmation.')) transfer.value = { touserid: null, amount: '', notes: '' } }
    async function submitBank() { if (!validAmount(bank.value.amount)) return ElMessage.warning('Enter a valid amount.'); if (Number(bank.value.amount) > (bank.value.action === 'deposit' ? ownerAvailable.value : bankBalance.value)) return ElMessage.warning('Insufficient available funds.'); if (await execute(() => (bank.value.action === 'deposit' ? depositBusinessBank : withdrawBusinessBank)({ locationid: locationId.value, ...bank.value }), 'Bank movement recorded.')) bank.value = { action: bank.value.action, amount: '', notes: '' } }
    async function submitDistribution() { if (!validAmount(distribution.value.amount)) return ElMessage.warning('Enter a valid amount.'); if (Number(distribution.value.amount) > (distribution.value.source === 'OWNER' ? ownerAvailable.value : bankBalance.value)) return ElMessage.warning('Insufficient available funds.'); try { await ElMessageBox.confirm('This money will leave the business. Continue?', 'Confirm Owner distribution', { type: 'warning' }) } catch { return } if (await execute(() => distributeOwnerCash({ locationid: locationId.value, ...distribution.value }), 'Owner distribution recorded.')) distribution.value = { source: distribution.value.source, amount: '', notes: '' } }
    async function acceptTransfer(row) { try { await ElMessageBox.confirm(`Confirm you physically received ${cash(row.amount)}?`, 'Confirm receipt', { type: 'warning' }) } catch { return } await execute(() => acceptCustodyTransfer(row.id, { locationid: locationId.value }), 'Cash received into Owner custody.') }
    async function cancelTransfer(row) { await execute(() => cancelCustodyTransfer(row.id, { locationid: locationId.value }), 'Pending transfer cancelled.') }
    async function cancelCapital(row) { await execute(() => cancelInitialCapital(row.id, { locationid: locationId.value }), 'Pending capital cancelled.') }
    watch(locationId, () => { data.value = { viewerId: null, accounts: [], people: [], capital: [], transfers: [], entries: [] }; load() }); onMounted(load)
</script>


<style scoped>
    :deep(.el-button > span), :deep(.el-button .el-icon) {
        color: inherit !important;
    }
</style>
