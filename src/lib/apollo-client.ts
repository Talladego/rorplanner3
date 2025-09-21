import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://production-api.waremu.com/graphql/',
    fetchOptions: {
      mode: 'cors',
    },
  }),
  cache: new InMemoryCache(),
  // Make cache-first behavior explicit for queries
  defaultOptions: {
    query: {
      fetchPolicy: 'cache-first',
    },
  },
});

export default client;
