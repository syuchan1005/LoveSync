import fs from 'fs';
import { ApolloServer, gql } from 'apollo-server-koa';

class GraphQL {
  constructor(schemePath, db) {
    this.db = db;
    this.typeDefs = gql`${fs.readFileSync(schemePath)}`;
  }

  get Query() {
    return {
      test: () => 'test',
    };
  }

  get Mutation() {
    return {
      hello: () => 'test',
    };
  }

  middleware(app) {
    this.server = new ApolloServer({
      typeDefs: this.typeDefs,
      resolvers: {
        Query: this.Query,
        Mutation: this.Mutation,
      },
    });
    this.server.applyMiddleware({ app });
  }
}

export default GraphQL;
