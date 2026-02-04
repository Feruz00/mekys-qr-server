'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tbl_qr_views', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      qrId: {
        type: Sequelize.UUID, // ✅ FIXED
        allowNull: false,
        references: {
          model: 'tbl_qr_codes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      ip: {
        type: Sequelize.STRING(64), // ⭐ better limit
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('tbl_qr_views', ['qrId', 'ip'], {
      name: 'idx_qr_views_qr_ip',
    });

    await queryInterface.addIndex('tbl_qr_views', ['createdAt'], {
      name: 'idx_qr_views_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tbl_qr_views');
  },
};
