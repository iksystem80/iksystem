<template>
    <el-row :gutter="18" class="panel-group">
        <!-- TOTAL CUSTOMERS -->
        <el-col :xs="12" :sm="12" :md="12" :lg="6" class="card-panel-col">
            <div class="stat-card stat-customers" @click="handleSetLineChartData('newVisitis')">
                <div class="stat-icon">
                    <svg-icon icon-class="peoples" class-name="stat-svg-icon" />
                </div>
                <div class="stat-content">
                    <div class="stat-label">
                        Total Customers
                    </div>
                    <count-to :start-val="
                            isFirstLoad
                                ? 0
                                : Number(dashData?.[0]?.TotalCustomers || 0)
                        " :end-val="
                            Number(
                                dashData?.[0]?.TotalCustomers || 0
                            )
                        " :duration="1500" class="stat-number" />
                </div>
                <div class="stat-decoration" />
            </div>
        </el-col>
        <!-- TODAY VISITS -->
        <el-col :xs="12" :sm="12" :md="12" :lg="6" class="card-panel-col">
            <div class="stat-card stat-visits" @click="handleSetLineChartData('messages')">
                <div class="stat-icon">
                    <svg-icon icon-class="user" class-name="stat-svg-icon" />
                </div>
                <div class="stat-content">
                    <div class="stat-label">
                        Today Visits
                    </div>
                    <count-to :start-val="
                            isFirstLoad
                                ? 0
                                : Number(dashData?.[0]?.TodayVisits || 0)
                        " :end-val="
                            Number(
                                dashData?.[0]?.TodayVisits || 0
                            )
                        " :duration="2000" class="stat-number" />
                </div>
                <div class="stat-decoration" />
            </div>
        </el-col>
        <!-- CURRENT -->
        <el-col :xs="12" :sm="12" :md="12" :lg="6" class="card-panel-col">
            <div class="stat-card stat-current" @click="handleSetLineChartData('purchases')">
                <div class="stat-icon">
                    <el-icon>
                        <User />
                    </el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-label">
                        Current
                    </div>
                    <count-to :start-val="
                            isFirstLoad
                                ? 0
                                : Number(dashData?.[0]?.CurrentCheckin || 0)
                        " :end-val="
                            Number(
                                dashData?.[0]?.CurrentCheckin || 0
                            )
                        " :duration="2000" class="stat-number" />
                </div>
                <div class="stat-decoration" />
            </div>
        </el-col>
        <!-- MATCH AMOUNT -->
        <el-col :xs="12" :sm="12" :md="12" :lg="6" class="card-panel-col">
            <div class="stat-card stat-amount" @click="handleSetLineChartData('shoppings')">
                <div class="stat-icon">
                    <el-icon>
                        <Money />
                    </el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-label">
                        Match Amount
                    </div>
                    <div class="amount-line">
                        <span class="currency-symbol">
                            $
                        </span>
                        <count-to :start-val="
                                isFirstLoad
                                    ? 0
                                    : Number(dashData?.[0]?.MatchAmount || 0)
                            " :end-val="
                                Number(
                                    dashData?.[0]?.MatchAmount || 0
                                )
                            " :duration="1500" class="stat-number" />
                    </div>
                </div>
                <div class="stat-decoration" />
            </div>
        </el-col>
    </el-row>
</template>

<script setup>
    import { ref, computed, onMounted, watch } from 'vue';
    import { ElMessage } from 'element-plus'
    import CountTo from '@/components/vue-count-to';
    import { useAppStore } from '@/store/modules/app'
    import { useUserStore } from '@/store/modules/user'
    import { getdashboard } from '@/api/dashboard'
    import { useCheckinStore } from '@/store/modules/checkin'

    const appStore = useAppStore()
    const userStore = useUserStore()
    const checkinStore = useCheckinStore()
    const device = computed(() => appStore.device)

    const dashData = ref([{
        totalcustomers: 0,
        todayvisits: 0,
        currentcheckin: 0,
        matchamount: 0
    }])

    const loading = ref(false)
    const isFirstLoad = ref(true)
    /**
     * Load employees from API
     */
    async function loadDash() {

        // console.log('get check in')
        loading.value = true

        try {
            // Get location ID from Pinia
            const locationid = userStore.locationId

            console.log('loc:' + locationid)
            const response = await getdashboard(locationid)

            console.log(response)

            dashData.value = response.data

        } catch (error) {
            // console.error('Failed to load customers:', error)

            ElMessage.error(error?.message || 'Failed to load Dashboard')
            dashData.value = null

        } finally {
            loading.value = false
        }
    }
    /**
 * Load employees when component is mounted
 */
    onMounted(() => {
        isFirstLoad.value = true
        loadDash()
    })

    watch(
        () => checkinStore.refreshKey,
        () => {
            console.log('New check-in detected on Dashboard')
            isFirstLoad.value = false
            loadDash()
        }
    )

</script>

