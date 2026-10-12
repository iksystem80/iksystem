<template>
  <div class="app-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Roles & Module Access</h2>
        <p>Page access is controlled by router modules and sub-modules. CRUD permissions are no longer used.</p>
      </div>
      <el-button v-if="!isSystemAdmin" type="primary" @click="newRole"><el-icon><Plus /></el-icon><span>New Role</span></el-button>
    </div>

    <el-alert
      :title="`Assignments below apply to the currently selected location${locationId ? ` #${locationId}` : ''}.`"
      type="info" :closable="false" show-icon class="mb-16" />

    <el-card v-if="isSystemAdmin" shadow="never" class="permission-card location-module-card">
      <template #header>
        <div>
          <strong>Location Modules</strong>
          <div class="small-text">Enable the pages this company location is allowed to use. Location roles can only receive pages enabled here.</div>
        </div>
      </template>
      <el-tree ref="locationTreeRef" :data="moduleTree" node-key="id" show-checkbox default-expand-all
               :props="treeProps" :default-checked-keys="locationModuleIds" />
      <div class="actions">
        <div class="spacer" />
        <el-button type="primary" :loading="savingLocation" :disabled="!locationId" @click="saveLocationModules">Save Location Modules</el-button>
      </div>
    </el-card>

    <div class="role-layout" :class="{ 'mt-16': isSystemAdmin }">
      <el-card shadow="never" class="role-list-card">
        <div class="role-list-title">Roles</div>
        <div v-loading="loadingRoles" class="role-list">
          <button v-for="role in roles" :key="role.id" class="role-item" :class="{ active: selectedRoleId === role.id }" @click="selectRole(role.id)">
            <span><strong>{{ role.name }}</strong><small>{{ role.description || 'No description' }}</small></span>
            <el-tag size="small" :type="role.isActive ? 'success' : 'info'">{{ role.isActive ? 'Active' : 'Inactive' }}</el-tag>
          </button>
        </div>
      </el-card>

      <el-card shadow="never" class="permission-card">
        <template v-if="form.id || creating">
          <div class="role-form-header">
            <div class="role-fields">
              <el-input v-model="form.name" placeholder="Role name" :disabled="form.isSystem" />
              <el-input v-model="form.description" placeholder="Description" :disabled="form.isSystem" />
            </div>
            <el-switch v-model="form.isActive" active-text="Active" :disabled="form.isSystem" />
          </div>

          <el-alert v-if="form.isSystem" type="info" :closable="false" show-icon
                    title="This is a protected system role. Its name/status are protected, but its page access can be changed for this location." />

          <div class="module-tree-heading">
            <div>
              <strong>Module Access</strong>
              <div class="small-text">Parent modules control menu groups. Sub-modules control the pages inside each group.</div>
            </div>
          </div>

          <el-tree ref="roleTreeRef" v-loading="loadingModules" :data="roleModuleTree" node-key="id"
                   show-checkbox default-expand-all :props="treeProps" />

          <div class="actions">
            <el-button v-if="form.id && !form.isSystem" type="danger" plain @click="removeRole">Delete</el-button>
            <div class="spacer" />
            <el-button v-if="creating" @click="cancelCreate">Cancel</el-button>
            <el-button type="primary" :loading="saving" @click="saveRole">{{ creating ? 'Create Role' : 'Save Changes' }}</el-button>
          </div>
        </template>
        <el-empty v-else description="Select a role" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { getRoles, getRole, getPermissions, createRole, updateRole, deleteRole, updateLocationModules } from '@/api/role';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const roles = ref<any[]>([]);
const moduleTree = ref<any[]>([]);
const locationModuleIds = ref<number[]>([]);
const selectedRoleId = ref<number | null>(null);
const loadingRoles = ref(false);
const loadingModules = ref(false);
const saving = ref(false);
const savingLocation = ref(false);
const creating = ref(false);
const roleTreeRef = ref<any>(null);
const locationTreeRef = ref<any>(null);
const treeProps = { children: 'children', label: 'name', disabled: 'disabled' };

const form = reactive<any>({ id: null, name: '', description: '', isActive: true, isSystem: false, moduleIds: [] });
const locationId = computed(() => Number(userStore.locationId || 0) || null);
const isSystemAdmin = computed(() => String(userStore.roleName || '').trim().toLowerCase() === 'system admin');

