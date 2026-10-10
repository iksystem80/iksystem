<template>
  <div class="app-container irfan-customer-index">
    <!-- ===================================================== -->
    <!-- HEADER -->
    <!-- ===================================================== -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Customers</h2>
        <p>
          Manage customer profiles, status and loyalty points.
        </p>
      </div>
      <div class="header-actions">
        <el-button type="primary" class="action-button" @click="handleNewCustomer">
          <el-icon style="color: #fff;"><Plus /></el-icon>
          <span style="color: #fff;">New Customer</span>
        </el-button>
        <el-button class="action-button" @click="drawer2 = true">
          <el-icon><Filter /></el-icon>
          <span>Filter</span>
        </el-button>
      </div>
    </div>
    <!-- ===================================================== -->
    <!-- SUMMARY / SEARCH -->
    <!-- ===================================================== -->
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div class="number-count">
          <div class="count-icon">
            <el-icon><User /></el-icon>
          </div>
          <div>
            <div class="count-value">
              {{ filteredCustomers.length }}
            </div>
            <div class="count-label">
              {{ filteredCustomers.length === 1 ? 'Customer' : 'Customers' }}
            </div>
          </div>
        </div>
        <div class="toolbar-right">
          <el-input v-model="searchText" clearable placeholder="Search customers..." class="search-input">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-button :loading="loading"
                     @click="loadCustomers">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- ===================================================== -->
    <!-- DESKTOP TABLE -->
    <!-- CUSTOMER TABLE LIST IS KEPT THE SAME -->
    <!-- ===================================================== -->

    <el-card v-if="device !== 'mobile'"
             shadow="never"
             class="table-card">
      <el-table v-loading="loading"
                :data="filteredCustomers"
                style="width: 100%; height:66vh">
        <!-- Product Image -->
        <el-table-column label="" width="105">
          <template #default="{ row }">
            <el-image class="img-circle"
                      :src="row.avatar"
                      :preview-src-list="[row.avatar]"
                      fit="cover"
                      preview-teleported />
          </template>
        </el-table-column>

        <!-- First Name -->
        <el-table-column prop="firstname"
                         label="Name"
                         min-width="160">
          <template #default="{ row }">
            {{ row.firstname }} {{ row.lastname }}
          </template>
        </el-table-column>
        <!-- Phone -->
        <el-table-column prop="phone"
                         label="Phone"
                         min-width="120">
          <template #default="{ row }">
            {{ formatPhone(row.phone) || 'No phone' }}
          </template>
        </el-table-column>

        <!-- Date of Birth -->
        <el-table-column prop="dob"
                         label="Date of Birth"
                         min-width="120" />

        <!-- Date Registered -->
        <el-table-column prop="datecreated"
                         label="Registered On"
                         min-width="120" />

        <!-- Last Visit -->
        <el-table-column prop="lastvisited"
                         label="Last Visit On"
                         min-width="120" />

        <!-- Points -->
        <el-table-column prop="points"
                         label="Points"
                         min-width="110">
          <template #default="{ row }">
            <PointsBadge :points="row.points" />
          </template>
        </el-table-column>

        <!-- Verification Status -->
        <el-table-column label="Verification"
                         min-width="125">
          <template #default="{ row }">
            <VerificationBadge
              :status="verificationStatusLabel(row)"
              :clickable="verificationStatusLabel(row) === 'Unverified'"
              @click="verificationStatusLabel(row) === 'Unverified' && openVerification(row)"
            />
          </template>
        </el-table-column>

        <!-- Operations -->
        <el-table-column label="" width="130" align="right">
          <template #default="{ row }">
            <div class="customer-row-actions">
              <el-tooltip :content="row.isactive ? 'Active' : 'Inactive'"
                          placement="top">
                <el-button v-if="row.isactive"
                           link
                           type="success" class="action-icon-btn"
                           @click="handleStatus(row)">
                  <el-icon><CircleCheck /></el-icon>
                </el-button>

                <el-button v-else
                           link
                           type="danger" class="action-icon-btn"
                           @click="handleStatus(row)">
                  <el-icon><CircleClose /></el-icon>
                </el-button>
              </el-tooltip>



              <el-tooltip content="Edit" placement="top">
                <el-button link
                           class="action-icon-btn"
                           @click="handleEdit(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>

              <el-tooltip content="Delete" placement="top">
                <el-button link
                           type="danger" class="action-icon-btn"
                           @click="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>



            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && filteredCustomers.length === 0"
                description="No customers found" />
    </el-card>

    <!-- ===================================================== -->
    <!-- MOBILE -->
    <!-- ===================================================== -->

    <div v-else
         v-loading="loading"
         class="mobile-list">
      <el-card v-for="row in filteredCustomers"
               :key="row.id"
               shadow="never"
               class="customer-card">
        <div class="mobile-card-content">

          <!-- LEFT SIDE -->
          <div class="mobile-left">
            <el-image class="mobile-avatar"
                      :src="row.avatar"
                      :preview-src-list="[row.avatar]"
                      fit="cover"
                      preview-teleported />

            <div class="mobile-left-info">
              <div class="mobile-name">
                {{ row.firstname }} {{ row.lastname }}
              </div>

              <div class="mobile-phone">
                {{ formatPhone(row.phone) || 'No phone' }}
              </div>

              <div class="mobile-badges">
                <PointsBadge :points="row.points" />
              </div>
            </div>
          </div>

          <!-- RIGHT SIDE -->
          <div class="mobile-right">
            <div class="mobile-detail">
              <span class="detail-label">Registered</span>
              <span class="detail-value">
                {{ row.datecreated || '---' }}
              </span>
            </div>

            <div class="mobile-detail">
              <span class="detail-label">Last Visit</span>
              <span class="detail-value">
                {{ row.lastvisited || '---' }}
              </span>
            </div>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="mobile-actions">
          <div class="mobile-verification-action">
            <el-tooltip :content="verificationStatusLabel(row)" placement="top">
              <VerificationBadge
                :status="verificationStatusLabel(row)"
                :clickable="verificationStatusLabel(row) === 'Unverified'"
                icon-only
                @click="verificationStatusLabel(row) === 'Unverified' && openVerification(row)"
              />
            </el-tooltip>
          </div>

          <div class="mobile-action-buttons">
            <el-tooltip :content="row.isactive ? 'Active' : 'Inactive'"
                        placement="top">
              <el-button v-if="row.isactive"
                         link
                         type="success"
                         class="mobile-action-button"
                         @click="handleStatus(row)">
                <el-icon><CircleCheck /></el-icon>
              </el-button>

              <el-button v-else
                         link
                         type="danger"
                         class="mobile-action-button"
                         @click="handleStatus(row)">
                <el-icon><CircleClose /></el-icon>
              </el-button>
            </el-tooltip>

            <el-tooltip content="Edit" placement="top">
              <el-button link
                         class="mobile-action-button"
                         @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-tooltip>

            <el-tooltip content="Delete" placement="top">
              <el-button link
                         type="danger"
                         class="mobile-action-button"
                         @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </el-card>

      <el-empty v-if="!loading && filteredCustomers.length === 0"
                description="No customers found" />
    </div>


    <!-- ===================================================== -->
    <!-- PHONE VERIFICATION -->
    <!-- ===================================================== -->

    <el-dialog v-model="verificationDialogVisible"
               width="760px"
               class="customer-verification-dialog modern-verification-dialog"
               :close-on-click-modal="false"
               :show-close="false">
      <div v-if="verificationCustomer" class="verification-shell">
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
                <strong>{{ formatPhone(verificationCustomer.phone) }}</strong>.
              </template>

              <template v-else>
                Send a verification code to activate
                <strong>
                  {{ verificationCustomer.firstname }}
                  {{ verificationCustomer.lastname }}
                </strong>.
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
                Send a verification code when you're ready.
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
            <span>
              Ready to send a 6-digit verification code to
              {{ formatPhone(verificationCustomer.phone) }}.
            </span>
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

            <el-button @click="closeVerificationDialog">
              Finish Later
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- ===================================================== -->
    <!-- FILTER DRAWER -->
    <!-- ===================================================== -->

    <el-drawer v-model="drawer2"
               direction="rtl"
               size="360px">
      <template #header>
        <div class="drawer-header">
          <div class="drawer-icon">
            <el-icon><Filter /></el-icon>
          </div>

          <div>
            <div class="drawer-title">Filter Customers</div>
            <div class="drawer-subtitle">
              Filter customers by account status.
            </div>
          </div>
        </div>
      </template>

      <div class="filter-section">
        <div class="filter-label">Customer Status</div>

        <el-radio-group v-model="radiostatus"
                        class="status-options">
          <el-radio-button value="all">
            All
          </el-radio-button>

          <el-radio-button value="1">
            Active
          </el-radio-button>

          <el-radio-button value="0">
            Inactive
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="filter-section">
        <div class="filter-label">Verification Status</div>

        <el-radio-group v-model="verificationFilter"
                        class="status-options verification-status-options">
          <el-radio-button value="all">
            All
          </el-radio-button>

          <el-radio-button value="verified">
            Verified
          </el-radio-button>

          <el-radio-button value="unverified">
            Unverified
          </el-radio-button>

          <el-radio-button value="bypass">
            Bypass
          </el-radio-button>
        </el-radio-group>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="clearFilters">
            Clear
          </el-button>

          <el-button type="primary"
                     @click="confirmClick">
            Apply Filter
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import {
        computed,
        onMounted,
        ref,
        watch
} from 'vue';

