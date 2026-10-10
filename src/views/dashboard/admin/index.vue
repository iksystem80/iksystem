<template>
  <div class="dashboard-editor-container">
    <!-- Dashboard Statistics -->
    <PanelGroup @handleSetLineChartData="handleSetLineChartData" />
    <!-- Current Customers -->
    <div v-if="canViewCustomers" class="dashboard-section">
      <CurrentCustomer />
    </div>
    <!-- No Customer Permission -->
    <el-alert v-else title="Customer information is not available for your account." type="info" :closable="false" show-icon class="permission-alert" />
    <!-- Charts -->
    <el-row :gutter="32" v-if="userStore.isOwner">
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
import { ref, computed, onMounted } from 'vue';
import PanelGroup from '../components/panelgroup';
import CurrentCustomer from '../../components/currentcustomer';
import PieChart from '../components/piechart';
import BarChart from '../components/barchart';
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
  return (userStore.permissions || []).includes('customers.read');
});

function handleSetLineChartData(type) {
  // if (lineChartDataSource[type]) {
  //   lineChartData.value = lineChartDataSource[type];
  // }
}

onMounted(async() => {
  if (userStore.isEmployee) {
    try {
      const response = await getClockStatus(userStore.userId);

      const isClockedIn = response.data?.clockedIn === true;

      userStore.setClockedIn(isClockedIn);

      // console.log('isEmployee: ' + userStore.isEmployee);
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

