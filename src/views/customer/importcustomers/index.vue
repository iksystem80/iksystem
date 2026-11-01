<template>
  <div class="app-container">
    <div class="import-heading">
      <div class="import-heading-left">
        <el-button circle @click="router.push('/newcustomer/index')"><el-icon><ArrowLeft /></el-icon></el-button>
        <div>
          <h2>Import Customers</h2>
          <p>Upload customer data and matching profile photos.</p>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="import-card">
      <div class="section-heading"><el-icon><UploadFilled /></el-icon><div><strong>Upload Files</strong><small>Use customers.json and a ZIP containing the photos named in that file.</small></div></div>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <label class="upload-label">Customer JSON</label>
          <input type="file" accept=".json,application/json" :disabled="loading" @change="onJsonChange" />
          <p v-if="jsonFile" class="file-label">{{ jsonFile.name }}</p>
        </el-col>
        <el-col :xs="24" :sm="12">
          <label class="upload-label">Customer Photos ZIP</label>
          <input type="file" accept=".zip,application/zip" :disabled="loading" @change="onZipChange" />
          <p v-if="zipFile" class="file-label">{{ zipFile.name }}</p>
        </el-col>
      </el-row>
      <el-alert class="import-note" type="info" :closable="false" show-icon
        title="Customers are imported as Active and Unverified. Existing phone numbers at this location are never overwritten." />
      <div class="import-actions">
        <span>{{ customers.length }} customers detected · {{ matchedCount }} photo filenames matched</span>
        <el-button type="primary" :disabled="!customers.length || !zipFile || !zipReady || loading || allBatchesDone" :loading="loading" @click="runImport">{{ hasStarted ? 'Resume Import' : 'Import Customers' }}</el-button>
      </div>
      <div v-if="hasStarted" class="import-progress">
        <div class="import-progress-heading">
          <strong>{{ loading ? `Importing page ${activeBatchPage} of ${totalPages}` : allBatchesDone ? 'All batches processed' : 'Import paused' }}</strong>
          <span>{{ completedBatchCount }} / {{ totalPages }} pages · {{ progressPercentage }}%</span>
        </div>
        <el-progress :percentage="progressPercentage" :stroke-width="8" :show-text="false" />
        <small v-if="importError" class="import-error">{{ importError }}</small>
      </div>
    </el-card>

    <el-card v-if="customers.length" shadow="never" class="import-card">
      <div class="section-heading"><el-icon><User /></el-icon><div><strong>Import Preview</strong><small>Review customer details and photos before importing. Click a photo to enlarge it.</small></div></div>
      <el-table :data="pageCustomers" size="small" style="width:100%" v-loading="previewLoading">
        <el-table-column label="Photo" width="100">
          <template #default="{ row }">
            <el-image v-if="photoUrls[row.photo_file]" :src="photoUrls[row.photo_file]"
              :preview-src-list="[photoUrls[row.photo_file]]" preview-teleported fit="cover" class="preview-photo" />
            <el-tag v-else type="danger" size="small">Missing</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="First Name" prop="first_name" min-width="130" />
        <el-table-column label="Last Name" prop="last_name" min-width="130" />
        <el-table-column label="Phone" prop="phone" min-width="150" />
        <el-table-column label="Photo File" prop="photo_file" min-width="200" show-overflow-tooltip />
      </el-table>
      <div class="preview-pagination">
        <span class="page-total">{{ customers.length }} customers · {{ totalPages }} pages</span>
        <div class="batch-pages" aria-label="Customer import pages">
          <button type="button" class="page-nav" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">‹</button>
          <button v-for="page in totalPages" :key="page" type="button" class="batch-page"
            :class="{ 'is-current': currentPage === page, 'is-done': batchStatus[page - 1] === 'done', 'is-processing': batchStatus[page - 1] === 'processing', 'is-failed': batchStatus[page - 1] === 'failed' }"
            :title="`Page ${page}: ${batchStatus[page - 1] || 'pending'}`"
            @click="goToPage(page)">{{ page }}<span v-if="batchStatus[page - 1] === 'done'">✓</span></button>
          <button type="button" class="page-nav" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">›</button>
        </div>
      </div>
    </el-card>

    <el-card v-if="result" shadow="never" class="import-card">
      <div class="section-heading"><el-icon><CircleCheck /></el-icon><div><strong>Import Results</strong><small>All unsaved customers and their reasons are listed below.</small></div></div>
      <el-row :gutter="16" class="result-stats">
        <el-col :xs="12" :sm="8"><div class="result-stat"><span>Total</span><strong>{{ result.total }}</strong></div></el-col>
        <el-col :xs="12" :sm="8"><div class="result-stat"><span>Saved</span><strong class="saved-count">{{ result.imported }}</strong></div></el-col>
        <el-col :xs="24" :sm="8"><div class="result-stat"><span>Not Saved</span><strong class="failed-count">{{ result.notSaved }}</strong></div></el-col>
      </el-row>
      <div class="result-heading">
        <strong>Customers Not Saved</strong>
        <el-button v-if="result.rejected?.length" @click="downloadRejected">Download CSV</el-button>
      </div>
      <el-table :data="result.rejected || []" empty-text="All customers saved successfully" size="small" style="width:100%">
        <el-table-column label="Row" prop="row" width="75" />
        <el-table-column label="First Name" prop="first_name" min-width="120" />
        <el-table-column label="Last Name" prop="last_name" min-width="120" />
        <el-table-column label="Phone" prop="phone" min-width="125" />
        <el-table-column label="Reason" prop="reason" min-width="245" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import JSZip from 'jszip'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, UploadFilled, User, CircleCheck } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { importCustomers } from '@/api/customer'

