<template>
  <div class="app-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Point Watching</h2>
        <p>
          Review customer points and employee point activity.
        </p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="viewMode" class="view-mode-switch">
          <el-radio-button label="date">
            <el-icon><Calendar /></el-icon>
            By Date
          </el-radio-button>
          <el-radio-button label="employee">
            <el-icon><User /></el-icon>
            By Employee
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>
   
    <div>
      <PointsByDate v-if="viewMode === 'date'" :location-id="locationId" />
      <PointsByEmployee v-else :location-id="locationId" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Calendar, User } from '@element-plus/icons-vue';

import PointsByDate from './components/pointsbydate.vue';
import PointsByEmployee from './components/pointsbyemployee.vue';

import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();

const viewMode = ref('date');

const locationId = computed(() => userStore.locationId);
</script>

