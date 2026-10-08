<template>
  <div class="app-container new-customer-page irfan-customer-newcustomer-index">
    <!-- ===================================================== -->
    <!-- HEADER -->
    <!-- ===================================================== -->
    <div class="page-header">
      <div class="header-left">
        <el-button circle class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <div>
          <h2 class="page-title">New Customer</h2>

          <div class="page-subtitle">
            Add customer information and capture a profile photo.
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================== -->
    <!-- CONTENT -->
    <!-- ===================================================== -->
    <el-row :gutter="20">
      <!-- =================================================== -->
      <!-- CAMERA -->
      <!-- =================================================== -->
      <el-col :xs="24" :sm="24" :md="9" :lg="7">
        <el-card shadow="never" class="section-card photo-card">
          <div class="section-header">
            <div class="section-icon">
              <el-icon><Camera /></el-icon>
            </div>

            <div>
              <div class="section-title">
                Customer Photo
              </div>

              <div class="section-description">
                Capture a clear photo for the customer profile.
              </div>
            </div>
          </div>

          <div class="camera-wrapper">
            <CameraApp @captured="handleCapturedImage" />
          </div>

          <div v-if="capturedImage" class="photo-status">
            <el-icon><CircleCheck /></el-icon>
            Photo captured successfully
          </div>
        </el-card>
      </el-col>

      <!-- =================================================== -->
      <!-- CUSTOMER FORM -->
      <!-- =================================================== -->
      <el-col :xs="24" :sm="24" :md="15" :lg="13">
        <el-card shadow="never" class="section-card">
          <div class="section-header">
            <div class="section-icon">
              <el-icon><User /></el-icon>
            </div>

            <div>
              <div class="section-title">
                Customer Information
              </div>

              <div class="section-description">
                Enter the customer's basic profile information.
              </div>
            </div>
          </div>

          <el-divider />

          <el-form ref="customerFormRef"
                   :model="customerForm"
                   :rules="formRules"
                   label-position="top"
                   class="customer-form">
            <!-- NAME -->
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="First Name" prop="firstname">
                  <el-input v-model="customerForm.firstname"
                            placeholder="Enter first name"
                            clearable>
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :sm="12">
                <el-form-item label="Last Name" prop="lastname">
                  <el-input v-model="customerForm.lastname"
                            placeholder="Enter last name"
                            clearable>
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- PHONE / DOB -->
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="Phone" prop="phone">
                  <el-input v-model="customerForm.phone"
                            maxlength="14"
                            placeholder="(555) 555-5555"
                            @input="formatPhoneInput">
                    <template #prefix>
                      <el-icon><Phone /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :sm="12">
                <el-form-item label="Date of Birth" prop="dob">
                  <el-date-picker v-model="customerForm.dob"
                                  type="date"
                                  format="MM/DD/YYYY"
                                  value-format="MM/DD/YYYY"
                                  placeholder="Select date of birth"
                                  style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- VERIFICATION STATUS -->
            <div class="status-box">
              <div>
                <div class="status-title">
                  Phone Verification
                </div>

                <div class="status-description">
                  New customers are saved inactive until their phone number is verified.
                </div>
              </div>

              <el-tag type="warning" effect="light">
                Required
              </el-tag>
            </div>

            <!-- ACTIONS -->
            <div class="form-actions">
              <el-button @click="cancelForm">
                Cancel
              </el-button>

              <el-button type="primary"
                         :loading="loading"
                         @click="submitForm">
                <el-icon v-if="!loading">
                  <Check />
                </el-icon>

                <span>Save Customer</span>
              </el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- ===================================================== -->
    <!-- PHONE VERIFICATION -->
    <!-- ===================================================== -->
    <el-dialog v-model="verificationDialogVisible"
               width="760px"
               class="customer-verification-dialog modern-verification-dialog"
               :close-on-click-modal="false"
               :close-on-press-escape="false"
               :show-close="false">
      <div class="verification-shell">
        <div class="verification-visual">
          <img :src="verificationIllustration"
               alt="Phone verification"
               class="verification-illustration">

          <div class="verification-visual-copy">
            <div class="verification-visual-title">
              {{ verificationCodeSent ? 'Verification code sent' : 'Phone verification required' }}
            </div>

            <div class="verification-visual-text">
              <template v-if="verificationCodeSent">
                Enter the 6-digit code sent to
                <strong>{{ savedCustomerPhone }}</strong>.
              </template>
              <template v-else>
                Send a verification code to activate this customer.
              </template>
            </div>
          </div>
        </div>

        <div class="verification-panel">
          <div class="verification-panel-heading">
            <div class="verification-panel-icon">
              <el-icon><Lock /></el-icon>
            </div>

            <div>
              <h3>Verify Customer Phone</h3>
              <p v-if="verificationCodeSent">
                Enter the 6-digit code sent to the customer's phone.
              </p>
              <p v-else>
                Send a verification code to continue.
              </p>
            </div>
          </div>

          <div v-if="verificationCodeSent" class="otp-section">
            <label>Verification Code</label>

            <div class="otp-inputs" @paste.prevent="handleOtpPaste">
              <el-input v-for="(_, index) in verificationDigits"
                        :key="index"
                        :ref="el => setOtpRef(el, index)"
                        v-model="verificationDigits[index]"
                        maxlength="1"
                        inputmode="numeric"
                        autocomplete="one-time-code"
                        class="otp-input"
                        @input="handleOtpInput(index)"
                        @keydown.backspace="handleOtpBackspace(index)"
                        @keyup.enter="verifyCustomerPhone" />
            </div>

            <div class="verification-resend">
              <span>Didn't receive the code?</span>
              <el-button link
                         type="primary"
                         :loading="sendingCode"
                         @click="sendVerificationCode">
                Resend Code
              </el-button>
            </div>
          </div>

          <div v-else class="verification-send-state">
            <el-icon><Phone /></el-icon>
            <span>Ready to send a 6-digit verification code.</span>
          </div>

          <div class="verification-primary-action">
            <el-button v-if="verificationCodeSent"
                       type="primary"
                       size="large"
                       :loading="verifyingCode"
                       :disabled="verificationCode.length !== 6"
                       @click="verifyCustomerPhone">
              <el-icon v-if="!verifyingCode"><Check /></el-icon>
              Verify & Activate
            </el-button>

            <el-button v-else
                       type="primary"
                       size="large"
                       :loading="sendingCode"
                       @click="sendVerificationCode">
              Send Verification Code
            </el-button>
          </div>

          <div class="verification-secondary-actions">
            <el-button type="warning"
                       plain
                       :loading="bypassingVerification"
                       @click="bypassCustomerVerification">
              Bypass Verification
            </el-button>

            <el-button @click="finishWithoutVerification">
              Finish Later
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
        ArrowLeft,
        Camera,
        User,
        Phone,
        CircleCheck,
        Check,
        Lock
} from '@element-plus/icons-vue'

