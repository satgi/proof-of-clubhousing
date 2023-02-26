<template>
  <b-navbar spaced>
    <template #brand>
      <b-navbar-item tag="div">
        <div class="is-flex is-align-items-center">
          <figure class="image is-48x48 mr-2">
            <img class="logo" src="assets/clubhouse-logo.svg" />
          </figure>
          <strong>Proof of Clubhousing</strong>
        </div>
      </b-navbar-item>
    </template>
    <template #end>
      <b-navbar-item
        tag="router-link"
        :to="{ name: 'dashboard' }"
        :active="$route.name === 'dashboard'">
        Dashboard
      </b-navbar-item>
    </template>
  </b-navbar>
</template>

<script>
export default {
  name: 'NavBar',
  data() {
    return {};
  },
  mounted() {},
  methods: {},
};
</script>

<style lang="scss" scoped>
.logo {
  max-height: 100%;
}
.emoji {
  font-size: 24px;
}
</style>
