'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('passengers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      ticket_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER'),
        allowNull: false,
      },
      berth_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'berths',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      berth_position: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('CONFIRMED', 'RAC', 'WAITING_LIST', 'NO_BERTH', 'CANCELLED'),
        allowNull: false,
      },
      waiting_list_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
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

    await queryInterface.addIndex('passengers', ['ticket_id']);
    await queryInterface.addIndex('passengers', ['berth_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('passengers');
  },
};
