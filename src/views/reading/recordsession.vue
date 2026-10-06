<template>
  <div ref="readingPageRef" class="app-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Reading Sessions</h2>
        <p>Create, review and reconcile machine reading sessions.</p>
      </div>
    </div>
    <!-- ===================================================== -->
    <!-- STEPS -->
    <!-- ===================================================== -->
    <el-card shadow="never" class="steps-card">
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="Start Session" />
        <el-step title="Reading" />
        <el-step title="Employee Sessions" />
        <el-step title="Review & Reconcile" />
      </el-steps>
    </el-card>
    <!-- ===================================================== -->
    <!-- STEP 1 - SESSION -->
    <!-- ===================================================== -->
    <div v-if="activeStep === 0" class="step-container">
      <div class="step-heading">
        <div>
          <h2>Reading Sessions</h2>
          <p>
            Continue an open session or start a new
            machine-reading session.
          </p>
        </div>
      </div>
      <el-empty v-if="
        !loadingSessions &&
          activesessions.length === 0
      " description="There are no open reading sessions.">
        <template #description>
          <div class="empty-description">
            There are no open reading sessions.
            Start a new session below.
          </div>
        </template>
      </el-empty>

      <div v-else
           class="session-grid">
        <el-card v-for="item in activesessions"
                 :key="item.ID"
                 shadow="hover"
                 class="session-card"
                 @click="selectSession(item)">
          <template #header>
            <div class="session-card-header">
              <div class="session-number">
                Session # {{ item.id }}
              </div>

              <div class="session-header-right">
                <span class="status-dot" />

                <el-button link
                           type="danger"
                           @click.stop="deleteSelectedSession(item)">
                  <el-icon>
                    <Delete />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </template>

          <div class="session-card-body">
            <div class="session-detail-row">
              <span>Started</span>

              <strong>
                {{ formatDateTime(item.startedat) }}
              </strong>
            </div>

            <div class="session-detail-row">
              <span>Status</span>

              <el-tag type="success"
                      effect="light"
                      round>
                Open
              </el-tag>
            </div>
          </div>

          <template #footer>
            <div class="session-footer">
              <span>Machine Readings</span>

              <strong>
                {{ item.totalcount || 0 }}
              </strong>
            </div>
          </template>
        </el-card>
      </div>
    </div>

    <!-- ===================================================== -->
    <!-- STEP 3 - SELECT COMPLETED EMPLOYEE SESSIONS -->
    <!-- ===================================================== -->
    <div v-if="activeStep === 2" class="step-container coverage-step">
      <div class="step-heading">
        <h2>Employee Sessions Covered</h2>
        <p>
          Select the completed employee shifts included in reading session #{{ sessionId }}.
          Active shifts and shifts used by another reading session are excluded.
        </p>
      </div>
      <el-card shadow="never" class="coverage-card">
        <div class="coverage-toolbar">
          <div>
            <strong>{{ selectedEmployeeSessionIds.length }} selected</strong>
            <div class="small-text">Only clocked-out sessions at this location are eligible.</div>
          </div>
          <el-button link type="primary" :loading="coverageLoading" @click="loadEmployeeCoverage">Refresh</el-button>
        </div>
        <el-alert v-if="coverageError" type="error" :title="coverageError" :closable="false" show-icon />
        <el-skeleton v-else-if="coverageLoading" :rows="4" animated />
        <el-empty v-else-if="eligibleEmployeeSessions.length === 0"
                  description="No available completed employee sessions." />
        <el-checkbox-group v-else v-model="selectedEmployeeSessionIds" class="coverage-list">
          <el-checkbox v-for="item in eligibleEmployeeSessions" :key="item.id"
                       :value="Number(item.id)" class="coverage-option">
            <span class="coverage-option-main">
              <strong>{{ item.employeeName }}</strong>
              <span class="small-text">Employee session #{{ item.id }} · {{ formatDateTime(item.clockIn) }} – {{ formatDateTime(item.clockOut) }}</span>
            </span>
            <el-tag v-if="Number(item.readingSessionId) === Number(sessionId)" size="small" type="success" effect="plain">Selected earlier</el-tag>
          </el-checkbox>
        </el-checkbox-group>
      </el-card>
    </div>

    <!-- ===================================================== -->
    <!-- STEP 2 - RECORD READINGS -->
    <!-- ===================================================== -->

    <div v-if="activeStep === 1"
         class="step-container reading-step">
      <!-- SESSION HEADER -->

      <div class="reading-header">
        <div>
          <div class="eyebrow">
            ACTIVE READING SESSION
          </div>

          <h2>
            Session #{{ sessionId }}
          </h2>

          <div class="small-text">
            Started
            {{ formatDateTime(currentSession?.startedat) }}
          </div>
        </div>

        <el-tag type="success"
                effect="dark"
                round>
          Open
        </el-tag>
      </div>

      <!-- =================================================== -->
      <!-- ENTRY CARD -->
      <!-- =================================================== -->

      <el-card shadow="never"
               class="entry-card" style="padding: 0px 0px 0px 0px !important; ">
        <!--<template #header>
          <div>
            <strong>
              Record Machine Reading
            </strong>

            <div class="small-text">
              Select the machine first. Its last
              confirmed reading will appear below.
            </div>
          </div>
        </template>-->

        <el-form ref="readingFormRef"
                 :model="readingForm"
                 :rules="formRules"
                 label-position="top"
                 class="reading-form">
          <el-row :gutter="16">
            <!-- MACHINE -->

            <el-col :xs="24"
                    :sm="8">
              <el-form-item label="Machine #"
                            prop="machinenumber">
                <el-input-number ref="firstInput"
                                 v-model.number="readingForm.machinenumber"
                                 inputmode="numeric"
                                 :min="0"
                                 :max="500"
                                 style="width: 100%"
                                 @change="getmachine" />
              </el-form-item>
            </el-col>

            <!-- CURRENT IN -->

            <el-col :xs="12"
                    :sm="8">
              <el-form-item label="Current IN"
                            prop="readingin">
                <div class="reading-input-stack">
                  <el-input ref="readingInput"
                            v-model.number="readingForm.readingin"
                            inputmode="numeric"
                            placeholder="Enter IN"
                            :disabled="!readingForm.machinenumber" />
                  <div v-if="entryDailyIn !== null" class="reading-delta">
                    Daily IN = <strong>{{ formatReadingValue(entryDailyIn) }}</strong>
                  </div>
                </div>
              </el-form-item>
            </el-col>

            <!-- CURRENT OUT -->

            <el-col :xs="12"
                    :sm="8">
              <el-form-item label="Current OUT"
                            prop="readingout">
                <div class="reading-input-stack">
                  <el-input v-model.number="readingForm.readingout"
                            inputmode="numeric"
                            placeholder="Enter OUT"
                            :disabled="!readingForm.machinenumber" />
                  <div v-if="entryDailyOut !== null" class="reading-delta">
                    Daily OUT = <strong>{{ formatReadingValue(entryDailyOut) }}</strong>
                  </div>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- ================================================= -->
          <!-- MACHINE / PREVIOUS READING -->
          <!-- ================================================= -->

          <div v-loading="machineLookupLoading" class="machine-reading-info">
            <el-container class="statistic-card">
              <!-- MACHINE NUMBER - ALWAYS VISIBLE -->

              <el-aside width="110px"
                        class="machine-number-panel">
                <div class="el-statistic">
                  <div class="el-statistic__head">
                    Machine #
                  </div>

                  <div class="el-statistic__content">
                    <span class="el-statistic__number">
                      {{ currentmachine?.machinenumber ?? readingForm.machinenumber ?? '--' }}
                    </span>
                  </div>
                </div>
              </el-aside>

              <!-- RIGHT SIDE -->

              <el-container>
                <el-main>
                  <!-- MACHINE WARNING -->

                  <el-alert v-if="machineWarning"
                            :title="machineWarning"
                            type="warning"
                            :closable="false"
                            show-icon
                            class="machine-warning" />

                  <!-- PREVIOUS READING FOUND -->

                  <el-row v-else-if="previousReading"
                          :gutter="16"
                          class="previous-reading-row">
                    <!-- DATE -->

                    <el-col :xs="8"
                            :sm="8"
                            :md="8"
                            class="text-center">
                      <div class="el-statistic">
                        <div class="el-statistic__head">
                          Reading Date
                        </div>

                        <div class="previous-value date-value">
                          {{ formatDateTime(previousReading.readingat) }}
                        </div>
                      </div>
                    </el-col>

                    <!-- PREVIOUS IN -->

                    <el-col :xs="8"
                            :sm="8"
                            :md="8"
                            class="text-center">
                      <el-statistic title="Previous IN"
                                    :value="Number(previousReading.currentin || 0)" />
                    </el-col>

                    <!-- PREVIOUS OUT -->

                    <el-col :xs="8"
                            :sm="8"
                            :md="8"
                            class="text-center">
                      <el-statistic title="Previous OUT"
                                    :value="Number(previousReading.currentout || 0)" />
                    </el-col>
                  </el-row>

                  <!-- NO PREVIOUS READING -->

                  <el-alert v-else
                            title="No previous confirmed reading was found for this machine."
                            type="info"
                            :closable="false"
                            show-icon
                            class="previous-reading-alert" />
                </el-main>
              </el-container>
            </el-container>
          </div>

          <!-- SAVE -->

          <div class="save-reading-row">
            <el-button type="primary"
                       :loading="savingReading"
                       :disabled="!machineId"
                       @click="saveThis">
              Save Reading
            </el-button>
          </div>
        </el-form>
      </el-card>

      <!-- =================================================== -->
      <!-- CURRENT SESSION READINGS -->
      <!-- =================================================== -->

      <el-card shadow="never"
               class="readings-card">
        <template #header>
          <div class="readings-header">
            <div>
              <strong>
                Session Readings
              </strong>

              <div class="small-text">
                {{ currentreadings.length }}
                machine
                {{
                  currentreadings.length === 1
                    ? 'reading'
                    : 'readings'
                }}
                recorded
              </div>
            </div>
          </div>
        </template>

        <el-empty v-if="currentreadings.length === 0"
                  description="No readings have been recorded yet." />

        <!-- DESKTOP -->

        <el-table v-else-if="device !== 'mobile'"
                  :data="currentreadings"
                  style="width: 100%">
          <el-table-column prop="machinenumber"
                           label="Machine #"
                           min-width="120" />

          <el-table-column prop="readingtype"
                           label="Reading Type"
                           min-width="130" />

          <el-table-column prop="previousin"
                           label="Previous IN"
                           min-width="130">
            <template #default="{ row }">
              {{ row.previousin ?? '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="previousout"
                           label="Previous OUT"
                           min-width="130">
            <template #default="{ row }">
              {{ row.previousout ?? '-' }}
            </template>
          </el-table-column>

          <el-table-column label="Daily IN"
                           min-width="120">
            <template #default="{ row }">
              {{ formatReadingValue(dailyIn(row)) }}
            </template>
          </el-table-column>

          <el-table-column label="Daily OUT"
                           min-width="120">
            <template #default="{ row }">
              {{ formatReadingValue(dailyOut(row)) }}
            </template>
          </el-table-column>

          <el-table-column label="Diff"
                           min-width="110">
            <template #default="{ row }">
              {{ formatReadingValue(readingDiff(row)) }}
            </template>
          </el-table-column>

          <el-table-column label="Reading At"
                           min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.readingat) }}
            </template>
          </el-table-column>

          <el-table-column label=""
                           width="70"
                           align="right">
            <template #default="{ row }">
              <el-button link
                         type="danger"
                         @click="handleDelete(row)">
                <el-icon>
                  <Delete />
                </el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- MOBILE -->

        <div v-else
             class="mobile-reading-list">
          <el-card v-for="row in currentreadings"
                   :key="row.id"
                   shadow="never"
                   class="mobile-reading-card">
            <div class="mobile-reading-top">
              <div>
                <strong>
                  Machine #{{ row.machinenumber }}
                </strong>

                <div class="small-text">
                  {{ formatDateTime(row.readingat) }}
                </div>
              </div>

              <el-button link
                         type="danger"
                         @click="handleDelete(row)">
                <el-icon>
                  <Delete />
                </el-icon>
              </el-button>
            </div>

            <div class="mobile-reading-values">
              <div>
                <span>Previous IN</span>
                <strong>{{ row.previousin ?? '-' }}</strong>
              </div>

              <div>
                <span>Previous OUT</span>
                <strong>{{ row.previousout ?? '-' }}</strong>
              </div>

              <div>
                <span>Daily IN</span>
                <strong>{{ formatReadingValue(dailyIn(row)) }}</strong>
              </div>

              <div>
                <span>Daily OUT</span>
                <strong>{{ formatReadingValue(dailyOut(row)) }}</strong>
              </div>

              <div>
                <span>Diff</span>
                <strong>{{ formatReadingValue(readingDiff(row)) }}</strong>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>

    <!-- ===================================================== -->
    <!-- STEP 4 - REVIEW -->
    <!-- ===================================================== -->

    <div v-if="activeStep === 3"
         class="step-container">
      <el-card shadow="never"
               class="review-card">
        <div class="review-hero">
          <div class="review-icon-wrapper">
            <el-icon :size="42"
                     class="review-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>

          <h2>
            Review Before Reconciliation
          </h2>

          <p>
            You recorded

            <strong>
              {{ currentreadings.length }}
            </strong>

            machine
            {{
              currentreadings.length === 1
                ? 'reading'
                : 'readings'
            }}.
          </p>

          <p class="review-message">
            Confirm all values before permanently
            closing this session.
          </p>
        </div>

        <el-alert title="Once this session enters reconciliation, its machine readings cannot be changed or deleted."
                  type="warning"
                  :closable="false"
                  show-icon
                  class="review-alert" />

        <el-descriptions title="Session Summary"
                         :column="
                           device === 'mobile'
                             ? 1
                             : 3
                         "
                         border
                         class="review-summary">
          <el-descriptions-item label="Session #">
            {{ sessionId }}
          </el-descriptions-item>

          <el-descriptions-item label="Started">
            {{
              formatDateTime(
                currentSession?.startedat
              )
            }}
          </el-descriptions-item>

          <el-descriptions-item label="Total Readings">
            {{ currentreadings.length }}
          </el-descriptions-item>
          <el-descriptions-item label="Employee Sessions">
            {{ selectedEmployeeSessionIds.length }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="review-coverage">
          <h3>Covered Employee Sessions</h3>
          <div v-for="item in selectedCoverageRows" :key="item.id" class="review-coverage-row">
            <strong>{{ item.employeeName }} · Session #{{ item.id }}</strong>
            <span class="small-text">{{ formatDateTime(item.clockIn) }} – {{ formatDateTime(item.clockOut) }}</span>
          </div>
        </div>

        <div class="review-readings">
          <h3>
            Machine Readings
          </h3>

          <!-- DESKTOP REVIEW -->

          <el-table v-if="device !== 'mobile'"
                    :data="currentreadings"
                    border
                    stripe
                    style="width: 100%">
            <el-table-column prop="machinenumber"
                             label="Machine #"
                             min-width="120" />

            <el-table-column prop="previousin"
                             label="Previous IN"
                             min-width="130">
              <template #default="{ row }">
                {{ row.previousin ?? '-' }}
              </template>
            </el-table-column>

            <el-table-column prop="previousout"
                             label="Previous OUT"
                             min-width="130">
              <template #default="{ row }">
                {{ row.previousout ?? '-' }}
              </template>
            </el-table-column>

            <el-table-column prop="currentin"
                             label="Current IN"
                             min-width="130" />

            <el-table-column prop="currentout"
                             label="Current OUT"
                             min-width="130" />

            <el-table-column label="Reading At"
                             min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.readingat) }}
              </template>
            </el-table-column>
          </el-table>

          <!-- MOBILE REVIEW -->

          <div v-else
               class="mobile-reading-list">
            <el-card v-for="row in currentreadings"
                     :key="row.id"
                     shadow="never"
                     class="mobile-reading-card">
              <div class="mobile-reading-top">
                <div>
                  <strong>
                    Machine #{{ row.machinenumber }}
                  </strong>

                  <div class="small-text">
                    {{ formatDateTime(row.readingat) }}
                  </div>
                </div>
              </div>

              <div class="mobile-reading-values">
                <div>
                  <span>IN</span>

                  <strong>
                    {{ row.currentin }}
                  </strong>
                </div>

                <div>
                  <span>OUT</span>

                  <strong>
                    {{ row.currentout }}
                  </strong>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <div class="review-confirm">
          <el-checkbox v-model="confirmReview">
            I reviewed these readings and confirm
            they are correct.
          </el-checkbox>
        </div>
      </el-card>
    </div>

    <!-- ===================================================== -->
    <!-- FIXED BOTTOM ACTION BAR -->
    <!-- ===================================================== -->

    <Transition name="action-bar-fade">
      <div v-if="showActionBar"
           class="fixed-actions"
           :style="actionBarStyle">
        <div class="action-inner">
          <!-- LEFT -->

          <div class="action-left">
            <el-button v-if="activeStep > 0"
                       @click="back">
              <el-icon>
                <ArrowLeft />
              </el-icon>

              Back
            </el-button>
          </div>

          <!-- RIGHT -->

          <div class="action-right">
            <el-button v-if="activeStep === 0"
                       type="primary"
                       :loading="creatingSession"
                       @click="startnew">
              <el-icon>
                <Plus />
              </el-icon>
              <span>Start New Session</span>
            </el-button>

            <el-button v-if="activeStep === 1"
                       type="primary"
                       :disabled="currentreadings.length === 0"
                       @click="next">
              Continue

              <el-icon>
                <ArrowRight />
              </el-icon>
            </el-button>

            <el-button v-if="activeStep === 2"
                       type="primary"
                       :loading="coverageSaving"
                       :disabled="coverageLoading || selectedEmployeeSessionIds.length === 0"
                       @click="saveEmployeeCoverageAndContinue">
              Save & Continue
              <el-icon><ArrowRight /></el-icon>
            </el-button>

            <el-button v-if="activeStep === 3"
                       type="danger"
                       :loading="endingSession"
                       :disabled="
                         !confirmReview ||
                           currentreadings.length === 0
                       "
                       @click="endSession">
              Finish Reading & Reconcile
            </el-button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import {
        reactive,
        ref,
        onMounted,
        onBeforeUnmount,
        computed,
        nextTick,
        watch
} from 'vue';

