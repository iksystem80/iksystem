<template>
  <div ref="promotionPageRef" class="app-container promotion-create-page">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="goBack">
          <el-icon>
            <ArrowLeft />
          </el-icon>
        </el-button>
        <div>
          <h2 class="page-title">{{ isEditMode ? 'Continue Promotion Draft' : 'Create Promotion' }}</h2>
          <div class="page-subtitle">
            {{ isEditMode
              ? 'Continue editing your saved draft, update customers, then save or send.'
              : 'Select a finished template, choose eligible customers, then save or send.' }}
          </div>
        </div>
      </div>
      <el-radio-group v-model="form.channel" class="promotion-channel-switch" aria-label="Promotion channel">
        <el-radio-button label="MMS">MMS</el-radio-button>
        <el-radio-button label="WhatsApp">WhatsApp</el-radio-button>
      </el-radio-group>
    </div>
    <el-card shadow="never" class="form-card">
      <el-form ref="formRef" :model="form" label-position="top" >
        <div class="form-grid">
          <el-form-item label="Promotion Name">
            <el-input v-model="form.name" placeholder="Enter promotion name" />
          </el-form-item>
        </div>
        <div class="promotion-compose-grid">
          <div class="promotion-compose-fields">
            <el-form-item label="Promotion Template">
              <el-select
                v-model="form.templateid"
                filterable
                clearable
                placeholder="Choose a generated template"
                class="promotion-template-select"
                @change="syncTemplateImage"
              >
                <el-option
                  v-for="item in templates"
                  :key="item.id"
                  :label="item.name"
                  :value="Number(item.id)"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="Message">
              <el-input
                v-model="form.messagetext"
                type="textarea"
                :rows="3"
                placeholder="Optional message to send with the promotion"
              />
            </el-form-item>
          </div>
          <div class="promotion-template-preview">
            <div class="preview-heading">Template Preview</div>
            <div v-if="selectedTemplate?.finalimageurl" class="poster-preview">
              <el-image
                class="poster-preview-image"
                :src="selectedTemplate.finalimageurl"
                fit="contain"
                preview-teleported
                :preview-src-list="[selectedTemplate.finalimageurl]"
              />
              <div class="preview-name">{{ selectedTemplate.name }}</div>
              <div class="preview-hint">Click the image to enlarge</div>
            </div>
            <div v-else class="preview-placeholder">
              Select a template to see its preview
            </div>
          </div>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" class="app-table-card promotion-customers-card space-top">
      <template #header>
        <div class="app-table-card-header">
          <el-icon><User /></el-icon>
          <div class="app-table-card-title">
            <strong>Customers</strong>
            <div class="small-text">
              {{ selectedCustomers.length }} selected · {{ eligibleCustomerCount }} eligible
            </div>
          </div>
        </div>
      </template>
      <div class="promotion-customers-controls">
        <el-alert v-if="!locationId" title="A location is required before customers can be loaded." type="warning" :closable="false" show-icon class="customer-note" />
        <div class="promotion-customer-toolbar">
          <el-radio-group v-model="verificationFilter" class="promotion-verification-filter" aria-label="Customer verification filter">
            <el-radio-button label="all">All</el-radio-button>
            <el-radio-button label="verified">Verified</el-radio-button>
            <el-radio-button label="unverified">Unverified</el-radio-button>
            <el-radio-button label="eligible">Eligible</el-radio-button>
            <el-radio-button label="ineligible">Not Eligible</el-radio-button>
          </el-radio-group>
          <el-input v-model="customerSearch" placeholder="Search by customer name or phone" clearable class="customer-search" />
          <div class="customer-actions">
            <el-button size="small" :disabled="!eligibleCustomerCount" @click="selectAllEligible">Select All Eligible</el-button>
            <el-button size="small" :disabled="!selectedCustomers.length" @click="clearSelection">Clear</el-button>
          </div>
        </div>
      </div>
        <el-table class="app-data-table is-compact" ref="customerTableRef" v-loading="loadingCustomers" :data="filteredCustomers" row-key="id" :height="customerTableHeight" empty-text="No customers found" @selection-change="handleCustomerSelection" >
          <el-table-column type="selection" width="52" :selectable="isCustomerSelectable" :reserve-selection="true" />
          <el-table-column label="Customer" min-width="230" >
            <template #default="{ row }">
              <div class="customer-cell" style="display: flex; align-items: center; gap: 10px;">
                <el-avatar :size="34" :src="row.avatar || undefined" style="flex-shrink: 0;" >
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
    </el-card>
    <div class="fixed-actions" :style="actionBarStyle">
      <div class="action-inner">
        <div class="action-left promotion-bar-selection">
          <strong>{{ selectedCustomers.length }}</strong> customers selected
        </div>
        <div class="action-right">
          <el-button type="primary" :loading="saving" :disabled="sending" @click="saveDraft">
            Save Draft
          </el-button>
          <el-button type="success" :loading="sending" :disabled="saving" @click="saveAndSend">
            Send Promotion
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  nextTick,
  onMounted,
  reactive,
  ref
} from 'vue';

