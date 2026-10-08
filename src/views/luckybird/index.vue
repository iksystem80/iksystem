<template>
  <div ref="bonusPageRef" class="app-container bonus-give-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Lucky Bird</h2>
        <p>
          {{
            step === 1
              ? 'Scan or enter the machine number.'
              : step === 2
                ? 'Select the Lucky Bird denomination.'
                : 'Select the customer and capture the Lucky Bird photo.'
          }}
        </p>
      </div>
    </div>

    <el-card shadow="never" class="employee-banner">
      <div class="employee-header">
        <div class="employee-profile">
          <el-avatar :size="54" :src="userStore.avatar || undefined">
            {{ employeeInitials }}
          </el-avatar>
          <div class="employee-profile-text">
            <h2>{{ employeeName }}</h2>
            <div class="employee-period">
              Current Employee
            </div>
          </div>
        </div>
        <div class="employee-right">
          <div>
            <span>Current Time</span>
            <strong>{{ currentTime }}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>Online</strong>
          </div>
        </div>
      </div>
    </el-card>

    <el-alert v-if="!state.cashReady"
              class="cash-alert"
              type="warning"
              :closable="false"
              show-icon
              title="Opening Bank must be available before a Lucky Bird can be paid." />

    <Transition name="step-fade" mode="out-in">
      <!-- STEP 1 -->
      <el-card v-if="step === 1"
               key="scan"
               shadow="never"
               class="main-card scan-card">
        <div class="scan-stage">
          <div class="nfc-animation" :class="{ scanning: nfcScanning }">
            <div class="phone">
              <el-icon><Cellphone /></el-icon>
            </div>

            <span class="wave wave-1"></span>
            <span class="wave wave-2"></span>
            <span class="wave wave-3"></span>
          </div>

          <h3>
            {{ nfcScanning ? 'Hold phone near machine NFC tag' : 'Ready to Scan' }}
          </h3>

          <p class="scan-status">
            {{ nfcScanning ? 'Waiting for NFC...' : 'NFC scan is not active.' }}
          </p>

          <el-button v-if="!nfcScanning"
                     type="primary"
                     size="large"
                     class="scan-again"
                     @click="scanNfc">
            <el-icon><Connection /></el-icon>
            Start NFC Scan
          </el-button>
        </div>

        <div class="manual-divider">
          <span>OR ENTER MANUALLY</span>
        </div>

        <div class="manual-box">
          <label class="input-label">Machine #</label>

          <div class="machine-input-row">
            <el-input v-model="machineNumber"
                      inputmode="numeric"
                      placeholder="Enter machine #"
                      clearable
                      @keyup.enter="findMachine"
                      @clear="clearMachine" />

            <el-button type="primary"
                       :loading="machineLoading"
                       @click="findMachine">
              Find
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- STEP 2 -->
      <div v-else-if="step === 2"
           key="denomination"
           class="details-page">
        <div class="summary-row">
          <div class="value-box">
            <small>MACHINE</small>
            <strong>#{{ machine?.machineNumber }}</strong>
          </div>

          <div class="value-box">
            <small>AVAILABLE CASH</small>
            <strong>{{ money(state.balance) }}</strong>
          </div>
        </div>

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div>
              <strong>Lucky Bird Denomination</strong>
              <div class="small-text">
                Select the amount to give.
              </div>
            </div>
          </template>

          <div class="bonus-choice-grid">
            <button v-for="amount in denominations"
                    :key="amount"
                    type="button"
                    class="bonus-choice-card"
                    :disabled="amount > Number(state.balance)"
                    @click="selectDenomination(amount)">
              <div class="bonus-choice-main">
                <strong>{{ money(amount) }}</strong>
                <span>Lucky Bird</span>
              </div>

              <div class="bonus-choice-amount">
                {{ money(amount) }}
              </div>

              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
        </el-card>
      </div>

      <!-- STEP 3 -->
      <div v-else
           key="details"
           class="details-page">
        <div class="summary-row">
          <div class="value-box">
            <small>MACHINE</small>
            <strong>#{{ machine?.machineNumber }}</strong>
          </div>

          <div class="value-box">
            <small>LUCKY BIRD AMOUNT</small>
            <strong>{{ selectedAmount ? money(selectedAmount) : '—' }}</strong>
          </div>
        </div>

        <el-row :gutter="16">
          <el-col :xs="24" :md="10">
            <el-card shadow="never" class="detail-card">
              <template #header>
                <div>
                  <strong>Lucky Bird Details</strong>
                  <div class="small-text">
                    Select the customer for this Lucky Bird.
                  </div>
                </div>
              </template>

              <el-form label-position="top">
                <el-form-item label="Customer">
                  <el-select v-model="customerId"
                             filterable
                             clearable
                             placeholder="Select customer"
                             style="width:100%"
                             :loading="customersLoading">
                    <el-option v-for="customer in customers"
                               :key="customer.id"
                               :label="`${customer.firstname || ''} ${customer.lastname || ''}`.trim()"
                               :value="Number(customer.id)" />
                  </el-select>
                </el-form-item>

                <div class="bonus-detail-line">
                  <span>Machine</span>
                  <strong>#{{ machine?.machineNumber }}</strong>
                </div>

                <div class="bonus-detail-line">
                  <span>Available cash</span>
                  <strong>{{ money(state.balance) }}</strong>
                </div>
              </el-form>
            </el-card>
          </el-col>

          <el-col :xs="24" :md="14">
            <el-card shadow="never" class="detail-card camera-card">
              <template #header>
                <div>
                  <strong>Lucky Bird Photo</strong>
                  <div class="small-text">
                    Capture the machine screen showing the Lucky Bird payout.
                  </div>
                </div>
              </template>

              <div v-if="photoPreview" class="photo-preview">
                <img :src="photoPreview" alt="Lucky Bird machine screen">
                <el-button @click="retakePhoto">
                  Retake Photo
                </el-button>
              </div>

              <div v-else class="camera-frame">
                <CameraApp ref="cameraRef"
                           shape="custom"
                           width="100%"
                           height="375px"
                           border-radius="0 0 2% 2%"
                           @captured="handleCapturedImage" />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </Transition>

    <Transition name="action-bar-fade">
      <div v-if="step > 1"
           class="fixed-actions"
           :style="actionBarStyle">
        <div class="action-inner">
          <div class="action-left">
            <el-button :disabled="saving"
                       @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              Back
            </el-button>
          </div>

          <div class="action-right">
            <el-button v-if="step === 3"
                       type="success"
                       :loading="saving"
                       :disabled="!canSubmit"
                       @click="submitLuckyBird">
              Save & Finish
            </el-button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import {
            computed,
            nextTick,
            onBeforeUnmount,
            onMounted,
            reactive,
            ref
} from 'vue';
import { ElMessage } from 'element-plus';
import { Capacitor } from '@capacitor/core';
import { CapacitorNfc } from '@capgo/capacitor-nfc';
import { useUserStore } from '@/store/modules/user';
import CameraApp from '@/components/mycamera';
import { getcustomers } from '@/api/customer';
import {
            getLuckyBirdGiveMachine,
            getLuckyBirdGiveState,
            saveLuckyBirdAward
} from '@/api/luckybird';