const router = useRouter()
const userStore = useUserStore()
const jsonFile = ref(null)
const zipFile = ref(null)
const customers = ref([])
const result = ref(null)
const loading = ref(false)
const previewLoading = ref(false)
const zipReady = ref(false)
const zipEntries = ref(new Map())
const photoUrls = ref({})
const currentPage = ref(1)
const PAGE_SIZE = 50
const MAX_CUSTOMERS = 2000
const batchStatus = ref([])
const activeBatchPage = ref(0)
const importError = ref('')
const totalPages = computed(() => Math.ceil(customers.value.length / PAGE_SIZE))
const pageCustomers = computed(() => customers.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE))
const completedBatchCount = computed(() => batchStatus.value.filter(status => status === 'done').length)
const allBatchesDone = computed(() => totalPages.value > 0 && completedBatchCount.value === totalPages.value)
const hasStarted = computed(() => batchStatus.value.some(status => status !== 'pending'))
const progressPercentage = computed(() => totalPages.value ? Math.round(completedBatchCount.value * 100 / totalPages.value) : 0)
const matchedCount = computed(() => customers.value.filter(c =>
  Boolean(zipEntries.value.get(photoBasename(c?.photo_file)))).length)
let previewSequence = 0

function resetImportProgress() {
  batchStatus.value = Array(totalPages.value).fill('pending')
  activeBatchPage.value = 0
  importError.value = ''
  result.value = null
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  loadPagePhotos()
}

function photoBasename(name) {
  return String(name || '').replace(/\\/g, '/').split('/').pop()
}

function clearPreviews() {
  previewSequence++
  Object.values(photoUrls.value).forEach(url => URL.revokeObjectURL(url))
  photoUrls.value = {}
}

async function loadPagePhotos() {
  clearPreviews()
  const sequence = previewSequence
  previewLoading.value = true
  try {
    for (const customer of pageCustomers.value) {
      if (sequence !== previewSequence) return
      const entry = zipEntries.value.get(photoBasename(customer?.photo_file))
      if (!entry || entry._data?.uncompressedSize > 5 * 1024 * 1024) continue
      try {
        const bytes = await entry.async('uint8array')
        if (sequence !== previewSequence) return
        const ext = photoBasename(customer.photo_file).split('.').pop().toLowerCase()
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
        const blob = new Blob([bytes], { type: mime })
        if (blob.size > 5 * 1024 * 1024) continue
        const url = URL.createObjectURL(blob)
        photoUrls.value = { ...photoUrls.value, [customer.photo_file]: url }
      } catch (_) { /* Photo displays as Missing; backend reports the reason. */ }
    }
  } finally { if (sequence === previewSequence) previewLoading.value = false }
}

onBeforeUnmount(clearPreviews)

