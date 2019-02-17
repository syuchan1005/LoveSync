import Sequelize from 'sequelize';
import bcrypt from 'bcrypt';
import UUIDv4 from 'uuid/v4';
import Util from './Util';

const uuidv4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

export default class Database {
  constructor(filePath, saltRound) {
    this.sequelize = Sequelize;
    this.saltRound = saltRound || 10;
    this.db = new Sequelize({
      dialect: 'sqlite',
      storage: filePath,
      logging: false,
    });
    this.models = {
      user: this.db.define('user', {
        username: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        hash: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        accessToken: {
          type: Sequelize.STRING,
        },
        accessTokenExpiresAt: {
          type: Sequelize.DATE,
        },
        refreshToken: {
          type: Sequelize.STRING,
        },
        refreshTokenExpiresAt: {
          type: Sequelize.DATE,
        },
      }, {
        paranoid: true,
      }),
      pair: this.db.define('pair', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        userA: {
          type: Sequelize.INTEGER,
        },
        userB: {
          type: Sequelize.INTEGER,
        },
        deletedAt: {
          type: Sequelize.DATE,
        },
      }, {
        paranoid: true,
      }),
      push: this.db.define('push', {
        /* pairId, userId */
      }, {
        paranoid: true,
        deletedAt: 'expires',
      }),
      pairCode: this.db.define('pairCode', {
        /* userId */
        code: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      }, {
        paranoid: true,
        deletedAt: 'expires',
      }),
    };

    const self = this;
    // eslint-disable-next-line
    this.models.user.prototype.getPairs = function () {
      return self.models.pair.findAll({
        where: {
          [Sequelize.Op.or]: [{ userA: this.id }, { userB: this.id }],
        },
      });
    };
    // eslint-disable-next-line
    this.models.user.prototype.removePairs = function () {
      return self.models.pair.destroy({
        where: {
          [Sequelize.Op.or]: [{ userA: this.id }, { userB: this.id }],
        },
      });
    };
    // eslint-disable-next-line
    this.models.user.prototype.getSuccessUsers = async function () {
      const pairs = await this.getPairs();
      const users = [];
      await Util.forEachAsync(pairs, async (pair) => {
        if (await pair.isSuccess()) {
          users.push(await self.models.user.findOne({
            where: {
              id: (pair.userA === this.id) ? pair.userB : pair.userA,
            },
          }));
        }
      });
      return users;
    };
    // eslint-disable-next-line
    this.models.pair.prototype.isSuccess = async function () {
      const count = await self.models.pair.count({
        where: { id: this.id },
        include: [
          {
            model: self.models.push,
            required: true,
            as: 'pushA',
            on: {
              pairId: Sequelize.where(Sequelize.col('pair.id'), '=', Sequelize.col('pushA.pairId')),
              userId: Sequelize.where(Sequelize.col('pair.userA'), '=', Sequelize.col('pushA.userId')),
            },
          },
          {
            model: self.models.push,
            required: true,
            as: 'pushB',
            on: {
              pairId: Sequelize.where(Sequelize.col('pair.id'), '=', Sequelize.col('pushB.pairId')),
              userId: Sequelize.where(Sequelize.col('pair.userB'), '=', Sequelize.col('pushB.userId')),
            },
          },
        ],
      });
      return count > 0;
    };
    // eslint-disable-next-line
    this.models.pairCode.revoke = function (where) {
      return self.models.pairCode.update({
        expires: Date.now() - 1,
      }, { where, paranoid: false });
    };

    this.models.user.belongsToMany(this.models.user, {
      through: this.models.pair,
      as: 'userA',
      foreignKey: 'userA',
    });
    this.models.user.belongsToMany(this.models.user, {
      through: this.models.pair,
      as: 'userB',
      foreignKey: 'userB',
    });
    this.models.user.hasOne(this.models.pairCode, { foreignKey: 'userId' });
    this.models.pair.hasMany(this.models.push, { foreignKey: 'pairId', as: 'pushA' });
    this.models.pair.hasMany(this.models.push, { foreignKey: 'pairId', as: 'pushB' });
    this.models.push.belongsTo(this.models.user, { foreignKey: 'userId' });
  }

  async authenticate() {
    await Object.values(this.models)
      .reduce((p, n) => p.then(() => n.sync()), this.db.authenticate());
  }

  async addUser(username, password) {
    const hash = bcrypt.hashSync(password, this.saltRound);
    try {
      return await this.models.user.create({
        username,
        hash,
      });
    } catch (e) {
      throw new Error('User exists');
    }
  }

  async getUser(username, password) {
    const user = await this.models.user.findOne({ where: { username } });
    if (user && bcrypt.compareSync(password, user.hash)) return user;
    return null;
  }

  async generatePairCode(id) {
    await this.models.pairCode.revoke({ id });
    return this.models.pairCode.create({
      userId: id,
      code: UUIDv4(),
      expires: Date.now() + (1000 * 60 * 5),
    });
  }

  async revokePairCode(code) {
    if (!code.match(uuidv4)) throw new Error('Invalid code');
    const [c] = await this.models.pairCode.revoke({ code });
    return c >= 1;
  }

  async acceptPairCode(code, id) {
    if (!code.match(uuidv4)) throw new Error('Invalid code');
    const pairCode = await this.models.pairCode.findOne({ where: { code } });
    if (!pairCode) throw new Error('User not found from code');
    await this.revokePairCode(code);
    if (id === pairCode.userId) throw new Error('Same user');
    try {
      await this.models.pair.upsert({
        userA: id,
        userB: pairCode.userId,
        deletedAt: null,
      }, {
        where: {
          [Sequelize.Op.or]: [
            {
              userA: id,
              userB: pairCode.userId,
            },
            {
              userA: pairCode.userId,
              userB: id,
            },
          ],
        },
      });
      return this.models.user.findOne({ where: { id: pairCode.userId } });
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
