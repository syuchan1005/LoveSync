import Vue from 'vue';
import Router from 'vue-router';
import Top from './views/Top.vue';

Vue.mixin({
  mounted() {
    let { title } = this.$options;
    if (title) {
      title = typeof title === 'function' ? title.call(this) : title;
      document.title = `App Name - ${title}`;
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
  ],
});

export default router;
