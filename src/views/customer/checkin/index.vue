<template>
  <div class="app-container">
    <div class="checkin-wrapper">
      <div class="page-header">
        <div>
          <h2 class="page-title">Customer {{ isCheckout ? 'Check-Out' : 'Check-In' }}</h2>
          <p>{{ userStore.hasfaceallowed ? 'Capture the customer’s image to verify their identity.' : 'Verify the customer’s registered phone number to continue.' }}</p>
        </div>
        <el-tag type="success" effect="light" round>{{ isCheckout ? 'Check-Out Ready' : 'Check-In Ready' }}</el-tag>
      </div>
      <el-card shadow="never" class="mode-card">
        <el-segmented v-model="mode" :options="modeOptions" :disabled="loading" class="mode-selector" @change="resetForm" />
      </el-card>
      <el-row :gutter="24">
        <el-col :xs="24" :sm="24" :md="15" :lg="16">
          <el-card shadow="never" class="camera-card">
            <div class="card-heading">
              <div>
                <h3>Face Capture</h3>
                <p>Position the customer clearly inside the camera frame.</p>
              </div>
              <el-tag type="info" effect="light" round>Camera</el-tag>
            </div>
            <CameraApp v-if="userStore.hasfaceallowed" ref="cameraAppRef" @captured="handleCapturedImage" />
            <el-empty v-else description="Face verification is not enabled for this location." />
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="9" :lg="8">
          <el-card shadow="never" class="checkin-card">
            <div class="form-header">
              <div class="form-icon"><el-icon><User /></el-icon></div>
              <div>
                <h3>Customer Verification</h3>
                <p>{{ userStore.hasfaceallowed ? 'Capture a customer photo to verify their identity.' : 'Enter the customer’s registered phone number.' }}</p>
              </div>
            </div>
            <el-divider />
            <el-form ref="checkInFormRef" :model="checkInForm" :rules="formRules" label-position="top" class="checkin-form" @submit.prevent="submitForm">
              <el-form-item label="Phone Number" prop="phone">
                <el-input v-model="checkInForm.phone" maxlength="14" size="large" placeholder="(512) 555-1234" @input="formatPhoneInput">
                  <template #prefix>
                    <el-icon><Phone /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <div class="phone-help">{{ userStore.hasfaceallowed ? 'Optional for face verification.' : 'Enter the phone number associated with the customer account.' }}</div>
              <el-button native-type="submit" type="primary" size="large" class="checkin-button" :loading="loading">
                {{ loading ? (isCheckout ? 'Checking Out...' : 'Checking In...') : (isCheckout ? 'Check Out Customer' : 'Check In Customer') }}
              </el-button>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Phone } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';
import CameraApp from '@/components/MyCamera';
import { checkin, checkout } from '@/api/customer';
import { unformatPhone } from '@/utils/phone';

const userStore = useUserStore();
const mode = ref('checkin');
const modeOptions = [{ label: 'Check In', value: 'checkin' }, { label: 'Check Out', value: 'checkout' }];
const isCheckout = computed(() => mode.value === 'checkout');
const checkInFormRef = ref(null);
const cameraAppRef = ref(null);
const loading = ref(false);
const capturedImage = ref(null);
const checkInForm = reactive({ phone: '' });

const formRules = computed(() => ({
  phone: [{
    trigger: ['blur', 'change'],
    validator: (_rule, value, callback) => {
      const digits = String(value || '').replace(/\D/g, '');
      if (!userStore.hasfaceallowed && !digits.length) return callback(new Error('Customer phone is required.'));
      if (digits.length && digits.length !== 10) return callback(new Error('Enter a valid 10-digit phone number.'));
      callback();
    }
  }]
}));

function formatPhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) checkInForm.phone = digits ? `(${digits}` : '';
  else if (digits.length <= 6) checkInForm.phone = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  else checkInForm.phone = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function handleCapturedImage(image) {
  capturedImage.value = image;
}

