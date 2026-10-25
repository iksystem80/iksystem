<template>
  <div class="app-container promotion-editor-page promotion-editor-ribbon-page">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button" circle aria-label="Back" @click="goBack"><el-icon><ArrowLeft /></el-icon></el-button>
        <div>
          <h2 class="page-title">{{ form.id ? 'Edit Promotion Template' : 'Create Promotion Template' }}</h2>
          <div class="page-subtitle">Design, customize, and export your promotion poster.</div>
        </div>
      </div>
    </div>

    <!-- One-row scrollable ribbon; advanced tools use popovers to save height. -->
    <div class="promotion-ribbon app-section-surface" role="toolbar" aria-label="Poster editor tools">
      <div class="promotion-ribbon-scroll">
        <div class="promotion-ribbon-group">
          <el-tooltip content="Show or hide template details" placement="bottom"><el-button size="small" :type="detailsOpen ? 'primary' : 'default'" plain aria-label="Toggle template details" @click="detailsOpen = !detailsOpen"><el-icon><Fold /></el-icon></el-button></el-tooltip>
          <el-tooltip content="Undo" placement="bottom"><el-button size="small" :disabled="!canUndo" aria-label="Undo" @click="undo"><el-icon><RefreshLeft /></el-icon></el-button></el-tooltip>
          <el-tooltip content="Redo" placement="bottom"><el-button size="small" :disabled="!canRedo" aria-label="Redo" @click="redo"><el-icon><RefreshRight /></el-icon></el-button></el-tooltip>
        </div>
        <div class="promotion-ribbon-group">
          <el-tooltip content="Add headline" placement="bottom"><el-button size="small" aria-label="Add headline" @click="addHeadline"><el-icon><EditPen /></el-icon></el-button></el-tooltip>
          <el-tooltip content="Add text" placement="bottom"><el-button size="small" aria-label="Add text" @click="addText"><el-icon><Document /></el-icon></el-button></el-tooltip>
          <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="handleImageSelect"><el-tooltip content="Add image" placement="bottom"><el-button size="small" :loading="uploadingAsset" aria-label="Add image"><el-icon><Picture /></el-icon></el-button></el-tooltip></el-upload>
          <el-popover placement="bottom" :width="208" trigger="click" popper-class="promotion-ribbon-popover">
            <template #reference><el-button size="small" aria-label="Shapes" title="Shapes"><el-icon><Grid /></el-icon><span class="promotion-ribbon-chevron">⌄</span></el-button></template>
            <div class="promotion-ribbon-menu"><el-button size="small" @click="addShape('rect')">Rectangle</el-button><el-button size="small" @click="addShape('circle')">Circle</el-button><el-button size="small" @click="addShape('line')">Line</el-button></div>
          </el-popover>
        </div>
        <div class="promotion-ribbon-group promotion-ribbon-type-group">
          <el-select v-model="fontFamily" size="small" class="promotion-ribbon-font" :disabled="!selectedObjectIsText" aria-label="Font family" @change="applyTextStyle('fontFamily', fontFamily)"><el-option v-for="font in fontOptions" :key="font" :value="font" :label="font" /></el-select>
          <el-input-number v-model="selectedFontSize" size="small" class="promotion-ribbon-fontsize" :min="10" :max="180" :disabled="!selectedObjectIsText" aria-label="Font size" controls-position="right" @change="updateSelectedFontSize" />
          <el-tooltip content="Bold" placement="bottom"><el-button size="small" :type="fontBold && selectedObjectIsText ? 'primary' : 'default'" :disabled="!selectedObjectIsText" @click="toggleTextStyle('bold')"><b>B</b></el-button></el-tooltip>
          <el-tooltip content="Italic" placement="bottom"><el-button size="small" :type="fontItalic && selectedObjectIsText ? 'primary' : 'default'" :disabled="!selectedObjectIsText" @click="toggleTextStyle('italic')"><i>I</i></el-button></el-tooltip>
          <el-tooltip content="Underline" placement="bottom"><el-button size="small" :type="fontUnderline && selectedObjectIsText ? 'primary' : 'default'" :disabled="!selectedObjectIsText" @click="toggleTextStyle('underline')"><u>U</u></el-button></el-tooltip>
          <el-popover placement="bottom" :width="210" trigger="click" popper-class="promotion-ribbon-popover">
            <template #reference><el-button size="small" :disabled="!selectedObjectIsText" aria-label="Text alignment" title="Text alignment"><el-icon><Tickets /></el-icon><span class="promotion-ribbon-chevron">⌄</span></el-button></template>
            <el-radio-group v-model="textAlign" size="small" :disabled="!selectedObjectIsText" @change="applyTextStyle('textAlign', textAlign)"><el-radio-button value="left">Left</el-radio-button><el-radio-button value="center">Center</el-radio-button><el-radio-button value="right">Right</el-radio-button></el-radio-group>
          </el-popover>
          <el-tooltip content="Selected text color" placement="bottom"><el-color-picker v-model="selectedTextColor" size="small" :disabled="!selectedObjectIsText" @change="updateSelectedTextColor" /></el-tooltip>
        </div>
        <div class="promotion-ribbon-group">
          <el-popover placement="bottom" :width="270" trigger="click" popper-class="promotion-ribbon-popover">
            <template #reference><el-button size="small" aria-label="Background" title="Background"><el-icon><Brush /></el-icon><span class="promotion-ribbon-chevron">⌄</span></el-button></template>
            <div class="promotion-ribbon-popover-content"><div class="promotion-ribbon-popover-label">Poster background</div><div class="promotion-ribbon-menu"><el-color-picker v-model="backgroundColor" size="small" @change="applyBackgroundColor"/><el-upload :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="handleBackgroundImage"><el-button size="small" :loading="uploadingAsset">Upload image</el-button></el-upload><el-button size="small" @click="clearBackgroundImage">Clear image</el-button></div></div>
          </el-popover>
          <el-popover placement="bottom" :width="260" trigger="click" popper-class="promotion-ribbon-popover">
            <template #reference><el-button size="small" :disabled="!selectedObject" aria-label="Arrange layers" title="Arrange layers"><el-icon><Rank /></el-icon><span class="promotion-ribbon-chevron">⌄</span></el-button></template>
            <div class="promotion-ribbon-popover-content"><div class="promotion-ribbon-popover-label">Layer order</div><div class="promotion-ribbon-menu promotion-ribbon-menu-grid"><el-button size="small" @click="moveLayer('front')">Bring front</el-button><el-button size="small" @click="moveLayer('forward')">Forward</el-button><el-button size="small" @click="moveLayer('backward')">Backward</el-button><el-button size="small" @click="moveLayer('back')">Send back</el-button></div><div class="promotion-ribbon-popover-label">Opacity: {{ elementOpacity }}%</div><el-slider v-model="elementOpacity" :min="0" :max="100" @change="applyOpacity" /></div>
          </el-popover>
          <el-tooltip content="Duplicate selected element" placement="bottom"><el-button size="small" :disabled="!selectedObject" aria-label="Duplicate selected" @click="duplicateSelected"><el-icon><CopyDocument /></el-icon></el-button></el-tooltip>
          <el-tooltip :content="isLocked ? 'Unlock selected element' : 'Lock selected element'" placement="bottom"><el-button size="small" :disabled="!selectedObject" :aria-label="isLocked ? 'Unlock selected' : 'Lock selected'" @click="toggleLock"><el-icon><Unlock v-if="isLocked" /><Lock v-else /></el-icon></el-button></el-tooltip>
          <el-tooltip content="Delete selected element" placement="bottom"><el-button size="small" type="danger" plain :disabled="!selectedObject" aria-label="Delete selected" @click="deleteSelected"><el-icon><Delete /></el-icon></el-button></el-tooltip>
        </div>
        <div class="promotion-ribbon-group promotion-ribbon-last">
          <el-popover placement="bottom-end" :width="175" trigger="click" popper-class="promotion-ribbon-popover">
            <template #reference><el-button size="small" aria-label="Export poster" title="Export poster"><el-icon><Download /></el-icon><span class="promotion-ribbon-chevron">⌄</span></el-button></template><div class="promotion-ribbon-menu"><el-button size="small" @click="downloadPoster('png')">Download PNG</el-button><el-button size="small" @click="downloadPoster('jpeg')">Download JPG</el-button></div>
          </el-popover>
        </div>
      </div>
    </div>

    <div class="designer-layout" :class="{ 'promotion-details-collapsed': !detailsOpen }">
      <el-card v-if="detailsOpen" shadow="never" class="tool-panel app-section-surface">
        <div class="promotion-editor-section-heading"><div class="promotion-editor-section-title">Template Details</div><div class="promotion-editor-section-note">Name and describe your design.</div></div>
        <el-form label-position="top">
          <el-form-item label="Template Name"><el-input v-model="form.name" /></el-form-item>
          <el-form-item label="Description"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        </el-form>
        <template v-if="selectedObjectIsText">
          <el-divider />
          <div class="promotion-editor-section-heading"><div class="promotion-editor-section-title">Selected Text</div><div class="promotion-editor-section-note">Edit the selected text content.</div></div>
          <el-input v-model="selectedText" type="textarea" :rows="3" @input="updateSelectedText" />
        </template>
        <div v-else class="promotion-editor-selection-hint">Select a text element to edit its content here. Formatting tools are in the ribbon.</div>
      </el-card>
      <el-card shadow="never" class="canvas-card app-section-surface">
        <div class="promotion-editor-canvas-header"><div><div class="promotion-editor-section-title">Poster Canvas</div><div class="promotion-editor-section-note">Click or drag an element to edit its position.</div></div><span class="promotion-editor-dimensions">{{ form.width }} × {{ form.height }} px</span></div>
        <div ref="canvasWrapEl" class="canvas-wrap" :style="{ '--poster-aspect': `${form.width} / ${form.height}` }"><canvas ref="canvasEl" /></div>
        <div class="promotion-ribbon-status"><span>{{ form.width }} × {{ form.height }} px</span><div class="promotion-ribbon-zoom"><el-button size="small" @click="setZoom(-10)">−</el-button><span class="promotion-editor-zoom-value">{{ zoomPercent }}%</span><el-button size="small" @click="setZoom(10)">+</el-button><el-button size="small" @click="resetZoom">Fit</el-button></div></div>
      </el-card>
    </div>
    <!-- Same fixed bottom action-bar layout as Reading Sessions. -->
    <Transition name="action-bar-fade">
      <div v-if="showActionBar" class="fixed-actions" :style="actionBarStyle">
        <div class="action-inner">
          <div class="action-left"></div>
          <div class="action-right">
            <el-button type="primary" :loading="saving" :disabled="generating" @click="saveTemplate">
              <el-icon><Check /></el-icon>
              <span>Save Template</span>
            </el-button>
            <el-button type="success" :loading="generating" :disabled="saving" @click="generateImage">
              <el-icon><Picture /></el-icon>
              <span>Save &amp; Generate Image</span>
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
  ref,
  shallowRef
} from 'vue';

