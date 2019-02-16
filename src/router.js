import Vue from 'vue';
import Router from 'vue-router';
import store from './store';
import Top from './views/Top.vue';
import Home from './views/Home.vue';
import Setting from './views/Setting.vue';

Vue.mixin({
  mounted() {
    let { title } = this.$options;
    if (title) {
      title = typeof title === 'function' ? title.call(this) : title;
      document.title = `LoveSync - ${title}`;
    }
  },
});

Vue.use(Router);

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: Top.name,
      component: Top,
    },
    {
      path: '/home',
      name: Home.name,
      component: Home,
    },
    {
      path: '/setting',
      name: Setting.name,
      component: Setting,
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  if (to.path !== store.state.pathHistory) {
    store.commit('setPath', to.path);
  }
  next();
});

export default router;
