'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('test12345', 12);

    const users = [
      {
        username: 'admin',
        password: passwordHash,
        role: 'admin',
      },
      {
        username: 'user1',
        password: passwordHash,
        role: 'user',
      },
      {
        username: 'user2',
        password: passwordHash,
        role: 'user',
      },
      {
        username: 'user3',
        password: passwordHash,
        role: 'user',
      },
    ];
    await queryInterface.bulkInsert(
      'tbl_users',
      users.map((row) => ({
        ...row,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('tbl_users', null, {});
  },
};