const userStore = useUserStore();
const employeeName = computed(() =>
            userStore.userInfo?.name || userStore.name || userStore.user?.name || 'Employee'
);
const employeeInitials = computed(() =>
            String(employeeName.value || 'E')
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map(part => part[0])
              .join('')
              .toUpperCase()
);
const currentTime = ref('');

const bonusPageRef = ref(null);
const cameraRef = ref(null);

const step = ref(1);

const state = reactive({
            sessionId: null,
            locationId: null,
            balance: 0,
            cashReady: false
});

const machineNumber = ref('');
const machine = ref(null);

const denominations = [10, 15, 20];
const selectedAmount = ref(null);

const customers = ref([]);
const customersLoading = ref(false);
const customerId = ref(null);

const photoFile = ref(null);
const photoPreview = ref('');

const machineLoading = ref(false);
const nfcScanning = ref(false);
const saving = ref(false);

const actionBarStyle = ref({
            left: '0px',
            width: '100%'
});

let nfcListener = null;
let nfcSessionEndListener = null;
let actionBarResizeObserver = null;
let actionBarFrame = 0;
let currentTimeTimer = null;

const canSubmit = computed(() =>
            Boolean(
              machine.value &&
              selectedAmount.value &&
              customerId.value &&
              photoFile.value &&
              state.cashReady &&
              Number(selectedAmount.value) > 0 &&
              Number(selectedAmount.value) <= Number(state.balance)
            )
);

function money(value) {
            return Number(value || 0).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD'
            });
}

