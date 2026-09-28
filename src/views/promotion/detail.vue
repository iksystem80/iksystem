<template>
  <div class="page irfan-promotion-detail irfan-ui-page" v-loading="loading" >
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="goBack" >
          <el-icon>
            <ArrowLeft />
          </el-icon>
        </el-button>
        <div>
          <h2>
            {{ promotion?.name || 'Promotion Details' }}
          </h2>
          <p>
            Delivery status, recipients, and audit history.
          </p>
        </div>
      </div>
      <el-button v-if="isDraft" type="primary" @click="continueDraft" >
        Continue Draft
      </el-button>
    </div>
    <template v-if="promotion">
      <div class="summary-grid">
        <el-card shadow="never" class="summary-card" >
          <span>Status</span>
          <strong>{{ promotion.status }}</strong>
        </el-card>
        <el-card shadow="never" class="summary-card" >
          <span>Channel</span>
          <strong>{{ promotion.channel || '--' }}</strong>
        </el-card>
        <el-card shadow="never" class="summary-card" >
          <span>Recipients</span>
          <strong>{{ recipients.length }}</strong>
        </el-card>
        <el-card shadow="never" class="summary-card" >
          <span>Delivered</span>
          <strong>{{ deliveredCount }}</strong>
        </el-card>
      </div>
      <el-card shadow="never" class="card" >
        <template #header>
          <strong>Recipients</strong>
        </template>

        <el-table :data="recipients">
          <el-table-column
            prop="customername"
            label="Customer"
            min-width="180"
          />

          <el-table-column
            prop="phone"
            label="Phone"
            min-width="150"
          />

          <el-table-column
            prop="channel"
            label="Channel"
            min-width="100"
          />

          <el-table-column
            prop="status"
            label="Status"
            min-width="120"
          />

          <el-table-column
            label="Sent"
            min-width="170"
          >
            <template #default="{ row }">
              {{ formatDateTime(row.sentat) }}
            </template>
          </el-table-column>

          <el-table-column
            label="Delivered"
            min-width="170"
          >
            <template #default="{ row }">
              {{ formatDateTime(row.deliveredat) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card
        shadow="never"
        class="card"
      >
        <template #header>
          <strong>Audit History</strong>
        </template>

        <el-timeline>
          <el-timeline-item
            v-for="item in logs.audit"
            :key="item.id"
            :timestamp="formatDateTime(item.createdat)"
          >
            <strong>{{ item.action }}</strong>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  ref
} from 'vue'

import {
  useRoute,
  useRouter
} from 'vue-router'

import {
  ArrowLeft
} from '@element-plus/icons-vue'

import {
  getPromotion,
  getPromotionLogs,
  getPromotionRecipients
} from '@/api/promotion'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const promotion = ref<any>(null)
const recipients = ref<any[]>([])

const logs = ref<any>({
  audit: [],
  delivery: []
})

const isDraft = computed(() =>
  String(
    promotion.value?.status || ''
  ).toLowerCase() === 'draft'
)

const deliveredCount = computed(() =>
  recipients.value.filter(item =>
    String(item.status || '')
      .toLowerCase() === 'delivered'
  ).length
)

function formatDateTime(
  value: string | null
) {
  if (!value) return '--'

  return new Date(value)
    .toLocaleString()
}

async function loadPage() {
  const id =
    Number(route.params.id)

  try {
    loading.value = true

    const [
      detailResponse,
      recipientResponse,
      logResponse
    ] =
      await Promise.all([
        getPromotion(id),
        getPromotionRecipients(id),
        getPromotionLogs(id)
      ])

    promotion.value =
      detailResponse.data

    recipients.value =
      recipientResponse.data ?? []

    logs.value =
      logResponse.data ?? {
        audit: [],
        delivery: []
      }
  } finally {
    loading.value = false
  }
}

function continueDraft() {
  if (!promotion.value?.id) {
    return
  }

  router.push({
    path: '/promotion/create',
    query: {
      id: promotion.value.id
    }
  })
}

function goBack() {
  router.push('/promotion')
}

onMounted(loadPage)
</script>


