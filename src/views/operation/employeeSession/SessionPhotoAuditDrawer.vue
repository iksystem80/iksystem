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
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft, ArrowRight, Check, CircleCheckFilled, Close, CloseBold, Picture } from '@element-plus/icons-vue';
import { getEmployeeSessionPointsReport, updateCustomerMatchReview } from '@/api/employeesession';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  sessionId: { type: [Number, String], default: null },
  locationId: { type: [Number, String], default: null }
});
const emit = defineEmits(['update:modelValue', 'review-saved']);
const loading = ref(false);
const report = ref(null);
const selectedId = ref(null);
const reviewSaving = ref('');
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);
let requestSerial = 0;

const entries = computed(() => report.value?.entries || []);
const selectedIndex = computed(() => entries.value.findIndex(e => e.id === selectedId.value));
const selectedEntry = computed(() => entries.value[selectedIndex.value] || null);
const reviewedCount = computed(() => entries.value.filter(e => e.reviewStatus === 'Approved' || e.reviewStatus === 'Rejected').length);
const drawerSize = computed(() => viewportWidth.value <= 700 ? '100%' : viewportWidth.value <= 1100 ? '88%' : '72%');

function number(value) { return Number(value || 0).toLocaleString(); }
function formatTime(value) { return value ? new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'; }
function formatDateTime(value) { return value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'; }
function machineLabel(entry) { return entry?.machineNumber != null ? `Machine #${entry.machineNumber}` : entry?.machineId ? `Machine ID #${entry.machineId}` : '—'; }
function reviewTagType(status) { return status === 'Approved' ? 'success' : status === 'Rejected' ? 'danger' : 'warning'; }
function moveReview(direction) { if (entries.value[selectedIndex.value + direction]) selectedId.value = entries.value[selectedIndex.value + direction].id; }

async function loadReport() {
  if (!props.modelValue || !props.sessionId || !props.locationId) return;
  const serial = ++requestSerial;
  loading.value = true;
  try {
    const response = await getEmployeeSessionPointsReport(Number(props.sessionId), props.locationId);
    if (serial !== requestSerial) return;
    report.value = response?.data || null;
    const list = entries.value;
    if (!list.some(e => e.id === selectedId.value)) {
      const firstPending = list.find(e => e.imageUrl && (!e.reviewStatus || e.reviewStatus === 'Pending'));
      selectedId.value = (firstPending || list.find(e => e.imageUrl) || list[0])?.id ?? null;
    }
  } catch (error) {
    if (serial !== requestSerial) return;
    console.error(error);
    ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to load photo audit.');
    report.value = null;
    selectedId.value = null;
  } finally {
    if (serial === requestSerial) loading.value = false;
  }
}

async function saveReview(status) {
  const entry = selectedEntry.value;
  if (!entry?.id || !entry?.imageUrl || reviewSaving.value) return;
  reviewSaving.value = status;
  try {
    const response = await updateCustomerMatchReview(entry.id, { status, locationid: props.locationId });
    const updated = response?.data;
    if (!updated) throw new Error('Review update failed.');
    Object.assign(entry, {
      reviewStatus: updated.reviewStatus,
      reviewedBy: updated.reviewedBy,
      reviewedAt: updated.reviewedAt,
      reviewedByName: updated.reviewedByName
    });
    ElMessage.success(status === 'Approved' ? 'Photo approved.' : 'Photo rejected.');
    emit('review-saved');
  } catch (error) {
    console.error(error);
    ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to update photo review.');
  } finally { reviewSaving.value = ''; }
}
function handleResize() { viewportWidth.value = window.innerWidth; }
watch(() => [props.modelValue, props.sessionId, props.locationId], ([open]) => {
  if (open) { selectedId.value = null; loadReport(); } else { ++requestSerial; report.value = null; selectedId.value = null; }
}, { immediate: true });
if (typeof window !== 'undefined') window.addEventListener('resize', handleResize);
onBeforeUnmount(() => { ++requestSerial; if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize); });
</script>