import {
        ElMessage,
        ElMessageBox
} from 'element-plus';

import {
        Plus,
        Filter,
        CircleCheck,
        CircleClose,
        Edit,
        Delete,
        User,
        Search,
        Refresh,
        Lock,
        Phone,
        Check
} from '@element-plus/icons-vue';

import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { useAppStore } from '@/store/modules/app';

import {
        getcustomers,
        deletecustomer,
        updatestatus
} from '@/api/customer';
import {
        sendcustomerverification,
        verifycustomerverification,
        bypasscustomerverification
} from '@/api/customerverification';
import { formatPhone } from '@/utils/phone';
import verificationIllustration from '@/assets/phone-verification.png';
import PointsBadge from '@/components/pointsbadge/index.vue';
import VerificationBadge from '@/components/verificationbadge/index.vue';

// ============================================================
// STORES / ROUTER
// ============================================================

const appStore = useAppStore();
const userStore = useUserStore();
const router = useRouter();

const device = computed(() => appStore.device);

// ============================================================
// STATE
// ============================================================

const customersData = ref([]);
const loading = ref(false);

const drawer2 = ref(false);
const searchText = ref('');

const radiostatus = ref('all');
const appliedStatus = ref('all');
const verificationFilter = ref('all');
const appliedVerificationFilter = ref('all');

