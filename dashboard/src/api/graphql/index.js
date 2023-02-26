import ApolloClient from 'apollo-boost';
import gql from 'graphql-tag';
import { InMemoryCache } from 'apollo-cache-inmemory';

const BASE_URL = `http://localhost:3001`;

const apolloClient = new ApolloClient({
  uri: BASE_URL,
  fetch: (uri, options) => {
    const { operationName } = JSON.parse(options.body);
    return fetch(`${uri}?op=${operationName}`, options);
  },
  cache: new InMemoryCache({
    addTypename: false,
  }),
});

export { gql, apolloClient };
