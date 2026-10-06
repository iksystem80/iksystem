<template>
  <div class="designer-page irfan-promotion-templates-editor irfan-ui-page">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="goBack">
          <el-icon>
            <ArrowLeft />
          </el-icon>
        </el-button>
        <div>
          <h2 class="page-title">
            {{ form.id ? 'Edit Promotion Template' : 'Create Promotion Template' }}
          </h2>
          <div class="page-subtitle">
            Design the poster, save the editable layout, then generate the final image.
          </div>
        </div>
      </div>
    </div>
    <div class="designer-layout">
      <el-card shadow="never" class="tool-panel">
        <el-form label-position="top">
          <el-form-item label="Template Name">
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="Description">
            <el-input v-model="form.description" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>
        <el-divider />
        <div class="tool-title">Add Elements</div>
        <el-button class="full-button" @click="addHeadline">
          Add Headline
        </el-button>
        <el-button class="full-button" @click="addText">
          Add Text
        </el-button>
        <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="handleImageSelect" >
          <el-button class="full-button" :loading="uploadingAsset" >
            Add Image
          </el-button>
        </el-upload>
        <el-divider />
        <div class="tool-title">Selected Element</div>
        <el-form label-position="top">
          <el-form-item label="Text">
            <el-input v-model="selectedText" :disabled="!selectedObjectIsText" @input="updateSelectedText" />
          </el-form-item>
          <el-form-item label="Font Size">
            <el-input-number v-model="selectedFontSize" :min="10" :max="180" :disabled="!selectedObjectIsText" @change="updateSelectedFontSize" />
          </el-form-item>
          <el-form-item label="Text Color">
            <el-color-picker v-model="selectedTextColor" :disabled="!selectedObjectIsText" @change="updateSelectedTextColor" />
          </el-form-item>
        </el-form>
        <el-button type="danger" plain class="full-button" :disabled="!selectedObject" @click="deleteSelected" >
          Delete Selected
        </el-button>
      </el-card>
      <el-card shadow="never" class="canvas-card">
        <div class="canvas-wrap">
          <canvas ref="canvasEl" />
        </div>
      </el-card>
    </div>
    <Transition name="action-bar-fade">
      <div v-if="showActionBar" class="fixed-actions" :style="actionBarStyle">
        <div class="fixed-actions-inner">
          <div class="fixed-actions-right">
            <el-button type="primary" :loading="saving" :disabled="generating" @click="saveTemplate">
              Save Template
            </el-button>
            <el-button type="success" :loading="generating" :disabled="saving" @click="generateImage">
              Save & Generate Image
            </el-button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref
} from 'vue';

import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Canvas, FabricImage, Textbox } from 'fabric';

import {
  createPromotionTemplate,
  getPromotionTemplate,
  updatePromotionTemplate,
  generatePromotionTemplateImage,
  uploadPromotionAsset
} from '@/api/promotiontemplate';

const route = useRoute();
const router = useRouter();

const canvasEl = ref<HTMLCanvasElement | null>(null);
let canvas: Canvas | null = null;

const saving = ref(false);
const generating = ref(false);
const uploadingAsset = ref(false);

const showActionBar = ref(false);
const actionBarStyle = ref<Record<string, string>>({
  left: '0px',
  width: '100%'
});

let actionBarTimer: number | null = null;

const selectedObject = ref<any>(null);
const selectedText = ref('');
const selectedFontSize = ref(48);
const selectedTextColor = ref('#111111');

const form = reactive({
  id: 0,
  name: '',
  description: '',
  width: 1080,
  height: 1350
});

const selectedObjectIsText = computed(() => {
  return selectedObject.value?.type === 'textbox';
});

function syncSelectedObject() {
  const active = canvas?.getActiveObject() || null;
  selectedObject.value = active;

  if (active?.type === 'textbox') {
    selectedText.value = active.text || '';
    selectedFontSize.value = Number(active.fontSize || 48);
    selectedTextColor.value = String(active.fill || '#111111');
  } else {
    selectedText.value = '';
  }
}

function addHeadline() {
  if (!canvas) return;

  const text = new Textbox('PROMOTION', {
    left: 120,
    top: 120,
    width: 840,
    fontSize: 84,
    fontWeight: '700',
    textAlign: 'center',
    fill: '#111111'
  });

  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.renderAll();
  syncSelectedObject();
}

function addText() {
  if (!canvas) return;

  const text = new Textbox('Your promotional text', {
    left: 160,
    top: 280,
    width: 760,
    fontSize: 46,
    textAlign: 'center',
    fill: '#111111'
  });

  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.renderAll();
  syncSelectedObject();
}

