'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Users.hasMany(models.QrCodes, { foreignKey: 'user_id', as: 'qrcodes' });
    }
  }
  Users.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user',
      },
      qr_limit: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Users',
      tableName: 'tbl_users',
    }
  );
  return Users;
};
