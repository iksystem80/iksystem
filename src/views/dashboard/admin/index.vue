<template>
  <div class="dashboard-editor-container">
    <!-- Current Employee Sessions -->
    <CurrentEmployeeSessions v-if="canViewCurrentEmployeeSessions" />

    <!-- Dashboard Statistics -->
    <PanelGroup @handleSetLineChartData="handleSetLineChartData" />
    <!-- Current Customers -->
    <div v-if="canViewCustomers" class="dashboard-section">
      <CurrentCustomer />
    </div>
    <!-- No Customer Permission -->
    <el-alert v-else title="Customer information is not available for your account." type="info" :closable="false" show-icon class="permission-alert" />
    <!-- Charts -->
    <el-row :gutter="32" v-if="userStore.isOwnerOrAdmin">
      <el-col :xs="24" :sm="24" :lg="8">
        <div class="chart-wrapper">
          <NetProfitChart />
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
import { computed, onMounted, defineAsyncComponent } from 'vue';
import PanelGroup from '../components/panelgroup';
import CurrentEmployeeSessions from '../components/currentemployeesessions';
import CurrentCustomer from '../../components/currentcustomer';
// Load chart code separately so it does not block the dashboard's main bundle.
const PieChart = defineAsyncComponent(() => import('../components/piechart.vue'));
const BarChart = defineAsyncComponent(() => import('../components/barchart.vue'));
const NetProfitChart = defineAsyncComponent(() => import('../components/netprofitchart.vue'));
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { getClockStatus } from '@/api/employeesession';

const userStore = useUserStore();
const router = useRouter();

const canViewCustomers = computed(() => {
  const roleName = String(userStore.roleName || '').toLowerCase();
  //console.log(roleName);
  if (roleName === 'owner' || roleName === 'admin') {
    return true;
  }
  return (userStore.permissions || []).includes('customers');
});

const canViewCurrentEmployeeSessions = computed(() => {
  const roleName = String(userStore.roleName || '').trim().toLowerCase();
  return roleName === 'owner' || roleName === 'admin';
});

function handleSetLineChartData(type) {
  // if (lineChartDataSource[type]) {
  //   lineChartData.value = lineChartDataSource[type];
  // }
}

onMounted(async () => {
  console.log('role: ' + userStore.isSystemAdmin);
  if (userStore.isSystemAdmin) {
    router.push('/system/companies');
  }

  if (userStore.isEmployee) {
    try {
      const response = await getClockStatus(userStore.userId);

      const isClockedIn = response.data?.clockedIn === true;

      userStore.setClockedIn(isClockedIn);
      // console.log('isClockedIn: ' + userStore.isClockedIn);

      if (!isClockedIn) {
        router.push('/clock/index');
      }
    } catch (error) {
      console.error('Unable to check clock status:', error);
    }
  }
});
</script>

