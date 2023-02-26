process.env.DEBUG = '';

// eslint-disable-next-line
require = require('esm')(module);
require('dotenv').config();

const { apolloServer } = require('./src/graphql/apollo');
const PORT = process.env.PORT || 3000;

apolloServer.listen({ port: PORT }).then(({ url }) => {
  console.log(`🚀 Apollo Server ready at ${url}`);
});
