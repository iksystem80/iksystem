<template>
    <div class="login-container">
        <!-- Animated Background -->
        <div class="background-effects">
            <div class="orb orb-one"></div>
            <div class="orb orb-two"></div>
            <div class="orb orb-three"></div>
            <img :src="logo" alt="IK Logo" class="bg-logo" />
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
import { nextTick,onMounted, reactive,ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { validUsername } from '@/utils/validate'
import { useUserStore } from '@/store/modules/user'
import { Lock, User } from '@element-plus/icons-vue'

defineOptions({
  name: 'Login'
})

const title = 'IK System'
const logo = '/src/assets/logo.png'

interface LoginForm {
  username: string
  password: string
}

interface QueryType {
  [key: string]: string
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

/**
 * Form reference
 */
const loginFormRef = ref<FormInstance>()

/**
 * Input references
 */
const usernameRef = ref()
const passwordRef = ref()

/**
 * Login form
 */
const loginForm = reactive<LoginForm>({
  username: '',
  password: ''
})

/**
 * Login state
 */
const passwordType = ref<'password' | 'text'>('password')
const capsTooltip = ref(false)
const loading = ref(false)

/**
 * Redirect information
 */
const redirect = ref<string | undefined>(
  typeof route.query.redirect === 'string'
    ? route.query.redirect
    : undefined
)

const otherQuery = reactive<QueryType>(
  getOtherQuery(route.query)
)

/**
 * Validation rules
 */
const validateUsername = (
  _rule: unknown,
  value: string,
  callback: (error?: Error) => void
) => {
  //if (!validUsername(value)) {
    //callback(
      //new Error('Please enter the correct user name')
    //)
  //} else {
    callback()
  //}
}

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
    )
  } else {
    callback()
  }
}

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
}

/**
 * Check Caps Lock state.
 */
function checkCapslock(event: KeyboardEvent) {
  const key = event.key

  capsTooltip.value =
    !!key &&
    key.length === 1 &&
    key >= 'A' &&
    key <= 'Z'
}

/**
 * Toggle password visibility.
 */
async function showPwd() {
  passwordType.value = passwordType.value === 'password'? 'text': 'password'

  await nextTick()

  passwordRef.value?.focus()
}

/**
 * Login.
 */
async function handleLogin() {
    if (!loginFormRef.value) {
        return
    }

    try {
        await loginFormRef.value.validate()

        loading.value = true

        await userStore.login(loginForm)

        await userStore.loadClockStatus()

        console.log('path:' + redirect.value)
        console.log('query: ' + otherQuery)
        await router.push({ path: redirect.value || '/', query: otherQuery })
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
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
        const value = query[key]

        if (typeof value === 'string') {
          acc[key] = value
        }
      }

      return acc
    },
    {}
  )
}

/**
 * Focus the appropriate field on mount.
 */
onMounted(() => {
  if (!loginForm.username) {
    usernameRef.value?.focus()
  } else if (!loginForm.password) {
    passwordRef.value?.focus()
  }
})
</script>

<style lang="scss">
    .login-container {

        .el-input {
            width: 100%;
        }

        .el-input__wrapper {
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 14px 0 5px !important;
        }

        .el-input__inner {
            height: 54px;
            color: #27272a;
            font-size: 14px;
        }

            .el-input__inner::placeholder {
                color: #a1a1aa;
            }

        .el-form-item {
            margin-bottom: 22px;
        }

        .el-form-item__content {
            line-height: normal;
        }

        .el-button.is-loading {
            opacity: 0.9;
        }
    }

        .login-container input:-webkit-autofill,
        .login-container input:-webkit-autofill:hover
        {
            -webkit-text-fill-color: #27272a !important;
            -webkit-box-shadow: 0 0 0 1000px #fafafa inset !important;
            caret-color: #27272a;
        }
        
        .login-container input:-webkit-autofill:focus,
        .login-container input:-webkit-autofill:active {
            -webkit-text-fill-color: #27272a !important;
            -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
            caret-color: #27272a;
        }
</style>

