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
      <section class="welcome-panel">
        <div class="brand-badge">
          <span class="brand-dot"></span>
          CUSTOMER CHECK-IN
        </div>

        <div class="welcome-content">
          <h1>
            Welcome
            <span>In.</span>
          </h1>
          <p>
            Check in quickly and securely before you start playing.
            Use your registered phone number or face verification when enabled.
          </p>

          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">01</span>
              <div>
                <strong>Quick Check-In</strong>
                <small>Get checked in in just a few seconds</small>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">02</span>
              <div>
                <strong>Secure Verification</strong>
                <small>Verify using your registered account information</small>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">03</span>
              <div>
                <strong>Ready to Play</strong>
                <small>Complete check-in and enjoy your visit</small>
              </div>
            </div>
          </div>
        </div>

        <div class="welcome-footer">Secure Customer Check-In</div>
      </section>

      <section class="verification-panel">
        <div class="verification-card">
          <div class="verification-card-header">
            <div class="mini-logo"><span></span></div>
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

              <el-button native-type="submit"
                         :loading="loading"
                         :disabled="phoneDigits.length !== 10"
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
          <button type="button"
                  class="dev-logout-button"
                  aria-label="Logout"
                  title="Logout"
                  @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue';
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
  if (loading.value || phoneDigits.value.length >= 10) return;
  setPhoneFromDigits(`${phoneDigits.value}${number}`);
  checkInFormRef.value?.clearValidate?.('phone');
}

function deleteDigit() {
  if (loading.value || !phoneDigits.value.length) return;
  setPhoneFromDigits(phoneDigits.value.slice(0, -1));
  checkInFormRef.value?.clearValidate?.('phone');
}

function handleCapturedImage(image) {
  capturedImage.value = image;
}

