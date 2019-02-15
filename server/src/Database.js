import Sequelize from 'sequelize';
import bcrypt from 'bcrypt';
import UUIDv4 from 'uuid/v4';

export default class Database {
  constructor(filePath, saltRound) {
    this.saltRound = saltRound || 10;
    this.db = new Sequelize({
      dialect: 'sqlite',
      storage: filePath,
      // logging: false,
    });
    this.models = {
      user: this.db.define('user', {
        username: {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        hash: {
          type: Sequelize.DataTypes.STRING,
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
          type: Sequelize.DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        userA: {
          type: Sequelize.DataTypes.INTEGER,
        },
        userB: {
          type: Sequelize.DataTypes.INTEGER,
        },
      }, {
        paranoid: true,
      }),
      pairCode: this.db.define('pairCode', {
        /* userId */
        code: {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
        },
      }, {
        paranoid: true,
        deletedAt: 'expires',
      }),
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
    this.models.user.hasOne(this.models.pairCode, {
      foreignKey: 'userId',
    });
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
    await this.revokePairCode(code);
    try {
      await this.models.pairCode.create({
        userA: id,
        userB: userId,
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}
