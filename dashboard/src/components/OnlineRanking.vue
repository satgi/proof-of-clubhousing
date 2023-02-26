<template>
  <div class="box">
    <div class="content">
      <h4>Online Ranking - {{ readableDate }}</h4>
    </div>
    <b-table
      striped
      hoverable
      paginated
      backend-pagination
      :loading="loading"
      :data="rankingStats"
      :total="pageInfo.total"
      :per-page="pageInfo.limit"
      :mobile-cards="false"
      :page-input="true"
      :debounce-page-input="300"
      @page-change="onPageChange">
      <b-table-column
        field="place"
        label="Ranking"
        cell-class="vcell"
        width="40"
        numeric
        centered
        v-slot="props">
        <span v-if="props.row.medal">
          <b-icon icon="medal" size="is-medium" :type="`is-${props.row.medal}`">
          </b-icon>
        </span>
        <span v-else>{{ props.row.place }}</span>
      </b-table-column>

      <b-table-column
        field="user"
        label="User"
        cell-class="vcell"
        v-slot="props">
        <div class="is-flex is-align-items-center">
          <figure class="image is-48x48 mr-3">
            <img
              class="is-rounded"
              :src="
                (props.row.user && props.row.user.photoUrl) ||
                `https://via.placeholder.com/250x250.png`
              " />
          </figure>
          <div v-if="props.row.user">
            <strong>{{ props.row.user.name }}</strong>
            <br />
            <span>@{{ props.row.user.username }}</span>
          </div>
          <span v-else>syncing data...</span>
        </div>
      </b-table-column>

      <b-table-column
        field="minutes"
        label="Online"
        cell-class="vcell"
        width="150"
        centered
        v-slot="props">
        <span v-if="props.row.minutes < 60">{{ props.row.minutes }} m</span>
        <b-tooltip
          v-else
          :label="`${props.row.minutes} mins`"
          type="is-dark"
          dashed>
          <span>{{ props.row.minutes | readableDuration }}</span>
        </b-tooltip>
      </b-table-column>

      <template v-if="isEmpty" #empty>
        <div class="has-text-centered">No records</div>
      </template>
    </b-table>
  </div>
</template>

<script>
import { fetchOnlineRankingStats } from '@/api/online-stat';
import humanizeDuration from 'humanize-duration';

const shortEnglishHumanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  languages: {
    shortEn: {
      y: () => 'y',
      mo: () => 'mo',
      w: () => 'w',
      d: () => 'd',
      h: () => 'h',
      m: () => 'm',
      s: () => 's',
      ms: () => 'ms',
    },
  },
});

const MEDAL_CLASS = {
  1: 'gold',
  2: 'silver',
  3: 'bronze',
};

export default {
  name: 'OnlineRanking',
  props: {
    date: {
      type: Object,
      default() {
        return null;
      },
    },
  },
  filters: {
    readableDuration(input) {
      return shortEnglishHumanizer(input * 60000);
    },
  },
  data() {
    return {
      rankingStats: [],
      loading: false,
      pageInfo: {
        total: 0,
        limit: 10,
        offset: 0,
      },
    };
  },
  computed: {
    isEmpty() {
      return !this.loading && !this.rankingStats.length;
    },
    end() {
      return this.date && this.date.unix();
    },
    start() {
      return this.end;
    },
    readableDate() {
      return this.date.format('MMMM D, YYYY');
    },
  },
  mounted() {
    this.fetchOnlineRankingStats();
  },
  methods: {
    async fetchOnlineRankingStats() {
      if (!this.date) {
        return;
      }
      this.loading = true;
      try {
        const result = await fetchOnlineRankingStats({
          start: this.start,
          end: this.end,
          limit: this.pageInfo.limit,
          offset: this.pageInfo.offset,
        });

        this.rankingStats = result.data.onlineRankingStats.entries.map(
          (item) => {
            const medal = MEDAL_CLASS[item.place];
            return Object.assign(item, {
              medal,
            });
          }
        );
        this.pageInfo = result.data.onlineRankingStats.pageInfo;
      } catch (error) {
        console.log(error);
      }
      this.loading = false;
    },
    onPageChange(page) {
      this.pageInfo.offset = this.pageInfo.limit * (page - 1);
      this.fetchOnlineRankingStats();
    },
  },
};
</script>

<style lang="scss">
.vcell {
  vertical-align: middle !important;
}
</style>
