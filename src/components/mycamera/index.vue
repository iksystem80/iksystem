```
<template>
  <div class="camera-container">
    <!-- Camera Stream Viewport class="camera-circle"-->
    <div :class="cameraClass" :style="cameraStyle">
      <video ref="videoRef" v-show="!capturedImage" autoplay playsinline muted :class="{ 'mirror-video': currentFacingMode === 'environment' }" />

      <!-- Preview Image if Captured -->
      <img v-if="capturedImage"
           :src="capturedImage"
           alt="Captured snapshot" />

      <span>
        <button class="button-circle" v-if="!isStreamActive && !capturedImage"
                @click="startCamera">
          <el-icon><SwitchButton /></el-icon>
        </button>
        <button class="button-circle" v-if="isStreamActive && !capturedImage" @click="takePhoto">
          <el-icon><Camera /></el-icon>
        </button>
        <button class="button-circle" v-if="capturedImage" @click="retakePhoto">
          <el-icon><Refresh-left /></el-icon>
        </button>
        <button class="button-refresh" v-if="isCameraOpen" @click="toggleCamera">
          <el-icon><Refresh /></el-icon>
        </button>
      </span>
    </div>

    <!-- Interface Buttons v-if="isCameraOpen"-->
    <!-- Hidden canvas utilized to extract the image frame -->
    <canvas ref="canvasRef" style="display: none;" />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, computed } from 'vue';
import { Capacitor } from '@capacitor/core';
import {
  Camera as NativeCamera,
  CameraResultType,
  CameraSource,
  CameraDirection
} from '@capacitor/camera';

const videoRef = ref(null);
const canvasRef = ref(null);

const isCameraOpen = ref(false);
const capturedImage = ref(null);
const isStreamActive = ref(false);

let activeStream = null;

// Mobile adjustment: Track the current camera mode
// "user" = front/selfie camera | "environment" = back/rear camera
const currentFacingMode = ref('user');

const emit = defineEmits(['captured']);

const props = defineProps({
  shape: {
    type: String,
    default: 'circle'
  },
  width: {
    type: [String, Number],
    default: '100%'
  },
  height: {
    type: [String, Number],
    default: '300px'
  },
  borderRadius: {
    type: [String, Number],
    default: '12px'
  }
});

const cameraClass = computed(() => {
  if (props.shape === 'rectangle') return 'camera-rect';
  if (props.shape === 'custom') return 'camera-custom';
  return 'camera-circle';
});

const cssValue = value => {
  return typeof value === 'number' ? `${value}px` : value;
};

const cameraStyle = computed(() => {
  if (props.shape !== 'custom') return {};

  return {
    width: cssValue(props.width),
    height: cssValue(props.height),
    borderRadius: cssValue(props.borderRadius)
  };
});

function reset() {
  capturedImage.value = null;
}



const addTimestamp = (context, canvas) => {
  const now = new Date();

  const dateTime = now.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const fontSize = Math.max(16, Math.round(canvas.width * 0.025));
  const padding = Math.round(fontSize * 0.6);

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);

  context.font = `600 ${fontSize}px Arial`;
  context.textAlign = 'right';
  context.textBaseline = 'bottom';

  const textWidth = context.measureText(dateTime).width;

  context.fillStyle = 'rgba(0, 0, 0, 0.55)';
  context.fillRect(
    canvas.width - textWidth - padding * 2,
    canvas.height - fontSize - padding * 2,
    textWidth + padding * 2,
    fontSize + padding * 2
  );

  context.fillStyle = '#ffffff';
  context.fillText(
    dateTime,
    canvas.width - padding,
    canvas.height - padding
  );

  context.restore();
};

const startNativeCamera = async () => {
  try {
    const permission = await NativeCamera.requestPermissions({
      permissions: ['camera']
    });

    if (permission.camera !== 'granted') {
      alert('Camera permission is required.');
      return;
    }

    const photo = await NativeCamera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      direction:
        currentFacingMode.value === 'user'
          ? CameraDirection.Front
          : CameraDirection.Rear
    });

    if (!photo.webPath) return;

    const image = new Image();

    image.onload = () => {
      const canvas = canvasRef.value;
      if (!canvas) return;

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      addTimestamp(context, canvas);

      capturedImage.value = canvas.toDataURL('image/jpeg', 0.92);

      const fileName = `capture-${Date.now()}.jpg`;
      const imageFile = dataURLtoFile(capturedImage.value, fileName);

      emit('captured', imageFile);

      isCameraOpen.value = false;
      isStreamActive.value = false;
    };

    image.onerror = () => {
      alert('Unable to process captured photo.');
    };

    image.src = photo.webPath;
  } catch (error) {
    console.error('Native Camera Error:', error);

    const message = String(error?.message || error || '').toLowerCase();
    if (message.includes('cancel')) return;

    alert(
      `Camera Error
` +
      `Name: ${error?.name || 'Unknown'}
` +
      `Message: ${error?.message || error}`
    );
  }
};

const startCamera = async () => {
  if (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === 'ios'
  ) {
    await startNativeCamera();
    return;
  }

  stopCamera();

  try {
    const constraints = {
      video: {
        facingMode: { ideal: currentFacingMode.value },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      activeStream = stream;
      isCameraOpen.value = true;
      isStreamActive.value = true;
    }
  } catch (error) {
    console.error('Camera Error:', error);

    alert(
      `Camera Error
` +
      `Name: ${error?.name || 'Unknown'}
