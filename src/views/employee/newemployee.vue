<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12">
        <el-form-item label="Full Name" prop="name">
          <el-input v-model="form.name" placeholder="Employee name" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Username" prop="username">
          <el-input v-model="form.username" placeholder="Username" autocomplete="off" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item :label="isEdit ? 'New Password (optional)' : 'Password'" prop="password">
          <el-input v-model="form.password" type="password" show-password autocomplete="new-password" placeholder="Password" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Role" prop="roleId">
          <el-select v-model="form.roleId" placeholder="Select role" style="width:100%">
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" :disabled="!role.isActive" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Email">
          <el-input v-model="form.email" placeholder="Email" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Phone">
          <el-input v-model="form.phone" placeholder="Phone" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Job Title">
          <el-input v-model="form.jobTitle" placeholder="Job title" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Status">
          <el-switch v-model="form.isActive" active-text="Active" inactive-text="Inactive" />
        </el-form-item>
      </el-col>
    </el-row>
    <div class="actions">
      <el-button @click="emit('close')">Cancel</el-button>
      <el-button type="primary" :loading="saving" @click="submitForm">
        {{ isEdit ? 'Update User' : 'Create User' }}
      </el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { saveemployee, updateemployee } from '@/api/employee';
import { getRoles } from '@/api/role';
import { useUserStore } from '@/store/modules/user';

const props = defineProps<{ employee?: any | null }>();
const emit = defineEmits(['close', 'saved']);
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const saving = ref(false);
const roles = ref<any[]>([]);
const isEdit = computed(() => !!props.employee?.id);

const form = reactive({
  username: '', password: '', name: '', email: '', phone: '', jobTitle: '',
  roleId: null as number | null, locationid: '', avatar: '/upload/profile.png', isActive: true
});

const rules: FormRules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  username: [{ required: true, message: 'Username is required', trigger: 'blur' }],
  roleId: [{ required: true, message: 'Role is required', trigger: 'change' }],
  password: [{
    validator: (_rule, value, callback) => {
      if (!isEdit.value && !value) return callback(new Error('Password is required'));
      if (value && value.length < 3) return callback(new Error('Password must be at least 3 characters'));
      callback();
    },
    trigger: 'blur'
  }]
};

function fillForm() {
  const row = props.employee;
  form.username = row?.username || '';
  form.password = '';
  form.name = row?.name || '';
  form.email = row?.email || '';
  form.phone = row?.phone || '';
  form.jobTitle = row?.jobTitle || '';
  form.roleId = row?.roleId ?? null;
  form.locationid = String(row?.locationId || userStore.locationId);
  form.avatar = row?.avatar || '/upload/profile.png';
  form.isActive = row?.isActive ?? true;
}

async function loadRoles() {
  const response = await getRoles();
  roles.value = response.data || [];
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate();

  try {
    saving.value = true;
    const payload = { ...form, locationid: userStore.locationId };

    if (isEdit.value) {
      await updateemployee(props.employee.id, payload);
      ElMessage.success('User updated successfully');
    } else {
      await saveemployee(payload);
      ElMessage.success('User created successfully');
    }

    emit('saved');
  } catch (error: any) {
    if (error?.response?.status === 400 || error?.response?.status === 409) {
      ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to save user');
    }
  } finally {
    saving.value = false;
  }
}

watch(() => props.employee, fillForm, { immediate: true });
onMounted(loadRoles);
</script>

