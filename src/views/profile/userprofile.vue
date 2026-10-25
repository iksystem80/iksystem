<template>
  <div class="app-container">
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-button"
                   circle
                   aria-label="Back"
                   @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <div>
          <h1 class="page-title">My Profile</h1>
          <div class="page-subtitle">
            Manage your name, profile photo and password.
          </div>
        </div>
      </div>
    </div>

    <div class="customer-detail">
      <el-row :gutter="20" class="customer-detail-row">
        <el-col :span="6"
                :xs="24"
                class="customer-profile-column">
          <UserProfileCard :name="profileForm.name || userStore.name || 'User'"
                           :username="userStore.username || '—'"
                           :role="userStore.roleName || 'User'"
                           :location="userStore.location || '—'"
                           :company="userStore.companyName || ''"
                           :avatar="avatarPreview || userStore.avatar"
                           :initials="initials"
                           @avatar-change="handleAvatarChange" />
        </el-col>

        <el-col :span="18"
                :xs="24"
                class="customer-content-column">
          <el-tabs v-model="activeTab"
                   class="customer-tabs">
            <el-tab-pane label="Account"
                         name="account">
              <el-card shadow="never">
                <template #header>
                  <div class="section-heading">
                    <div>
                      <h3>Profile Information</h3>
                      <p>
                        Update your display name and profile photo.
                      </p>
                    </div>
                  </div>
                </template>

                <el-form ref="profileFormRef"
                         :model="profileForm"
                         :rules="profileRules"
                         label-position="top"
                         @submit.prevent="saveProfile">
                  <el-form-item label="Username">
                    <el-input :model-value="userStore.username"
                              disabled />
                    <div class="small-text">
                      Username cannot be changed.
                    </div>
                  </el-form-item>

                  <el-form-item label="Name"
                                prop="name">
                    <el-input v-model="profileForm.name"
                              maxlength="120"
                              placeholder="Enter your name" />
                  </el-form-item>

                  <div class="setting-row">
                    <div>
                      <strong>Profile Photo</strong>
                      <div class="small-text">
                        JPG, PNG or other image formats up to 5 MB.
                      </div>
                    </div>

                    <el-upload :auto-upload="false"
                               :show-file-list="false"
                               accept="image/*"
                               :on-change="handleAvatarChange">
                      <el-button>
                        <el-icon><Camera /></el-icon>
                        Change Photo
                      </el-button>
                    </el-upload>
                  </div>

                  <div class="actions">
                    <div class="spacer"></div>

                    <el-button type="primary"
                               :loading="savingProfile"
                               @click="saveProfile">
                      Save Profile
                    </el-button>
                  </div>
                </el-form>
              </el-card>
            </el-tab-pane>

            <el-tab-pane label="Password"
                         name="password">
              <el-card shadow="never">
                <template #header>
                  <div class="section-heading">
                    <div>
                      <h3>Change Password</h3>
                      <p>
                        Enter your current password before setting a new one.
                      </p>
                    </div>
                  </div>
                </template>

                <el-form ref="passwordFormRef"
                         :model="passwordForm"
                         :rules="passwordRules"
                         label-position="top"
                         @submit.prevent="savePassword">
                  <el-form-item label="Current Password"
                                prop="currentPassword">
                    <el-input v-model="passwordForm.currentPassword"
                              type="password"
                              show-password
                              autocomplete="current-password"
                              placeholder="Enter current password" />
                  </el-form-item>

                  <el-form-item label="New Password"
                                prop="newPassword">
                    <el-input v-model="passwordForm.newPassword"
                              type="password"
                              show-password
                              autocomplete="new-password"
                              placeholder="Enter new password" />
                  </el-form-item>

                  <el-form-item label="Confirm New Password"
                                prop="confirmPassword">
                    <el-input v-model="passwordForm.confirmPassword"
                              type="password"
                              show-password
                              autocomplete="new-password"
                              placeholder="Confirm new password" />
                  </el-form-item>

                  <div class="actions">
                    <div class="spacer"></div>

                    <el-button type="primary"
                               :loading="savingPassword"
                               @click="savePassword">
                      Update Password
                    </el-button>
                  </div>
                </el-form>
              </el-card>
            </el-tab-pane>
          </el-tabs>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
    computed,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref
} from 'vue';
import { useRouter } from 'vue-router';
import type {
    FormInstance,
    FormRules,
    UploadFile
} from 'element-plus';
import { ElMessage } from 'element-plus';


