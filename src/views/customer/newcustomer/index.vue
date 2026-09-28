<template>
    <div class="new-customer-page irfan-customer-newcustomer-index irfan-ui-page">
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
                    <el-form ref="customerFormRef" :model="customerForm" :rules="formRules" label-position="top" class="customer-form">
                        <!-- NAME -->
                        <el-row :gutter="16">
                            <el-col :xs="24" :sm="12">
                                <el-form-item label="First Name" prop="firstname">
                                    <el-input v-model="customerForm.firstname" placeholder="Enter first name" clearable>
                                        <template #prefix>
                                            <el-icon><User /></el-icon>
                                        </template>
                                    </el-input>
                                </el-form-item>
                            </el-col>

                            <el-col :xs="24"
                                    :sm="12">
                                <el-form-item label="Last Name"
                                              prop="lastname">
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
                            <el-col :xs="24"
                                    :sm="12">
                                <el-form-item label="Phone"
                                              prop="phone">
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

                            <el-col :xs="24"
                                    :sm="12">
                                <el-form-item label="Date of Birth"
                                              prop="dob">
                                    <el-date-picker v-model="customerForm.dob"
                                                    type="date"
                                                    format="MM/DD/YYYY"
                                                    value-format="MM/DD/YYYY"
                                                    placeholder="Select date of birth"
                                                    style="width: 100%" />
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <!-- STATUS -->
                        <div class="status-box">
                            <div>
                                <div class="status-title">
                                    Customer Status
                                </div>

                                <div class="status-description">
                                    Controls whether this customer account is active.
                                </div>
                            </div>

                            <el-switch v-model="customerForm.isactive"
                                       inline-prompt
                                       active-text="Active"
                                       inactive-text="Inactive" />
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
      Check
} from '@element-plus/icons-vue'

import { useUserStore } from '@/store/modules/user'
import { useRouter } from 'vue-router'
import CameraApp from '@/components/Camera'
import { savecustomer } from '@/api/customer'
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
      isactive: true,
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

        const cleanPhone = unformatPhone(customerForm.phone)

        // Keep reactive display value formatted.
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

        if (!response) {
          throw new Error(
            'Upload failed'
          )
        }

        if (response.success) {
          ElMessage.success(
            'New customer has been added successfully.'
          )

          resetForm()

          router.push({
            path: '/customer/index'
          })
        }

      } catch (error) {
        console.error(
          'Save customer error:',
          error
        )
      } finally {
        loading.value = false
      }
}

// ============================================================
// RESET / CANCEL / BACK
// ============================================================

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

