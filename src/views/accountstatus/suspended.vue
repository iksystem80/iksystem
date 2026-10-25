<template>
  <div class="account-status-page account-status-page--suspended">
    <div class="account-status-shell">
      <div class="account-status-brand">
        <img :src="logo" alt="IK" class="account-status-logo">
        <span>IKLOGY</span>
      </div>

      <section class="account-status-card">
        <div class="account-status-icon">
          <WarningFilled />
        </div>

        <div class="account-status-kicker">
          ACCOUNT SUSPENDED
        </div>

        <h1>
          {{ title }}
        </h1>

        <p class="account-status-message">
          {{ message }}
        </p>

        <div class="account-status-note">
          <strong>What happens now?</strong>
          <span>
            Your account data remains secure. Access will become available again
            after the System Administrator reactivates {{ subject }}.
          </span>
        </div>

        <el-button
          type="primary"
          size="large"
          class="account-status-action"
          @click="goToLogin"
        >
          Return to Sign In
        </el-button>

        <p class="account-status-help">
          If you believe this status is incorrect, please contact your System Administrator.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import logo from '@/assets/logo.png';

const route = useRoute();
const router = useRouter();

const scope = computed(() =>
  String(route.query.scope || 'location').trim().toLowerCase()
);

const displayName = computed(() =>
  String(route.query.name || '').trim()
);

const isCompany = computed(() => scope.value === 'company');

const subject = computed(() =>
  isCompany.value ? 'the company' : 'this location'
);

const title = computed(() => {
  if (displayName.value) {
    return `${displayName.value} is suspended`;
  }

  return isCompany.value
    ? 'Your company is suspended'
    : 'This location is suspended';
});

const message = computed(() =>
  isCompany.value
    ? 'Access to this company and all of its locations has been temporarily suspended.'
    : 'Access to this location has been temporarily suspended.'
);

function goToLogin() {
  router.replace('/login');
}
</script>
