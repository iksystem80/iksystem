<template>
  <div class="app-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Module Assignment</h2>
        <p>Choose a company and location, then enable the pages that location is allowed to use.</p>
      </div>
    </div>

    <el-card shadow="never" class="panel">
      <template #header>
        <div>
          <strong>Company Location</strong>
          <div class="small-text">
            Location Owners and Admins can only assign pages enabled here to their local roles.
          </div>
        </div>
      </template>

      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="Company">
              <el-select
                v-model="selectedCompanyId"
                filterable
                placeholder="Select company"
                style="width: 100%"
                :loading="loadingCompanies"
                @change="onCompanyChange"
              >
                <el-option
                  v-for="company in companies"
                  :key="company.id"
                  :label="company.name"
                  :value="Number(company.id)"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="Location">
              <el-select
                v-model="selectedLocationId"
                filterable
                placeholder="Select location"
                style="width: 100%"
                :loading="loadingLocations"
                :disabled="!selectedCompanyId"
                @change="loadLocationModules"
              >
                <el-option
                  v-for="location in locations"
                  :key="location.id"
                  :label="location.name"
                  :value="Number(location.id)"
                  :disabled="location.isActive === false"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card v-if="selectedLocationId" shadow="never" class="panel">
      <template #header>
        <div>
          <strong>Allowed Modules</strong>
          <div class="small-text">
            Enabling a child page also enables its parent menu. Disabling a page removes it from every role at this location.
          </div>
        </div>
      </template>

      <div v-loading="loadingModules">
        <el-tree
          ref="moduleTreeRef"
          :data="moduleTree"
          node-key="id"
          show-checkbox
          default-expand-all
          :props="treeProps"
        />
      </div>

      <div class="actions">
        <div class="spacer" />
        <el-button
          type="primary"
          :loading="saving"
          :disabled="loadingModules || !selectedLocationId"
          @click="saveModules"
        >
          Save Location Modules
        </el-button>
      </div>
    </el-card>

    <el-card v-else shadow="never" class="panel">
      <el-empty description="Select a company and location to manage modules." />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getSystemCompanies,
  getSystemLocations,
  getLocationModuleAssignment,
  saveLocationModuleAssignment
} from '@/api/systemModules';

const companies = ref<any[]>([]);
const locations = ref<any[]>([]);
const moduleTree = ref<any[]>([]);

const selectedCompanyId = ref<number | null>(null);
const selectedLocationId = ref<number | null>(null);

const loadingCompanies = ref(false);
const loadingLocations = ref(false);
const loadingModules = ref(false);
const saving = ref(false);

const moduleTreeRef = ref<any>(null);
const treeProps = {
  children: 'children',
  label: 'name'
};

function checkedModuleIds() {
  if (!moduleTreeRef.value) return [];

  return [
    ...new Set(
      [
        ...(moduleTreeRef.value.getCheckedKeys(false) || []),
        ...(moduleTreeRef.value.getHalfCheckedKeys() || [])
      ].map(Number)
    )
  ];
}

async function loadCompanies() {
  try {
    loadingCompanies.value = true;
    const response = await getSystemCompanies();
    companies.value = (response.data || []).filter((company: any) => company.isActive !== false);
  } finally {
    loadingCompanies.value = false;
  }
}

async function onCompanyChange() {
  selectedLocationId.value = null;
  locations.value = [];
  moduleTree.value = [];

  if (!selectedCompanyId.value) return;

  try {
    loadingLocations.value = true;
    const response = await getSystemLocations(selectedCompanyId.value);
    locations.value = response.data || [];
  } finally {
    loadingLocations.value = false;
  }
}

async function loadLocationModules() {
  moduleTree.value = [];

  if (!selectedLocationId.value) return;

  try {
    loadingModules.value = true;

    const response = await getLocationModuleAssignment(selectedLocationId.value);
    const data = response.data || {};

    moduleTree.value = data.modules || [];

    await nextTick();

    moduleTreeRef.value?.setCheckedKeys(
      (data.locationModuleIds || []).map(Number),
      false
    );
  } finally {
    loadingModules.value = false;
  }
}

async function saveModules() {
  if (!selectedLocationId.value) {
    return ElMessage.warning('Select a location first.');
  }

  try {
    saving.value = true;

    await saveLocationModuleAssignment(
      selectedLocationId.value,
      checkedModuleIds()
    );

    ElMessage.success('Location modules updated.');
    await loadLocationModules();
  } finally {
    saving.value = false;
  }
}

onMounted(loadCompanies);
</script>
