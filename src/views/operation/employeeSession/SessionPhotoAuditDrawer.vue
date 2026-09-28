<template>
  <el-drawer :model-value="modelValue" :size="drawerSize" :with-header="false" destroy-on-close class="review-drawer" @update:model-value="emit('update:modelValue', $event)" >
    <div class="audit-shell" v-loading="loading">
      <div class="audit-header">
        <div>
          <span class="audit-kicker">POINTS AUDIT · SESSION #{{ sessionId }}</span>
          <strong>{{ selectedIndex >= 0 ? selectedIndex + 1 : 0 }} of {{ entries.length }}</strong>
        </div>
        <div class="audit-header-actions">
          <span>{{ reviewedCount }}/{{ entries.length }} reviewed</span>
          <el-button text circle @click="emit('update:modelValue', false)"><el-icon><Close /></el-icon></el-button>
        </div>
      </div>
      <el-empty v-if="!loading && !entries.length" description="No point entries in this session" />
      <div v-else-if="selectedEntry" class="audit-content">
        <div class="audit-photo-pane">
          <div v-if="selectedEntry.imageUrl" class="audit-photo-frame">
            <span class="photo-sequence">#{{ selectedIndex + 1 }}</span>
            <el-image class="audit-image" :src="selectedEntry.imageUrl" :preview-src-list="[selectedEntry.imageUrl]" fit="contain" preview-teleported />
          </div>
          <div v-else class="audit-photo-missing">
            <el-icon><Picture /></el-icon>
            <strong>No photo attached</strong>
            <span>This entry cannot be approved or rejected until photo evidence exists.</span>
          </div>
        </div>
        <div class="audit-detail-pane">
          <div class="audit-customer">
            <span>CUSTOMER</span>
            <h2>{{ selectedEntry.customerName }}</h2>
            <el-tag :type="reviewTagType(selectedEntry.reviewStatus)" effect="light" class="review-status-tag">
                    {{ selectedEntry.reviewStatus || 'Pending' }}
            </el-tag>
          </div>
          <div class="points-box"><span>POINTS</span><strong>{{ number(selectedEntry.points) }}</strong></div>
          <div class="audit-meta-grid">
            <div><span>MACHINE</span><strong>{{ machineLabel(selectedEntry) }}</strong></div>
            <div><span>TIME</span><strong>{{ formatTime(selectedEntry.dateAssign) }}</strong></div>
          </div>
          <div v-if="selectedEntry.reviewedAt" class="reviewed-meta">
            <el-icon><CircleCheckFilled /></el-icon>
            <div>
              <strong>Reviewed by {{ selectedEntry.reviewedByName || `User #${selectedEntry.reviewedBy}` }}</strong>
              <span>{{ formatDateTime(selectedEntry.reviewedAt) }}</span>
            </div>
          </div>
          <div class="audit-actions">
            <el-button size="large" type="danger" plain :loading="reviewSaving === 'Rejected'" :disabled="!selectedEntry.imageUrl || !!reviewSaving" @click="saveReview('Rejected')">
              <el-icon><CloseBold /></el-icon>Reject
            </el-button>
            <el-button size="large" type="success" :loading="reviewSaving === 'Approved'" :disabled="!selectedEntry.imageUrl || !!reviewSaving" @click="saveReview('Approved')">
              Approve<el-icon><Check /></el-icon>
            </el-button>
          </div>
          <div class="audit-navigation">
            <el-button :disabled="selectedIndex <= 0" @click="moveReview(-1)">
              <el-icon><ArrowLeft /></el-icon>Previous
            </el-button>
            <el-button :disabled="selectedIndex >= entries.length - 1" @click="moveReview(1)">
              Next<el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Check, CircleCheckFilled, Close, CloseBold, Picture } from '@element-plus/icons-vue'
import { getEmployeeSessionPointsReport, updateCustomerMatchReview } from '@/api/employeeSession'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  sessionId: { type: [Number, String], default: null },
  locationId: { type: [Number, String], default: null }
})
const emit = defineEmits(['update:modelValue', 'review-saved'])
const loading = ref(false)
const report = ref(null)
const selectedId = ref(null)
const reviewSaving = ref('')
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
let requestSerial = 0

const entries = computed(() => report.value?.entries || [])
const selectedIndex = computed(() => entries.value.findIndex(e => e.id === selectedId.value))
const selectedEntry = computed(() => entries.value[selectedIndex.value] || null)
const reviewedCount = computed(() => entries.value.filter(e => e.reviewStatus === 'Approved' || e.reviewStatus === 'Rejected').length)
const drawerSize = computed(() => viewportWidth.value <= 700 ? '100%' : viewportWidth.value <= 1100 ? '88%' : '72%')

