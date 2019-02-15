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
      user: (parent, args, { user }) => {
        if (!user) throw new Error('User not found');
        return user;
      },
    };
  }

  get Mutation() {
    return {
      createAccount: (parent, { username, password }) => this.db.addUser(username, password),
      deleteAccount: async (parent, args, { user }) => {
        if (!user) throw new Error('User not found');
        await user.destroy();
        return true;
      },
      generatePairCode: (parent, args, { user }) => {
        if (!user) throw new Error('User not found');
        return this.db.generatePairCode(user.id);
      },
      revokePairCode: (parent, { code }) => this.db.revokePairCode(code),
      acceptPairCode: (parent, { code }, { user }) => {
        if (!user) throw new Error('User not found');
        return this.db.acceptPairCode(code, user.id);
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
      context: async ({ ctx }) => {
        let user = null;
        if (ctx.request.header.authorization) {
          const accessToken = ctx.request.header.authorization.slice(7);
          if (accessToken) {
            user = await this.db.models.user.findOne({
              where: { accessToken },
            });
          }
          if (user && user.accessTokenExpiresAt < Date.now()) user = null;
        }
        return { ctx, user };
      },
    });
    this.server.applyMiddleware({ app });
  }
}

export default GraphQL;