async function onJsonChange(event) {
  const file = event.target.files?.[0]
  jsonFile.value = null
  customers.value = []
  result.value = null
  currentPage.value = 1
  clearPreviews()
  if (!file) return
  if (file.size > 5 * 1024 * 1024) return ElMessage.error('JSON file must be 5 MB or smaller.')
  try {
    const parsed = JSON.parse(await file.text())
    if (!Array.isArray(parsed) || !parsed.length || parsed.length > MAX_CUSTOMERS) throw new Error('Provide an array of 1–2,000 customers.')
    jsonFile.value = file
    customers.value = [...parsed].sort((a, b) =>
      String(a?.first_name || a?.firstname || '').localeCompare(String(b?.first_name || b?.firstname || ''), undefined, { sensitivity: 'base' }) ||
      String(a?.last_name || a?.lastname || '').localeCompare(String(b?.last_name || b?.lastname || ''), undefined, { sensitivity: 'base' }))
    resetImportProgress()
    if (zipReady.value) await loadPagePhotos()
  } catch (error) { ElMessage.error(error.message || 'Invalid JSON file.') }
}

async function onZipChange(event) {
  resetImportProgress()
  clearPreviews()
  const file = event.target.files?.[0]
  zipFile.value = null
  zipReady.value = false
  zipEntries.value = new Map()
  if (!file) return
  if (file.size > 500 * 1024 * 1024) return ElMessage.error('Photo ZIP must be 500 MB or smaller.')
  try {
    previewLoading.value = true
    const zip = await JSZip.loadAsync(file)
    const entries = new Map()
    for (const entry of Object.values(zip.files)) {
      if (entry.dir || !/\.(jpe?g|png|webp)$/i.test(entry.name)) continue
      const name = photoBasename(entry.name)
      entries.set(name, entries.has(name) ? null : entry)
    }
    zipEntries.value = entries
    zipFile.value = file
    zipReady.value = true
    await loadPagePhotos()
  } catch (error) {
    ElMessage.error('Cannot read photo ZIP. Please select a valid ZIP file.')
  } finally { previewLoading.value = false }
}

async function runImport() {
  if (loading.value || allBatchesDone.value || !zipReady.value) return
  const firstPending = batchStatus.value.findIndex(status => status !== 'done')
  if (firstPending < 0) return
  try {
    await ElMessageBox.confirm(`Import ${customers.value.length} customers in ${totalPages.value} sequential batches of up to 50? Existing phones at this location will be skipped.`, 'Confirm Customer Import', { type: 'warning' })
  } catch (_) { return }
  loading.value = true
  importError.value = ''
  if (!result.value) result.value = { total: customers.value.length, imported: 0, notSaved: 0, rejected: [] }
  try {
    for (let index = firstPending; index < totalPages.value; index++) {
      if (batchStatus.value[index] === 'done') continue
      activeBatchPage.value = index + 1
      batchStatus.value[index] = 'processing'
      goToPage(index + 1)

      const batch = customers.value.slice(index * PAGE_SIZE, (index + 1) * PAGE_SIZE)
      const batchZip = new JSZip()
      const addedPhotos = new Set()
      for (const customer of batch) {
        const name = photoBasename(customer?.photo_file)
        const entry = zipEntries.value.get(name)
        if (!name || !entry || addedPhotos.has(name)) continue
        addedPhotos.add(name)
        batchZip.file(name, await entry.async('uint8array'))
      }

      const data = new FormData()
      data.append('locationid', String(userStore.locationId))
      data.append('customers', new Blob([JSON.stringify(batch)], { type: 'application/json' }), `customers-page-${index + 1}.json`)
      data.append('photos', await batchZip.generateAsync({ type: 'blob', compression: 'STORE' }), `photos-page-${index + 1}.zip`)
      const response = await importCustomers(data)
      // request utility may return either response.data or the response itself.
      const payload = response?.data?.imported !== undefined ? response.data : response
      if (!payload || payload.success !== true) throw new Error(payload?.message || 'Import failed')
      result.value = {
        total: customers.value.length,
        imported: result.value.imported + Number(payload.imported || 0),
        notSaved: result.value.notSaved + Number(payload.notSaved || 0),
        rejected: [...result.value.rejected, ...(payload.rejected || [])]
      }
      batchStatus.value[index] = 'done'
    }
    if (result.value.notSaved) ElMessage.warning(`Import finished. Saved ${result.value.imported}; not saved ${result.value.notSaved}.`)
    else ElMessage.success(`Successfully imported all ${result.value.imported} customers.`)
  } catch (error) {
    if (activeBatchPage.value) batchStatus.value[activeBatchPage.value - 1] = 'failed'
    importError.value = `Page ${activeBatchPage.value} failed: ${error?.message || 'Import request failed'}. You can resume from this page.`
    ElMessage.error(importError.value)
  } finally { loading.value = false }
}