async function submitForm() {
  if (!checkInFormRef.value || loading.value) return;
  try {
    await checkInFormRef.value.validate();
    if (userStore.hasfaceallowed && !capturedImage.value) {
      ElMessage.warning('Please capture a customer photo.');
      return;
    }

    loading.value = true;
    const payload = {
      phonenumber: unformatPhone(checkInForm.phone || ''),
      locationid: userStore.locationId,
      hasfaceallowed: Boolean(userStore.hasfaceallowed)
    };
    const formData = new FormData();
    if (userStore.hasfaceallowed) {
      const imageFile = new File([capturedImage.value], `${mode.value}-${Date.now()}.png`, {
        type: capturedImage.value.type || 'image/png'
      });
      formData.append('image', imageFile);
    }
    formData.append(isCheckout.value ? 'checkoutdata' : 'checkindata', JSON.stringify(payload));
    const response = await (isCheckout.value ? checkout(formData) : checkin(formData));
    if (!response || response.success === false || response.code !== 20000) {
      throw new Error(response?.message || 'Customer verification failed.');
    }
    ElMessage.success(isCheckout.value ? 'Customer checked out successfully.' : 'Customer checked in successfully.');
    resetForm();
  } catch (error) {
    if (error?.fields) return; // Element Plus validation already displays the error.
    ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to complete customer verification.');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  capturedImage.value = null;
  checkInForm.phone = '';
  nextTick(() => {
    checkInFormRef.value?.clearValidate();
    cameraAppRef.value?.reset?.();
  });
}
</script>

<style scoped lang="scss">
    .checkin-page {
        min-height: calc(100vh - 84px);
        background: #f7f8fb;
    }

    .checkin-wrapper {
        max-width: 100%;
        margin: 0 auto;
    }




    .mode-card, .camera-card, .checkin-card {
        border-radius: 16px;
        border: 1px solid #ebeef5;
        background: #fff;
    }

    .mode-card {
        margin-bottom: 20px;
    }

        .mode-card :deep(.el-card__body) {
            padding: 12px;
        }

    .mode-selector {
        width: 100%;
        height:40px;
    }

    .camera-card, .checkin-card {
        height: 100%;
    }

    .card-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 20px;
    }

        .card-heading h3 {
            margin: 0 0 5px;
            font-size: 18px;
            font-weight: 600;
            color: #303133;
        }

        .card-heading p {
            margin: 0;
            color: #909399;
            font-size: 13px;
        }

    .form-header {
        display: flex;
        align-items: center;
        gap: 14px;
    }

        .form-header h3 {
            margin: 0 0 5px;
            font-size: 17px;
            font-weight: 600;
            color: #303133;
        }

        .form-header p {
            margin: 0;
            font-size: 13px;
            color: #909399;
            line-height: 1.5;
        }

    .form-icon {
        width: 46px;
        height: 46px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border-radius: 12px;
        font-size: 21px;
        background: linear-gradient(135deg, rgba(139, 92, 246, .15), rgba(59, 130, 246, .12));
        color: #6366f1;
    }

    .checkin-form {
        margin-top: 8px;
    }

    .phone-help {
        margin-top: -10px;
        margin-bottom: 24px;
        font-size: 12px;
        color: #a8abb2;
        line-height: 1.5;
    }

    .checkin-button {
        width: 100%;
        height: 48px;
        border-radius: 10px;
        font-weight: 600;
        letter-spacing: .3px;
    }

    :deep(.el-input__wrapper) {
        border-radius: 10px;
        min-height: 46px;
    }

    :deep(.el-form-item__label) {
        font-weight: 500;
        color: #606266;
    }

    .camera-card :deep(.el-card__body), .checkin-card :deep(.el-card__body) {
        padding: 24px;
    }

    @media (max-width: 992px) {

        .checkin-card {
            margin-top: 20px;
        }
    }

    @media (max-width: 600px) {
        .checkin-page {
            padding: 12px;
        }


        .page-header > .el-tag {
            display: none;
        }

        .camera-card :deep(.el-card__body), .checkin-card :deep(.el-card__body) {
            padding: 16px;
        }
    }
</style>
