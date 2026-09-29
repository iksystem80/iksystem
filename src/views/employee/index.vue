<template>
  <div class="app-container">
    <div class="page-header">
      <div>
        <h2>User Management</h2>
        <p>Manage user information, role assignment and account status.</p>
      </div>
      <el-button v-if="canCreate" type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>
        New User
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
      <el-table v-if="device !== 'mobile'" v-loading="loading" :data="filteredEmployees" style="width:100%">
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

        <el-table-column prop="jobTitle" label="Job Title" min-width="120">
          <template #default="{ row }">{{ row.jobTitle || '—' }}</template>
        </el-table-column>

        <el-table-column label="Role" min-width="120">
          <template #default="{ row }"><el-tag effect="light">{{ row.roleName }}</el-tag></template>
        </el-table-column>

        <el-table-column label="Contact" min-width="150">
          <template #default="{ row }">
            <div class="contact-cell"><span>{{ row.email || 'No email' }}</span><small>{{ row.phone || 'No phone' }}</small></div>
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
            <el-button v-if="canUpdate" link @click="openEdit(row)" class="action-icon-btn"><el-icon><Edit /></el-icon></el-button>
            <el-button v-if="canDelete" link type="danger" @click="removeUser(row)" class="action-icon-btn"><el-icon><Delete /></el-icon></el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-else v-loading="loading" class="mobile-list">
        <el-card v-for="row in filteredEmployees" :key="row.id" shadow="never" class="mobile-user-card">
          <div class="mobile-top">
            <div class="user-cell">
              <el-avatar :size="50" :src="row.avatar">{{ initials(row.name) }}</el-avatar>
              <div class="user-text"><strong>{{ row.name }}</strong><span>@{{ row.username }}</span></div>
            </div>
            <el-tag>{{ row.roleName }}</el-tag>
          </div>
          <div class="mobile-details">
            <span>{{ row.jobTitle || 'No job title' }}</span>
            <span>{{ row.email || 'No email' }}</span>
            <span>Joined {{ row.dateCreated }}</span>
          </div>
          <div class="mobile-actions">
            <el-switch v-if="canUpdate" :model-value="row.isActive" @change="value => changeStatus(row, Boolean(value))" />
            <div>
              <el-button v-if="canUpdate" link @click="openEdit(row)" class="action-icon-btn"><el-icon><Edit /></el-icon></el-button>
              <el-button v-if="canDelete" link type="danger" @click="removeUser(row)" class="action-icon-btn"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
        </el-card>
      </div>

      <el-empty v-if="!loading && filteredEmployees.length === 0" description="No users found" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="selectedEmployee ? 'Edit User' : 'New User'" width="620px" class="user-dialog" destroy-on-close>
      <NewEmployee :employee="selectedEmployee" @close="dialogVisible = false" @saved="handleSaved" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import NewEmployee from './newemployee.vue'
import { getemployees, deleteemployee, updateemployeestatus } from '@/api/employee'
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import checkPermission from '@/utils/permission'

const userStore = useUserStore()
const appStore = useAppStore()
const device = computed(() => appStore.device)
const employees = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const selectedEmployee = ref<any | null>(null)
const search = ref('')
const statusFilter = ref('')

const canCreate = computed(() => checkPermission('users.create'))
const canUpdate = computed(() => checkPermission('users.update'))
const canDelete = computed(() => checkPermission('users.delete'))

const filteredEmployees = computed(() => {
  const text = search.value.trim().toLowerCase()
  return employees.value.filter(row => {
    const matchesText = !text || [row.name, row.username, row.roleName, row.jobTitle, row.email]
      .some(value => String(value || '').toLowerCase().includes(text))
    const matchesStatus = !statusFilter.value || (statusFilter.value === 'active' ? row.isActive : !row.isActive)
    return matchesText && matchesStatus
  })
})

async function loadEmployees() {
  loading.value = true
  try {
    const response = await getemployees(userStore.locationId)
    employees.value = response.data || []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  selectedEmployee.value = null
  dialogVisible.value = true
}

function openEdit(row: any) {
  selectedEmployee.value = { ...row, locationId: userStore.locationId }
  dialogVisible.value = true
}

async function handleSaved() {
  dialogVisible.value = false
  await loadEmployees()
}

async function changeStatus(row: any, value: boolean) {
  try {
    await updateemployeestatus(row.id, value)
    row.isActive = value
    ElMessage.success('User status updated')
  } catch {
    await loadEmployees()
  }
}

async function removeUser(row: any) {
  try {
    await ElMessageBox.confirm(`Delete ${row.name}?`, 'Delete User', { type: 'warning', confirmButtonText: 'Delete' })
    await deleteemployee(row.id)
    ElMessage.success('User deleted successfully')
    await loadEmployees()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close' && error?.response?.status === 409) {
      ElMessage.error(error?.response?.data?.message || 'This user cannot be deleted')
    }
  }
}

function initials(name: string) {
  return String(name || '?').split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase()
}

onMounted(loadEmployees)
</script>


