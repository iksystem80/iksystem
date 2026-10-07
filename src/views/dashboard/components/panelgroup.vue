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
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import CountTo from '@/components/vue-count-to';
import { getdashboard } from '@/api/dashboard';
import { useCheckinStore } from '@/store/modules/checkin';

const userStore = useUserStore();
const checkinStore = useCheckinStore();
const dashData = ref([{
  totalcustomers: 0,
  todayvisits: 0,
  currentcheckin: 0,
  matchamount: 0
}]);

const loading = ref(false);
const isFirstLoad = ref(true);
/**
     * Load employees from API
     */
async function loadDash() {
  // console.log('get check in')
  loading.value = true;

  try {
    // Get location ID from Pinia
    const locationid = userStore.locationId;

    console.log('loc:' + locationid);
    const response = await getdashboard(locationid);

    console.log(response);

    dashData.value = response.data;
  } catch (error) {
    // console.error('Failed to load customers:', error)

    ElMessage.error(error?.message || 'Failed to load Dashboard');
    dashData.value = null;
  } finally {
    loading.value = false;
  }
}
/**
 * Load employees when component is mounted
 */
onMounted(() => {
  isFirstLoad.value = true;
  loadDash();
});

watch(
  () => checkinStore.refreshKey,
  () => {
    console.log('New check-in detected on Dashboard');
    isFirstLoad.value = false;
    loadDash();
  }
);

</script>

