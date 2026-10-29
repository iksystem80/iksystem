<template>
  <div class="account-tab">
    <!-- POINTS -->
    <el-card class="settings-card" shadow="never">
      <div class="section-header">
        <div>
          <h3  class="section-title">Customer Points</h3>
          <p>
            Update the customer's current point balance.
          </p>
        </div>
        <PointsBadge :points="customer.points" />
      </div>
      <el-divider />
      <el-form label-position="top">
        <el-form-item label="Points">
          <el-input-number v-model="form.points" :min="0" :step="10" inputmode="numeric" class="points-input" />
        </el-form-item>
        <div class="quick-points">
          <el-button @click="addPoints(20)">
            20
          </el-button>
          <el-button @click="addPoints(40)">
            40
          </el-button>
          <el-button @click="addPoints(60)">
            60
          </el-button>
          <el-button @click="addPoints(80)">
            80
          </el-button>
          <el-button @click="addPoints(100)">
            100
          </el-button>
        </div>
      </el-form>
    </el-card>
    <!-- CUSTOMER STATUS -->
    <el-card class="settings-card" shadow="never">
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-title">Customer Status</div>
          <div class="setting-description">
            Manage phone verification, account, VIP and blacklist status.
          </div>
        </div>

        <VerificationBadge :status="form.verificationStatus" />
      </div>

      <el-divider />

      <div class="setting-row verification-edit-row">
        <div class="setting-info">
          <div class="setting-title">Phone Number</div>
          <div class="setting-description">A changed phone number will automatically become Unverified.</div>
        </div>
        <div class="phone-edit-actions">
          <template v-if="editingPhone">
            <el-input v-model="form.phone" class="verification-control" maxlength="14" placeholder="(XXX) XXX-XXXX" inputmode="tel" @input="handlePhoneInput" />
            <el-button @click="cancelPhoneEdit">Cancel</el-button>
          </template>
          <template v-else>
            <span class="phone-display-value">{{ formatPhone(form.phone) }}</span>
            <el-button @click="startPhoneEdit">Edit Phone</el-button>
          </template>
        </div>
      </div>

      <el-divider />

      <div class="setting-row verification-edit-row">
        <div class="setting-info">
          <div class="setting-title">Phone Verification</div>
          <div class="setting-description">{{ phoneChanged ? 'Phone number changed: verification will reset to Unverified.' : 'Set the customer\'s phone verification status.' }}</div>
        </div>
        <el-select v-model="form.verificationStatus" class="verification-control" :disabled="phoneChanged">
          <el-option label="Verified" value="Verified" />
          <el-option label="Unverified" value="Unverified" />
          <el-option label="Bypass" value="Bypass" />
        </el-select>
      </div>

      <el-divider />

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-title">Active</div>
          <div class="setting-description">
            Controls whether this customer can use active customer features.
          </div>
        </div>

        <el-switch v-model="form.isActive"
                   size="large"
                   inline-prompt />
      </div>

      <el-divider />

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-title">VIP</div>
          <div class="setting-description">
            Mark this customer as a VIP customer.
          </div>
        </div>

        <el-switch v-model="form.isVip"
                   size="large"
                   inline-prompt />
      </div>

      <el-divider />

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-title">Blacklist</div>
          <div class="setting-description">
            Mark this customer as blacklisted.
          </div>
        </div>

        <el-switch v-model="form.isBlacklist"
                   size="large"
                   inline-prompt />
      </div>
    </el-card>

    <!-- PRIVILEGED MATCH RULE -->
    <el-card class="settings-card" shadow="never">
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-title">
            Privileged Match Rule
          </div>
          <div class="setting-description">
            When enabled, this customer is subject to custom match limits
            rather than global rules.
          </div>
        </div>
        <el-switch v-model="form.privilegedMatchRule" size="large" inline-prompt />
      </div>
      <div v-if="form.privilegedMatchRule" class="privileged-info">
        <div class="privileged-icon">
          <el-icon>
            <InfoFilled />
          </el-icon>
        </div>
        <span>
          Custom match limits will apply to this customer.
        </span>
      </div>
    </el-card>
    <!-- SAVE -->
    <div class="save-section">
      <el-button type="primary" size="large" :loading="saving" @click="saveAccount">
        Save Changes
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';


import { updateCustomerAccount } from '@/api/customer';
import { useUserStore } from '@/store/modules/user';
import PointsBadge from '@/components/pointsbadge/index.vue';
import VerificationBadge from '@/components/verificationbadge/index.vue';

const userStore = useUserStore();

const props = defineProps({
    customer: {
      type: Object,
      required: true
    }
});

const emit = defineEmits(['updated']);

const saving = ref(false);
const editingPhone = ref(false);
const verificationBeforePhoneEdit = ref('Unverified');

const form = reactive({
    points: 0,
    phone: '',
    verificationStatus: 'Unverified',
    isActive: false,
    isVip: false,
    isBlacklist: false,
    privilegedMatchRule: false
});

const phoneChanged = computed(() =>
    String(form.phone || '').replace(/\D/g, '') !==
    String(props.customer?.phone || '').replace(/\D/g, '')
);

