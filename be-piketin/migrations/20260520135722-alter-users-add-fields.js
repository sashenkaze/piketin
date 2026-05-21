'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'rayon_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'Rayons', key: "id" }
    });
    await queryInterface.addColumn('Users', 'minggu_ke', {
      type: Sequelize.TINYINT,
      allowNull: true,  
    });
    await queryInterface.addColumn('Users', 'hari_wc', {
      type: Sequelize.ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'),
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'tugas_wc', {
      type: Sequelize.ENUM('A', 'B'),
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'rayon_id');
    await queryInterface.removeColumn('Users', 'minggu_ke');
    await queryInterface.removeColumn('Users', 'hari_wc');
    await queryInterface.removeColumn('Users', 'tugas_wc');
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('psrayon', 'murid'),
      allowNull: false,
    })
  }
};
