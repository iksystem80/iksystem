<template>
  <div class="customer-checkin-container">
    <div class="background-effects">
      <div class="orb orb-one"></div>
      <div class="orb orb-two"></div>
      <div class="orb orb-three"></div>
      <img :src="logo" alt="IK Logo" class="bg-logo" />
      <div class="grid-overlay"></div>
    </div>

    <div class="checkin-layout">
      <section class="verification-panel">
        <div class="verification-card">
          <div class="verification-card-header">
            <div class="mini-logo" @click="handleLogout"><span></span></div>
            <span class="signin-label">CUSTOMER CHECK-IN</span>
            <h2>{{ userStore.hasfaceallowed ? 'Face verification' : 'Enter phone number' }}</h2>
            <p>
              {{
                userStore.hasfaceallowed
                  ? 'Capture a photo to verify the customer.'
                  : 'Enter your 10-digit phone number.'
              }}
            </p>
          </div>

          <template v-if="!userStore.hasfaceallowed">
            <el-form ref="checkInFormRef"
                     :model="checkInForm"
                     :rules="formRules"
                     class="checkin-form"
                     @submit.prevent="submitForm">
              <el-form-item prop="phone" class="phone-form-item">
                <div class="phone-display" :class="{ complete: phoneDigits.length === 10 }">
                  {{ phoneDisplay }}
                </div>
              </el-form-item>

              <div class="customer-flip-scene" :class="{ flipped: showCustomer }">
                <div class="customer-flip-inner">
                  <div class="customer-flip-face customer-flip-front">
                    <div class="keypad">
                      <button v-for="number in [1,2,3,4,5,6,7,8,9]"
                              :key="number"
                              type="button"
                              class="key"
                              @click="appendDigit(number)">
                        {{ number }}
                      </button>
                      <div class="key-spacer"></div>
                      <button type="button" class="key" @click="appendDigit(0)">0</button>
                      <button type="button" class="key key-delete" aria-label="Delete digit" @click="deleteDigit">
                        <el-icon><Back /></el-icon>
                      </button>
                    </div>
                  </div>

                  <div class="customer-flip-face customer-flip-back">
                    <div class="customer-preview">
                      <div class="customer-avatar">
                        <img v-if="matchedCustomer?.avatar"
                             :src="matchedCustomer.avatar"
                             :alt="matchedCustomerName" />
                        <span v-else>{{ matchedCustomerInitials }}</span>
                      </div>

                      <strong>{{ matchedCustomerName }}</strong>
                      <small>Checked in successfully</small>
                      <div class="customer-preview-timer">
                        Returning to keypad in 5 seconds
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <el-button native-type="submit"
                         :loading="loading"
                         :disabled="phoneDigits.length !== 10 || showCustomer"
                         type="primary"
                         class="checkin-button">
                <span v-if="!loading">Check In<span class="button-arrow">→</span></span>
                <span v-else>Checking in...</span>
              </el-button>
            </el-form>
          </template>

          <template v-else>
            <div class="camera-frame">
              <CameraApp ref="cameraAppRef"
                         shape="custom"
                         width="100%"
                         height="100%"
                         border-radius="12px"
                         @captured="handleCapturedImage" />
            </div>

            <el-button :loading="loading"
                       type="primary"
                       class="checkin-button"
                       @click="submitForm">
              <span v-if="!loading">Check In<span class="button-arrow">→</span></span>
              <span v-else>Checking in...</span>
            </el-button>
          </template>

          <div class="checkin-bottom-text">Secure customer verification</div>

          <!-- TEMPORARY: development logout -->
          <!--<button type="button"
                  class="dev-logout-button"
                  aria-label="Logout"
                  title="Logout"
                  @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
          </button>-->
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Back, SwitchButton } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';
import CameraApp from '@/components/mycamera';
import { checkin } from '@/api/customer';
import { unformatPhone } from '@/utils/phone';