import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

import { Canvas, FabricImage, Textbox, Rect, Circle, Line } from 'fabric';

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
const canvasWrapEl = ref<HTMLDivElement | null>(null);
let canvas: Canvas | null = null;
let canvasResizeObserver: ResizeObserver | null = null;

const detailsOpen = ref(true);
const saving = ref(false);
const generating = ref(false);
const uploadingAsset = ref(false);

const showActionBar = ref(false);
const actionBarStyle = ref<Record<string, string>>({
  left: '0px',
  width: '100%'
});

let actionBarTimer: number | null = null;

const selectedObject = shallowRef<any>(null);
const selectedText = ref('');
const selectedFontSize = ref(48);
const selectedTextColor = ref('#111111');
const fontFamily = ref('Arial');
const textAlign = ref('center');
const fontBold = ref(false);
const fontItalic = ref(false);
const fontUnderline = ref(false);
const elementOpacity = ref(100);
const backgroundColor = ref('#ffffff');
const zoomPercent = ref(100);
const canUndo = ref(false);
const canRedo = ref(false);
const isLocked = computed(() => Boolean(selectedObject.value?.lockMovementX));
const history: string[] = [];
let historyIndex = -1;
let historyPaused = false;
let historyDebounce: number | null = null;
const fontOptions = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Verdana', 'Tahoma', 'Courier New'];
const selectedFontFamily = computed(() => fontFamily.value);
const selectedTextAlign = computed(() => textAlign.value);
const selectedBold = computed(() => fontBold.value);
const selectedItalic = computed(() => fontItalic.value);
const selectedUnderline = computed(() => fontUnderline.value);
const selectedOpacity = computed(() => elementOpacity.value);
const selectedBackgroundColor = computed(() => backgroundColor.value);

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
    fontFamily.value = String(active.fontFamily || 'Arial');
    textAlign.value = String(active.textAlign || 'center');
    fontBold.value = String(active.fontWeight || '') === 'bold' || Number(active.fontWeight) >= 600;
    fontItalic.value = active.fontStyle === 'italic';
    fontUnderline.value = Boolean(active.underline);
  } else {
    selectedText.value = '';
  }
  elementOpacity.value = Math.round((active?.opacity ?? 1) * 100);
}