import { useUserStore } from '@/store/modules/user'
import { useRouter } from 'vue-router'
import CameraApp from '@/components/mycamera'
import verificationIllustration from '@/assets/phone-verification.png'
import { savecustomer } from '@/api/customer'
import { sendcustomerverification, verifycustomerverification, bypasscustomerverification } from '@/api/customerverification'
import { unformatPhone } from '@/utils/phone'

const router = useRouter()
const userStore = useUserStore()

// ============================================================
// FORM
// ============================================================

const defaultForm = {
        firstname: '',
        lastname: '',
        dob: null,
        datecreated: '',
        locationid: userStore.locationId,
        phone: '',
        createdby: userStore.userId
}

const customerFormRef = ref(null)
const loading = ref(false)
const capturedImage = ref(null)

const customerForm = reactive({
        ...defaultForm
})

// ============================================================
// PHONE VERIFICATION
// ============================================================

const verificationDialogVisible = ref(false)
const verificationCodeSent = ref(false)
const verificationCode = ref('')
const verificationDigits = ref(['', '', '', '', '', ''])
const otpInputRefs = ref([])
const sendingCode = ref(false)
const verifyingCode = ref(false)
const bypassingVerification = ref(false)
const savedCustomerId = ref(null)
const savedCustomerPhone = ref('')

function setOtpRef(el, index) {
        if (el) {
          otpInputRefs.value[index] = el
        }
}

function syncVerificationCode() {
        verificationCode.value = verificationDigits.value.join('')
}

function resetVerificationCode() {
        verificationDigits.value = ['', '', '', '', '', '']
        verificationCode.value = ''
}

