import Sequelize from 'sequelize';
import bcrypt from 'bcrypt';
import UUIDv4 from 'uuid/v4';

export default class Database {
  constructor(filePath, saltRound) {
    this.sequelize = Sequelize;
    this.saltRound = saltRound || 10;
    this.db = new Sequelize({
      dialect: 'sqlite',
      storage: filePath,
      // logging: false,
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
    return this.models.user.create({
      username,
      hash,
    });
  }

  async getUser(username, password) {
    const user = await this.models.user.findOne({ where: { username } });
    if (user && bcrypt.compareSync(password, user.hash)) return user;
    return null;
  }

  async generatePairCode(id) {
    await this.models.pairCode.destroy({ where: { id } });
    return this.models.pairCode.create({
      userId: id,
      code: UUIDv4(),
      expires: Date.now() + (1000 * 60 * 5),
    });
  }

  async revokePairCode(code) {
    const c = await this.models.pairCode.destroy({ where: { code } });
    return c >= 1;
  }

  async acceptPairCode(code, id) {
    const { userId } = await this.models.pairCode.findOne({ where: { code } });
    console.log(id, userId);
    await this.revokePairCode(code);
    try {
      await this.models.pair.create({
        userA: id,
        userB: userId,
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}