import {
        onBeforeRouteLeave
} from 'vue-router';

import {
        ElMessage,
        ElMessageBox
} from 'element-plus';

import {
        Delete,
        CircleCheckFilled,
        ArrowLeft,
        ArrowRight,
        Plus
} from '@element-plus/icons-vue';

import {
        useUserStore
} from '@/store/modules/user';

import {
        useAppStore
} from '@/store/modules/app';

import {
        getactivesession,
        startnewsession,
        savereading,
        getreadings,
        getpreviousreading,
        endsession,
        deletesession,
        deletereading
} from '@/api/reading';
import { getReadingEmployeeCoverage, saveReadingEmployeeCoverage } from '@/api/readingcoverage';

import {
        getmachinebynumber
} from '@/api/machine';

// ============================================================
// STORES
// ============================================================

const userStore =
              useUserStore();

const appStore =
              useAppStore();

const device =
              computed(
                () => appStore.device
              );

const locationid =
              computed(
                () => userStore.locationId
              );

// ============================================================
// STATE
// ============================================================

const activeStep =
              ref(0);

const sessionId =
              ref(0);

const machineId =
              ref(0);

const currentSession =
              ref<any>(null);

const currentmachine =
              ref<any>(null);

const previousReading =
              ref<any>(null);

const machineWarning =
              ref('');