function focusOtp(index) {
        const target = otpInputRefs.value[index]
        if (target?.focus) {
          target.focus()
        }
}

function handleOtpInput(index) {
        const raw = String(verificationDigits.value[index] || '')
        verificationDigits.value[index] = raw.replace(/\D/g, '').slice(-1)
        syncVerificationCode()

        if (verificationDigits.value[index] && index < 5) {
          focusOtp(index + 1)
        }
}

function handleOtpBackspace(index) {
        if (!verificationDigits.value[index] && index > 0) {
          verificationDigits.value[index - 1] = ''
          syncVerificationCode()
          focusOtp(index - 1)
        }
}

function handleOtpPaste(event) {
        const digits = String(event?.clipboardData?.getData('text') || '')
          .replace(/\D/g, '')
          .slice(0, 6)
          .split('')

        if (!digits.length) {
          return
        }

        verificationDigits.value = Array.from(
          { length: 6 },
          (_, index) => digits[index] || ''
        )

        syncVerificationCode()
        focusOtp(Math.min(digits.length, 6) - 1)
}

// ============================================================
// VALIDATION
// ============================================================

const formRules = {
        firstname: [
          {
            required: true,
            message: 'First name is required',
            trigger: 'blur'
          },
          {
            min: 2,
            max: 50,
            message: 'Length should be 2 to 50 characters',
            trigger: 'blur'
          }
        ],

        lastname: [
          {
            required: true,
            message: 'Last name is required',
            trigger: 'blur'
          },
          {
            min: 2,
            max: 50,
            message: 'Length should be 2 to 50 characters',
            trigger: 'blur'
          }
        ],

        phone: [
          {
            required: true,
            message: 'Phone number is required',
            trigger: 'blur'
          },
          {
            validator: (rule, value, callback) => {
              const phone = unformatPhone(value)

              if (phone.length !== 10) {
                callback(new Error('Enter a valid 10-digit phone number'))
                return
              }

              callback()
            },
            trigger: 'blur'
          }
        ],

        dob: [
          {
            required: true,
            message: 'Please pick a date of birth',
            trigger: 'change'
          }
        ]
}

// ============================================================
// PHONE FORMAT
// ============================================================

