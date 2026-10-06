<template>
  <div class="login-container">
    <!-- Animated Background -->
    <div class="background-effects">
      <div class="orb orb-one"></div>
      <div class="orb orb-two"></div>
      <div class="orb orb-three"></div>
      <img :src="logo" alt="IK Logo" class="bg-logo" />
      <img :src="logo" alt="" class="mobile-login-logo" aria-hidden="true" />
      <div class="grid-overlay"></div>
    </div>
    <div class="login-layout">
      <!-- LEFT SIDE -->
      <section class="welcome-panel">
        <div class="brand-badge">
          <span class="brand-dot"></span>
          MACHINE MANAGEMENT
        </div>
        <div class="welcome-content">
          <h1>
            Welcome
            <span>Back.</span>
          </h1>
          <p>
            Manage customers, machines, readings and daily operations
            from one simple workspace.
          </p>
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">01</span>
              <div>
                <strong>Fast Check-In</strong>
                <small>Manage your customers instantly</small>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">02</span>
              <div>
                <strong>Machine Tracking</strong>
                <small>Monitor readings and assignments</small>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">03</span>
              <div>
                <strong>Simple Management</strong>
                <small>Everything you need in one place</small>
              </div>
            </div>
          </div>
        </div>
        <div class="welcome-footer">
          Secure Management Portal
        </div>
      </section>
      <!-- LOGIN SIDE -->
      <section class="login-panel">
        <div class="login-card">
          <div class="login-card-header">
            <div class="mini-logo">
              <span>
                <!--<img v-if="logo" style="width:20px;height:20px;"
                                 :src="logo"
                                 class="sidebar-logo" />-->
              </span>
            </div>
            <span class="signin-label">
              SIGN IN
            </span>
            <h2>Welcome back</h2>
            <p>
              Enter your account details to continue.
            </p>
          </div>
          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form" autocomplete="on" label-position="left" @submit.prevent="handleLogin">
            <!-- USERNAME -->
            <el-form-item prop="username" class="login-field">
              <!--<span class="svg-container">
                            <svg-icon icon-class="user" />
                        </span>-->
              <el-input ref="usernameRef" v-model="loginForm.username" placeholder="Username" name="username" type="text" tabindex="1" autocomplete="on" :prefix-icon="User" />
            </el-form-item>
            <!-- PASSWORD -->
            <el-tooltip v-model:visible="capsTooltip" content="Caps lock is On" placement="right" manual>
              <el-form-item prop="password" class="login-field">
                <!--<span class="svg-container">
                                <svg-icon icon-class="password" />
                            </span>-->
                <el-input ref="passwordRef" :key="passwordType" v-model="loginForm.password" :type="passwordType" placeholder="Password" name="password" tabindex="2" autocomplete="on" :prefix-icon="Lock" @keyup="checkCapslock" @blur="capsTooltip = false" @keyup.enter="handleLogin" />
                <span class="show-pwd" @click="showPwd">
                  <svg-icon :icon-class="passwordType === 'password'? 'eye': 'eye-open'" />
                </span>
              </el-form-item>
            </el-tooltip>
            <div class="login-options">
              <span>
                Secure access
              </span>
              <span class="secure-dot">
                ● Online
              </span>
            </div>
            <el-button :loading="loading" type="primary" native-type="submit" class="login-button">
              <span v-if="!loading">
                Login
                <span class="button-arrow">
                  →
                </span>
              </span>
              <span v-else>
                Signing in...
              </span>
            </el-button>
          </el-form>
          <div class="login-bottom-text">
            Authorized users only
          </div>
        </div>
      </section>
    </div>
    <div class="background-effects">
      <div class="orb orb-one"></div>
      <div class="orb orb-two"></div>
      <div class="orb orb-three"></div>
      <img :src="logo" alt="IK Logo" class="bg-logo" />
      <div class="grid-overlay"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';

import { useUserStore } from '@/store/modules/user';
import { Lock, User } from '@element-plus/icons-vue';

defineOptions({
      name: 'Login'
}); const logo = '/src/assets/logo.png';

interface LoginForm {
        username: string
        password: string
}

interface QueryType {
        [key: string]: string
}

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

/**
       * Form reference
       */
const loginFormRef = ref<FormInstance>();

/**
       * Input references
       */
const usernameRef = ref();
const passwordRef = ref();

/**
       * Login form
       */
const loginForm = reactive<LoginForm>({
      username: '',
      password: ''
});

/**
       * Login state
       */
const passwordType = ref<'password' | 'text'>('password');
const capsTooltip = ref(false);
const loading = ref(false);

/**
       * Redirect information
       */
const redirect = ref<string | undefined>(
      typeof route.query.redirect === 'string'
        ? route.query.redirect
        : undefined
);

const otherQuery = reactive<QueryType>(
      getOtherQuery(route.query)
);

/**
       * Validation rules
       */
const validateUsername = (
      _rule: unknown,
      value: string,
      callback: (error?: Error) => void
) => {
      // if (!validUsername(value)) {
      // callback(
      // new Error('Please enter the correct user name')
      // )
      // } else {
      callback();
      // }
};

const validatePassword = (
      _rule: unknown,
      value: string,
      callback: (error?: Error) => void
) => {
      if (!value || value.length < 3) {
        callback(
          new Error(
            'The password can not be less than 3 digits'
          )
        );
      } else {
        callback();
      }
};

const loginRules: FormRules<LoginForm> = {
      username: [
        {
          required: true,
          trigger: 'blur',
          validator: validateUsername
        }
      ],
      password: [
        {
          required: true,
          trigger: 'blur',
          validator: validatePassword
        }
      ]
};

/**
       * Check Caps Lock state.
       */
function checkCapslock(event: KeyboardEvent) {
      const key = event.key;

      capsTooltip.value =
          !!key &&
          key.length === 1 &&
          key >= 'A' &&
          key <= 'Z';
}

/**
       * Toggle password visibility.
       */
async function showPwd() {
      passwordType.value = passwordType.value === 'password' ? 'text' : 'password';

      await nextTick();

      passwordRef.value?.focus();
}

/**
       * Login.
       */
async function handleLogin() {
      if (!loginFormRef.value) {
        return;
      }

      try {
        await loginFormRef.value.validate();

        loading.value = true;

        await userStore.login(loginForm);

        // Load role/permissions before checking employee clock status.
        await userStore.getInfo();

        // CheckIn role ONLY
        if (userStore.roleId === 10) {
          await router.push('/checkin/customercheckin');
          return;
        }

        await userStore.loadClockStatus();

        await router.push({ path: redirect.value || '/', query: otherQuery });

      } catch (error) {
        console.error(error);
      } finally {
        loading.value = false;
      }
}

/**
       * Extract query parameters except redirect.
       */
function getOtherQuery(
      query: Record<string, unknown>
): QueryType {
      return Object.keys(query).reduce(
        (acc: QueryType, key) => {
          if (key !== 'redirect') {
            const value = query[key];

            if (typeof value === 'string') {
              acc[key] = value;
            }
          }

          return acc;
        },
        {}
      );
}

/**
       * Focus the appropriate field on mount.
       */
onMounted(() => {
      if (!loginForm.username) {
        usernameRef.value?.focus();
      } else if (!loginForm.password) {
        passwordRef.value?.focus();
      }
});
</script>
