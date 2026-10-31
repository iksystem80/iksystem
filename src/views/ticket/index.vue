<template>
  <div ref="ticketPageRef" class="app-container bonus-give-page ticketout-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Ticket Out</h2>
        <p>
          {{ step === 1 ? 'Scan or enter the machine number.' : 'Enter payout details and capture the machine screen.' }}
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

    <el-alert v-if="!state.cashReady" class="cash-alert" type="warning" :closable="false" show-icon
              title="Opening Bank must be available before a Ticket Out can be paid." />

    <Transition name="step-fade" mode="out-in">
      <!-- STEP 1 -->
      <el-card v-if="step === 1" key="scan" shadow="never" class="main-card scan-card">
        <div class="scan-stage">
          <div class="nfc-animation" :class="{ scanning: nfcScanning }">
            <div class="phone">
              <el-icon><Cellphone /></el-icon>
            </div>
            <span class="wave wave-1"></span>
            <span class="wave wave-2"></span>
            <span class="wave wave-3"></span>
          </div>

          <h3>{{ nfcScanning ? 'Hold phone near machine NFC tag' : 'Ready to Scan' }}</h3>
          <p class="scan-status">
            {{ nfcScanning ? 'Waiting for NFC...' : 'NFC scan is not active.' }}
          </p>

          <el-button v-if="!nfcScanning" type="primary" size="large" class="scan-again" @click="scanNfc">
            <el-icon><Connection /></el-icon>
            Start NFC Scan
          </el-button>
        </div>

        <div class="manual-divider"><span>OR ENTER MANUALLY</span></div>

        <div class="manual-box">
          <label class="input-label">Machine #</label>
          <div class="machine-input-row">
            <el-input v-model="machineNumber" inputmode="numeric" placeholder="Enter machine #"
                      clearable @keyup.enter="findMachine" @clear="clearMachine" />
            <el-button type="primary" :loading="machineLoading" @click="findMachine">Find</el-button>
          </div>
        </div>
      </el-card>

      <!-- STEP 2 -->
      <div v-else key="details" class="details-page">
        <div class="summary-row">
          <div class="value-box">
            <small>MACHINE</small>
            <strong>#{{ machine?.machineNumber }}</strong>
          </div>
          <div class="value-box">
            <small>TICKET OUT</small>
            <strong>{{ validAmount ? `$${Number(amount).toFixed(2)}` : '—' }}</strong>
          </div>
        </div>

        <el-row :gutter="16">
          <el-col :xs="24" :md="10">
            <el-card shadow="never" class="detail-card">
              <template #header>
                <div>
                  <strong>Ticket Out Details</strong>
                  <div class="small-text">Enter the payout amount and select the customer.</div>
                </div>
              </template>

              <el-form label-position="top">
                <el-form-item label="Cash Out Amount">
                  <el-input v-model="amount" inputmode="decimal" class="money-input" placeholder="0.00">
                    <template #prepend>
                      $
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="Customer">
                  <el-select v-model="customerId" filterable clearable placeholder="Select customer"
                             style="width:100%" :loading="customersLoading">
                    <el-option v-for="customer in customers" :key="customer.id"
                               :label="`${customer.firstname || ''} ${customer.lastname || ''}`.trim()"
                               :value="Number(customer.id)" />
                  </el-select>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>

          <el-col :xs="24" :md="14">
              <el-card shadow="never" class="detail-card camera-card">
                <template #header>
                  <div>
                    <strong>Machine Screen Photo</strong>
                    <div class="small-text">Capture the screen showing the Ticket-Out amount.</div>
                  </div>
                </template>

                <div class="camera-capture-summary">
                  <div v-if="photoPreview" class="camera-capture-preview">
                    <img :src="photoPreview" alt="Machine screen">
                    <div class="camera-capture-preview-info">
                      <strong>Photo captured</strong>
                      <span>Ready to save</span>
                    </div>
                    <el-button @click="retakePhoto">Retake Photo</el-button>
                  </div>

                  <el-button v-else
                             type="primary"
                             class="camera-capture-button"
                             @click="openPhotoDialog">
                    Take Photo
                  </el-button>
                </div>
              </el-card>
          </el-col>
        </el-row>
      </div>
    </Transition>

    <Transition name="action-bar-fade">
      <div v-if="step === 2" class="fixed-actions" :style="actionBarStyle">
        <div class="action-inner">
          <div class="action-left">
            <el-button :disabled="saving" @click="backToScan">
              <el-icon><ArrowLeft /></el-icon>
              <span>Back</span>
            </el-button>
          </div>
          <div class="action-right">
            <el-button type="success" :loading="saving" :disabled="!canSubmit" @click="submitTicketOut">
              Save & Finish
            </el-button>
          </div>
        </div>
      </div>
    </Transition>

    <el-dialog v-model="photoDialogOpen"
               title="Take Ticket-Out Photo"
               width="420px"
               class="extra-match-dialog camera-capture-dialog"
               destroy-on-close
               @closed="closePhotoDialog">
      <div class="extra-match-camera-section">
        <div class="extra-match-photo-box">
          <CameraApp v-if="photoDialogOpen"
                     ref="cameraRef"
                     shape="custom"
                     width="100%"
                     height="100%"
                     border-radius="12px"
                     @captured="handleCapturedImage" />
        </div>
      </div>

      <div class="extra-match-dialog-actions">
        <el-button @click="photoDialogOpen = false">Cancel</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

