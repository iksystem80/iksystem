<template>
    <div class="custody-page irfan-report-locationcashledger irfan-ui-page">
        <div class="heading"><div><h2>Location Cash & Bank Ledger</h2><p>Track physical cash by custodian and the recorded business bank balance.</p></div><el-button :loading="loading" @click="load">Refresh</el-button></div>
        <el-alert v-if="!allowed" type="error" title="Owner/Admin access required" show-icon :closable="false" />
        <template v-else>
            <el-alert v-if="Number(data.unlinkedProfit?.count)" type="warning" :closable="false" show-icon class="gap" :title="`${data.unlinkedProfit.count} unlinked reading-profit posting(s) still need review`" :description="`Unlinked total ${cash(data.unlinkedProfit.amount)} is not automatically credited to Admin custody. Verify when this cash was collected and reconcile it without creating a duplicate receipt.`" />
            <el-alert v-else-if="data.historicalProfitCutover?.cutoverAt && Number(data.historicalProfitCutover.coveredCount)" type="success" :closable="false" show-icon class="gap" title="Historical cash reconciled" :description="`${data.historicalProfitCutover.coveredCount} historical reading-profit posting(s), totaling ${cash(data.historicalProfitCutover.coveredAmount)}, are covered by the verified Admin cutover snapshot. This is a reconciliation status, not an additional cash credit.`" />
            <div class="position-grid gap">
                <el-card shadow="never"><span>Owner cash custody</span><strong>{{ cash(kindTotal('OWNER')) }}</strong></el-card>
                <el-card shadow="never"><span>Admin cash custody</span><strong>{{ cash(kindTotal('ADMIN')) }}</strong></el-card>
                <el-card shadow="never"><span>Business bank ledger</span><strong>{{ cash(kindTotal('BANK')) }}</strong></el-card>
                <el-card shadow="never"><span>Employee cash + pending handovers</span><strong>{{ cash(employeeCash+Number(data.pendingEmployeeHandovers||0)) }}</strong></el-card>
                <el-card shadow="never"><span>Owner Capital Contributed · All Time</span><strong>{{ cash(data.lifetime?.ownerCapitalContributed) }}</strong></el-card>
                <el-card shadow="never"><span>Owner Distributions · All Time</span><strong>{{ cash(data.lifetime?.ownerDistributions) }}</strong></el-card>
                <el-card shadow="never" class="total"><span>Total tracked business funds</span><strong>{{ cash(kindTotal('OWNER')+kindTotal('ADMIN')+kindTotal('BANK')+employeeCash+Number(data.pendingEmployeeHandovers||0)) }}</strong><small>Excludes pending transfers and historical balances not reconciled into custody.</small></el-card>
            </div>
            <el-card shadow="never" class="gap">
                <template #header>
                    <strong>Balances by Custodian</strong>
                </template>
                <el-table :data="data.accounts" size="small" style="width:100%"><el-table-column prop="kind" label="Ledger" min-width="110" /><el-table-column prop="name" label="Custodian" min-width="150" /><el-table-column label="Balance" min-width="120">
                <template #default="{row}">
                    {{ cash(row.balance) }}
                </template></el-table-column><el-table-column label="Reserved" min-width="110">
                <template #default="{row}">
                    {{cash(row.reserved)}}
                </template></el-table-column><el-table-column label="Available" min-width="120">
                <template #default="{row}">
                    {{cash(Number(row.balance)-Number(row.reserved))}}
                </template></el-table-column></el-table>
            </el-card>
            <el-tabs type="border-card" class="gap">
                <el-tab-pane v-if="isOwner" label="Owner Initial Capital">
                    <p class="hint">External Owner capital enters the business directly into Admin custody. It is NOT machine revenue.</p>
                    <el-form label-position="top" class="form" @submit.prevent="submit('capital')"><el-form-item label="Receiving Admin"><el-select v-model="capital.touserid" filterable><el-option v-for="u in admins" :key="u.id" :label="u.name" :value="u.id" /></el-select></el-form-item><el-form-item label="Amount"><el-input v-model="capital.amount" inputmode="decimal" /></el-form-item><el-form-item label="Notes"><el-input v-model="capital.notes" /></el-form-item><el-button type="primary" native-type="submit" :loading="busy">Send capital for Admin confirmation</el-button></el-form>

                </el-tab-pane>
                <el-tab-pane label="Owner / Admin Transfer">
                    <p class="hint">Sender reserves cash; only the named receiver can accept and post both ledger entries.</p>
                    <el-form label-position="top" class="form" @submit.prevent="submit('transfer')"><el-form-item label="From"><el-select v-model="transfer.fromkind"><el-option v-if="isOwner" label="Owner custody" value="OWNER" /><el-option v-if="isAdminRole" label="My Admin custody" value="ADMIN" /></el-select></el-form-item><el-form-item label="Receiving person"><el-select v-model="transfer.touserid" filterable><el-option v-for="u in transferRecipients" :key="u.id" :label="u.name" :value="u.id" /></el-select></el-form-item><el-form-item label="Amount"><el-input v-model="transfer.amount" inputmode="decimal" /></el-form-item><el-form-item label="Notes"><el-input v-model="transfer.notes" /></el-form-item><el-button type="primary" native-type="submit" :loading="busy">Send for confirmation</el-button></el-form>
                </el-tab-pane>
                <el-tab-pane v-if="isOwner" label="Business Bank"><el-form label-position="top" class="form" @submit.prevent="submit('bank')"><el-form-item label="Action"><el-select v-model="bank.action"><el-option label="Owner cash → business bank deposit" value="deposit" /><el-option label="Business bank → Owner cash" value="withdraw" /></el-select></el-form-item><el-form-item label="Amount"><el-input v-model="bank.amount" inputmode="decimal" /></el-form-item><el-form-item label="Reference / notes"><el-input v-model="bank.notes" placeholder="Bank transaction reference" /></el-form-item><el-button type="primary" native-type="submit" :loading="busy">Record bank movement</el-button></el-form><p class="hint">This is an internal ledger. Reconcile against actual bank statements.</p></el-tab-pane>
                <el-tab-pane label="Business Expense">
                    <p class="hint">Record expenses paid directly from Owner/Admin cash or the business bank. Employee expenses remain on the employee finance page. This expense reduces both available funds and tracked operating result.</p>
                    <el-form label-position="top" class="form" @submit.prevent="submit('expense')">
                        <el-form-item label="Pay from"><el-select v-model="expense.source"><el-option v-if="isOwner" label="My Owner cash" value="OWNER" /><el-option v-if="isAdminRole" label="My Admin cash" value="ADMIN" /><el-option v-if="isOwner" label="Business bank" value="BANK" /></el-select></el-form-item>
                        <el-form-item label="Expense type"><el-select v-model="expense.expensetypeid" filterable placeholder="Select expense type"><el-option v-for="t in data.expenseTypes||[]" :key="t.id" :label="t.name" :value="t.id" /></el-select></el-form-item>
                        <el-form-item label="Amount"><el-input v-model="expense.amount" inputmode="decimal" /></el-form-item>
                        <el-form-item label="Reason / reference"><el-input v-model="expense.notes" /></el-form-item>
                        <el-button type="primary" native-type="submit" :loading="busy">Record business expense</el-button>
                    </el-form>
                </el-tab-pane>
                <el-tab-pane v-if="isOwner" label="Owner Distribution"><p class="hint">Cash leaves the business, unlike an internal bank deposit. This does not automatically count as an operating expense.</p><el-form label-position="top" class="form" @submit.prevent="submit('distribution')"><el-form-item label="Take from"><el-select v-model="distribution.source"><el-option label="Owner cash" value="OWNER" /><el-option label="Business bank" value="BANK" /></el-select></el-form-item><el-form-item label="Amount"><el-input v-model="distribution.amount" inputmode="decimal" /></el-form-item><el-form-item label="Purpose"><el-input v-model="distribution.notes" /></el-form-item><el-button type="primary" native-type="submit" :loading="busy">Record owner distribution</el-button></el-form></el-tab-pane>
                <el-tab-pane v-if="isOwner" label="Historical Cutover"><el-alert type="warning" :closable="false" title="Use only for verified existing cash that predates this ledger. Do not enter machine profit again if it is already physically included." /><el-form label-position="top" class="form gap" @submit.prevent="submit('cutover')"><el-form-item label="Account"><el-select v-model="cutover.kind"><el-option label="Owner" value="OWNER" /><el-option label="Admin" value="ADMIN" /><el-option label="Bank" value="BANK" /></el-select></el-form-item><el-form-item v-if="cutover.kind!=='BANK'" label="Custodian"><el-select v-model="cutover.userid" filterable><el-option v-for="u in cutoverRecipients" :key="u.id" :label="u.name" :value="u.id" /></el-select></el-form-item><el-form-item label="Verified physical balance"><el-input v-model="cutover.amount" inputmode="decimal" /></el-form-item><el-form-item label="Reconciliation reference"><el-input v-model="cutover.notes" /></el-form-item><el-button type="primary" native-type="submit" :loading="busy">Record one-time opening</el-button></el-form></el-tab-pane>
            </el-tabs>
            <el-card shadow="never" class="gap">
            <template #header>
                <strong>Initial Capital History & Receipts</strong>
            </template><div class="scroll"><el-table :data="data.capital||[]" size="small"><el-table-column label="Date" min-width="160">
            <template #default="{row}">
                {{dt(row.createdAt)}}
            </template></el-table-column><el-table-column prop="toName" label="Admin" min-width="120" /><el-table-column label="Amount" min-width="110">
            <template #default="{row}">
                {{cash(row.amount)}}
            </template></el-table-column><el-table-column prop="status" label="Status" min-width="95" /><el-table-column label="Confirmed / cancelled" min-width="160">
            <template #default="{row}">
                {{dt(row.acceptedAt||row.cancelledAt)}}
            </template></el-table-column><el-table-column label="Action" min-width="150">
            <template #default="{row}">
                <el-button v-if="row.status==='Pending' && Number(row.toUserId)===Number(userId)" link type="success" @click="changeCapital(row,'accept')">Confirm received</el-button>
                <el-button v-if="row.status==='Pending' && Number(row.createdBy)===Number(userId)" link type="danger" @click="changeCapital(row,'cancel')">Cancel</el-button>
            </template></el-table-column></el-table></div></el-card>
            <el-card shadow="never" class="gap">
            <template #header>
                <strong>Custody Transfer History</strong>
            </template><el-table :data="data.transfers" size="small" style="width:100%"><el-table-column label="Date" min-width="160">
            <template #default="{row}">
                {{ dt(row.createdAt) }}
            </template></el-table-column><el-table-column prop="fromName" label="From" min-width="140" /><el-table-column prop="toName" label="To" min-width="140" /><el-table-column label="Amount" min-width="110">
            <template #default="{row}">
                {{ cash(row.amount) }}
            </template></el-table-column><el-table-column prop="status" label="Status" min-width="100" /><el-table-column label="Confirmed / cancelled" min-width="160">
            <template #default="{row}">
                {{dt(row.acceptedAt||row.cancelledAt)}}
            </template></el-table-column><el-table-column label="Action" min-width="140">
            <template #default="{row}">
                <el-button v-if="row.status==='Pending' && Number(row.toUserId)===Number(userId)" link type="success" @click="changeTransfer(row,'accept')">Confirm received</el-button>
                <el-button v-if="row.status==='Pending' && Number(row.createdBy)===Number(userId)" link type="danger" @click="changeTransfer(row,'cancel')">Cancel</el-button>
            </template></el-table-column></el-table></el-card>
            <el-card shadow="never" class="gap">
            <template #header>
                <strong>Custody & Bank Ledger (latest 200 entries)</strong>
            </template><div class="scroll"><el-table :data="data.entries" size="small" style="width:100%"><el-table-column label="Date" min-width="160">
            <template #default="{row}">
                {{ dt(row.createdAt) }}
            </template></el-table-column><el-table-column prop="holder" label="Custodian" min-width="140" /><el-table-column prop="account" label="Account" min-width="100" /><el-table-column prop="kind" label="Event" min-width="160" /><el-table-column label="Change" min-width="115">
            <template #default="{row}">
                <strong :class="Number(row.amount)>=0?'plus':'minus'">{{ Number(row.amount)>0?'+':'' }}{{ cash(row.amount) }}</strong>
            </template></el-table-column><el-table-column prop="notes" label="Notes" min-width="240" /></el-table></div></el-card>
        </template>
    </div>
