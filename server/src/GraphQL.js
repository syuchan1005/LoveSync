import fs from 'fs';

import { ApolloServer, gql } from 'apollo-server-koa';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLDateTime } from 'graphql-iso-date';

import Util from './Util';

class GraphQL {
  constructor(schemePath, db) {
    this.db = db;
    this.typeDefs = gql`${fs.readFileSync(schemePath)}`;
    this.pubsub = new PubSub();
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
      createAccount: (parent, { username, password }) => {
        if (username.length === 0) throw new Error('Username is required');
        if (password.length < 8) throw new Error('Password must be more than 8 chars');
        return this.db.addUser(username, password);
      },
      deleteAccount: async (parent, args, { user }) => {
        if (!user) throw new Error('User not found');
        await user.removePairs();
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
      push: async (parent, { userIds }, { user }) => {
        const pairs = await (userIds.length === 0 ? user.getPairs() : this.db.models.pair.findAll({
          where: {
            [this.db.sequelize.Op.or]: [
              {
                userA: user.id,
                userB: { [this.db.sequelize.Op.in]: userIds },
              },
              {
                userA: { [this.db.sequelize.Op.in]: userIds },
                userB: user.id,
              },
            ],
          },
        }));
        if (pairs.length === 0) throw new Error('Need pairing in setting');
        await Util.mapAsync(pairs, ({ id }) => this.db.models.push.create({
          pairId: id,
          userId: user.id,
          expires: Date.now() + (1000 * 60 * 5),
        }));
        return Util.mapAsync(pairs, async (pair) => {
          const success = await pair.isSuccess();
          const u = await this.db.models.user.findOne({
            where: { id: pair.userA === user.id ? pair.userB : pair.userA },
          });
          return {
            user: u,
            success,
          };
        });
      },
    };
  }

  get Subscription() {
    return {
      test: {
        subscribe: () => this.pubsub.asyncIterator(['test']),
      },
    };
  }

  get User() {
    return {
      pairs: async (user) => {
        const pairs = await user.getPairs()
          .then(p => p || []);
        return Util.mapAsync(pairs, pair => this.db.models.user.findOne({
          where: { id: (pair.userA === user.id ? pair.userB : pair.userA) },
        }));
      },
    };
  }

  async getUser(accessToken) {
    let user;
    if (accessToken) {
      user = await this.db.models.user.findOne({
        where: { accessToken },
      });
    }
    if (user && user.accessTokenExpiresAt < Date.now()) user = null;
    return user;
  }

  middleware(app) {
    this.server = new ApolloServer({
      typeDefs: this.typeDefs,
      resolvers: {
        DateTime: GraphQLDateTime,
        User: this.User,
        Query: this.Query,
        Mutation: this.Mutation,
        Subscription: this.Subscription,
      },
      subscriptions: {
        onConnect: async (param) => {
          if (param.authorization) {
            return {
              user: await this.getUser(param.authorization.substring(7)),
            };
          }
          return {};
        },
      },
      context: async ({ ctx, connection }) => {
        if (connection) {
          return connection.context;
        }
        return {
          ctx,
          user: await this.getUser(ctx.request.header.authorization.slice(7)),
        };
      },
    });
    this.server.applyMiddleware({ app });
  }

  subscription(httpServer) {
    this.server.installSubscriptionHandlers(httpServer);
  }
}

export default GraphQL;