import { Capacitor } from '@capacitor/core';
import { CapacitorNfc } from '@capgo/capacitor-nfc';
import { useUserStore } from '@/store/modules/user';
import CameraApp from '@/components/mycamera';
import { getcustomers } from '@/api/customer';
import { getTicketOutMachine, getTicketOutState, saveTicketOut } from '@/api/ticketout';

const userStore = useUserStore();
const route = useRoute();
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
const ticketPageRef = ref(null);
const cameraRef = ref(null);
const photoDialogOpen = ref(false);
const step = ref(1);
const state = reactive({ sessionId: null, locationId: null, balance: 0, cashReady: false });
const machineNumber = ref('');
const machine = ref(null);
const amount = ref('');
const customerId = ref(null);
const customers = ref([]);
const customersLoading = ref(false);
const photoFile = ref(null);
const photoPreview = ref('');
const machineLoading = ref(false);
const nfcScanning = ref(false);
const saving = ref(false);
const actionBarStyle = ref({ left: '0px', width: '100%' });

let nfcListener = null;
let nfcSessionEndListener = null;
let actionBarResizeObserver = null;
let actionBarFrame = 0;
let currentTimeTimer = null;

const validAmount = computed(() =>
            /^\d+(?:\.\d{1,2})?$/.test(String(amount.value || '').trim()) && Number(amount.value) > 0
);
const canSubmit = computed(() =>
            Boolean(machine.value && validAmount.value && customerId.value && photoFile.value &&
                state.cashReady && Number(amount.value) <= Number(state.balance))
);

function updateClock() {
            currentTime.value = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
}

function updateActionBarPosition() {
            if (!ticketPageRef.value) return;
            const rect = ticketPageRef.value.getBoundingClientRect();
            actionBarStyle.value = { left: `${rect.left}px`, width: `${rect.width}px` };
}
function scheduleActionBarUpdate() {
            cancelAnimationFrame(actionBarFrame);
            actionBarFrame = requestAnimationFrame(updateActionBarPosition);
}

async function loadState() {
            try {
              const response = await getTicketOutState();
              Object.assign(state, response.data || {});
            } catch (error) {
              ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to load Ticket Out status.');
            }
}

async function loadCustomers() {
            customersLoading.value = true;
            try {
              const response = await getcustomers(userStore.locationId);
              customers.value = Array.isArray(response.data) ? response.data : [];
            } catch (error) {
              customers.value = [];
              ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to load customers.');
            } finally {
              customersLoading.value = false;
            }
}

function clearMachine() { machine.value = null; }