function addHeadline() {
  if (!canvas) return;

  const text = new Textbox('PROMOTION', {
    left: 120,
    top: 120,
    originX: 'left',
    originY: 'top',
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
    originX: 'left',
    originY: 'top',
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
      top: 420,
      originX: 'left',
      originY: 'top'
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
  scheduleHistory();
}

function updateSelectedFontSize() {
  if (!selectedObjectIsText.value) return;

  selectedObject.value.set({
    fontSize: selectedFontSize.value
  });

  canvas?.renderAll();
  scheduleHistory();
}

function updateSelectedTextColor() {
  if (!selectedObjectIsText.value) return;

  selectedObject.value.set({
    fill: selectedTextColor.value
  });

  canvas?.renderAll();
}

function commitObjectChange() {
  const active = canvas?.getActiveObject();
  active?.setCoords();
  canvas?.requestRenderAll();
  scheduleHistory();
}

function applyTextStyle(property: string, value: any) {
  const active = canvas?.getActiveObject() as any;
  if (!active || active.type !== 'textbox') return;
  active.set(property, value);
  commitObjectChange();
}

function toggleTextStyle(kind: 'bold' | 'italic' | 'underline') {
  const active = canvas?.getActiveObject() as any;
  if (!active || active.type !== 'textbox') return;
  if (kind === 'bold') active.set('fontWeight', fontBold.value ? 'normal' : 'bold');
  if (kind === 'italic') active.set('fontStyle', fontItalic.value ? 'normal' : 'italic');
  if (kind === 'underline') active.set('underline', !fontUnderline.value);
  syncSelectedObject();
  commitObjectChange();
}

function applyOpacity() {
  const active = canvas?.getActiveObject();
  if (!active) return;
  active.set('opacity', elementOpacity.value / 100);
  commitObjectChange();
}

function addShape(kind: 'rect' | 'circle' | 'line') {
  if (!canvas) return;
  const shared = { left: 250, top: 320, fill: '#8a79b4', originX: 'left' as const, originY: 'top' as const };
  const object = kind === 'rect' ? new Rect({ ...shared, width: 340, height: 210, rx: 12, ry: 12 }) : kind === 'circle' ? new Circle({ ...shared, radius: 135 }) : new Line([220, 450, 780, 450], { stroke: '#8a79b4', strokeWidth: 12 });
  canvas.add(object);
  canvas.setActiveObject(object);
  syncSelectedObject();
  commitObjectChange();
}

function moveLayer(direction: 'front' | 'forward' | 'backward' | 'back') {
  const object = canvas?.getActiveObject();
  if (!object || !canvas) return;
  if (direction === 'front') canvas.bringObjectToFront(object);
  if (direction === 'back') canvas.sendObjectToBack(object);
  if (direction === 'forward') canvas.bringObjectForward(object);
  if (direction === 'backward') canvas.sendObjectBackwards(object);
  commitObjectChange();
}

function toggleLock() {
  const object = canvas?.getActiveObject();
  if (!object) return;
  const locked = !object.lockMovementX;
  object.set({ lockMovementX: locked, lockMovementY: locked, lockScalingX: locked, lockScalingY: locked, lockRotation: locked, hasControls: !locked });
  syncSelectedObject();
  commitObjectChange();
}

async function duplicateSelected() {
  const object = canvas?.getActiveObject();
  if (!object || !canvas) return;
  const copy = await object.clone();
  copy.set({ left: (object.left || 0) + 28, top: (object.top || 0) + 28 });
  canvas.add(copy);
  canvas.setActiveObject(copy);
  syncSelectedObject();
  commitObjectChange();
}

function applyBackgroundColor() {
  if (!canvas) return;
  canvas.backgroundColor = backgroundColor.value;
  canvas.backgroundImage = undefined;
  canvas.requestRenderAll();
  scheduleHistory();
}

async function handleBackgroundImage(uploadFile: any) {
  if (!canvas || !uploadFile?.raw) return;
  try {
    uploadingAsset.value = true;
    const body = new FormData();
    body.append('file', uploadFile.raw);
    const response = await uploadPromotionAsset(body);
    const image = await FabricImage.fromURL(response.data.url, { crossOrigin: 'anonymous' });
    image.scaleX = form.width / (image.width || form.width);
    image.scaleY = form.height / (image.height || form.height);
    image.set({ originX: 'left', originY: 'top', left: 0, top: 0 });
    canvas.backgroundImage = image;
    canvas.requestRenderAll();
    scheduleHistory();
  } catch (error) { console.error(error); ElMessage.error('Unable to set background image.'); }
  finally { uploadingAsset.value = false; }
}

function clearBackgroundImage() {
  if (!canvas) return;
  canvas.backgroundImage = undefined;
  canvas.requestRenderAll();
  scheduleHistory();
}

function setZoom(delta: number) {
  zoomPercent.value = Math.max(40, Math.min(150, zoomPercent.value + delta));
  resizePosterDisplay();
}
function resetZoom() { zoomPercent.value = 100; resizePosterDisplay(); }

function downloadPoster(format: 'png' | 'jpeg') {
  if (!canvas) return;
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  const url = canvas.toDataURL({ format, quality: 0.95, multiplier: 1 });
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(form.name || 'promotion').replace(/[^a-z0-9_-]+/gi, '-')}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  link.click();
}

function scheduleHistory() {
  if (historyPaused || !canvas) return;
  if (historyDebounce !== null) window.clearTimeout(historyDebounce);
  historyDebounce = window.setTimeout(() => { historyDebounce = null; recordHistory(); }, 250);
}
function recordHistory() {
  if (historyPaused || !canvas) return;
  const snapshot = JSON.stringify(canvas.toJSON());
  if (history[historyIndex] === snapshot) return;
  history.splice(historyIndex + 1);
  history.push(snapshot);
  if (history.length > 40) history.shift();
  historyIndex = history.length - 1;
  updateHistoryButtons();
}
function updateHistoryButtons() { canUndo.value = historyIndex > 0; canRedo.value = historyIndex >= 0 && historyIndex < history.length - 1; }
async function restoreHistory(index: number) {
  if (!canvas || index < 0 || index >= history.length) return;
  historyPaused = true;
  try {
    await canvas.loadFromJSON(JSON.parse(history[index]));
    historyIndex = index;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncSelectedObject();
    backgroundColor.value = typeof canvas.backgroundColor === 'string' ? canvas.backgroundColor : '#ffffff';
    updateHistoryButtons();
  } finally { historyPaused = false; }
}
async function undo() { if (historyDebounce !== null) { window.clearTimeout(historyDebounce); historyDebounce = null; recordHistory(); } await restoreHistory(historyIndex - 1); }
async function redo() { await restoreHistory(historyIndex + 1); }

function deleteSelected() {
  if (!canvas) return;

  // Use Fabric's original object references. Vue's ref() wraps the selected
  // object in a reactive proxy, which canvas.remove() cannot match by identity.
  const activeObjects = canvas.getActiveObjects();
  if (!activeObjects.length) return;

  if (activeObjects.some((object: any) => object.isEditing)) return;

  canvas.discardActiveObject();
  canvas.remove(...activeObjects);
  canvas.requestRenderAll();
  syncSelectedObject();
  scheduleHistory();
}

// Delete a selected canvas element using keyboard keys when focus is not
// inside an editable field. Do not hijack text editing or form controls.
function handleCanvasKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('input, textarea, select, [contenteditable="true"]')) { event.preventDefault(); if (event.shiftKey) void redo(); else void undo(); }
    return;
  }
  if (event.key !== 'Delete' && event.key !== 'Backspace') return;
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

  const target = event.target as HTMLElement | null;
  if (target?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return;
  if (!canvas || !canvas.getActiveObject()) return;

  const active = canvas.getActiveObject() as any;
  if (active.isEditing) return;

  event.preventDefault();
  deleteSelected();
}