// ============================================================
// PHONE VERIFICATION
// ============================================================

const verificationDialogVisible = ref(false);
const verificationCustomer = ref(null);
const verificationCode = ref('');
const verificationDigits = ref(['', '', '', '', '', '']);
const otpInputRefs = ref([]);
const verificationCodeSent = ref(false);
const sendingCode = ref(false);
const verifyingCode = ref(false);
const bypassingVerification = ref(false);

function verificationStatusLabel(row) {
        if (row?.phoneverified === true) {
          return 'Verified';
        }

        if (
          String(row?.verificationmethod || '')
            .trim()
            .toLowerCase() === 'bypass'
        ) {
          return 'Bypass';
        }

        return 'Unverified';
}


// ============================================================
// FILTERED CUSTOMERS
// ============================================================

const filteredCustomers = computed(() => {
        let data = Array.isArray(customersData.value)
          ? customersData.value
          : [];

        // Status filter
        if (appliedStatus.value === '1') {
          data = data.filter(row => Boolean(row.isactive));
        }

        if (appliedStatus.value === '0') {
          data = data.filter(row => !row.isactive);
        }

        // Verification filter
        if (appliedVerificationFilter.value !== 'all') {
          data = data.filter(row =>
            verificationStatusLabel(row).toLowerCase() ===
            appliedVerificationFilter.value
          );
        }

        // Search filter
        const search = searchText.value
          .trim()
          .toLowerCase();

        if (!search) {
          return data;
        }

        return data.filter(row => {
          const searchable = [
            row.firstname,
            row.lastname,
            row.phone,
            row.dob,
            row.datecreated,
            row.lastvisited,
            row.points
          ]
            .filter(value => value != null)
            .join(' ')
            .toLowerCase();

          return searchable.includes(search);
        });
});