function number(value) { return Number(value || 0).toLocaleString() }
function formatTime(value) { return value ? new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—' }
function formatDateTime(value) { return value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—' }
function machineLabel(entry) { return entry?.machineNumber != null ? `Machine #${entry.machineNumber}` : entry?.machineId ? `Machine ID #${entry.machineId}` : '—' }
function reviewTagType(status) { return status === 'Approved' ? 'success' : status === 'Rejected' ? 'danger' : 'warning' }
function moveReview(direction) { if (entries.value[selectedIndex.value + direction]) selectedId.value = entries.value[selectedIndex.value + direction].id }

async function loadReport() {
  if (!props.modelValue || !props.sessionId || !props.locationId) return
  const serial = ++requestSerial
  loading.value = true
  try {
    const response = await getEmployeeSessionPointsReport(Number(props.sessionId), props.locationId)
    if (serial !== requestSerial) return
    report.value = response?.data || null
    const list = entries.value
    if (!list.some(e => e.id === selectedId.value)) {
      const firstPending = list.find(e => e.imageUrl && (!e.reviewStatus || e.reviewStatus === 'Pending'))
      selectedId.value = (firstPending || list.find(e => e.imageUrl) || list[0])?.id ?? null
    }
  } catch (error) {
    if (serial !== requestSerial) return
    console.error(error)
    ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to load photo audit.')
    report.value = null
    selectedId.value = null
  } finally {
    if (serial === requestSerial) loading.value = false
  }
}

async function saveReview(status) {
  const entry = selectedEntry.value
  if (!entry?.id || !entry?.imageUrl || reviewSaving.value) return
  reviewSaving.value = status
  try {
    const response = await updateCustomerMatchReview(entry.id, { status, locationid: props.locationId })
    const updated = response?.data
    if (!updated) throw new Error('Review update failed.')
    Object.assign(entry, {
      reviewStatus: updated.reviewStatus,
      reviewedBy: updated.reviewedBy,
      reviewedAt: updated.reviewedAt,
      reviewedByName: updated.reviewedByName
    })
    ElMessage.success(status === 'Approved' ? 'Photo approved.' : 'Photo rejected.')
    emit('review-saved')
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to update photo review.')
  } finally { reviewSaving.value = '' }
}
function handleResize() { viewportWidth.value = window.innerWidth }
watch(() => [props.modelValue, props.sessionId, props.locationId], ([open]) => {
  if (open) { selectedId.value = null; loadReport() }
  else { ++requestSerial; report.value = null; selectedId.value = null }
}, { immediate: true })
if (typeof window !== 'undefined') window.addEventListener('resize', handleResize)
onBeforeUnmount(() => { ++requestSerial; if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize) })
</script>

<style scoped>
.audit-shell { min-height: 100%; display: flex; flex-direction: column; }
.audit-header { min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--el-border-color-lighter); }
.audit-kicker, .audit-header strong { display: block; }
.audit-kicker { color: var(--el-text-color-secondary); font-size: 10px; font-weight: 700; letter-spacing: .6px; }
.audit-header strong { margin-top: 2px; font-size: 13px; }
.audit-header-actions { display: flex; align-items: center; gap: 8px; color: var(--el-text-color-secondary); font-size: 11px; }
.audit-content { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(330px, .9fr); }
.audit-photo-pane { min-height: 560px; padding: 18px; background: #111827; }
.audit-photo-frame { position: relative; width: 100%; height: 100%; min-height: 520px; overflow: hidden; border-radius: 12px; background: #0f172a; }
.photo-sequence { position: absolute; top: 14px; left: 14px; z-index: 2; min-width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; padding: 0 10px; color: #fff; background: rgba(0,0,0,.55); border-radius: 18px; font-size: 12px; font-weight: 700; }
.audit-image { width: 100%; height: 100%; min-height: 520px; cursor: zoom-in; }
.audit-photo-missing { min-height: 520px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 20px; color: #cbd5e1; text-align: center; }
.audit-photo-missing .el-icon { font-size: 42px; }
.audit-photo-missing span { max-width: 320px; color: #94a3b8; font-size: 12px; line-height: 1.5; }
.audit-detail-pane { padding: 28px 24px; background: var(--el-bg-color); }
.audit-customer > span, .points-box span, .audit-meta-grid span { display: block; color: var(--el-text-color-secondary); font-size: 10px; font-weight: 700; letter-spacing: .5px; }
.audit-customer h2 { margin: 6px 0 10px; font-size: 24px; }
.points-box { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 20px; padding: 18px; border: 1px solid var(--el-border-color-lighter); border-radius: 12px; }
.points-box strong { color: var(--el-color-primary); font-size: 24px; }
.audit-meta-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; margin-top: 12px; }
.audit-meta-grid > div { padding: 14px; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; }
.audit-meta-grid strong { display: block; margin-top: 5px; font-size: 16px; }
.reviewed-meta { display: flex; align-items: center; gap: 10px; margin-top: 14px; padding: 12px; color: var(--el-color-success); background: var(--el-color-success-light-9); border-radius: 10px; }
.reviewed-meta strong, .reviewed-meta span { display: block; }
.reviewed-meta span { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 11px; }
.audit-actions { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; margin-top: 20px; }
.audit-actions .el-button { width: 100%; margin-left: 0; }
.audit-navigation { display: flex; justify-content: space-between; gap: 10px; margin-top: 12px; }
    .review-status-tag {
        align-content: center;
    }
    @media (max-width: 980px) {
        .audit-content {
            grid-template-columns: 1fr;
        }

        .audit-photo-pane, .audit-photo-frame, .audit-image, .audit-photo-missing {
            min-height: 420px;
        }
    }
@media (max-width: 700px) { .audit-header { padding: 10px 12px; } .audit-header-actions > span { display: none; } .audit-photo-pane { min-height: 330px; padding: 10px; } .audit-photo-frame, .audit-image, .audit-photo-missing { min-height: 310px; } .audit-detail-pane { padding: 18px 14px; } .audit-actions, .audit-meta-grid { grid-template-columns: 1fr; } }
</style>

