<template>
  <div class="page irfan-promotion-create irfan-ui-page">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="goBack">
          <el-icon>
            <ArrowLeft />
          </el-icon>
        </el-button>
        <div>
          <h2>{{ isEditMode ? 'Continue Promotion Draft' : 'Create Promotion' }}</h2>
          <p>
            {{ isEditMode
                ? 'Continue editing your saved draft, update customers, then save or send.'
                : 'Select a finished template, choose eligible customers, then save or send.' }}
          </p>
        </div>
      </div>
    </div>
    <el-card shadow="never" class="form-card">
      <el-form ref="formRef" :model="form" label-position="top" >
        <div class="form-grid">
          <el-form-item label="Promotion Name">
            <el-input v-model="form.name" placeholder="Enter promotion name" />
          </el-form-item>
          <el-form-item label="Channel">
            <el-radio-group v-model="form.channel">
              <el-radio-button label="MMS">
                MMS
              </el-radio-button>
              <el-radio-button label="WhatsApp">
                WhatsApp
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>
        <el-form-item label="Template">
          <el-select v-model="form.templateid" filterable placeholder="Select a generated template" style="width: 100%" @change="syncTemplateImage">
              <el-option v-for="item in templates" :key="item.id" :label="item.name" :value="Number(item.id)" />
          </el-select>
        </el-form-item>
        <div v-if="selectedTemplate?.finalimageurl" class="poster-preview" >
          <el-image :src="selectedTemplate.finalimageurl" fit="contain" preview-teleported :preview-src-list="[selectedTemplate.finalimageurl]" />
        </div>
        <el-form-item label="Message">
          <el-input v-model="form.messagetext" type="textarea" :rows="3" placeholder="Optional message to send with the promotion" />
        </el-form-item>
        <el-divider />
        <div class="customer-section-header">
          <div>
            <div class="section-title">
              Customers
            </div>
            <div class="section-subtitle">
              {{ selectedCustomers.length }} selected ·
              {{ eligibleCustomerCount }} eligible
            </div>
          </div>
          <div class="customer-actions">
            <el-button size="small" :disabled="!eligibleCustomerCount" @click="selectAllEligible" >
              Select All Eligible
            </el-button>
            <el-button size="small" :disabled="!selectedCustomers.length" @click="clearSelection" >
              Clear
            </el-button>
          </div>
        </div>
        <el-alert v-if="!locationId" title="A location is required before customers can be loaded." type="warning" :closable="false" show-icon class="customer-note" />
        <el-input v-model="customerSearch" placeholder="Search by customer name or phone" clearable class="customer-search" />
        <el-table ref="customerTableRef" v-loading="loadingCustomers" :data="filteredCustomers" row-key="id" empty-text="No customers found" @selection-change="handleCustomerSelection" >
          <el-table-column type="selection" width="52" :selectable="isCustomerSelectable" :reserve-selection="true" />
          <el-table-column label="Customer" min-width="230" >
            <template #default="{ row }">
              <div class="customer-cell">
                <el-avatar :size="34" :src="row.avatar || undefined" >
                  {{ customerInitials(row) }}
                </el-avatar>
                <div class="customer-name-wrap">
                  <strong>{{ customerName(row) }}</strong>
                  <span v-if="row.isvip" class="vip-label" >
                    VIP
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="phone"
            label="Phone"
            min-width="160"
          >
            <template #default="{ row }">
              {{ row.phone || '--' }}
            </template>
          </el-table-column>

          <el-table-column
            label="Eligibility"
            min-width="150"
          >
            <template #default="{ row }">
              <el-tag
                v-if="isCustomerSelectable(row)"
                type="success"
                effect="light"
                size="small"
              >
                Eligible
              </el-tag>

              <el-tooltip
                v-else
                :content="customerIneligibleReason(row)"
                placement="top"
              >
                <el-tag
                  type="info"
                  effect="light"
                  size="small"
                >
                  Not Eligible
                </el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>

        <div class="footer-actions">
          <el-button
            type="primary"
            :loading="saving"
            @click="saveDraft"
          >
            Save Draft
          </el-button>

          <el-button
            type="success"
            :loading="sending"
            @click="saveAndSend"
          >
            Send Promotion
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  reactive,
  ref
} from 'vue'

import { useRoute, useRouter } from 'vue-router'
import {
  ElMessage,
  ElMessageBox
} from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