// ============================================================
// LOAD CUSTOMERS
// ============================================================

async function loadCustomers() {
        const locationid = userStore.locationId;

        if (!locationid) {
          customersData.value = [];
          return;
        }

        loading.value = true;

        try {
          const response = await getcustomers(locationid);

          customersData.value =
                              Array.isArray(response.data)
                                ? response.data
                                : [];
        } catch (error) {
          console.error('Failed to load customers:', error);

          ElMessage.error(error?.message || 'Failed to load customers');

          customersData.value = [];
        } finally {
          loading.value = false;
        }
}

// ============================================================
// NEW CUSTOMER
// ============================================================

function handleNewCustomer() {
        router.push({
          path: '/newcustomer/index'
        });
}

// ============================================================
// EDIT CUSTOMER
// ============================================================

function handleEdit(row) {
        router.push({
          name: 'Profile',
          params: {
            id: row.id
          }
        });
}

// ============================================================
// STATUS
// ============================================================

async function handleStatus(row) {
        try {
          await updatestatus(row.id);

          ElMessage.success(
            'Customer status updated successfully'
          );

          await loadCustomers();
        } catch (error) {
          console.error(error);
        }
}


// ============================================================
// PHONE VERIFICATION
// ============================================================

function needsPhoneVerification(row) {
        return verificationStatusLabel(row) === 'Unverified';
}

function setOtpRef(el, index) {
        if (el) {
          otpInputRefs.value[index] = el;
        }
}

function syncVerificationCode() {
        verificationCode.value = verificationDigits.value.join('');
}

function resetVerificationCode() {
        verificationDigits.value = ['', '', '', '', '', ''];
        verificationCode.value = '';
}

function focusOtp(index) {
        const target = otpInputRefs.value[index];

        if (target?.focus) {
          target.focus();
        }
}

function handleOtpInput(index) {
        const raw =
          String(verificationDigits.value[index] || '');

        verificationDigits.value[index] =
          raw.replace(/\D/g, '').slice(-1);

        syncVerificationCode();

        if (
          verificationDigits.value[index] &&
          index < 5
        ) {
          focusOtp(index + 1);
        }
}

function handleOtpBackspace(index) {
        if (
          !verificationDigits.value[index] &&
          index > 0
        ) {
          verificationDigits.value[index - 1] = '';
          syncVerificationCode();
          focusOtp(index - 1);
        }
}

function handleOtpPaste(event) {
        const digits =
          String(
            event?.clipboardData?.getData('text') || ''
          )
            .replace(/\D/g, '')
            .slice(0, 6)
            .split('');

        if (!digits.length) {
          return;
        }

        verificationDigits.value =
          Array.from(
            { length: 6 },
            (_, index) => digits[index] || ''
          );

        syncVerificationCode();
        focusOtp(Math.min(digits.length, 6) - 1);
}

function openVerification(row) {
        verificationCustomer.value = row;
        resetVerificationCode();
        verificationCodeSent.value = false;
        verificationDialogVisible.value = true;
}

