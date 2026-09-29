<template>
    <div class="app-container">
        <div class="page-header">
            <div class="header-left">
                <el-button class="back-button" circle aria-label="Back" @click="router.back()">
                    <el-icon>
                        <ArrowLeft />
                    </el-icon>
                </el-button>
                <div>
                    <h1>Customer Detail</h1>
                    <p v-if="customer">{{ customer.firstname }} {{ customer.lastname }}</p>
                    <p v-else>Customer profile</p>
                </div>
            </div>
        </div>

        <div v-if="customer" class="customer-detail">
            <el-row :gutter="20" class="customer-detail-row">
                <el-col :span="6" :xs="24" class="customer-profile-column">
                    <UserCard :customer="customer" />
                </el-col>

                <el-col :span="18" :xs="24" class="customer-content-column">
                    <el-card shadow="never" class="customer-content-card">
                        <el-tabs v-model="activeTab" class="customer-tabs">
                            <el-tab-pane label="Account" name="account">
                                <Account :customer="customer" @updated="handleAccountUpdated" />
                            </el-tab-pane>

                            <el-tab-pane label="Activity" name="activity">
                                <Activity :customer="customer" />
                            </el-tab-pane>

                            <el-tab-pane label="Timeline" name="timeline">
                                <Timeline ref="timelineRef" :customer="customer" />
                            </el-tab-pane>
                        </el-tabs>
                    </el-card>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

import UserCard from './components/UserCard.vue'
import Activity from './components/Activity.vue'
import Timeline from './components/Timeline.vue'
import Account from './components/Account.vue'

import { getcustomerbyid } from '@/api/customer'

const route = useRoute()
const router = useRouter()

const customerId = route.params.id

const activeTab = ref('account')
const customer = ref(null)
const timelineRef = ref(null)

const handleAccountUpdated = () => {
        timelineRef.value?.reloadTimeline()
}

const getCustomer = async () => {
        const response = await getcustomerbyid(customerId)
        customer.value = response.data[0]
}

onMounted(() => {
        getCustomer()
})
</script>

<style scoped>
    /* Match the shared back button used on report/detail pages. */
    .back-button.el-button {
        width: 38px !important;
        height: 38px !important;
        min-width: 38px !important;
        padding: 0 !important;
        border-radius: 50% !important;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 38px;
        font-size: 18px;
    }

    .customer-detail {
        width: 100%;
    }

    .customer-detail-row {
        align-items: flex-start;
    }

    .customer-profile-column,
    .customer-content-column {
        min-width: 0;
    }

    .customer-content-card {
        width: 100%;
        border-radius: 8px;
    }

        .customer-content-card :deep(.el-card__body) {
            padding: 0 20px 20px;
        }

    .customer-tabs {
        width: 100%;
    }

        .customer-tabs :deep(.el-tabs__header) {
            margin-bottom: 20px;
        }

    @media (max-width: 1024px) {
        .page-header {
            justify-content: flex-start !important;
            text-align: left !important;
        }

        .header-left {
            display: flex;
            align-items: center;
            justify-content: flex-start !important;
            width: 100%;
            text-align: left !important;
        }

            .header-left > div {
                text-align: left !important;
            }

        .customer-detail-row {
            row-gap: 16px;
        }

        .customer-profile-column {
            margin-bottom: 0;
        }

        .customer-content-card :deep(.el-card__body) {
            padding: 0 14px 14px;
        }

        .customer-tabs :deep(.el-tabs__header) {
            margin-bottom: 14px;
        }
    }
</style>
