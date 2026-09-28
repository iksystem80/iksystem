<template>
  <div :class="className" :style="{ height: height, width: width }" />
</template>

<script>
import * as echarts from 'echarts';
import { defineComponent, shallowRef } from 'vue';
import macaronsTheme from '@/styles/echarts/theme/macarons'; // echarts theme
import resize from './mixins/resize';

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
      chart: null
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
    initChart() {
      this.chart = shallowRef(echarts.init(this.$el, macaronsTheme));

      this.chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)'
        },
        legend: {
          left: 'center',
          bottom: '10',
          data: ['IGT', 'Twinstar', 'J-43', 'Firelink', 'Wood']
        },
        series: [
          {
            name: 'Daily Report',
            type: 'pie',
            roseType: 'radius',
            radius: [15, 95],
            center: ['50%', '38%'],
            data: [
                { value: 100, name: 'IGT' },
                { value: 240, name: 'Twinstar' },
                { value: 149, name: 'J-43' },
                { value: 350, name: 'Firelink' },
                { value: 270, name: 'Wood' }
            ],
            animationEasing: 'cubicInOut',
            animationDuration: 2600
          }
        ]
      });
    }
  }
});
</script>