<style lang="scss" scoped>

    .panel-group {
        margin-top: 0;
    }

    .card-panel-col {
        margin-bottom: 18px;
    }

    /* ==========================================================
    CARD
    ========================================================== */

    .stat-card {
        --accent: #409eff;
        --accent-soft: rgba(64, 158, 255, 0.10);
        position: relative;
        display: flex;
        align-items: center;
        min-height: 118px;
        padding: 20px;
        overflow: hidden;
        background: linear-gradient( 145deg, #ffffff 0%, #fbfcff 100% );
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 16px;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.035);
        cursor: pointer;
        transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }

        .stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
            border-color: color-mix( in srgb, var(--accent) 25%, transparent );
        }


    /* ==========================================================
    ICON
    ========================================================== */

    .stat-icon {
        position: relative;
        z-index: 2;
        width: 58px;
        height: 58px;
        min-width: 58px;
        min-height: 58px;
        max-width: 58px;
        max-height: 58px;
        flex: 0 0 58px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        border-radius: 15px;
        color: var(--accent);
        background: var(--accent-soft);
        transition: transform 0.25s ease, background 0.25s ease;
    }

    .stat-card:hover .stat-icon {
        transform: scale(1.05);
    }

    .stat-icon :deep(.svg-icon) {
        display: block;
        width: 28px !important;
        height: 28px !important;
        min-width: 28px;
        min-height: 28px;
        flex-shrink: 0;
    }

    .stat-icon .el-icon {
        width: 30px;
        height: 30px;
        font-size: 30px;
    }

        .stat-icon .el-icon svg {
            width: 30px;
            height: 30px;
        }


    /* ==========================================================
    CONTENT
    ========================================================== */

    .stat-content {
        position: relative;
        z-index: 2;
        min-width: 0;
        flex: 1;
    }

    .stat-label {
        margin-bottom: 7px;
        color: var(--el-text-color-secondary);
        font-size: 13px;
        font-weight: 500;
        line-height: 1.2;
    }

    .stat-number {
        color: var(--el-text-color-primary);
        font-size: 28px;
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.5px;
    }

    .amount-line {
        display: flex;
        align-items: baseline;
    }

    .currency-symbol {
        margin-right: 2px;
        color: var(--el-text-color-primary);
        font-size: 20px;
        font-weight: 650;
    }


    /* ==========================================================
    DECORATION
    ========================================================== */

    .stat-decoration {
        position: absolute;
        width: 85px;
        height: 85px;
        right: -28px;
        bottom: -35px;
        border-radius: 50%;
        background: var(--accent-soft);
        opacity: 0.8;
        pointer-events: none;
    }


    /* ==========================================================
    INDIVIDUAL CARD ACCENTS
    ========================================================== */

    .stat-customers {
        --accent: #40c9c6;
        --accent-soft: rgba(64, 201, 198, 0.11);
    }

    .stat-visits {
        --accent: #409eff;
        --accent-soft: rgba(64, 158, 255, 0.11);
    }

    .stat-current {
        --accent: #f56c6c;
        --accent-soft: rgba(245, 108, 108, 0.10);
    }

    .stat-amount {
        --accent: #67c23a;
        --accent-soft: rgba(103, 194, 58, 0.11);
    }


    /* ==========================================================
    TABLET
    ========================================================== */

    @media (max-width: 991px) {

        .stat-card {
            min-height: 108px;
            padding: 17px;
        }

        .stat-icon {
            width: 52px;
            height: 52px;
            min-width: 52px;
            min-height: 52px;
            max-width: 52px;
            max-height: 52px;
            flex-basis: 52px;
            margin-right: 13px;
        }

        .stat-number {
            font-size: 25px;
        }
    }


    /* ==========================================================
    MOBILE
    ========================================================== */

    @media (max-width: 550px) {

        .panel-group {
            margin-left: -5px !important;
            margin-right: -5px !important;
        }

        .card-panel-col {
            padding-left: 5px !important;
            padding-right: 5px !important;
            margin-bottom: 10px;
        }

        .stat-card {
            min-height: 100px;
            padding: 12px;
            border-radius: 13px;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
        }

        .stat-icon {
            width: 36px;
            height: 36px;
            min-width: 36px;
            min-height: 36px;
            max-width: 36px;
            max-height: 36px;
            flex-basis: 36px;
            margin: 0 0 9px 0;
            border-radius: 10px;
        }

            .stat-icon :deep(.svg-icon) {
                width: 19px !important;
                height: 19px !important;
                min-width: 19px;
                min-height: 19px;
            }

            .stat-icon .el-icon {
                width: 20px;
                height: 20px;
                font-size: 20px;
            }

                .stat-icon .el-icon svg {
                    width: 20px;
                    height: 20px;
                }

        .stat-label {
            margin-bottom: 5px;
            font-size: 11px;
        }

        .stat-number {
            font-size: 21px;
        }

        .currency-symbol {
            font-size: 16px;
        }

        .stat-decoration {
            width: 60px;
            height: 60px;
            right: -25px;
            bottom: -28px;
        }
    }
</style>