async function handleImageSelect(uploadFile: any) {
  if (!canvas || !uploadFile?.raw) return;

  try {
    uploadingAsset.value = true;

    const formData = new FormData();

    formData.append(
      'file',
      uploadFile.raw
    );

    const response =
      await uploadPromotionAsset(formData);

    const imageUrl =
      response?.data?.url;

    if (!imageUrl) {
      throw new Error(
        'The server did not return an uploaded image URL.'
      );
    }

    const image =
      await FabricImage.fromURL(
        imageUrl,
        {
          crossOrigin: 'anonymous'
        }
      );

    const maxWidth = 700;

    if ((image.width || 1) > maxWidth) {
      image.scaleToWidth(maxWidth);
    }

    image.set({
      left: 190,
      top: 420
    });

    canvas.add(image);
    canvas.setActiveObject(image);
    canvas.renderAll();
    syncSelectedObject();

    ElMessage.success(
      'Image uploaded and added to the poster.'
    );
  } catch (error) {
    console.error(error);

    ElMessage.error(
      'Unable to upload the image.'
    );
  } finally {
    uploadingAsset.value = false;
  }
}

function updateSelectedText() {
  if (!selectedObjectIsText.value) return;

  selectedObject.value.set({
    text: selectedText.value
  });

  canvas?.renderAll();
}

function updateSelectedFontSize() {
  if (!selectedObjectIsText.value) return;

  selectedObject.value.set({
    fontSize: selectedFontSize.value
  });

  canvas?.renderAll();
}

function updateSelectedTextColor() {
  if (!selectedObjectIsText.value) return;

  selectedObject.value.set({
    fill: selectedTextColor.value
  });

  canvas?.renderAll();
}

function deleteSelected() {
  if (!canvas || !selectedObject.value) return;

  canvas.remove(selectedObject.value);
  canvas.discardActiveObject();
  canvas.renderAll();
  syncSelectedObject();
}

async function loadTemplate() {
  const id = Number(route.params.id || 0);

  if (!id) {
    return;
  }

  const response = await getPromotionTemplate(id);
  const item = response.data;

  form.id = item.id;
  form.name = item.name;
  form.description = item.description || '';
  form.width = item.width || 1080;
  form.height = item.height || 1350;

  if (item.designjson && canvas) {
    await canvas.loadFromJSON(item.designjson);
    canvas.renderAll();
  }
}

function getDesignJson() {
  if (!canvas) {
    return null;
  }

  return canvas.toJSON();
}

async function saveTemplate() {
  if (!form.name.trim()) {
    ElMessage.warning('Please enter a template name.');
    return;
  }

  try {
    saving.value = true;

    const payload = {
      id: form.id || undefined,
      name: form.name,
      description: form.description,
      width: form.width,
      height: form.height,
      designjson: getDesignJson()
    };

    let response;

    if (form.id) {
      response = await updatePromotionTemplate(payload);
    } else {
      response = await createPromotionTemplate(payload);
      form.id = response.data.id;
    }

    ElMessage.success('Template saved successfully.');

    if (!route.params.id && form.id) {
      router.replace(`/promotion/templates/${form.id}/edit`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

async function generateImage() {
  if (!canvas) return;

  try {
    generating.value = true;

    if (!form.id) {
      await saveTemplate();
    }

    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: 1
    });

    await generatePromotionTemplateImage({
      id: form.id,
      imagebase64: dataUrl,
      designjson: getDesignJson()
    });

    ElMessage.success('Final promotion image generated.');
  } catch (error) {
    console.error(error);
  } finally {
    generating.value = false;
  }
}

function updateActionBarPosition() {
  const main =
    document.querySelector('.app-main') ||
    document.querySelector('main.el-main');

  if (!main) {
    actionBarStyle.value = {
      left: '0px',
      width: '100%'
    };
    return;
  }

  const rect =
    main.getBoundingClientRect();

  actionBarStyle.value = {
    left: `${Math.max(0, rect.left)}px`,
    width: `${Math.max(0, rect.width)}px`
  };
}

function showSettledActionBar() {
  updateActionBarPosition();

  if (actionBarTimer !== null) {
    window.clearTimeout(actionBarTimer);
  }

  actionBarTimer = window.setTimeout(() => {
    updateActionBarPosition();
    showActionBar.value = true;
    actionBarTimer = null;
  }, 550);
}

function wait(milliseconds: number) {
  return new Promise(resolve => {
    window.setTimeout(resolve, milliseconds);
  });
}

function goBack() {
  router.push('/promotion/templates');
}

onMounted(async () => {
  await nextTick();

  if (!canvasEl.value) {
    return;
  }

  canvas = new Canvas(canvasEl.value, {
    width: form.width,
    height: form.height,
    backgroundColor: '#ffffff',
    preserveObjectStacking: true
  });

  canvas.on('selection:created', syncSelectedObject);
  canvas.on('selection:updated', syncSelectedObject);
  canvas.on('selection:cleared', syncSelectedObject);

  await loadTemplate();

  window.addEventListener(
    'resize',
    updateActionBarPosition
  );

  showSettledActionBar();
});

onBeforeRouteLeave(async () => {
  if (!showActionBar.value) {
    return true;
  }

  showActionBar.value = false;
  await nextTick();
  await wait(320);

  return true;
});

onBeforeUnmount(() => {
  if (actionBarTimer !== null) {
    window.clearTimeout(actionBarTimer);
    actionBarTimer = null;
  }

  window.removeEventListener(
    'resize',
    updateActionBarPosition
  );

  canvas?.dispose();
  canvas = null;
});
</script>

