import Vue from 'vue';
import Buefy from 'buefy';
import App from './App.vue';
import router from './router';
import './styles/style.scss';
import HighchartsVue from 'highcharts-vue';

Vue.use(HighchartsVue);

Vue.use(Buefy);

Vue.config.productionTip = false;

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
