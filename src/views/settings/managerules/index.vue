<template>
  <div class="app-container manage-rules-page">
    <div class="page-header rules-page-header">
      <div>
        <h2 class="page-title">Manage Rules</h2>
        <p>Configure operational rules for the selected location.</p>
      </div>
      <el-button type="primary" :loading="saving" :disabled="loading" @click="saveRules">
        <el-icon v-if="!saving"><Check /></el-icon>
        <span>Save Rules</span>
      </el-button>
    </div>

    <div v-loading="loading" element-loading-text="Loading rules..." class="rules-content">
      <el-card shadow="never" class="rule-card rule-match" :class="{ enabled: form.matchRuleEnabled }">
        <div class="rule-card-header">
          <div class="rule-heading">
            <strong>Match Rule</strong>
            <small>Control how often a customer can receive a match at this location.</small>
          </div>
          <div class="rule-toggle">
            <span class="rule-status">{{ form.matchRuleEnabled ? 'Enabled' : 'Disabled' }}</span>
            <el-switch v-model="form.matchRuleEnabled" />
          </div>
        </div>

        <el-collapse-transition>
          <div v-if="form.matchRuleEnabled" class="rule-body match-rule-body">
            <div class="match-settings-grid">
              <div class="match-setting-block">
                <div class="setting-label">Cooldown <span class="required-mark">*</span></div>
                <div class="input-with-suffix compact-number-suffix">
                  <el-input-number v-model="form.matchCooldownHours" :min="0" :max="720" :controls="false" class="compact-number-input" />
                  <span class="input-suffix">hours</span>
                </div>
                <div class="setting-help">Time before the customer can match again.</div>
              </div>

              <div class="match-setting-block">
                <div class="setting-label">Daily Match Limit <span class="required-mark">*</span></div>
                <div class="input-with-suffix compact-number-suffix">
                  <el-input-number v-model="form.matchMaxPerDay" :min="0" :max="100" :controls="false" class="compact-number-input" />
                  <span class="input-suffix">matches</span>
                </div>
                <div class="setting-help">Maximum allowed matches per customer per day.</div>
              </div>
            </div>

            <div class="reset-schedule-panel">
              <div class="reset-schedule-header">
                <div class="reset-title">Reset Schedule</div>
                <div class="reset-description">Configure when daily match limits reset.</div>
              </div>

              <div class="reset-settings-grid">
                <div class="match-setting-block">
                  <div class="setting-label">Reset Times <span class="required-mark">*</span></div>
                  <el-select v-model="form.matchResetTimes" multiple allow-create filterable default-first-option placeholder="07:00, 19:00" class="full-width">
                    <el-option v-for="time in commonTimes" :key="time" :label="time" :value="time" />
                  </el-select>
                  <div class="setting-help">Use 24-hour HH:MM format.</div>
                </div>

                <div class="match-setting-block reset-day-field">
                  <div class="setting-label">Reset Day Time <span class="required-mark">*</span></div>
                  <el-time-picker v-model="form.matchResetDayTime" value-format="HH:mm" format="HH:mm" placeholder="07:00" class="full-width" />
                  <div class="setting-help">Default time used for the daily reset cycle.</div>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </el-card>

      <!--<RuleToggleCard v-model="form.nfcTicketOutEnabled" title="Enable NFC Ticket Out" accent="#409eff" accent-soft="rgba(64, 158, 255, 0.11)" description="When enabled, employees with NFC access can scan a machine to auto-fill the Ticket Out form. Turn this off to require manual machine entry." />-->
      <RuleToggleCard v-model="form.auditVerificationEnabled" title="Audit Verification of Bonuses, Raffles & Lucky Bird" accent="#e6a23c" accent-soft="rgba(230, 162, 60, 0.11)" description="Require bonuses, raffles and Lucky Bird to be audited, approved, or flagged before the session can be closed." />

      <el-card shadow="never" class="rule-card rule-lucky-bird" :class="{ enabled: form.luckyBirdEnabled }">
        <div class="rule-card-header">
          <div class="rule-heading">
            <strong>Lucky Bird</strong>
            <small>Allow employees to give Lucky Bird bonuses at this location.</small>
          </div>
          <div class="rule-toggle">
            <span class="rule-status">{{ form.luckyBirdEnabled ? 'Enabled' : 'Disabled' }}</span>
            <el-switch v-model="form.luckyBirdEnabled" />
          </div>
        </div>

        <el-collapse-transition>
          <div v-if="form.luckyBirdEnabled" class="rule-body">
            <div class="single-setting-row">
              <div class="match-setting-block">
                <div class="setting-label">Customers Per Day <span class="required-mark">*</span></div>
                <div class="input-with-suffix">
                  <el-input-number v-model="form.luckyBirdMaxCustomersPerDay" :min="1" :max="1000" :controls="false" class="compact-number-input" />
                  <span class="input-suffix">customers</span>
                </div>
                <div class="setting-help">Maximum Lucky Bird awards allowed per day. The Lucky Bird day resets at 6:00 AM.</div>
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </el-card>

      <!--<RuleToggleCard v-model="form.phoneVerificationRequired" title="Require Phone Verification" accent="#f56c6c" accent-soft="rgba(245, 108, 108, 0.10)" description="When enabled, a customer must verify their phone with an SMS code before collecting points. Turn this off for locations that do not need phone verification." />-->
      <RuleToggleCard v-model="form.nuVueBoostEnabled" title="Marketing Promotion" accent="#67c23a" accent-soft="rgba(103, 194, 58, 0.11)" description="Make the NuVue Boost marketing menu available to permitted staff at this location." />

      <el-card style="display:none" shadow="never" class="rule-card rule-ticket-photo" :class="{ enabled: form.ticketPhotoRequired }">
        <div class="rule-card-header">
          <div class="rule-heading">
            <strong>Ticket Photo Requirement</strong>
            <small>Require a photo when Ticket Out reaches the configured minimum amount.</small>
          </div>
          <div class="rule-toggle">
            <span class="rule-status">{{ form.ticketPhotoRequired ? 'Enabled' : 'Disabled' }}</span>
            <el-switch v-model="form.ticketPhotoRequired" />
          </div>
        </div>
        <el-collapse-transition>
          <div v-if="form.ticketPhotoRequired" class="rule-body">
            <el-form-item label="Minimum Amount" required>
              <el-input-number v-model="form.ticketPhotoMinAmount" :min="0" :step="10" :precision="2" controls-position="right" class="amount-field" />
            </el-form-item>
            <div class="quick-values">
              <el-button v-for="amount in ticketQuickValues" :key="amount" round @click="form.ticketPhotoMinAmount = amount">${{ amount.toLocaleString() }}</el-button>
            </div>
          </div>
        </el-collapse-transition>
      </el-card>

      <el-card style="display:none" shadow="never" class="rule-card rule-vip" :class="{ enabled: form.vipMatchEnabled }">
        <div class="rule-card-header">
          <div class="rule-heading">
            <strong>VIP Match</strong>
            <small>Require a photo when a pending customer's points reach the configured minimum.</small>
          </div>
          <div class="rule-toggle">
            <span class="rule-status">{{ form.vipMatchEnabled ? 'Enabled' : 'Disabled' }}</span>
            <el-switch v-model="form.vipMatchEnabled" />
          </div>
        </div>
        <el-collapse-transition>
          <div v-if="form.vipMatchEnabled" class="rule-body">
            <el-form-item label="Minimum Points" required>
              <el-input-number v-model="form.vipMatchMinPoints" :min="0" :step="10" controls-position="right" class="amount-field" />
            </el-form-item>
            <div class="quick-values">
              <el-button v-for="points in vipQuickValues" :key="points" round @click="form.vipMatchMinPoints = points">{{ points }} pts</el-button>
            </div>
          </div>
        </el-collapse-transition>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

