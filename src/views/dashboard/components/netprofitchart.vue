<template>
  <div :class="className" :style="{ height: height, width: width }" />
</template>

<script>
import * as echarts from 'echarts';
import { defineComponent, shallowRef } from 'vue';
import macaronsTheme from '@/styles/echarts/theme/macarons';
import resize from './mixins/resize';
import { getWeeklyReportDay, getWeeklyReportWeek } from '@/api/weeklyreport';
import { useUserStore } from '@/store/modules/user';

const FILTERS = [
  { key: 'current', label: 'This Week' },
  { key: 'last', label: 'Last Week' }
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
      activeRange: 'current',
      values: [0, 0, 0, 0, 0, 0, 0],
      dates: [],
      loading: false,
      stopLocationWatch: null
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.initChart();
      this.loadNetProfit();

      this.stopLocationWatch = this.$watch(
        () => useUserStore().locationId,
        () => this.loadNetProfit()
      );
    });
  },

  beforeUnmount() {
    if (typeof this.stopLocationWatch === 'function') {
      this.stopLocationWatch();
    }

    if (!this.chart) return;
    this.chart.dispose();
    this.chart = null;
  },

  methods: {
    pad(value) {
      return String(value).padStart(2, '0');
    },

    dateKey(date) {
      return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
    },

    mondayOf(date) {
      const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const weekday = result.getDay();
      const delta = weekday === 0 ? -6 : 1 - weekday;
      result.setDate(result.getDate() + delta);
      return result;
    },

    plusDays(date, days) {
      const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      result.setDate(result.getDate() + days);
      return result;
    },

    selectedWeek() {
      const currentMonday = this.mondayOf(new Date());
      const start = this.activeRange === 'last'
        ? this.plusDays(currentMonday, -7)
        : currentMonday;

      return {
        startDate: this.dateKey(start),
        endDate: this.dateKey(this.plusDays(start, 6))
      };
    },

    money(value) {
      return Number(value || 0).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    filterGraphic() {
      const buttonWidth = 76;
      const gap = 4;
      const buttonHeight = 22;
      const totalWidth = FILTERS.length * buttonWidth + (FILTERS.length - 1) * gap;

      return [{
        type: 'group',
        left: 'center',
        top: 2,
        bounding: 'raw',
        children: FILTERS.flatMap((filter, index) => {
          const selected = filter.key === this.activeRange;
          const x = index * (buttonWidth + gap) - totalWidth / 2;

          return [
            {
              type: 'rect',
              shape: { x, y: 0, width: buttonWidth, height: buttonHeight, r: 5 },
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
                x: x + buttonWidth / 2,
                y: buttonHeight / 2,
                text: filter.label,
                fill: selected ? '#ffffff' : '#6f6f78',
                font: '10px sans-serif',
                align: 'center',
                verticalAlign: 'middle'
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
      await this.loadNetProfit();
    },

    async loadNetProfit() {
      const locationId = Number(useUserStore().locationId);
      if (!locationId || this.loading) return;

      const { startDate, endDate } = this.selectedWeek();

      try {
        this.loading = true;
        this.chart?.showLoading('default', { text: 'Loading net profit...' });

        const weekResponse = await getWeeklyReportWeek({
          locationid: locationId,
          startdate: startDate,
          enddate: endDate
        });

        const days = Array.isArray(weekResponse?.data?.days)
          ? weekResponse.data.days
          : [];

        const dayResults = await Promise.all(
          days.map(async day => {
            const sessions = Array.isArray(day?.sessions) ? day.sessions : [];

            if (!sessions.length) {
              return {
                date: String(day?.date || ''),
                netProfit: 0
              };
            }

            const reports = await Promise.all(
              sessions.map(async session => {
                const response = await getWeeklyReportDay({
                  locationid: locationId,
                  sessionid: Number(session.id)
                });

                return response?.data || null;
              })
            );

            const netProfit = reports.reduce((total, report) => {
              if (!report) return total;

              // This is intentionally identical to Weekly Report Summary.
              return total + Number(
                report.cashFlow?.actualNetProfit ??
                report.cashFlow?.netProfit ??
                0
              );
            }, 0);

            return {
              date: String(day?.date || ''),
              netProfit
            };
          })
        );

        this.dates = dayResults.map(item => item.date);
        this.values = DAY_LABELS.map((_, index) =>
          Number(dayResults[index]?.netProfit || 0)
        );
      } catch (error) {
        console.error('Unable to load weekly net profit chart:', error);
        this.dates = [];
        this.values = [0, 0, 0, 0, 0, 0, 0];
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

      const hasData = this.values.some(value => Number(value) !== 0);

      this.chart.setOption({
        graphic: this.filterGraphic(),

        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: params => {
            const item = Array.isArray(params) ? params[0] : params;
            if (!item) return '';

            const index = Number(item.dataIndex || 0);
            const date = this.dates[index] || '';
            const dateText = date
              ? new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              : '';

            return [
              `<strong>${item.axisValue}${dateText ? ` · ${dateText}` : ''}</strong>`,
              `Net Profit: ${this.money(item.value)}`
            ].join('<br/>');
          }
        },

        grid: {
          top: 42,
          left: '3%',
          right: '3%',
          bottom: '5%',
          containLabel: true
        },

        xAxis: [{
          type: 'category',
          data: DAY_LABELS,
          axisTick: { alignWithLabel: true }
        }],

        yAxis: [{
          type: 'value',
          axisTick: { show: false },
          axisLabel: {
            formatter: value => {
              const number = Number(value || 0);
              const abs = Math.abs(number);
              if (abs >= 1000) return `$${(number / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
              return `$${number}`;
            }
          }
        }],

        series: [{
          name: 'Net Profit',
          type: 'bar',
          barWidth: '55%',
          data: this.values,
          animationDuration: 2500
        }]
      }, true);

      if (!hasData) {
        this.chart.setOption({
          graphic: [
            ...this.filterGraphic(),
            {
              type: 'text',
              left: 'center',
              top: '48%',
              style: {
                text: 'No net profit data',
                fill: '#909399',
                font: '12px sans-serif'
              }
            }
          ]
        });
      }
    }
  }
});
</script>
