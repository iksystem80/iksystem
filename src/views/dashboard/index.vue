<template>
    <div class="dashboard-container irfan-dashboard-index irfan-ui-page">
        <component :is="currentDashboard" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import AdminDashboard from './admin/index.vue'
import EmployeeDashboard from './employee/index.vue'

import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

/**
     * Owner and Admin receive the management dashboard.
     *
     * Manager / Employee receive the employee dashboard for now.
     *
     * We primarily use roleName from the new single-role RBAC system.
     * roles[] is kept as a fallback for compatibility.
     */
const currentDashboard = computed(() => {
        const roleName =
            String(
                userStore.roleName || ''
            ).toLowerCase()

        if (roleName === 'owner' ||roleName === 'admin') {
            return AdminDashboard
        }

        /*
         * Compatibility fallback in case the store
         * has not yet populated roleName.
         */
        const roles = userStore.roles || []

        if (roles.includes('owner') ||roles.includes('admin')) {
            return AdminDashboard
        }

        return EmployeeDashboard
})
</script>