const machineLookupLoading = ref(false);

const activesessions =
              ref<any[]>([]);

const currentreadings =
              ref<any[]>([]);

const eligibleEmployeeSessions = ref<any[]>([]);
const selectedEmployeeSessionIds = ref<number[]>([]);
const coverageLoading = ref(false);
const coverageSaving = ref(false);
const coverageError = ref('');
const selectedCoverageRows = computed(() => eligibleEmployeeSessions.value.filter(item =>
        selectedEmployeeSessionIds.value.includes(Number(item.id))
));

const loadingSessions =
              ref(false);

const savingReading =
              ref(false);

const creatingSession =
              ref(false);

const endingSession =
              ref(false);

const confirmReview =
              ref(false);

const firstInput = ref<any>(null);
const readingInput = ref<any>(null);

// ============================================================
// FIXED ACTION BAR
// ============================================================

const readingPageRef =
              ref<HTMLElement | null>(null);

const actionBarStyle =
              ref({
                left: '0px',
                width: '100%'
              });

const showActionBar =
              ref(false);

let actionBarShowTimer:
              ReturnType<typeof setTimeout> | null = null;

let actionBarResizeObserver:
              ResizeObserver | null = null;

let actionBarFrame = 0;

function updateActionBarPosition() {
        if (!readingPageRef.value) {
          return;
        }

        const rect =
                  readingPageRef.value.getBoundingClientRect();

        actionBarStyle.value = {
          left: `${rect.left}px`,
          width: `${rect.width}px`
        };
}

