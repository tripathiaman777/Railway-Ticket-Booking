'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('berths', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      berth_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      berth_type: {
        type: Sequelize.ENUM('LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('AVAILABLE', 'BOOKED', 'RAC'),
        allowNull: false,
        defaultValue: 'AVAILABLE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('berths');
  },
};
