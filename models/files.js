'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Files extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Files.belongsTo(models.QrCodes, {
        foreignKey: 'qrCodeId',
        as: 'qr',
        constraints: false,
      });
    }
  }
  Files.init(
    {
      path: DataTypes.STRING,

      originalName: DataTypes.STRING,
      mimetype: DataTypes.STRING,
      size: DataTypes.INTEGER,
      qrCodeId: {
        type: DataTypes.UUID,
      },
      cover: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'Files',
      tableName: 'tbl_files',
    }
  );
  return Files;
};