function scheduleActionBarUpdate() {
        cancelAnimationFrame(actionBarFrame);

        actionBarFrame =
                  requestAnimationFrame(
                    updateActionBarPosition
                  );
}

// ============================================================
// FORM
// ============================================================

const defaultForm = () => ({
        locationid:
                  locationid.value,

        sessionid: 0,

        machineid: 0,

        machinenumber:
                  null as number | null,

        previousin:
                  null as number | null,

        previousout:
                  null as number | null,

        readingin:
                  null as number | null,

        readingout:
                  null as number | null
});

const readingForm =
              reactive(
                defaultForm()
              );

const readingFormRef =
              ref<any>(null);

// ============================================================
// VALIDATION
// ============================================================

const formRules = {
        machinenumber: [
          {
            required: true,
            message:
                          'Please enter machine number',
            trigger: 'change'
          },
          {
            type: 'number',
            message:
                          'Machine number must be a number',
            trigger: 'change'
          }
        ],

        readingin: [
          {
            required: true,
            message:
                          'Please enter Current IN',
            trigger: 'blur'
          },
          {
            type: 'number',
            message:
                          'Current IN must be a number',
            trigger: 'blur'
          }
        ],

        readingout: [
          {
            required: true,
            message:
                          'Please enter Current OUT',
            trigger: 'blur'
          },
          {
            type: 'number',
            message:
                          'Current OUT must be a number',
            trigger: 'blur'
          }
        ]
};

