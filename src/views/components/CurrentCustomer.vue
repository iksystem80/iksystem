<template>
    <div v-loading="loading" element-loading-text="Loading check-ins...">
        <!-- FILTER -->
        <div class="filter-row">
            <el-segmented v-model="statusFilter" :options="filterOptions" class="status-filter" />
        </div>
        <el-divider class="filter-divider" />
        <!-- EMPTY -->
        <el-empty v-if="!loading && filteredCheckinData.length === 0" :description="emptyDescription" />
        <!-- CHECK-IN LIST -->
        <div v-for="row in filteredCheckinData" :key="row.checkinid" class="checkin-item">
            <el-row>
                <!-- CUSTOMER IMAGE -->
                <span>
                    <PanThumb :image="row.avatar" height="80px" width="80px" :hoverable="false">
                        <img :src="row.avatar" class="img-circle" />
                    </PanThumb>
                </span>
                <!-- CUSTOMER INFO -->
                <span class="info-conatiner">
                    <div class="customer-name" @click="openCustomer(row)">
                        {{ row.fullname }}
                    </div>
                    <div>
                        <el-tag class="points-tag" type="warning" effect="light">
                            <el-icon>
                                <Coin />
                            </el-icon>

                            {{ Number(row.points || 0).toLocaleString() }} PTS
                        </el-tag>
                    </div>
                </span>
                <!-- CHECK-IN TIME -->
                <span class="checkin-time">
                    <div>
                        <el-icon>
                            <User />
                        </el-icon>

                        {{ row.checkindate }}
                    </div>
                    <div>
                        <el-icon>
                            <Clock />
                        </el-icon>

                        {{ row.duration }}
                    </div>
                </span>
            </el-row>
            <!-- FOOTER -->
            <el-row class="footer-row">
                <span class="footer-content">
                    <!-- APPROVED -->
                    <span v-if="row.status" class="approved-info">
                        <el-icon>
                            <Monitor />
                        </el-icon>
                        <b class="machine-number">
                            {{ row.MachineNumber }}
                        </b>
                        <template v-if="row.approveddate">
                            &nbsp;|&nbsp;
                            {{ row.approveddate }}
                        </template>

                        <template v-if="row.approvedby">
                            &nbsp;|&nbsp;
                            {{ row.approvedby }}
                        </template>

                        <el-image v-if="row.ImageUrl"
                                  src="/src/assets/viewphoto.png"
                                  class="view-photo"
                                  :preview-src-list="[row.ImageUrl]"
                                  fit="cover"
                                  preview-teleported />

                    </span>

                    <!-- PENDING -->
                    <span v-else>
                        <el-button v-if="userStore.isClockedIn"
                                   type="warning"
                                   round
                                   :icon="WarningFilled"
                                   @click="openAssignMachine(row)">
                            Pending
                        </el-button>

                        <el-tag v-else
                                type="warning"
                                effect="light"
                                round>
                            Pending
                        </el-tag>
                    </span>

                </span>

            </el-row>

            <el-divider class="checkin-divider" />
        </div>

        <!-- ASSIGN MACHINE -->
        <el-dialog v-model="dialogFormVisible"
                   :show-close="false"
                   title=""
                   :close-on-click-modal="false"
                   class="eldialog-class"
                   destroy-on-close
                   @closed="handleClose">
            <assignmachine :customer="selectedCustomer"
                           @closed="handleClick" />
        </el-dialog>

    </div>
</template>

<script setup lang="ts">
import {
        computed,
        onBeforeUnmount,
        onMounted,
        ref,
        watch
} from 'vue'

import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import {
        WarningFilled
} from '@element-plus/icons-vue'

import PanThumb from '@/components/PanThumb'
import assignmachine from '../components/assignmachine'

import { useUserStore } from '@/store/modules/user'
import { useCheckinStore } from '@/store/modules/checkin'

import { getcheckin } from '@/api/customer'

const router = useRouter()

const userStore = useUserStore()
const checkinStore = useCheckinStore()

const loading = ref(false)

const dialogFormVisible = ref(false)
const selectedCustomer = ref(null)

const checkinData = ref<any[]>([])

/* ============================================================
       FILTER
============================================================ */

const statusFilter = ref('all')

const filterOptions = [
        {
            label: 'All',
            value: 'all'
        },
        {
            label: 'Pending',
            value: 'pending'
        },
        {
            label: 'Matched',
            value: 'approved'
        }
]

const filteredCheckinData = computed(() => {

        if (statusFilter.value === 'pending') {
            return checkinData.value.filter(
                row => !row.status
            )
        }

        if (statusFilter.value === 'approved') {
            return checkinData.value.filter(
                row => Boolean(row.status)
            )
        }

        return checkinData.value
})

const emptyDescription = computed(() => {

        if (statusFilter.value === 'pending') {
            return 'No pending check-ins.'
        }

        if (statusFilter.value === 'approved') {
            return 'No approved check-ins.'
        }

        return 'No customer check-ins found.'
})

/* ============================================================
       LOAD CHECK-INS
============================================================ */

async function loadCheckIn() {

        loading.value = true

        try {

            const locationid =
                userStore.locationId

            const response =
                await getcheckin(
                    locationid
                )

            if (response.success) {
                checkinData.value =
                    response.data || []
            } else {
                checkinData.value = []
            }

        } catch (error: any) {

            ElMessage.error(
                error?.response?.data?.message ||
                error?.message ||
                'Failed to load check in'
            )

            checkinData.value = []

        } finally {
            loading.value = false
        }
}

/* ============================================================
       CUSTOMER DETAIL
============================================================ */

function openCustomer(row: any) {
        router.push({
            name: 'Profile',
            params: {
                id: row.id
            }
        })
}

/* ============================================================
       ASSIGN MACHINE
============================================================ */

function openAssignMachine(row: any) {

        selectedCustomer.value = {
            ...row
        }

        dialogFormVisible.value = true
}

async function handleClick() {
        dialogFormVisible.value = false
}

function handleClose() {

        selectedCustomer.value = null

        loadCheckIn()
}

/* ============================================================
       LIFECYCLE
============================================================ */

onMounted(() => {
        loadCheckIn()
})

onBeforeUnmount(() => {
        // Socket cleanup can be added here if required.
})

watch(
        () => checkinStore.refreshKey,
        () => {
            loadCheckIn()
        }
)

watch(
        () => userStore.locationId,
        () => {
            loadCheckIn()
        }
)
</script>