import { useUserStore } from '@/store/modules/user';
import UserProfileCard from './components/userprofilecard.vue';
import {
    updateMyPassword,
    updateMyProfile
} from '@/api/profile';

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref('account');

const profileFormRef = ref<FormInstance>();
const passwordFormRef = ref<FormInstance>();

const savingProfile = ref(false);
const savingPassword = ref(false);

const selectedAvatar = ref<File | null>(null);
const avatarPreview = ref('');

const profileForm = reactive({
    name: ''
});

const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const initials = computed(() =>
    String(profileForm.name || userStore.name || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
);

const profileRules: FormRules = {
    name: [
      {
        required: true,
        message: 'Name is required.',
        trigger: ['blur', 'change']
      }
    ]
};

const validatePasswordConfirmation = (
    _rule: unknown,
    value: string,
    callback: (error?: Error) => void
) => {
    if (!value) {
      callback(new Error('Please confirm your new password.'));
      return;
    }

    if (value !== passwordForm.newPassword) {
      callback(new Error('New passwords do not match.'));
      return;
    }

    callback();
};

const passwordRules: FormRules = {
    currentPassword: [
      {
        required: true,
        message: 'Current password is required.',
        trigger: 'blur'
      }
    ],
    newPassword: [
      {
        required: true,
        message: 'New password is required.',
        trigger: 'blur'
      }
    ],
    confirmPassword: [
      {
        validator: validatePasswordConfirmation,
        trigger: ['blur', 'change']
      }
    ]
};

function releaseAvatarPreview() {
    if (
      avatarPreview.value &&
      avatarPreview.value.startsWith('blob:')
    ) {
      URL.revokeObjectURL(avatarPreview.value);
    }

    avatarPreview.value = '';
}

function handleAvatarChange(uploadFile: UploadFile) {
    const file = uploadFile.raw;

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      ElMessage.error('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      ElMessage.error('Profile photo must be 5 MB or smaller.');
      return;
    }

    releaseAvatarPreview();

    selectedAvatar.value = file;
    avatarPreview.value = URL.createObjectURL(file);
}

async function saveProfile() {
    if (!profileFormRef.value) return;

    try {
      await profileFormRef.value.validate();

      savingProfile.value = true;

      const formData = new FormData();

      formData.append(
        'name',
        profileForm.name.trim()
      );

      if (selectedAvatar.value) {
        formData.append(
          'avatar',
          selectedAvatar.value
        );
      }

      const response =
        await updateMyProfile(formData);

      if (
        !response ||
        response.success === false
      ) {
        throw new Error(
          response?.message ||
          'Unable to update profile.'
        );
      }

      await userStore.getInfo();

      profileForm.name =
        userStore.name || '';

      selectedAvatar.value = null;
      releaseAvatarPreview();

      ElMessage.success(
        'Profile updated successfully.'
      );
    } catch (error: any) {
      if (error?.fields) return;

      ElMessage.error(
        error?.response?.data?.message ||
        error?.message ||
        'Unable to update profile.'
      );
    } finally {
      savingProfile.value = false;
    }
}

async function savePassword() {
    if (!passwordFormRef.value) return;

    try {
      await passwordFormRef.value.validate();

      savingPassword.value = true;

      const response =
        await updateMyPassword({
          currentPassword:
            passwordForm.currentPassword,
          newPassword:
            passwordForm.newPassword
        });

      if (
        !response ||
        response.success === false
      ) {
        throw new Error(
          response?.message ||
          'Unable to update password.'
        );
      }

      passwordForm.currentPassword = '';
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';

      passwordFormRef.value?.clearValidate();

      ElMessage.success(
        'Password updated successfully.'
      );
    } catch (error: any) {
      if (error?.fields) return;

      ElMessage.error(
        error?.response?.data?.message ||
        error?.message ||
        'Unable to update password.'
      );
    } finally {
      savingPassword.value = false;
    }
}

async function loadProfile() {
    if (!userStore.infoLoaded) {
      await userStore.getInfo();
    }

    profileForm.name =
      userStore.name || '';
}

onMounted(loadProfile);
onBeforeUnmount(releaseAvatarPreview);
</script>
