import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { GraphQLSchema } from 'graphql';
import _ from 'lodash';
import { root } from './fifth-attempt';

const schema = new GraphQLSchema({
  query: root.getSemiGraphQLType(),
});

const apolloServer = new ApolloServer({
  schema,
});

const PORT = 4001;

const start = () => {
  const app = express();
  apolloServer.applyMiddleware({ app });
  app.listen({ port: PORT }, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`,
    );
  });
};

start();