import { useRoute, useRouter } from 'vue-router';
import { User } from '@element-plus/icons-vue';
import {
  ElMessage,
  ElMessageBox
} from 'element-plus';


import { useUserStore } from '@/store/modules/user';
import { getcustomers } from '@/api/customer';
import request from '@/utils/request';
import { getPromotionTemplates } from '@/api/promotiontemplate';

import {
  createPromotion,
  getPromotion,
  getPromotionRecipients,
  savePromotionRecipients,
  sendPromotion,
  updatePromotion
} from '@/api/promotion';


// Keep the fixed footer aligned with the page content when the sidebar changes width.
const promotionPageRef = ref<HTMLElement | null>(null);
const actionBarStyle = ref({ left: '0px', width: '100%' });
const customerTableHeight = 340;
let layoutObserver: ResizeObserver | null = null;
let layoutFrame = 0;

function updateBarPosition() {
  if (!promotionPageRef.value) return;
  const rect = promotionPageRef.value.getBoundingClientRect();
  actionBarStyle.value = { left: `${rect.left}px`, width: `${rect.width}px` };
}

function scheduleBarPosition() {
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(updateBarPosition);
}

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const customerTableRef = ref<any>(null);

const activePromotionId = ref(
  Number(route.query.id || 0)
);

const templates = ref<any[]>([]);
const customers = ref<any[]>([]);
const consentedCustomerIds = ref<Set<number>>(new Set());
const selectedCustomers = ref<any[]>([]);
const customerSearch = ref('');
const verificationFilter = ref<'all' | 'verified' | 'unverified' | 'eligible' | 'ineligible'>('all');

const loadingCustomers = ref(false);
const saving = ref(false);
const sending = ref(false);

const locationId = computed(() =>
  Number(userStore.locationId || 0)
);

const isEditMode = computed(() =>
  activePromotionId.value > 0
);

const form = reactive({
  name: '',
  templateid: null as number | null,
  channel: 'MMS',
  messagetext: '',
  finalimageurl: ''
});

const selectedTemplate = computed(() =>
  templates.value.find(
    item => Number(item.id) === Number(form.templateid)
  ) || null
);