` +
      `Message: ${error?.message || error}`
    );
  }
};

// Dynamically switch between front and back cameras
const toggleCamera = () => {
  currentFacingMode.value = currentFacingMode.value === 'user' ? 'environment' : 'user';
  // Restart the camera stream with the new constraints
  console.log('mode:' + currentFacingMode.value);
  if (isCameraOpen.value) {
    startCamera();
  }
};

const stopCamera = () => {
  if (activeStream) {
    activeStream.getTracks().forEach(track => track.stop());
    activeStream = null;
  }
  isCameraOpen.value = false;
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  isStreamActive.value = false;
};

defineExpose({
  reset,
  startCamera,
  stopCamera
});

const takePhoto = async () => {
  const video = videoRef.value;
  const canvas = canvasRef.value;

  if (!video || !canvas) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext('2d');

  if (currentFacingMode.value === 'user') {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  context.setTransform(1, 0, 0, 1, 0, 0);
  addTimestamp(context, canvas);

  capturedImage.value = canvas.toDataURL('image/png');

  const fileName = `capture-${Date.now()}.png`;
  const imageFile = dataURLtoFile(capturedImage.value, fileName);

  emit('captured', imageFile);

  stopCamera();
};

// 4. Return from view mode back to live camera mode
const retakePhoto = async () => {
  capturedImage.value = null;
  await startCamera();
};
// 1. Helper function: Converts Data URL to a File Object
const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
};

// 2. Upload Function: Triggers conversion and sends payload to server

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<style scoped>
  .mirror-video {
    transform: scaleX(1) !important;
  }

  .button-circle {
    position: absolute;
    /* Positioning coordinates (Dead Center Example) */
    bottom: -15px;
    left: 50%;
    transform: translate(-50%, -50%); /* Perfectly offsets alignment shift */
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden; /* Clips the square video to a circle */
    padding: 0px;
    background-color: rgba(0, 0, 0, 0.2);
  }

    .button-circle .el-icon {
      vertical-align: middle;
    }

    .button-circle button:hover {
      background-color: #35495e;
    }

  .button-refresh {
    position: absolute;
    /* Positioning coordinates (Dead Center Example) */
    bottom: -15px;
    left: 90%;
    transform: translate(-50%, -50%); /* Perfectly offsets alignment shift */
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden; /* Clips the square video to a circle */
    padding: 0px;
    background-color: rgba(0, 0, 0, 0.2);
  }

    .button-refresh .el-icon {
      vertical-align: middle;
    }

    .button-refresh button:hover {
      background-color: #35495e;
    }

  .button-circle-flip {
    position: absolute;
    /* Positioning coordinates (Dead Center Example) */
    top: 283px;
    left: 275px;
    transform: translate(-50%, -50%); /* Perfectly offsets alignment shift */

    width: 20px;
    height: 20px;
    border-radius: 50%;
    overflow: hidden; /* Clips the square video to a circle */
    padding: 0px;
    background-color: rgba(0, 0, 0, 0.2);
  }

    .button-circle-flip .el-icon {
      vertical-align: middle;
    }

  .camera-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: sans-serif;
    gap: 0px;
  }

  .video-box {
    width: 100%;
    max-width: 500px;
    min-height: 375px;
    background-color: #222;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  video, img {
    pointer-events: none;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  button {
    padding: 10px 20px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    background-color: #42b883;
    color: white;
    border: none;
    border-radius: 4px;
  }

    button:hover {
      background-color: #35495e;
    }
  /* 1. The Masking Container */
  .camera-circle {
    position: relative;
    width: 250px;
    height: 250px;
    border-radius: 5%;
    overflow: hidden; /* Clips the square video to a circle */
    border: 2px solid #42b883; /* Optional Vue-green border */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    background-color: #000; /* Fallback background */
  }
    /* 2. The Video Element */
    .camera-circle video {
      width: 100%;
      height: 100%;
      object-fit: cover; /* Prevents distortion, fills the circle */
      transform: scaleX(-1); /* Mirrors the preview for a natural feel */
    }

  .controls button {
    padding: 10px 20px;
    border-radius: 50px;
    border: none;
    background-color: #42b883;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }

    .controls button:hover {
      background-color: #35495e;
    }

  .camera-rect {
    width: 100% !important;
    height: 236px !important;
    border-radius: 0% !important;
    border: 0px solid #000 !important;
    position: relative;
    overflow: hidden; /* Clips the square video to a circle */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
    /* 2. The Video Element */
    .camera-rect video {
      width: 100%;
      height: 100%;
      object-fit: cover; /* Prevents distortion, fills the circle */
      transform: scaleX(-1); /* Mirrors the preview for a natural feel */
    }

  .button-rect-flip {
    position: absolute;
    /* Positioning coordinates (Dead Center Example) */
    top: 260px;
    left: 50px;
    transform: translate(-50%, -50%); /* Perfectly offsets alignment shift */
    width: 20px;
    height: 20px;
    border-radius: 50%;
    overflow: hidden; /* Clips the square video to a circle */
    padding: 0px;
    background-color: rgba(0, 0, 0, 0.2);
  }

  .button-circle-flip .el-icon {
    vertical-align: middle;
  }

  /* Custom camera frame:
       <CameraApp shape="custom" width="100%" height="430px" border-radius="12px" /> */
  .camera-custom {
    position: relative;
    overflow: hidden;
    background-color: #000;
    border: 0;
    box-sizing: border-box;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }

    .camera-custom video,
    .camera-custom img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .camera-custom video {
      transform: scaleX(-1);
    }

  @media (max-width: 700px) {
    .camera-rect {
      width: 100% !important;
      height: 230px !important;
      border-radius: 0% !important;
      border: 0px solid #000 !important;
    }
  }
</style>

```
