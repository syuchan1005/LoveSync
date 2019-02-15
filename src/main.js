import Vue from 'vue';
import axios from 'axios';
import './plugins/vuetify';
import App from './App.vue';
import router from './router';
// import store from './store';
import apolloProvider from './apollo';
import './registerServiceWorker';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@fortawesome/fontawesome-free/css/all.css';

Vue.config.productionTip = false;
Vue.prototype.$http = axios;

new Vue({
  router,
  // store,
  apolloProvider,
  render: h => h(App),
}).$mount('#app');