async function findMachine() {
            const number = String(machineNumber.value || '').trim();
            if (!number) return ElMessage.warning('Enter a machine number.');
            machineLoading.value = true;
            machine.value = null;
            try {
              const response = await getTicketOutMachine(number);
              machine.value = response.data;
              machineNumber.value = String(response.data.machineNumber);
              await openDetails();
            } catch (error) {
              ElMessage.error(error?.response?.data?.message || error?.message || `Machine #${number} was not found.`);
            } finally {
              machineLoading.value = false;
            }
}

function decodeNdefRecord(record) {
  const payload = Array.isArray(record?.payload) ? record.payload : [];
  if (!payload.length) return '';

  try {
    const type = String.fromCharCode(...(record.type || []));

    if (type === 'T') {
      const languageLength = payload[0] & 0x3f;
      return new TextDecoder('utf-8')
        .decode(new Uint8Array(payload.slice(1 + languageLength)))
        .trim();
    }

    if (type === 'U') {
      const prefixes = {
        0x00: '',
        0x01: 'http://www.',
        0x02: 'https://www.',
        0x03: 'http://',
        0x04: 'https://'
      };
      const prefix = prefixes[payload[0]] ?? '';
      const value = new TextDecoder('utf-8')
        .decode(new Uint8Array(payload.slice(1)))
        .trim();

      return `${prefix}${value}`;
    }

    return new TextDecoder('utf-8')
      .decode(new Uint8Array(payload))
      .trim();
  } catch {
    return '';
  }
}

