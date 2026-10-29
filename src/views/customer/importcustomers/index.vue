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
          <input type="file" accept=".json,application/json" @change="onJsonChange" />
          <p v-if="jsonFile" class="file-label">{{ jsonFile.name }}</p>
        </el-col>
        <el-col :xs="24" :sm="12">
          <label class="upload-label">Customer Photos ZIP</label>
          <input type="file" accept=".zip,application/zip" @change="onZipChange" />
          <p v-if="zipFile" class="file-label">{{ zipFile.name }}</p>
        </el-col>
      </el-row>
      <el-alert class="import-note" type="info" :closable="false" show-icon
        title="Customers are imported as Active and Unverified. Existing phone numbers at this location are never overwritten." />
      <div class="import-actions">
        <span>{{ customers.length }} customers detected · {{ matchedCount }} photo filenames matched</span>
        <el-button type="primary" :disabled="!customers.length || !zipFile || !zipReady || loading" :loading="loading" @click="runImport">Import Customers</el-button>
      </div>
    </el-card>

    <el-card v-if="customers.length && !result" shadow="never" class="import-card">
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
      <div class="preview-pagination"><el-pagination v-model:current-page="currentPage" :page-size="20"
        :total="customers.length" layout="prev, pager, next, total" @current-change="loadPagePhotos" /></div>
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
const pageCustomers = computed(() => customers.value.slice((currentPage.value - 1) * 20, currentPage.value * 20))
const matchedCount = computed(() => customers.value.filter(c =>
  Boolean(zipEntries.value.get(photoBasename(c?.photo_file)))).length)
let previewSequence = 0

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
  if (file.size > 2 * 1024 * 1024) return ElMessage.error('JSON file must be 2 MB or smaller.')
  try {
    const parsed = JSON.parse(await file.text())
    if (!Array.isArray(parsed) || !parsed.length || parsed.length > 500) throw new Error('Provide an array of 1–500 customers.')
    jsonFile.value = file
    customers.value = [...parsed].sort((a, b) =>
      String(a?.first_name || a?.firstname || '').localeCompare(String(b?.first_name || b?.firstname || ''), undefined, { sensitivity: 'base' }) ||
      String(a?.last_name || a?.lastname || '').localeCompare(String(b?.last_name || b?.lastname || ''), undefined, { sensitivity: 'base' }))
    if (zipReady.value) await loadPagePhotos()
  } catch (error) { ElMessage.error(error.message || 'Invalid JSON file.') }
}

async function onZipChange(event) {
  result.value = null
  clearPreviews()
  const file = event.target.files?.[0]
  zipFile.value = null
  zipReady.value = false
  zipEntries.value = new Map()
  if (!file) return
  if (file.size > 100 * 1024 * 1024) return ElMessage.error('Photo ZIP must be 100 MB or smaller.')
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
  try {
    await ElMessageBox.confirm(`Import ${customers.value.length} customers? Existing phones at this location will be skipped.`, 'Confirm Customer Import', { type: 'warning' })
  } catch (_) { return }
  loading.value = true
  result.value = null
  try {
    const data = new FormData()
    data.append('locationid', String(userStore.locationId))
    data.append('customers', jsonFile.value)
    data.append('photos', zipFile.value)
    const response = await importCustomers(data)
    // request utility may return either response.data or the response itself.
    const payload = response?.data?.imported !== undefined ? response.data : response
    if (!payload || payload.success !== true) throw new Error(payload?.message || 'Import failed')
    result.value = payload
    ElMessage.success(`Saved ${payload.imported} customers. Not saved: ${payload.notSaved}.`)
  } catch (error) {
    ElMessage.error(error?.message || 'Import failed. Please try again.')
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
.preview-pagination { display:flex; justify-content:flex-end; padding-top:16px; }
@media(max-width:767px) { .customer-import-page { padding:12px; } .import-actions { flex-wrap:wrap; } }
</style>
