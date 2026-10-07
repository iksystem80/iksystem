<template>
  <div ref="rafflePageRef" class="app-container raffle-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Raffle</h2>
        <p>{{ step === 1 ? "Spin the wheel to select today's winning machine." : step === 2 ? 'Select the raffle prize' : 'Select the winner and capture a photo.' }}</p>
      </div>
      <el-button class="action-button"
                 :icon="Setting"
                 @click="router.push('/raffle/settings')" />
    </div>


    <el-card shadow="never" class="employee-banner">
      <div class="employee-header">
        <div class="employee-profile">
          <el-avatar :size="54" :src="userStore.avatar || undefined">
            {{ initials }}
          </el-avatar>
          <div class="employee-profile-text">
            <h2>{{ userStore.name || 'Employee' }}</h2>
            <div class="employee-period">
              Employee
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

    <el-card class="raffle-card" shadow="never">
      <Teleport to="body">
        <div v-if="showFireworks" class="fireworks" aria-hidden="true">
          <div v-for="burst in 9" :key="burst" class="firework" :style="{ '--burst': burst }">
            <span v-for="spark in 28" :key="spark" class="firework-spark" :style="{ '--spark': spark }"></span>
            <span v-for="spark in 18" :key="`inner-${spark}`" class="firework-spark firework-spark-inner" :style="{ '--spark': spark }"></span>
          </div>
        </div>
      </Teleport>

      <div v-if="loading" class="raffle-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        Loading raffle...
      </div>

      <template v-else>
        <template v-if="step === 1">
          <div class="wheel-stage">
            <div class="pointer"></div>
            <div class="wheel" :class="{ spinning }" :style="wheelStyle"></div>
            <div class="wheel-center">
              <small>{{ result ? 'SELECTED MACHINE' : 'MACHINE' }}</small>
              <strong>{{ centerNumber }}</strong>
            </div>
          </div>

          <div v-if="!result" class="spin-actions">
            <el-button type="primary"
                       size="large"
                       round
                       :loading="spinning"
                       :disabled="!machines.length"
                       @click="spin">
              SPIN THE WHEEL
            </el-button>
          </div>

          <div v-if="result && !spinning" class="draw-result">
            <div class="machine-result">
              <small>SELECTED MACHINE</small>
              <strong>#{{ result.machine.machineNumber }}</strong>
            </div>
          </div>
        </template>

        <div v-else-if="step === 2" class="prize-page">
          <div class="prize-machine raffle-value-box">
            <small>WINNING MACHINE</small>
            <strong>#{{ result?.machine?.machineNumber }}</strong>
          </div>
          <div class="prize-heading">Select Prize</div>
          <div class="prize-grid">
            <el-button v-for="amount in [25, 50, 100, 150, 200, 250]"
                       :key="amount"
                       size="large"
                       :type="payout.amount === amount ? 'primary' : 'default'"
                       @click="selectPrize(amount)">
              ${{ amount }}
            </el-button>
          </div>
          <div class="custom-prize-row">
            <span>Custom Prize</span>
            <el-input v-model.number="payout.amount"
                      class="custom-prize-input"
                      type="number"
                      inputmode="decimal"
                      min="1"
                      placeholder="Enter amount">
              <template #prepend>
                $
              </template>
            </el-input>
          </div>
        </div>

        <div v-else class="payout-page payout-page-full">
          <el-row :gutter="20">
            <el-col :xs="24" :md="10">
              <div class="winner-details-column">
                <div class="winner-summary-row">
                  <div class="winner-summary-item raffle-value-box">
                    <small>WINNING MACHINE</small>
                    <strong>#{{ result?.machine?.machineNumber }}</strong>
                  </div>
                  <div class="winner-summary-item raffle-value-box">
                    <small>SELECTED PRIZE</small>
                    <strong>${{ Number(payout.amount || 0).toLocaleString() }}</strong>
                  </div>
                </div>

                <el-card shadow="never" class="payout-section winner-details-card">
                  <template #header>
                    <div>
                      <strong>Winner Details</strong>
                      <div class="small-text">Choose any customer registered at this location.</div>
                    </div>
                  </template>

                  <el-form label-position="top">
                    <el-form-item label="Customer">
                      <el-select v-model="payout.customerId"
                                 filterable
                                 clearable
                                 placeholder="Select customer"
                                 style="width: 100%"
                                 :loading="customersLoading">
                        <el-option v-for="customer in customers"
                                   :key="customer.id"
                                   :label="`${customer.firstname || ''} ${customer.lastname || ''}`.trim()"
                                   :value="Number(customer.id)" />
                      </el-select>
                    </el-form-item>

                  </el-form>

                </el-card>
              </div>
            </el-col>

            <el-col :xs="24" :md="14">
              <el-card shadow="never" class="payout-section camera-card step-three-camera-card">
                <template #header>
                  <div>
                    <strong>Winner Photo</strong>
                    <div class="small-text">Capture a current photo of the raffle winner.</div>
                  </div>
                </template>

                <div v-if="photoPreview" class="winner-photo-preview">
                  <img :src="photoPreview" alt="Winner photo">
                  <el-button @click="retakePhoto">Retake Photo</el-button>
                </div>

                <div class="raffle-camera-frame">
                  <CameraApp v-if="!photoPreview"
                             ref="cameraRef"
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
      </template>
    </el-card>

    <Transition name="action-bar-fade">
      <div v-if="result && !spinning"
           class="fixed-actions"
           :style="actionBarStyle">
        <div class="action-inner">
          <div class="action-left">
            <el-button v-if="step === 3" :icon="ArrowLeft" @click="backToPrize">Back</el-button>
            <el-button v-else @click="resetRaffle">New Raffle</el-button>
          </div>

          <div class="action-right">
            <el-button v-if="step === 1"
                       type="primary"
                       @click="openPrize">
              Continue to Prize
              <el-icon><ArrowRight /></el-icon>
            </el-button>

            <el-button v-else-if="step === 2"
                       type="primary"
                       :disabled="!payout.amount"
                       @click="openWinner">
              Continue
              <el-icon><ArrowRight /></el-icon>
            </el-button>

            <el-button v-else
                       type="success"
                       :loading="saving"
                       :disabled="!payout.customerId || !payout.amount || !photoFile"
                       @click="saveWinner">
              Save & Finalize
            </el-button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, ArrowRight, Loading, Setting } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';
