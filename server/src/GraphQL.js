import fs from 'fs';

import { ApolloServer, gql } from 'apollo-server-koa';
import { PubSub, withFilter } from 'graphql-subscriptions';
import { GraphQLDateTime } from 'graphql-iso-date';

import Util from './Util';

class GraphQL {
  static get topic() {
    return {
      PAIR_CHANGE: 'pair_change',
      PUSH: 'push_change',
    };
  }

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
      acceptPairCode: async (parent, { code }, { user }) => {
        if (!user) throw new Error('User not found');
        const source = await this.db.acceptPairCode(code, user.id);
        this.pubsub.publish(GraphQL.topic.PAIR_CHANGE, {
          pair: {
            type: 'ADD',
            user,
            source,
          },
        });
        return !!source;
      },
      deletePair: async (parent, { userId }, { user }) => {
        if (!user) throw new Error('User not found');
        const c = await this.db.models.pair.destroy({
          where: {
            [this.db.sequelize.Op.or]: [
              {
                userA: userId,
                userB: user.id,
              },
              {
                userA: user.id,
                userB: userId,
              },
            ],
          },
        });
        if (c === 1) {
          this.pubsub.publish(GraphQL.topic.PAIR_CHANGE, {
            pair: {
              type: 'DELETE',
              user,
              source: await this.db.models.user.findOne({ where: { id: userId } }),
            },
          });
        }
        return c === 1;
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
        const res = await Util.mapAsync(pairs, async (pair) => {
          const success = await pair.isSuccess();
          const u = await this.db.models.user.findOne({
            where: { id: pair.userA === user.id ? pair.userB : pair.userA },
          });
          return {
            user: u,
            success,
          };
        });
        res.forEach((r) => {
          this.pubsub.publish(GraphQL.topic.PUSH, {
            push: r,
            user,
          });
        });
        return res;
      },
    };
  }

  get Subscription() {
    return {
      pair: {
        subscribe: withFilter(
          () => this.pubsub.asyncIterator([GraphQL.topic.PAIR_CHANGE]),
          ({ pair }, variables, { user }) => {
            if (!user) return false;
            return pair.source.id === user.id;
          },
        ),
      },
      push: {
        subscribe: withFilter(
          () => this.pubsub.asyncIterator([GraphQL.topic.PUSH]),
          ({ push }, variables, { user }) => {
            if (!user) return false;
            console.log(push.success, push.user.id === user.id, push.user.id, user.id);
            return push.success && push.user.id === user.id;
          },
        ),
        resolve: ({ user }) => user,
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
      pushes: /*async (user) => {
        const u = await user.getSuccessUsers();
        console.log(u.length);
        return u;
      }*/() => [],
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
          if (param && param.authorization) {
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
        if (ctx.request.header.authorization) {
          return {
            ctx,
            user: await this.getUser(ctx.request.header.authorization.slice(7)),
          };
        }
        return { ctx };
      },
    });
    this.server.applyMiddleware({ app });
  }

  subscription(httpServer) {
    this.server.installSubscriptionHandlers(httpServer);
  }
}

export default GraphQL;
