<template>
  <el-row :gutter="18" class="panel-group">
    <!-- TOTAL CUSTOMERS -->
    <el-col :xs="12" :sm="12" :md="12" :lg="6" class="card-panel-col">
      <div class="stat-card stat-customers" @click="openCustomerList">
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
      <div class="stat-card stat-visits" @click="openDetails('visits')">
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
      <div class="stat-card stat-current" @click="openDetails('current')">
        <div class="stat-icon">
          <!--<el-icon>
            <User />
          </el-icon>-->
          <UserRoundCheck :stroke-width="2.5"/>
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
      <div class="stat-card stat-amount" @click="openDetails('matches')">
        <div class="stat-icon">
          <!--<el-icon>
    <Money />
  </el-icon>-->
          <DollarSign :stroke-width="2.5"/>
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

  <el-dialog v-model="detailsVisible"
             :title="detailsTitle"
             width="min(880px, 96vw)"
             append-to-body
             destroy-on-close>
    <div v-loading="detailsLoading" class="dashboard-card-details">
      <div v-if="detailsType === 'matches'" class="dashboard-details-summary">
        <span>Regular + Extra Match · Last 24 hours</span>
        <strong>${{ formatAmount(detailsTotal) }}</strong>
      </div>

      <el-empty v-if="!detailsLoading && detailsRows.length === 0"
                description="No records found for this period." />

      <div v-for="item in detailsRows" :key="item.checkinId" class="dashboard-detail-item">
        <el-avatar :size="42" :src="item.avatar">
          {{ (item.customerName || '?').charAt(0) }}
        </el-avatar>
        <div class="dashboard-detail-main">
          <div class="dashboard-detail-name">{{ item.customerName }}</div>
          <div class="dashboard-detail-meta">
            {{ formatDetailDate(item.checkinDate) }}
            <template v-if="detailsType === 'matches'">
              <span v-if="item.machineNumber"> · Machine {{ item.machineNumber }}</span>
              <span v-if="item.employeeName"> · {{ item.employeeName }}</span>
            </template>
            <template v-else>
              · {{ item.isCheckOut ? 'Checked out' : 'Currently checked in' }}
            </template>
          </div>
          <div v-if="detailsType === 'matches'" class="dashboard-detail-breakdown">
            <span>Regular ${{ formatAmount(item.regularAmount) }}</span>
            <span>Extra ${{ formatAmount(item.extraAmount) }}</span>
          </div>
        </div>
        <div v-if="detailsType === 'matches'" class="dashboard-detail-total">
          ${{ formatAmount(item.totalAmount) }}
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import CountTo from '@/components/vue-count-to';
import { getdashboard } from '@/api/dashboard';
import request from '@/utils/request';
import { useRouter } from 'vue-router';
import { useCheckinStore } from '@/store/modules/checkin';
import { UserRoundCheck, DollarSign } from '@lucide/vue'

const userStore = useUserStore();
const router = useRouter();
const checkinStore = useCheckinStore();
const detailsVisible = ref(false);
const detailsLoading = ref(false);
const detailsType = ref('visits');
const detailsRows = ref([]);
const detailsTotal = computed(() => detailsRows.value.reduce(
  (sum, row) => sum + Number(row.totalAmount || 0), 0
));
const detailsTitle = computed(() => ({
  visits: 'Today Visits',
  current: 'Current Customers',
  matches: 'Match Amount Details'
}[detailsType.value] || 'Dashboard Details'));

function openCustomerList() {
  router.push('/customer/index');
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDetailDate(value) {
  return value ? String(value) : '';
}

let detailsRequestNumber = 0;
async function openDetails(type) {
  detailsType.value = type;
  detailsRows.value = [];
  detailsVisible.value = true;
  detailsLoading.value = true;
  const requestNumber = ++detailsRequestNumber;

  try {
    const response = await request({
      url: '/dashboard/card-details',
      method: 'get',
      params: { locationid: userStore.locationId, type }
    });
    if (requestNumber === detailsRequestNumber) {
      detailsRows.value = response.data || [];
    }
  } catch (error) {
    if (requestNumber === detailsRequestNumber) {
      ElMessage.error(error?.response?.data?.message || error?.message || 'Unable to load dashboard details.');
    }
  } finally {
    if (requestNumber === detailsRequestNumber) detailsLoading.value = false;
  }
}
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

    //console.log('loc:' + locationid);
    const response = await getdashboard(locationid);

    //console.log(response);

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
    //console.log('New check-in detected on Dashboard');
    isFirstLoad.value = false;
    loadDash();
  }
);

</script>

<style scoped>
.dashboard-card-details {
  min-height: 70px;
}
.dashboard-details-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}
.dashboard-details-summary strong {
  color: var(--el-text-color-primary);
}
.dashboard-detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 2px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dashboard-detail-main {
  flex: 1;
  min-width: 0;
}
.dashboard-detail-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dashboard-detail-meta,
.dashboard-detail-breakdown {
  margin-top: 4px;
  font-size: var(--app-font-small, 12px);
  color: var(--el-text-color-secondary);
}
.dashboard-detail-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.dashboard-detail-total {
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
@media (max-width: 600px) {
  .dashboard-detail-item {
    align-items: flex-start;
  }
  .dashboard-detail-total {
    align-self: center;
  }
}
</style>