function updateClock() {
            currentTime.value = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
}

function updateActionBarPosition() {
            if (!bonusPageRef.value) return;

            const rect = bonusPageRef.value.getBoundingClientRect();

            actionBarStyle.value = {
              left: `${rect.left}px`,
              width: `${rect.width}px`
            };
}

function scheduleActionBarUpdate() {
            cancelAnimationFrame(actionBarFrame);
            actionBarFrame = requestAnimationFrame(updateActionBarPosition);
}

async function loadState() {
            try {
              const response = await getLuckyBirdGiveState();
              Object.assign(state, response.data || {});
            } catch (error) {
              ElMessage.error(
                error?.response?.data?.message ||
                error?.message ||
                'Unable to load Lucky Bird status.'
              );
            }
}

async function loadCustomers() {
            customersLoading.value = true;

            try {
              const response = await getcustomers(userStore.locationId);
              customers.value = Array.isArray(response.data)
                ? response.data
                : [];
            } catch (error) {
              customers.value = [];

              ElMessage.error(
                error?.response?.data?.message ||
                error?.message ||
                'Unable to load customers.'
              );
            } finally {
              customersLoading.value = false;
            }
}

function clearMachine() {
            machine.value = null;
}

async function findMachine() {
            const number = String(machineNumber.value || '').trim();

            if (!number) {
              return ElMessage.warning('Enter a machine number.');
            }

            machineLoading.value = true;
            machine.value = null;

            try {
              const response = await getLuckyBirdGiveMachine(number);

              machine.value = response.data;
              machineNumber.value = String(response.data.machineNumber);

              await openDenominationSelection();
            } catch (error) {
              ElMessage.error(
                error?.response?.data?.message ||
                error?.message ||
                `Machine #${number} was not found.`
              );
            } finally {
              machineLoading.value = false;
            }
}

function decodeNdefRecord(record) {
            const payload = Array.isArray(record?.payload)
              ? record.payload
              : [];

            if (!payload.length) return '';

            try {
              const type = String.fromCharCode(...(record.type || []));

              if (type === 'T') {
                const languageLength = payload[0] & 0x3f;

                return new TextDecoder('utf-8')
                  .decode(new Uint8Array(payload.slice(1 + languageLength)))
                  .trim();
              }

              return new TextDecoder('utf-8')
                .decode(new Uint8Array(payload))
                .trim();
            } catch {
              return '';
            }
}

