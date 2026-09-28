<template>
    <div class="app-container irfan-profile-index irfan-ui-page">
        <div class="page-header">
            <el-button class="back-button" circle aria-label="Back" @click="router.back()">
                <el-icon>
                    <ArrowLeft />
                </el-icon>
            </el-button>
            <div>
                <h2>Customer Detail</h2>
                <p v-if="customer">
                    {{ customer.firstname }} {{ customer.lastname }}
                </p>
            </div>
        </div>
        <div v-if="customer">
            <el-row :gutter="20">
                <el-col :span="6" :xs="24">
                    <UserCard :customer="customer" />
                </el-col>
                <el-col :span="18" :xs="24">
                    <el-card>
                        <el-tabs v-model="activeTab">
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
import { useUserStore } from '@/store/modules/user'

const route = useRoute()
const router = useRouter()

const customerId = route.params.id

const userStore = useUserStore()

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