function downloadRejected() {
  const rows = result.value?.rejected || []
  const columns = ['row', 'first_name', 'last_name', 'phone', 'reason']
  const cell = value => `"${String(value ?? '').replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`
  const csv = [columns.join(','), ...rows.map(row => columns.map(key => cell(row[key])).join(','))].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'customers-not-saved.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.customer-import-page { max-width: 1180px; margin: 0 auto; }
.import-heading { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
.import-heading-left { display:flex; align-items:center; gap:12px; }
.import-heading h2 { font-size:20px; margin:0 0 5px; color:var(--el-text-color-primary); }
.import-heading p, .section-heading small { margin:0; color:var(--el-text-color-secondary); font-size:12px; }
.import-card { border-radius:10px; margin-bottom:18px; }
.section-heading { display:flex; align-items:center; gap:12px; margin-bottom:22px; }
.section-heading > .el-icon { color:var(--el-color-primary); background:var(--el-color-primary-light-9); box-sizing:content-box; padding:11px; border-radius:10px; }
.section-heading strong, .section-heading small { display:block; }
.section-heading strong { margin-bottom:3px; font-size:15px; }
.upload-label { display:block; font-size:11px; font-weight:700; margin-bottom:8px; }
input[type=file] { display:block; max-width:100%; border:1px dashed var(--el-border-color); padding:14px; border-radius:8px; }
.file-label { font-size:12px; color:var(--el-color-success); }
.import-note { margin-top:20px; }
.import-actions { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:20px; font-size:12px; color:var(--el-text-color-secondary); }
.result-stats { margin-bottom:22px; }
.result-stat { padding:15px; background:var(--el-fill-color-light); border-radius:9px; display:flex; justify-content:space-between; align-items:center; }
.result-stat strong { font-size:20px; color:var(--el-text-color-primary); }
.result-stat .saved-count { color:var(--el-color-success); }
.result-stat .failed-count { color:var(--el-color-danger); }
.result-heading { display:flex; justify-content:space-between; align-items:center; margin-bottom:13px; }
.preview-photo { width:56px; height:56px; border-radius:8px; border:1px solid var(--el-border-color-light); cursor:zoom-in; }
.preview-pagination { display:flex; flex-direction:column; align-items:stretch; gap:10px; padding-top:16px; }
.page-total { font-size:11px; color:var(--el-text-color-secondary); text-align:right; }
.batch-pages { display:flex; align-items:center; gap:6px; overflow-x:auto; padding:3px 2px 8px; scrollbar-width:thin; }
.batch-page, .page-nav { flex:0 0 auto; min-width:32px; height:32px; padding:0 8px; border:1px solid var(--el-border-color); border-radius:7px; background:var(--el-bg-color); color:var(--el-text-color-regular); font-size:12px; cursor:pointer; }
.batch-page.is-current { border-color:var(--el-color-primary); box-shadow:0 0 0 1px var(--el-color-primary-light-5); }
.batch-page.is-done { border-color:var(--el-color-success); color:#fff; background:var(--el-color-success); }
.batch-page.is-processing { border-color:var(--el-color-primary); background:var(--el-color-primary-light-9); color:var(--el-color-primary); }
.batch-page.is-failed { border-color:var(--el-color-danger); background:var(--el-color-danger-light-9); color:var(--el-color-danger); }
.batch-page span { margin-left:3px; }
.page-nav:disabled { opacity:.4; cursor:default; }
.import-progress { margin-top:15px; padding:12px 14px; border-radius:8px; background:var(--el-fill-color-light); }
.import-progress-heading { display:flex; justify-content:space-between; gap:10px; margin-bottom:9px; font-size:12px; }
.import-progress-heading span { color:var(--el-text-color-secondary); }
.import-error { display:block; margin-top:9px; color:var(--el-color-danger); }
@media(max-width:767px) { .customer-import-page { padding:12px; } .import-actions, .import-progress-heading { flex-wrap:wrap; } }
</style>
