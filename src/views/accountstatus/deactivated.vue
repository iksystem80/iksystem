<template>
  <div class="account-status-page account-status-page--deactivated">
    <div class="account-status-shell">
      <div class="account-status-brand">
        <img :src="logo" alt="IK" class="account-status-logo">
        <span>IKLOGY</span>
      </div>

      <section class="account-status-card">
        <div class="account-status-icon">
          <CircleCloseFilled />
        </div>

        <div class="account-status-kicker">
          ACCESS DEACTIVATED
        </div>

        <h1>
          {{ title }}
        </h1>

        <p class="account-status-message">
          {{ message }}
        </p>

        <div class="account-status-note">
          <strong>Access is currently unavailable</strong>
          <span>
            Your account data remains secure. Please contact your System Administrator
            if you need {{ subject }} reactivated.
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
          You will not be able to continue until access is restored.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CircleCloseFilled } from '@element-plus/icons-vue';
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
  isCompany.value ? 'your company' : 'this location'
);

const title = computed(() => {
  if (displayName.value) {
    return `${displayName.value} is deactivated`;
  }

  return isCompany.value
    ? 'Your company is deactivated'
    : 'This location is deactivated';
});

const message = computed(() =>
  isCompany.value
    ? 'This company is currently inactive, so access to all of its locations has been disabled.'
    : 'This location is currently inactive and cannot be accessed.'
);

function goToLogin() {
  router.replace('/login');
}
</script>
