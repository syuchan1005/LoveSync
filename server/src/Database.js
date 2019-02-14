import Sequelize from 'sequelize';
import bcrypt from 'bcrypt';

export default class Database {
  constructor(filePath, saltRound) {
    this.saltRound = saltRound || 10;
    this.db = new Sequelize({
      dialect: 'sqlite',
      storage: filePath,
      logging: false,
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
      }, {
        paranoid: true,
      }),
    };
  }

  async authenticate() {
    await Object.values(this.models)
      .reduce((p, n) => p.then(() => n.sync()), this.db.authenticate());
  }

  async addUser(username, password) {
    const hash = bcrypt.hashSync(password, this.saltRound);
    return this.models.user.create({ username, hash });
  }

  async getUser(username, password) {
    const user = await this.models.user.findOne({ where: { username } });
    if (user && bcrypt.compareSync(password, user.hash)) return user;
    return null;
  }
}
