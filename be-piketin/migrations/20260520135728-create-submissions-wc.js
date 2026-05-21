'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('SubmissionWcs', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT },
      user_id: { allowNull: false, type: Sequelize.BIGINT },
      reviewed_b: { allowNull: true, type: Sequelize.BIGINT },
      tanggal_piket: { allowNull: false, type: Sequelize.DATEONLY },
      tugas: { allowNull: false, type: Sequelize.ENUM('A', 'B') },
      status: { type: Sequelize.ENUM('Pending','Accepted','Declined'), defaultValue: 'Pending' },
      kondisi: { type: Sequelize.ENUM('Bersih dan Rapi','Bersih','Kurang Bersih'), allowNull: true },
      alasan_decline: { type: Sequelize.TEXT, allowNull: true },
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
