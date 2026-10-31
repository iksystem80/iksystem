<template>
  <div class="app-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">User Management</h2>
        <p>Manage user information, role assignment and account status.</p>
      </div>
      <el-button v-if="canCreate" type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>
        <span>New User</span>
      </el-button>
    </div>
    <el-card shadow="never">
      <div class="toolbar">
        <el-input v-model="search" clearable placeholder="Search name, username or role" :prefix-icon="Search" />
        <el-select v-model="statusFilter" clearable placeholder="All statuses">
          <el-option label="Active" value="active" />
          <el-option label="Inactive" value="inactive" />
        </el-select>
      </div>
      <div class="weekly-report-table-wrap weekly-summary-table-wrap">
        <el-table v-if="device !== 'mobile'" size="small1" v-loading="loading" class="app-data-table" :data="filteredEmployees">
          <el-table-column label="User" min-width="230">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="42" :src="row.avatar">{{ initials(row.name) }}</el-avatar>
                <div class="user-text">
                  <strong>{{ row.name }}</strong>
                  <span>@{{ row.username }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Role" min-width="120">
            <template #default="{ row }">
              <el-tag effect="light">{{ row.roleName }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="dateCreated" label="Date Joined" min-width="120" />

          <el-table-column label="Status" width="110" align="center">
            <template #default="{ row }">
              <el-switch v-if="canUpdate" :model-value="row.isActive" @change="value => changeStatus(row, Boolean(value))" />
              <el-tag v-else :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? 'Active' : 'Inactive' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="120" fixed="right" align="center">
            <template #default="{ row }">
              <el-button v-if="canUpdate" link @click="openEdit(row)">
                <el-icon size="20"><Edit /></el-icon>
              </el-button>
              <el-button v-if="canDelete" link type="danger" @click="removeUser(row)">
                <el-icon size="20"><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-else v-loading="loading" class="mobile-list space-top">
          <el-card v-for="row in filteredEmployees" :key="row.id" shadow="never" class="mobile-user-card">
            <div class="mobile-top">
              <div class="user-cell mobile-user-identity">
                <el-avatar :size="46" :src="row.avatar">{{ initials(row.name) }}</el-avatar>
                <div class="user-text mobile-user-name">
                  <strong>{{ row.name }}</strong>
                  <span>@{{ row.username }}</span>
                </div>
              </div>
              <div class="mobile-user-status">
                <el-tag size="small" effect="light">{{ row.roleName }}</el-tag>
                <div class="mobile-user-toggle">
                  <span>{{ row.isActive ? 'Active' : 'Inactive' }}</span>
                  <el-switch v-if="canUpdate" :model-value="row.isActive" @change="value => changeStatus(row, Boolean(value))" />
                </div>
              </div>
            </div>
            <div class="mobile-actions">
              <span class="mobile-user-joined">Joined {{ row.dateCreated }}</span>
              <div class="mobile-user-buttons">
                <el-button v-if="canUpdate" link @click="openEdit(row)" class="action-icon-btn" aria-label="Edit user"><el-icon size="18"><Edit /></el-icon></el-button>
                <el-button v-if="canDelete" link type="danger" @click="removeUser(row)" class="action-icon-btn" aria-label="Delete user"><el-icon size="18"><Delete /></el-icon></el-button>
              </div>
            </div>
          </el-card>
        </div>

        <el-empty v-if="!loading && filteredEmployees.length === 0" description="No users found" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="selectedEmployee ? 'Edit User' : 'New User'"
               :width="device === 'mobile' ? 'calc(100vw - 24px)' : '620px'"
               :align-center="device === 'mobile'"
               :top="device === 'mobile' ? undefined : '15vh'"
               class="user-dialog" destroy-on-close>
      <NewEmployee :employee="selectedEmployee" @close="dialogVisible = false" @saved="handleSaved" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import NewEmployee from './newemployee.vue';
import { getemployees, deleteemployee, updateemployeestatus } from '@/api/employee';
import { useUserStore } from '@/store/modules/user';
import { useAppStore } from '@/store/modules/app';
import checkPermission from '@/utils/permission';

const userStore = useUserStore();
const appStore = useAppStore();
const device = computed(() => appStore.device);
const employees = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const selectedEmployee = ref<any | null>(null);
const search = ref('');
const statusFilter = ref('');

const canManageUsers = computed(() => checkPermission('settings.users'));
const canCreate = canManageUsers;
const canUpdate = canManageUsers;
const canDelete = canManageUsers;

const filteredEmployees = computed(() => {
        const text = search.value.trim().toLowerCase();

        return employees.value
          .filter(row => {
            const matchesText = !text || [row.name, row.username, row.roleName]
              .some(value => String(value || '').toLowerCase().includes(text));

            const matchesStatus =
              !statusFilter.value ||
              (statusFilter.value === 'active' ? row.isActive : !row.isActive);

            return matchesText && matchesStatus;
          })
          .sort((a, b) => {
            const roleCompare = String(a.roleName || '').localeCompare(
              String(b.roleName || ''),
              undefined,
              { sensitivity: 'base' }
            );

            if (roleCompare !== 0) return roleCompare;

            return String(a.name || '').localeCompare(
              String(b.name || ''),
              undefined,
              { sensitivity: 'base' }
            );
          });
});

async function loadEmployees() {
        loading.value = true;
        try {
          const response = await getemployees(userStore.locationId);
          employees.value = response.data || [];
        } finally {
          loading.value = false;
        }
}

function openCreate() {
        selectedEmployee.value = null;
        dialogVisible.value = true;
}

function openEdit(row: any) {
        selectedEmployee.value = { ...row };
        dialogVisible.value = true;
}

async function handleSaved() {
        dialogVisible.value = false;
        await loadEmployees();
}

async function changeStatus(row: any, value: boolean) {
        try {
          await updateemployeestatus(row.id, value);
          row.isActive = value;
          ElMessage.success('User status updated');
        } catch {
          await loadEmployees();
        }
}

async function removeUser(row: any) {
        try {
          await ElMessageBox.confirm(`Delete ${row.name}?`, 'Delete User', { type: 'warning', confirmButtonText: 'Delete' });
          await deleteemployee(row.id);
          ElMessage.success('User deleted successfully');
          await loadEmployees();
        } catch (error: any) {
          if (error !== 'cancel' && error !== 'close' && error?.response?.status === 409) {
            ElMessage.error(error?.response?.data?.message || 'This user cannot be deleted');
          }
        }
}

function initials(name: string) {
        return String(name || '?').split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();
}

onMounted(loadEmployees);
</script>

<style scoped>
  .mobile-list {
    display: grid;
    gap: 12px;
  }

  .mobile-user-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-bg-color);
  }

    .mobile-user-card :deep(.el-card__body) {
      padding: 14px 15px 10px;
    }

    .mobile-user-card .mobile-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

  .mobile-user-identity {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

    .mobile-user-identity :deep(.el-avatar) {
      flex-shrink: 0;
    }

  .mobile-user-name {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

    .mobile-user-name strong {
      font-size: 13px;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }

    .mobile-user-name span {
      font-size: 11px;
      color: var(--el-text-color-secondary);
      overflow-wrap: anywhere;
    }

  .mobile-user-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    flex-shrink: 0;
  }

  .mobile-user-toggle {
    display: flex;
    align-items: center;
    gap: 7px;
  }

    .mobile-user-toggle > span {
      color: var(--el-text-color-secondary);
      font-size: 10px;
    }

  .mobile-user-card .mobile-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 12px;
    padding-top: 9px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .mobile-user-joined {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  .mobile-user-buttons {
    display: flex;
    align-items: center;
    gap: 4px;
  }

    .mobile-user-buttons :deep(.el-button) {
      margin: 0;
      min-height: 28px;
      min-width: 28px;
    }

  @media (max-width: 767px) {
    :global(.user-dialog) {
      max-width: calc(100vw - 24px);
    }

    :global(.user-dialog .el-dialog__body) {
      max-height: calc(100dvh - 145px);
      overflow-y: auto;
      overflow-x: hidden;
    }
  }
</style>

