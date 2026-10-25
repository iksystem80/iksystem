<template>
  <div :class="className" :style="{ height: height, width: width }" />
</template>

<script>
import * as echarts from 'echarts';
import { defineComponent, shallowRef } from 'vue';
import macaronsTheme from '@/styles/echarts/theme/macarons';
import resize from './mixins/resize';
import request from '@/utils/request';
import { useUserStore } from '@/store/modules/user';

const FILTERS = [
    { key: 'last-session', label: 'Last Session' },
    { key: 'this-week', label: 'This Week' },
    { key: 'this-month', label: 'This Month' },
    { key: 'last-month', label: 'Last Month' }
];

export default defineComponent({
    mixins: [resize],
    props: {
      className: { type: String, default: 'chart' },
      width: { type: String, default: '100%' },
      height: { type: String, default: '300px' }
    },
    data() {
      return {
        chart: null,
        activeRange: 'last-session',
        machineTypes: [],
        loading: false,
        stopLocationWatch: null
      };
    },
    mounted() {
      this.$nextTick(() => {
        this.initChart();
        this.loadHoldingData();
        this.stopLocationWatch = this.$watch(
          () => useUserStore().locationId,
          () => this.loadHoldingData()
        );
      });
    },
    beforeUnmount() {
      if (typeof this.stopLocationWatch === 'function') this.stopLocationWatch();
      if (!this.chart) return;
      this.chart.dispose();
      this.chart = null;
    },
    methods: {
      money(value) {
        return Number(value || 0).toLocaleString('en-US', {
          style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2
        });
      },
      percent(value) {
        return `${Number(value || 0).toFixed(2)}%`;
      },
      filterGraphic() {
        const buttonWidth = 67;
        const gap = 3;
        const height = 22;
        const totalWidth = FILTERS.length * buttonWidth + (FILTERS.length - 1) * gap;
        return [{
          type: 'group', left: 'center', top: 2, bounding: 'raw',
          children: FILTERS.flatMap((filter, index) => {
            const selected = filter.key === this.activeRange;
            const x = index * (buttonWidth + gap) - totalWidth / 2;
            return [
              {
                type: 'rect',
                shape: { x, y: 0, width: buttonWidth, height, r: 5 },
                style: {
                  fill: selected ? '#887baf' : 'rgba(136,123,175,.08)',
                  stroke: selected ? '#887baf' : 'rgba(136,123,175,.28)',
                  lineWidth: 1
                },
                onclick: () => this.changeRange(filter.key)
              },
              {
                type: 'text',
                style: {
                  x: x + buttonWidth / 2, y: height / 2, text: filter.label,
                  fill: selected ? '#ffffff' : '#6f6f78', font: '10px sans-serif',
                  align: 'center', verticalAlign: 'middle'
                },
                onclick: () => this.changeRange(filter.key)
              }
            ];
          })
        }];
      },
      async changeRange(range) {
        if (this.activeRange === range || this.loading) return;
        this.activeRange = range;
        this.updateChart();
        await this.loadHoldingData();
      },
      async loadHoldingData() {
        const locationId = Number(useUserStore().locationId);
        if (!locationId || this.loading) return;
        try {
          this.loading = true;
          this.chart?.showLoading('default', { text: 'Loading holding...' });
          const response = await request({
            url: '/dashboard/machine-type-holding',
            method: 'get',
            params: { locationid: locationId, range: this.activeRange }
          });
          this.machineTypes = Array.isArray(response?.data?.machineTypes)
            ? response.data.machineTypes
            : [];
        } catch (error) {
          console.error('Unable to load machine type holding:', error);
          this.machineTypes = [];
        } finally {
          this.loading = false;
          this.chart?.hideLoading();
          this.updateChart();
        }
      },
      initChart() {
        this.chart = shallowRef(echarts.init(this.$el, macaronsTheme));
        this.updateChart();
      },
      updateChart() {
        if (!this.chart) return;

        const data = (Array.isArray(this.machineTypes) ? this.machineTypes : []).map(row => ({
          name: row.machineType || 'Unassigned',
          value: Math.max(Number(row.holdAmount || 0), 0),
          holdAmount: Number(row.holdAmount || 0),
          holdPercentage: Number(row.holdPercentage || 0),
          totalIn: Number(row.totalIn || 0),
          totalOut: Number(row.totalOut || 0),
          machineCount: Number(row.machineCount || 0)
        }));

        this.chart.setOption({
          graphic: this.filterGraphic(),
          tooltip: {
            trigger: 'item',
            formatter: params => {
              const row = params.data || {};
              return [
                `<strong>${params.name}</strong>`,
                `Holding: ${this.money(row.holdAmount)}`,
                `Hold %: ${this.percent(row.holdPercentage)}`,
                `IN: ${this.money(row.totalIn)}`,
                `OUT: ${this.money(row.totalOut)}`,
                `Machines: ${Number(row.machineCount || 0)}`
              ].join('<br/>');
            }
          },
          legend: { left: 'center', bottom: '10', data: data.map(item => item.name) },
          series: [{
            name: 'Machine Type Holding',
            type: 'pie',
            roseType: 'radius',
            radius: [15, 88],
            center: ['50%', '43%'],
            data,
            label: {
              formatter: params => params.name
            },
            animationEasing: 'cubicInOut',
            animationDuration: 900
          }]
        }, true);

        if (!data.length) {
          this.chart.setOption({
            graphic: [
              ...this.filterGraphic(),
              {
                type: 'text', left: 'center', top: '45%',
                style: { text: 'No completed reading data', fill: '#909399', font: '12px sans-serif' }
              }
            ]
          });
        }
      }
    }
});
</script>