import CameraApp from '@/components/mycamera';
import { getcustomers } from '@/api/customer';
import { completeRaffle, getRaffleState, startRaffle } from '@/api/raffle';

const router = useRouter();
const userStore = useUserStore();

const rafflePageRef = ref(null);
const cameraRef = ref(null);
const loading = ref(true);
const customersLoading = ref(false);
const spinning = ref(false);
const saving = ref(false);
const step = ref(1);
const payoutMode = computed(() => step.value === 3);
const machines = ref([]);
const customers = ref([]);
const result = ref(null);
const showFireworks = ref(false);
const rotation = ref(0);
const centerNumber = ref('?');
const spinDuration = ref(8);
const currentTime = ref('');
const photoFile = ref(null);
const photoPreview = ref('');
const payout = reactive({ amount: 25, customerId: null });
const actionBarStyle = ref({ left: '0px', width: '100%' });

let timer;
let fireworksTimer;
let numberTimer;
let actionBarResizeObserver;
let actionBarFrame = 0;

const initials = computed(() =>
          String(userStore.name || 'E')
            .split(/\s+/)
            .map(x => x[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
);

const wheelStyle = computed(() => {
  const machineCount = Math.max(machines.value.length, 1);

  const segmentCount = Math.max(machineCount, 12);
  const slice = 360 / segmentCount;

  const colors = ['#f8e7a2', '#a9dfc0', '#a9d3e8', '#f5b89d'];
  const segments = [];

  for (let i = 0; i < segmentCount; i++) {
    const start = i * slice;
    const end = (i + 1) * slice;

    segments.push(
      `${colors[i % colors.length]} ${start}deg ${end}deg`
    );
  }

  return {
    '--spin-duration': `${spinDuration.value}s`,
    background: `conic-gradient(${segments.join(', ')})`,
    transform: `rotate(${rotation.value}deg)`
  };
});

function updateClock() {
          currentTime.value = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
}

function updateActionBarPosition() {
          if (!rafflePageRef.value) return;
          const rect = rafflePageRef.value.getBoundingClientRect();
          actionBarStyle.value = {
            left: `${rect.left}px`,
            width: `${rect.width}px`
          };
}

function scheduleActionBarUpdate() {
          cancelAnimationFrame(actionBarFrame);
          actionBarFrame = requestAnimationFrame(updateActionBarPosition);
}

async function load() {
          loading.value = true;
          try {
            const response = await getRaffleState();
            machines.value = response.data?.machines || [];
            spinDuration.value = Number(response.data?.settings?.spinDurationSeconds || 8);
          } finally {
            loading.value = false;
            await nextTick();
            scheduleActionBarUpdate();
          }
}

async function spin() {
          if (spinning.value) return;
          spinning.value = true;

          const numbers = machines.value.map(machine => machine.machineNumber);
          let numberIndex = Math.floor(Math.random() * Math.max(numbers.length, 1));

          clearInterval(numberTimer);
          if (numbers.length) {
            centerNumber.value = numbers[numberIndex];
            numberTimer = setInterval(() => {
              numberIndex = (numberIndex + 1) % numbers.length;
              centerNumber.value = numbers[numberIndex];
            }, 90);
          }

          try {
            const response = await startRaffle();
            const next = response.data;
            const index = machines.value.findIndex(
              machine => Number(machine.id) === Number(next.machine.id)
            );
            const slice = 360 / Math.max(machines.value.length, 1);
            const target = index >= 0
              ? 360 - ((index * slice) + (slice / 2))
              : 0;
            const current = ((rotation.value % 360) + 360) % 360;
            const normalizedTarget = ((target % 360) + 360) % 360;
            const delta = (normalizedTarget - current + 360) % 360;

            rotation.value += (8 * 360) + delta;
            await new Promise(resolve =>
              setTimeout(resolve, spinDuration.value * 1000)
            );

            clearInterval(numberTimer);
            numberTimer = null;

            result.value = next;
            centerNumber.value = next.machine.machineNumber;

            showFireworks.value = true;
            clearTimeout(fireworksTimer);
            fireworksTimer = setTimeout(() => {
              showFireworks.value = false;
            }, 5000);

            await nextTick();
            scheduleActionBarUpdate();
          } catch (error) {
            clearInterval(numberTimer);
            numberTimer = null;
            centerNumber.value = '?';
            ElMessage.error(
              error?.response?.data?.message ||
                error?.message ||
                'Unable to run raffle.'
            );
          } finally {
            spinning.value = false;
          }
}

function selectPrize(amount) {
          payout.amount = amount;
}

function openPrize() {
          step.value = 2;
          payout.customerId = null;
}

function backToPrize() {
          step.value = 2;
          payout.customerId = null;
}

async function openWinner() {
          step.value = 3;
          payout.customerId = null;
          customersLoading.value = true;

          try {
            const response = await getcustomers(userStore.locationId);
            customers.value = Array.isArray(response.data) ? response.data : [];
          } catch (error) {
            customers.value = [];
            ElMessage.error(
              error?.response?.data?.message ||
                error?.message ||
                'Unable to load customers.'
            );
          } finally {
            customersLoading.value = false;
            await nextTick();
            scheduleActionBarUpdate();
          }
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
          if (photoPreview.value) {
            URL.revokeObjectURL(photoPreview.value);
          }

          photoPreview.value = '';
          photoFile.value = null;

          await nextTick();
          cameraRef.value?.startCamera?.();
}

async function saveWinner() {
          if (!payout.customerId || !payout.amount || !photoFile.value) {
            ElMessage.warning(
              'Customer, winning amount and winner photo are required.'
            );
            return;
          }

          saving.value = true;

          try {
            const form = new FormData();
            form.append('customerid', String(payout.customerId));
            form.append('amount', String(payout.amount));
            form.append('image', photoFile.value, photoFile.value.name || 'raffle-winner.jpg');

            await completeRaffle(result.value.raffleId, form);

            ElMessage.success('Raffle completed and payout recorded.');
            await resetRaffle();
          } catch (error) {
            ElMessage.error(
              error?.response?.data?.message ||
                error?.message ||
                'Unable to complete raffle payout.'
            );
          } finally {
            saving.value = false;
          }
}

async function resetRaffle() {
          result.value = null;
          step.value = 1;
          payout.customerId = null;
          payout.amount = 25;
          customers.value = [];
          showFireworks.value = false;

          clearTimeout(fireworksTimer);
          clearInterval(numberTimer);

          rotation.value = 0;
          centerNumber.value = '?';
          photoFile.value = null;

          if (photoPreview.value) {
            URL.revokeObjectURL(photoPreview.value);
          }

          photoPreview.value = '';

          await load();
}

onMounted(async () => {
          await load();
          updateClock();
          timer = setInterval(updateClock, 1000);

          await nextTick();
          updateActionBarPosition();

          if (rafflePageRef.value) {
            actionBarResizeObserver = new ResizeObserver(scheduleActionBarUpdate);
            actionBarResizeObserver.observe(rafflePageRef.value);
          }

          window.addEventListener('resize', scheduleActionBarUpdate);
          window.addEventListener('transitionend', scheduleActionBarUpdate);
});

onBeforeUnmount(() => {
          clearInterval(timer);
          clearTimeout(fireworksTimer);
          clearInterval(numberTimer);
          actionBarResizeObserver?.disconnect();
          cancelAnimationFrame(actionBarFrame);
          window.removeEventListener('resize', scheduleActionBarUpdate);
          window.removeEventListener('transitionend', scheduleActionBarUpdate);

          if (photoPreview.value) {
            URL.revokeObjectURL(photoPreview.value);
          }
});
</script>