</template>
<script setup>
import {ref,computed,onMounted,watch} from 'vue'
import {ElMessage,ElMessageBox} from 'element-plus'
import {useUserStore} from '@/store/modules/user'
import {getAdminFinanceOverview,getLocationCash,addInitialCapital,acceptInitialCapital,cancelInitialCapital,setCustodyOpening,sendCustodyTransfer,acceptCustodyTransfer,cancelCustodyTransfer,depositBusinessBank,withdrawBusinessBank,distributeOwnerCash,addCustodyExpense} from '@/api/employeeFinance'
const store=useUserStore(),locationId=computed(()=>store.locationId),userId=computed(()=>data.value.viewerId)
const role=computed(()=>String(store.roleName||'').toLowerCase()),allowed=computed(()=>['owner','admin','system admin'].includes(role.value)),isOwner=computed(()=>['owner','system admin'].includes(role.value)),isAdminRole=computed(()=>['admin','system admin'].includes(role.value))
const data=ref({accounts:[],people:[],capital:[],transfers:[],entries:[],expenseTypes:[],unlinkedProfit:{},pendingEmployeeHandovers:0}),employeeCash=ref(0),loading=ref(false),busy=ref(false)
const admins=computed(()=>(data.value.people||[]).filter(p=>['admin','system admin'].includes(p.role)))
const owners=computed(()=>(data.value.people||[]).filter(p=>['owner','system admin'].includes(p.role)))
const transferRecipients=computed(()=>transfer.value.fromkind==='OWNER'?admins.value:owners.value)
const cutoverRecipients=computed(()=>cutover.value.kind==='OWNER'?owners.value:admins.value)
const capital=ref({touserid:null,amount:'',notes:''}),transfer=ref({fromkind:'OWNER',touserid:null,amount:'',notes:''}),bank=ref({action:'deposit',amount:'',notes:''}),distribution=ref({source:'OWNER',amount:'',notes:''}),expense=ref({source:'OWNER',expensetypeid:null,amount:'',notes:''}),cutover=ref({kind:'ADMIN',userid:null,amount:'',notes:''})
const cash=v=>Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD'}),dt=v=>v?new Date(v).toLocaleString():'—'
const kindTotal=k=>data.value.accounts.filter(a=>a.kind===k).reduce((s,a)=>s+Number(a.balance||0),0)
const err=e=>e?.response?.data?.message||e?.message||'Request failed.'
async function load(){if(!locationId.value||!allowed.value)return;loading.value=true;try{const [a,b]=await Promise.all([getLocationCash(locationId.value),getAdminFinanceOverview(locationId.value)]);data.value=a.data||data.value;employeeCash.value=(b.data?.cashHolders||[]).reduce((s,x)=>s+Number(x.currentCash||0),0)}catch(e){ElMessage.error(err(e))}finally{loading.value=false}}
async function execute(fn,success){busy.value=true;try{await fn();ElMessage.success(success);await load()}catch(e){ElMessage.error(err(e))}finally{busy.value=false}}
async function submit(action){const locationid=locationId.value; if(action==='capital')return execute(()=>addInitialCapital({locationid,...capital.value}),'Owner capital sent for Admin confirmation.');if(action==='transfer')return execute(()=>sendCustodyTransfer({locationid,...transfer.value,tokind:transfer.value.fromkind==='OWNER'?'ADMIN':'OWNER'}),'Transfer waiting for receipt.');if(action==='bank')return execute(()=>(bank.value.action==='deposit'?depositBusinessBank:withdrawBusinessBank)({locationid,...bank.value}),'Bank ledger updated.');if(action==='expense')return execute(()=>addCustodyExpense({locationid,...expense.value}),'Business expense recorded.');if(action==='distribution'){try{await ElMessageBox.confirm('This cash will leave the business. Continue?','Confirm Owner distribution',{type:'warning'})}catch{return}return execute(()=>distributeOwnerCash({locationid,...distribution.value}),'Owner distribution recorded.')}if(action==='cutover'){try{await ElMessageBox.confirm('I verified this physical balance and have not counted it elsewhere. Continue?','Historical cash cutover',{type:'warning'})}catch{return}return execute(()=>setCustodyOpening({locationid,...cutover.value,confirm:'RECONCILED'}),'Historical balance carried forward.')}}
async function changeCapital(row,action){if(action==='accept'){try{await ElMessageBox.confirm(`Confirm physically receiving ${cash(row.amount)} in your Admin custody?`,'Confirm Owner capital',{type:'warning'})}catch{return}}await execute(()=>action==='accept'?acceptInitialCapital(row.id,{locationid:locationId.value}):cancelInitialCapital(row.id,{locationid:locationId.value}),action==='accept'?'Owner capital received.':'Pending capital cancelled.')}
async function changeTransfer(row,action){if(action==='accept'){try{await ElMessageBox.confirm(`Confirm physical receipt of ${cash(row.amount)}?`,'Confirm cash received',{type:'warning'})}catch{return}}await execute(()=>action==='accept'?acceptCustodyTransfer(row.id,{locationid:locationId.value}):cancelCustodyTransfer(row.id,{locationid:locationId.value}),action==='accept'?'Cash accepted.':'Transfer cancelled.')}
watch(locationId,load);watch(role,value=>{if(value==='admin'){transfer.value.fromkind='ADMIN';expense.value.source='ADMIN'}});onMounted(()=>{if(role.value==='admin'){transfer.value.fromkind='ADMIN';expense.value.source='ADMIN'}load()})
</script>

