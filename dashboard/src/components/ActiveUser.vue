<template>
  <div class="box">
    <div class="content mb-8">
      <h4>Daily Active Users</h4>
    </div>
    <div class="chart">
      <highcharts
        v-show="!loading"
        :options="chartOptions"
        ref="activeUserStatChart">
      </highcharts>
    </div>
  </div>
</template>

<script>
import Highcharts from 'highcharts';
import { fetchActiveUserStats } from '@/api/active-user';

export default {
  name: 'ActiveUser',
  props: {
    date: {
      type: Object,
      default() {
        return null;
      },
    },
  },
  data() {
    return {
      activeUserStats: [],
      loading: false,
    };
  },
  computed: {
    chartOptions() {
      return {
        chart: {
          type: 'spline',
          spacingTop: 24,
          spacingBottom: 24,
        },
        credits: false,
        title: null,
        legend: {
          enabled: false,
        },
        xAxis: {
          type: 'datetime',
          categories: this.activeUserStats.map((stat) => {
            return stat.date * 1000;
          }),
          labels: {
            formatter: function () {
              return Highcharts.dateFormat('%b %e', this.value);
            },
          },
        },
        yAxis: {
          title: null,
        },
        plotOptions: {
          spline: {
            dataLabels: {
              enabled: true,
            },
            enableMouseTracking: false,
          },
        },
        series: [
          {
            name: 'Daily Active Users',
            data: this.activeUserStats.map((stat) => {
              return stat.amount;
            }),
            color: '#ff9900',
          },
        ],
      };
    },
    end() {
      return this.date && this.date.unix();
    },
    start() {
      return this.date && this.date.subtract(6, 'day').unix();
    },
  },
  watch: {
    date() {
      this.fetchActiveUserStats();
    },
    activeUserStats() {
      this.$nextTick(() => {
        this.$refs.activeUserStatChart.chart.reflow();
      });
    },
  },
  mounted() {
    this.fetchActiveUserStats();
  },
  methods: {
    async fetchActiveUserStats() {
      if (!this.date) {
        return;
      }
      this.loading = true;
      try {
        const result = await fetchActiveUserStats({
          start: this.start,
          end: this.end,
          level: 'daily',
        });
        this.activeUserStats = result.data.activeUserStats;
      } catch (error) {
        console.log(error);
      }
      this.loading = false;
    },
  },
};
</script>

<style lang="scss" scoped></style>