import logo from '@/assets/logo.png';

const userStore = useUserStore();
const checkInFormRef = ref(null);
const cameraAppRef = ref(null);
const loading = ref(false);
const capturedImage = ref(null);
const matchedCustomer = ref(null);
const showCustomer = ref(false);
let customerPreviewTimer = null;

const checkInForm = reactive({ phone: '' });

const phoneDigits = computed(() =>
        String(checkInForm.phone || '').replace(/\D/g, '').slice(0, 10)
);

const phoneDisplay = computed(() => {
        const digits = phoneDigits.value;
        const area = digits.slice(0, 3).padEnd(3, '•');
        const prefix = digits.slice(3, 6).padEnd(3, '•');
        const line = digits.slice(6, 10).padEnd(4, '•');
        return `(${area}) ${prefix}-${line}`;
});

const matchedCustomerName = computed(() => {
        const first = String(matchedCustomer.value?.firstname || '').trim();
        const last = String(matchedCustomer.value?.lastname || '').trim();
        return `${first} ${last}`.trim() || 'Customer';
});

const matchedCustomerInitials = computed(() => {
        const first = String(matchedCustomer.value?.firstname || '').trim();
        const last = String(matchedCustomer.value?.lastname || '').trim();
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'C';
});

const formRules = computed(() => ({
        phone: [{
          trigger: ['change'],
          validator: (_rule, value, callback) => {
            const digits = String(value || '').replace(/\D/g, '');
            if (!digits.length) return callback(new Error('Customer phone is required.'));
            if (digits.length !== 10) return callback(new Error('Enter a valid 10-digit phone number.'));
            callback();
          }
        }]
}));

function setPhoneFromDigits(digits) {
        const value = String(digits || '').replace(/\D/g, '').slice(0, 10);
        if (value.length <= 3) checkInForm.phone = value ? `(${value}` : '';
        else if (value.length <= 6) checkInForm.phone = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        else checkInForm.phone = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
}

function appendDigit(number) {
        if (loading.value || showCustomer.value || phoneDigits.value.length >= 10) return;
        setPhoneFromDigits(`${phoneDigits.value}${number}`);
        checkInFormRef.value?.clearValidate?.('phone');
}

function deleteDigit() {
        if (loading.value || showCustomer.value || !phoneDigits.value.length) return;
        setPhoneFromDigits(phoneDigits.value.slice(0, -1));
        checkInFormRef.value?.clearValidate?.('phone');
}

function handleCapturedImage(image) {
        capturedImage.value = image;
}

async function submitForm() {
        if (loading.value || showCustomer.value) return;

        try {
          if (!userStore.hasfaceallowed) {
            if (!checkInFormRef.value) return;
            await checkInFormRef.value.validate();
          }

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
            const imageFile = new File(
              [capturedImage.value],
              `checkin-${Date.now()}.png`,
              { type: capturedImage.value.type || 'image/png' }
            );
            formData.append('image', imageFile);
          }

          formData.append('checkindata', JSON.stringify(payload));
          const response = await checkin(formData);

          if (!response || response.success === false || response.code !== 20000) {
            throw new Error(response?.message || 'Customer verification failed.');
          }

          ElMessage.success('Customer checked in successfully.');
          showMatchedCustomer(response?.data || null);
        } catch (error) {
          if (error?.fields) return;

          const status = Number(error?.response?.status || 0);
          const message =
            error?.response?.data?.message ||
            error?.message ||
            'Unable to complete customer verification.';

          ElMessage.error(message);

          const blockedCustomer =
            status === 403 &&
            (
              message.toLowerCase().includes('inactive') ||
              message.toLowerCase().includes('blacklisted') ||
              message.toLowerCase().includes('verification')
            );

          if (blockedCustomer) {
            resetForm();
          }
        } finally {
          loading.value = false;
        }
}