import { useUserStore } from '@/store/modules/user';
import { getManageRules, updateManageRules } from '@/api/managerules';
import RuleToggleCard from './components/ruletogglecard.vue';

const userStore = useUserStore();

const loading = ref(false);
const saving = ref(false);

const commonTimes = [
  '05:00', '06:00', '07:00', '08:00', '09:00',
  '12:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

const ticketQuickValues = [250, 300, 400, 500, 1000];
const vipQuickValues = [30, 40, 50, 100, 200];

const defaultForm = () => ({
  locationId: Number(userStore.locationId || 0),
  matchRuleEnabled: false,
  matchRuleName: 'MATCH',
  matchCooldownHours: 3,
  matchMaxPerDay: 2,
  matchResetTimes: ['07:00', '19:00'],
  matchResetDayTime: '07:00',
  nfcTicketOutEnabled: false,
  auditVerificationEnabled: false,
  luckyBirdEnabled: false,
  luckyBirdMaxCustomersPerDay: 1,
  phoneVerificationRequired: false,
  nuVueBoostEnabled: false,
  ticketPhotoRequired: false,
  ticketPhotoMinAmount: 10,
  vipMatchEnabled: false,
  vipMatchMinPoints: 10
});

const form = reactive(defaultForm());

function applyRules(data: any) {
  Object.assign(
    form,
    defaultForm(),
    data || {},
    {
      locationId: Number(userStore.locationId || 0),
      // PostgreSQL TIME is often HH:mm:ss; Element Plus uses HH:mm.
      matchResetDayTime: String(data?.matchResetDayTime || '07:00').slice(0, 5),
      matchResetTimes: Array.isArray(data?.matchResetTimes)
        ? data.matchResetTimes
        : []
    }
  );
}

async function loadRules() {
  if (!userStore.locationId) return;

  try {
    loading.value = true;

    const response = await getManageRules(userStore.locationId);
    applyRules(response?.data);
  } catch (error: any) {
    console.error(error);

    ElMessage.error(
      error?.response?.data?.message ||
                error?.message ||
                'Unable to load manage rules.'
    );
  } finally {
    loading.value = false;
  }
}

async function saveRules() {
  if (!userStore.locationId) {
    ElMessage.warning('Please select a location.');
    return;
  }

  if (form.matchRuleEnabled && !String(form.matchRuleName || '').trim()) {
    ElMessage.warning('Rule Name is required.');
    return;
  }

  if (form.matchRuleEnabled && form.matchResetTimes.length === 0) {
    ElMessage.warning('Add at least one reset time.');
    return;
  }

  if (form.luckyBirdEnabled && Number(form.luckyBirdMaxCustomersPerDay || 0) < 1) {
    ElMessage.warning('Enter how many customers can receive Lucky Bird per day.');
    return;
  }

  try {
    saving.value = true;

    // Keep locationId in the UI model; API requests use lowercase locationid.
    const { locationId: _locationId, ...ruleValues } = form;
    const response = await updateManageRules({
      ...ruleValues,
      matchResetDayTime: String(form.matchResetDayTime || '07:00').slice(0, 5),
      locationid: Number(userStore.locationId)
    });

    applyRules(response?.data);

    ElMessage.success(
      response?.message || 'Rules saved successfully.'
    );
  } catch (error: any) {
    console.error('Manage Rules save response:', error?.response?.data || error);

    ElMessage.error(
      error?.response?.data?.message ||
                error?.message ||
                'Unable to save manage rules.'
    );
  } finally {
    saving.value = false;
  }
}

watch(
  () => userStore.locationId,
  () => loadRules()
);

onMounted(loadRules);
</script>

