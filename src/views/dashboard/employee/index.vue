<template>
    <div class="dashboard-editor-container">
        <!-- Basic Dashboard Statistics -->
        <PanelGroup />
        <!-- Current Customers -->
        <div v-if="canViewCustomers" class="dashboard-section">
            <CurrentCustomer />
        </div>
        <!-- User does not have customer access -->
        <el-alert v-else title="Customer information is not available for your account." type="info" :closable="false" show-icon class="permission-alert" />
    </div>
</template>

<script setup>
import { computed } from 'vue'

import PanelGroup from '../components/PanelGroup'
import CurrentCustomer from '../../components/CurrentCustomer'

import { useUserStore } from '@/store/modules/user'

const userStore =
        useUserStore()

const canViewCustomers = computed(() => {
    const roleName =
        String(
            userStore.roleName || ''
        ).toLowerCase()

    if (
        roleName === 'owner' ||
        roleName === 'admin'
    ) {
        return true
    }

    return (
        userStore.permissions || []
    ).includes(
        'customers.read'
    )
})
</script>

<style lang="scss" scoped>
    .dashboard-editor-container {
        position: relative;
        padding: 20px;
        background-color: rgb(240, 242, 245);
    }

    .dashboard-section {
        padding: 16px 16px 0;
        margin-bottom: 32px;
        background: #fff;
    }

    .permission-alert {
        margin-bottom: 32px;
    }

    @media (max-width: 1024px) {
        .dashboard-editor-container {
            padding: 12px;
        }
    }
</style>