<template>
  <div class="app-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button circle class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div>
          <h2 class="page-title">
            {{ company?.name || 'Company' }}
          </h2>
          <div class="page-subtitle">
            {{ company?.code || '' }}
          </div>
        </div>
      </div>
    </div>
    <el-tabs v-model="activeTab">
      <!-- ============================================= -->
      <!-- LOCATIONS -->
      <!-- ============================================= -->
      <el-tab-pane label="Locations" name="locations">
        <div class="tab-toolbar">
          <el-button type="primary" @click="openLocationDialog">
            Add Location
          </el-button>
        </div>
        <el-card shadow="never">
          <el-table v-loading="loadingLocations" :data="locations">
            <el-table-column prop="name" label="Location" min-width="220" />
            <el-table-column prop="userCount" label="Users" width="120" align="center" />
            <el-table-column label="Status" width="120">
              <template #default="{ row }">
                <el-tag :type="
                  row.isActive
                    ? 'success'
                    : 'danger'
                ">
                  {{
                    row.isActive
                      ? 'Active'
                      : 'Inactive'
                  }}
                </el-tag>

              </template>

            </el-table-column>

          </el-table>

        </el-card>

      </el-tab-pane>

      <!-- ============================================= -->
      <!-- USERS -->
      <!-- ============================================= -->

      <el-tab-pane label="Users"
                   name="users">

        <div class="user-filter">

          <el-select v-model="selectedLocationId"
                     placeholder="Select location"
                     style="width: 280px"
                     @change="loadUsers">

            <el-option v-for="location in locations"
                       :key="location.id"
                       :label="location.name"
                       :value="location.id" />

          </el-select>

        </div>

        <el-card shadow="never">

          <el-table v-loading="loadingUsers"
                    :data="users">

            <el-table-column prop="name"
                             label="Name"
                             min-width="180" />

            <el-table-column prop="username"
                             label="Username"
                             min-width="150" />

            <el-table-column prop="roleName"
                             label="Role"
                             width="150" />

            <el-table-column prop="jobTitle"
                             label="Job Title"
                             min-width="160" />

            <el-table-column label="Status"
                             width="120">

              <template #default="{ row }">

                <el-tag :type="
                  row.isActive
                    ? 'success'
                    : 'danger'
                ">
                  {{
                    row.isActive
                      ? 'Active'
                      : 'Inactive'
                  }}
                </el-tag>

              </template>

            </el-table-column>

          </el-table>

        </el-card>

      </el-tab-pane>

    </el-tabs>

    <!-- ================================================= -->
    <!-- ADD LOCATION -->
    <!-- ================================================= -->

    <el-dialog v-model="locationDialogVisible"
               title="Add Location"
               width="450px">

      <el-form label-position="top">

        <el-form-item label="Location Name">
          <el-input v-model="newLocationName" />
        </el-form-item>

      </el-form>

      <template #footer>

        <el-button @click="
          locationDialogVisible = false
        ">
          Cancel
        </el-button>

        <el-button type="primary"
                   :loading="savingLocation"
                   @click="saveLocation">
          Add Location
        </el-button>

      </template>

    </el-dialog>

  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import {
  ref,
  onMounted
} from 'vue';

import {
  useRoute,
  useRouter
} from 'vue-router';

import {
  ElMessage
} from 'element-plus';

import {
  getCompany
} from '@/api/company';

import {
  getCompanyLocations,
  createLocation
} from '@/api/location';

import {
  getemployees
} from '@/api/employee';

const route =
    useRoute();

const router =
    useRouter();

const companyId =
    Number(
      route.params.companyId
    );

const company =
    ref(null);

const locations =
    ref([]);

const users =
    ref([]);

const activeTab =
    ref('locations');

const selectedLocationId =
    ref(null);

const loadingLocations =
    ref(false);

const loadingUsers =
    ref(false);

const locationDialogVisible =
    ref(false);

const savingLocation =
    ref(false);

const newLocationName =
    ref('');

async function loadCompany() {
  try {
    const response =
            await getCompany(
              companyId
            );

    company.value =
            response.data;
  } catch (error) {
    console.error(error);

    ElMessage.error(
      'Unable to load company.'
    );
  }
}

async function loadLocations() {
  loadingLocations.value =
        true;

  try {
    const response =
            await getCompanyLocations(
              companyId
            );

    locations.value =
            response.data || [];

    if (
      locations.value.length > 0 &&
            !selectedLocationId.value
    ) {
      selectedLocationId.value =
                locations.value[0].id;

      await loadUsers();
    }
  } catch (error) {
    console.error(error);

    ElMessage.error(
      'Unable to load locations.'
    );
  } finally {
    loadingLocations.value =
            false;
  }
}

async function loadUsers() {
  if (
    !selectedLocationId.value
  ) {
    users.value =
            [];

    return;
  }

  loadingUsers.value =
        true;

  try {
    const response =
            await getemployees(
              selectedLocationId.value
            );

    users.value =
            response.data || [];
  } catch (error) {
    console.error(error);

    ElMessage.error(
      'Unable to load users.'
    );
  } finally {
    loadingUsers.value =
            false;
  }
}

function openLocationDialog() {
  newLocationName.value =
        '';

  locationDialogVisible.value =
        true;
}

async function saveLocation() {
  if (
    !newLocationName.value
      .trim()
  ) {
    ElMessage.warning(
      'Location name is required.'
    );

    return;
  }

  savingLocation.value =
        true;

  try {
    await createLocation({
      companyId:
                companyId,

      name:
                newLocationName.value.trim()
    });

    ElMessage.success(
      'Location created successfully.'
    );

    locationDialogVisible.value =
            false;

    await loadLocations();
  } catch (error) {
    console.error(error);

    ElMessage.error(
      error?.response?.data?.message ||
            'Unable to create location.'
    );
  } finally {
    savingLocation.value =
            false;
  }
}

function goBack() {
  router.push({
    name: 'Companies'
  });
}

onMounted(
  async () => {
    await Promise.all([
      loadCompany(),
      loadLocations()
    ]);
  }
);
</script>

