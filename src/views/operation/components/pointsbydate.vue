<template>
    <div class="irfan-operation-components-pointsbydate">
        <!-- FILTERS -->
        <el-card shadow="never" class="filter-card">
            <el-row :gutter="15">
                <el-col :xs="24" :sm="8" :md="6">
                    <div class="filter-label">Date</div>
                    <el-date-picker v-model="selectedDate" type="date" value-format="YYYY-MM-DD" format="MMM DD, YYYY" placeholder="Select date" style="width: 100%" />
                </el-col>
                <el-col :xs="24" :sm="8" :md="6">
                    <div class="filter-label">Employee</div>
                    <el-select v-model="selectedEmployee" clearable placeholder="All employees" style="width: 100%">
                        <template #prefix>
                            <el-icon><User /></el-icon>
                        </template>
                        <el-option v-for="item in employees"
                                   :key="item.id"
                                   :label="item.name"
                                   :value="item.id" />
                    </el-select>
                </el-col>
                <el-col :xs="24" :sm="8" :md="12">
                    <div class="filter-label">Search</div>
                    <el-input v-model="search"
                              clearable
                              placeholder="Customer or machine...">
                        <template #prefix>
                            <el-icon><Search /></el-icon>
                        </template>
                    </el-input>
                </el-col>

            </el-row>
        </el-card>


        <!-- Selected employee banner: hidden for All employees. -->
        <el-card v-if="selectedEmployeeDetails" shadow="never" class="employee-banner">
            <div class="employee-header">
                <div class="employee-profile">
                    <el-avatar :size="56" :src="selectedEmployeeDetails.avatar">{{ getInitial(selectedEmployeeDetails.name) }}</el-avatar>
                    <div class="employee-profile-text">
                        <h2>{{ selectedEmployeeDetails.name }}</h2>
                        <div class="employee-period">Point activity for {{ displayDate }}</div>
                    </div>
                </div>
            </div>
        </el-card>

        <!-- SUMMARY -->
        <el-row :gutter="15" class="point-summary-row">
            <el-col :xs="24" :sm="8" class="point-summary-col">
                <el-card shadow="never" class="point-stat-card stat-entries">
                    <div class="point-stat-layout">
                        <div class="point-stat-icon"><el-icon><Tickets /></el-icon></div>
                        <div class="point-stat-content">
                            <el-statistic title="Point Entries" :value="filteredEntries.length" />
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :xs="24" :sm="8" class="point-summary-col">
                <el-card shadow="never" class="point-stat-card stat-points">
                    <div class="point-stat-layout">
                        <div class="point-stat-icon"><el-icon><Coin /></el-icon></div>
                        <div class="point-stat-content">
                            <el-statistic title="Points Given" :value="totalPoints" />
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :xs="24" :sm="8" class="point-summary-col">
                <el-card shadow="never" class="point-stat-card stat-employees">
                    <div class="point-stat-layout">
                        <div class="point-stat-icon"><el-icon><User /></el-icon></div>
                        <div class="point-stat-content">
                            <el-statistic title="Employees" :value="employeeCount" />
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>


        <!-- DATE TITLE -->
        <div class="section-heading">
            <div>
                <h3>Point Entries</h3>
                <span>{{ displayDate }}</span>
            </div>

            <el-button :loading="loading" @click="loadEntries">
                <el-icon><Refresh /></el-icon>
            </el-button>
        </div>


        <!-- LOADING -->
        <el-skeleton v-if="loading"
                     :rows="8"
                     animated />


        <!-- EMPTY -->
        <el-empty v-else-if="filteredEntries.length === 0"
                  description="No point entries found." />


        <!-- ENTRIES -->
        <el-row v-else
                :gutter="15">
            <el-col v-for="item in filteredEntries"
                    :key="item.id"
                    :xs="24"
                    :sm="12"
                    :md="8"
                    :lg="6"
                    :xl="6"
                    class="entry-column">

                <el-card shadow="hover"
                         class="entry-card">

                    <!-- CUSTOMER -->
                    <div class="entry-header">

                        <div>
                            <div class="customer-name">
                                {{ item.fullName }}
                            </div>

                            <div class="entry-meta">
                                {{ formatTime(item.dateAssign) }}

                                <span v-if="item.machineNumber">
                                    · Machine {{ item.machineNumber }}
                                </span>
                            </div>
                        </div>

                        <el-tag type="warning"
                                effect="dark"
                                round>
                            +{{ item.points }} PTS
                        </el-tag>

                    </div>


                    <!-- EMPLOYEE -->
                    <div class="employee-line">
                        Given by

                        <el-tag type="success"
                                effect="light"
                                size="small"
                                round>
                            {{ item.employeeName || 'Unknown' }}
                        </el-tag>
                    </div>


                    <!-- IMAGES -->
                    <el-row :gutter="10">
                        <el-col :span="12">
                            <div class="image-label">
                                Check-In Photo
                            </div>
                            <el-image :src="item.checkinPhoto ? item.checkinPhoto : item.avatar"
                                      fit="cover"
                                      class="point-image"
                                      :preview-src-list="item.checkinPhoto? [item.checkinPhoto]: []"
                                      preview-teleported>
                                <template #error>
                                    <div class="image-empty">
                                        No photo
                                    </div>
                                </template>
                            </el-image>
                        </el-col>
                        <el-col :span="12">
                            <div class="image-label">
                                Point Photo
                            </div>

                            <el-image :src="item.pointPhoto"
                                      fit="cover"
                                      class="point-image"
                                      :preview-src-list="item.pointPhoto? [item.pointPhoto]: []"
                                      preview-teleported>
                                <template #error>
                                    <div class="image-empty">
                                        No photo
                                    </div>
                                </template>
                            </el-image>
                        </el-col>
                    </el-row>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
    import {
        ref,
        computed,
        watch
    } from 'vue'

    import {
        Search,
        User,
        Refresh,
        Tickets,
        Coin
    } from '@element-plus/icons-vue'

    import { ElMessage } from 'element-plus'

    import {
        getPointWatchingEmployees,
        getPointsByDate
    } from '@/api/pointwatching'


    const props = defineProps({
        locationId: {
            type: [Number, String],
            required: true
        }
    })


    const today = () => {
        const date = new Date()

        const year = date.getFullYear()
        const month = String(
            date.getMonth() + 1
        ).padStart(2, '0')

        const day = String(
            date.getDate()
        ).padStart(2, '0')

        return `${year}-${month}-${day}`
    }


    const selectedDate = ref(today())
    const selectedEmployee = ref(null)
    const search = ref('')

    const employees = ref([])
    const entries = ref([])

    const selectedEmployeeDetails = computed(() => selectedEmployee.value == null ? null : employees.value.find(item => String(item.id) === String(selectedEmployee.value)) || null)
    const getInitial = value => String(value || '?').trim().charAt(0).toUpperCase()

    const loading = ref(false)


    const loadEmployees = async () => {

        if (!props.locationId) return

        try {

            const response =
                await getPointWatchingEmployees(
                    props.locationId
                )

            employees.value =
                response.data ?? []

        } catch (error) {

            ElMessage.error(
                error.response?.data?.message ||
                'Unable to load employees.'
            )
        }
    }


    const loadEntries = async () => {

        if (
            !props.locationId ||
            !selectedDate.value
        ) {
            return
        }

        try {

            loading.value = true

            const response =
                await getPointsByDate(
                    props.locationId,
                    selectedDate.value
                )

            entries.value =
                response.data ?? []

        } catch (error) {

            ElMessage.error(
                error.response?.data?.message ||
                'Unable to load point entries.'
            )

        } finally {

            loading.value = false
        }
    }


    const filteredEntries = computed(() => {

        let data = entries.value

        if (selectedEmployee.value) {

            data = data.filter(
                item =>
                    Number(item.employeeId) ===
                    Number(selectedEmployee.value)
            )
        }

        const value =
            search.value
                .trim()
                .toLowerCase()

        if (value) {

            data = data.filter(item => {

                const customer =
                    item.fullName
                        ?.toLowerCase() ?? ''

                const machine =
                    String(
                        item.machineNumber ?? ''
                    ).toLowerCase()

                return (
                    customer.includes(value) ||
                    machine.includes(value)
                )
            })
        }

        return data
    })


    const totalPoints = computed(() => {

        return filteredEntries.value.reduce(
            (total, item) =>
                total + Number(item.points || 0),
            0
        )
    })


    const employeeCount = computed(() => {

        const ids = new Set(
            filteredEntries.value
                .map(item => item.employeeId)
                .filter(Boolean)
        )

        return ids.size
    })


    const displayDate = computed(() => {

        if (!selectedDate.value) return ''

        return new Date(
            `${selectedDate.value}T12:00:00`
        ).toLocaleDateString(
            'en-US',
            {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            }
        )
    })


    const formatTime = value => {

        if (!value) return ''

        return new Date(value)
            .toLocaleTimeString(
                'en-US',
                {
                    hour: 'numeric',
                    minute: '2-digit'
                }
            )
    }


    watch(
        () => props.locationId,
        async value => {

            if (!value) return

            await loadEmployees()
            await loadEntries()
        },
        {
            immediate: true
        }
    )


    watch(
        selectedDate,
        () => {
            loadEntries()
        }
    )