// ============================================================
// DATE FORMAT
// ============================================================

function readingDelta(
        current: any,
        previous: any
) {
        if (
          current === null ||
          current === undefined ||
          previous === null ||
          previous === undefined
        ) {
          return null;
        }

        const currentValue = Number(current);
        const previousValue = Number(previous);

        if (
          !Number.isFinite(currentValue) ||
          !Number.isFinite(previousValue)
        ) {
          return null;
        }

        return currentValue - previousValue;
}

const entryDailyIn = computed(() =>
        readingDelta(
          readingForm.readingin,
          readingForm.previousin
        )
);

const entryDailyOut = computed(() =>
        readingDelta(
          readingForm.readingout,
          readingForm.previousout
        )
);

function dailyIn(row: any) {
        return readingDelta(
          row?.currentin,
          row?.previousin
        );
}

function dailyOut(row: any) {
        return readingDelta(
          row?.currentout,
          row?.previousout
        );
}

function readingDiff(row: any) {
        const inValue = dailyIn(row);
        const outValue = dailyOut(row);

        if (
          inValue === null ||
          outValue === null
        ) {
          return null;
        }

        return inValue - outValue;
}

function formatReadingValue(value: any) {
        return value === null ||
          value === undefined
          ? '-'
          : Number(value).toLocaleString();
}

function formatDateTime(
        value: string | Date | null | undefined
) {
        if (!value) {
          return '---';
        }

        const date =
                  new Date(value);

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return '---';
        }

        return new Intl.DateTimeFormat(
          'en-US',
          {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }
        ).format(date);
}

// ============================================================
// STEP NAVIGATION
// ============================================================

