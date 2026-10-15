<template>
  <el-card shadow="never" class="profile-card customer-user-card">
    <div class="profile-header">
      <div class="avatar-wrap">
        <img
          v-if="avatar"
          :src="avatar"
          :alt="name"
          class="customer-avatar"
        />

        <div
          v-else
          class="customer-avatar customer-avatar-fallback"
        >
          {{ initials }}
        </div>

        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="onAvatarChange"
        >
          <span
            class="vip-dot"
            role="button"
            aria-label="Change profile photo"
            title="Change profile photo"
          >
            <el-icon><Camera /></el-icon>
          </span>
        </el-upload>
      </div>

      <div class="profile-info">
        <h3>{{ name }}</h3>

        <div class="phone-row">
          <el-icon><User /></el-icon>
          <span>@{{ username }}</span>
        </div>
      </div>
    </div>

    <el-divider />

    <div class="quick-info">
      <div class="info-item">
        <div class="info-icon">
          <el-icon><UserFilled /></el-icon>
        </div>

        <div class="info-content">
          <span>Role</span>
          <strong>{{ role }}</strong>
        </div>
      </div>

      <div class="info-item">
        <div class="info-icon">
          <el-icon><Location /></el-icon>
        </div>

        <div class="info-content">
          <span>Location</span>
          <strong>{{ location }}</strong>
        </div>
      </div>
    </div>

    <div v-if="company" class="section-block">
      <div class="section-title">
        <div class="section-title-icon">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <span>Company</span>
      </div>

      <div class="note-box">
        {{ company }}
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { UploadFile } from 'element-plus';
import {
  Camera,
  Location,
  OfficeBuilding,
  User,
  UserFilled
} from '@element-plus/icons-vue';

defineProps<{
  name: string;
  username: string;
  role: string;
  location: string;
  company: string;
  avatar: string;
  initials: string;
}>();

const emit = defineEmits<{
  (e: 'avatar-change', file: UploadFile): void;
}>();

function onAvatarChange(file: UploadFile) {
  emit('avatar-change', file);
}
</script>

<style lang="scss" scoped>
.profile-card {
  margin-bottom: 20px;
  border-radius: 16px;
  border: 1px solid var(--stat-card-border);
  background: linear-gradient(
    145deg,
    var(--stat-card-bg-start) 0%,
    var(--stat-card-bg-end) 100%
  );
}

.profile-card :deep(.el-card__body) {
  padding: 22px;
}

/* =========================
   PROFILE
========================= */

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-wrap {
  position: relative;
  display: inline-flex;
}

.customer-avatar {
  width: 104px;
  height: 104px;
  display: block;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.customer-avatar-fallback {
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
  font-size: 30px;
  font-weight: 700;
}

.vip-dot {
  position: absolute;
  right: -3px;
  bottom: 3px;
  width: 29px;
  height: 29px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #fff;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 12px color-mix(
    in srgb,
    var(--el-color-primary) 30%,
    transparent
  );
}

.profile-info {
  margin: 14px 0 12px;
}

.profile-info h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 700;
}

.phone-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 7px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.phone-row .el-icon {
  color: var(--el-color-primary);
}

/* =========================
   QUICK INFO
========================= */

.quick-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 11px 10px;
  border: 1px solid var(--stat-card-border);
  border-radius: 12px;
  background: linear-gradient(
    145deg,
    var(--stat-card-bg-start) 0%,
    var(--stat-card-bg-end) 100%
  );
}

.info-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
  font-size: 17px;
}

.info-content {
  min-width: 0;
}

.info-item span,
.info-item strong {
  display: block;
}

.info-item span {
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

.info-item strong {
  margin-top: 2px;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =========================
   COMPANY
========================= */

.section-block {
  margin-top: 22px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 11px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 650;
}

.section-title-icon {
  width: 29px;
  height: 29px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.note-box {
  padding: 12px 13px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 11px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .profile-card :deep(.el-card__body) {
    padding: 18px;
  }

  .quick-info {
    margin-top: 4px;
  }
}
</style>