<style lang="scss" scoped>

    .bg-logo {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 520px;
        max-width: 60vw;
        transform: translate(-50%, -50%);
        opacity: 0.02;
        pointer-events: none;
        user-select: none;
        z-index: 1;
        filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.08));
    }

        .login-container {
            position: relative;
            width: 100%;
            min-height: 100vh;
            overflow: hidden;
            background: linear-gradient( 135deg, #09090b 0%, #18181b 45%, #27272a 100% );
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        /* =========================================
       BACKGROUND
    ========================================= */

        .background-effects {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
        }

        .grid-overlay {
            position: absolute;
            inset: 0;
            background-image: linear-gradient( rgba(255,255,255,0.03) 1px, transparent 1px ), linear-gradient( 90deg, rgba(255,255,255,0.03) 1px, transparent 1px );
            background-size: 50px 50px;
            mask-image: linear-gradient( to bottom, rgba(0,0,0,0.8), transparent );
            animation: gridMove 18s linear infinite;
        }

        @keyframes gridMove {
            from {
                transform: translateY(0);
            }

            to {
                transform: translateY(50px);
            }
        }

        /* =========================================
       FLOATING ORBS
    ========================================= */

        .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(4px);
            opacity: 0.45;
        }

        .orb-one {
            width: 420px;
            height: 420px;
            top: -140px;
            left: -100px;
            background: radial-gradient( circle, #887baf 0%, transparent 68% );
            animation: floatOne 9s ease-in-out infinite;
        }

    .orb-two {
        width: 500px;
        height: 500px;
        right: -170px;
        bottom: -180px;
        background: radial-gradient( circle, #887baf 0%, transparent 70% );
        animation: floatTwo 12s ease-in-out infinite;
    }

        .orb-three {
            width: 350px;
            height: 350px;
            left: 40%;
            top: 35%;
            background: radial-gradient( circle, #887baf 0%, transparent 70% );
            opacity: 0.25;
            animation: floatThree 8s ease-in-out infinite;
        }

        @keyframes floatOne {
            0%, 100% {
                transform: translate(0, 0) scale(1);
            }

            50% {
                transform: translate(55px, 35px) scale(1.08);
            }
        }

        @keyframes floatTwo {
            0%, 100% {
                transform: translate(0, 0);
            }

            50% {
                transform: translate(-50px, -35px);
            }
        }

        @keyframes floatThree {
            0%, 100% {
                transform: translateY(0);
            }

            50% {
                transform: translateY(-35px);
            }
        }

        /* =========================================
       LAYOUT
    ========================================= */

        .login-layout {
            position: relative;
            z-index: 2;
            min-height: 100vh;
            display: grid;
            grid-template-columns: minmax(420px, 1.15fr) minmax(420px, 0.85fr);
        }

        /* =========================================
       LEFT PANEL
    ========================================= */

        .welcome-panel {
            position: relative;
            display: flex;
            flex-direction: column;
            padding: 55px 70px;
            color: #fff;
            animation: welcomeEnter 0.9s cubic-bezier(.16,1,.3,1);
        }

        @keyframes welcomeEnter {
            from {
                opacity: 0;
                transform: translateX(-45px);
            }

            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .brand-badge {
            display: inline-flex;
            align-items: center;
            width: fit-content;
            gap: 9px;
            padding: 8px 13px;
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 100px;
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            color: #d4d4d8;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1.5px;
        }

        .brand-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #8b5cf6;
            box-shadow: 0 0 0 5px rgba(139,92,246,0.15);
            animation: pulseDot 2s infinite;
        }

        @keyframes pulseDot {
            0% {
                box-shadow: 0 0 0 0 rgba(139,92,246,0.5);
            }

            70% {
                box-shadow: 0 0 0 10px rgba(139,92,246,0);
            }

            100% {
                box-shadow: 0 0 0 0 rgba(139,92,246,0);
            }
        }

        .welcome-content {
            margin: auto 0;
            max-width: 620px;
        }

            .welcome-content h1 {
                margin: 0;
                font-size: clamp(55px, 6vw, 92px);
                line-height: 0.95;
                font-weight: 700;
                letter-spacing: -4px;
                color: #fafafa;
            }

                .welcome-content h1 span {
                    display: block;
                    background: linear-gradient( 90deg, #887baf, #4a3c73 );
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

            .welcome-content > p {
                max-width: 500px;
                margin: 28px 0 38px;
                color: #a1a1aa;
                font-size: 15px;
                line-height: 1.8;
            }

        /* =========================================
       FEATURES
    ========================================= */

        .feature-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .feature-item {
            display: flex;
            align-items: center;
            gap: 14px;
            width: fit-content;
            min-width: 300px;
            padding: 12px 15px;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 12px;
            background: rgba(255,255,255,0.035);
            transition: transform 0.25s ease, background 0.25s ease;
        }

            .feature-item:hover {
                transform: translateX(8px);
                background: rgba(255,255,255,0.07);
            }

        .feature-icon {
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9px;
            background: rgba(124,58,237,0.18);
            color: #a78bfa;
            font-size: 10px;
            font-weight: 700;
        }

        .feature-item strong {
            display: block;
            color: #e4e4e7;
            font-size: 12px;
        }

        .feature-item small {
            display: block;
            margin-top: 2px;
            color: #71717a;
            font-size: 10px;
        }

        .welcome-footer {
            color: #52525b;
            font-size: 10px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        /* =========================================
       RIGHT PANEL
    ========================================= */

        .login-panel {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
        }

        .login-card {
            width: 100%;
            max-width: 430px;
            padding: 42px;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 24px;
            background: rgba(255,255,255,0.94);
            box-shadow: 0 35px 80px rgba(0,0,0,0.35);
            backdrop-filter: blur(25px);
            animation: loginCardEnter 0.9s 0.12s cubic-bezier(.16,1,.3,1) both;
        }

        @keyframes loginCardEnter {
            from {
                opacity: 0;
                transform: translateY(45px) scale(0.96);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* =========================================
       LOGIN HEADER
    ========================================= */

        .mini-logo {
            width: 43px;
            height: 43px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 27px;
            border-radius: 13px;
            background: linear-gradient( 135deg, #887baf, #4a3c73 );
            box-shadow: 0 10px 25px rgba(124,58,237,0.3);
        }

            .mini-logo span {
                width: 14px;
                height: 14px;
                border: 3px solid white;
                border-radius: 4px;
                transform: rotate(45deg);
                animation: logoRotate 5s linear infinite;
            }

        @keyframes logoRotate {
            from {
                transform: rotate(45deg);
            }

            to {
                transform: rotate(405deg);
            }
        }

        .signin-label {
            display: block;
            margin-bottom: 8px;
            color: #887baf;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 2px;
        }

        .login-card-header h2 {
            margin: 0;
            color: #18181b;
            font-size: 30px;
            font-weight: 700;
            letter-spacing: -1px;
        }

        .login-card-header p {
            margin: 8px 0 30px;
            color: #71717a;
            font-size: 13px;
        }

        /* =========================================
       INPUT
    ========================================= */

        .login-field {
            height: 58px;
            display: flex;
            border: 1px solid #e4e4e7;
            border-radius: 12px;
            background: #fafafa;
            transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

            .login-field:focus-within {
                border-color: #8b5cf6;
                background: white;
                box-shadow: 0 0 0 4px rgba(139,92,246,0.09);
                transform: translateY(-1px);
            }

        .svg-container {
            width: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #a1a1aa;
            font-size: 17px;
        }

        .show-pwd {
            position: absolute;
            right: 16px;
            top: 18px;
            color: #a1a1aa;
            cursor: pointer;
            transition: color 0.2s ease, transform 0.2s ease;
        }

            .show-pwd:hover {
                color: #887baf;
                transform: scale(1.08);
            }

        /* =========================================
       OPTIONS
    ========================================= */

        .login-options {
            display: flex;
            justify-content: space-between;
            margin: -3px 2px 22px;
            color: #a1a1aa;
            font-size: 10px;
        }

        .secure-dot {
            color: #16a34a;
        }

        /* =========================================
       LOGIN BUTTON
    ========================================= */

        .login-button {
            width: 100%;
            height: 52px;
            border: none;
            border-radius: 12px;
            background: linear-gradient( 135deg, #887baf, #4a3c73 );
            font-weight: 700;
            letter-spacing: 0.2px;
            box-shadow: 0 14px 30px rgba(124,58,237,0.25);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

            .login-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 18px 35px rgba(124,58,237,0.35);
            }

            .login-button:active {
                transform: translateY(0);
            }

        .button-arrow {
            display: inline-block;
            margin-left: 7px;
            transition: transform 0.2s ease;
        }

        .login-button:hover
        .button-arrow {
            transform: translateX(5px);
        }

        .login-bottom-text {
            margin-top: 27px;
            text-align: center;
            color: #a1a1aa;
            font-size: 9px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        /* =========================================
       TABLET
    ========================================= */

        @media (max-width: 950px) {

            .login-layout {
                grid-template-columns: 1fr;
            }

            .welcome-panel {
                display: none;
            }

            .login-panel {
                min-height: 100vh;
            }
        }

        /* =========================================
       MOBILE
    ========================================= */

        @media (max-width: 520px) {

            .login-panel {
                padding: 18px;
            }

            .login-card {
                padding: 34px 24px;
                border-radius: 20px;
            }

            .login-card-header h2 {
                font-size: 26px;
            }
        }

        /* =========================================
       REDUCED MOTION
    ========================================= */

        @media ( prefers-reduced-motion: reduce ) {

            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }

  
</style>