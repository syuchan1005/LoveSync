import fs from 'fs';

import { ApolloServer, gql } from 'apollo-server-koa';
import { GraphQLDateTime } from 'graphql-iso-date';

class GraphQL {
  constructor(schemePath, db) {
    this.db = db;
    this.typeDefs = gql`${fs.readFileSync(schemePath)}`;
  }

  get Query() {
    return {
      user: (parent, args, { state }) => state.user,
    };
  }

  get Mutation() {
    return {
      createAccount: (parent, { username, password }) => this.db.addUser(username, password),
    };
  }

  middleware(app) {
    this.server = new ApolloServer({
      typeDefs: this.typeDefs,
      resolvers: {
        DateTime: GraphQLDateTime,
        Query: this.Query,
        Mutation: this.Mutation,
      },
      context: ({ ctx }) => ctx,
    });
    this.server.applyMiddleware({ app });
  }
}

export default GraphQL;