const filteredCustomers = computed(() => {
  const term =
    customerSearch.value
      .trim()
      .toLowerCase();

  return customers.value.filter(item => {
    const isVerified = item.phoneverified === true;
    if (verificationFilter.value === 'verified' && !isVerified) return false;
    if (verificationFilter.value === 'unverified' && isVerified) return false;
    const eligible = isCustomerSelectable(item);
    if (verificationFilter.value === 'eligible' && !eligible) return false;
    if (verificationFilter.value === 'ineligible' && eligible) return false;
    if (!term) return true;

    const searchable = [
      item.firstname,
      item.lastname,
      item.phone
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(term);
  });
});

const eligibleCustomerCount = computed(() =>
  customers.value.filter(isCustomerSelectable).length
);

function customerName(customer: any) {
  const value =
    `${customer?.firstname || ''} ${customer?.lastname || ''}`.trim();

  return value || `Customer #${customer?.id || ''}`;
}

function customerInitials(customer: any) {
  const first =
    String(customer?.firstname || '')
      .trim()
      .charAt(0);

  const last =
    String(customer?.lastname || '')
      .trim()
      .charAt(0);

  return `${first}${last}`.toUpperCase() || 'C';
}

function hasPhone(customer: any) {
  return Boolean(
    String(customer?.phone || '').trim()
  );
}

function isCustomerSelectable(customer: any) {
  return Boolean(
    customer &&
    customer.isactive !== false &&
    customer.isblacklist !== true &&
    hasPhone(customer) &&
    consentedCustomerIds.value.has(Number(customer.id))
  );
}

function customerIneligibleReason(customer: any) {
  if (customer?.isactive === false) {
    return 'Customer is inactive.';
  }

  if (customer?.isblacklist === true) {
    return 'Customer is blacklisted.';
  }

  if (!hasPhone(customer)) {
    return 'Customer does not have a phone number.';
  }

  if (!consentedCustomerIds.value.has(Number(customer?.id))) {
    return 'Customer has not opted in to promotional SMS/MMS at this location.';
  }

  return 'Customer is not eligible.';
}

function syncTemplateImage() {
  form.finalimageurl =
    selectedTemplate.value?.finalimageurl || '';
}

function handleCustomerSelection(rows: any[]) {
  selectedCustomers.value = rows;
}

function selectAllEligible() {
  if (!customerTableRef.value) return;

  customerTableRef.value.clearSelection();

  customers.value
    .filter(isCustomerSelectable)
    .forEach(customer => {
      customerTableRef.value.toggleRowSelection(
        customer,
        true
      );
    });
}

function clearSelection() {
  customerTableRef.value?.clearSelection();
}

function selectedCustomerIds() {
  return selectedCustomers.value
    .filter(isCustomerSelectable)
    .map(customer => Number(customer.id))
    .filter(id => Number.isInteger(id) && id > 0);
}

async function loadTemplates() {
  const response =
    await getPromotionTemplates({
      generatedOnly: true
    });

  templates.value =
    Array.isArray(response.data)
      ? response.data
      : [];
}

async function loadCustomers() {
  if (!locationId.value) {
    customers.value = [];
    consentedCustomerIds.value = new Set();
    return;
  }

  try {
    loadingCustomers.value = true;

    const [response, consentResponse] = await Promise.all([
      getcustomers(locationId.value),
      request({
        url: '/promotion/consented-customers',
        method: 'get',
        params: { locationid: locationId.value }
      })
    ]);

    if (consentResponse?.success === false || !Array.isArray(consentResponse?.data)) {
      throw new Error('Unable to verify promotional consent.');
    }
    consentedCustomerIds.value = new Set(consentResponse.data.map(Number));

    customers.value =
      Array.isArray(response.data)
        ? response.data
        : [];
  } catch (error) {
    console.error(error);
    customers.value = [];
    consentedCustomerIds.value = new Set();
    ElMessage.error('Unable to load customers.');
  } finally {
    loadingCustomers.value = false;
  }
}

function validatePromotion() {
  if (!form.name.trim()) {
    ElMessage.warning(
      'Please enter a promotion name.'
    );
    return false;
  }

  if (!form.templateid) {
    ElMessage.warning(
      'Please select a template.'
    );
    return false;
  }

  if (!selectedTemplate.value?.finalimageurl) {
    ElMessage.warning(
      'The selected template does not have a generated final image.'
    );
    return false;
  }

  return true;
}

async function saveCampaign() {
  if (!validatePromotion()) {
    return null;
  }

  const payload = {
    name: form.name.trim(),
    templateid: form.templateid,
    channel: form.channel,
    messagetext:
      form.messagetext.trim() || null,
    finalimageurl:
      selectedTemplate.value.finalimageurl
  };

  if (isEditMode.value) {
    const response =
      await updatePromotion({
        id: activePromotionId.value,
        ...payload
      });

    return {
      id: activePromotionId.value,
      ...response.data
    };
  }

  const response =
    await createPromotion(payload);

  activePromotionId.value =
    Number(response.data.id);

  return response.data;
}

async function saveSelectedRecipients(
  promotionId: number
) {
  await savePromotionRecipients({
    promotionid: promotionId,
    customerids: selectedCustomerIds()
  });
}

async function saveDraft() {
  try {
    saving.value = true;

    const wasNew =
      !isEditMode.value;

    const promotion =
      await saveCampaign();

    if (!promotion) return;

    await saveSelectedRecipients(
      promotion.id
    );

    ElMessage.success(
      wasNew
        ? 'Promotion draft saved. You can continue editing it here.'
        : 'Promotion draft updated.'
    );

    if (wasNew) {
      await router.replace({
        path: '/promotion/create',
        query: {
          id: promotion.id
        }
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

async function saveAndSend() {
  const ids = selectedCustomerIds();

  if (!ids.length) {
    ElMessage.warning(
      'Select at least one eligible customer.'
    );
    return;
  }

  if (!validatePromotion()) {
    return;
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
    );

    sending.value = true;

    const promotion =
      await saveCampaign();

    if (!promotion) return;

    await savePromotionRecipients({
      promotionid: promotion.id,
      customerids: ids
    });

    await sendPromotion(
      promotion.id
    );

    ElMessage.success(
      'Promotion queued for sending.'
    );

    router.push(
      `/promotion/${promotion.id}`
    );
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') {
      return;
    }

    console.error(error);
  } finally {
    sending.value = false;
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
    );

  await nextTick();

  customerTableRef.value?.clearSelection();

  customers.value
    .filter(customer =>
      selectedIds.has(Number(customer.id)) &&
      isCustomerSelectable(customer)
    )
    .forEach(customer => {
      customerTableRef.value?.toggleRowSelection(
        customer,
        true
      );
    });
}

async function loadDraft() {
  if (!isEditMode.value) {
    return;
  }

  const [
    detailResponse,
    recipientsResponse
  ] = await Promise.all([
    getPromotion(activePromotionId.value),
    getPromotionRecipients(activePromotionId.value)
  ]);

  const item =
    detailResponse.data;

  if (
    String(item?.status || '').toLowerCase() !==
    'draft'
  ) {
    ElMessage.warning(
      'Only draft promotions can be continued.'
    );

    await router.replace(
      `/promotion/${activePromotionId.value}`
    );

    return;
  }

  form.name =
    item.name || '';

  form.templateid =
    item.templateid
      ? Number(item.templateid)
      : null;

  form.channel =
    item.channel || 'MMS';

  form.messagetext =
    item.messagetext || '';

  form.finalimageurl =
    item.finalimageurl || '';

  /*
   * Prefer the current generated image from the selected
   * template when it is still available.
   */
  if (selectedTemplate.value?.finalimageurl) {
    form.finalimageurl =
      selectedTemplate.value.finalimageurl;
  }

  await restoreCustomerSelection(
    Array.isArray(recipientsResponse.data)
      ? recipientsResponse.data
      : []
  );
}

function goBack() {
  router.push('/promotion');
}

onMounted(async () => {
  await nextTick();
  updateBarPosition();
  if (promotionPageRef.value && typeof ResizeObserver !== 'undefined') {
    layoutObserver = new ResizeObserver(scheduleBarPosition);
    layoutObserver.observe(promotionPageRef.value);
  }
  window.addEventListener('resize', scheduleBarPosition);
  try {
    await Promise.all([
      loadTemplates(),
      loadCustomers()
    ]);

    await loadDraft();
  } catch (error) {
    console.error(error);

    if (isEditMode.value) {
      ElMessage.error(
        'Unable to load promotion draft.'
      );
    }
  }
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleBarPosition);
  layoutObserver?.disconnect();
  cancelAnimationFrame(layoutFrame);
});
</script>