function closeVerificationDialog() {
        verificationDialogVisible.value = false;
        verificationCustomer.value = null;
        verificationCodeSent.value = false;
        resetVerificationCode();
}

async function sendVerificationCode() {
        if (!verificationCustomer.value?.id) {
          return;
        }

        try {
          sendingCode.value = true;

          const response =
            await sendcustomerverification({
              customerId:
                verificationCustomer.value.id
            });

          if (!response?.success) {
            throw new Error(
              response?.message ||
              'Unable to send verification code.'
            );
          }

          verificationCodeSent.value = true;
          resetVerificationCode();

          ElMessage.success(
            response.message ||
            'Verification code sent.'
          );
        } catch (error) {
          console.error(
            'Send verification code error:',
            error
          );

          ElMessage.error(
            error?.response?.data?.message ||
            error?.message ||
            'Unable to send verification code.'
          );
        } finally {
          sendingCode.value = false;
        }
}

async function verifyCustomerPhone() {
        if (
          !verificationCustomer.value?.id ||
          verificationCode.value.trim().length !== 6
        ) {
          return;
        }

        try {
          verifyingCode.value = true;

          const response =
            await verifycustomerverification({
              customerId:
                verificationCustomer.value.id,
              code:
                verificationCode.value.trim()
            });

          if (!response?.success) {
            throw new Error(
              response?.message ||
              'Unable to verify phone number.'
            );
          }

          ElMessage.success(
            'Phone verified. Customer is now active.'
          );

          closeVerificationDialog();
          await loadCustomers();
        } catch (error) {
          console.error(
            'Verify customer phone error:',
            error
          );

          ElMessage.error(
            error?.response?.data?.message ||
            error?.message ||
            'Invalid verification code.'
          );
        } finally {
          verifyingCode.value = false;
        }
}

async function bypassCustomerVerification() {
        if (!verificationCustomer.value?.id) {
          return;
        }

        try {
          bypassingVerification.value = true;

          const response =
            await bypasscustomerverification({
              customerId:
                verificationCustomer.value.id
            });

          if (!response?.success) {
            throw new Error(
              response?.message ||
              'Verification bypass was not allowed.'
            );
          }

          ElMessage.success(
            'Verification bypassed. Customer is now active.'
          );

          closeVerificationDialog();
          await loadCustomers();
        } catch (error) {
          console.error(
            'Bypass customer verification error:',
            error
          );

          ElMessage.error(
            error?.response?.data?.message ||
            error?.message ||
            'You are not authorized to bypass verification.'
          );
        } finally {
          bypassingVerification.value = false;
        }
}

// ============================================================
// DELETE
// ============================================================

async function handleDelete(row) {
        try {
          await ElMessageBox.confirm(
            `Delete ${row.firstname} ${row.lastname}?`,
            'Delete Customer',
            {
              confirmButtonText: 'Delete',
              cancelButtonText: 'Cancel',
              type: 'warning'
            }
          );

          await deletecustomer(row.id);

          ElMessage.success(
            'Customer deleted successfully'
          );

          await loadCustomers();
        } catch (error) {
          // User cancelled dialog
          console.error(error);
        }
}

// ============================================================
// FILTER
// ============================================================

function confirmClick() {
        appliedStatus.value = radiostatus.value;
        appliedVerificationFilter.value = verificationFilter.value;
        drawer2.value = false;
}

function clearFilters() {
        radiostatus.value = 'all';
        appliedStatus.value = 'all';
        verificationFilter.value = 'all';
        appliedVerificationFilter.value = 'all';
        drawer2.value = false;
}

// ============================================================
// LOCATION CHANGE
// ============================================================

watch(
        () => userStore.locationId,
        newLocation => {
          if (newLocation) {
            loadCustomers();
          } else {
            customersData.value = [];
          }
        }
);

// ============================================================
// MOUNT
// ============================================================

onMounted(() => {
        loadCustomers();
});
</script>

