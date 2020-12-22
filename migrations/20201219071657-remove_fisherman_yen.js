"use strict";

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn("Fishermen", "yen");
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.addColumn("Fishermen", "yen", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });
  },
};
