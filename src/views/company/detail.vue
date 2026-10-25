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
            <el-tag
              v-if="company"
              size="small"
              :type="
                company.isSuspended
                  ? 'warning'
                  : company.isActive
                    ? 'success'
                    : 'danger'
              "
            >
              {{
                company.isSuspended
                  ? 'Suspended'
                  : company.isActive
                    ? 'Active'
                    : 'Inactive'
              }}
            </el-tag>
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
                  row.isSuspended
                    ? 'warning'
                    : row.isActive
                      ? 'success'
                      : 'danger'
                ">
                  {{
                    row.isSuspended
                      ? 'Suspended'
                      : row.isActive
                        ? 'Active'
                        : 'Inactive'
                  }}
                </el-tag>

              </template>

            </el-table-column>

            <el-table-column label="Actions"
                             width="300"
                             align="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEditLocationDialog(row)">
                  Edit
                </el-button>

                <el-button
                  v-if="!row.isActive || row.isSuspended"
                  link
                  type="success"
                  @click="setLocationStatus(row, 'active')"
                >
                  Activate
                </el-button>

                <el-button
                  v-if="row.isActive || row.isSuspended"
                  link
                  type="danger"
                  @click="setLocationStatus(row, 'inactive')"
                >
                  Deactivate
                </el-button>

                <el-button
                  v-if="!row.isSuspended"
                  link
                  type="warning"
                  @click="setLocationStatus(row, 'suspended')"
                >
                  Suspend
                </el-button>
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
    <!-- EDIT LOCATION -->
    <!-- ================================================= -->
    <el-dialog v-model="editLocationDialogVisible" title="Edit Location" width="450px">
      <el-form label-position="top">
        <el-form-item label="Location Name">
          <el-input v-model="editLocationName" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="Allow Face Check-In">
          <el-switch v-model="editAllowFaceCheckin" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editLocationDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="savingEditLocation" @click="saveEditLocation">
          Save Changes
        </el-button>
      </template>
    </el-dialog>

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

import {
  ref,
  onMounted
} from 'vue';

import {
  useRoute,
  useRouter
} from 'vue-router';

import {
  ElMessage,
  ElMessageBox
} from 'element-plus';

import {
  getCompany
} from '@/api/company';

import {
  getCompanyLocations,
  createLocation,
  updateLocation,
  updateLocationStatus
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

const editLocationDialogVisible = ref(false);
const savingEditLocation = ref(false);
const editingLocationId = ref(null);
const editLocationName = ref('');
const editAllowFaceCheckin = ref(false);

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

function openEditLocationDialog(row) {
  editingLocationId.value = row.id;
  editLocationName.value = row.name || '';
  editAllowFaceCheckin.value = row.allowFaceCheckin === true;
  editLocationDialogVisible.value = true;
}

async function saveEditLocation() {
  const name = editLocationName.value.trim();
  if (!name) {
    ElMessage.warning('Location name is required.');
    return;
  }

  savingEditLocation.value = true;
  try {
    await updateLocation(editingLocationId.value, {
      name,
      allowFaceCheckin: editAllowFaceCheckin.value
    });
    ElMessage.success('Location updated successfully.');
    editLocationDialogVisible.value = false;
    await loadLocations();
  } catch (error) {
    console.error(error);
    ElMessage.error(error?.response?.data?.message || 'Unable to update location.');
  } finally {
    savingEditLocation.value = false;
  }
}

async function setLocationStatus(row, status) {
  const actionLabel =
        status === 'active'
          ? 'Activate'
          : status === 'suspended'
            ? 'Suspend'
            : 'Deactivate';

  try {
    await ElMessageBox.confirm(
      `${actionLabel} ${row.name}?`,
      'Confirm',
      {
        type:
          status === 'active'
            ? 'info'
            : 'warning'
      }
    );

    await updateLocationStatus(
      row.id,
      status
    );

    ElMessage.success(
      `Location ${status}.`
    );

    await loadLocations();
  } catch (error) {
    if (
      error !== 'cancel' &&
      error !== 'close'
    ) {
      console.error(error);

      ElMessage.error(
        error?.response?.data?.message ||
          'Unable to update location status.'
      );
    }
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

