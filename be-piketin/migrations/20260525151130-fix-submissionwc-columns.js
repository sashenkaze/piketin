'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // rename reviewed_b -> reviewed_by
    await queryInterface.renameColumn(
      'SubmissionWcs',
      'reviewed_b',
      'reviewed_by'
    );

    // tambah createdAt
    await queryInterface.addColumn(
      'SubmissionWcs',
      'createdAt',
      {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    );

    // tambah updatedAt
    await queryInterface.addColumn(
      'SubmissionWcs',
      'updatedAt',
      {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'SubmissionWcs',
      'createdAt'
    );

    // hapus updatedAt
    await queryInterface.removeColumn(
      'SubmissionWcs',
      'updatedAt'
    );

    // balikin reviewed_by -> reviewed_b
    await queryInterface.renameColumn(
      'SubmissionWcs',
      'reviewed_by',
      'reviewed_b'
    );
  }
};