function nfcTargetFromNativeEvent(event) {
  for (const record of event?.tag?.ndefMessage || []) {
    const text = decodeNdefRecord(record);
    if (!text) continue;

    const urlMatch = text.match(
      /^https:\/\/secure\.iklogy\.com\/nfc\/(\d+)\/(\d+)\/?(?:[?#].*)?$/i
    );

    if (urlMatch) {
      return {
        locationId: urlMatch[1],
        machineNumber: urlMatch[2],
        locationAware: true
      };
    }

    // Backward compatibility for existing NFC tags that contain
    // only a machine number, such as "1" or "Machine #1".
    const oldMatch = text.match(
      /(?:machine(?:number)?[\s:#=-]*)?(\d+)/i
    );

    if (oldMatch) {
      return {
        locationId: '',
        machineNumber: oldMatch[1],
        locationAware: false
      };
    }
  }

  return null;
}

let nfcStopPromise = null;

async function stopNfcScan() {
            if (nfcStopPromise) return nfcStopPromise;
            if (!nfcScanning.value && !nfcListener && !nfcSessionEndListener) return;
            nfcStopPromise = (async () => {
            try { await CapacitorNfc.stopScanning(); } catch { /* no active scan */ }
            if (nfcListener) {
              await nfcListener.remove();
              nfcListener = null;
            }
            if (nfcSessionEndListener) {
              await nfcSessionEndListener.remove();
              nfcSessionEndListener = null;
            }
            nfcScanning.value = false;
            })();
            try { await nfcStopPromise; } finally { nfcStopPromise = null; }
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
              if (!supported) return ElMessage.warning('NFC is not supported on this device.');

              const { status } = await CapacitorNfc.getStatus();
              if (status === 'NFC_DISABLED') return ElMessage.warning('NFC is turned off. Enable NFC and try again.');
              if (status === 'NO_NFC') return ElMessage.warning('NFC is not available on this device.');

              nfcScanning.value = true;

              nfcListener = await CapacitorNfc.addListener('nfcEvent', async event => {
                const target = nfcTargetFromNativeEvent(event);

                if (!target?.machineNumber) {
                  await stopNfcScan();
                  ElMessage.error('The NFC tag does not contain a valid machine number.');
                  await scanNfc();
                  return;
                }

                if (
                  target.locationAware &&
                  String(target.locationId) !== String(userStore.locationId || '')
                ) {
                  await stopNfcScan();
                  ElMessage.error('This NFC tag belongs to another location.');
                  await scanNfc();
                  return;
                }

                machineNumber.value = target.machineNumber;
                // Let the machine API request run while the native scan closes.
                const closingScan = stopNfcScan();
                await findMachine();
                await closingScan;
                if (step.value === 1) await scanNfc();
              });

              if (Capacitor.getPlatform() === 'ios') {
                nfcSessionEndListener = await CapacitorNfc.addListener('nfcSessionEnd', ({ reason }) => {
                  nfcScanning.value = false;
                  if (reason === 'sessionTimeout') ElMessage.warning('No NFC tag detected. Try again.');
                  else if (reason !== 'userCancelled') ElMessage.error('The NFC scan session ended unexpectedly.');
                });
              }

              await CapacitorNfc.startScanning({
                invalidateAfterFirstRead: true,
                alertMessage: 'Hold the device near the machine NFC tag.',
                iosSessionType: 'ndef'
              });
            } catch (error) {
              await stopNfcScan();
              ElMessage.error(error?.message || 'Unable to scan NFC tag.');
            }
}

async function openDetails() {
            await stopNfcScan();
            step.value = 2;
            await loadCustomers();
            await nextTick();
            scheduleActionBarUpdate();
}

async function openPhotoDialog() {
        photoDialogOpen.value = true;

        await nextTick();

        cameraRef.value?.startCamera?.();
}

function closePhotoDialog() {
        cameraRef.value?.stopCamera?.();
}

function handleCapturedImage(image) {
            if (!image) return;
            photoFile.value = image;
            if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
            photoPreview.value = URL.createObjectURL(image);


        photoDialogOpen.value = false;
}

async function retakePhoto() {
        if (photoPreview.value) {
          URL.revokeObjectURL(photoPreview.value);
        }

        photoPreview.value = '';
        photoFile.value = null;

        await openPhotoDialog();
}

async function resetToScan() {
            await stopNfcScan();
            step.value = 1;
            machineNumber.value = '';
            machine.value = null;
            amount.value = '';
            customerId.value = null;
            customers.value = [];
            photoFile.value = null;
            if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
            photoPreview.value = '';
            await nextTick();
            await scanNfc();
}

async function backToScan() {
            await resetToScan();
}

async function submitTicketOut() {
            if (!canSubmit.value) return;
            saving.value = true;
            try {
              const form = new FormData();
              form.append('machineid', String(machine.value.id));
              form.append('customerid', String(customerId.value));
              form.append('amount', Number(amount.value).toFixed(2));
              form.append('image', photoFile.value,
                photoFile.value.name || `ticketout-${machine.value.machineNumber}-${Date.now()}.jpg`);

              const response = await saveTicketOut(form);
              ElMessage.success(response.message || 'Ticket Out saved.');
              await loadState();
              await resetToScan();
            } catch (error) {
              ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to save Ticket Out.');
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

            if (ticketPageRef.value) {
              actionBarResizeObserver = new ResizeObserver(scheduleActionBarUpdate);
              actionBarResizeObserver.observe(ticketPageRef.value);
            }
            window.addEventListener('resize', scheduleActionBarUpdate);
            window.addEventListener('transitionend', scheduleActionBarUpdate);

            const nfcSource = String(route.query.source || '').trim().toLowerCase() === 'nfc';
            const nfcLocationId = String(route.query.locationId || '').trim();
            const nfcMachine = String(route.query.machine || '').trim();
            const currentLocationId = String(userStore.locationId || '').trim();

            if (nfcSource) {
              if (
                !/^\d+$/.test(nfcLocationId) ||
                !/^\d+$/.test(nfcMachine) ||
                nfcLocationId !== currentLocationId
              ) {
                ElMessage.error('This NFC tag belongs to another location.');
              } else {
                machineNumber.value = nfcMachine;
                await findMachine();
              }
            } else {
              await scanNfc();
            }
});

onBeforeUnmount(async () => {
            if (currentTimeTimer) window.clearInterval(currentTimeTimer);

            await stopNfcScan();
            actionBarResizeObserver?.disconnect();
            cancelAnimationFrame(actionBarFrame);
            window.removeEventListener('resize', scheduleActionBarUpdate);
            window.removeEventListener('transitionend', scheduleActionBarUpdate);
            if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
        closePhotoDialog();
});
</script>
