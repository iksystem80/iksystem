<template>
  <div class="account-tab">
    <!-- POINTS -->
    <el-card class="settings-card" shadow="never">
      <div class="section-header">
        <div>
          <h3>Customer Points</h3>
          <p>
            Update the customer's current point balance.
          </p>
        </div>
        <div class="points-badge">
          {{ customer.points }} pts
        </div>
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
      <div class="section-header">
        <div>
          <h3>Customer Status</h3>
          <p>
            Manage the customer's account, VIP and blacklist status.
          </p>
        </div>
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
                   inline-prompt
                   active-text="ON"
                   inactive-text="OFF" />
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
                   inline-prompt
                   active-text="ON"
                   inactive-text="OFF" />
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
                   inline-prompt
                   active-text="ON"
                   inactive-text="OFF" />
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
        <el-switch v-model="form.privilegedMatchRule" size="large" inline-prompt active-text="ON" inactive-text="OFF" />
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
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';

import { updateCustomerAccount } from '@/api/customer';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();

const props = defineProps({
    customer: {
      type: Object,
      required: true
    }
});

const emit = defineEmits(['updated']);

const saving = ref(false);

const form = reactive({
    points: 0,
    isActive: false,
    isVip: false,
    isBlacklist: false,
    privilegedMatchRule: false
});





watch(
    () => props.customer,
    customer => {
      if (!customer) return;

      form.points = customer.points ?? 0;
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

const addPoints = amount => {
    form.points = amount;
};

const saveAccount = async () => {
    try {
      saving.value = true;

      const payload = {
        customerid: props.customer.id,
        userId: userStore.userId,
        points: form.points,
        isactive: form.isActive,
        isvip: form.isVip,
        isblacklist: form.isBlacklist,
        privilegedmatchrule: form.privilegedMatchRule
      };

      const response =
                  await updateCustomerAccount(payload);

      ElMessage.success(response.message);

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
    padding: 10px 4px;
    max-width: 100%;
  }

  .settings-card {
    margin-bottom: 22px;
    border-radius: 14px;
    border: 1px solid var(--el-border-color-lighter);
    background: #fff;
  }

    .settings-card :deep(.el-card__body) {
      padding: 22px;
    }

  /* =========================
       HEADER
    ========================= */

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
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

  /* =========================
       POINTS BADGE
    ========================= */

  .points-badge {
    flex-shrink: 0;
    padding: 8px 14px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 20px;
    background: #fff;
    color: var(--el-color-primary);
    font-size: 14px;
    font-weight: 600;
  }

  .points-input {
    width: 220px;
  }

  /* =========================
       QUICK POINTS
    ========================= */

  .quick-points {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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
    gap: 30px;
  }

  .setting-info {
    flex: 1;
  }

  .setting-title {
    margin-bottom: 6px;
    color: var(--el-text-color-primary);
    font-size: 17px;
    font-weight: 600;
  }

  .setting-description {
    color: var(--el-text-color-secondary);
    font-size: 14px;
    line-height: 1.6;
  }

  /* =========================
       PRIVILEGED INFO
    ========================= */

  .privileged-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 18px;
    padding: 12px 14px;
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
    margin-top: 20px;
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
      gap: 16px;
    }

    .points-input {
      width: 100%;
    }

    .save-section .el-button {
      width: 100%;
    }
  }
</style>
