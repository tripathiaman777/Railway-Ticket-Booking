'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const berths = [];

    // 63 Confirmed Berths (LOWER, MIDDLE, UPPER)
    for (let i = 1; i <= 63; i++) {
      let mod = (i - 1) % 8;
      let type =
        mod < 3 ? 'LOWER' :
        mod < 6 ? 'MIDDLE' : 'UPPER';

      berths.push({
        berth_number: i,
        berth_type: type,
        status: 'AVAILABLE',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // 9 RAC Berths (SIDE_LOWER)
    for (let i = 64; i <= 72; i++) {
      berths.push({
        berth_number: i,
        berth_type: 'SIDE_LOWER',
        status: 'AVAILABLE',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    return queryInterface.bulkInsert('berths', berths);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('berths', null, {});
  }
};