async function submitForm() {
  if (loading.value) return;

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
    resetForm();
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

  .bg-logo {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 520px;
    max-width: 60vw;
    transform: translate(-50%, -50%);
    opacity: 0.02;
    pointer-events: none;
    user-select: none;
    z-index: 1;
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.08));
  }

  .customer-checkin-container {
    position: relative;
    width: 100%;
    min-height: 100vh;
    overflow: hidden;
    background: linear-gradient( 135deg, #09090b 0%, #18181b 45%, #27272a 100% );
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  /* =========================================
       BACKGROUND
    ========================================= */

  .background-effects {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient( rgba(255,255,255,0.03) 1px, transparent 1px ), linear-gradient( 90deg, rgba(255,255,255,0.03) 1px, transparent 1px );
    background-size: 50px 50px;
    mask-image: linear-gradient( to bottom, rgba(0,0,0,0.8), transparent );
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

  /* =========================================
       FLOATING ORBS
    ========================================= */

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(4px);
    opacity: 0.45;
  }

  .orb-one {
    width: 420px;
    height: 420px;
    top: -140px;
    left: -100px;
    background: radial-gradient( circle, #887baf 0%, transparent 68% );
    animation: floatOne 9s ease-in-out infinite;
  }

  .orb-two {
    width: 500px;
    height: 500px;
    right: -170px;
    bottom: -180px;
    background: radial-gradient( circle, #887baf 0%, transparent 70% );
    animation: floatTwo 12s ease-in-out infinite;
  }

  .orb-three {
    width: 350px;
    height: 350px;
    left: 40%;
    top: 35%;
    background: radial-gradient( circle, #887baf 0%, transparent 70% );
    opacity: 0.25;
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

  /* =========================================
       LAYOUT
    ========================================= */

  .checkin-layout {
    position: relative;
    z-index: 2;
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(420px, 1.15fr) minmax(420px, 0.85fr);
  }

  /* =========================================
       LEFT PANEL
    ========================================= */

  .welcome-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 55px 70px;
    color: #fff;
    animation: welcomeEnter 0.9s cubic-bezier(.16,1,.3,1);
  }

  @keyframes welcomeEnter {
    from {
      opacity: 0;
      transform: translateX(-45px);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .brand-badge {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    gap: 9px;
    padding: 8px 13px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 100px;
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(10px);
    color: #d4d4d8;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }

  .brand-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #8b5cf6;
    box-shadow: 0 0 0 5px rgba(139,92,246,0.15);
    animation: pulseDot 2s infinite;
  }

  @keyframes pulseDot {
    0% {
      box-shadow: 0 0 0 0 rgba(139,92,246,0.5);
    }

    70% {
      box-shadow: 0 0 0 10px rgba(139,92,246,0);
    }

    100% {
      box-shadow: 0 0 0 0 rgba(139,92,246,0);
    }
  }

  .welcome-content {
    margin: auto 0;
    max-width: 620px;
  }

    .welcome-content h1 {
      margin: 0;
      font-size: clamp(55px, 6vw, 92px);
      line-height: 0.95;
      font-weight: 700;
      letter-spacing: -4px;
      color: #fafafa;
    }

      .welcome-content h1 span {
        display: block;
        background: linear-gradient( 90deg, #887baf, #4a3c73 );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

    .welcome-content > p {
      max-width: 500px;
      margin: 28px 0 38px;
      color: #a1a1aa;
      font-size: 15px;
      line-height: 1.8;
    }

  /* =========================================
       FEATURES
    ========================================= */

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 14px;
    width: fit-content;
    min-width: 300px;
    padding: 12px 15px;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    background: rgba(255,255,255,0.035);
    transition: transform 0.25s ease, background 0.25s ease;
  }

    .feature-item:hover {
      transform: translateX(8px);
      background: rgba(255,255,255,0.07);
    }

  .feature-icon {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: rgba(124,58,237,0.18);
    color: #a78bfa;
    font-size: 10px;
    font-weight: 700;
  }

  .feature-item strong {
    display: block;
    color: #e4e4e7;
    font-size: 12px;
  }

  .feature-item small {
    display: block;
    margin-top: 2px;
    color: #71717a;
    font-size: 10px;
  }

  .welcome-footer {
    color: #52525b;
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* =========================================
       RIGHT PANEL
    ========================================= */

  .verification-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }

  .verification-card {
    width: 100%;
    max-width: 430px;
    padding: 42px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 24px;
    background: rgba(255,255,255,0.94);
    box-shadow: 0 35px 80px rgba(0,0,0,0.35);
    backdrop-filter: blur(25px);
    animation: loginCardEnter 0.9s 0.12s cubic-bezier(.16,1,.3,1) both;
  }

  @keyframes loginCardEnter {
    from {
      opacity: 0;
      transform: translateY(45px) scale(0.96);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* =========================================
       LOGIN HEADER
    ========================================= */

  .mini-logo {
    width: 43px;
    height: 43px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 27px;
    border-radius: 13px;
    background: linear-gradient( 135deg, #887baf, #4a3c73 );
    box-shadow: 0 10px 25px rgba(124,58,237,0.3);
  }

    .mini-logo span {
      width: 14px;
      height: 14px;
      border: 3px solid white;
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

  /* =========================================
       INPUT
    ========================================= */

  .login-field {
    height: 58px;
    display: flex;
    border: 1px solid #e4e4e7;
    border-radius: 12px;
    background: #fafafa;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }

    .login-field:focus-within {
      border-color: #8b5cf6;
      background: white;
      box-shadow: 0 0 0 4px rgba(139,92,246,0.09);
      transform: translateY(-1px);
    }

  .svg-container {
    width: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a1a1aa;
    font-size: 17px;
  }

  .show-pwd {
    position: absolute;
    right: 16px;
    top: 18px;
    color: #a1a1aa;
    cursor: pointer;
    transition: color 0.2s ease, transform 0.2s ease;
  }

    .show-pwd:hover {
      color: #887baf;
      transform: scale(1.08);
    }

  /* =========================================
       OPTIONS
    ========================================= */

  .login-options {
    display: flex;
    justify-content: space-between;
    margin: -3px 2px 22px;
    color: #a1a1aa;
    font-size: 10px;
  }

  .secure-dot {
    color: #16a34a;
  }

  /* =========================================
       LOGIN BUTTON
    ========================================= */

  .checkin-button {
    width: 100%;
    height: 52px;
    border: none;
    border-radius: 12px;
    background: linear-gradient( 135deg, #887baf, #4a3c73 );
    font-weight: 700;
    letter-spacing: 0.2px;
    box-shadow: 0 14px 30px rgba(124,58,237,0.25);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

    .checkin-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 35px rgba(124,58,237,0.35);
    }

    .checkin-button:active {
      transform: translateY(0);
    }

  .button-arrow {
    display: inline-block;
    margin-left: 7px;
    transition: transform 0.2s ease;
  }

  .checkin-button:hover
  .button-arrow {
    transform: translateX(5px);
  }

  .checkin-bottom-text {
    margin-top: 27px;
    text-align: center;
    color: #a1a1aa;
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* =========================================
       TABLET
    ========================================= */

  @media (max-width: 950px) {

    .checkin-layout {
      grid-template-columns: 1fr;
    }

    .welcome-panel {
      display: none;
    }

    .verification-panel {
      min-height: 100vh;
    }
  }

  /* =========================================
       MOBILE
    ========================================= */

  @media (max-width: 520px) {

    .verification-panel {
      padding: 18px;
    }

    .verification-card {
      padding: 34px 24px;
      border-radius: 20px;
    }

    .verification-card-header h2 {
      font-size: 26px;
    }
  }

  /* =========================================
       REDUCED MOTION
    ========================================= */

  @media ( prefers-reduced-motion: reduce ) {

    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Check-in specific additions */
  .customer-checkin-container {
    position: relative;
    width: 100%;
    height: 100dvh;
    min-height: 100vh;
    overflow: hidden;
    background: linear-gradient(135deg, #09090b 0%, #18181b 45%, #27272a 100%);
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .checkin-layout {
    height: 100dvh;
    min-height: 100vh;
  }

  .verification-card {
    position: relative;
    max-width: 430px;
    box-sizing: border-box;
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
    transition: color .2s ease, background .2s ease;
  }

    .dev-logout-button:hover {
      color: #887baf;
      background: rgba(136,123,175,.08);
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

  .keypad {
    width: 330px;
    max-width: 100%;
    margin: 0 auto 14px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    justify-items: center;
    gap: 7px 16px;
  }

  .key,
  .key-spacer {
    width: 70px;
    height: 70px;
  }

  .key {
    padding: 0;
    border: 1px solid #e4e4e7;
    border-radius: 50%;
    background: #f4f4f5;
    color: #27272a;
    font-size: 28px;
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
    transition: transform .12s ease, background .12s ease;
  }

    .key:active {
      transform: scale(.94);
      background: #e9e7ef;
    }

  .key-delete {
    border-color: transparent;
    background: transparent;
    color: #52525b;
    font-size: 20px;
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
  }

  @media (max-height: 760px) and (min-width: 951px) {
    .welcome-panel {
      padding-top: 34px;
      padding-bottom: 34px;
    }

    .welcome-content h1 {
      font-size: clamp(48px, 5vw, 72px);
    }

    .welcome-content > p {
      margin: 18px 0 24px;
    }

    .feature-list {
      gap: 8px;
    }

    .feature-item {
      padding: 9px 13px;
    }

    .verification-card {
      padding: 28px 34px;
    }

    .verification-card-header p {
      margin-bottom: 18px;
    }
  }

  @media (max-width: 950px) {
    .customer-checkin-container,
    .checkin-layout {
      height: 100dvh;
      min-height: 0;
    }

    .verification-panel {
      min-height: 100dvh;
      padding: 14px;
      box-sizing: border-box;
    }

    .verification-card {
      max-height: calc(100dvh - 28px);
      padding: clamp(20px, 3vh, 34px) 28px;
      overflow: hidden;
    }

    .verification-card-header p {
      margin-bottom: clamp(12px, 2vh, 22px);
    }

    .keypad {
      gap: clamp(5px, 1vh, 8px) 16px;
      margin-bottom: clamp(8px, 1.5vh, 14px);
    }

    .key,
    .key-spacer {
      width: clamp(58px, 9vh, 72px);
      height: clamp(58px, 9vh, 72px);
    }
  }

  @media (max-width: 520px) {
    .verification-panel {
      padding: 8px;
    }

    .verification-card {
      width: 100%;
      max-height: calc(100dvh - 16px);
      padding: 18px 20px;
    }

    .mini-logo {
      margin-bottom: 12px;
    }

    .verification-card-header h2 {
      font-size: 24px;
    }

    .verification-card-header p {
      margin: 5px 0 12px;
    }

    .phone-display {
      padding: 9px;
      font-size: 22px;
    }

    .keypad {
      margin-bottom: 8px;
    }

    .key, .key-spacer {
      width: clamp(56px, 8.8vh, 68px);
      height: clamp(56px, 8.8vh, 68px);
    }

    .key {
      font-size: 27px;
    }

    .checkin-bottom-text {
      margin-top: 12px;
    }
  }
</style>
