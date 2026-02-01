'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QrCodes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      QrCodes.belongsTo(models.Users, { foreignKey: 'user_id', as: 'user' });
      QrCodes.hasOne(models.Files, { foreignKey: 'qrCodeId', as: 'file' });
    }
  }
  QrCodes.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'QrCodes',
      tableName: 'tbl_qr_codes',
    }
  );
  return QrCodes;
};
