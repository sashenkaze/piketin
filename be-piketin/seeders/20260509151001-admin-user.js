'use strict';
const passwordHash = require('password-hash')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [
      {
        name: 'Administrator',
        nis: null,
        email: 'admin@email.com',
        role: 'administrator',
        jadwal_piket: null,
        password: passwordHash.generate('admin123'),
        rayon_id: null,
        jadwal_piket: null,
        minggu_ke: null,
        hari_wc: null,
        tugas_wc: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