async function next() {
        if (currentreadings.value.length === 0) {
          ElMessage.warning(
            'Add at least one machine reading before continuing.'
          );
          return;
        }

        confirmReview.value = false;
        activeStep.value = 2;

        await loadEmployeeCoverage();
}

async function loadEmployeeCoverage() {
        if (!sessionId.value || !locationid.value) return;
        try {
          coverageLoading.value = true;
          coverageError.value = '';
          const response = await getReadingEmployeeCoverage(sessionId.value, locationid.value);
          const rows = response.data || [];
          eligibleEmployeeSessions.value = rows;
          selectedEmployeeSessionIds.value = rows.filter((item: any) =>
            Number(item.readingSessionId) === Number(sessionId.value)
          ).map((item: any) => Number(item.id));
        } catch (error: any) {
          coverageError.value = error?.response?.data?.message || error?.message || 'Unable to load employee sessions.';
          eligibleEmployeeSessions.value = [];
          selectedEmployeeSessionIds.value = [];
        } finally {
          coverageLoading.value = false;
        }
}

async function saveEmployeeCoverageAndContinue() {
        if (coverageSaving.value || coverageLoading.value) return;
        if (!selectedEmployeeSessionIds.value.length) {
          ElMessage.warning('Select at least one completed employee session.');
          return;
        }
        try {
          coverageSaving.value = true;
          await saveReadingEmployeeCoverage({
            locationid: locationid.value,
            sessionid: sessionId.value,
            employeesessionids: selectedEmployeeSessionIds.value
          });
          await loadEmployeeCoverage();
          if (!coverageError.value) activeStep.value = 3;
        } catch (error: any) {
          ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to save employee session coverage.');
          await loadEmployeeCoverage();
        } finally {
          coverageSaving.value = false;
        }
}

async function back() {
        if (activeStep.value === 3) {
          activeStep.value = 2;
          confirmReview.value = false;
          await loadEmployeeCoverage();
          return;
        }

        if (activeStep.value === 2) {
          activeStep.value = 1;
          return;
        }

        if (activeStep.value === 1) {
          activeStep.value = 0;
          sessionId.value = 0;
          currentSession.value = null;
          currentreadings.value = [];
          eligibleEmployeeSessions.value = [];
          selectedEmployeeSessionIds.value = [];
          await resetForm();
          await loadActiveSession();
        }
}

// ============================================================
// ACTIVE SESSIONS
// ============================================================

async function loadActiveSession() {
        if (!locationid.value) {
          activesessions.value = [];

          return;
        }

        try {
          loadingSessions.value = true;

          const response =
                      await getactivesession(
                        locationid.value
                      );

          activesessions.value =
                      response.data ?? [];
        } catch (error) {
          console.error(error);

          activesessions.value = [];
        } finally {
          loadingSessions.value = false;
        }
}

// ============================================================
// SELECT EXISTING SESSION
// ============================================================

async function selectSession(session: any) {
        sessionId.value = session.id;

        currentSession.value = session;

        machineWarning.value = '';

        activeStep.value = 1;

        await getcurrentreadings();

        await nextTick();
}

// ============================================================
// START NEW SESSION
// ============================================================

async function startnew() {
        if (!locationid.value) {
          ElMessage.error(
            'Please select a location first.'
          );

          return;
        }

        try {
          creatingSession.value = true;

          const response = await startnewsession(locationid.value);

          sessionId.value = response.SessionId;

          currentSession.value =
                      response.data;

          currentreadings.value = [];

          machineWarning.value = '';

          activeStep.value = 1;

          await nextTick();
        } catch (error) {
          console.error(error);
        } finally {
          creatingSession.value = false;
        }
}

// ============================================================
// MACHINE LOOKUP
// ============================================================