function formatPhoneInput(value) {
        const digits = value
          .replace(/\D/g, '')
          .slice(0, 10)

        if (digits.length <= 3) {
          customerForm.phone =
            digits ? `(${digits}` : ''
        } else if (digits.length <= 6) {
          customerForm.phone =
            `(${digits.slice(0, 3)}) ${digits.slice(3)}`
        } else {
          customerForm.phone =
            `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
        }
}

// ============================================================
// CAMERA
// ============================================================

function handleCapturedImage(image) {
        capturedImage.value = image
}

// ============================================================
// SAVE CUSTOMER
// ============================================================

async function submitForm() {
        if (!customerFormRef.value) {
          return
        }

        try {
          const valid =
            await customerFormRef.value.validate()

          if (!valid) {
            return
          }

          if (!capturedImage.value) {
            ElMessage.warning(
              'Please capture a customer photo.'
            )
            return
          }

          loading.value = true

          const cleanPhone =
            unformatPhone(customerForm.phone)

          const customerPayload = {
            ...customerForm,
            phone: cleanPhone,
            locationid: userStore.locationId,
            createdby: userStore.userId
          }

          const fileName =
            `${customerForm.firstname}${customerForm.lastname}-${cleanPhone}.png`

          const imageFile = new File(
            [capturedImage.value],
            fileName,
            {
              type:
                capturedImage.value.type ||
                'image/png'
            }
          )

          const formData = new FormData()

          formData.append(
            'image',
            imageFile
          )

          formData.append(
            'customer',
            JSON.stringify(customerPayload)
          )

          const response =
            await savecustomer(formData)

          if (!response?.success) {
            throw new Error(
              response?.message ||
              'Customer could not be saved.'
            )
          }

          const customerId =
            Number(response?.data?.id)

          if (!Number.isInteger(customerId) || customerId <= 0) {
            throw new Error(
              'Customer was saved but customer ID was not returned.'
            )
          }

          savedCustomerId.value = customerId
          savedCustomerPhone.value = customerForm.phone
          resetVerificationCode()
          verificationCodeSent.value = false
          verificationDialogVisible.value = true

          ElMessage.success(
            'Customer saved as inactive. Phone verification is required.'
          )

          await sendVerificationCode()
        } catch (error) {
          console.error(
            'Save customer error:',
            error
          )

          const responseData =
            error?.response?.data

          if (
            responseData?.errorCode === 'NO_FACE'
          ) {
            capturedImage.value = null

            ElMessage.error(
              'Face not detected. Please capture a new clear photo and try again.'
            )

            return
          }

          ElMessage.error(
            responseData?.message ||
            error?.message ||
            'Unable to save customer.'
          )
        } finally {
          loading.value = false
        }
}

// ============================================================
// SEND OTP
// ============================================================

async function sendVerificationCode() {
        if (!savedCustomerId.value) {
          return
        }

        try {
          sendingCode.value = true

          const response =
            await sendcustomerverification({
              customerId: savedCustomerId.value
            })

          if (!response?.success) {
            throw new Error(
              response?.message ||
              'Unable to send verification code.'
            )
          }

          verificationCodeSent.value = true
          resetVerificationCode()

          ElMessage.success(
            response.message ||
            'Verification code sent.'
          )
        } catch (error) {
          console.error(
            'Send verification code error:',
            error
          )

          ElMessage.error(
            error?.response?.data?.message ||
            error?.message ||
            'Unable to send verification code.'
          )
        } finally {
          sendingCode.value = false
        }
}

// ============================================================
// VERIFY OTP
// ============================================================

async function verifyCustomerPhone() {
        if (
          !savedCustomerId.value ||
          verificationCode.value.trim().length !== 6
        ) {
          return
        }

        try {
          verifyingCode.value = true

          const response =
            await verifycustomerverification({
              customerId: savedCustomerId.value,
              code: verificationCode.value.trim()
            })

          if (!response?.success) {
            throw new Error(
              response?.message ||
              'Unable to verify phone number.'
            )
          }

          ElMessage.success(
            'Phone verified. Customer is now active.'
          )

          completeCustomerFlow()
        } catch (error) {
          console.error(
            'Verify customer phone error:',
            error
          )

          ElMessage.error(
            error?.response?.data?.message ||
            error?.message ||
            'Invalid verification code.'
          )
        } finally {
          verifyingCode.value = false
        }
}

// ============================================================
// AUTHORIZED BYPASS
// Backend permission remains the source of truth.
// Unauthorized users will receive 403 from the API.
// ============================================================

async function bypassCustomerVerification() {
        if (!savedCustomerId.value) {
          return
        }

        try {
          bypassingVerification.value = true

          const response =
            await bypasscustomerverification({
              customerId: savedCustomerId.value
            })

          if (!response?.success) {
            throw new Error(
              response?.message ||
              'Verification bypass was not allowed.'
            )
          }

          ElMessage.success(
            'Verification bypassed. Customer is now active.'
          )

          completeCustomerFlow()
        } catch (error) {
          console.error(
            'Bypass customer verification error:',
            error
          )

          ElMessage.error(
            error?.response?.data?.message ||
            error?.message ||
            'You are not authorized to bypass verification.'
          )
        } finally {
          bypassingVerification.value = false
        }
}

// ============================================================
// COMPLETE / FINISH LATER
// ============================================================

function completeCustomerFlow() {
        verificationDialogVisible.value = false
        resetForm()

        router.push({
          path: '/customer/index'
        })
}

function finishWithoutVerification() {
        verificationDialogVisible.value = false

        ElMessage.warning(
          'Customer remains inactive until phone verification is completed.'
        )

        resetForm()

        router.push({
          path: '/customer/index'
        })
}

// ============================================================
// RESET / CANCEL / BACK
// ============================================================

function resetVerification() {
        savedCustomerId.value = null
        savedCustomerPhone.value = ''
        resetVerificationCode()
        verificationCodeSent.value = false
}

function resetForm() {
        customerFormRef.value?.resetFields()

        Object.assign(
          customerForm,
          {
            ...defaultForm,
            locationid: userStore.locationId,
            createdby: userStore.userId
          }
        )

        capturedImage.value = null
        resetVerification()
}

function cancelForm() {
        resetForm()

        router.push({
          path: '/customer/index'
        })
}

function goBack() {
        router.push({
          path: '/customer/index'
        })
}
</script>
