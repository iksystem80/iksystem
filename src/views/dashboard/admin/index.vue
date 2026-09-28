<template>
    <div class="dashboard-editor-container irfan-ui-page">
        <!-- Dashboard Statistics -->
        <PanelGroup @handleSetLineChartData="handleSetLineChartData" />
        <!-- Current Customers -->
        <div v-if="canViewCustomers" class="dashboard-section">
            <CurrentCustomer />
        </div>
        <!-- No Customer Permission -->
        <el-alert v-else title="Customer information is not available for your account." type="info" :closable="false" show-icon class="permission-alert" />
        <!-- Charts -->
        <el-row :gutter="32">
            <el-col :xs="24" :sm="24" :lg="8">
                <div class="chart-wrapper">
                    <!-- Reserved for CheckinCustomer -->
                </div>
            </el-col>
            <el-col :xs="24" :sm="24" :lg="8">
                <div class="chart-wrapper">
                    <PieChart />
                </div>
            </el-col>
            <el-col :xs="24" :sm="24" :lg="8">
                <div class="chart-wrapper">
                    <BarChart />
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import PanelGroup from '../components/PanelGroup'
import CurrentCustomer from '../../components/CurrentCustomer'
import PieChart from '../components/PieChart'
import BarChart from '../components/BarChart'

import { useUserStore } from '@/store/modules/user'

const userStore =
        useUserStore()

const lineChartDataSource = {
        newVisitis: {
            expectedData: [
                100,
                120,
                161,
                134,
                105,
                160,
                165
            ],

            actualData: [
                120,
                82,
                91,
                154,
                162,
                140,
                145
            ]
        },

        messages: {
            expectedData: [
                200,
                192,
                120,
                144,
                160,
                130,
                140
            ],

            actualData: [
                180,
                160,
                151,
                106,
                145,
                150,
                130
            ]
        },

        purchases: {
            expectedData: [
                80,
                100,
                121,
                104,
                105,
                90,
                100
            ],

            actualData: [
                120,
                90,
                100,
                138,
                142,
                130,
                130
            ]
        },

        shoppings: {
            expectedData: [
                130,
                140,
                141,
                142,
                145,
                150,
                160
            ],

            actualData: [
                120,
                82,
                91,
                154,
                162,
                140,
                130
            ]
        }
}

const lineChartData =
        ref(
            lineChartDataSource.newVisitis
        )

/**
     * Owner always has access.
     *
     * Admin normally receives customers.read through
     * RolePermissions.
     */
const canViewCustomers = computed(() => {
    const roleName = String(userStore.roleName || '').toLowerCase()

    console.log(roleName)

    if (roleName === 'owner' ||roleName === 'admin') {
        return true
    }

    return (userStore.permissions || []).includes('customers.read')
})

function handleSetLineChartData(
        type
) {
        if (
            lineChartDataSource[type]
        ) {
            lineChartData.value =
                lineChartDataSource[type]
        }
}
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

    .chart-wrapper {
        min-height: 50px;
        padding: 16px 16px 0;
        margin-bottom: 32px;
        background: #fff;
    }

    @media (max-width: 1024px) {
        .dashboard-editor-container {
            padding: 12px;
        }

        .chart-wrapper {
            padding: 8px;
        }
    }
</style>