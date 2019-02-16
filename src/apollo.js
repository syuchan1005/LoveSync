import Vue from 'vue';
import VueApollo from 'vue-apollo';

import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error';
import { ApolloLink } from 'apollo-link';
import { setContext } from 'apollo-link-context';

import store from './store';

Vue.use(VueApollo);

export const refreshToken = () => Vue.prototype.$http({
  url: '/oauth/token',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  data: Object.entries({
    client_id: 'lovesync',
    client_secret: 'lovesync_secret',
    grant_type: 'refresh_token',
    refresh_token: store.state.token.refreshToken,
  }).reduce((p, e) => p.append(e[0], e[1]), new URLSearchParams()),
}).then(({ data }) => {
  store.commit('setToken', data);
});

const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.map(({ message, locations, path }) => console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ));
      }
      if (networkError) console.log(`[Network error]: ${networkError}`);
    }),
    setContext(async (_, { headers }) => {
      if (!store.state.token.accessToken) return { headers };
      if (store.state.token.expires <= Date.now()) await refreshToken();
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${store.state.token.accessToken}`,
        },
      };
    }).concat(new HttpLink({
      uri: `${window.location.origin}/graphql`,
    })),
  ]),
  cache: new InMemoryCache(),
});

const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
});

export default apolloProvider;
