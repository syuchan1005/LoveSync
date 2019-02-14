import fs from 'fs';

import { ApolloServer, gql } from 'apollo-server-koa';
import { GraphQLDateTime } from 'graphql-iso-date';

class GraphQL {
  constructor(schemePath, db) {
    this.db = db;
    this.typeDefs = gql`${fs.readFileSync(schemePath)}`;
  }

  /* eslint-disable */
  // noinspection JSMethodCanBeStatic
  get Query() {
  /* eslint-enable */
    return {
      user: (parent, args, { state }) => state.user,
    };
  }

  get Mutation() {
    return {
      createAccount: (parent, { username, password }) => this.db.addUser(username, password),
      generatePairCode: (parent, args, ctx) => {
        if (!ctx.isAuthenticated()) throw new Error('User not found');
        return this.db.generatePairCode(ctx.state.user.id);
      },
      revokePairCode: (parent, { code }) => this.db.revokePairCode(code),
      acceptPairCode: (parent, { code }, ctx) => {
        if (!ctx.isAuthenticated()) throw new Error('User not found');
        return this.db.acceptPairCode(code, ctx.state.user.id);
      },
    };
  }

  /* eslint-disable */
  // noinspection JSMethodCanBeStatic
  get User() {
  /* eslint-enable */
    return {
      pair: async (user) => {
        const pair = [...await user.getUserAs(), ...await user.getUserBs()];
        return pair.length === 0 ? null : pair[0];
      },
    };
  }

  middleware(app) {
    this.server = new ApolloServer({
      typeDefs: this.typeDefs,
      resolvers: {
        DateTime: GraphQLDateTime,
        User: this.User,
        Query: this.Query,
        Mutation: this.Mutation,
      },
      context: ({ ctx }) => ctx,
    });
    this.server.applyMiddleware({ app });
  }
}

export default GraphQL;
