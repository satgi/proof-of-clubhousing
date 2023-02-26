<template>
  <div id="app">
    <div class="container">
      <nav-bar></nav-bar>
      <div class="mb-5">
        <router-view></router-view>
      </div>
      <foot></foot>
    </div>
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue';
import Foot from '@/components/Foot.vue';

export default {
  components: {
    NavBar,
    Foot,
  },
};
</script>

<style lang="scss"></style>
