<template>
    <div class="app-container">
        <!-- ==================================================== -->
        <!-- HEADER -->
        <!-- ==================================================== -->
        <el-card shadow="never" class="top-panel">
            <div class="top-panel-content">
                <div>
                    <div class="eyebrow">
                        MANAGEMENT
                    </div>
                    <h2>Bonus Programs</h2>
                    <p>
                        Create, schedule, and manage customer bonus payouts.
                    </p>
                </div>
                <el-button type="primary" size="large" :icon="Plus" @click="createNew">
                    Create Bonus
                </el-button>
            </div>
            <!-- SUMMARY STRIP -->
            <div class="summary-strip">
                <div class="summary-item">
                    <div class="summary-value">
                        {{ bonuses.length }}
                    </div>
                    <div class="summary-label">
                        Total
                    </div>
                </div>
                <el-divider direction="vertical" />
                <div class="summary-item">
                    <div class="summary-value active-value">
                        {{ activeCount }}
                    </div>
                    <div class="summary-label">
                        Active
                    </div>
                </div>
                <el-divider direction="vertical" />
                <div class="summary-item">
                    <div class="summary-value inactive-value">
                        {{ inactiveCount }}
                    </div>
                    <div class="summary-label">
                        Inactive
                    </div>
                </div>
            </div>
        </el-card>
        <!-- ==================================================== -->
        <!-- LOADING -->
        <!-- ==================================================== -->
        <el-skeleton v-if="loading" :rows="8" animated class="content-space" />
        <!-- ==================================================== -->
        <!-- EMPTY -->
        <!-- ==================================================== -->
        <el-empty v-else-if="bonuses.length === 0" description="No bonus programs have been created." class="content-space">
            <el-button type="primary" :icon="Plus" @click="createNew">
                Create Your First Bonus
            </el-button>
        </el-empty>
        <!-- ==================================================== -->
        <!-- BONUS LIST -->
        <!-- ==================================================== -->
        <div v-else class="bonus-list">
            <div v-for="item in bonuses" :key="item.id" class="bonus-item" :class="{ 'is-active': item.isActive }" @click="editBonus(item)">
                <!-- STATUS RAIL -->
                <div class="status-rail"></div>
                <!-- MAIN -->
                <div class="bonus-main">
                    <!-- ================================================= -->
                    <!-- NAME / STATUS -->
                    <!-- ================================================= -->
                    <div class="bonus-name-area">
                        <div class="bonus-status-line">
                            <!--<el-tag :type="item.isActive ? 'success' : 'info'"
                                    effect="light"
                                    round
                                    size="small">
                                {{ item.isActive ? 'Active' : 'Inactive' }}
                            </el-tag>-->
                            <span class="bonus-id">
                                Bonus #{{ item.id }}
                            </span>
                        </div>
                        <el-tooltip :content="item.name" placement="top-start" :disabled="!item.name || item.name.length < 45">
                            <div class="bonus-name">
                                {{ item.name }}
                            </div>
                        </el-tooltip>
                    </div>
                    <!-- ================================================= -->
                    <!-- STATS -->
                    <!-- ================================================= -->
                    <div class="bonus-stats">
                        <!-- SCHEDULE -->
                        <div class="stat-block">
                            <div class="stat-icon">
                                <el-icon>
                                    <Clock />
                                </el-icon>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value">
                                    <span v-if="item.allDay">
                                        All day
                                    </span>
                                    <span v-else>
                                        {{ item.blockCount }}
                                        {{ item.blockCount === 1 ? 'block' : 'blocks' }}
                                    </span>
                                </div>
                                <div class="stat-label">
                                    Schedule
                                </div>
                            </div>
                        </div>
                        <!-- PAYOUT -->
                        <div class="stat-block">
                            <div class="stat-icon">
                                <el-icon>
                                    <Money />
                                </el-icon>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value">
                                    {{ item.payoutCount }}
                                </div>
                                <div class="stat-label">
                                    {{ item.payoutCount === 1 ? 'Payout' : 'Payouts' }}
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- ================================================= -->
                    <!-- ENABLE / DISABLE -->
                    <!-- ================================================= -->
                    <div class="bonus-controls" @click.stop>
                        <div class="switch-wrap">
                            <span class="switch-label">
                                {{ item.isActive ? 'Enabled' : 'Disabled' }}
                            </span>
                            <el-switch v-model="item.isActive" size="large" @change="handleStatusChange(item)" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup>
import {
        ref,
        computed,
        onMounted
} from 'vue'

import {
        Plus,
        Clock,
        Money
} from '@element-plus/icons-vue'

import {
        ElMessage
} from 'element-plus'

import {
        useRouter
} from 'vue-router'

import {
        useUserStore
} from '@/store/modules/user'

import {
        getBonuses,
        updateBonusStatus
} from '@/api/bonus'


const router = useRouter()

const userStore = useUserStore()


const bonuses = ref([])

const loading = ref(false)


// ============================================================
// COUNTS
// ============================================================

const activeCount = computed(() => {

        return bonuses.value.filter(
            item => item.isActive
        ).length
})


const inactiveCount = computed(() => {

        return bonuses.value.length -
            activeCount.value
})


// ============================================================
// LOAD
// ============================================================

const loadBonuses = async () => {

        try {

            loading.value = true

            const response = await getBonuses(
                userStore.locationId
            )

            bonuses.value = response.data ?? []

        } catch (error) {

            ElMessage.error(
                error.response?.data?.message ||
                'Unable to load bonuses.'
            )

        } finally {

            loading.value = false
        }
}


// ============================================================
// CREATE
// ============================================================

const createNew = () => {

        router.push({
            name: 'BonusCreate'
        })
}


// ============================================================
// EDIT
// ============================================================

const editBonus = item => {

        router.push({
            name: 'BonusEdit',

            params: {
                id: item.id
            }
        })
}


// ============================================================
// STATUS
// ============================================================

const handleStatusChange = async item => {

        const previousValue = !item.isActive

        try {

            const response = await updateBonusStatus(
                item.id,
                item.isActive
            )

            ElMessage.success(
                response.message
            )

        } catch (error) {

            item.isActive = previousValue

            ElMessage.error(
                error.response?.data?.message ||
                'Unable to update bonus status.'
            )
        }
}


// ============================================================
// INIT
// ============================================================

onMounted(() => {
        loadBonuses()
})
</script>


