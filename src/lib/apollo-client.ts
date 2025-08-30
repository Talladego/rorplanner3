import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://production-api.waremu.com/graphql/',
    fetchOptions: {
      mode: 'cors',
    },
  }),
  cache: new InMemoryCache(),
});

export default client;
