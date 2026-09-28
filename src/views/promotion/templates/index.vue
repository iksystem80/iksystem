<template>
  <div class="page irfan-promotion-templates-index irfan-ui-page">
    <div class="page-header">
      <div>
        <h2>Promotion Templates</h2>
        <p>Create a poster from a system template or one of your saved designs.</p>
      </div>
      <el-button type="primary" @click="createBlank">
        Create Template
      </el-button>
    </div>
    <el-card shadow="never" class="toolbar-card">
      <el-input v-model="search" placeholder="Search templates" clearable style="max-width: 320px" />
    </el-card>
    <el-empty v-if="!loading && filteredTemplates.length === 0" description="No promotion templates found." />
    <div v-else class="template-grid" v-loading="loading">
      <el-card v-for="item in filteredTemplates" :key="item.id" shadow="hover" class="template-card" >
        <div class="preview">
          <el-image v-if="item.previewimageurl || item.finalimageurl" :src="item.previewimageurl || item.finalimageurl" fit="cover" class="preview-image" />
          <div v-else class="preview-empty">
            No Preview
          </div>
          <el-tag v-if="item.issystemtemplate" type="info" effect="dark" class="system-tag" >
            System
          </el-tag>
        </div>
        <div class="template-content">
          <strong>{{ item.name }}</strong>
          <div class="small-text">
            {{ item.description || 'Promotion poster template' }}
          </div>
        </div>
        <div class="actions">
          <el-button v-if="item.issystemtemplate" type="primary" @click="useTemplate(item)" >
            Use Template
          </el-button>
          <el-button v-else type="primary" @click="editTemplate(item)" >
            Edit
          </el-button>
          <el-button v-if="!item.issystemtemplate" plain @click="duplicateTemplate(item)" >
            Duplicate
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getPromotionTemplates,
  duplicatePromotionTemplate
} from '@/api/promotionTemplate'

const router = useRouter()
const loading = ref(false)
const search = ref('')
const templates = ref<any[]>([])

const filteredTemplates = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) {
    return templates.value
  }

  return templates.value.filter(item =>
    String(item.name || '')
      .toLowerCase()
      .includes(term)
  )
})

async function loadTemplates() {
  try {
    loading.value = true
    const response = await getPromotionTemplates()
    templates.value = response.data ?? []
  } catch (error) {
    console.error(error)
    ElMessage.error('Unable to load promotion templates.')
  } finally {
    loading.value = false
  }
}

function createBlank() {
  router.push('/promotion/templates/create')
}

function editTemplate(item: any) {
  router.push(`/promotion/templates/${item.id}/edit`)
}

async function useTemplate(item: any) {
  try {
    const response = await duplicatePromotionTemplate({
      templateid: item.id
    })

    router.push(
      `/promotion/templates/${response.data.id}/edit`
    )
  } catch (error) {
    console.error(error)
  }
}

async function duplicateTemplate(item: any) {
  try {
    await duplicatePromotionTemplate({
      templateid: item.id
    })

    ElMessage.success('Template duplicated.')
    await loadTemplates()
  } catch (error) {
    console.error(error)
  }
}

onMounted(loadTemplates)
</script>


