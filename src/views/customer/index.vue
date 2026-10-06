<template>
  <div class="app-container">
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
                style="width: 100%">
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
                         width="160">
          <template #default="{ row }">
            {{ row.firstname }} {{ row.lastname }}
          </template>
        </el-table-column>
        <!-- Phone -->
        <el-table-column prop="phone"
                         label="Phone"
                         width="140">
          <template #default="{ row }">
            {{ formatPhone(row.phone) || 'No phone' }}
          </template>
        </el-table-column>

        <!-- Date of Birth -->
        <el-table-column prop="dob"
                         label="Date of Birth"
                         width="140" />

        <!-- Date Registered -->
        <el-table-column prop="datecreated"
                         label="Registered On"
                         width="140" />

        <!-- Last Visit -->
        <el-table-column prop="lastvisited"
                         label="Last Visit On"
                         width="140" />

        <!-- Points -->
        <el-table-column prop="points"
                         label="Points"
                         min-width="90">
          <template #default="{ row }">
            <el-tag style="font-weight: bold;"
                    type="warning"
                    effect="light">
              {{ row.points }} PTS
            </el-tag>
          </template>
        </el-table-column>

        <!-- Operations -->
        <el-table-column label="" width="100">
          <template #default="{ row }">
            <el-button-group>
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
            </el-button-group>
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

              <el-tag class="mobile-points"
                      type="warning"
                      effect="light">
                <el-icon><Coin /></el-icon>
                <span>{{ row.points }} PTS</span>
              </el-tag>
            </div>
          </div>

          <!-- RIGHT SIDE -->
          <div class="mobile-right">
            <div class="mobile-detail">
              <span class="detail-label">DOB</span>
              <span class="detail-value">
                {{ row.dob || '---' }}
              </span>
            </div>

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
      </el-card>

      <el-empty v-if="!loading && filteredCustomers.length === 0"
                description="No customers found" />
    </div>

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
    Coin,
    Search,
    Refresh
} from '@element-plus/icons-vue';

import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { useAppStore } from '@/store/modules/app';

import {
    getcustomers,
    deletecustomer,
    updatestatus
} from '@/api/customer';
import { formatPhone } from '@/utils/phone';

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
    drawer2.value = false;
}

function clearFilters() {
    radiostatus.value = 'all';
    appliedStatus.value = 'all';
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