async function getmachine() {
        machineWarning.value = '';

        const enteredMachineNumber = Number(readingForm.machinenumber || 0);

        if (!enteredMachineNumber || enteredMachineNumber <= 0) {
          machineId.value = 0;
          currentmachine.value = null;
          previousReading.value = null;
          readingForm.previousin = null;
          readingForm.previousout = null;
          readingForm.readingin = null;
          readingForm.readingout = null;
          return;
        }

        try {
          machineLookupLoading.value = true;

          const response = await getmachinebynumber(
            enteredMachineNumber,
            locationid.value
          );

          if (!response?.data?.id) {
            machineId.value = 0;
            currentmachine.value = null;
            previousReading.value = null;
            readingForm.previousin = null;
            readingForm.previousout = null;
            readingForm.readingin = null;
            readingForm.readingout = null;
            machineWarning.value = `Machine #${enteredMachineNumber} was not found.`;
            return;
          }

          const machine = response.data;

          const exists = currentreadings.value.some(
            reading => Number(reading.machineid) === Number(machine.id)
          );

          if (exists) {
            machineId.value = 0;
            currentmachine.value = machine;
            previousReading.value = null;
            readingForm.previousin = null;
            readingForm.previousout = null;
            readingForm.readingin = null;
            readingForm.readingout = null;

            machineWarning.value =
              `Machine #${machine.machinenumber} already has a reading in this session. Delete the existing reading before retaking it.`;
            return;
          }

          const previousResponse = await getpreviousreading(
            machine.id,
            locationid.value,
            sessionId.value
          );

          // Apply the new machine state together after the lookup finishes.
          // This avoids the blank/flicker caused by clearing the panel first.
          machineId.value = machine.id;
          currentmachine.value = machine;
          previousReading.value = previousResponse.data || null;

          readingForm.previousin =
            previousReading.value?.currentin == null
              ? null
              : Number(previousReading.value.currentin);

          readingForm.previousout =
            previousReading.value?.currentout == null
              ? null
              : Number(previousReading.value.currentout);

          readingForm.readingin = null;
          readingForm.readingout = null;
        } catch (error: any) {
          console.error(error);

          machineId.value = 0;
          currentmachine.value = null;
          previousReading.value = null;
          readingForm.previousin = null;
          readingForm.previousout = null;
          readingForm.readingin = null;
          readingForm.readingout = null;

          if (error?.response?.status === 404) {
            machineWarning.value = `Machine #${enteredMachineNumber} was not found.`;
          } else {
            machineWarning.value =
              'Unable to load machine information. Please try again.';
          }
        } finally {
          machineLookupLoading.value = false;
        }
}
// ============================================================
// SAVE READING
// ============================================================

async function saveThis() {
        if (
          !readingFormRef.value
        ) {
          return;
        }

        try {
          const valid =
                      await readingFormRef.value.validate();

          if (!valid) {
            return;
          }

          if (!machineId.value) {
            machineWarning.value = 'Please select a valid machine before saving.';

            return;
          }

          savingReading.value = true;

          const payload = {
            sessionid:
                          sessionId.value,

            machineid:
                          machineId.value,

            machinenumber:
                          readingForm.machinenumber,

            previousin:
                          readingForm.previousin,

            previousout:
                          readingForm.previousout,

            readingin:
                          readingForm.readingin,

            readingout:
                          readingForm.readingout,

            locationid:
                          locationid.value
          };

          await savereading(
            payload
          );

          ElMessage.success(
            'Machine reading saved successfully.'
          );

          await getcurrentreadings();

          // await resetForm()
          await prepareNextMachine();
        } catch (error) {
          console.error(error);
        } finally {
          savingReading.value = false;
        }
}

async function prepareNextMachine() {
      const currentMachineNumber = Number(readingForm.machinenumber || 0);

      readingFormRef.value?.clearValidate();

      machineId.value = 0;
      currentmachine.value = null;
      previousReading.value = null;
      machineWarning.value = '';

      readingForm.readingin = null;
      readingForm.readingout = null;

      readingForm.machinenumber = currentMachineNumber + 1;

      await nextTick();

      /*
             * Automatically load next machine.
             * This will also show previous reading
             * if that machine exists.
             */
      await getmachine();

      await nextTick();

      //firstInput.value?.focus();
      readingInput.value?.focus();
}

// ============================================================
// CURRENT READINGS
// ============================================================

async function getcurrentreadings() {
        console.log('here 1');
        console.log('session: ' + sessionId.value);
        console.log('location: ' + locationid.value);
        if (
          !sessionId.value ||
                  !locationid.value
        ) {
          currentreadings.value = [];
          return;
        }

        console.log('here 1');

        try {
          console.log('Loading readings for:',
            {
              sessionId:
                              sessionId.value,
              locationId:
                              locationid.value
            }
          );

          const response =
                      await getreadings(
                        sessionId.value,
                        locationid.value
                      );

          console.log('Reading response:', response
          );

          currentreadings.value = response.data ?? [];
        } catch (error) {
          console.error(
            'Unable to load readings:',
            error
          );

          currentreadings.value = [];
        }
}

// ============================================================
// DELETE SESSION
// ============================================================

async function deleteSelectedSession(
        row: any
) {
        try {
          await ElMessageBox.confirm(
            `Delete Session #${row.ID}? All readings inside this open session will also be deleted.`,
            'Delete Session',
            {
              confirmButtonText:
                              'Delete',

              cancelButtonText:
                              'Cancel',

              type:
                              'warning'
            }
          );

          await deletesession(
            row.ID,
            locationid.value
          );

          ElMessage.success(
            'Session deleted successfully.'
          );

          await loadActiveSession();
        } catch (error: any) {
          if (
            error !== 'cancel' &&
                      error !== 'close'
          ) {
            console.error(error);
          }
        }
}

// ============================================================
// DELETE READING
// ============================================================

