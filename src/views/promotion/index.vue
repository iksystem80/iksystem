<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>Promotions</h2>
        <p>Create, send, and review promotion campaigns.</p>
      </div>
      <el-button type="primary" @click="createPromotionPage">
        Create Promotion
      </el-button>
    </div>
    <el-card shadow="never" class="list-card" v-loading="loading">
      <el-table :data="promotions" style="width: 100%">
        <el-table-column prop="name" label="Promotion" min-width="220" />
        <el-table-column prop="channel" label="Channel" min-width="100" />
        <el-table-column prop="status" label="Status" min-width="140" >
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light" >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="recipientcount"
          label="Recipients"
          min-width="110"
        />

        <el-table-column
          label="Created"
          min-width="170"
        >
          <template #default="{ row }">
            {{ formatDateTime(row.createdat) }}
          </template>
        </el-table-column>

        <el-table-column
          label="Actions"
          width="190"
          align="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="isDraft(row)"
              link
              type="primary"
              @click="continueDraft(row)"
            >
              Continue
            </el-button>

            <el-button
              link
              type="primary"
              @click="openPromotion(row)"
            >
              View
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  onActivated,
  onMounted,
  ref
} from 'vue'

import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPromotions } from '@/api/promotion'

const router = useRouter()

const loading = ref(false)
const promotions = ref<any[]>([])

function formatDateTime(value: string | null) {
  if (!value) return '--'

  return new Date(value)
    .toLocaleString()
}

function statusType(status: string) {
  const value =
    String(status || '')
      .toLowerCase()

  if (value === 'completed') {
    return 'success'
  }

  if (
    value === 'failed' ||
    value === 'completedwitherrors'
  ) {
    return 'danger'
  }

  if (
    value === 'processing' ||
    value === 'queued'
  ) {
    return 'warning'
  }

  if (value === 'draft') {
    return 'info'
  }

  return 'info'
}

function isDraft(row: any) {
  return (
    String(row?.status || '')
      .toLowerCase() === 'draft'
  )
}

async function loadPromotions() {
  try {
    loading.value = true

    const response =
      await getPromotions()

    promotions.value =
      response.data ?? []
  } catch (error) {
    console.error(error)

    ElMessage.error(
      'Unable to load promotions.'
    )
  } finally {
    loading.value = false
  }
}

function createPromotionPage() {
  router.push('/promotion/create')
}

function continueDraft(row: any) {
  router.push({
    path: '/promotion/create',
    query: {
      id: row.id
    }
  })
}

function openPromotion(row: any) {
  router.push(
    `/promotion/${row.id}`
  )
}

onMounted(loadPromotions)

/*
 * Refresh when this page is kept alive and the user
 * returns from Create / Continue Draft / Detail.
 */
onActivated(loadPromotions)
</script>


