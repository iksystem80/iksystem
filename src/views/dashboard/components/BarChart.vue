<template>
  <div :class="className" :style="{ height: height, width: width }" />
</template>

<script>
import * as echarts from 'echarts';
import { defineComponent, shallowRef } from 'vue';
import macaronsTheme from '@/styles/echarts/theme/macarons'; // echarts theme
import resize from './mixins/resize';
import { getMatchPointsByEmployee } from '@/api/dashboard';
import { useUserStore } from '@/store/modules/user';

const animationDuration = 6000;

export default defineComponent({
  mixins: [resize],

  props: {
    className: {
      type: String,
      default: 'chart'
    },

    width: {
      type: String,
      default: '100%'
    },

    height: {
      type: String,
      default: '300px'
    }
  },

  data() {
    return {
      chart: null,

      dates: [],
      employees: [],

      startDate: null,
      endDate: null
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.initChart();
    });
  },

  beforeUnmount() {
    if (!this.chart) {
      return;
    }

    this.chart.dispose();
    this.chart = null;
  },

  methods: {

    // ============================================================
    // INITIALIZE CHART
    // ============================================================

    async initChart() {
      this.chart = shallowRef(
        echarts.init(
          this.$el,
          macaronsTheme
        )
      );

      await this.loadChartData();
    },

    // ============================================================
    // LOAD REAL DATA FROM API
    // ============================================================

    async loadChartData() {
      try {
        const userStore =
              useUserStore();

        const locationId =
              userStore.locationId;

        if (!locationId) {
          console.warn(
            'Bar chart: locationId not found.'
          );

          this.setChartOption();
          return;
        }

        const response =
              await getMatchPointsByEmployee(
                locationId
              );

        const data =
              response?.data || {};

        this.dates =
              data.dates || [];

        this.employees =
              data.employees || [];

        this.startDate =
              data.startDate || null;

        this.endDate =
              data.endDate || null;

        this.setChartOption();
      } catch (error) {
        console.error(
          'Error loading match point chart:',
          error
        );

        this.dates = [];
        this.employees = [];

        this.setChartOption();
      }
    },

    // ============================================================
    // BUILD CHART
    // ============================================================

    setChartOption() {
      // ----------------------------------------------------------
      // X AXIS
      //
      // API:
      // [
      //   { date: '2026-09-17', label: 'Thu' },
      //   { date: '2026-09-18', label: 'Fri' },
      //   ...
      // ]
      // ----------------------------------------------------------

      const xAxisData =
            this.dates.map(
              item => item.label
            );

      // ----------------------------------------------------------
      // EMPLOYEE SERIES
      //
      // API:
      //
      // employees: [
      //   {
      //      id: 1,
      //      name: 'Employee A',
      //      data: [20,40,0,60,20,40,80]
      //   }
      // ]
      //
      // Each employee replaces:
      // pageA
      // pageB
      // pageC
      // ----------------------------------------------------------

      const employeeSeries =
            this.employees.map(
              employee => ({
                name:
                  employee.name,

                type:
                  'bar',

                stack:
                  'vistors',

                barWidth:
                  '60%',

                data:
                  employee.data,

                animationDuration
              })
            );

      // ==========================================================
      // ORIGINAL CHART LAYOUT
      // ==========================================================

      this.chart.setOption({
        tooltip: {
          trigger: 'axis',

          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效
            type: 'shadow'
            // 默认为直线，可选为：'line' | 'shadow'
          },

          valueFormatter: value =>
            `${Number(value || 0).toLocaleString()} pts`
        },

        grid: {
          top: 10,
          left: '2%',
          right: '2%',
          bottom: '3%',
          containLabel: true
        },

        xAxis: [{
          type: 'category',

          data:
                xAxisData,

          axisTick: {
            alignWithLabel: true
          }
        }],

        yAxis: [{
          type: 'value',

          axisTick: {
            show: false
          }
        }],

        series:
              employeeSeries

      }, true);
    }
  }
});
</script>
