import fs from 'fs';

import { ApolloServer, gql } from 'apollo-server-koa';
import { GraphQLDateTime } from 'graphql-iso-date';

import Util from './Util';

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
        return {
          ctx,
          user,
        };
      },
    });
    this.server.applyMiddleware({ app });
  }
}

export default GraphQL;