import { useUserStore } from '@/store/modules/user'
import { getcustomers } from '@/api/customer'
import { getPromotionTemplates } from '@/api/promotionTemplate'

import {
  createPromotion,
  getPromotion,
  getPromotionRecipients,
  savePromotionRecipients,
  sendPromotion,
  updatePromotion
} from '@/api/promotion'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const customerTableRef = ref<any>(null)

const activePromotionId = ref(
  Number(route.query.id || 0)
)

const templates = ref<any[]>([])
const customers = ref<any[]>([])
const selectedCustomers = ref<any[]>([])
const customerSearch = ref('')

const loadingCustomers = ref(false)
const saving = ref(false)
const sending = ref(false)

const locationId = computed(() =>
  Number(userStore.locationId || 0)
)

const isEditMode = computed(() =>
  activePromotionId.value > 0
)

const form = reactive({
  name: '',
  templateid: null as number | null,
  channel: 'MMS',
  messagetext: '',
  finalimageurl: ''
})

const selectedTemplate = computed(() =>
  templates.value.find(
    item => Number(item.id) === Number(form.templateid)
  ) || null
)

const filteredCustomers = computed(() => {
  const term =
    customerSearch.value
      .trim()
      .toLowerCase()

  if (!term) {
    return customers.value
  }

  return customers.value.filter(item => {
    const searchable = [
      item.firstname,
      item.lastname,
      item.phone
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return searchable.includes(term)
  })
})

const eligibleCustomerCount = computed(() =>
  customers.value.filter(isCustomerSelectable).length
)

function customerName(customer: any) {
  const value =
    `${customer?.firstname || ''} ${customer?.lastname || ''}`.trim()

  return value || `Customer #${customer?.id || ''}`
}

function customerInitials(customer: any) {
  const first =
    String(customer?.firstname || '')
      .trim()
      .charAt(0)

  const last =
    String(customer?.lastname || '')
      .trim()
      .charAt(0)

  return `${first}${last}`.toUpperCase() || 'C'
}

function hasPhone(customer: any) {
  return Boolean(
    String(customer?.phone || '').trim()
  )
}

function isCustomerSelectable(customer: any) {
  return Boolean(
    customer &&
    customer.isactive !== false &&
    customer.isblacklist !== true &&
    hasPhone(customer)
  )
}

function customerIneligibleReason(customer: any) {
  if (customer?.isactive === false) {
    return 'Customer is inactive.'
  }

  if (customer?.isblacklist === true) {
    return 'Customer is blacklisted.'
  }

  if (!hasPhone(customer)) {
    return 'Customer does not have a phone number.'
  }

  return 'Customer is not eligible.'
}

function syncTemplateImage() {
  form.finalimageurl =
    selectedTemplate.value?.finalimageurl || ''
}

function handleCustomerSelection(rows: any[]) {
  selectedCustomers.value = rows
}

function selectAllEligible() {
  if (!customerTableRef.value) return

  customerTableRef.value.clearSelection()

  customers.value
    .filter(isCustomerSelectable)
    .forEach(customer => {
      customerTableRef.value.toggleRowSelection(
        customer,
        true
      )
    })
}

function clearSelection() {
  customerTableRef.value?.clearSelection()
}

function selectedCustomerIds() {
  return selectedCustomers.value
    .filter(isCustomerSelectable)
    .map(customer => Number(customer.id))
    .filter(id => Number.isInteger(id) && id > 0)
}

async function loadTemplates() {
  const response =
    await getPromotionTemplates({
      generatedOnly: true
    })

  templates.value =
    Array.isArray(response.data)
      ? response.data
      : []
}

async function loadCustomers() {
  if (!locationId.value) {
    customers.value = []
    return
  }

  try {
    loadingCustomers.value = true

    const response =
      await getcustomers(locationId.value)

    customers.value =
      Array.isArray(response.data)
        ? response.data
        : []
  } catch (error) {
    console.error(error)
    customers.value = []
    ElMessage.error('Unable to load customers.')
  } finally {
    loadingCustomers.value = false
  }
}

function validatePromotion() {
  if (!form.name.trim()) {
    ElMessage.warning(
      'Please enter a promotion name.'
    )
    return false
  }

  if (!form.templateid) {
    ElMessage.warning(
      'Please select a template.'
    )
    return false
  }

  if (!selectedTemplate.value?.finalimageurl) {
    ElMessage.warning(
      'The selected template does not have a generated final image.'
    )
    return false
  }

  return true
}

async function saveCampaign() {
  if (!validatePromotion()) {
    return null
  }

  const payload = {
    name: form.name.trim(),
    templateid: form.templateid,
    channel: form.channel,
    messagetext:
      form.messagetext.trim() || null,
    finalimageurl:
      selectedTemplate.value.finalimageurl
  }

  if (isEditMode.value) {
    const response =
      await updatePromotion({
        id: activePromotionId.value,
        ...payload
      })

    return {
      id: activePromotionId.value,
      ...response.data
    }
  }

  const response =
    await createPromotion(payload)

  activePromotionId.value =
    Number(response.data.id)

  return response.data
}

async function saveSelectedRecipients(
  promotionId: number
) {
  await savePromotionRecipients({
    promotionid: promotionId,
    customerids: selectedCustomerIds()
  })
}

async function saveDraft() {
  try {
    saving.value = true

    const wasNew =
      !isEditMode.value

    const promotion =
      await saveCampaign()

    if (!promotion) return

    await saveSelectedRecipients(
      promotion.id
    )

    ElMessage.success(
      wasNew
        ? 'Promotion draft saved. You can continue editing it here.'
        : 'Promotion draft updated.'
    )

    if (wasNew) {
      await router.replace({
        path: '/promotion/create',
        query: {
          id: promotion.id
        }
      })
    }
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}

async function saveAndSend() {
  const ids = selectedCustomerIds()

  if (!ids.length) {
    ElMessage.warning(
      'Select at least one eligible customer.'
    )
    return
  }

  if (!validatePromotion()) {
    return
  }

  try {
    await ElMessageBox.confirm(
      `Send this promotion to ${ids.length} customer(s) using ${form.channel}?`,
      'Send Promotion',
      {
        confirmButtonText: 'Send',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    sending.value = true

    const promotion =
      await saveCampaign()

    if (!promotion) return

    await savePromotionRecipients({
      promotionid: promotion.id,
      customerids: ids
    })

    await sendPromotion(
      promotion.id
    )

    ElMessage.success(
      'Promotion queued for sending.'
    )

    router.push(
      `/promotion/${promotion.id}`
    )
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') {
      return
    }

    console.error(error)
  } finally {
    sending.value = false
  }
}

async function restoreCustomerSelection(
  recipientRows: any[]
) {
  const selectedIds =
    new Set(
      recipientRows
        .map(item => Number(item.customerid))
        .filter(id => id > 0)
    )

  await nextTick()

  customerTableRef.value?.clearSelection()

  customers.value
    .filter(customer =>
      selectedIds.has(Number(customer.id)) &&
      isCustomerSelectable(customer)
    )
    .forEach(customer => {
      customerTableRef.value?.toggleRowSelection(
        customer,
        true
      )
    })
}

async function loadDraft() {
  if (!isEditMode.value) {
    return
  }

  const [
    detailResponse,
    recipientsResponse
  ] = await Promise.all([
    getPromotion(activePromotionId.value),
    getPromotionRecipients(activePromotionId.value)
  ])

  const item =
    detailResponse.data

  if (
    String(item?.status || '').toLowerCase() !==
    'draft'
  ) {
    ElMessage.warning(
      'Only draft promotions can be continued.'
    )

    await router.replace(
      `/promotion/${activePromotionId.value}`
    )

    return
  }

  form.name =
    item.name || ''

  form.templateid =
    item.templateid
      ? Number(item.templateid)
      : null

  form.channel =
    item.channel || 'MMS'

  form.messagetext =
    item.messagetext || ''

  form.finalimageurl =
    item.finalimageurl || ''

  /*
   * Prefer the current generated image from the selected
   * template when it is still available.
   */
  if (selectedTemplate.value?.finalimageurl) {
    form.finalimageurl =
      selectedTemplate.value.finalimageurl
  }

  await restoreCustomerSelection(
    Array.isArray(recipientsResponse.data)
      ? recipientsResponse.data
      : []
  )
}

function goBack() {
  router.push('/promotion')
}

onMounted(async () => {
  try {
    await Promise.all([
      loadTemplates(),
      loadCustomers()
    ])

    await loadDraft()
  } catch (error) {
    console.error(error)

    if (isEditMode.value) {
      ElMessage.error(
        'Unable to load promotion draft.'
      )
    }
  }
})
</script>