// Keep Fabric's drawing coordinates at the original poster resolution.
// Resize only its CSS display dimensions using the Fabric API, not CSS !important.
function resizePosterDisplay() {
  if (!canvas || !canvasWrapEl.value) return;

  const wrap = canvasWrapEl.value;
  const style = window.getComputedStyle(wrap);
  const available = wrap.clientWidth
    - parseFloat(style.paddingLeft || '0')
    - parseFloat(style.paddingRight || '0')
    - parseFloat(style.borderLeftWidth || '0')
    - parseFloat(style.borderRightWidth || '0');

  const width = Math.min(540, Math.max(1, available)) * zoomPercent.value / 100;
  const height = width * form.height / form.width;

  canvas.setDimensions({ width, height }, { cssOnly: true });
  canvas.calcOffset();
  canvas.requestRenderAll();
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
    // Older system templates have top/left coordinates but no origin values.
    // Keep those coordinates anchored at the top-left in Fabric 6.
    const design = typeof item.designjson === 'string'
      ? JSON.parse(item.designjson)
      : item.designjson;

    const objects = Array.isArray(design?.objects) ? design.objects : [];
    const normalizedDesign = {
      ...design,
      objects: objects.map((object: any) => ({
        ...object,
        originX: object.originX ?? 'left',
        originY: object.originY ?? 'top'
      }))
    };

    await canvas.loadFromJSON(normalizedDesign);
    backgroundColor.value = typeof canvas.backgroundColor === 'string' ? canvas.backgroundColor : '#ffffff';
    canvas.requestRenderAll();
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
  canvas.on('object:added', scheduleHistory);
  canvas.on('object:removed', scheduleHistory);
  canvas.on('object:modified', scheduleHistory);
  canvas.on('text:changed', scheduleHistory);

  historyPaused = true;
  await loadTemplate();
  historyPaused = false;
  history.length = 0;
  historyIndex = -1;
  recordHistory();
  window.addEventListener('keydown', handleCanvasKeydown);
  await nextTick();
  resizePosterDisplay();

  if (canvasWrapEl.value) {
    canvasResizeObserver = new ResizeObserver(resizePosterDisplay);
    canvasResizeObserver.observe(canvasWrapEl.value);
  }

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

  window.removeEventListener('keydown', handleCanvasKeydown);

  if (historyDebounce !== null) window.clearTimeout(historyDebounce);
  canvasResizeObserver?.disconnect();
  canvasResizeObserver = null;

  canvas?.dispose();
  canvas = null;
});
</script>