function formatPhone(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function startPhoneEdit() {
    verificationBeforePhoneEdit.value = form.verificationStatus;
    form.phone = formatPhone(form.phone);
    editingPhone.value = true;
}

function cancelPhoneEdit() {
    form.phone = props.customer?.phone ?? '';
    form.verificationStatus = verificationBeforePhoneEdit.value;
    editingPhone.value = false;
}

function handlePhoneInput(value) {
    form.phone = formatPhone(value);
    if (phoneChanged.value) form.verificationStatus = 'Unverified';
}





watch(
    () => props.customer,
    customer => {
      if (!customer) return;

      form.points = customer.points ?? 0;
      form.phone = customer.phone ?? '';
      editingPhone.value = false;
      form.verificationStatus = verificationStatusLabel(customer);
      form.isActive = customer.isactive ?? false;
      form.isVip = customer.isvip ?? false;
      form.isBlacklist = customer.isblacklist ?? false;
      form.privilegedMatchRule =
        customer.PrivilegedMatchRule ??
        customer.privilegedmatchrule ??
        false;
    },
    {
      immediate: true
    }
);

function verificationStatusLabel(customer) {
    if (customer?.phoneverified === true) return 'Verified';

    if (
      String(customer?.verificationmethod || '')
        .trim()
        .toLowerCase() === 'bypass'
    ) {
      return 'Bypass';
    }

    return 'Unverified';
}

const addPoints = amount => {
    form.points = amount;
};

const saveAccount = async () => {
    try {
      const phone = String(form.phone || '').replace(/\D/g, '');
      if (phone.length !== 10) {
        ElMessage.warning('Enter a valid 10-digit phone number.');
        return;
      }
      saving.value = true;

      const payload = {
        customerid: props.customer.id,
        userId: userStore.userId,
        points: form.points,
        phone,
        verificationstatus: form.verificationStatus.toLowerCase(),
        isactive: form.isActive,
        isvip: form.isVip,
        isblacklist: form.isBlacklist,
        privilegedmatchrule: form.privilegedMatchRule
      };

      const response =
                  await updateCustomerAccount(payload);

      ElMessage.success(response.message);

      editingPhone.value = false;

      emit('updated');
    } catch (error) {
      ElMessage.error(
        error.response?.data?.message ||
                  'Unable to update customer.'
      );
    } finally {
      saving.value = false;
    }
};
</script>

<style scoped lang="scss">

  .account-tab {
    padding: 0px 0px;
    max-width: 100%;
  }

  .settings-card {
    margin-bottom: 14px;
    border-radius: 14px;
    border: 1px solid var(--stat-card-border);
    background: linear-gradient(
      145deg,
      var(--stat-card-bg-start) 0%,
      var(--stat-card-bg-end) 100%
    );
  }

    .settings-card :deep(.el-card__body) {
      padding: 20px 20px;
    }

  /* =========================
       HEADER
    ========================= */

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-top: 4px;
  }

    .section-header h3 {
      margin: 0 0 6px;
      color: var(--el-text-color-primary);
      font-size: 18px;
      font-weight: 600;
    }

    .section-header p {
      margin: 0;
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }

  .settings-card :deep(.el-divider--horizontal) {
    margin: 14px 0;
  }

  .settings-card :deep(.el-form-item) {
    margin-bottom: 12px;
  }


  .points-input {
    width: 220px;
  }

  .verification-control {
    width: 240px;
    max-width: 100%;
  }

  .phone-edit-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .phone-display-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .verification-edit-row {
    gap: 16px;
  }

  /* =========================
       QUICK POINTS
    ========================= */

  .quick-points {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

    .quick-points .el-button:hover {
      color: var(--el-color-primary) !important;
      border-color: var(--el-color-primary-light-5) !important;
      background: var(--el-color-primary-light-9) !important;
    }

  /* =========================
       MATCH RULE
    ========================= */

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    min-height: 44px;
  }

  .setting-info {
    flex: 1;
  }

  .setting-title {
    margin-bottom: 3px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
  }

  .setting-description {
    color: var(--el-text-color-secondary);
    font-size: 14px;
    line-height: 1.35;
  }

  /* =========================
       PRIVILEGED INFO
    ========================= */

  .privileged-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    padding: 10px 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: var(--el-fill-color-extra-light);
    color: var(--el-text-color-regular);
    font-size: 13px;
  }

  .privileged-icon {
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
    font-size: 16px;
  }

  /* =========================
       SAVE
    ========================= */

  .save-section {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }

    .save-section .el-button {
      min-width: 150px;
    }

  /* =========================
       MOBILE
    ========================= */

  @media (max-width: 700px) {

    .section-header {
      align-items: flex-start;
    }

    .setting-row {
      gap: 12px;
    }

    .points-input {
      width: 100%;
    }

    .verification-edit-row {
      align-items: stretch;
      flex-direction: column;
      gap: 8px;
    }

    .verification-control {
      width: 100%;
    }

    .phone-edit-actions {
      justify-content: flex-start;
    }

    .save-section .el-button {
      width: 100%;
    }
  }
</style>
