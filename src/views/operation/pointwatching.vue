<template>
    <div class="app-container irfan-operation-pointwatching irfan-ui-page">
        <el-card shadow="never">
            <div class="page-header">
                <div>
                    <h2>Point Watching</h2>
                    <div class="subtitle">
                        Review customer points and employee point activity.
                    </div>
                </div>
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
        </el-card>
        <div class="report-content">
            <PointsByDate v-if="viewMode === 'date'" :location-id="locationId" />
            <PointsByEmployee v-else :location-id="locationId" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Calendar, User } from '@element-plus/icons-vue'

import PointsByDate from './components/PointsByDate.vue'
import PointsByEmployee from './components/PointsByEmployee.vue'

import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

const viewMode = ref('date')

const locationId = computed(() => userStore.locationId)
</script>