function showMatchedCustomer(customer) {
        if (customerPreviewTimer) {
          clearTimeout(customerPreviewTimer);
          customerPreviewTimer = null;
        }

        matchedCustomer.value = customer || {};
        showCustomer.value = true;

        customerPreviewTimer = window.setTimeout(() => {
          showCustomer.value = false;
          matchedCustomer.value = null;
          resetForm();
          customerPreviewTimer = null;
        }, 5000);
}

onBeforeUnmount(() => {
        if (customerPreviewTimer) {
          clearTimeout(customerPreviewTimer);
          customerPreviewTimer = null;
        }
});

async function handleLogout() {
        await userStore.logout();
}

function resetForm() {
        capturedImage.value = null;
        checkInForm.phone = '';
        nextTick(() => {
          checkInFormRef.value?.clearValidate?.();
          cameraAppRef.value?.reset?.();
        });
}
</script>

<style lang="scss" scoped>
  .customer-checkin-container {
    position: relative;
    width: 100%;
    height: 100dvh;
    min-height: 100vh;
    overflow: hidden;
    background: linear-gradient(135deg, #09090b 0%, #18181b 45%, #27272a 100%);
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .background-effects {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .bg-logo {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 520px;
    max-width: 60vw;
    transform: translate(-50%, -50%);
    opacity: .02;
    pointer-events: none;
    user-select: none;
    z-index: 1;
    filter: drop-shadow(0 0 20px rgba(255,255,255,.08));
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size: 50px 50px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,.8), transparent);
    animation: gridMove 18s linear infinite;
  }

  @keyframes gridMove {
    from {
      transform: translateY(0);
    }

    to {
      transform: translateY(50px);
    }
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(4px);
    opacity: .45;
  }

  .orb-one {
    width: 420px;
    height: 420px;
    top: -140px;
    left: -100px;
    background: radial-gradient(circle, #887baf 0%, transparent 68%);
    animation: floatOne 9s ease-in-out infinite;
  }

  .orb-two {
    width: 500px;
    height: 500px;
    right: -170px;
    bottom: -180px;
    background: radial-gradient(circle, #887baf 0%, transparent 70%);
    animation: floatTwo 12s ease-in-out infinite;
  }

  .orb-three {
    width: 350px;
    height: 350px;
    left: 40%;
    top: 35%;
    background: radial-gradient(circle, #887baf 0%, transparent 70%);
    opacity: .25;
    animation: floatThree 8s ease-in-out infinite;
  }

  @keyframes floatOne {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }

    50% {
      transform: translate(55px, 35px) scale(1.08);
    }
  }

  @keyframes floatTwo {
    0%, 100% {
      transform: translate(0, 0);
    }

    50% {
      transform: translate(-50px, -35px);
    }
  }

  @keyframes floatThree {
    0%, 100% {
      transform: translateY(0);
    }

    50% {
      transform: translateY(-35px);
    }
  }

  .checkin-layout {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100dvh;
    min-height: 100vh;
  }

  .verification-panel {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 40px;
  }

  .verification-card {
    position: relative;
    width: 100%;
    max-width: 430px;
    box-sizing: border-box;
    padding: 42px;
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 24px;
    background: rgba(255,255,255,.94);
    box-shadow: 0 35px 80px rgba(0,0,0,.35);
    backdrop-filter: blur(25px);
    animation: loginCardEnter .9s .12s cubic-bezier(.16,1,.3,1) both;
  }

  @keyframes loginCardEnter {
    from {
      opacity: 0;
      transform: translateY(45px) scale(.96);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .mini-logo {
    width: 43px;
    height: 43px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 27px;
    border-radius: 13px;
    background: linear-gradient(135deg, #887baf, #4a3c73);
    box-shadow: 0 10px 25px rgba(124,58,237,.3);
  }

    .mini-logo span {
      width: 14px;
      height: 14px;
      border: 3px solid #fff;
      border-radius: 4px;
      transform: rotate(45deg);
      animation: logoRotate 5s linear infinite;
    }

  @keyframes logoRotate {
    from {
      transform: rotate(45deg);
    }

    to {
      transform: rotate(405deg);
    }
  }

  .signin-label {
    display: block;
    margin-bottom: 8px;
    color: #887baf;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
  }

  .verification-card-header h2 {
    margin: 0;
    color: #18181b;
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -1px;
  }

  .verification-card-header p {
    margin: 8px 0 30px;
    color: #71717a;
    font-size: 13px;
  }

  .phone-form-item {
    margin-bottom: 12px;
  }

    .phone-form-item :deep(.el-form-item__content) {
      display: block;
    }

  .phone-display {
    width: 100%;
    padding: 12px 10px;
    box-sizing: border-box;
    border: 1px solid #e4e4e7;
    border-radius: 12px;
    background: #fafafa;
    color: #71717a;
    text-align: center;
    font-size: 25px;
    font-weight: 650;
    letter-spacing: 1.5px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

    .phone-display.complete {
      border-color: #887baf;
      color: #27272a;
      box-shadow: 0 0 0 4px rgba(136,123,175,.09);
    }

  .checkin-form {
    display: flex;
    flex-direction: column;
  }

  .customer-flip-scene {
    position: relative;
    width: 100%;
    min-height: 294px;
    perspective: 1200px;
    margin-bottom: 14px;
  }

  .customer-flip-inner {
    position: relative;
    width: 100%;
    min-height: 294px;
    transform-style: preserve-3d;
    transition: transform .6s cubic-bezier(.16,1,.3,1);
  }

  .customer-flip-scene.flipped .customer-flip-inner {
    transform: rotateY(180deg);
  }

  .customer-flip-face {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .customer-flip-back {
    transform: rotateY(180deg);
  }

  .keypad {
    width: 360px;
    max-width: 100%;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    justify-items: center;
    gap: 14px 28px;
  }

  .key,
  .key-spacer {
    width: 60px;
    height: 60px;
  }

  .key {
    padding: 0;
    border: 1px solid #dddde3;
    border-radius: 50%;
    background: #fff;
    color: #18181b;
    box-shadow: 0 5px 14px rgba(24,24,27,.035);
    font-size: 31px;
    font-weight: 500;
    cursor: pointer;
    touch-action: manipulation;
    transition: transform .12s ease, background .12s ease, box-shadow .12s ease;
  }

    .key:active {
      transform: scale(.94);
      background: #f4f4f5;
      box-shadow: none;
    }

  .key-delete {
    border-color: transparent;
    background: transparent;
    box-shadow: none;
    color: #52525b;
    font-size: 23px;
  }

  .customer-preview {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .customer-avatar {
    width: 168px;
    height: 168px;
    display: grid;
    place-items: center;
    overflow: hidden;
    margin-bottom: 16px;
    border: 5px solid #fff;
    border-radius: 28px;
    background: linear-gradient(135deg, #d9d5e7, #b9b0d1);
    color: #4a3c73;
    box-shadow: 0 18px 38px rgba(74,60,115,.20);
    font-size: 48px;
    font-weight: 800;
  }

    .customer-avatar img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }

  .customer-preview strong {
    color: #18181b;
    font-size: 24px;
    line-height: 1.2;
  }

  .customer-preview small {
    margin-top: 5px;
    color: #71717a;
    font-size: 13px;
  }

  .customer-preview-timer {
    margin-top: 12px;
    color: #887baf;
    font-size: 11px;
    font-weight: 700;
  }

  .camera-frame {
    width: 100%;
    aspect-ratio: 4 / 3;
    max-height: 330px;
    margin-bottom: 18px;
    overflow: hidden;
    border-radius: 12px;
    background: #09090b;
  }

    .camera-frame :deep(.camera-container),
    .camera-frame :deep(.camera-custom) {
      width: 100% !important;
      height: 100% !important;
    }

  .checkin-button {
    width: 100%;
    height: 52px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #887baf, #4a3c73);
    font-weight: 700;
    box-shadow: 0 14px 30px rgba(124,58,237,.25);
  }

  .button-arrow {
    display: inline-block;
    margin-left: 7px;
  }

  .checkin-bottom-text {
    margin-top: 27px;
    text-align: center;
    color: #a1a1aa;
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .dev-logout-button {
    position: absolute;
    left: 50%;
    bottom: 10px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #a1a1aa;
    font-size: 15px;
    cursor: pointer;
    transform: translateX(-50%);
  }

  @media (min-width: 430px) and (max-width: 450px) and (orientation: portrait) {
    .verification-panel {
      padding: 20px;
    }
  }

  @media (max-width: 430px) {

    .verification-panel {
      padding: 20px;
    }

    .verification-card-header h2 {
      font-size: 20px;
    }
  }
  /* ONLY responsive rule for now: iPad Mini portrait 768 x 1024 class */
  @media (min-width: 700px) and (max-width: 820px) and (orientation: portrait) {
    .verification-panel {
      padding: 24px;
    }

    .verification-card {
      width: min(88vw, 700px);
      max-width: none;
      height: min(90dvh, 920px);
      max-height: calc(100dvh - 48px);
      padding: 38px 44px 58px;
      border-radius: 26px;
    }

    .mini-logo {
      width: 56px;
      height: 56px;
      margin-bottom: 20px;
    }

    .verification-card-header h2 {
      font-size: 36px;
    }

    .verification-card-header p {
      margin: 7px 0 20px;
      font-size: 16px;
    }

    .signin-label {
      font-size: 11px;
    }

    .phone-display {
      padding: 12px 12px;
      font-size: 36px;
    }

    .customer-flip-scene,
    .customer-flip-inner {
      min-height: 500px;
    }

    .keypad {
      width: min(500px, 72vw);
      gap: 16px 46px;
    }

    .key,
    .key-spacer {
      width: 104px;
      height: 104px;
    }

    .key {
      font-size: 36px;
    }

    .key-delete {
      font-size: 28px;
    }

    .checkin-button {
      height: 58px;
      font-size: 17px;
    }

    .checkin-bottom-text {
      margin-top: 18px;
      font-size: 10px;
    }

    .dev-logout-button {
      bottom: 7px;
    }
  }


  /* iPad Pro 13 portrait 1032 x 1376
     Proportionally scaled from the 768 x 1024 iPad Mini layout. */
  @media (min-width: 1000px) and (max-width: 1060px) and (orientation: portrait) {
    .verification-panel {
      padding: 32px;
    }

    .verification-card {
      width: min(88vw, 941px);
      max-width: none;
      height: min(90dvh, 1236px);
      max-height: calc(100dvh - 64px);
      padding: 51px 59px 78px;
      border-radius: 35px;
    }

    .mini-logo {
      width: 75px;
      height: 75px;
      margin-bottom: 27px;
    }

    .verification-card-header h2 {
      font-size: 48px;
    }

    .verification-card-header p {
      margin: 9px 0 27px;
      font-size: 22px;
    }

    .signin-label {
      font-size: 15px;
    }

    .phone-display {
      padding: 30px 16px;
      font-size: 50px;
    }

    .customer-flip-scene,
    .customer-flip-inner {
      min-height: 672px;
    }

    .keypad {
      width: min(672px, 72vw);
      gap: 22px 62px;
    }

    .key,
    .key-spacer {
      width: 140px;
      height: 140px;
    }

    .key {
      font-size: 48px;
    }

    .key-delete {
      font-size: 38px;
    }

    .checkin-button {
      height: 78px;
      font-size: 23px;
    }

    .checkin-bottom-text {
      margin-top: 24px;
      font-size: 13px;
    }

    .dev-logout-button {
      bottom: 9px;
    }
  }
</style>
