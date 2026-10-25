<template>
  <div class="app-container promotion-templates-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Promotion Templates</h2>
        <p>Create a poster from a system template or one of your saved designs.</p>
      </div>
      <el-button type="primary" class="create-button" @click="createBlank">
        <el-icon><Plus /></el-icon>
        <span>Create Template</span>
      </el-button>
    </div>
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar-content">
        <div class="toolbar-heading">
          <strong>Template Library</strong>
          <span>Choose a design to customize or continue editing your own.</span>
        </div>
        <el-input v-model="search" placeholder="Search templates" clearable class="search-input">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>
    </el-card>
    <div class="template-grid" v-loading="loading" :aria-busy="loading">
      <el-empty v-if="!loading && filteredTemplates.length === 0" class="empty-state" description="No promotion templates found." />
      <el-card v-for="item in filteredTemplates" :key="item.id" shadow="hover" class="template-card" >
        <div class="preview">
          <el-image v-if="item.previewimageurl || item.finalimageurl || item.generatedPreview" :src="item.previewimageurl || item.finalimageurl || item.generatedPreview" fit="cover" class="preview-image" />
          <div v-else class="preview-empty">
            <el-icon><Picture /></el-icon>
            <span>No Preview Available</span>
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
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

import {
  getPromotionTemplates,
  duplicatePromotionTemplate
} from '@/api/promotiontemplate';

const router = useRouter();
const loading = ref(false);
const search = ref('');
const templates = ref<any[]>([]);

// Lightweight SVG thumbnails from Fabric DesignJson. No extra chart/canvas library
// is loaded by the template listing page.
function previewFromDesign(value: unknown, widthValue: unknown, heightValue: unknown): string {
  try {
    const design = typeof value === 'string' ? JSON.parse(value) : value;
    if (!design || !Array.isArray(design.objects)) return '';

    const width = Math.min(5000, Math.max(100, Number(widthValue) || 1080));
    const height = Math.min(5000, Math.max(100, Number(heightValue) || 1350));
    const xml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char] || char
    );
    const safeColor = (value: unknown, fallback: string) => {
      const color = String(value ?? '');
      return /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{1,25})$/.test(color) ? color : fallback;
    };
    const elements = design.objects.map((obj: any) => {
      if (!['Textbox', 'IText', 'Text'].includes(obj?.type) || !obj.text) return '';
      const left = Number(obj.left) || 0;
      const top = Number(obj.top) || 0;
      const fontSize = Math.max(8, Math.min(300, Number(obj.fontSize) || 36));
      const boxWidth = Math.max(50, Number(obj.width) || width - left);
      const align = ['left', 'center', 'right'].includes(obj.textAlign) ? obj.textAlign : 'left';
      const x = left + (align === 'center' ? boxWidth / 2 : align === 'right' ? boxWidth : 0);
      const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
      const fill = safeColor(obj.fill, '#111827');
      const weight = Number(obj.fontWeight) >= 600 ? '700' : '400';
      // Simple text wrapping for thumbnail rendering. Full design remains in Fabric editor.
      const maxChars = Math.max(1, Math.floor(boxWidth / (fontSize * (weight === '700' ? 0.60 : 0.54))));
      const lines: string[] = [];
      for (const paragraph of String(obj.text).split('\n')) {
        let line = '';
        for (const word of paragraph.split(/\s+/).filter(Boolean)) {
          if (line && (line + ' ' + word).length > maxChars) {
            lines.push(line);
            line = word;
          } else line = line ? line + ' ' + word : word;
        }
        lines.push(line);
      }
      return `<text x="${x}" y="${top + fontSize}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}">${lines.map((line, i) => `<tspan x="${x}" dy="${i ? fontSize * 1.16 : 0}">${xml(line)}</tspan>`).join('')}</text>`;
    }).join('');
    if (!elements) return '';
    const bg = safeColor(design.background, '#FFFFFF');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${bg}"/>${elements}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch (error) {
    console.warn('Unable to generate template preview:', error);
    return '';
  }
}

const filteredTemplates = computed(() => {
  const term = search.value.trim().toLowerCase();

  if (!term) {
    return templates.value;
  }

  return templates.value.filter(item =>
    String(item.name || '')
      .toLowerCase()
      .includes(term)
  );
});

async function loadTemplates() {
  try {
    loading.value = true;
    const response = await getPromotionTemplates();
    templates.value = (response.data ?? []).map((item: any) => ({
      ...item,
      generatedPreview: item.previewimageurl || item.finalimageurl
        ? ''
        : previewFromDesign(item.designjson, item.width, item.height)
    }));
  } catch (error) {
    console.error(error);
    ElMessage.error('Unable to load promotion templates.');
  } finally {
    loading.value = false;
  }
}

function createBlank() {
  router.push('/promotion/templates/create');
}

function editTemplate(item: any) {
  router.push(`/promotion/templates/${item.id}/edit`);
}

async function useTemplate(item: any) {
  try {
    const response = await duplicatePromotionTemplate({
      templateid: item.id
    });

    router.push(
      `/promotion/templates/${response.data.id}/edit`
    );
  } catch (error) {
    console.error(error);
  }
}

async function duplicateTemplate(item: any) {
  try {
    await duplicatePromotionTemplate({
      templateid: item.id
    });

    ElMessage.success('Template duplicated.');
    await loadTemplates();
  } catch (error) {
    console.error(error);
  }
}

onMounted(loadTemplates);
</script>
