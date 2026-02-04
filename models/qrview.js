'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QrView extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      QrView.belongsTo(models.QrCodes, {
        foreignKey: 'qrId',
        as: 'qr',
      });
    }
  }
  QrView.init(
    {
      qrId: { type: DataTypes.INTEGER, allowNull: false },
      ip: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      tableName: 'tbl_qr_views',
      modelName: 'QrView',
    }
  );
  return QrView;
};
