<template>
  <div class="app-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Roles & Permissions</h2>
        <p>Each user has one role. Permissions assigned here control pages and actions.</p>
      </div>
      <el-button v-if="canCreate" type="primary" @click="newRole"><el-icon><Plus /></el-icon><span>New Role</span></el-button>
    </div>
    <div class="role-layout">
      <el-card shadow="never" class="role-list-card">
        <div class="role-list-title">Roles</div>
        <div v-loading="loadingRoles" class="role-list">
          <button v-for="role in roles" :key="role.id" class="role-item" :class="{ active: selectedRoleId === role.id }" @click="selectRole(role.id)" >
            <span><strong>{{ role.name }}</strong><small>{{ role.description || 'No description' }}</small></span>
            <el-tag size="small" :type="role.isActive ? 'success' : 'info'">{{ role.isActive ? 'Active' : 'Inactive' }}</el-tag>
          </button>
        </div>
      </el-card>
      <el-card shadow="never" class="permission-card">
        <template v-if="form.id || creating">
          <div class="role-form-header">
            <div class="role-fields">
              <el-input v-model="form.name" placeholder="Role name" :disabled="isOwner" />
              <el-input v-model="form.description" placeholder="Description" :disabled="isOwner" />
            </div>
            <el-switch v-model="form.isActive" active-text="Active" :disabled="isOwner" />
          </div>
          <el-alert v-if="isOwner" type="info" :closable="false" show-icon title="Owner always has full access and is protected." />
          <div class="matrix-wrapper">
            <el-table :data="permissionRows" v-loading="loadingPermissions" style="width:100%">
              <el-table-column prop="module" label="Module" min-width="180" fixed />
              <el-table-column v-for="action in actions" :key="action" :label="actionLabel(action)" width="100" align="center">
                <template #default="{ row }">
                  <el-checkbox v-if="row[action]" :model-value="form.permissionIds.includes(row[action].id)" :disabled="isOwner || !canUpdateSelected" @change="value => togglePermission(row[action].id, Boolean(value))" />
                  <span v-else>—</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="actions">
            <el-button v-if="form.id && canDelete && !form.isSystem" type="danger" plain @click="removeRole">Delete</el-button>
            <div class="spacer" />
            <el-button v-if="creating" @click="cancelCreate">Cancel</el-button>
            <el-button v-if="canSave" type="primary" :loading="saving" @click="saveRole">{{ creating ? 'Create Role' : 'Save Changes' }}</el-button>
          </div>
        </template>

        <el-empty v-else description="Select a role" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { getRoles, getRole, getPermissions, createRole, updateRole, deleteRole } from '@/api/role';
import checkPermission from '@/utils/permission';

const roles = ref<any[]>([]);
const allPermissions = ref<any[]>([]);
const selectedRoleId = ref<number | null>(null);
const loadingRoles = ref(false);
const loadingPermissions = ref(false);
const saving = ref(false);
const creating = ref(false);
const actions = ['read', 'create', 'update', 'delete'];

const form = reactive<any>({ id: null, name: '', description: '', isActive: true, isSystem: false, permissionIds: [] });

const canCreate = computed(() => checkPermission('roles.create'));
const canUpdate = computed(() => checkPermission('roles.update'));
const canDelete = computed(() => checkPermission('roles.delete'));
const isOwner = computed(() => form.name === 'Owner');
const canUpdateSelected = computed(() => creating.value ? canCreate.value : canUpdate.value);
const canSave = computed(() => !isOwner.value && (creating.value ? canCreate.value : canUpdate.value));

const permissionRows = computed(() => {
  const map: Record<string, any> = {};
  for (const permission of allPermissions.value) {
    if (!map[permission.module]) map[permission.module] = { module: permission.module };
    map[permission.module][permission.action] = permission;
  }
  return Object.values(map);
});

function actionLabel(action: string) {
  return action.charAt(0).toUpperCase() + action.slice(1);
}

async function loadRoles() {
  loadingRoles.value = true;
  try {
    const response = await getRoles();
    roles.value = response.data || [];
    if (!selectedRoleId.value && roles.value.length) await selectRole(roles.value[0].id);
  } finally {
    loadingRoles.value = false;
  }
}

async function loadPermissions() {
  loadingPermissions.value = true;
  try {
    const response = await getPermissions();
    allPermissions.value = response.data || [];
  } finally {
    loadingPermissions.value = false;
  }
}

async function selectRole(id: number) {
  creating.value = false;
  selectedRoleId.value = id;
  const response = await getRole(id);
  Object.assign(form, response.data);
}

function newRole() {
  creating.value = true;
  selectedRoleId.value = null;
  Object.assign(form, { id: null, name: '', description: '', isActive: true, isSystem: false, permissionIds: [] });
}

function cancelCreate() {
  creating.value = false;
  if (roles.value.length) selectRole(roles.value[0].id);
}

function togglePermission(id: number, checked: boolean) {
  const index = form.permissionIds.indexOf(id);
  if (checked && index === -1) form.permissionIds.push(id);
  if (!checked && index !== -1) form.permissionIds.splice(index, 1);
}

async function saveRole() {
  if (!form.name?.trim()) {
    ElMessage.warning('Role name is required');
    return;
  }

  try {
    saving.value = true;
    const payload = {
      name: form.name.trim(),
      description: form.description,
      isActive: form.isActive,
      permissionIds: form.permissionIds
    };

    if (creating.value) {
      const response = await createRole(payload);
      ElMessage.success('Role created successfully');
      creating.value = false;
      await loadRoles();
      if (response.data?.id) await selectRole(response.data.id);
    } else {
      await updateRole(form.id, payload);
      ElMessage.success('Role updated successfully');
      await loadRoles();
      await selectRole(form.id);
    }
  } finally {
    saving.value = false;
  }
}

async function removeRole() {
  await ElMessageBox.confirm(`Delete role ${form.name}?`, 'Delete Role', { type: 'warning', confirmButtonText: 'Delete' });
  await deleteRole(form.id);
  ElMessage.success('Role deleted successfully');
  selectedRoleId.value = null;
  Object.assign(form, { id: null, name: '', description: '', isActive: true, isSystem: false, permissionIds: [] });
  await loadRoles();
}

onMounted(async () => {
  await Promise.all([loadPermissions(), loadRoles()]);
});
</script>