function machineNumberFromNativeNfc(event) {
            for (const record of event?.tag?.ndefMessage || []) {
              const text = decodeNdefRecord(record);
              const match = text.match(/(?:machine(?:number)?[\s:#=-]*)?(\d+)/i);

              if (match) return match[1];
            }

            return '';
}

async function stopNfcScan() {
            try {
              await CapacitorNfc.stopScanning();
            } catch {
              // No active scan.
            }

            if (nfcListener) {
              await nfcListener.remove();
              nfcListener = null;
            }

            if (nfcSessionEndListener) {
              await nfcSessionEndListener.remove();
              nfcSessionEndListener = null;
            }

            nfcScanning.value = false;
}

async function scanNfc() {
            if (step.value !== 1) return;

            if (!Capacitor.isNativePlatform()) {
              nfcScanning.value = false;
              return;
            }

            try {
              await stopNfcScan();

              const { supported } = await CapacitorNfc.isSupported();

              if (!supported) {
                return ElMessage.warning('NFC is not supported on this device.');
              }

              const { status } = await CapacitorNfc.getStatus();

              if (status === 'NFC_DISABLED') {
                return ElMessage.warning('NFC is turned off. Enable NFC and try again.');
              }

              if (status === 'NO_NFC') {
                return ElMessage.warning('NFC is not available on this device.');
              }

              nfcScanning.value = true;

              nfcListener = await CapacitorNfc.addListener(
                'nfcEvent',
                async event => {
                  const number = machineNumberFromNativeNfc(event);

                  await stopNfcScan();

                  if (!number) {
                    ElMessage.error(
                      'The NFC tag does not contain a machine number.'
                    );

                    await scanNfc();
                    return;
                  }

                  machineNumber.value = number;
                  await findMachine();

                  if (step.value === 1) {
                    await scanNfc();
                  }
                }
              );

              if (Capacitor.getPlatform() === 'ios') {
                nfcSessionEndListener = await CapacitorNfc.addListener(
                  'nfcSessionEnd',
                  ({ reason }) => {
                    nfcScanning.value = false;

                    if (reason === 'sessionTimeout') {
                      ElMessage.warning('No NFC tag detected. Try again.');
                    } else if (reason !== 'userCancelled') {
                      ElMessage.error(
                        'The NFC scan session ended unexpectedly.'
                      );
                    }
                  }
                );
              }

              await CapacitorNfc.startScanning({
                invalidateAfterFirstRead: true,
                alertMessage: 'Hold the device near the machine NFC tag.',
                iosSessionType: 'ndef'
              });
            } catch (error) {
              await stopNfcScan();

              ElMessage.error(
                error?.message ||
                'Unable to scan NFC tag.'
              );
            }
}

async function openDenominationSelection() {
            await stopNfcScan();

            selectedAmount.value = null;
            customerId.value = null;
            clearPhoto();

            step.value = 2;

            await nextTick();
            scheduleActionBarUpdate();
}

async function selectDenomination(amount) {
            const value = Number(amount);

            if (![10, 15, 20].includes(value)) {
              return ElMessage.warning('Select a valid Lucky Bird denomination.');
            }

            if (value > Number(state.balance)) {
              return ElMessage.warning('Insufficient session cash for this denomination.');
            }

            selectedAmount.value = value;
            customerId.value = null;
            clearPhoto();

            step.value = 3;

            await loadCustomers();
            await nextTick();
            scheduleActionBarUpdate();
}

function handleCapturedImage(image) {
            if (!image) return;

            photoFile.value = image;

            if (photoPreview.value) {
              URL.revokeObjectURL(photoPreview.value);
            }

            photoPreview.value = URL.createObjectURL(image);
}

async function retakePhoto() {
            clearPhoto();

            await nextTick();

            cameraRef.value?.startCamera?.();
}

function clearPhoto() {
            if (photoPreview.value) {
              URL.revokeObjectURL(photoPreview.value);
            }

            photoPreview.value = '';
            photoFile.value = null;
}

async function resetToScan() {
            await stopNfcScan();

            step.value = 1;

            machineNumber.value = '';
            machine.value = null;

            selectedAmount.value = null;

            customerId.value = null;
            customers.value = [];

            clearPhoto();

            await nextTick();
            await scanNfc();
}

async function goBack() {
            if (step.value === 3) {
              customerId.value = null;
              clearPhoto();

              step.value = 2;

              await nextTick();
              scheduleActionBarUpdate();
              return;
            }

            await resetToScan();
}

async function submitLuckyBird() {
            if (!canSubmit.value) return;

            saving.value = true;

            try {
              const form = new FormData();

              form.append('amount', String(selectedAmount.value));
              form.append('machineid', String(machine.value.id));
              form.append('customerid', String(customerId.value));
              form.append(
                'image',
                photoFile.value,
                photoFile.value.name ||
                  `lucky-bird-${machine.value.machineNumber}-${Date.now()}.jpg`
              );

              const response = await saveLuckyBirdAward(form);

              ElMessage.success(
                response.message ||
                'Lucky Bird saved.'
              );

              await loadState();
              await resetToScan();
            } catch (error) {
              ElMessage.error(
                error?.response?.data?.message ||
                error?.message ||
                'Unable to save Lucky Bird.'
              );
            } finally {
              saving.value = false;
            }
}

onMounted(async () => {
            updateClock();
            currentTimeTimer = window.setInterval(updateClock, 1000);

            await loadState();
            await nextTick();

            updateActionBarPosition();

            if (bonusPageRef.value) {
              actionBarResizeObserver =
                new ResizeObserver(scheduleActionBarUpdate);

              actionBarResizeObserver.observe(
                bonusPageRef.value
              );
            }

            window.addEventListener(
              'resize',
              scheduleActionBarUpdate
            );

            window.addEventListener(
              'transitionend',
              scheduleActionBarUpdate
            );

            await scanNfc();
});

onBeforeUnmount(async () => {
            if (currentTimeTimer) window.clearInterval(currentTimeTimer);

            await stopNfcScan();

            actionBarResizeObserver?.disconnect();
            cancelAnimationFrame(actionBarFrame);

            window.removeEventListener(
              'resize',
              scheduleActionBarUpdate
            );

            window.removeEventListener(
              'transitionend',
              scheduleActionBarUpdate
            );

            clearPhoto();
});
</script>
