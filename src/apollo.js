import Vue from 'vue';
import VueApollo from 'vue-apollo';

import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error';
import { ApolloLink } from 'apollo-link';
import { setContext } from 'apollo-link-context';

import { WebSocketLink } from 'apollo-link-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import MessageTypes from 'subscriptions-transport-ws/dist/message-types';

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
  })
    .reduce((p, e) => p.append(e[0], e[1]), new URLSearchParams()),
})
  .then(({ data }) => {
    console.log('[Token Refresh]');
    store.commit('setToken', data);
  });

const uri = `//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/graphql`;

const hasSubscriptionOperation = ({ query: { definitions } }) => definitions.some(({ kind, operation }) => kind === 'OperationDefinition' && operation === 'subscription');

const authHeader = async (_, { headers }) => {
  if (!store.state.token.accessToken) return { headers };
  if (store.state.token.expires <= Date.now()) await refreshToken();
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${store.state.token.accessToken}`,
    },
  };
};

const wsClient = new SubscriptionClient(`${window.location.protocol === 'http:' ? 'ws:' : 'wss:'}${uri}`, {
  reconnect: true,
  connectionParams: () => authHeader({}, {}).then(({ headers }) => headers),
});

export function restartWebsocket() {
  const operations = Object.assign({}, wsClient.operations);
  wsClient.close(true);
  wsClient.connect();
  Object.keys(operations).forEach((id) => {
    wsClient.sendMessage(id, MessageTypes.GQL_START, operations[id].options);
  });
}

const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.map(({ message, locations, path }) => console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ));
      }
      if (networkError) console.log(`[Network error]: ${JSON.stringify(networkError)}`);
    }),
    ApolloLink.split(
      hasSubscriptionOperation,
      new WebSocketLink(wsClient),
      setContext(authHeader).concat(new HttpLink({ uri: `${window.location.protocol}${uri}` })),
    ),
  ]),
  cache: new InMemoryCache(),
  connectToDevTools: process.env.NODE_ENV !== 'production',
});

const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
});

export default apolloProvider;