</script>


<style scoped>
    /* Match the dark employee profile banner used in Points by Employee. */
    .employee-banner {
        background: linear-gradient(135deg, #1e2447, #11162f);
        color: #fff;
        border-color: transparent;
        border-radius: 14px;
        margin: 16px 0;
    }

        .employee-banner :deep(.el-card__body) {
            padding: 18px 20px;
        }

    .employee-header, .employee-profile {
        display: flex;
        align-items: center;
    }

    .employee-header {
        justify-content: space-between;
        gap: 16px;
    }

    .employee-profile {
        gap: 16px;
        min-width: 0;
    }

        .employee-profile .el-avatar {
            flex-shrink: 0;
        }

    .employee-profile-text {
        min-width: 0;
    }

        .employee-profile-text h2 {
            color: #fff;
            font-size: 18px;
            line-height: 1.3;
            margin: 0;
            overflow-wrap: anywhere;
        }

    .employee-period {
        color: #c7cbea;
        font-size: 12px;
        margin-top: 4px;
    }

    @media (max-width: 420px) {
        .employee-banner :deep(.el-card__body) {
            padding: 16px;
        }

        .employee-profile {
            gap: 12px;
        }
    }

    /* Compact summary tiles: same dimensions as Employee Sessions. */
    .point-summary-row {
        display: flex;
        flex-wrap: wrap;
        row-gap: 15px;
        margin-bottom: 20px;
    }

    .point-summary-col {
        min-width: 0;
        margin-bottom: 0;
    }

    .point-stat-card {
        --accent: #409eff;
        --accent-soft: rgba(64, 158, 255, .11);
        position: relative;
        overflow: hidden !important;
        border-radius: 14px;
        background: var(--el-bg-color, #fff);
        border: 1px solid var(--el-border-color-lighter);
        transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
    }

        .point-stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 28px rgba(0, 0, 0, .08);
            border-color: color-mix(in srgb, var(--accent) 25%, transparent);
        }

        .point-stat-card :deep(.el-card__body) {
            padding: 16px 12px !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: hidden !important;
        }

    .point-stat-layout {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
    }

    .point-stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
        margin-right: 0;
        border-radius: 12px;
        color: var(--accent);
        background: var(--accent-soft);
        transition: transform .25s ease;
    }

    .point-stat-card:hover .point-stat-icon {
        transform: scale(1.05);
    }

    .point-stat-icon .el-icon, .point-stat-icon .el-icon svg {
        width: 24px;
        height: 24px;
        font-size: 23px;
    }

    .point-stat-content {
        min-width: 0;
        flex: 1;
    }

        .point-stat-content :deep(.el-statistic__head) {
            margin-bottom: 5px;
            color: var(--el-text-color-secondary);
            font-size: 12px !important;
            font-weight: 500;
            line-height: 1.3;
        }

        .point-stat-content :deep(.el-statistic__content) {
            color: var(--el-text-color-primary);
            font-size: 24px !important;
            font-weight: 700;
            line-height: 1.1;
        }

    .stat-entries {
        --accent: #40c9c6;
        --accent-soft: rgba(64, 201, 198, .11);
    }

    .stat-points {
        --accent: #409eff;
        --accent-soft: rgba(64, 158, 255, .11);
    }

    .stat-employees {
        --accent: #67c23a;
        --accent-soft: rgba(103, 194, 58, .11);
    }

    @media (max-width: 550px) {
        .point-stat-card :deep(.el-card__body) {
            padding: 12px 9px !important;
        }

        .point-stat-layout {
            gap: 8px;
        }

        .point-stat-icon {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
            border-radius: 10px;
        }

            .point-stat-icon .el-icon, .point-stat-icon .el-icon svg {
                width: 20px;
                height: 20px;
                font-size: 20px;
            }

        .point-stat-content :deep(.el-statistic__head) {
            font-size: 11px !important;
        }

        .point-stat-content :deep(.el-statistic__content) {
            font-size: 21px !important;
        }
    }
</style>