function cloneRoleTree(nodes: any[]): any[] {
  const allowed = new Set(locationModuleIds.value.map(Number));
  return nodes.map(node => ({
    ...node,
    disabled: !allowed.has(Number(node.id)),
    children: cloneRoleTree(node.children || [])
  }));
}
const roleModuleTree = computed(() => cloneRoleTree(moduleTree.value));

function checkedKeys(tree: any) {
  if (!tree) return [];
  return [...new Set([...(tree.getCheckedKeys(false) || []), ...(tree.getHalfCheckedKeys() || [])].map(Number))];
}

async function loadModules() {
  if (!locationId.value) return;
  loadingModules.value = true;
  try {
    const response = await getPermissions(locationId.value);
    const data = response.data || {};
    moduleTree.value = data.modules || [];
    locationModuleIds.value = (data.locationModuleIds || []).map(Number);
    await nextTick();
    locationTreeRef.value?.setCheckedKeys(locationModuleIds.value, false);
  } finally { loadingModules.value = false; }
}

async function loadRoles() {
  if (!locationId.value) return;
  loadingRoles.value = true;
  try {
    const response = await getRoles(locationId.value);
    // System Admin is hidden in both backend and frontend as a second safeguard.
    roles.value = (response.data || []).filter((role: any) => String(role.name || '').trim().toLowerCase() !== 'system admin');
    if (!roles.value.some((r: any) => r.id === selectedRoleId.value)) selectedRoleId.value = null;
    if (!selectedRoleId.value && roles.value.length) await selectRole(roles.value[0].id);
  } finally { loadingRoles.value = false; }
}

async function selectRole(id: number) {
  if (!locationId.value) return;
  creating.value = false;
  selectedRoleId.value = id;
  const response = await getRole(id, locationId.value);
  Object.assign(form, response.data, { moduleIds: response.data?.moduleIds || [] });
  await nextTick();
  roleTreeRef.value?.setCheckedKeys(form.moduleIds, false);
}

function newRole() {
  creating.value = true;
  selectedRoleId.value = null;
  Object.assign(form, { id: null, name: '', description: '', isActive: true, isSystem: false, moduleIds: [] });
  nextTick(() => roleTreeRef.value?.setCheckedKeys([], false));
}

function cancelCreate() {
  creating.value = false;
  if (roles.value.length) selectRole(roles.value[0].id);
}

async function saveLocationModules() {
  if (!locationId.value) return ElMessage.warning('Select a location first.');
  try {
    savingLocation.value = true;
    const moduleIds = checkedKeys(locationTreeRef.value);
    await updateLocationModules(locationId.value, moduleIds);
    ElMessage.success('Location modules updated.');
    await loadModules();
    if (selectedRoleId.value) await selectRole(selectedRoleId.value);
  } finally { savingLocation.value = false; }
}

async function saveRole() {
  if (!locationId.value) return ElMessage.warning('Select a location first.');
  if (!form.name?.trim()) return ElMessage.warning('Role name is required');
  try {
    saving.value = true;
    const payload = {
      locationid: locationId.value,
      name: form.name.trim(),
      description: form.description,
      isActive: form.isActive,
      moduleIds: checkedKeys(roleTreeRef.value)
    };
    if (creating.value) {
      const response = await createRole(payload);
      ElMessage.success('Role created successfully');
      creating.value = false;
      await loadRoles();
      if (response.data?.id) await selectRole(response.data.id);
    } else {
      await updateRole(form.id, payload);
      ElMessage.success('Role module access updated');
      await loadRoles();
      await selectRole(form.id);
    }
  } finally { saving.value = false; }
}

async function removeRole() {
  await ElMessageBox.confirm(`Delete role ${form.name}?`, 'Delete Role', { type: 'warning', confirmButtonText: 'Delete' });
  await deleteRole(form.id, locationId.value);
  ElMessage.success('Role deleted successfully');
  selectedRoleId.value = null;
  Object.assign(form, { id: null, name: '', description: '', isActive: true, isSystem: false, moduleIds: [] });
  await loadRoles();
}

async function reloadForLocation() {
  selectedRoleId.value = null;
  creating.value = false;
  await loadModules();
  await loadRoles();
}

watch(locationId, async (value, oldValue) => {
  if (value && value !== oldValue) await reloadForLocation();
});

onMounted(reloadForLocation);
</script>
