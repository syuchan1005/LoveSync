import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import { restartWebsocket } from './apollo';

Vue.use(Vuex);

const store = new Vuex.Store({
  plugins: [createPersistedState()],
  state: {
    token: {
      accessToken: undefined,
      refreshToken: undefined,
      expires: undefined,
    },
    pathHistory: undefined,
    color: 0,
  },
  mutations: {
    /* eslint-disable no-param-reassign */
    setPath(state, path) {
      state.pathHistory = path;
    },
    setToken(state, token) {
      state.token.accessToken = token.access_token;
      state.token.refreshToken = token.refresh_token;
      state.token.expires = token.expires_in
        ? Date.now() + (token.expires_in - 30) * 1000
        : undefined;
      restartWebsocket();
    },
    setColor(state, color) {
      state.color = color;
    },
    /* eslint-enable no-param-reassign */
  },
  actions: {},
});

export default store;