async function handleDelete(
        row: any
) {
        try {
          await ElMessageBox.confirm(
            `Delete the reading for Machine #${row.machinenumber}?`,
            'Delete Reading',
            {
              confirmButtonText:
                              'Delete',

              cancelButtonText:
                              'Cancel',

              type:
                              'warning'
            }
          );

          await deletereading(
            row.id,
            locationid.value
          );

          ElMessage.success(
            'Reading deleted successfully.'
          );

          await getcurrentreadings();

          /*
                   * If duplicate-warning machine is
                   * currently selected, immediately
                   * make it available again.
                   */
          if (
            readingForm.machinenumber &&
                      Number(
                        readingForm.machinenumber
                      ) ===
                      Number(
                        row.machinenumber
                      )
          ) {
            machineWarning.value = '';

            await getmachine();
          }
        } catch (error: any) {
          if (
            error !== 'cancel' &&
                      error !== 'close'
          ) {
            console.error(error);
          }
        }
}

// ============================================================
// END SESSION
// ============================================================

async function endSession() {
        if (
          !confirmReview.value
        ) {
          return;
        }

        try {
          await ElMessageBox.confirm(
            'Once you send this session to reconciliation, the readings will be locked and cannot be changed. Continue?',
            'Send to Reconciliation',
            {
              confirmButtonText:
                              'Reconcile Session',

              cancelButtonText:
                              'Go Back',

              type:
                              'warning'
            }
          );

          endingSession.value = true;

          await endsession(
            sessionId.value,
            locationid.value
          );

          ElMessage.success(
            `Session #${sessionId.value} is ready for reconciliation.`
          );

          activeStep.value = 0;
          sessionId.value = 0;
          currentSession.value = null;
          currentreadings.value = [];
          eligibleEmployeeSessions.value = [];
          selectedEmployeeSessionIds.value = [];
          confirmReview.value = false;

          await resetForm();

          await loadActiveSession();
        } catch (error: any) {
          if (
            error !== 'cancel' &&
                      error !== 'close'
          ) {
            console.error(error);
          }
        } finally {
          endingSession.value = false;
        }
}

// ============================================================
// RESET MACHINE
// ============================================================

// ============================================================
// RESET FORM
// ============================================================

async function resetForm() {
        readingFormRef.value?.resetFields();

        Object.assign(
          readingForm,
          defaultForm()
        );

        machineId.value = 0;
        currentmachine.value = null;
        previousReading.value = null;
        machineWarning.value = '';

        await nextTick();

        firstInput.value?.focus();
}

// ============================================================
// LOCATION CHANGE
// ============================================================

watch(
        locationid,
        async newLocation => {
          activeStep.value = 0;
          sessionId.value = 0;
          currentSession.value = null;
          currentreadings.value = [];
          eligibleEmployeeSessions.value = [];
          selectedEmployeeSessionIds.value = [];
          confirmReview.value = false;

          machineId.value = 0;
          currentmachine.value = null;
          previousReading.value = null;
          machineWarning.value = '';

          Object.assign(
            readingForm,
            defaultForm()
          );

          if (newLocation) {
            await loadActiveSession();
          }
        }
);

// ============================================================
// MOUNT
// ============================================================

onMounted(
        async () => {
          showActionBar.value = false;

          await loadActiveSession();

          await nextTick();

          /*
                   * Watches the actual page width.
                   * When the sidebar opens/closes,
                   * main content changes size and
                   * this observer automatically fires.
                   */
          if (
            readingPageRef.value
          ) {
            actionBarResizeObserver =
                          new ResizeObserver(
                            () => {
                              scheduleActionBarUpdate();
                            }
                          );

            actionBarResizeObserver.observe(
              readingPageRef.value
            );
          }

          window.addEventListener(
            'resize',
            scheduleActionBarUpdate
          );

          /*
                   * Also update after layout transitions.
                   * Helps while the sidebar is animating.
                   */
          window.addEventListener(
            'transitionend',
            scheduleActionBarUpdate
          );

          /*
                   * Wait for the page transition/layout to settle,
                   * then measure and fade the fixed bar in.
                   */
          actionBarShowTimer =
                      setTimeout(
                        async () => {
                          await nextTick();

                          updateActionBarPosition();

                          await nextTick();

                          showActionBar.value = true;
                        },
                        550
                      );
        }
);

// ============================================================
// ROUTE LEAVE
// ============================================================

onBeforeRouteLeave(
        async () => {
          if (actionBarShowTimer) {
            clearTimeout(actionBarShowTimer);
            actionBarShowTimer = null;
          }

          showActionBar.value = false;

          /*
                   * Allow the action bar fade-out to complete
                   * before the route/page transition starts.
                   */
          await new Promise<void>(
            resolve => {
              setTimeout(
                resolve,
                380
              );
            }
          );

          return true;
        }
);

// ============================================================
// DESTROY
// ============================================================

onBeforeUnmount(
        () => {
          if (actionBarShowTimer) {
            clearTimeout(actionBarShowTimer);
            actionBarShowTimer = null;
          }

          actionBarResizeObserver?.disconnect();

          cancelAnimationFrame(
            actionBarFrame
          );

          window.removeEventListener(
            'resize',
            scheduleActionBarUpdate
          );

          window.removeEventListener(
            'transitionend',
            scheduleActionBarUpdate
          );
        }
);
</script>
