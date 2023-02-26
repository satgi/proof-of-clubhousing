require('dotenv').config();
const { Sequelize, Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.MYSQL_URL);

class User extends Model {}
class OnlineStat extends Model {}
class ActiveUserStatSnapshot extends Model {}

User.init(
  {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photo_url: {
      type: DataTypes.STRING,
    },
    bio: {
      type: DataTypes.TEXT,
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_follower: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_member: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_pending_accept: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_pending_approval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { sequelize, modelName: 'clubhouse_users' }
);

OnlineStat.init(
  {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    minutes: {
      type: DataTypes.INTEGER,
    },
    date: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  { sequelize, modelName: 'clubhouse_online_stats' }
);

ActiveUserStatSnapshot.init(
  {
    amount: {
      type: DataTypes.INTEGER,
    },
    date: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM({
        values: ['daily', 'weekly', 'monthly', 'yearly'],
      }),
      allowNull: false,
    },
  },
  { sequelize, modelName: 'clubhouse_snapshot_active_user_stats' }
);

User.hasMany(OnlineStat, {
  targetKey: 'user_id',
  foreignKey: 'user_id',
});
OnlineStat.belongsTo(User, {
  targetKey: 'user_id',
  foreignKey: 'user_id',
});

const syncTables = async () => {
  await sequelize.sync();
};

syncTables();

module.exports = {
  sequelize,
  User,
  OnlineStat,
  ActiveUserStatSnapshot,
};
