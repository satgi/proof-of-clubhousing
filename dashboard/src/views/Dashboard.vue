<template>
  <div id="dashboard">
    <div class="columns">
      <div class="column">
        <online-ranking :date="date"></online-ranking>
      </div>
    </div>
    <div class="columns">
      <div class="column">
        <active-user :date="date"></active-user>
      </div>
    </div>
  </div>
</template>

<script>
import OnlineRanking from '@/components/OnlineRanking.vue';
import ActiveUser from '@/components/ActiveUser.vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

export default {
  name: 'Dashboard',
  components: {
    OnlineRanking,
    ActiveUser,
  },
  data() {
    return {
      date: dayjs('2021-05-22').utc().subtract(1, 'day').startOf('day'),
    };
  },
  mounted() {},
  methods: {},
};
</script>

<style lang="scss" scoped></style>
